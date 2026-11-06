import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as B from '../bridge.js';
import * as E from '../../dist/engine.js';
import * as R from '../crews.js';
const earned=JSON.parse(fs.readFileSync(new URL('../LittleHarbourTests/city-campaigns.json',import.meta.url)));
const save=()=>JSON.parse(B.save()),snap=()=>JSON.parse(B.snapshot()),act=(f,...a)=>B.act(JSON.stringify([f,a]));
function ready(){const x=structuredClone(earned[0].expected);x.town.jobs=[];x.town.targets={};x.stockTargets={};x.town.speed=1;for(const b of x.town.fleet.boats)if(b){b.trip=null;b.repeat=null;}B.load(JSON.stringify(x));}
function set(team,target){return B.assignCrew(team,target,save().chronicle.crews?.epoch||0);}
function reload(){const s=B.save();B.load(s);assert.equal(B.save(),s);}
function advance(n){while(n>0){const dt=Math.min(1,n);B.tick(dt);n-=dt;}}
test('Crew unlocks are earned; assignment is free, unique, atomic and epoch protected',()=>{
 B.reset();assert(!B.assignCrew(0,'station:mill',0));ready();const before=save().town;assert(set(0,'station:mill'));assert.equal(save().nativeVersion,5);assert.equal(save().town.coins,before.coins);assert.deepEqual(save().town.stock,before.stock);assert.deepEqual(save().town.jobs,before.jobs);reload();
 const bytes=B.save();for(const args of [[0,'boat:0',0],[2,'boat:0',1],[1,'station:mill',1],[1,'station:nope',1],[1,{},1]]){assert(!B.assignCrew(...args));assert.equal(B.save(),bytes);}
 assert(set(1,'boat:0'));assert(set(0,null));reload();assert.equal(save().nativeVersion,5);
 const one=save();one.chronicle.projects.regatta.stage=3;one.chronicle.crews.assignments[1]=null;B.load(JSON.stringify(one));assert.equal(snap().crews.unlocked,1);assert(!set(1,'station:mill'));
});
test('Workshop work accelerates a shared queue once; pause, refits and cancellation keep normal costs and yields',()=>{
 ready();const x=save();x.town.stock.wheat=100;x.town.advancedRefits.mill={tier:3,mode:'yield',epoch:1};B.load(JSON.stringify(x));assert(set(0,'station:mill'));const before=save().town;
 assert(act('start','mill'));assert(act('start','mill'));assert(act('cancel',1));assert(act('start','mill'));const duration=E.recipeDuration(save().town,'mill');assert.equal(snap().jobs[0].duration,duration/1.25);
 assert(!set(0,null));assert(!set(1,'station:mill'));B.speed(0);const paused=B.save();B.tick(60);assert.equal(B.save(),paused);B.speed(1);advance(duration/1.25/2);reload();advance(duration/1.25/2);assert.equal(save().town.jobs.length,1);assert.equal(save().town.jobs[0].left,duration);
 advance(duration/1.25);assert.equal(save().town.jobs.length,0);assert.equal(save().town.stock.wheat,before.stock.wheat-4);assert(save().town.stock.flour>before.stock.flour);assert(set(0,null));
});
test('Busy destinations and repeat routes lock moves; recall preserves supplies and awards nothing',()=>{
 ready();const x=save();x.town.stock.provisions=100;x.town.stock.cloth=100;x.town.stock.wine=100;B.load(JSON.stringify(x));assert(set(0,'boat:0'));const before=save();assert(act('chronicleCitySail',0,before.chronicle.city.serial));assert(!set(0,null));assert(!set(1,'boat:0'));advance(80);reload();assert.equal(save().chronicle.city.voyages[0].left,140);assert.equal(snap().boats[0].trip.left,112);assert(act('chronicleCityRecall',0,before.chronicle.city.serial));assert.deepEqual(save().town.stock,before.town.stock);assert.equal(save().chronicle.city.glaze,before.chronicle.city.glaze);assert(set(0,null));
 assert(act('setRepeatVoyage',0,'quarry',1));assert(!set(1,'boat:0'));assert(act('setRepeatVoyage',0,null));assert(set(1,'boat:0'));
});
test('Crew-assisted real passenger arrivals fulfill an accepted visitor goal exactly once',()=>{
 ready();const x=save();x.town.stock.bread=100;x.town.stock.preserves=100;x.town.stock.provisions=100;x.town.coins=10000;B.load(JSON.stringify(x));const offer=snap().chronicle.offers.find(o=>o.kind===1);assert(act('chronicleAccept',offer.id));
 for(const slot of [0,1]){assert(set(slot,'boat:'+slot));assert(act('startFerryService',slot,slot===0?'quarry':'island'));}
 const duration=Math.max(...snap().boats.filter(b=>b?.trip).map(b=>b.trip.duration));advance(duration);assert.equal(snap().chronicle.offers.find(o=>o.id===offer.id).boats,2);reload();assert(act('chronicleDeliver',offer.id));const bytes=B.save();assert(!act('chronicleDeliver',offer.id));assert.equal(B.save(),bytes);
});
test('An accelerated cargo arrival counts once even when its repeat voyage immediately departs',()=>{
 ready();const x=save();x.town.stock.provisions=100;x.town.stock.bread=100;x.town.stock.preserves=100;
 for(const [item,n] of Object.entries(E.voyagePlan(x.town,0,'quarry',1).cost))x.town.stock[item]=n*4;
 x.chronicle.projects.seawall={branch:0,stage:2,boats:[],eligible:[],routes:[]};B.load(JSON.stringify(x));
 assert(set(0,'boat:0'));assert(act('setRepeatVoyage',0,'quarry',1));assert(act('startVoyage',0,'quarry',1));
 const before=save(),duration=snap().boats[0].trip.duration;advance(duration);const after=save();
 assert(after.town.fleet.boats[0].trip,'The repeat departed normally');assert.equal(after.town.fleet.visits.quarry,before.town.fleet.visits.quarry+1);
 assert.deepEqual(after.chronicle.projects.seawall.boats,[0]);assert.deepEqual(after.chronicle.projects.seawall.routes,['quarry']);
 assert(Math.abs(after.chronicle.elapsed-before.chronicle.elapsed-duration)<0.001,'Season time is not accelerated');
 reload();advance(duration);assert.deepEqual(save().chronicle.projects.seawall.boats,[0]);
});
test('City imports and ceramics use the approved crew rate without extra output or time outside the game',()=>{
 ready();const x=save();x.town.stock.provisions=20;x.town.stock.cloth=20;x.town.stock.wine=20;x.town.stock.jars=20;B.load(JSON.stringify(x));assert(set(0,'boat:0'));assert(set(1,'bench'));let y=save().chronicle.city;assert(act('chronicleCitySail',0,y.serial));advance(191);reload();assert.equal(save().chronicle.city.glaze,y.glaze);advance(1);assert.equal(save().chronicle.city.glaze,y.glaze+6);y=save().chronicle.city;assert(act('chronicleCityCraft',y.serial));assert.equal(snap().chronicle.city.jobDuration,24);advance(23);reload();assert.equal(save().chronicle.city.ceramics,y.ceramics);advance(1);assert.equal(save().chronicle.city.ceramics,y.ceramics+2);
});
test('Malformed, downgraded and future crew saves reject without changing live bytes; old build 16 protects envelope 5',()=>{
 ready();const old=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('../LittleHarbourTests/legacy-engine-v16.js',import.meta.url),'utf8'),old);const v4=B.save();old.Harbour.load(v4);assert(set(0,'station:mill'));const bytes=B.save();assert.throws(()=>old.Harbour.load(bytes),/newer app/);assert.equal(old.Harbour.save(),v4);
 for(const mutate of [x=>x.nativeVersion=4,x=>x.nativeVersion=6,x=>x.chronicle.crews.epoch=-1,x=>x.chronicle.crews.assignments[1]='station:mill',x=>x.chronicle.crews.assignments[0]='boat:99',x=>x.chronicle.crews.assignments.push(null),x=>x.chronicle.crews.extra=true,x=>delete x.chronicle.crews]){const raw=save();mutate(raw);assert.throws(()=>B.load(JSON.stringify(raw)));assert.equal(B.save(),bytes);}
 assert(!JSON.parse(B.browserSave()).crews);assert.equal(JSON.parse(B.browserSave()).version,14);reload();
});
test('No crew preserves original simulation; invalid rates cannot accelerate; fixed queues respect equivalent tick budgets',()=>{
 const base=E.fresh();base.ripe=false;base.stock.wheat=20;E.start(base,'mill');E.start(base,'mill');const normal=structuredClone(base),explicit=structuredClone(base);E.tick(normal,7);E.tick(explicit,7,undefined,{});assert.deepEqual(normal,explicit);const invalid=structuredClone(base);E.tick(invalid,7,undefined,{stations:{mill:Infinity}});assert.deepEqual(invalid,normal);
 const large=structuredClone(base),small=structuredClone(base);E.tick(large,12.8,undefined,{stations:{mill:R.RATE}});for(let i=0;i<16;i++)E.tick(small,0.8,undefined,{stations:{mill:R.RATE}});assert.deepEqual(large.stock,small.stock);assert.deepEqual(large.jobs,small.jobs);assert.equal(large.milled,small.milled);
});
test('Generated runtime matches ESM through assignments, production, reload and export',()=>{
 ready();const context=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('../LittleHarbour/Resources/engine-bundle.js',import.meta.url),'utf8'),context);const G=context.Harbour;G.load(B.save());assert(set(0,'station:mill'));assert(G.assignCrew(0,'station:mill',0));assert.equal(G.save(),B.save());assert.equal(G.snapshot(),B.snapshot());for(const H of [B,G]){H.tick(1);const bytes=H.save();H.load(bytes);}assert.equal(G.save(),B.save());assert.equal(G.browserSave(),B.browserSave());
});
