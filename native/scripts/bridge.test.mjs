import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as B from '../bridge.js';
import * as E from '../../dist/engine.js';
import {nextStep} from '../guidance.js';
import {sampleTown} from '../../dist/demo-town.js';
import {worldEntities} from '../../dist/world-model.js';
const late=E.parseSave(fs.readFileSync(new URL('../LittleHarbourTests/late-town.json',import.meta.url),'utf8'));
const preQuay=E.fresh();Object.assign(preQuay,{deliveries:2,coins:1000,expansion:'fishing',businesses:['fishing']});
const investments=JSON.parse(fs.readFileSync(new URL('../LittleHarbourTests/long-play-ready.json',import.meta.url),'utf8'));
const fixtures=[E.fresh(),preQuay,sampleTown(),late,investments.town].map(s=>E.parseSave(JSON.stringify(s)));
const snapshot=()=>JSON.parse(B.snapshot());
const nativeTown=()=>JSON.parse(B.browserSave());
test('Bulk stock targets commit atomically, preserve resources and round-trip native Keep 24',()=>{
 B.load(JSON.stringify(investments));
 const keys=Object.keys(snapshot().workshops),before=nativeTown();
 assert(keys.length>3);assert(B.setTargets(keys,24));
 assert(Object.values(snapshot().workshops).every(w=>w.target===24));
 assert.deepEqual(nativeTown().stock,before.stock);assert.deepEqual(nativeTown().jobs,before.jobs);assert.equal(nativeTown().coins,before.coins);
 const paid=B.save();B.load(paid);assert.equal(B.save(),paid);assert(B.setTargets(keys,24));assert.equal(B.save(),paid,'Repeated target selection is a no-op');
 for(const [list,target]of [[[keys[0],'missing'],6],[[keys[0],keys[0]],6],[keys,25],[[],0]]){
  assert.equal(B.setTargets(list,target),false);assert.equal(B.save(),paid,'Invalid bulk edit must not partially change earlier recipes');
 }
 assert(B.setTargets(keys,0));assert(Object.values(snapshot().workshops).every(w=>w.target===0));
 B.reset();const fresh=B.save();assert.equal(B.setTargets(['field'],24),false);assert.equal(B.save(),fresh);
 const context=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('../LittleHarbour/Resources/engine-bundle.js',import.meta.url),'utf8'),context);
 context.Harbour.load(JSON.stringify(investments));assert(context.Harbour.setTargets(keys,24));
 B.load(JSON.stringify(investments));assert(B.setTargets(keys,24));assert.equal(context.Harbour.save(),B.save());
});
test('A supply recommendation names its destination goal separately from its next action',()=>{
 const town=E.parseSave(JSON.stringify(preQuay));town.stock.wood=0;town.stock.stone=0;town.stock.bread=0;town.stock.flour=0;town.stock.wheat=0;
 B.load(JSON.stringify(town));const s=snapshot(),target=s.actions.find(a=>a.fn==='upgrade');assert(target&&!target.enabled);
 const guidance=nextStep(town,s.actions,s.objective,{targets:[target],category:'Build'});
 assert.equal(guidance.goalTitle,target.title);assert(guidance.requirements.length>0);
 assert.notEqual(guidance.goalTitle,guidance.title);assert(guidance.choices.every(id=>s.actions.some(a=>a.id===id)));
});
test('Native investment transactions, previews and legacy-export protection match the shared engine',()=>{
 const expected=E.parseSave(JSON.stringify(late));expected.coins=100000;for(const k of Object.keys(expected.stock))expected.stock[k]=1000;expected.fleet.visits={quarry:10,island:10};
 for(const route of ['quarry','island'])for(let stage=0;stage<3;stage++)assert(E.fundCoastalProject(expected,route,stage));
 assert(E.buildCourtyard(expected));E.tick(expected,30);B.load(JSON.stringify(expected));
 for(const station of Object.keys(E.ADVANCED_STATIONS))for(const [tier,mode]of [[2,'speed'],[2,'yield'],[2,'original'],[3,'speed'],[3,'yield']]){
  const epoch=expected.advancedRefits[station]?.epoch||0,id=JSON.stringify(['installAdvancedRefit',[station,tier,mode,epoch]]);
  const before=B.save(),offer=snapshot().actions.find(a=>a.id===id);assert(offer?.enabled,id);assert.equal(B.save(),before);
  assert(E.installAdvancedRefit(expected,station,tier,mode,epoch));assert(B.act(id));assert.deepEqual(nativeTown(),expected);
  const paid=B.save();assert(!B.act(id));assert.equal(B.save(),paid);B.load(paid);assert.equal(B.save(),paid);
 }
 assert(!snapshot().legacyBrowserAvailable);assert.throws(()=>B.legacyBrowserSave(),/new investments/);
 for(const [fn,args]of [['buildMarketBusiness',['exchange',2]],['buildThirdBerth',[]],['buyBoat',[2,'cutter']]]){
  assert(E[fn](expected,...args));assert(B.act(JSON.stringify([fn,args])));assert.deepEqual(nativeTown(),expected);
 }
 E.tick(expected,8);B.tick(8);assert.deepEqual(nativeTown(),expected);
 for(const type of ['provisioner','exchange']){
  const old=expected.market.plots[2],epoch=expected.marketRevision,id=JSON.stringify(['switchMarketBusiness',[type,old,epoch]]);
  assert(E.switchMarketBusiness(expected,type,old,epoch));assert(B.act(id));assert.deepEqual(nativeTown(),expected);assert(!B.act(id));
 }
 assert(snapshot().entities.some(e=>e.id==='boat2'));assert(snapshot().entities.some(e=>e.id==='thirdberth'));
 const native=B.save();B.load(B.browserSave());assert.deepEqual(nativeTown(),expected);B.load(native);assert.equal(B.save(),native);
});
test('Story projections keep saves unchanged, use one island name and retain only evidenced memories',()=>{
 for(const town of fixtures){
  B.load(JSON.stringify(town));const before=B.save(),first=snapshot();
  assert.equal(snapshot().story.townName,'Porto Lume');assert(first.story.voice.length>20);
  assert.equal(JSON.stringify(first).includes('Isola dei Pescatori'),false);
  assert.deepEqual(snapshot(),first);assert.equal(B.save(),before);
  B.load(before);assert.deepEqual(snapshot().story,first.story);
 }
 B.reset();assert.equal(snapshot().story.memories.length,0);
 const opening=fs.readFileSync(new URL('../LittleHarbourTests/festival-opening.json',import.meta.url),'utf8');B.load(opening);
 assert.deepEqual(snapshot().story.memories.filter(m=>m.chapter).map(m=>m.chapter),[5,4,3,2,1]);
 const saved=B.save();snapshot();assert.equal(B.save(),saved);
 assert(B.act('["festivalCelebrate",["food"]]'));const opened=B.save(),story=snapshot().story;
 assert.equal(story.memories[0].chapter,6);assert.match(story.memories[0].body,/food fair/);
 assert(story.memories.every(m=>m.dateLabel.includes('not recorded')));
 const history=JSON.parse(opened).evolution.history;
 assert.deepEqual(story.decisions.map(m=>m.dateLabel),history.map(h=>'Season '+h.season).reverse());
 B.load(opened);assert.deepEqual(snapshot().story,story);assert.equal(B.save(),opened);
});
test('Named partners decorate native actions without changing invocation identities or canonical text',()=>{
 B.load(JSON.stringify(late));const before=B.save(),actions=snapshot().actions;
 const quarry=actions.find(a=>['fundCoastalProject','completeCommission'].includes(a.fn)&&a.args[0]==='quarry');
 assert(quarry?.partner.startsWith('Matteo'));
 for(const [fn,name]of [['dispatchMarket','Sofia'],['chooseResidentsProposal','Nico']]){
  const action=actions.find(a=>a.fn===fn);assert(action?.partner.startsWith(name));
  assert.equal(action.id,JSON.stringify([action.fn,action.args]));
 }
 assert(actions.some(a=>a.partner?.startsWith('Lucia')));
 assert.equal(B.save(),before);
});
test('Every exposed enabled economic action equals the original engine transaction',()=>{
 const context=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('../LittleHarbour/Resources/engine-bundle.js',import.meta.url),'utf8'),context);
 const generated=context.Harbour;let count=0;
 for(const fixture of fixtures){
  B.load(JSON.stringify(fixture));generated.load(JSON.stringify(fixture));assert.deepEqual(JSON.parse(generated.snapshot()),snapshot(),'generated and ESM snapshots match');const ids=snapshot().actions.filter(a=>a.enabled).map(a=>a.id);
  for(const id of ids.filter(id=>{const [fn,args]=JSON.parse(id);return !(fn==='setTarget'&&args[1]===24);})){
   B.load(JSON.stringify(fixture));generated.load(JSON.stringify(fixture));const [fn,args]=JSON.parse(id),expected=structuredClone(fixture);
   assert(E[fn](expected,...args),id); assert(B.act(id),id);assert(generated.act(id),'generated '+id);
   assert.deepEqual(nativeTown(),E.parseSave(JSON.stringify(expected)),id);assert.deepEqual(JSON.parse(generated.browserSave()),nativeTown(),'generated '+id);count++;
  }
 }
 assert(count>180);console.log(`${count} ESM and generated-runtime transactions each matched original engine behavior.`);
});
test('Illegal and stale construction actions cannot charge twice or produce evolution',()=>{
 B.reset();const before=B.save();assert.equal(B.act(JSON.stringify(['build',['olive']])),false);assert.equal(B.save(),before);
 const fixture=E.fresh();fixture.deliveries=1;fixture.coins=1000;B.load(JSON.stringify(fixture));
 const id=JSON.stringify(['build',['olive']]);assert(B.act(id));const paid=B.save();assert.equal(B.act(id),false);assert.equal(B.save(),paid);
 assert.equal(snapshot().entities.find(x=>x.id==='olive').stage,'building');B.tick(8);assert.equal(snapshot().entities.find(x=>x.id==='olive').stage,'built');
});
test('Known browser schemas 1 through 14 migrate through authoritative parser',()=>{
 for(let version=1;version<=14;version++){const s=E.fresh();s.version=version;if(version<14)s.fleet.boats=s.fleet.boats.slice(0,2);B.load(JSON.stringify(s));assert.equal(nativeTown().version,14);assert.equal(nativeTown().coins,80);}
});
test('All supported native and browser imports roundtrip without losing paid work',()=>{
 for(const fixture of [E.fresh(),sampleTown(),late]){
  B.load(JSON.stringify(fixture));const bytes=B.save();B.load(bytes);assert.equal(B.save(),bytes);
 }
 B.load(JSON.stringify(late));const ferry=snapshot().actions.find(a=>a.fn==='startFerryService'&&a.enabled);assert(B.act(ferry.id));const paid=B.save();B.load(paid);assert.equal(B.save(),paid);B.speed(0);const paused=B.save();B.tick(60);assert.equal(B.save(),paused);
});
test('Future/malformed native or economy data are rejected before live state changes',()=>{
 B.reset();const original=B.save();for(const raw of ['', '{broken','null','{"version":99}','{"nativeVersion":2}',JSON.stringify({nativeVersion:1,town:late,evolution:{schema:99}})]){assert.throws(()=>B.load(raw));assert.equal(B.save(),original);}
});
test('Reservations and plans use valid canonical identifiers',()=>{
 B.load(JSON.stringify(late));for(const a of snapshot().actions.filter(a=>a.goal)){
  const cost=E.goalCost(late,a.goal);if(cost){const p=JSON.parse(B.plan(a.goal));assert(p.valid,a.goal);assert.deepEqual(p.requirements.map(x=>[x.item,x.required]),Object.entries(cost));}
 }
 const s=sampleTown();s.market=E.fresh().market;s.inland=E.fresh().inland;s.waterfront={path:'maritime',stage:0,funded:true,delivered:0,left:0};B.load(JSON.stringify(s));const supply=snapshot().actions.find(a=>a.fn==='supplyWaterfront');assert.equal(supply.goal,'waterfront:0:0');assert(B.reserve(supply.goal));assert(B.act(supply.id));
});
test('Generated bundle runs in a sandbox without a DOM, module loader or structuredClone',()=>{
 const context=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('../LittleHarbour/Resources/engine-bundle.js',import.meta.url),'utf8'),context);
 B.reset();assert.equal(context.Harbour.save(),B.save());context.Harbour.load(JSON.stringify(late));B.load(JSON.stringify(late));assert.equal(context.Harbour.snapshot(),B.snapshot());
});
test('Native scene preserves separate specialist plots and every state has packaged art',()=>{
 for(const fixture of [E.fresh(),sampleTown(),late]){
  B.load(JSON.stringify(fixture));const entities=snapshot().entities;assert(entities.some(e=>e.id==='boatyard'));assert(entities.some(e=>e.id==='estate'));
  for(const e of entities){const type=e.id==='kiln'?'kiln':e.id==='claypit'?'clay':['courtyard','civic'].includes(e.id)?'square':e.kind;for(const phase of ['unbuilt','building','built','upgraded','ripe'])assert(fs.existsSync(new URL(`../LittleHarbour/Resources/Art/${type}-${phase}.png`,import.meta.url)),type+'-'+phase);}
 }
});
test('Elena follows opening production, waiting and deliberate choices without changing saves',()=>{
 B.reset();let s=snapshot();assert.equal(s.guidance.actionID,'["harvestReplant",[]]');
 const before=B.save();snapshot();assert.equal(B.save(),before);
 B.act(s.guidance.actionID);s=snapshot();assert.equal(s.guidance.actionID,'["start",["mill"]]');
 B.act(s.guidance.actionID);B.act(s.guidance.actionID);s=snapshot();assert.equal(s.guidance.waiting,true);assert.deepEqual(s.guidance.choices,[]);
 B.speed(0);assert.match(snapshot().guidance.body,/paused/i);B.speed(1);B.tick(8);
 assert.equal(snapshot().guidance.actionID,'["start",["bakery"]]');
 const town=E.fresh();Object.assign(town,{deliveries:2,coins:1000,pier:true,expansion:'fishing',businesses:['fishing'],construction:[{type:'pier',left:5}]});
 B.load(JSON.stringify(town));assert.equal(snapshot().guidance.waiting,true);assert.deepEqual(snapshot().guidance.choices,[]);
 B.tick(8);s=snapshot();assert.equal(s.guidance.choices.length,2);assert(s.guidance.choices.every(id=>JSON.parse(id)[0]==='specialise'));
});
test('Every campaign recommendation points to current actions and remains read-only',()=>{
 const campaigns=JSON.parse(fs.readFileSync(new URL('../LittleHarbourTests/earned-campaigns.json',import.meta.url),'utf8'));
 let checked=0;
 for(const campaign of campaigns){
  B.reset();
  for(const step of campaign.steps){
   if(step.action)assert(B.act(step.action),step.action);
   if(step.ticks)for(let t=0;t<step.ticks;t++)B.tick(1);
   if(step.reload)B.load(B.save());
   if(step.action||step.reload){
    const before=B.save(),s=snapshot(),g=s.guidance;
    assert.equal(B.save(),before);assert(g.title&&g.body);assert(Array.isArray(g.requirements));
    for(const id of g.choices){const a=s.actions.find(a=>a.id===id);assert(a,id);assert.equal(a.category,g.category);}
    if(g.actionID)assert(g.choices.includes(g.actionID));
    assert(!g.waiting||g.choices.length===0);
    for(const d of s.directions){assert(Number.isInteger(d.progress)&&d.progress>=0,d.id+' progress');assert(Number.isInteger(d.total)&&d.total>0,d.id+' total');for(const id of d.choices)assert(s.actions.some(a=>a.id===id&&a.category===d.category),d.id+' action');}
    checked++;
   }
  }
 }
 assert.equal(snapshot().objective.chapter,6,'The earned final chapter opens the festival');
 assert.equal(snapshot().festival.unlocked,true);
 console.log(`${checked} progression guidance snapshots checked across both earned campaigns.`);
});

