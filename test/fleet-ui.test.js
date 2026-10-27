import test from 'node:test';
import assert from 'node:assert/strict';
import {coastPosition} from '../dist/coast-view.js';
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
