import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../dist/engine.js';
import {sampleTown} from '../dist/demo-town.js';
import {projectPlan,queueProject} from '../dist/project-planning.js';
function town(){const s=sampleTown();s.inland.shipments=1;s.coins=10000;engine.buyBoat(s,0,'cutter');s.fleet.visits={quarry:8,island:8};s.neighbourhood.access=true;s.neighbourhood.plots=[{type:'home',level:0},{type:'carpenter',level:0},{type:'flaxgarden',level:0},{type:'weaver',level:0},{type:'sailmaker',level:0},null];for(const k of Object.keys(s.stock))s.stock[k]=0;return s;}

test('Project planning is pure and expands a home into shared upstream work',()=>{
 const s=town();s.stock.wood=12;const saved=JSON.stringify(s),p=projectPlan(s,'neighbourhood:home:0');assert.equal(JSON.stringify(s),saved);assert(p.valid);assert(!p.ready);
 const work=Object.fromEntries(p.recipes.map(r=>[r.key,r.batches]));assert.deepEqual(work,{furniture:3,flax:2,cloth:2});assert.equal(p.bottlenecks[0].station,'carpenter');assert.equal(p.bottlenecks[0].seconds,72);
 const result=queueProject(s,p.goal);assert.equal(result.queued,5);assert.equal(s.stock.wood,0);assert.equal(s.jobs.filter(j=>j.key==='cloth').length,0);assert.deepEqual(s.targets,{});assert.deepEqual(s.reservations,{});
 const repeated=queueProject(s,p.goal);assert.equal(repeated.queued,0);assert.equal(s.jobs.length,5);
 engine.tick(s,48);const next=queueProject(s,p.goal);assert.equal(next.batches.find(b=>b.key==='cloth')?.count,2);
});

test('Final unreserved construction timber cannot be consumed by upstream kiln work',()=>{
 const s=town();Object.assign(s.stock,{wood:20,stone:16,clay:8});const goal='coastal:quarry:0',p=projectPlan(s,goal);assert.equal(p.recipes.find(r=>r.key==='tiles').batches,2);assert.equal(p.queueable,0);assert(p.blockers.some(b=>b.item==='wood'&&b.missing===4));
 const result=queueProject(s,goal);assert.equal(result.queued,0);assert.equal(s.stock.wood,20);assert.equal(s.stock.clay,8);assert.deepEqual(s.reservations,{});
 s.stock.wood+=4;assert.equal(queueProject(s,goal).queued,2);assert.equal(s.stock.wood,20);
});

test('Own and other reservations remain protected while scheduling a project',()=>{
 const s=town();Object.assign(s.stock,{wood:20,stone:16,clay:8});assert(engine.reserveFor(s,'coastal:quarry:0'));const reserved=structuredClone(s.reservations);assert.equal(queueProject(s,'coastal:quarry:0').queued,0);assert.deepEqual(s.reservations,reserved);
 s.stock.wood+=12;assert(engine.reserveFor(s,'neighbourhood:build:5:home')===false); // Plot not owned: no implicit new hold.
 const home=queueProject(s,'neighbourhood:home:0');assert.equal(home.batches.find(b=>b.key==='furniture')?.count,3);assert.equal(s.stock.wood,20);assert.deepEqual(s.reservations,reserved);
});

test('Incoming jars cannot satisfy both the shipment and its preserve ingredients',()=>{
 const s=town();Object.assign(s.stock,{bread:4,fruit:4,clay:4,wood:4});assert(engine.start(s,'jars'));const goal='fleet:0:quarry:1',p=projectPlan(s,goal);
 assert.equal(p.requirements.find(r=>r.item==='jars').incoming,2);assert.equal(p.recipes.find(r=>r.key==='jars').batches,1);assert.equal(p.recipes.find(r=>r.key==='fruitPreserves').batches,1);
 assert.equal(queueProject(s,goal).batches.find(b=>b.key==='jars')?.count,1);assert.equal(s.jobs.filter(j=>j.key==='jars').length,2);assert.equal(queueProject(s,goal).queued,0);assert.equal(s.jobs.filter(j=>j.key==='jars').length,2);
});

test('Locked chains, ripe wheat and full queues produce honest blockers without extra jobs',()=>{
 const s=town();s.neighbourhood.plots[3]=null;let p=projectPlan(s,'neighbourhood:home:0');assert(p.blockers.some(b=>b.item==='cloth'&&b.kind==='locked'));
 Object.assign(s.stock,{preserves:4,jars:2});p=projectPlan(s,'fleet:0:quarry:1');assert(p.blockers.some(b=>b.kind==='harvest'));assert(!p.recipes.some(r=>r.key==='field'));assert.equal(s.ripe,true);
 s.ripe=false;assert(engine.start(s,'field'));const count=s.jobs.length;queueProject(s,'fleet:0:quarry:1');assert.equal(s.jobs.length,count);
 const invalid=queueProject(s,'no-such-project');assert.equal(invalid.queued,0);assert(!invalid.plan.valid);
});
