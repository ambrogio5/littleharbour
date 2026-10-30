import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {sampleTown} from '../dist/demo-town.js';
import {RECIPES,unlocked,start} from '../dist/engine.js';
const root=path.resolve('dist'),duration=20000;
const seed=sampleTown();seed.speed=3;
for(const key of Object.keys(RECIPES))if(unlocked(seed,key)){seed.targets[key]=12;start(seed,key,true);}
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
try{
 for(const revision of ['cf9fa15','working-tree']){
  const cache=new Map();const server=http.createServer((req,res)=>{
   const file=decodeURIComponent(req.url.split('?')[0]).slice(1)||'index.html';
   if(file.includes('..')){res.writeHead(403).end();return;}
   try{if(!cache.has(file))cache.set(file,revision==='working-tree'?fs.readFileSync(path.join(root,file)):execFileSync('git',['show',revision+':dist/'+file],{maxBuffer:20*1024*1024,stdio:['ignore','pipe','ignore']}));
    res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(cache.get(file));
   }catch{res.writeHead(404).end();}
  });await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   await context.addInitScript(raw=>{localStorage.setItem('little-harbour-v1',raw);window.profile={writes:0,panelReplacements:0};const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(window.profile.active&&k==='little-harbour-v1')window.profile.writes++;return original.call(this,k,v);};},JSON.stringify(seed));
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'networkidle'});
   await page.evaluate(()=>{new MutationObserver(rs=>{for(const r of rs)if(r.target===document.querySelector('#panel')&&r.removedNodes.length)profile.panelReplacements++;}).observe(document.querySelector('#panel'),{childList:true});profile.active=true;});
   await new Promise(r=>setTimeout(r,duration));
   const result=await page.evaluate(()=>({...profile,pngBytes:performance.getEntriesByType('resource').filter(r=>r.name.includes('.png')).reduce((sum,r)=>sum+r.decodedBodySize,0),documentOverflow:document.documentElement.scrollWidth>innerWidth+6}));
   results.push({revision,durationSeconds:duration/1000,...result,errors});console.log(JSON.stringify(results.at(-1)));
   await context.close();
  }finally{await new Promise(r=>server.close(r));}
 }
 fs.writeFileSync('docs/performance-profile.json',JSON.stringify({scenario:'Same established town, every unlocked stock target 12, 3x speed, 390x844 Chromium, 20 seconds, no player input',results},null,2)+'\n');
}finally{await browser.close();}
