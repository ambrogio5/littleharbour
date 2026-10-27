import test from 'node:test';
import assert from 'node:assert/strict';
import {coastPosition,coastTripPath} from '../dist/coast-view.js';
import {COAST_BERTHS,COAST_BERTH_ROUTES,COAST_DESTINATIONS} from '../dist/coast-map.js';

test('Coastal movement follows path distance and clamps a route to its endpoints',()=>{
 const route=[[0,0],[10,0],[10,30]];
 assert.deepEqual(coastPosition(route,-1),{x:0,y:0,angle:0});
 assert.deepEqual(coastPosition(route,.5),{x:10,y:10,angle:90});
 assert.deepEqual(coastPosition(route,2),{x:10,y:30,angle:90});
});

test('Both assigned berth routes begin at the correct boat and reach the destination landing',()=>{
 for(const [destination,routes]of Object.entries(COAST_BERTH_ROUTES))for(const [slot,route]of routes.entries()){
  const start=coastPosition(route,0),end=coastPosition(route,1);
  assert.equal(start.x,COAST_BERTHS[slot].native.x);assert.equal(start.y,COAST_BERTHS[slot].native.y);
  assert(Math.abs(end.x-COAST_DESTINATIONS[destination].landing.x)<1e-9);assert(Math.abs(end.y-COAST_DESTINATIONS[destination].landing.y)<1e-9);
  for(const fraction of [.1,.5,.9])for(const value of Object.values(coastPosition(route,fraction)))assert(Number.isFinite(value));
 }
});


test('Voyage paths return to their assigned berth and circuits visit both landing points in order',()=>{
 for(const slot of [0,1]){
  const home=[COAST_BERTHS[slot].native.x,COAST_BERTHS[slot].native.y];
  for(const route of ['quarry','island']){const path=coastTripPath({route},slot);assert.deepEqual(path[0],home);assert.deepEqual(path.at(-1),home);assert(path.some(p=>p[0]===COAST_DESTINATIONS[route].landing.x&&p[1]===COAST_DESTINATIONS[route].landing.y));}
  const path=coastTripPath({route:'quarry',stops:[{route:'quarry',tier:1},{route:'island',tier:1}]},slot),quarry=path.findIndex(p=>p[0]===516&&p[1]===259),island=path.findIndex(p=>p[0]===584&&p[1]===690);
  assert.deepEqual(path[0],home);assert.deepEqual(path.at(-1),home);assert(quarry>0);assert(island>quarry);assert.deepEqual(path.filter(p=>p[0]===home[0]&&p[1]===home[1]),[home,home]);
 }
});
