// Continue earned chapter-five saves. All additional goods and coins are earned.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as E from '../../dist/engine.js';
import * as F from '../festival.js';
const bases=JSON.parse(fs.readFileSync(new URL('../LittleHarbourTests/earned-campaigns.json',import.meta.url),'utf8'));
const bundle=fs.readFileSync(new URL('../LittleHarbour/Resources/engine-bundle.js',import.meta.url),'utf8'),campaigns=[];
for(const [index,choice]of ['food','craft'].entries()){
 const context=vm.createContext({});vm.runInContext(bundle,context);const B=context.Harbour,base=bases[index];B.load(JSON.stringify(base.expectedTown));
 const steps=[],state=()=>JSON.parse(B.browserSave()),snap=()=>JSON.parse(B.snapshot());
 const act=(fn,...args)=>{const id=JSON.stringify([fn,args]);assert(B.act(id),id);steps.push({action:id});};
 const run=seconds=>{for(let i=0;i<Math.ceil(seconds);i++)B.tick(1);steps.push({ticks:Math.ceil(seconds)});};
 const checkpoint=()=>{const save=B.save();B.load(save);assert.equal(B.save(),save);steps.push({reload:true});};
 const supply=(item,count)=>{
  for(let pass=0;(state().stock[item]||0)<count;pass++){
   assert(pass<150,'Supply limit '+item);
   const s=state();
   if(item==='wheat'){if(s.ripe)act('harvestReplant');else run(12);continue;}
   if(item==='wood'||item==='stone'){trade();continue;}
   const key=Object.keys(E.RECIPES).find(k=>E.RECIPES[k].output[item]&&E.unlocked(s,k));assert(key,'Unlocked recipe '+item);
   for(const[input,n]of Object.entries(E.RECIPES[key].cost))supply(input,n);
   act('start',key);run(E.recipeDuration(state(),key));
  }
 };
 const trade=()=>{let s=state();const route=E.orders(s).some(o=>o.id==='materials'&&!o.locked)?'materials':'local';if(s.selectedOrder!==route)act('selectOrder',route);const order=E.order(state());for(const[item,n]of Object.entries(order.cost))supply(item,n);if(state().selectedOrder!==route)act('selectOrder',route);act('dispatch');};
 const fund=cost=>{for(let pass=0;!E.canAfford(state(),cost);pass++){assert(pass<150,'Funding limit');if(state().coins<(cost.coins||0))trade();for(const[item,n]of Object.entries(cost))if(item!=='coins')supply(item,n);}};
 fund(F.PREPARATION);act('festivalPrepare');checkpoint();
 if(choice!=='food')act('festivalChoose',choice);
 fund(F.SUPPLIES[choice]);act('festivalSupply',choice);checkpoint();
 for(const route of ['quarry','island','quarry','island']){
  const plan=E.ferryPlan(state(),0,route);fund(plan.cost);act('startFerryService',0,route);checkpoint();run(plan.duration);checkpoint();
 }
 assert.equal(snap().festival.stage,3);fund(F.FINALE[choice]);
 if(index===0){
  const opening=new URL('../LittleHarbourTests/festival-opening.json',import.meta.url);
  if(process.argv.includes('--check'))assert.equal(fs.readFileSync(opening,'utf8'),B.save());
  else fs.writeFileSync(opening,B.save());
 }
 act('festivalCelebrate',choice);checkpoint();
 for(let n=0;n<2;n++){const offer=F.offers(state(),JSON.parse(B.save()).festival).find(a=>a.args[1]===n);fund(offer.cost);act(offer.fn,...offer.args);checkpoint();}
 assert.equal(snap().festival.stage,4);assert.equal(snap().festival.orders,2);assert.equal(JSON.parse(B.save()).nativeVersion,3);
 const actions=steps.filter(s=>s.action).length,seconds=steps.reduce((n,s)=>n+(s.ticks||0),0);
 campaigns.push({path:base.path,choice,steps,expected:JSON.parse(B.save())});
 console.log(`${base.path}/${choice}: ${actions} additional player actions, ${seconds} simulated seconds, ${steps.filter(s=>s.reload).length} reloads; festival and two requests earned.`);
}
const target=new URL('../LittleHarbourTests/festival-campaigns.json',import.meta.url),data=JSON.stringify(campaigns);
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(target,'utf8'),data);else fs.writeFileSync(target,data);