test('Queued ingredients for later goals are explained as waiting, not another unavailable task',()=>{
 const campaigns=JSON.parse(fs.readFileSync(new URL('../LittleHarbourTests/earned-campaigns.json',import.meta.url),'utf8'));
 B.reset();let found=false;
 for(const step of campaigns[0].steps){
  if(step.action)B.act(step.action);if(step.ticks)for(let t=0;t<step.ticks;t++)B.tick(1);
  if(snapshot().guidance.title==='Wait for your workshops'){
   const g=snapshot().guidance;assert.equal(g.category,'Production');assert.equal(g.waiting,true);assert.deepEqual(g.choices,[]);
   B.speed(0);assert.match(snapshot().guidance.body,/paused/);found=true;break;
  }
 }
 assert(found,'An earned post-opening ingredient chain should explicitly explain its pending production');
});


test('Ambitions use saved milestones and continue after the final passenger chapter',()=>{
 B.load(JSON.stringify(late));const before=B.save();const s=snapshot();assert.equal(s.directions.length,3);assert.equal(B.save(),before);
 const commission=s.actions.find(a=>a.fn==='fundCoastalProject'&&a.enabled);assert(commission);const beforeProgress=s.directions.find(d=>d.id==='coast').progress;assert(B.act(commission.id));
 assert.equal(snapshot().directions.find(d=>d.id==='coast').progress,beforeProgress+1);const saved=B.save();B.load(saved);assert.equal(snapshot().directions.find(d=>d.id==='coast').progress,beforeProgress+1);
 assert(snapshot().directions.every(d=>d.unlocked));
});
test('Late ambitions point to the new investments without paying or changing the town',()=>{
 const town=E.parseSave(JSON.stringify(investments.town));
 town.fleet.thirdBerth=false;town.fleet.boats[2]=null;town.market.plots[2]=null;
 delete town.market.businesses.provisioner;delete town.market.businesses.exchange;
 town.advancedRefits={};town.yieldCredits={};town.targets={field:12,mill:12,bakery:12};
 B.load(JSON.stringify(town));const before=B.save(),s=snapshot();
 assert.equal(B.save(),before);
 for(const [direction,fn]of [['coast','buildThirdBerth'],['community','buildMarketBusiness'],['industry','installAdvancedRefit']]){
  const d=s.directions.find(d=>d.id===direction);assert(d.choices.length,direction);
  for(const id of d.choices){const a=s.actions.find(a=>a.id===id);assert.equal(a.fn,fn);assert.equal(a.category,d.category);}
  if(d.siteID)assert(s.entities.some(e=>e.id===d.siteID));
 }
 town.fleet.thirdBerth=true;B.load(JSON.stringify(town));
 assert(snapshot().directions.find(d=>d.id==='coast').choices.every(id=>JSON.parse(id)[0]==='buyBoat'));
});
test('Inline workshop targets persist and wait while the town is paused',()=>{
 B.load(JSON.stringify(late));B.speed(0);const id=JSON.stringify(['setTarget',['mill',12]]);assert(B.act(id));assert.equal(snapshot().workshops.mill.target,12);assert.equal(snapshot().workshops.mill.status,'Paused');
 const saved=B.save();B.tick(60);assert.equal(B.save(),saved);B.load(saved);assert.equal(snapshot().workshops.mill.target,12);
 assert(B.act(JSON.stringify(['setTarget',['mill',0]])));assert.equal(snapshot().workshops.mill.status,'Manual production');
});
test('Mission previews are read-only and launching berth two leaves berth one untouched',()=>{
 B.load(JSON.stringify(late));B.speed(0);const before=B.save(), boat=JSON.stringify(snapshot().boats[0]);
 const options=snapshot().actions.filter(a=>a.fn==='startVoyage'&&a.args[0]===1);assert(options.length===6);assert.equal(B.save(),before);
 const mission=options.find(a=>a.enabled);assert(mission);assert(B.act(mission.id));assert(snapshot().boats[1].trip);assert.equal(JSON.stringify(snapshot().boats[0]),boat);
 const launched=B.save();assert.equal(B.act(mission.id),false);assert.equal(B.save(),launched);
});


