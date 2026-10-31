import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createWorldArt,renderWorldBuildings} from '../dist/lab/world-art-v2.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const base={x:250,y:750,stage:'built',level:1,ripe:false,label:'Test building'};
test('playable visual preview is an actual game entrypoint',()=>{
 const html=read('dist/preview-map.html');
 assert.ok(html.includes('src="lab/app-v2.js?v=0.2"'));
 assert.match(html,/data-tab="trade"/);
 assert.match(html,/data-tab="build"/);
 assert.match(html,/data-tab="produce"/);
});
test('visual preview uses isolated saves and the production engine',()=>{
 const app=read('dist/lab/app-v2.js');
 assert.match(app,/from '\.\.\/engine\.js\?v=0\.20\.1'/);
 assert.match(app,/little-harbour-visual-preview-v1/);
 assert.doesNotMatch(app,/const KEY=DEMO\?'little-harbour-sample-v1':'little-harbour-v1'/);
 assert.ok(app.includes("from './world-map-v2.js?v=0.2'"));
 assert.match(app,/if\(a==='dispatch'\)/);
 assert.match(app,/if\(a==='build'\)/);
});
test('site routing is specific for trades, production, homes and fleet',()=>{
 const app=read('dist/lab/app-v2.js');
 for(const word of ["site.id==='civic'","site.id==='ferry'","site.id==='lighthouse'","site.id==='kiln'","site.id==='pier'","site.id==='waterfront'"]){assert.ok(app.includes(word),word);}
});
test('all world scenery is one continuous SVG',()=>{
 const svg=createWorldArt();
 assert.match(svg,/viewBox="0 0 1800 2700"/);
 assert.match(svg,/id="worldBuildings"/);
});
test('different businesses have different physical artwork',()=>{
 const render=(id,kind='workshop')=>renderWorldBuildings([{...base,id,kind}]);
 const mill=render('mill','mill'),bakery=render('bakery','bakery'),fish=render('fishing','fishing'),olive=render('olive','olive');
 assert.notEqual(mill,bakery);
 assert.notEqual(fish,olive);
 assert.match(mill,/circle/);
 assert.match(bakery,/q-20 -19/);
 assert.match(fish,/boat|path/);
});
test('the same plot changes visibly across unbuilt construction and built',()=>{
 const art=stage=>renderWorldBuildings([{...base,id:'bakery',kind:'bakery',stage}]);
 assert.notEqual(art('unbuilt'),art('building'));
 assert.notEqual(art('building'),art('built'));
 assert.match(art('building'),/opacity=".48"/);
});
test('map supports direct tap and stable pan/zoom navigation',()=>{
 const nav=read('dist/lab/world-map-v2.js');
 assert.match(nav,/createWorldMap/);
 assert.match(nav,/pointerdown/);
 assert.match(nav,/pointermove/);
 assert.match(nav,/setPointerCapture/);
 assert.match(nav,/data-world-region/);
 assert.match(nav,/data-action="world-site"/);
});
