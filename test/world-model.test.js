import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,build,tick} from '../dist/engine.js';
import {sampleTown} from '../dist/demo-town.js';
import {WORLD_LAYOUT,worldEntities} from '../dist/world-model.js';
import {renderWorldBuildings} from '../dist/world-art.js';
test('Portrait geography and every building share bounded coordinates',()=>{
 assert(WORLD_LAYOUT.size.h>WORLD_LAYOUT.size.w);
 for(const e of worldEntities(sampleTown())){assert(e.x>=0&&e.x<=WORLD_LAYOUT.size.w);assert(e.y>=0&&e.y<=WORLD_LAYOUT.size.h);assert(WORLD_LAYOUT.regions[e.zone]);}
});
test('A fresh town has only its starter food chain; purchased structures physically evolve',()=>{
 const s=fresh(),before=JSON.stringify(s),entities=worldEntities(s);
 assert.deepEqual(entities.filter(e=>e.stage==='built').map(e=>e.id),['field','mill','bakery']);assert.equal(JSON.stringify(s),before);
 s.deliveries=1;s.coins=1000;assert(build(s,'olive'));
 assert.equal(worldEntities(s).find(e=>e.id==='olive').stage,'building');
 assert(renderWorldBuildings(worldEntities(s)).includes('data-world-building="olive" data-stage="building"'));
 tick(s,8);assert.equal(worldEntities(s).find(e=>e.id==='olive').stage,'built');
});
test('Saved neighbourhood locations, furnished homes, civic choice and lighthouse levels drive art',()=>{
 const s=sampleTown();s.neighbourhood.plots[0]={type:'home',level:1};s.fleet.lighthouse.stage=2;s.residents={proposal:'garden',delivered:3};
 let e=worldEntities(s);assert.equal(e.find(e=>e.id==='plot0').level,2);assert.equal(e.find(e=>e.id==='lighthouse').level,2);assert.equal(e.find(e=>e.id==='civic').kind,'garden');
 s.neighbourhood.plots[1]=s.neighbourhood.plots[0];s.neighbourhood.plots[0]=null;e=worldEntities(s);assert.equal(e.find(e=>e.id==='plot0').stage,'unbuilt');assert.equal(e.find(e=>e.id==='plot1').stage,'built');
});
