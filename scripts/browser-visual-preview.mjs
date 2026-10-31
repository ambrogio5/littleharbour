
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {fresh} from '../dist/engine.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const p=decodeURIComponent((req.url||'/').split('?')[0]),relative=p==='/'?'index.html':p.slice(1);
 const file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end('Not found');return;}
 res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});
 fs.createReadStream(file).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port+'/preview-map.html';
let browser;
try{
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-dev-shm-usage','--no-sandbox']});
 for(const device of [{name:'iPhone',viewport:{width:390,height:844},isMobile:true,hasTouch:true},{name:'iPad',viewport:{width:1024,height:768},isMobile:false,hasTouch:true}]){
  const context=await browser.newContext({viewport:device.viewport,isMobile:device.isMobile,hasTouch:device.hasTouch});
  const seed=fresh();seed.onboarded=true;seed.coins=1000;seed.stock.bread=8;
  await context.addInitScript(raw=>{
   if(!localStorage.getItem('visual-preview-seeded')){
    localStorage.setItem('little-harbour-visual-preview-v1',raw);
    localStorage.setItem('little-harbour-v1','must-stay-untouched');
    localStorage.setItem('visual-preview-seeded','yes');
   }
  },JSON.stringify(seed));
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});
  assert.equal(response?.status(),200,'preview reachable');
  await page.waitForFunction(()=>document.querySelector('#worldBuildings [data-world-building="bakery"]')!==null,{timeout:15000});
  if(await page.locator('#dialog').evaluate(el=>el.open))await page.locator('#closeDialog').click();
  assert.equal(await page.locator('#newWorldArt').count(),1,'One coherent map');
  assert.equal(await page.locator('#worldBuildings [data-stage="built"]').count(),3,'Start with three built structures');
  const mill=await page.locator('[data-world-building="mill"]').innerHTML();
  const bakery=await page.locator('[data-world-building="bakery"]').innerHTML();
  assert.notEqual(mill,bakery,'Unique art per building');
  const nav=device.isMobile?'.mobile-nav ':'.v2-topnav ';
  await page.locator(nav+'[data-tab="trade"]').click();
  await page.locator('#panel [data-action="dispatch"]').click();
  const afterTrade=await page.evaluate(()=>JSON.parse(localStorage.getItem('little-harbour-visual-preview-v1')));
  assert(afterTrade.deliveries>=1&&afterTrade.coins>1000,'Real trade updates simulation and pays out');
  await page.locator(nav+'[data-tab="build"]').click();
  await page.locator('#panel [data-action="build"][data-key="olive"]').click();
  await page.waitForSelector('[data-world-building="olive"][data-stage="building"]',{state:'attached'});
  const afterBuild=await page.evaluate(()=>JSON.parse(localStorage.getItem('little-harbour-visual-preview-v1')));
  assert(afterBuild.businesses.includes('olive'),'Paid construction uses the real engine');
  assert.equal(await page.evaluate(()=>localStorage.getItem('little-harbour-v1')),'must-stay-untouched','Existing game save untouched');
  await page.locator(nav+'[data-tab="map"]').click().catch(async()=>{await page.locator('.mobile-nav [data-action="map"]').click();});
  await page.locator('#v3ZoneNav [data-key="inland"]').click();
  await page.waitForTimeout(350);
  assert.equal(await page.locator('#v3ZoneNav [data-key="inland"]').getAttribute('aria-pressed'),'true');
  const zoomBefore=await page.locator('#worldZoom').innerText();
  await page.locator('#map [data-camera="in"]').click();
  const zoomAfter=await page.locator('#worldZoom').innerText();
  assert.notEqual(zoomAfter,zoomBefore,'Camera zoom responds to touch');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#worldBuildings [data-world-building="olive"]')!==null);
  const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('little-harbour-visual-preview-v1')));
  assert(restored.businesses.includes('olive'),'Preview game persists construction after reload');
  assert.deepEqual(errors,[],'Browser errors: '+errors.join(' | '));
  console.log('PASS '+device.name+': distinct map art, real trade, construction, safe save, camera and reload');
  await context.close();
 }
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
