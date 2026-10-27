import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as engine from '../dist/engine.js';
import * as planning from '../dist/planning.js';
import * as inlandMap from '../dist/inland-map.js';
import * as districts from '../dist/districts.js';

// Test text templates independently of browser rendering. This catches missing
// branch-specific bindings without claiming to validate layout or touch input.
const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .*\n/gm,'').replace(/\ninit\(\);\s*$/,'');
const context=vm.createContext({...engine,...districts,...planning,...inlandMap,matchMedia(){return {matches:false};},localStorage:{getItem(){return null;},setItem(){},removeItem(){}}});
vm.runInContext(source+'\nfunction snapshot(s,selected,pin=null){state=s;station=selected;pinnedGoal=pin;marketSelection=null;return {production:production(),trade:tradePanel(),build:buildPanel(),contracts:contractsPanel(),quick:quickActions(),waterfront:waterfrontPanel(),market:marketPanel(),marketMap:marketMapMarkup(),inland:inlandPanel(),inlandMap:inlandMapMarkup(),courtyard:courtyardCard(),plan:planPanel(),return: (returnContext=null,returnPanel())};}\nfunction setReturn(goal){returnContext=null;rememberReturn(goal);return returnPanel();}\nfunction openGoalSnapshot(s,id){state=s;render=()=>{};openGoal(id);return {tab,station,marketSelection,return:returnPanel()};}',context);
vm.runInContext('function ledgerSnapshot(s,query,presets=[null,null,null]){state=s;station="ledger";ledgerQuery=query;targetPresets=presets;return production();}',context);
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
 assert(p.market.includes('PLOT 1'));assert(p.market.includes('PLOT 2'));assert(p.market.includes('MARKET · COURTYARD'));
 assert(p.marketMap.includes('Fishmonger'));assert(p.marketMap.includes('Harbour kitchen'));assert(p.marketMap.includes('Market courtyard'));
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


test('Production ledger escapes search input, filters goods and exposes recipe sources',()=>{
 const s=mature();s.stock.flour=0;
 const html=context.ledgerSnapshot(s,'bread');
 assert(html.includes('Production ledger'));
 assert.match(html, /data-ledger-search="bake bread bread bakery" >/, 'bread result remains visible');
 assert.match(html, /data-ledger-search="mill flour flour mill" hidden/, 'nonmatching recipe is hidden');
 assert(html.includes('Find flour →'));
 assert(html.includes('data-station="bakery"'));
 assert(html.includes('stored</span>'));assert(html.includes('reserved</span>'));assert(html.includes('incoming</span>'));
 const escaped=context.ledgerSnapshot(s,'"/><img src=x onerror=alert(1)>');
 assert(!escaped.includes('<img'));assert(escaped.includes('&quot;/&gt;&lt;img'));
 assert.match(escaped, /id="ledgerEmpty" class="hint" >No matching/);
});

test('Saved target plan controls distinguish empty slots and describe replacement semantics',()=>{
 const s=mature();
 let html=context.ledgerSnapshot(s,'',[{mill:12,bakery:6},null,{}]);
 assert(html.includes('Mill flour 12 · Bake bread 6'));
 assert.match(html,/data-action="preset-save" data-slot="0">Replace/);
 assert.match(html,/data-action="preset-apply" data-slot="1" disabled/);
 assert.match(html,/data-action="preset-apply" data-slot="2" >Apply/);
 assert(html.includes('All targets off'));assert(html.includes('paid batches'));
 html=context.ledgerSnapshot(engine.fresh(),'');assert(!html.includes('Saved production plans'));
});


