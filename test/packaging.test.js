import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Script} from 'node:vm';

test('Standalone packaging preserves JavaScript dollar signs and produces valid inline code',()=>{
 const dir=mkdtempSync(join(tmpdir(),'harbour-package-'));
 try{
  const file=join(dir,'playtest.html');
  const result=spawnSync(process.execPath,['scripts/build-standalone.mjs',file],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const html=readFileSync(file,'utf8');
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length,2);
  for(const [,code]of scripts)assert.doesNotThrow(()=>new Script(code));
  assert(scripts[1][1].includes('$$=s=>[...document.querySelectorAll(s)]'));
  assert(!html.includes('data:image/png;base64,'),'No retired photographic assets should be embedded');
  assert(html.length<1000000,'Standalone should stay below one megabyte');
  assert(html.includes('current-objective'));
  assert(!html.includes('href="game.css'));
  assert((html.match(/data:image\/png;base64,/g)||[]).length<=30,'Inline image data should be embedded once per asset, never per CSS use');
  assert(html.includes('id="v2TaskCards"'));
  assert(html.includes('v2-task-grid'));
  assert(html.includes('function v2Tasks('));
  assert(html.includes('function createWorldArt('));
  assert(html.includes('id="v3ZoneNav"'));
  assert(html.includes('newWorldArt'));
  assert(!html.includes('href="v3.css?v=0.18.0"'));
  assert(html.includes('v3-zone-nav'));
  assert(html.includes('--v4-navy'));
  assert(!html.includes('href="v4.css?v=0.19.0"'));

  assert(!html.includes('src="app.js?v=0.18.0"'));

  assert(!html.includes('href="v2.css"'));
  assert(!html.includes('src="v2-ui.js"'));
  assert(!html.includes('src="app.js"'));
  assert(!html.includes('href="style.css"'));
  assert(!html.includes('@import'));
  assert(!/url\('assets\//.test(html));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
