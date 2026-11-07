import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as B from '../bridge.js';
import * as C from '../chronicle.js';
import * as E from '../../dist/engine.js';
const fixture=JSON.parse(fs.readFileSync(new URL('../LittleHarbourTests/long-play-ready.json',import.meta.url),'utf8'));
const snap=()=>JSON.parse(B.snapshot()),save=()=>JSON.parse(B.save());
const act=(fn,args=[])=>B.act(JSON.stringify([fn,args]));
function ready(){const f=structuredClone(fixture);f.town.coins=100000;for(const k of Object.keys(f.town.stock))f.town.stock[k]=1000;B.load(JSON.stringify(f));assert(act('chronicleBegin'));}
function reload(){const bytes=B.save();B.load(bytes);assert.equal(B.save(),bytes);}
function tick(n){for(let i=0;i<n;i++)B.tick(1);}
test('Year is opt-in; pins migrate old envelopes without spending, reset or read side effects',()=>{
 B.load(JSON.stringify(fixture));const town=B.browserSave();assert.equal(save().nativeVersion,3);assert.equal(snap().chronicle.started,false);
 assert(B.pin('direction:industry'));assert.equal(save().nativeVersion,4);assert.equal(B.browserSave(),town);const b=B.save();snap();assert.equal(B.save(),b);reload();
 assert(B.pin(null));assert(!B.pin('made-up'));assert.equal(B.browserSave(),town);
});
test('Paused calendar and accepted requests survive season rotation and reload',()=>{
 ready();const o=snap().chronicle.offers[0];assert(act('chronicleAccept',[o.id]));const accepted=save().chronicle.offers[0];B.speed(0);const bytes=B.save();B.tick(60);assert.equal(B.save(),bytes);B.speed(3);tick(400);
 assert.equal(snap().chronicle.season,'Summer');assert.deepEqual(save().chronicle.offers.find(o=>o.id===accepted.id),accepted);assert.equal(snap().chronicle.offers.length,3);reload();
});
test('Request costs are based on unlocked production, frozen and never based on wealth',()=>{
 ready();const first=snap().chronicle.offers.map(o=>o.cost);const f=structuredClone(fixture);f.town.coins=1;for(const k of Object.keys(f.town.stock))f.town.stock[k]=0;B.load(JSON.stringify(f));assert(act('chronicleBegin'));assert.deepEqual(snap().chronicle.offers.map(o=>o.cost),first);
});
test('Completing one request does not replace or reprice the other offers',()=>{
 ready();const [a,b,c]=snap().chronicle.offers;assert(act('chronicleAccept',[a.id]));assert(act('chronicleAccept',[c.id]));assert(act('chronicleChoose',[c.id,1]));const held=save().chronicle.offers.filter(o=>o.id!==a.id);assert(act('chronicleDeliver',[a.id]));assert.deepEqual(save().chronicle.offers.filter(o=>[b.id,c.id].includes(o.id)),held);const paid=B.save();assert(!act('chronicleDeliver',[a.id]));assert.equal(B.save(),paid);reload();
});
test('Escrow protects goods from automation, releases exactly, exports without a native loss',()=>{
 ready();const o=snap().chronicle.offers[0];assert(act('chronicleAccept',[o.id]));const before=B.browserSave();assert(B.reserve(o.goal));const held=save().chronicle.reservations[o.goal];assert(Object.keys(held).length);assert.equal(B.browserSave(),before);
 const plan=JSON.parse(B.plan(o.goal));assert(plan.valid&&plan.ready);reload();assert(act('chronicleRelease',[o.goal]));assert.equal(B.browserSave(),before);assert(!act('chronicleRelease',[o.goal]));
 assert(B.reserve(o.goal));assert(act('chronicleDeliver',[o.id]));assert.deepEqual(save().chronicle.reservations,{});assert.equal(save().town.stock.planks,JSON.parse(before).stock.planks-o.cost.planks);
});
test('Native plans queue real recipes without consuming escrow or spending incoming output',()=>{
 ready();const o=snap().chronicle.offers[0];assert(act('chronicleAccept',[o.id]));const raw=save();raw.town.stock.planks=2;raw.town.stock.tiles=0;B.load(JSON.stringify(raw));assert(B.reserve(o.goal));const held=structuredClone(save().chronicle.reservations),wood=save().town.stock.wood;assert(B.queuePlan(o.goal)>0);assert(save().town.stock.wood<wood);assert.deepEqual(save().chronicle.reservations,held);assert(save().town.jobs.length);assert(!act('chronicleDeliver',[o.id]));reload();
});
test('Only returned passenger services dispatched after acceptance count; recalls and same boat do not',()=>{
 ready();assert(act('startFerryService',[0,'quarry']));const o=snap().chronicle.offers.find(o=>o.kind===1);assert(act('chronicleAccept',[o.id]));tick(180);assert.equal(snap().chronicle.offers.find(x=>x.id===o.id).boats,0);
 assert(act('startFerryService',[0,'quarry']));assert(act('cancelVoyage',[0]));tick(180);assert.equal(snap().chronicle.offers.find(x=>x.id===o.id).boats,0);
 for(const slot of [0,0,1]){assert(act('startFerryService',[slot,'quarry']));tick(180);reload();}
 assert.equal(snap().chronicle.offers.find(x=>x.id===o.id).boats,2);assert(act('chronicleDeliver',[o.id]));assert.equal(snap().chronicle.partners.find(p=>p.id==='ada').requests,1);
});
test('Choice requests commit a branch and charge only the frozen selected supplies',()=>{
 for(const choice of [0,1]){ready();const o=snap().chronicle.offers.find(o=>o.kind===2);assert(act('chronicleAccept',[o.id]));assert(!act('chronicleDeliver',[o.id]));assert(act('chronicleChoose',[o.id,choice]));assert(!act('chronicleChoose',[o.id,1-choice]));const before=save().town,request=snap().chronicle.offers.find(x=>x.id===o.id);assert(act('chronicleDeliver',[o.id]));for(const[k,n]of Object.entries(request.cost))assert.equal(save().town.stock[k],before.stock[k]-n);reload();}
});
test('All eight projects and both branches use distinct boats, durable paid stages and permanent completion',()=>{
 for(const branch of [0,1]){ready();assert(act('chronicleHouseholds',[0]));
  for(const d of C.PROJECTS){assert(act('chronicleProject',[d.id,branch]),d.id);assert(!act('chronicleProject',[d.id,1-branch]));
   for(const stage of [0,1]){assert(act('chronicleBuild',[d.id,stage]));const paid=B.save();assert(!act('chronicleBuild',[d.id,stage]));assert.equal(B.save(),paid);reload();}
   assert(!act('chronicleBuild',[d.id,2]));
   const wrong=C.PROJECT_TRANSPORT[d.id][branch][0]==='passengers'?'startVoyage':'startFerryService';assert(act(wrong,wrong==='startVoyage'?[0,'quarry',1]:[0,'quarry']));tick(180);assert.equal(save().chronicle.projects[d.id].boats.length,0,'Wrong mission type cannot complete a project');reload();
   for(const[slot,route]of [[0,'quarry'],[1,'quarry'],[0,'island']]){const passenger=C.PROJECT_TRANSPORT[d.id][branch][route==='quarry'?0:1]==='passengers';assert(act(passenger?'startFerryService':'startVoyage',passenger?[slot,route]:[slot,route,1]));tick(180);reload();}
   assert(act('chronicleBuild',[d.id,2]));assert(act('chronicleBuild',[d.id,3]));assert.equal(save().chronicle.projects[d.id].stage,4);reload();
  }
  assert.equal(Object.keys(save().chronicle.projects).length,8);assert.equal(snap().chronicle.memories.filter(m=>C.PROJECTS.some(p=>p.title===m.title)).length,8);
 }
});
test('Corrupt and future native saves reject atomically, including hidden-field downgrades',()=>{
 ready();const bytes=B.save();const mutations=[x=>x.nativeVersion=5,x=>x.nativeVersion=3,x=>x.chronicle.elapsed=-1,x=>x.chronicle.offers[0].size=1e9,x=>x.chronicle.offers.push(x.chronicle.offers[0]),x=>x.chronicle.partners.matteo=-1,x=>x.chronicle.pin='bad',x=>x.chronicle.projects.bad={},x=>x.chronicle.reservations.bad={bread:2},x=>x.chronicle.offers[0].boats=[0]];
 for(const change of mutations){const raw=JSON.parse(bytes);change(raw);assert.throws(()=>B.load(JSON.stringify(raw)));assert.equal(B.save(),bytes);}
});
test('Generated JavaScriptCore bundle matches native ESM through new actions and reloads',()=>{
 const context=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('../LittleHarbour/Resources/engine-bundle.js',import.meta.url),'utf8'),context);ready();const G=context.Harbour;G.load(B.save());
 const id=snap().chronicle.offers[0].id;for(const [fn,args]of [['chronicleAccept',[id]],['chronicleDeliver',[id]],['chronicleProject',['restoration',1]],['chronicleBuild',['restoration',0]]]){assert(act(fn,args));assert(G.act(JSON.stringify([fn,args])));assert.equal(G.save(),B.save());assert.equal(G.snapshot(),B.snapshot());}reload();
});
test('Old native reader rejects envelope four before it can erase new progress',()=>{
 ready();const context=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('../LittleHarbourTests/legacy-engine-v13.js',import.meta.url),'utf8'),context);const old=context.Harbour,oldBytes=old.save();assert.throws(()=>old.load(B.save()),/newer app/);assert.equal(old.save(),oldBytes);
});

