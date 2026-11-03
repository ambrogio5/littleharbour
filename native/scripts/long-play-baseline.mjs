// Read-only, reproducible economy probe. Never reads or writes an app save.
// Uses committed earned festival traces and the shipped bundle in isolated VMs.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const bundle=fs.readFileSync(new URL('../LittleHarbour/Resources/engine-bundle.js',import.meta.url),'utf8');
const traces=fs.readFileSync(new URL('../LittleHarbourTests/festival-campaigns.json',import.meta.url),'utf8');
const campaigns=JSON.parse(traces);
const open=save=>{const context=vm.createContext({});vm.runInContext(bundle,context);context.Harbour.load(save);return context.Harbour;};
const town=B=>JSON.parse(B.browserSave());
const checkpoint=B=>{const save=B.save();B.load(save);assert.equal(B.save(),save);};
const act=(B,fn,...args)=>assert(B.act(JSON.stringify([fn,args])),JSON.stringify([fn,args]));
const targets=B=>{
 const actions=JSON.parse(B.snapshot()).actions.filter(a=>a.fn==='setTarget'&&a.args[1]===24&&a.enabled);
 for(const a of actions)assert(B.act(a.id));
 return actions.length;
};
const advance=(B,seconds)=>{for(let n=1;n<=seconds;n++){B.tick(1);if(n%300===0)checkpoint(B);}};
const stockDelta=(a,b)=>Object.fromEntries(Object.keys(b.stock).map(k=>[k,b.stock[k]-a.stock[k]]));

const modest=open(JSON.stringify(campaigns.find(c=>c.choice==='food').expected));
modest.speed(1);
const modestSetup=targets(modest)+1;
act(modest,'setRepeatVoyage',0,'island',3);

const wealthy=open(JSON.stringify(campaigns.find(c=>c.choice==='craft').expected));
wealthy.speed(1);
let wealthySetup=targets(wealthy)+1,preparationSeconds=0,materialsOrders=0;
act(wealthy,'setRepeatVoyage',0,'quarry',3);
if(town(wealthy).selectedOrder!=='materials'){act(wealthy,'selectOrder','materials');wealthySetup++;}
// Seed the competing wood chains through paid trade, not injected inventory.
while(materialsOrders<16||!JSON.parse(wealthy.snapshot()).actions.some(a=>a.fn==='buyBoat'&&a.args[0]===1&&a.args[1]==='cutter'&&a.enabled)){
 assert(preparationSeconds<3600,'Could not earn the second boat');
 if(JSON.parse(wealthy.snapshot()).actions.some(a=>a.fn==='dispatch'&&a.enabled)){
  act(wealthy,'dispatch');wealthySetup++;materialsOrders++;
 }
 wealthy.tick(1);preparationSeconds++;
}
act(wealthy,'buyBoat',1,'cutter');
act(wealthy,'setRepeatVoyage',0,'island',3);
act(wealthy,'setRepeatVoyage',1,'quarry',3);
wealthySetup+=3;
advance(wealthy,3600);preparationSeconds+=3600;checkpoint(wealthy);
assert(town(wealthy).coins>10000,'Wealthy baseline must earn at least 10,000 coins');

const windows=[];
for(const [name,source,setupActions]of [['modest',modest,modestSetup],['wealthy',wealthy,wealthySetup]]){
 for(const speed of [1,3]){
  const B=open(source.save());B.speed(speed);const before=town(B);
  const elapsedSeconds=1200/speed;
  advance(B,elapsedSeconds);checkpoint(B);const after=town(B);
  assert(Math.abs(after.seconds-before.seconds-1200)<0.001);
  windows.push({name,speed,setupActions,elapsedSeconds,simulatedSeconds:1200,
   actionsDuringWindow:0,unattendedSeconds:elapsedSeconds,
   coinsBefore:before.coins,coinsAfter:after.coins,coinDelta:after.coins-before.coins,
   arrivals:Object.fromEntries(['quarry','island'].map(r=>[r,after.fleet.visits[r]-before.fleet.visits[r]])),
   stockDelta:stockDelta(before,after),reloads:Math.floor(elapsedSeconds/300)+1});
 }
}
const result={
 description:'Current economy only; scripted unattended windows, not human decisions, seasons or enjoyment. No proposed balance changes applied.',
 bundleSHA256:createHash('sha256').update(bundle).digest('hex'),
 tracesSHA256:createHash('sha256').update(traces).digest('hex'),
 preparation:{modest:'Earned maritime/food festival end; Keep 24 on enabled recipes, one cutter repeating island tier 3.',
  wealthy:'Earned estate/craft festival end; Keep 24, materials orders bootstrap timber and second boat; coaster repeats island tier 3, cutter quarry tier 3.',
  wealthyPreparationSeconds:preparationSeconds,wealthySetupActions:wealthySetup,materialsOrders},windows};
const output=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--check')){
 assert.equal(fs.readFileSync(new URL('../docs/long-play-baseline.json',import.meta.url),'utf8'),output);
 console.log('Long-play baseline matches: four earned, unattended windows with reload checkpoints.');
}else process.stdout.write(output);
