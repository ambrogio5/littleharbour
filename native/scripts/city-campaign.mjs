// Continue earned chapter-five saves. All additional goods and coins are earned.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as E from '../../dist/engine.js';
import * as C from '../chronicle.js';
import * as Y from '../city-port.js';
const bases=JSON.parse(fs.readFileSync(new URL('../LittleHarbourTests/chronicle-campaigns.json',import.meta.url),'utf8'));
const bundle=fs.readFileSync(new URL('../LittleHarbour/Resources/engine-bundle.js',import.meta.url),'utf8'),campaigns=[];
for(const [index,choice]of ['food','craft'].entries()){
 const context=vm.createContext({});vm.runInContext(bundle,context);const B=context.Harbour,base=bases[index];B.load(JSON.stringify(base.expected));
 const steps=[],state=()=>JSON.parse(B.browserSave()),snap=()=>JSON.parse(B.snapshot());
 const act=(fn,...args)=>{const id=JSON.stringify([fn,args]);assert(B.act(id),id);steps.push({action:id});};
 const run=seconds=>{for(let i=0;i<Math.ceil(seconds);i++)B.tick(1);steps.push({ticks:Math.ceil(seconds)});};
 const checkpoint=()=>{const save=B.save();B.load(save);assert.equal(B.save(),save);steps.push({reload:true});};
 const supply=(item,count)=>{
  for(let pass=0;(state().stock[item]||0)<count;pass++){
   assert(pass<500,'Supply limit '+item);
   const s=state();
   if(item==='wheat'){if(s.ripe)act('harvestReplant');else run(12);continue;}
   if(item==='wood'||item==='stone'){trade();continue;}
   const key=Object.keys(E.RECIPES).find(k=>E.RECIPES[k].output[item]&&E.unlocked(s,k));assert(key,'Unlocked recipe '+item);
   for(const[input,n]of Object.entries(E.RECIPES[key].cost))supply(input,n);
   act('start',key);run(E.recipeDuration(state(),key));
  }
 };
 const trade=()=>{let s=state();const route=E.orders(s).some(o=>o.id==='materials'&&!o.locked)?'materials':'local';if(s.selectedOrder!==route)act('selectOrder',route);const order=E.order(state());for(const[item,n]of Object.entries(order.cost))supply(item,n);if(state().selectedOrder!==route)act('selectOrder',route);act('dispatch');};
 const fund=cost=>{for(let pass=0;!E.canAfford(state(),cost);pass++){assert(pass<500,'Funding limit');if(state().coins<(cost.coins||0))trade();for(const[item,n]of Object.entries(cost))if(item!=='coins')supply(item,n);}};

 const measure=(name,work)=>{const before=state(),offset=steps.length;work();checkpoint();const after=state();measurements.push({name,actions:steps.slice(offset).filter(x=>x.action).length,simulatedSeconds:after.seconds-before.seconds,coinDelta:after.coins-before.coins,materials:Object.fromEntries(Object.keys(after.stock).map(k=>[k,after.stock[k]-before.stock[k]]))});};
 const measurements=[];
 const city=()=>JSON.parse(B.save()).chronicle.city;
 measure('Equip a city coaster',()=>{
  if(!state().specialists.includes('estate')){act('specialise','estate');fund(E.PATHS.estate.cost);act('invest');run(8);checkpoint();}
  if(state().fleet.boats[0].type==='cutter'){fund(E.FLEET_BOATS.coaster.cost);act('chronicleCityRefit',0,city().serial);}
  if(state().fleet.boats[0].upgrade!=='cargo'){fund(E.FLEET_UPGRADES.cargo.cost);act('installBoatUpgrade',0,'cargo');}
 });
 if(index===0){const target=new URL('../LittleHarbourTests/city-ready.json',import.meta.url);if(process.argv.includes('--check'))assert.equal(fs.readFileSync(target,'utf8'),B.save());else fs.writeFileSync(target,B.save());}
 for(let stage=0;stage<3;stage++)measure('City collection '+(stage+1),()=>{
  while(city().ceramics<[6,12,18][stage]){
   if(city().glaze<2){fund(Y.CARGO);act('chronicleCitySail',0,city().serial);checkpoint();run(240);checkpoint();}
   fund({jars:2});act('chronicleCityCraft',city().serial);checkpoint();run(30);
  }
  act('chronicleCityDeliver',stage);checkpoint();
  if(stage<2){act('chronicleCityChoose',stage,index);fund(Y.CARGO);act('chronicleCityExplore',0,stage,city().serial);checkpoint();run(240);checkpoint();}
 });
 const expected=JSON.parse(B.save());assert.equal(expected.chronicle.city.chapter,3);assert.equal(expected.chronicle.city.explored.length,2);
 campaigns.push({path:base.path,choice,steps,measurements,expected});
 console.log(`${base.path}/${choice}: ${steps.filter(x=>x.action).length} earned actions, ${steps.reduce((n,x)=>n+(x.ticks||0),0)} simulated seconds, ${steps.filter(x=>x.reload).length} reloads; city collections and both expeditions.`);
}
const target=new URL('../LittleHarbourTests/city-campaigns.json',import.meta.url),data=JSON.stringify(campaigns);
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(target,'utf8'),data);else fs.writeFileSync(target,data);