test('Festival planning preserves the other request and never loses held goods',()=>{
 ready();const offers=snap().actions.filter(a=>a.fn==='festivalOrder');assert.equal(offers.length,2);
 assert(B.reserve(offers[1].goal));const held=structuredClone(save().chronicle.reservations[offers[1].goal]);assert(B.act(offers[0].id));assert(snap().actions.some(a=>a.id===offers[1].id));assert.deepEqual(save().chronicle.reservations[offers[1].goal],held);reload();assert(B.act(offers[1].id));assert(!save().chronicle.reservations[offers[1].goal]);
});
test('Festival planning before the year migrates safely and allows release',()=>{
 B.load(fs.readFileSync(new URL('../LittleHarbourTests/festival-opening.json',import.meta.url),'utf8'));const a=snap().actions.find(a=>a.fn==='festivalCelebrate');const before=B.browserSave();assert(B.reserve(a.goal));assert.equal(save().nativeVersion,4);assert.equal(B.browserSave(),before);reload();assert(act('chronicleRelease',[a.goal]));assert.equal(B.browserSave(),before);assert(B.reserve(a.goal));assert(B.act(a.id));reload();assert.equal(snap().festival.stage,4);
});
test('Partner rewards are earned once; an assigned adviser reopens only unreserved visitor choices',()=>{
 ready();for(let i=0;i<15;i++){const o=snap().chronicle.offers.find(o=>o.kind===0);assert(act('chronicleAccept',[o.id]));assert(act('chronicleDeliver',[o.id]));}
 for(let stage=0;stage<4;stage++){const action=snap().actions.find(a=>a.fn==='chroniclePartner'&&a.args[0]==='matteo');assert(action?.enabled);assert(act('chroniclePartner',['matteo',stage]));const paid=B.save();assert(!act('chroniclePartner',['matteo',stage]));assert.equal(B.save(),paid);reload();}
 assert(act('chronicleSpecialist',['matteo']));const o=snap().chronicle.offers.find(o=>o.kind===2);assert(act('chronicleAccept',[o.id]));assert(act('chronicleChoose',[o.id,0]));assert(B.reserve(o.goal));assert(!act('chronicleAdvice',[o.id,0]));assert(act('chronicleRelease',[o.goal]));assert(act('chronicleAdvice',[o.id,0]));assert(act('chronicleChoose',[o.id,1]));reload();
});

