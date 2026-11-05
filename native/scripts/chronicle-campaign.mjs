// Continue earned chapter-five saves. All additional goods and coins are earned.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as E from '../../dist/engine.js';
import * as C from '../chronicle.js';
const bases=JSON.parse(fs.readFileSync(new URL('../LittleHarbourTests/long-play-campaigns.json',import.meta.url),'utf8'));
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
 act('chronicleBegin');checkpoint();
 measure('Seasonal supplies and a deliberate choice',()=>{
  for(const kind of [0,2]){const o=snap().chronicle.offers.find(o=>o.kind===kind);act('chronicleAccept',o.id);if(kind===2)act('chronicleChoose',o.id,index);const action=snap().actions.find(a=>a.fn==='chronicleDeliver'&&a.args[0]===o.id);fund(action.cost);act('chronicleDeliver',o.id);checkpoint();}
 });
 measure('Two independent passenger crews',()=>{
  const o=snap().chronicle.offers.find(o=>o.kind===1);act('chronicleAccept',o.id);
  for(const[slot,route]of [[0,'quarry'],[1,'island']]){const p=E.ferryPlan(state(),slot,route);fund(p.cost);act('startFerryService',slot,route);checkpoint();run(p.duration);}
  act('chronicleDeliver',o.id);
 });
 fund({bread:6*C.households(state())});act('chronicleHouseholds',0);checkpoint();
 for(const d of C.PROJECTS)measure(d.title,()=>{
  act('chronicleProject',d.id,index);checkpoint();
  for(const stage of [0,1]){const a=snap().actions.find(a=>a.fn==='chronicleBuild'&&a.args[0]===d.id);fund(a.cost);act('chronicleBuild',d.id,stage);checkpoint();}
  for(const[slot,route]of [[0,'quarry'],[1,'island']]){const p=E.voyagePlan(state(),slot,route,1);fund(p.cost);act('startVoyage',slot,route,1);checkpoint();run(p.duration);}
  act('chronicleBuild',d.id,2);checkpoint();const a=snap().actions.find(a=>a.fn==='chronicleBuild'&&a.args[0]===d.id);fund(a.cost);act('chronicleBuild',d.id,3);checkpoint();
 });
 const expected=JSON.parse(B.save());assert.equal(Object.values(expected.chronicle.projects).filter(p=>p.stage===4).length,8);
 campaigns.push({path:base.path,choice,steps,measurements,expected});
 console.log(`${base.path}/${choice}: ${steps.filter(x=>x.action).length} earned actions, ${steps.reduce((n,x)=>n+(x.ticks||0),0)} simulated seconds, ${steps.filter(x=>x.reload).length} reloads; eight lasting projects.`);
}
const target=new URL('../LittleHarbourTests/chronicle-campaigns.json',import.meta.url),data=JSON.stringify(campaigns);
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(target,'utf8'),data);else fs.writeFileSync(target,data);