test('Native Keep 24 fills through original production costs and survives exports and reloads',()=>{
 const fixture=structuredClone(late);fixture.stock.flour=0;fixture.targets={};B.load(JSON.stringify(fixture));
 assert(B.act(JSON.stringify(['setTarget',['mill',24]])));assert.equal(snapshot().workshops.mill.target,24);
 const saved=B.save(), envelope=JSON.parse(saved);assert.equal(envelope.nativeVersion,2);assert.deepEqual(envelope.stockTargets,{mill:24});assert.equal(envelope.town.targets.mill,12);
 const browser=E.parseSave(B.browserSave());assert.equal(browser.targets.mill,12);assert.equal(B.save(),saved);B.load(saved);
 const reference=E.parseSave(B.browserSave());reference.targets.mill=24;
 for(let i=0;i<240;i++){E.tick(reference,1);B.tick(1);}
 assert.equal(snapshot().stock.flour,24);assert.equal(snapshot().jobs.length,0);
 reference.targets.mill=12;assert.deepEqual(nativeTown(),reference);
 const finished=B.save();B.load(finished);assert.equal(snapshot().workshops.mill.target,24);
 assert(B.act(JSON.stringify(['setTarget',['mill',12]])));assert.equal(JSON.parse(B.save()).nativeVersion,1);assert.equal(snapshot().workshops.mill.target,12);
});
test('Native stock target migration rejects malformed overrides transactionally and respects pause',()=>{
 B.load(JSON.stringify(late));assert(B.act(JSON.stringify(['setTarget',['mill',24]])));B.speed(0);const before=B.save(),valid=JSON.parse(before);B.tick(60);assert.equal(B.save(),before);
 for(const targets of [null,[],{mill:48},{mill:-1},{unknown:24},{bakery:24}]){
  assert.throws(()=>B.load(JSON.stringify({...valid,stockTargets:targets})));assert.equal(B.save(),before);
 }
 assert.throws(()=>B.load(JSON.stringify({...valid,nativeVersion:1})));assert.equal(B.save(),before);
 assert.throws(()=>B.load(JSON.stringify({...valid,nativeVersion:4})));assert.equal(B.save(),before);
 B.reset();assert.equal(JSON.parse(B.save()).nativeVersion,1);assert.equal(B.act(JSON.stringify(['setTarget',['field',24]])),false);
});

