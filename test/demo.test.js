import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleTown} from '../dist/demo-town.js';
import {parseSave,unlocked,inlandReady} from '../dist/engine.js';

test('Sample town is a valid established save with both inland crop chains available',()=>{
 const s=sampleTown();assert.equal(s.version,12);assert.deepEqual(parseSave(JSON.stringify(s)),s);
 assert(inlandReady(s));for(const key of ['orchard0','garden1','clay','jars','tiles','fruitPreserves','vegetablePreserves'])assert(unlocked(s,key),key);
 assert.equal(s.inland.courtyard,false);assert.equal(s.inland.shipments,0);assert.equal(s.jobs.length,0);
 assert.equal(s.market.businesses.fishmonger.deliveries,3);assert.equal(s.market.businesses.kitchen.deliveries,3);
});
test('Each sample town owns independent mutable state',()=>{
 const a=sampleTown(),b=sampleTown();a.stock.fruit=0;a.inland.terraces[0].left=5;a.market.businesses.fishmonger.auto=true;a.log.push('changed');
 assert.equal(b.stock.fruit,24);assert.equal(b.inland.terraces[0].left,0);assert.equal(b.market.businesses.fishmonger.auto,false);assert.equal(b.log.length,1);
});
