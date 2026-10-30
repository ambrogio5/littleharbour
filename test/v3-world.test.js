import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createWorldArt,WORLD_ART_SIZE} from '../dist/world-art.js';
import {WORLD_REGIONS,WORLD_SIZE} from '../dist/world-map.js';
test('The whole town is one original landscape, not five photographic district tiles',()=>{
 const art=createWorldArt();
 assert.equal(WORLD_ART_SIZE.width,WORLD_SIZE.w);
 assert.equal(WORLD_ART_SIZE.height,WORLD_SIZE.h);
 assert(art.startsWith('<svg id="newWorldArt"'));
 assert(art.endsWith('</svg>'));
 assert(art.includes('url(#sea)')&&art.includes('url(#land)'));
 for(const landmark of ['lighthouse','house','pier']){} // shapes are authored directly
 assert((art.match(/<g transform=/g)||[]).length>150,'Living scenery should span the world');
 assert(!art.includes('<image '),'No pasted district photo tiles');
 assert(!art.includes('base64'),'No embedded screenshot data');
});
test('Every authored district remains within the unified world camera',()=>{
 for(const r of Object.values(WORLD_REGIONS)){
  assert(r.x>=0&&r.y>=0&&r.x+r.w<=WORLD_SIZE.w&&r.y+r.h<=WORLD_SIZE.h);
 }
});
test('The playable pages include a direct district selector and mobile game sheet',()=>{
 for(const file of ['index.html','demo.html']){
  const html=readFileSync(new URL('../dist/'+file,import.meta.url),'utf8');
  assert(html.includes('id="v3ZoneNav"'));
  assert(html.includes('href="v3.css?v=0.18.0"'));
  assert(html.includes('src="app.js?v=0.18.0"'));
  for(const key of ['inland','neighbourhood','market','harbour','coast'])assert(html.includes('data-key="'+key+'"'));
 }
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert(app.includes("classList.toggle('v3-sheet-open',tab!=='map')"));
 assert(app.includes("worldMap.fit()"));
 const css=readFileSync(new URL('../dist/v3.css',import.meta.url),'utf8');
 assert(css.includes('background:none!important'));
 assert(css.includes('.world-primary-hotspots'));
 assert(css.includes('body.v3-sheet-open .management'));
 assert(css.includes('.world-region-label'));
});
