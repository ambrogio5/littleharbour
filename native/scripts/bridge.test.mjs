import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as B from '../bridge.js';
import * as E from '../../dist/engine.js';
import {sampleTown} from '../../dist/demo-town.js';
import {worldEntities} from '../../dist/world-model.js';
const late=JSON.parse(fs.readFileSync(new URL('../LittleHarbourTests/late-town.json',import.meta.url),'utf8'));
const snapshot=()=>JSON.parse(B.snapshot());
const nativeTown=()=>JSON.parse(B.browserSave());
test('Every exposed enabled economic action equals the original engine transaction',()=>{
 let count=0;
 for(const fixture of [E.fresh(),sampleTown(),late]){
  B.load(JSON.stringify(fixture));const ids=snapshot().actions.filter(a=>a.enabled).map(a=>a.id);
  for(const id of ids){
   B.load(JSON.stringify(fixture));const [fn,args]=JSON.parse(id),expected=structuredClone(fixture);
   assert(E[fn](expected,...args),id); assert(B.act(id),id);
   assert.deepEqual(nativeTown(),E.parseSave(JSON.stringify(expected)),id);count++;
  }
 }
 assert(count>180);console.log(`${count} native adapter transactions matched original engine behavior.`);
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
