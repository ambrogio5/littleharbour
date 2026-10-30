import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fresh,order} from '../dist/engine.js';
import {sampleTown} from '../dist/demo-town.js';
import {v2Tasks,v2TaskCards,v2TopStock,v2ContextHero,v2OverviewPanel,V2_SECTIONS} from '../dist/v2-ui.js';

test('V2 opening screen offers real playable first steps without inventing results',()=>{
 const s=fresh(),before=JSON.stringify(s);
 const tasks=v2Tasks(s);
 assert(tasks.some(t=>t.id==='harvest'));
 assert(tasks.some(t=>t.id==='next'));
 assert(tasks.length<=4);
 assert(!tasks.some(t=>t.id==='shipment'));
 assert.match(v2TaskCards(s),/data-action="v2-task"/);
 assert(!v2TaskCards(s).includes('undefined'));
 assert.equal(JSON.stringify(s),before,'render helpers must not change saved progress');
});
test('V2 cards reflect a shipment that really has its goods ready',()=>{
 const s=fresh();
 s.stock.bread=4;
 const route=order(s);
 assert.deepEqual(route.cost,{bread:4});
 const task=v2Tasks(s).find(t=>t.id==='shipment');
 assert(task);
 assert.equal(task.tab,'trade');
 assert(task.detail.includes(route.coins+' coins'));
 s.reservations={'other':{bread:4}};
 assert(!v2Tasks(s).some(t=>t.id==='shipment'));
});
test('Residents and ferry tasks appear only after their actual unlocks',()=>{
 const s=sampleTown();
 assert(!v2Tasks(s).some(t=>t.id==='residents'||t.id==='ferry'));
 s.fleet.visits.quarry=3;
 assert(v2Tasks(s).some(t=>t.id==='neighbourhood'));
 s.neighbourhood.access=true;
 assert(v2Tasks(s).some(t=>t.id==='residents'));
 s.fleet.lighthouse.stage=3;
 assert(v2Tasks(s).some(t=>t.id==='ferry'));
 s.residents.proposal='garden';s.residents.delivered=3;
 assert(!v2Tasks(s).some(t=>t.id==='residents'));
});
test('V2 management hero and navigation produce structured, complete text',()=>{
 const s=sampleTown();
 for(const section of [...V2_SECTIONS.map(t=>t.id),'neighbourhood','residents','ferry','direction','waterfront','inland','market','planning']){
  const html=v2ContextHero(s,section);
  assert.match(html,/v2-context-copy/);
  assert(!html.includes('undefined'));
  assert(!html.includes('NaN'));
 }
 assert.match(v2OverviewPanel(fresh()),/data-action="v2-next"/);
 assert.match(v2OverviewPanel(s),/data-tab="trade"/);
 assert.match(v2TopStock(s),/Stone/);
});
test('V2 visual shell is shipped on game and sample routes and portable builder',()=>{
 const index=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 const demo=readFileSync(new URL('../dist/demo.html',import.meta.url),'utf8');
 const css=readFileSync(new URL('../dist/game.css',import.meta.url),'utf8');
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 const bundle=readFileSync(new URL('../scripts/build-standalone.mjs',import.meta.url),'utf8');
 for(const html of [index,demo]){
  for(const token of ['game.css','id="v2Coins"','id="v2Stock"','id="v2TaskCards"','id="v2Hero"','v2-map-rail','data-tab="map"','data-action="v2-inventory"'])assert(html.includes(token),token);
  assert.equal((html.match(/id="v2TaskCards"/g)||[]).length,1);
 }
 assert(css.includes('@media(max-width:740px)'));
 assert(css.includes('v2-task-grid'));
 assert(app.includes("v2TaskCards(state)"));
 assert(app.includes("v2OverviewPanel(state)"));
 assert(app.includes("if(a==='v2-filter')"));
 assert(bundle.includes("dist/game.css"));
 assert(bundle.includes("dist/v2-ui.js"));
});