function inlandTown(){const s=marketTown();s.market.businesses.fishmonger.deliveries=3;s.coins=3000;s.stock.wood=300;s.stock.stone=300;return s;}
test('Inland panels show locked access, construction, both terrace choices and workshop outputs',()=>{
 const locked=snapshots(engine.fresh(),'overview').inland;assert(locked.includes('Supply one market business three times first.'));
 const s=inlandTown();assert(engine.inlandAccess(s));let p=snapshots(s,'overview');assert(p.inland.includes('data-inland-time="path"'));
 engine.tick(s,12);p=snapshots(s,'overview');for(const crop of ['orchard','garden'])assert(p.inland.includes('data-key="'+crop+'"'));assert(p.inland.includes('This choice fixes the crop'));
 assert(engine.buildTerrace(s,0,'orchard'));assert(engine.buildTerrace(s,1,'garden'));assert(engine.buildKiln(s));p=snapshots(s,'overview');assert(p.inland.includes('data-inland-time="terrace0"'));assert(p.inland.includes('data-inland-time="kiln"'));engine.tick(s,12);
 for(const station of ['terrace0','terrace1','claypit','kiln','preserving','ledger']){p=snapshots(s,station);for(const [name,html]of Object.entries(p)){assert(!html.includes('undefined'),name+' / '+station);assert(!html.includes('NaN'),name+' / '+station);}}
 assert(p.inland.includes('Valle Serena'));assert(p.inland.includes('Prepare inland shipment'));
 assert(snapshots(s,'kiln').production.includes('Fire jars'));assert(snapshots(s,'kiln').production.includes('Fire tiles'));
 assert(snapshots(s,'preserving').production.includes('Preserve fruit'));assert(snapshots(s,'preserving').production.includes('Preserve vegetables'));
});

test('Courtyard construction and upgraded local payouts agree with engine rewards',()=>{
 const s=inlandTown();engine.inlandAccess(s);engine.tick(s,12);engine.buildTerrace(s,0,'orchard');engine.buildKiln(s);engine.tick(s,12);s.inland.shipments=1;s.stock.tiles=12;
 assert(engine.buildCourtyard(s));let p=snapshots(s,'overview');assert(p.courtyard.includes('data-inland-time="courtyard"'));engine.tick(s,12);p=snapshots(s,'overview');assert(p.courtyard.includes('local earnings +25%'));
 assert(p.market.includes('75 coins'));assert(p.market.includes('113 coins'));
});

test('Workshop queues show only local jobs while preserving global action indices',()=>{
 const s=mature();s.stock.wheat=4;s.stock.flour=4;
 assert(engine.start(s,'mill'));assert(engine.start(s,'bakery'));assert(engine.start(s,'mill'));assert(engine.start(s,'bakery'));
 const html=snapshots(s,'bakery').production;
 const queue=html.slice(html.indexOf('<div class="queue">'));
 assert(!queue.includes('Mill flour'));assert(queue.includes('Bake bread'));
 assert(queue.includes('data-jobtime="1"'));assert(queue.includes('data-jobtime="3"'));
 assert(!queue.includes('data-jobtime="0"'));assert(!queue.includes('data-jobtime="2"'));
 assert(queue.includes('data-action="cancel" data-index="3"'));
});


test('Inland map reveals authored crops and workshops only when their construction completes',()=>{
 const s=inlandTown();let html=snapshots(s,'overview').inlandMap;
 assert(html.includes('Path needed'));assert(!html.includes('data-crop-plot'));assert(!html.includes('class="inland-built"'));assert(!html.includes('data-station="claypit"'));
 engine.inlandAccess(s);engine.tick(s,12);html=snapshots(s,'overview').inlandMap;assert(html.includes('data-station="claypit"'));assert(html.includes('Choose crop'));
 engine.buildTerrace(s,0,'orchard');engine.buildTerrace(s,1,'garden');engine.buildKiln(s);html=snapshots(s,'overview').inlandMap;
 assert(html.includes('Planting'));assert(html.includes('Under construction'));assert(html.includes('data-inland-time="terrace0"'));assert(!html.includes('class="inland-built"'));assert(!html.includes('data-station="kiln"'));assert(!html.includes('data-crop-plot'));
 engine.tick(s,12);html=snapshots(s,'overview').inlandMap;
 for(const name of ['Fruit orchard','Kitchen garden','Pottery kiln','Preserving room'])assert(html.includes(name));
 for(const station of ['terrace0','terrace1','kiln','preserving'])assert(html.includes('data-station="'+station+'"'));
 assert(html.includes('data-crop-plot="0"'));assert(html.includes('data-crop-plot="1"'));assert(html.includes('clip-path:polygon('));
 assert.equal((html.match(/class="inland-built"/g)||[]).length,2);
 assert(!html.includes('undefined'));assert(!html.includes('NaN'));
 s.inland.shipments=1;s.stock.tiles=12;engine.buildCourtyard(s);let market=snapshots(s,'overview').marketMap;assert(market.includes('Tiling in progress'));assert(!market.includes('class="courtyard-paving"'));engine.tick(s,12);market=snapshots(s,'overview').marketMap;assert(market.includes('Local earnings +25%'));assert(market.includes('class="courtyard-paving"'));
});
