import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as B from '../bridge.js';
import * as E from '../../dist/engine.js';
import {sampleTown} from '../../dist/demo-town.js';
import {worldEntities} from '../../dist/world-model.js';
const late=JSON.parse(fs.readFileSync(new URL('../LittleHarbourTests/late-town.json',import.meta.url),'utf8'));
const preQuay=E.fresh();Object.assign(preQuay,{deliveries:2,coins:1000,expansion:'fishing',businesses:['fishing']});
const fixtures=[E.fresh(),preQuay,sampleTown(),late];
const snapshot=()=>JSON.parse(B.snapshot());
const nativeTown=()=>JSON.parse(B.browserSave());
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
test('Known browser schemas 1 through 13 migrate through authoritative parser',()=>{
 for(let version=1;version<=13;version++){const s=E.fresh();s.version=version;B.load(JSON.stringify(s));assert.equal(nativeTown().version,13);assert.equal(nativeTown().coins,80);}
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
 assert.equal(snapshot().guidance.category,'Ambitions','The earned final chapter opens optional ambitions');
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
 assert.throws(()=>B.load(JSON.stringify({...valid,nativeVersion:3})));assert.equal(B.save(),before);
 B.reset();assert.equal(JSON.parse(B.save()).nativeVersion,1);assert.equal(B.act(JSON.stringify(['setTarget',['field',24]])),false);
});
