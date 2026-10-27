import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,start,reserveFor} from '../dist/engine.js';
import {productionStatus,captureTargets,parseTargetPresets,applyTargetPreset} from '../dist/planning.js';
test('Bottleneck explanation distinguishes reserved ingredients, queued goods, pause and capacity',()=>{
 const s=fresh();s.stock.bread=4;reserveFor(s,'trade:local');
 s.stock.flour=2;assert(start(s,'bakery'));let status=productionStatus(s,'bakery');assert.equal(status.code,'shortage');assert.equal(status.item,'flour');
 s.stock.wheat=2;assert(start(s,'mill'));assert.match(productionStatus(s,'bakery').text,/2 in production/);
 s.speed=0;assert.equal(productionStatus(s,'bakery').code,'paused');s.speed=1;s.stock.flour=2;start(s,'bakery');assert.equal(productionStatus(s,'bakery').code,'queue');
});
test('Restoring a target preset retains paid jobs, stock and pause, and disables absent targets',()=>{
 const s=fresh();s.pier=true;s.stock.flour=8;start(s,'bakery');s.targets={mill:12,bakery:6};const preset=captureTargets(s);s.targets={field:12,bakery:0};s.speed=0;const stock=structuredClone(s.stock),jobs=structuredClone(s.jobs);
 assert(applyTargetPreset(s,preset));assert.equal(s.targets.mill,12);assert.equal(s.targets.bakery,6);assert.equal(s.targets.field,0);assert.equal(s.speed,0);assert.deepEqual(s.stock,stock);assert.deepEqual(s.jobs,jobs);
});
test('Preset parsing rejects invalid targets and never unlocks workshops',()=>{
 assert.deepEqual(parseTargetPresets('[{"bakery":-1},null,{"missing":6}]'),[null,null,null]);assert.deepEqual(parseTargetPresets('bad'),[null,null,null]);const s=fresh();assert.equal(applyTargetPreset(s,{bakery:6}),false);s.pier=true;assert(applyTargetPreset(s,{wine:12,bakery:6}));assert.equal(s.targets.wine,undefined);assert.equal(applyTargetPreset(s,{bakery:3}),false);
});
test('A covered stock target does not ask for unnecessary ingredients',()=>{
 const s=fresh();s.targets.bakery=6;s.stock.bread=6;s.stock.flour=0;
 assert.equal(productionStatus(s,'bakery').code,'target');
 s.stock.bread=4;s.stock.flour=2;start(s,'bakery');
 assert.equal(productionStatus(s,'bakery').code,'target');
});
