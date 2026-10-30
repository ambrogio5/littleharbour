import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
test('V2 rendering never iterates a single querySelector result',()=>{
 const singleSelectorCall=/((?<!\$)\$\((?:'[^']*'|"[^"]*")\))\.(forEach|map|filter|some|every|find)\(/g;
 const broken=[...code.matchAll(singleSelectorCall)].map(m=>m[0]);
 assert.deepEqual(broken,[],'List methods require $$ (querySelectorAll), not $ (querySelector)');
 for(const sel of ["$$('.v2-topnav [data-tab]').forEach","$$('.v2-map-rail button').forEach"])assert(code.includes(sel),sel);
});
test('Playtest V3 refreshes the root module URL on both mobile routes',()=>{
 for(const page of ['index.html','demo.html']){
  const html=readFileSync(new URL('../dist/'+page,import.meta.url),'utf8');
  assert(html.includes('src="app.js?v=0.20.0"'));
  assert(html.includes('href="game.css?v=0.20.0"'));
 }
});
