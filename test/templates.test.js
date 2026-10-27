import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as engine from '../dist/engine.js';

// Test text templates independently of browser rendering. This catches missing
// branch-specific bindings without claiming to validate layout or touch input.
const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .*\n/gm,'').replace(/\ninit\(\);\s*$/,'');
const context=vm.createContext({...engine,localStorage:{getItem(){return null;}}});
vm.runInContext(source+'\nfunction snapshot(s,selected){state=s;station=selected;return {production:production(),trade:tradePanel(),build:buildPanel(),contracts:contractsPanel(),quick:quickActions(),waterfront:waterfrontPanel()};}',context);
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

test('Overview and quick controls expose ready, queued and paused production accurately',()=>{
 const s=engine.fresh();let panels=snapshots(s,'overview');
 assert(panels.production.includes('Harvest + plant'));assert(panels.quick.includes('Harvest & replant'));
 engine.harvestReplant(s);engine.queueBatch(s,'mill',2);s.speed=0;
 panels=snapshots(s,'overview');assert(panels.production.includes('2 / 2 slots in use'));assert(panels.production.includes('4 in production'));
 assert(panels.quick.includes('Wheat growing'));assert(!panels.quick.includes('data-action="dispatch"'));
 s.stock.bread=4;panels=snapshots(s,'bakery');assert(panels.quick.includes('Dispatch to Cala Verde'));
 assert(panels.quick.includes('data-action="dispatch"'));
});
test('Missing goods show incoming production and each source shortcut',()=>{
 const s=engine.fresh();s.stock.flour=4;engine.queueBatch(s,'bakery',2);
 const panels=snapshots(s,'overview');assert(panels.trade.includes('4 in production'));
 assert(panels.trade.includes('View queue'));assert(panels.trade.includes('data-key="bread"'));
 const matureTown=mature();matureTown.specialisation='estate';matureTown.specialists=['estate'];
 matureTown.contract={id:'restaurants',shipped:1};
 const late=snapshots(matureTown,'overview');assert(late.production.includes('Cellar'));
 for(const key of ['oil','wine','bread'])assert(late.contracts.includes('data-key="'+key+'"'));
 assert(late.quick.includes('View current contract'));
});

test('Restoration panels explain funding, deliveries, construction and the unlocked route',()=>{
 const s=mature();Object.assign(s,{charter:true,specialisation:'estate',specialists:['estate'],contractsDone:['restaurants','merchants'],coins:1000});s.stock.wood=100;s.stock.stone=100;
 let html=snapshots(s,'overview').waterfront;assert(html.includes('Fund sea wall'));assert(html.includes('Restoration plan · finished waterfront'));assert(html.includes('4 bread · 2 olive oil per delivery'));
 assert(engine.fundWaterfront(s,0));html=snapshots(s,'overview').waterfront;assert(html.includes('SUPPLY DELIVERY 1 OF 2'));
 for(let delivery=0;delivery<2;delivery++){s.stock.bread=4;s.stock.oil=2;engine.supplyWaterfront(s,0,delivery);}
 html=snapshots(s,'overview').waterfront;assert(html.includes('data-waterfronttime'));assert(!html.includes('data-action="waterfront-fund"'));
 engine.tick(s,12);html=snapshots(s,'overview').waterfront;assert(html.includes('Fund public landing'));
 s.waterfront={path:'estate',stage:3,funded:false,delivered:0,left:0};html=snapshots(s,'overview').waterfront;assert(html.includes('Porto Grande is open'));assert(html.includes('384 coins'));assert(html.includes('waterfront-trade'));
});