test('City voyages occupy existing boats; recall, export and reload never duplicate paid cargo',()=>{
 const earned=JSON.parse(fs.readFileSync(new URL('../LittleHarbourTests/chronicle-campaigns.json',import.meta.url),'utf8'))[1].expected;
 // Rebase this earned town into the current unreleased envelope fields, preserving all paid project work.
 ready();const raw=save();raw.chronicle.projects=earned.chronicle.projects;raw.chronicle.standing=1;
 raw.town.fleet.boats[0]={type:'coaster',upgrade:'cargo',sails:false,trip:null,repeat:null};B.load(JSON.stringify(raw));
 const before=B.browserSave();let serial=save().chronicle.city.serial;assert(act('chronicleCitySail',[0,serial]));assert.equal(snap().boats[0].trip.route,'city');assert(!act('startVoyage',[0,'quarry',1]));assert(!act('installBoatUpgrade',[0,'speed']));assert.deepEqual(JSON.parse(B.browserSave()).stock,JSON.parse(before).stock);reload();
 assert(act('chronicleCityRecall',[0,serial]));assert.deepEqual(JSON.parse(B.browserSave()).stock,JSON.parse(before).stock);assert.equal(save().chronicle.city.glaze,0);
 serial=save().chronicle.city.serial;assert(act('chronicleCitySail',[0,serial]));tick(239);assert.equal(save().chronicle.city.glaze,0);reload();tick(1);assert.equal(save().chronicle.city.glaze,6);reload();tick(240);assert.equal(save().chronicle.city.glaze,6);
 serial=save().chronicle.city.serial;const jars=save().town.stock.jars;assert(act('chronicleCityCraft',[serial]));assert(!act('chronicleCityCraft',[serial]));assert.equal(save().town.stock.jars,jars-2);tick(29);assert.equal(save().chronicle.city.ceramics,0);reload();tick(1);assert.equal(save().chronicle.city.ceramics,2);
});
test('City collections require actual chosen expeditions and reject forged occupancy',()=>{
 ready();const raw=save();raw.chronicle.projects=Object.fromEntries(C.PROJECTS.map(d=>[d.id,{branch:0,stage:4,boats:[0,1],eligible:[],routes:['quarry','island']}]));raw.chronicle.standing=1;raw.chronicle.city.ceramics=36;raw.town.fleet.boats[0]={type:'coaster',upgrade:'cargo',sails:false,trip:null,repeat:null};B.load(JSON.stringify(raw));
 for(let stage=0;stage<3;stage++){
  assert(act('chronicleCityDeliver',[stage]));assert(!act('chronicleCityDeliver',[stage]));
  if(stage<2){assert(act('chronicleCityChoose',[stage,stage%2]));assert(!act('chronicleCityChoose',[stage,1-stage%2]));assert(!act('chronicleCityDeliver',[stage+1]));assert(act('chronicleCityExplore',[0,stage,save().chronicle.city.serial]));reload();tick(240);assert(save().chronicle.city.explored.includes(stage));}
 }
 assert.equal(save().chronicle.city.chapter,3);reload();const bytes=B.save(),bad=save();bad.chronicle.city.voyages[0]={epoch:0,left:241,expedition:null};assert.throws(()=>B.load(JSON.stringify(bad)));assert.equal(B.save(),bytes);
});
test('New coasts and town identity preserve the original until explicit replacement',()=>{
 B.reset();const original=B.save();assert(!B.newCoast('unknown','Test'));assert.equal(B.save(),original);assert(B.newCoast('windy','Porto Vento'));assert.equal(snap().chronicle.coast,'windy');assert.equal(snap().story.townName,'Porto Vento');reload();const bytes=B.save();assert.throws(()=>B.identity('', 'teal'));assert.equal(B.save(),bytes);assert(B.identity('Porto Sereno','teal'));reload();
});

test('Locked city save validation accepts reordered JSON keys but rejects progress',()=>{
 ready();const raw=save();raw.chronicle.city=Object.fromEntries(Object.entries(raw.chronicle.city).reverse());
 B.load(JSON.stringify(raw));assert.equal(snap().chronicle.started,true);const before=B.save();
 raw.chronicle.city.glaze=1;assert.throws(()=>B.load(JSON.stringify(raw)),/Invalid city-port/);assert.equal(B.save(),before);
});
