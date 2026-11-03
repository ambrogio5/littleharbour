import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as E from '../dist/engine.js';
import {projectPlan,queueProject} from '../dist/project-planning.js';
import {worldEntities} from '../dist/world-model.js';
import {fleetPanelView} from '../dist/fleet-ui.js';

const fixture=fs.readFileSync(new URL('../native/LittleHarbourTests/late-town.json',import.meta.url),'utf8');
function town(){
 const s=E.parseSave(fixture);s.coins=100000;s.fleet.visits={quarry:10,island:10};for(const k of Object.keys(s.stock))s.stock[k]=1000;
 for(const route of ['quarry','island'])for(let stage=0;stage<3;stage++)assert(E.fundCoastalProject(s,route,stage));
 assert(E.buildCourtyard(s));E.tick(s,30);return s;
}
const reload=s=>E.parseSave(JSON.stringify(s));
const install=(s,st,tier,mode)=>E.installAdvancedRefit(s,st,tier,mode,s.advancedRefits[st]?.epoch||0);
test('Approved route rewards and scoped coin caps preserve cargo scaling',()=>{
 const s=town();assert.deepEqual(E.FLEET_ROUTES.island.tiers.map(t=>t.reward.coins),[240,300,600]);
 assert.deepEqual(E.FLEET_ROUTES.quarry.tiers[2].reward,{coins:240,wood:56,stone:72});
 assert.deepEqual(E.COASTAL_COMMISSIONS.island.map(c=>c.reward.coins),[480,420,540]);
 s.townFocus='trade';assert.equal(E.order(s,'materials').coins,90);
 s.townFocus='community';s.residents={proposal:'square',delivered:3};
 assert.equal(E.marketOrder(s,'fishmonger').coins,90);assert.equal(E.marketOrder(s,'kitchen').coins,135);
 assert.equal(E.neighbourhoodOrder(s).reward.coins,Math.round(E.NEIGHBOURHOOD_ORDERS[0].reward.coins*1.5));
 s.fleet.boats[1].upgrade='cargo';const p=E.voyagePlan(s,1,'island',3);assert.equal(p.reward.coins,2070);assert.equal(p.cost.preserves,24);
 const before=s.coins;assert(E.startVoyage(s,1,'island',3));while(s.fleet.boats[1].trip)E.tick(s,60);assert.equal(s.coins-before,2070);
});
test('Every workshop offers both approved tiers, paid retuning, original restoration and stale rejection',()=>{
 for(const station of Object.keys(E.ADVANCED_STATIONS)){
  let s=town();const key=Object.keys(E.RECIPES).find(k=>E.RECIPES[k].station===station&&E.unlocked(s,k));assert(key,station);
  const base=E.recipeDuration(s,key),coins=s.coins;
  assert(install(s,station,2,'speed'));assert.equal(s.coins,coins-600);assert.equal(E.recipeDuration(s,key),Math.round(base*.85*1000)/1000);
  const saved=JSON.stringify(s);assert(!E.installAdvancedRefit(s,station,2,'yield',0));assert.equal(JSON.stringify(s),saved);
  assert(install(s,station,2,'yield'));assert.equal(s.coins,coins-750);assert.equal(E.recipeDuration(s,key),base);
  s=reload(s);assert(install(s,station,3,'speed'));assert.equal(s.coins,coins-2150);assert.equal(E.recipeDuration(s,key),Math.round(base*.7*1000)/1000);
  assert(install(s,station,3,'yield'));assert.equal(s.coins,coins-2500);
  assert(install(s,station,3,'original'));assert.equal(E.recipeDuration(s,key),base);assert.equal(s.coins,coins-2500);
  assert(!install(s,station,2,'speed'));assert(install(s,station,3,'yield'));assert.equal(s.coins,coins-2850);assert.deepEqual(reload(s),s);
 }
});
test('Refits respect unlocks, idle work, money, ingredients and other reservations',()=>{
 const s=town();assert(!E.installAdvancedRefit(E.fresh(),'mill',2,'speed',0));assert(!install(s,'field',2,'yield'));assert(!install(s,'mill',3,'speed'));
 const p=E.advancedRefitPlan(s,'mill',2,'speed');assert(E.reserveFor(s,p.goal));
 assert(E.start(s,'mill'));const before=JSON.stringify(s);assert(!install(s,'mill',2,'speed'));assert.equal(JSON.stringify(s),before);assert(E.goalCost(s,p.goal));
 E.tick(s,8);assert(install(s,'mill',2,'speed'));assert(!s.reservations[p.goal]);
 s.coins=0;assert(!install(s,'mill',2,'yield'));s.coins=1000;s.stock.tiles=0;assert(!install(s,'bakery',2,'speed'));
 for(const args of [['__proto__',2,'speed'],['mill',4,'speed'],['mill',2,'both']])assert(!install(s,...args));
});
test('Yield credits survive cancellation, reordering, reload and profile changes without free goods',()=>{
 let s=town();assert(install(s,'mill',2,'yield'));const flour=s.stock.flour,wheat=s.stock.wheat;
 assert(E.start(s,'mill'));assert(E.start(s,'mill'));assert.equal(E.incoming(s,'flour'),5);
 assert.deepEqual(E.queuedOutputs(s),[{flour:2},{flour:3}]);assert.equal(s.yieldCredits.mill,undefined);
 assert(E.cancel(s,1));assert.equal(E.incoming(s,'flour'),2);assert.equal(s.stock.wheat,wheat-2);s=reload(s);
 E.tick(s,8);assert.equal(s.stock.flour,flour+2);assert.equal(s.yieldCredits.mill,2);
 assert(install(s,'mill',2,'original'));assert(install(s,'mill',2,'yield'));assert(E.start(s,'mill'));s=reload(s);E.tick(s,8);
 assert.equal(s.stock.flour,flour+5);assert.equal(s.yieldCredits.mill,undefined);assert.deepEqual(reload(s),s);
 assert(install(s,'mill',3,'yield'));assert(E.start(s,'mill'));assert(E.start(s,'mill'));assert(E.start(s,'mill'));assert(E.prioritize(s,2));assert(E.cancel(s,1));E.tick(s,16);assert.equal(s.stock.flour,flour+11);
});
test('Yield-aware automation and planner count promised outputs, consume real inputs and stay pure',()=>{
 const s=town();assert(install(s,'bakery',2,'yield'));s.stock.bread=0;s.stock.flour=20;
 assert(E.start(s,'bakery'));assert(E.start(s,'bakery'));assert(E.setTarget(s,'bakery',6));
 const goal='trade:materials';const before=JSON.stringify(s),plan=projectPlan(s,goal);assert.equal(JSON.stringify(s),before);
 assert.equal(plan.requirements.find(r=>r.item==='bread').incoming,2);
 E.tick(s,24);assert.equal(s.stock.bread,5);assert.equal(s.jobs.filter(j=>j.key==='bakery').length,1);E.tick(s,12);assert.equal(s.stock.bread,7);assert.equal(s.jobs.length,0);
 const cost=E.advancedRefitPlan(s,'boatyard',2,'yield');s.stock.planks=0;assert(E.reserveFor(s,cost.goal));assert(queueProject(s,cost.goal).queued>0);assert.doesNotThrow(()=>reload(s));
});
test('Third market choices preserve demand, require release of reservations and reject stale switching',()=>{
 let s=town();const before=s.coins;assert(E.buildMarketBusiness(s,'provisioner',2));assert.equal(s.coins,before-1000);assert(!E.buildMarketBusiness(s,'exchange',2));
 assert(!E.switchMarketBusiness(s,'exchange','provisioner',0));E.tick(s,8);s.townFocus='community';
 assert.equal(E.marketOrder(s,'provisioner').coins,315);assert(E.dispatchMarket(s,'provisioner'));E.tick(s,17);
 assert(E.reserveFor(s,'market:provisioner'));assert(!E.switchMarketBusiness(s,'exchange','provisioner',0));assert(E.releaseReservation(s,'market:provisioner'));
 const demand=s.market.businesses.provisioner.demand,clock=s.market.businesses.provisioner.replenish;
 assert(E.switchMarketBusiness(s,'exchange','provisioner',0));assert.equal(s.market.businesses.exchange.demand,demand);assert.equal(s.market.businesses.exchange.replenish,clock);
 const coins=s.coins,parts=s.stock.boatparts,sails=s.stock.sails;assert(E.dispatchMarket(s,'exchange'));assert.equal(s.coins,coins);assert.equal(s.stock.boatparts,parts+2);assert.equal(s.stock.sails,sails+1);
 s=reload(s);assert(E.switchMarketBusiness(s,'provisioner','exchange',1));const stable=JSON.stringify(s);assert(!E.switchMarketBusiness(s,'exchange','provisioner',0));assert.equal(JSON.stringify(s),stable);
 assert(E.setMarketAuto(s,'provisioner',true));E.tick(s,1);assert.equal(s.market.businesses.provisioner.demand,0);assert.deepEqual(reload(s),s);
 const locked=town();locked.inland.courtyard=false;assert(!E.buildMarketBusiness(locked,'exchange',2));
});
test('Third berth supports cargo, circuits, passengers, reservations, repeats, art and browser selection',()=>{
 let s=town();assert(!E.buyBoat(s,2,'cutter'));const coins=s.coins;assert(E.reserveFor(s,'thirdberth'));assert(E.buildThirdBerth(s));assert.equal(s.coins,coins-4000);assert(!E.buildThirdBerth(s));assert.equal(E.berthCount(s),3);assert(!s.reservations.thirdberth);
 assert(E.buyBoat(s,2,'coaster'));assert(E.installBoatUpgrade(s,2,'cargo'));assert(E.refitBoatSails(s,2));
 assert(E.reserveFor(s,'fleet:2:quarry:3'));assert(E.startVoyage(s,2,'quarry',3));const paid=structuredClone(s.fleet.boats[2].trip);s=reload(s);assert.deepEqual(s.fleet.boats[2].trip,paid);assert(E.cancelVoyage(s,2));assert(!E.cancelVoyage(s,2));
 const stops=[{route:'quarry',tier:1},{route:'island',tier:1}];assert(E.reserveFor(s,'circuit:2:1:1'));assert(E.startCircuit(s,2,stops));while(s.fleet.boats[2].trip)E.tick(s,60);
 assert(E.reserveFor(s,'ferryservice:2:island'));assert(E.startFerryService(s,2,'island'));while(s.fleet.boats[2].trip)E.tick(s,60);assert.equal(s.ferry.runs,1);
 assert(E.setRepeatVoyage(s,2,'quarry',1));E.tick(s,1);assert(s.fleet.boats[2].trip);assert(E.setRepeatVoyage(s,2,null));while(s.fleet.boats[2].trip)E.tick(s,60);
 assert(worldEntities(s).some(e=>e.id==='boat2'));assert(worldEntities(s).some(e=>e.id==='thirdberth'));
 const html=fleetPanelView(s,{slot:2,section:'voyages',selections:[{},{},{route:'quarry',tier:1}]},{costs:JSON.stringify,ingredients:()=>'',goalTools:()=>''});assert.match(html,/Berth 3/);assert.match(html,/data-slot="2"/);assert.deepEqual(reload(s),s);
});
test('Schema-13 paid cargo, circuits and passengers keep exact old rewards and duration across migration',()=>{
 const fixtures=JSON.parse(fs.readFileSync(new URL('../native/LittleHarbourTests/legacy-paid-voyages.json',import.meta.url),'utf8'));
 for(const {town:old}of fixtures){const paid=old.fleet.boats[1].trip;let s=E.parseSave(JSON.stringify(old));assert.equal(s.version,14);assert.deepEqual(s.fleet.boats[1].trip,paid);s=reload(s);const money=s.coins,stock={...s.stock};while(s.fleet.boats[1].trip)E.tick(s,60);assert.equal(s.coins-money,paid.reward.coins);for(const[k,n]of Object.entries(paid.reward))if(k!=='coins')assert.equal(s.stock[k]-stock[k],n);const final=JSON.stringify(s);s=reload(s);E.tick(s,1);assert.equal(s.coins,JSON.parse(final).coins);}
});
test('Lossless legacy export works in the frozen old reader; new saves are protected and malformed state rejected',()=>{
 const context=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('../native/LittleHarbourTests/legacy-engine-v13.js',import.meta.url),'utf8'),context);const old=context.Harbour;
 const s=town();old.load(E.legacyBrowserSave(s));const before=old.save();assert.throws(()=>old.load(JSON.stringify(s)),/newer version/);assert.equal(old.save(),before);
 assert(install(s,'mill',2,'yield'));assert.throws(()=>E.legacyBrowserSave(s),/new investments/);
 for(const mutate of [x=>x.advancedRefits.mill.tier=4,x=>x.advancedRefits.mill.mode='both',x=>x.advancedRefits.mill.epoch=-1,x=>x.yieldCredits.mill=4,x=>x.yieldCredits.field=1,x=>x.fleet.thirdBerth=true,x=>x.marketRevision=-1,x=>x.fleet.boats.pop()]){const bad=structuredClone(s);if(mutate.toString().includes('thirdBerth'))bad.ferry.stage=0;mutate(bad);assert.throws(()=>reload(bad));}
 const stable=JSON.stringify(s);assert(!install(s,'mill',2,'both'));assert.equal(JSON.stringify(s),stable);
});
