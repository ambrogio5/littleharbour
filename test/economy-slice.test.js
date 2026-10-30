import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleTown} from '../dist/demo-town.js';
import {order,recipeDuration,parseSave,marketOrder,tick,RECIPES} from '../dist/engine.js';
test('Cala Verde earns more coins per cargo unit; Porto Santo earns more materials',()=>{
 const s=sampleTown(),c=order(s,'local'),p=order(s,'materials'),cargo=o=>Object.values(o.cost).reduce((a,b)=>a+b,0);
 assert(c.coins/cargo(c)>p.coins/cargo(p));assert(p.wood/cargo(p)>c.wood/cargo(c));assert(p.stone/cargo(p)>c.stone/cargo(c));
});
test('Focus gives material differences in delivery returns without changing required supplies',()=>{
 const s=sampleTown(),base=order(s);s.townFocus='trade';assert(order(s).coins>=base.coins*1.34);assert.deepEqual(order(s).cost,base.cost);
 s.townFocus='builders';assert(order(s).wood>=base.wood*1.49);assert(order(s).stone>=base.stone*1.49);
 const local=marketOrder(s,'fishmonger');s.townFocus='community';assert(marketOrder(s,'fishmonger').coins>=local.coins*1.49);
});
test('Completed garden speeds future crops and crafts while retaining existing paid work',()=>{
 const s=sampleTown();s.neighbourhood.access=true;s.fleet.visits.quarry=3;s.inland.shipments=1;s.fleet.boats[0]={type:'cutter',upgrade:null,sails:false,trip:null,repeat:null};s.residents={proposal:'garden',delivered:2};
 const before=recipeDuration(s,'field');s.jobs=[{key:'field',left:12}];s.ripe=false;s.residents.delivered=3;
 assert(Math.abs(recipeDuration(s,'field')-before*.8)<1e-9);assert.equal(parseSave(JSON.stringify(s)).jobs[0].left,12);
 const crop=s.jobs[0];tick(s,1);assert.equal(crop.left,11);
});
test('Orchard preserves use fewer jars per export; vegetable preserves free the shared room sooner',()=>{
 assert.equal(RECIPES.fruitPreserves.output.preserves,6);assert.equal(RECIPES.vegetablePreserves.output.preserves,4);
 assert(RECIPES.fruitPreserves.cost.jars/6<RECIPES.vegetablePreserves.cost.jars/4);
 assert(RECIPES.vegetablePreserves.duration<RECIPES.fruitPreserves.duration);
});
