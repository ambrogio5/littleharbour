import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,parseSave,fundWaterfront,supplyWaterfront,waterfrontSupplies,specialise,order,dispatch} from '../dist/engine.js';
function charter(){const s=fresh();Object.assign(s,{coins:1000,deliveries:2,pier:true,expansion:'olive',businesses:['olive'],specialisation:'estate',specialists:['estate'],charter:true,contractsDone:['restaurants','merchants']});s.stock.wood=100;s.stock.stone=100;return s;}
test('Funding is atomic; partial supplies survive changing direction and ordinary trade',()=>{
 const s=charter();s.coins=199;const unchanged=JSON.stringify(s);assert(!fundWaterfront(s,0));assert.equal(JSON.stringify(s),unchanged);
 s.coins=200;assert(fundWaterfront(s,0));assert.equal(s.coins,0);assert(!supplyWaterfront(s,0,0));
 s.stock.bread=4;s.stock.oil=2;assert(supplyWaterfront(s,0,0));assert(specialise(s,'maritime'));
 assert.deepEqual(waterfrontSupplies(s),{bread:4,oil:2});assert.equal(s.waterfront.path,'estate');
 const o=order(s);Object.assign(s.stock,o.cost);assert(dispatch(s));assert.equal(s.waterfront.delivered,1);
 assert.deepEqual(parseSave(JSON.stringify(s)),s);
});
test('Save validation rejects impossible phases and premature bulk route access',()=>{
 const s=charter();assert(fundWaterfront(s,0));
 const mutations=[x=>delete x.waterfront,x=>x.waterfront.path=null,x=>x.waterfront.path='other',x=>x.waterfront.stage=1.5,x=>x.waterfront.stage=4,x=>x.waterfront.funded=false,x=>x.waterfront.delivered=2,x=>x.waterfront.left=4,x=>x.waterfront.left=-1,x=>x.waterfront.delivered=3,x=>x.waterfront.stage=3,x=>x.charter=false,x=>x.specialists=[],x=>x.construction=[{type:'charter',left:3}],x=>x.selectedOrder='waterfront'];
 for(const mutate of mutations){const bad=structuredClone(s);mutate(bad);assert.throws(()=>parseSave(JSON.stringify(bad)));}
});
test('Version 5 migration preserves refits and active work without charging restoration',()=>{
 const s=charter();s.version=5;delete s.waterfront;s.refits={mill:'speed'};s.jobs=[{key:'mill',left:3}];
 const loaded=parseSave(JSON.stringify(s));assert.equal(loaded.version,12);assert.deepEqual(loaded.waterfront,{path:null,stage:0,funded:false,delivered:0,left:0});assert.equal(loaded.coins,s.coins);assert.deepEqual(loaded.stock,s.stock);assert.deepEqual(loaded.refits,s.refits);assert.deepEqual(loaded.jobs,s.jobs);
});
