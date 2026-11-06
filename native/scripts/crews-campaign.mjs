// Earned city saves, three allocations, identical work. No stock/coin injection.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as E from '../../dist/engine.js';
import * as Y from '../city-port.js';
const bases=JSON.parse(fs.readFileSync(new URL('../LittleHarbourTests/city-campaigns.json',import.meta.url)));
const bundle=fs.readFileSync(new URL('../LittleHarbour/Resources/engine-bundle.js',import.meta.url),'utf8'),campaigns=[];
for(const [index,base]of bases.entries())for(const allocation of ['none','workshops','fleet']){
 const context=vm.createContext({});vm.runInContext(bundle,context);const B=context.Harbour;B.load(JSON.stringify(base.expected));
 const steps=[],state=()=>JSON.parse(B.save()),town=()=>state().town;
 const act=(fn,...args)=>{const action=JSON.stringify([fn,args]);assert(B.act(action),action);steps.push({action});};
 const run=n=>{for(let i=0;i<n;i++)B.tick(1);steps.push({ticks:n});};
 const checkpoint=()=>{const b=B.save();B.load(b);assert.equal(B.save(),b);steps.push({reload:true});};
 const until=done=>{for(let n=0;!done();n++){assert(n<3000,'wait bounded');run(1);if(n%17===0)checkpoint();}};
 const fund=cost=>{for(const[item,n]of Object.entries(cost))supply(item,n);};
 const supply=(item,n)=>{for(let tries=0;(town().stock[item]||0)<n;tries++){assert(tries<200,'supply '+item);if(item==='wheat'){if(town().ripe)act('harvestReplant');else run(1);continue;}const key=Object.keys(E.RECIPES).find(k=>E.RECIPES[k].output[item]&&E.unlocked(town(),k));assert(key,'unlocked '+item);produce(key);}};
 const produce=key=>{fund(E.RECIPES[key].cost);act('start',key);until(()=>!town().jobs.some(j=>E.RECIPES[j.key].station===E.RECIPES[key].station));};
 B.speed(1);steps.push({speed:1});
 const keys=Object.keys(E.RECIPES).filter(k=>E.unlocked(town(),k));assert(B.setTargets(keys,0));steps.push({targets:keys,target:0});
 for(let slot=0;slot<3;slot++)if(town().fleet.boats[slot]?.repeat)act('setRepeatVoyage',slot,null);
 for(const[id,b]of Object.entries(town().market.businesses))if(b.auto)act('setMarketAuto',id,false);
 until(()=>town().jobs.length===0&&town().fleet.boats.every(b=>!b?.trip)&&state().chronicle.city.voyages.every(v=>!v)&&!state().chronicle.city.job);
 const assign=(team,target)=>{const args=[team,target,state().chronicle.crews?.epoch||0];assert(B.assignCrew(...args));steps.push({crew:args});checkpoint();};
 if(allocation==='workshops'){assign(0,'station:kiln');assign(1,'station:estate');}
 if(allocation==='fleet'){assign(0,'boat:0');assign(1,'bench');}
 if(index===0&&allocation==='none'){
  const f=new URL('../LittleHarbourTests/crews-ready.json',import.meta.url);
  if(process.argv.includes('--check'))assert.equal(fs.readFileSync(f,'utf8'),B.save());else fs.writeFileSync(f,B.save());
 }
 const measurements=[];
 const measure=(name,fn)=>{const before=town(),offset=steps.length;fn();checkpoint();const after=town();measurements.push({name,simulatedSeconds:after.seconds-before.seconds,decisions:steps.slice(offset).filter(x=>x.action||x.crew).length,coinDelta:after.coins-before.coins,stockDelta:Object.fromEntries(Object.keys(after.stock).filter(k=>after.stock[k]!==before.stock[k]).map(k=>[k,after.stock[k]-before.stock[k]]))});};
 measure('Prepare workshop stock',()=>{for(let i=0;i<6;i++){produce('jars');produce('wine');}});
 measure('City import and six ceramics',()=>{fund(Y.CARGO);act('chronicleCitySail',0,state().chronicle.city.serial);checkpoint();until(()=>!state().chronicle.city.voyages[0]);for(let i=0;i<3;i++){fund({jars:2});act('chronicleCityCraft',state().chronicle.city.serial);checkpoint();until(()=>!state().chronicle.city.job);}});
 const expected=state();campaigns.push({path:base.path,baseIndex:index,allocation,steps,measurements,expected});
 console.log(base.path+' / '+allocation+': '+measurements.map(m=>m.name+' '+m.simulatedSeconds+'s').join('; '));
}
for(let i=0;i<2;i++){const group=campaigns.filter(c=>c.baseIndex===i),base=group[0].expected;for(const c of group){assert.equal(c.expected.town.coins,base.town.coins);assert.deepEqual(c.expected.town.stock,base.town.stock);assert.equal(c.expected.chronicle.city.glaze,base.chronicle.city.glaze);assert.equal(c.expected.chronicle.city.ceramics,base.chronicle.city.ceramics);}}
const file=new URL('../LittleHarbourTests/crews-campaigns.json',import.meta.url),bytes=JSON.stringify(campaigns);
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),bytes);else fs.writeFileSync(file,bytes);