test('Festival contributions are transactional, reservation-aware and stale actions cannot spend twice',()=>{
 const base=JSON.parse(fs.readFileSync(new URL('../LittleHarbourTests/earned-campaigns.json',import.meta.url),'utf8'))[0].expectedTown;
 const town=structuredClone(base);town.coins=5000;for(const key of Object.keys(town.stock))town.stock[key]=100;town.stock.bread=24;
 B.load(JSON.stringify(town));const id=(fn,...args)=>JSON.stringify([fn,args]);
 assert.equal(snapshot().festival.unlocked,true);const before=B.save();snapshot();assert.equal(B.save(),before);
 assert(B.act(id('festivalPrepare')));assert.equal(JSON.parse(B.save()).nativeVersion,3);
 const paid=B.save();assert.equal(B.act(id('festivalPrepare')),false);assert.equal(B.save(),paid);
 assert(B.reserve('neighbourhood:order:'+town.neighbourhood.orders));
 const held=B.save();assert.equal(B.act(id('festivalSupply','food')),false);assert.equal(B.save(),held);
 assert(B.act(id('releaseReservation','neighbourhood:order:'+town.neighbourhood.orders)));
 const coins=nativeTown().coins,bread=nativeTown().stock.bread;assert(B.act(id('festivalSupply','food')));
 assert.equal(nativeTown().coins,coins);assert.equal(nativeTown().stock.bread,bread-24);
 const supplied=B.save();assert.equal(B.act(id('festivalChoose','craft')),false);assert.equal(B.act(id('festivalSupply','food')),false);assert.equal(B.act(id('festivalCelebrate','food')),false);assert.equal(B.save(),supplied);
 const browser=B.browserSave();assert.deepEqual(E.parseSave(browser),nativeTown());assert.equal(B.save(),supplied);
 B.load(browser);assert.equal(snapshot().festival.stage,0);B.load(supplied);assert.equal(snapshot().festival.stage,2);
});

