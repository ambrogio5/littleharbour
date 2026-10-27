import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as engine from '../dist/engine.js';
import * as districts from '../dist/districts.js';

// Test text templates independently of browser rendering. This catches missing
// branch-specific bindings without claiming to validate layout or touch input.
const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .*\n/gm,'').replace(/\ninit\(\);\s*$/,'');
const context=vm.createContext({...engine,...districts,matchMedia(){return {matches:false};},localStorage:{getItem(){return null;},setItem(){},removeItem(){}}});
vm.runInContext(source+'\nfunction snapshot(s,selected,pin=null){state=s;station=selected;pinnedGoal=pin;return {production:production(),trade:tradePanel(),build:buildPanel(),contracts:contractsPanel(),quick:quickActions(),waterfront:waterfrontPanel(),market:marketPanel(),marketMap:marketMapMarkup(),plan:planPanel(),return: (returnContext=null,returnPanel())};}\nfunction setReturn(goal){returnContext=null;rememberReturn(goal);return returnPanel();}\nfunction openGoalSnapshot(s,id){state=s;render=()=>{};openGoal(id);return {tab,station,marketSelection,return:returnPanel()};}',context);
function snapshots(s,station,pin=null){return context.snapshot(s,station,pin);}
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

function marketTown(){
 const s=mature();Object.assign(s,{charter:true,specialisation:'maritime',specialists:['boatyard'],contractsDone:['fleet','refit'],coins:1000});
 s.stock.wood=100;s.stock.stone=100;s.waterfront={path:'maritime',stage:3,funded:false,delivered:0,left:0};
 assert(engine.marketAccess(s));engine.tick(s,12);assert(engine.buildMarketBusiness(s,'fishmonger',0));assert(engine.buildMarketBusiness(s,'kitchen',1));engine.tick(s,8);return s;
}

test('Market entry, road work, fixed plots, completed shops and provisions station render safely',()=>{
 const s=marketTown();
 // Exercise access construction before shop branches by restoring just this authored predecessor state.
 s.market={access:true,left:4,plots:[null,null,null],businesses:{}};
 let p=snapshots(s,'overview');assert(p.market.includes('Road crew on site'));assert(p.market.includes('data-market-roadtime'));assert(p.marketMap.includes('Road access required'));
 s.market.left=0;assert(engine.buildMarketBusiness(s,'fishmonger',0));assert(engine.buildMarketBusiness(s,'kitchen',1));engine.tick(s,8);
 p=snapshots(s,'kitchen');assert(p.production.includes('Prepare 4 provisions'));assert(p.production.includes('2 bread + 2 oil'));
 assert(p.market.includes('PLOT 1'));assert(p.market.includes('PLOT 2'));assert(p.market.includes('PLOT 03'));
 assert(p.marketMap.includes('Fishmonger'));assert(p.marketMap.includes('Harbour kitchen'));assert(p.marketMap.includes('Future courtyard'));
 for(const [name,html] of Object.entries(p)){assert(!html.includes('undefined'),name);assert(!html.includes('NaN'),name);}
 assert(p.marketMap.includes('clip-path:polygon('),'built shop overlay should use its authored builtClip');
});

test('Reservation-aware market and route controls keep a rival project disabled and own holds usable',()=>{
 const s=marketTown();s.stock.fish=4;s.stock.bread=4;
 assert(engine.reserveFor(s,'trade:local'));
 let p=snapshots(s,'overview');assert(p.market.includes('disabled>Supply one local order'));assert(p.marketMap.includes('Awaiting goods'));
 assert(engine.releaseReservation(s,'trade:local'));assert(engine.reserveFor(s,'market:fishmonger'));
 p=snapshots(s,'overview');assert(p.market.includes('4 / 4 available'));assert(p.market.includes('data-action="market-deliver"'));
 const fishButton=p.market.match(/<button class="button" data-action="market-deliver" data-key="fishmonger"[^>]*>/)?.[0]||'';
 assert(!fishButton.includes('disabled'));assert(p.plan.includes('Pinned')===false);
 const pin=snapshots(s,'overview','market:fishmonger');assert(pin.plan.includes('PINNED REQUIREMENTS'));assert(pin.plan.includes('Fish'));
 for(const [name,html]of Object.entries(p)){assert(!html.includes('undefined'),name);assert(!html.includes('NaN'),name);}
});

test('Kitchen ingredient shortcut preserves the market order return context without changing goods',()=>{
 const s=marketTown();s.stock.provisions=0;s.stock.bread=1;s.stock.oil=0;
 const before=JSON.stringify(s);const notice=context.setReturn('market:kitchen');
 assert(notice.includes('Return to Harbour kitchen'));assert.equal(JSON.stringify(s),before);
 const opened=context.openGoalSnapshot(s,'market:kitchen');assert.equal(opened.tab,'market');assert.equal(opened.marketSelection,'kitchen');assert.equal(opened.return,'');assert.equal(JSON.stringify(s),before);
});
