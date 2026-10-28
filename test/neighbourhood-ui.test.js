import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../dist/engine.js';
import {sampleTown} from '../dist/demo-town.js';
import {neighbourhoodPanelView,neighbourhoodMapView} from '../dist/neighbourhood-ui.js';
const ui=(plot=0,section='overview',moveFrom=null)=>({plot,section,moveFrom});
const view={costs:c=>Object.entries(c).map(([k,n])=>`${n} ${k}`).join(' · '),ingredients:(c,goal='')=>`<p data-goal="${goal}">${Object.keys(c).join(', ')}</p>`,goalTools:g=>`<button data-goal="${g}">Reserve supplies</button>`,resourceIcon:k=>`<i>${k}</i>`,recipeButton:(k,name)=>`<button data-key="${k}">${name}</button>`,autoControl:k=>`<button data-target="${k}">Target</button>`};
function eligible(){const s=sampleTown();s.inland.shipments=1;s.coins=10000;for(const k of Object.keys(s.stock))s.stock[k]=200;engine.buyBoat(s,0,'cutter');s.fleet.visits.quarry=3;return engine.parseSave(JSON.stringify(s));}
function opened(){const s=eligible();assert(engine.openNeighbourhood(s));return s;}
function build(s,i,type){assert(engine.buyNeighbourhoodPlot(s,i));assert(engine.buildNeighbourhood(s,i,type));}
function panel(s,selection=ui()){const html=neighbourhoodPanelView(s,selection,view);assert(!html.includes('undefined'));assert(!html.includes('NaN'));return html;}

test('Neighbourhood entry exposes coastal prerequisite and distinct land and building purchase stages',()=>{
 let html=panel(engine.fresh());assert.match(html,/neigh-open" disabled/);assert(html.includes('three visits'));
 const s=eligible();html=panel(s);assert(!/neigh-open" disabled/.test(html));assert(html.includes('neighbourhood:access'));
 assert(engine.openNeighbourhood(s));html=panel(s,ui(2));assert(html.includes('Purchase plot 3'));assert(!html.includes('data-action="neigh-build"'));
 assert(engine.buyNeighbourhoodPlot(s,2));html=panel(s,ui(2));assert(html.includes('a second home means making a choice'));for(const type of Object.keys(engine.NEIGHBOURHOOD_BUILDINGS))assert(html.includes('data-key="'+type+'"'));
 assert(engine.buildNeighbourhood(s,2,'carpenter'));html=panel(s,ui(2));assert(html.includes('Move or swap building'));assert(html.includes('Materials and furnishing costs are not refunded'));
 const map=neighbourhoodMapView(s,ui(2));assert.equal((map.match(/data-action="neigh-plot"/g)||[]).length,6);assert(map.includes('Plot 3: Carpenter'));
});

test('Move controls distinguish purchased plots and preserve the selected furnished home',()=>{
 const s=opened();build(s,0,'home');assert(engine.upgradeNeighbourhoodHome(s,0));build(s,1,'carpenter');assert(engine.buyNeighbourhoodPlot(s,2));
 const html=panel(s,ui(0,'overview',0));assert(html.includes('Occupied plots swap buildings for free'));assert.match(html,/data-action="neigh-move-target" data-slot="0" disabled/);assert.match(html,/data-action="neigh-move-target" data-slot="3" disabled/);assert(!/data-action="neigh-move-target" data-slot="1" disabled/.test(html));
 assert(engine.moveNeighbourhoodBuilding(s,0,1));const map=neighbourhoodMapView(s,ui(1));assert(map.includes('Plot 2: Town house · furnished'));assert(panel(s,ui(1)).includes('Furnished home · upgrade complete'));
});

test('Neighbourhood production filters job queues without changing global cancellation indices',()=>{
 const s=opened();build(s,0,'carpenter');build(s,1,'flaxgarden');
 assert(engine.start(s,'furniture'));assert(engine.start(s,'flax'));assert(engine.start(s,'furniture'));
 const html=panel(s,ui(0));assert(html.includes('data-jobtime="0"'));assert(html.includes('data-jobtime="2"'));assert(!html.includes('data-jobtime="1"'));assert(html.includes('data-action="cancel" data-index="2"'));assert.match(html,/data-action="neigh-remove"[^>]*disabled/);
 const overview=panel(s,ui(0,'production'));assert(overview.includes('Build the Weaving studio'));assert(overview.includes('Build the Sail loft'));assert(overview.includes('data-key="flax"'));assert(!overview.includes('data-key="cloth"'));
});

test('Orders and permanent sail refits distinguish missing chains, at-sea boats and completed upgrades',()=>{
 const s=opened();let html=panel(s,ui(0,'orders'));assert(html.includes('DISTRICT ORDER 1'));assert(html.includes('neighbourhood:order:0'));assert.match(html,/data-action="neigh-refit" data-slot="0" disabled/);
 build(s,0,'sailmaker');assert(engine.startVoyage(s,0,'quarry'));html=panel(s,ui(0,'orders'));assert(html.includes('Wait for the boat to return'));assert.match(html,/data-action="neigh-refit" data-slot="0" disabled/);
 assert(engine.cancelVoyage(s,0));assert(engine.refitBoatSails(s,0));html=panel(s,ui(0,'orders'));assert(html.includes('New sails fitted'));assert(!html.includes('data-action="neigh-refit" data-slot="0"'));
 assert(engine.completeNeighbourhoodOrder(s,0));html=panel(s,ui(0,'orders'));assert(html.includes('DISTRICT ORDER 2'));assert(html.includes('Cloth for the covered market'));assert(html.includes('data-count="1"'));
});