test('Festival arrivals count returned passenger services, never cargo, recall, pause or duplicate reloads',()=>{
 const town=structuredClone(JSON.parse(fs.readFileSync(new URL('../LittleHarbourTests/earned-campaigns.json',import.meta.url),'utf8'))[1].expectedTown);
 town.coins=5000;for(const key of Object.keys(town.stock))town.stock[key]=100;B.load(JSON.stringify(town));
 const act=(fn,...args)=>assert(B.act(JSON.stringify([fn,args])),fn);
 act('festivalPrepare');act('festivalChoose','craft');act('festivalSupply','craft');
 act('startFerryService',0,'quarry');act('cancelVoyage',0);B.tick(60);assert.equal(snapshot().festival.visits.quarry,0);
 act('startVoyage',0,'quarry',1);for(let i=0;i<100;i++)B.tick(1);assert.equal(snapshot().festival.visits.quarry,0);
 for(const route of ['quarry','quarry','quarry','island','island']){
  act('startFerryService',0,route);B.speed(0);const paused=B.save();B.tick(60);assert.equal(B.save(),paused);B.speed(1);
  const duration=snapshot().boats[0].trip.duration;for(let i=0;i<Math.ceil(duration);i++)B.tick(1);
  const returned=B.save();B.load(returned);B.tick(0);assert.equal(B.save(),returned);
 }
 assert.deepEqual(snapshot().festival.visits,{quarry:2,island:2});assert.equal(snapshot().festival.stage,3);
 act('festivalCelebrate','craft');const opened=B.save();assert.equal(B.act(JSON.stringify(['festivalCelebrate',['craft']])),false);assert.equal(B.save(),opened);
 const offers=snapshot().actions.filter(a=>a.fn==='festivalOrder'),coins=nativeTown().coins;assert.equal(offers.length,2);
 assert(B.act(offers[0].id));assert.equal(nativeTown().coins,coins+offers[0].reward);assert.equal(snapshot().festival.orders,1);
 const rewarded=B.save();assert.equal(B.act(offers[0].id),false);assert.equal(B.act(offers[1].id),false);assert.equal(B.save(),rewarded);
});

