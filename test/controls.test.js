import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,maxBatches,queueBatch,harvestReplant,tick,start,cancel,parseSave,incoming} from '../dist/engine.js';

test('Bulk production spends exactly available inputs and preserves cancellation refunds',()=>{
 const s=fresh();s.stock.wheat=5;
 assert.equal(maxBatches(s,'mill'),2);
 assert.equal(queueBatch(s,'mill',99),2);
 assert.equal(s.stock.wheat,1);
 assert.equal(incoming(s,'flour'),4);
 assert.equal(queueBatch(s,'mill',1),0);
 assert(cancel(s,1));assert.equal(s.stock.wheat,3);
 tick(s,8);assert.equal(s.stock.flour,2);assert.equal(incoming(s,'flour'),0);
});
test('Shared queues, locked plots and invalid batch requests cannot bypass limits',()=>{
 const s=fresh();s.pier=true;s.deliveries=2;s.expansion='olive';s.businesses=['olive'];s.workshopUpgrade=true;s.stock.olives=6;
 assert(start(s,'olives'));assert.equal(queueBatch(s,'press',99),3);
 assert.equal(s.jobs.length,4);assert.equal(s.stock.olives,0);
 assert.equal(queueBatch(s,'wine',10),0);assert.equal(queueBatch(s,'unknown',10),0);
 for(const n of [0,-1,1.5,Infinity,NaN,'2'])assert.equal(queueBatch(s,'mill',n),0);
 assert.equal(parseSave(JSON.stringify(s)).jobs.length,4);
});
test('Harvest and replant is atomic to repeated taps and works while paused',()=>{
 const s=fresh();s.speed=0;
 assert(harvestReplant(s));assert.equal(s.stock.wheat,6);assert.equal(s.jobs.length,1);
 assert.equal(harvestReplant(s),false);assert.equal(s.stock.wheat,6);
 tick(s,30);assert.equal(s.jobs[0].left,12);
 s.speed=1;tick(s,12);assert(s.ripe);assert(harvestReplant(s));assert.equal(s.stock.wheat,12);
 const saved=parseSave(JSON.stringify(s));assert.equal(saved.jobs[0].key,'field');assert.equal(saved.ripe,false);
});
test('Bulk production advances the real opening delivery chain without free goods',()=>{
 const s=fresh();assert(harvestReplant(s));assert.equal(queueBatch(s,'mill',4),2);
 tick(s,16);assert.equal(s.stock.flour,4);
 assert.equal(queueBatch(s,'bakery',4),2);tick(s,24);
 assert.equal(s.stock.bread,4);assert.equal(s.stock.flour,0);assert.equal(s.stock.wheat,2);
});
