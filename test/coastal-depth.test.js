import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleTown} from '../dist/demo-town.js';
import {selectOrder,dispatch,buyBoat,tick,parseSave,boatCargoCapacity,circuitPlan,circuitBlocker,startCircuit,startVoyage,cancelVoyage,setRepeatVoyage,reserveFor,goalCost,goalTitle,voyagePlan,installBoatUpgrade,coastalProjectBlocker,fundCoastalProject,commissionPlan,completeCommission,commissionBlocker,COASTAL_PROJECTS} from '../dist/engine.js';
const stops=(a=1,b=1)=>[{route:'quarry',tier:a},{route:'island',tier:b}];
function town(){const s=sampleTown();selectOrder(s,'inland');assert(dispatch(s));s.coins=20000;for(const k of Object.keys(s.stock))s.stock[k]=1000;assert(buyBoat(s,0,'cutter'));return s;}
function completeTrip(s){while(s.fleet.boats[0].trip)tick(s,60);}
function experienced(){const s=town();for(let i=0;i<8;i++){assert(startCircuit(s,0,stops()));completeTrip(s);}s.fleet.lighthouse.stage=3;return s;}

test('Circuit cargo limits create explicit tier tradeoffs and reject impossible spending atomically',()=>{
 const s=experienced();assert.equal(boatCargoCapacity(s,0),20);assert.equal(circuitPlan(s,0,stops()).used,18);assert.equal(circuitPlan(s,0,stops(3,1)).used,28);assert.match(circuitBlocker(s,0,stops(3,1)),/28 cargo/);const before=JSON.stringify(s);assert(!startCircuit(s,0,stops(3,1)));assert.equal(JSON.stringify(s),before);
 assert(installBoatUpgrade(s,0,'cargo'));assert.equal(boatCargoCapacity(s,0),30);assert.equal(circuitBlocker(s,0,stops(3,1)),'');assert.match(circuitBlocker(s,0,stops(3,3)),/36 cargo/);
 assert(fundCoastalProject(s,'quarry',0));assert(fundCoastalProject(s,'quarry',1));assert.equal(boatCargoCapacity(s,0),39);assert.equal(circuitBlocker(s,0,stops(3,3)),'');
 for(const invalid of [null,[],stops(0),stops(4),[{route:'island',tier:1},{route:'quarry',tier:1}], [{route:'quarry',tier:1},{route:'quarry',tier:1}]])assert.equal(circuitPlan(s,0,invalid),null);
});
test('A circuit reserves both cargoes, pauses, reloads, settles both visits once and preserves captured returns',()=>{
 let s=town();const p=circuitPlan(s,0,stops());assert(reserveFor(s,p.goal));assert.match(goalTitle(s,p.goal),/circuit/);assert(startCircuit(s,0,stops()));assert(!s.reservations[p.goal]);assert.equal(goalCost(s,p.goal),null);const coins=s.coins,stock={...s.stock};s.speed=0;tick(s,60);assert.equal(s.fleet.boats[0].trip.left,p.duration);s=parseSave(JSON.stringify(s));s.speed=1;completeTrip(s);assert.equal(s.coins,coins+p.reward.coins);for(const k of ['wood','stone'])assert.equal(s.stock[k],stock[k]+p.reward[k]);assert.deepEqual(s.fleet.visits,{quarry:1,island:1});tick(s,60);assert.deepEqual(s.fleet.visits,{quarry:1,island:1});assert.deepEqual(parseSave(JSON.stringify(s)),s);
});
test('Circuit recall refunds both stops only once and switching from repeat runs clears automation',()=>{
 const s=experienced();assert(setRepeatVoyage(s,0,'quarry',2));const before={stock:{...s.stock},coins:s.coins,visits:{...s.fleet.visits}};assert(startCircuit(s,0,stops(2,2)));assert.equal(s.fleet.boats[0].repeat,null);tick(s,1);assert(cancelVoyage(s,0));assert.deepEqual(s.stock,before.stock);assert.equal(s.coins,before.coins);assert.deepEqual(s.fleet.visits,before.visits);assert(!cancelVoyage(s,0));
});
test('Destination projects enforce visits, consume own funding, grant lasting bonuses and leave paid trips untouched',()=>{
 const s=town();assert.match(coastalProjectBlocker(s,'quarry'),/3 visits/);const snapshot=JSON.stringify(s);assert(!fundCoastalProject(s,'quarry',0));assert.equal(JSON.stringify(s),snapshot);for(let i=0;i<3;i++){assert(startCircuit(s,0,stops()));completeTrip(s);}
 const baseline=voyagePlan(s,0,'quarry');assert(startVoyage(s,0,'quarry'));const trip=structuredClone(s.fleet.boats[0].trip);assert(reserveFor(s,'coastal:quarry:0'));const coins=s.coins;assert(fundCoastalProject(s,'quarry',0));assert.equal(s.coins,coins-COASTAL_PROJECTS.quarry[0].cost.coins);assert(!s.reservations['coastal:quarry:0']);assert(!fundCoastalProject(s,'quarry',0));assert.deepEqual(s.fleet.boats[0].trip,trip);assert(voyagePlan(s,0,'quarry').reward.stone>baseline.reward.stone);assert.deepEqual(parseSave(JSON.stringify(s)),s);
});
test('Completed settlements provide rotating commissions with stale-click protection and protected supplies',()=>{
 const s=experienced();assert(commissionBlocker(s,'island'));for(const route of ['quarry','island'])for(let stage=0;stage<3;stage++)assert(fundCoastalProject(s,route,stage));assert(voyagePlan(s,0,'island').reward.coins>340);assert(voyagePlan(s,0,'quarry').duration<30);
 const p=commissionPlan(s,'island'),coins=s.coins;assert(reserveFor(s,p.goal));assert.equal(commissionBlocker(s,'island'),'');assert(completeCommission(s,'island',0));assert.equal(s.coins,coins+p.reward.coins);assert.notEqual(commissionPlan(s,'island').name,p.name);const snapshot=JSON.stringify(s);assert(!completeCommission(s,'island',0));assert.equal(JSON.stringify(s),snapshot);assert(completeCommission(s,'island',1));assert(completeCommission(s,'island',2));assert.equal(commissionPlan(s,'island').name,p.name);assert.deepEqual(parseSave(JSON.stringify(s)),s);
});
test('Version9 paid voyages migrate intact while malformed development and circuit snapshots are rejected',()=>{
 const old=town();assert(startVoyage(old,0,'quarry'));old.version=9;delete old.fleet.development;delete old.fleet.commissions;const loaded=parseSave(JSON.stringify(old));assert.equal(loaded.version,12);assert.deepEqual(loaded.fleet.boats,old.fleet.boats);assert.deepEqual(loaded.fleet.development,{quarry:0,island:0});
 const s=town();assert(startCircuit(s,0,stops()));for(const mutate of [x=>delete x.fleet.development,x=>x.fleet.development.quarry=1,x=>x.fleet.commissions.island=1,x=>x.fleet.boats[0].trip.stops[1].route='quarry',x=>x.fleet.boats[0].trip.stops[1].tier=3,x=>x.fleet.boats[0].trip.stops.push({route:'quarry',tier:1})]){const bad=structuredClone(s);mutate(bad);assert.throws(()=>parseSave(JSON.stringify(bad)));}
});
test('Reserved competing supplies block circuit and commission spends without partial payment',()=>{
 const s=experienced();s.stock.preserves=8;assert(reserveFor(s,'trade:inland'));const before=JSON.stringify(s);assert(circuitBlocker(s,0,stops()));assert(!startCircuit(s,0,stops()));assert.equal(JSON.stringify(s),before);
 const c=experienced();for(let i=0;i<3;i++)assert(fundCoastalProject(c,'island',i));c.stock.preserves=6;assert(reserveFor(c,'trade:inland'));const snapshot=JSON.stringify(c);assert(commissionBlocker(c,'island'));assert(!completeCommission(c,'island',0));assert.equal(JSON.stringify(c),snapshot);
});
