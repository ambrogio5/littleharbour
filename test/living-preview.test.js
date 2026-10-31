import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createWorldArt,renderWorldBuildings} from '../dist/lab/world-art-v2.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('map uses clipped texture and an independent living visual layer',()=>{
 const art=createWorldArt();
 assert.ok(art.includes('unified-terrain.png'));
 assert.ok(art.includes('id="livingWorldLayer"'));
 assert.ok(art.includes('livingLandClip'));
});
test('production buildings retain their own shapes and stages',()=>{
 const seed={x:500,y:400,level:1,label:'Workshop'};
 const make=(id,stage)=>renderWorldBuildings([{...seed,id,kind:id,stage}]);
 assert.notEqual(make('mill','built'),make('bakery','built'));
 assert.notEqual(make('olive','unbuilt'),make('olive','built'));
 assert.notEqual(make('fishing','building'),make('fishing','built'));
});
test('preview evolves only after successful game actions',()=>{
 const app=read('dist/lab/app-v2.js');
 assert.ok(app.includes('createLivingHarbour(KEY)'));
 assert.ok(app.includes('if(success){recordLivingAction(a,b.dataset.key);render();save();}'));
 assert.ok(app.includes("'dispatch':'ship-cargo'"));
 assert.ok(app.includes('livingHarbour.reset()'));
});
test('two isolated playtest pages have a living town view',()=>{
 for(const name of ['dist/preview-map.html','dist/preview-map-demo.html']){
  const html=read(name);
  assert.ok(html.includes('id="livingHarbourStatus"'));
  assert.ok(html.includes('lab/app-v2.js'));
 }
});
