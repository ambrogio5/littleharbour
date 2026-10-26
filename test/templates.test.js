import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as engine from '../dist/engine.js';

// Test text templates independently of browser rendering. This catches missing
// branch-specific bindings without claiming to validate layout or touch input.
const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .*\n/gm,'').replace(/\ninit\(\);\s*$/,'');
const context=vm.createContext({...engine,localStorage:{getItem(){return null;}}});
vm.runInContext(source+'\nfunction snapshot(s,selected){state=s;station=selected;return {production:production(),trade:tradePanel(),build:buildPanel(),contracts:contractsPanel()};}',context);
function snapshots(s,station){return context.snapshot(s,station);}
function mature(){const s=engine.fresh();s.deliveries=2;s.pier=true;s.expansion='fishing';s.businesses=['fishing','olive'];return s;}
test('Opening and upgraded-town panels render all supported branches',()=>{
 const base=snapshots(engine.fresh(),'field');assert(base.production.includes('Harvest 6 wheat'));assert(base.contracts.includes('Choose town direction'));
 for(const path of ['maritime','estate']){
  const s=mature(),p=engine.PATHS[path];s.specialisation=path;s.specialists=[p.station];
  for(const state of ['constructing','ready','contract','charter']){
   s.construction=state==='constructing'?[{type:p.station,left:4}]:[];
   s.contract=state==='contract'?{id:path==='maritime'?'fleet':'restaurants',shipped:1}:null;
   s.charter=state==='charter';
   if(s.charter)s.contractsDone=path==='maritime'?['fleet','refit']:['restaurants','merchants'];
   const panels=snapshots(s,p.station);
   for(const[name,html]of Object.entries(panels)){assert(!html.includes('undefined'),name+' / '+path+' / '+state);assert(!html.includes('NaN'),name+' / '+path+' / '+state);}
   if(state==='constructing')assert(panels.production.includes('Taking shape.'));
   if(state==='contract')assert(panels.contracts.includes('SHIPMENT 2'));
   if(state==='charter')assert(panels.build.includes('Charter earned'));
  }
 }
});
