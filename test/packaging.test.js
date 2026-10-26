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
  assert.equal(scripts.length,1);
  assert.doesNotThrow(()=>new Script(scripts[0][1]));
  assert(scripts[0][1].includes('$$=s=>[...document.querySelectorAll(s)]'));
  assert(html.includes('data:image/png;base64,'));
  assert(!html.includes('src="app.js"'));
  assert(!html.includes('href="style.css"'));
  assert(!html.includes('@import'));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
