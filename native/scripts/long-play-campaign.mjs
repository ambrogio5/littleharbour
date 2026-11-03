// Continue earned chapter-five saves. All additional goods and coins are earned.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as E from '../../dist/engine.js';
const bases=JSON.parse(fs.readFileSync(new URL('../LittleHarbourTests/festival-campaigns.json',import.meta.url),'utf8'));
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
 measure('Coastal partners and second boat',()=>{
  if(!state().specialists.includes('boatyard')){act('specialise','maritime');fund(E.PATHS.maritime.cost);act('invest');run(8);}
  if(!state().fleet.boats[1]){fund(E.FLEET_BOATS.cutter.cost);act('buyBoat',1,'cutter');}
  for(const route of ['quarry','island'])for(let stage=0;stage<3;stage++){
   const d=E.COASTAL_PROJECTS[route][stage];
   while(state().fleet.visits[route]<d.visits){const p=E.voyagePlan(state(),0,route,3);fund(p.cost);act('startVoyage',0,route,3);checkpoint();run(p.duration);}
   fund(d.cost);act('fundCoastalProject',route,stage);checkpoint();
  }
 });
 measure('Workshop choices',()=>{
  for(const [station,tier,mode]of [['mill',2,'speed'],['bakery',2,'yield'],['mill',3,index===0?'speed':'yield'],['bakery',3,index===0?'yield':'speed']]){
   const p=E.advancedRefitPlan(state(),station,tier,mode);fund(p.cost);act('installAdvancedRefit',station,tier,mode,p.epoch);checkpoint();
  }
  for(const mode of ['original','yield']){const p=E.advancedRefitPlan(state(),'mill',3,mode);fund(p.cost);act('installAdvancedRefit','mill',3,mode,p.epoch);checkpoint();}
  supply('wheat',4);act('start','mill');act('start','mill');checkpoint();run(E.recipeDuration(state(),'mill')*2);checkpoint();
 });
 measure('Third market and business switch',()=>{
  const type=index===0?'provisioner':'exchange',other=index===0?'exchange':'provisioner';fund(E.THIRD_MARKET_COST);act('buildMarketBusiness',type,2);checkpoint();run(8);
  fund(E.MARKET_BUSINESSES[type].order);act('dispatchMarket',type);checkpoint();
  fund(E.MARKET_SWITCH_COST);act('switchMarketBusiness',other,type,state().marketRevision);checkpoint();fund(E.MARKET_BUSINESSES[other].order);act('dispatchMarket',other);checkpoint();
 });
 measure('Third berth and independent missions',()=>{
  fund(E.THIRD_BERTH_COST);act('buildThirdBerth');checkpoint();const hull=index===0?'cutter':'coaster';fund(E.FLEET_BOATS[hull].cost);act('buyBoat',2,hull);checkpoint();
  const cargo=E.voyagePlan(state(),2,'quarry',3),passengers=E.ferryPlan(state(),1,'island');fund(Object.fromEntries([...new Set([...Object.keys(cargo.cost),...Object.keys(passengers.cost)])].map(k=>[k,(cargo.cost[k]||0)+(passengers.cost[k]||0)])));
  act('startVoyage',2,'quarry',3);act('startFerryService',1,'island');checkpoint();run(Math.max(cargo.duration,passengers.duration));checkpoint();
 });
 fund({coins:1000});checkpoint();
 assert.equal(state().fleet.boats.filter(Boolean).length,3);assert.equal(state().version,14);assert.equal(JSON.parse(B.save()).nativeVersion,3);
 const expected=JSON.parse(B.save());campaigns.push({path:base.path,choice,steps,measurements,expected});
 if(index===0){const ready=new URL('../LittleHarbourTests/long-play-ready.json',import.meta.url);if(process.argv.includes('--check'))assert.equal(fs.readFileSync(ready,'utf8'),B.save());else fs.writeFileSync(ready,B.save());}
 console.log(`${base.path}/${choice}: ${steps.filter(x=>x.action).length} earned actions, ${steps.reduce((n,x)=>n+(x.ticks||0),0)} simulated seconds, ${steps.filter(x=>x.reload).length} reloads; investments and three working boats.`);
}
const target=new URL('../LittleHarbourTests/long-play-campaigns.json',import.meta.url),data=JSON.stringify(campaigns);
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(target,'utf8'),data);else fs.writeFileSync(target,data);