test('Festival version-three migration validates progress and retains Keep 24 without losing the live town',()=>{
 const base=structuredClone(JSON.parse(fs.readFileSync(new URL('../LittleHarbourTests/earned-campaigns.json',import.meta.url),'utf8'))[0].expectedTown);
 base.coins=5000;base.stock.tiles=20;B.load(JSON.stringify(base));assert(B.act('["setTarget",["field",24]]'));assert(B.act('["festivalPrepare",[]]'));
 const valid=JSON.parse(B.save());assert.equal(valid.nativeVersion,3);B.load(JSON.stringify(valid));assert.equal(snapshot().workshops.field.target,24);
 const original=B.save();
 for(const festival of [null,{},[],{...valid.festival,stage:0},{...valid.festival,choice:'unknown'},{...valid.festival,baselineRuns:base.ferry.runs+1},{...valid.festival,orders:1},{...valid.festival,visits:{quarry:2,island:2}},{...valid.festival,extra:1}]){
  assert.throws(()=>B.load(JSON.stringify({...valid,festival})));assert.equal(B.save(),original);
 }
 for(const nativeVersion of [1,2,4]){assert.throws(()=>B.load(JSON.stringify({...valid,nativeVersion})));assert.equal(B.save(),original);}
 B.reset();const fresh=B.save();assert.equal(B.act('["festivalPrepare",[]]'),false);assert.equal(B.save(),fresh);
});

test('Both post-ferry festival branches and requests are earned through original production and save checkpoints',()=>{
 const bases=JSON.parse(fs.readFileSync(new URL('../LittleHarbourTests/earned-campaigns.json',import.meta.url),'utf8'));
 const campaigns=JSON.parse(fs.readFileSync(new URL('../LittleHarbourTests/festival-campaigns.json',import.meta.url),'utf8'));
 assert.equal(campaigns.length,2);
 for(const c of campaigns){
  B.load(JSON.stringify(bases.find(b=>b.path===c.path).expectedTown));
  for(const step of c.steps){
   if(step.action)assert(B.act(step.action),step.action);
   if(step.ticks)for(let i=0;i<step.ticks;i++)B.tick(1);
   if(step.reload){const bytes=B.save();B.load(bytes);assert.equal(B.save(),bytes);}
   const before=B.save(),s=snapshot();assert.equal(B.save(),before);
   for(const id of s.guidance.choices)assert(s.actions.some(a=>a.id===id&&a.category===s.guidance.category));
  }
  assert.deepEqual(JSON.parse(B.save()),c.expected);assert.equal(snapshot().festival.choice,c.choice);assert.equal(snapshot().festival.orders,2);
 }
});
