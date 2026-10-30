import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh} from '../dist/engine.js';
import {sampleTown} from '../dist/demo-town.js';
import {CHAPTERS,currentObjective} from '../dist/progression.js';
import {ferryEntryView} from '../dist/ferry-ui.js';
test('One five-chapter objective derives from existing progression without changing saves',()=>{
 assert.equal(CHAPTERS.length,5);const s=fresh(),before=JSON.stringify(s);
 assert.equal(currentObjective(s).chapter,1);assert.equal(JSON.stringify(s),before);
 s.pier=true;assert.equal(currentObjective(s).chapter,2);
 const late=sampleTown();assert.equal(currentObjective(late).chapter,3);
 late.inland.shipments=1;assert.equal(currentObjective(late).chapter,4);
 assert.equal(currentObjective(late).target,'fleet');
});
test('A neighbourhood unlock cannot hide incomplete lighthouse work',()=>{
 const s=sampleTown();s.inland.shipments=1;s.fleet.boats[0]={type:'cutter',trip:null};s.fleet.visits={quarry:3,island:3};s.neighbourhood.access=true;
 let g=currentObjective(s);assert.equal(g.target,'fleet');assert.equal(g.section,'lighthouse');
 s.fleet.lighthouse.stage=1;g=currentObjective(s);assert.equal(g.target,'fleet');assert.equal(g.section,'lighthouse');
 s.fleet.lighthouse.stage=3;assert.equal(currentObjective(s).target,'neighbourhood');
});
test('Civic prerequisites lead to ferry then completed open play; early ferry card is absent',()=>{
 assert.equal(ferryEntryView(fresh()),'');const s=sampleTown();s.inland.shipments=1;s.fleet.lighthouse.stage=3;s.fleet.visits.quarry=3;s.neighbourhood.access=true;
 s.neighbourhood.plots=[{type:'carpenter'},{type:'flaxgarden'},{type:'weaver'},{type:'home',level:1},{type:'sailmaker'},null];s.fleet.boats[0]={sails:true};s.residents={proposal:'garden',delivered:3};
 assert.equal(currentObjective(s).chapter,5);assert.equal(currentObjective(s).target,'ferry');assert(ferryEntryView(s).includes('CHAPTER 05'));
 s.ferry.stage=3;s.ferry.runs=1;assert(currentObjective(s).complete);
});
