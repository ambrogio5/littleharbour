import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const p=decodeURIComponent((req.url||'/').split('?')[0]),relative=p==='/'?'index.html':p.slice(1);
 const file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 const stat=fs.existsSync(file)&&fs.statSync(file);
 if(!stat||!stat.isFile()){res.writeHead(404).end('Not found');return;}
 res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});
 fs.createReadStream(file).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-dev-shm-usage','--no-sandbox']});
 for(const device of [
  {name:'iPhone-sized touch',viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3},
  {name:'tablet browser',viewport:{width:1024,height:768},isMobile:false,hasTouch:true,deviceScaleFactor:2},
  {name:'desktop',viewport:{width:1440,height:900},isMobile:false,hasTouch:false,deviceScaleFactor:1}
 ]){
  const context=await browser.newContext({viewport:device.viewport,isMobile:device.isMobile,hasTouch:device.hasTouch,deviceScaleFactor:device.deviceScaleFactor});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:25000});
  await page.waitForFunction(()=>document.querySelector('#panel .v2-overview-panel')!==null,{timeout:20000});
  if(await page.locator('#dialog').evaluate(el=>el.open))await page.locator('#closeDialog').click();
  assert((await page.locator('#v2TaskCards .v2-task-card').count())>=1,'task cards must render');
  assert.equal(await page.locator('#newWorldArt').count(),1,'One continuous illustrated world must exist');
  assert(await page.locator('#newWorldArt').evaluate(el=>getComputedStyle(el).display!=='none'),'The world must be visible');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+6),'No page horizontal overflow');
  const headerCollision=await page.evaluate(()=>{const brand=document.querySelector('.topbar .brand')?.getBoundingClientRect(),actions=document.querySelector('.topbar .top-actions')?.getBoundingClientRect();return !!brand&&!!actions&&Math.min(brand.right,actions.right)-Math.max(brand.left,actions.left)>6;});
  assert(!headerCollision,'Brand and actions must not overlap');
  assert.equal(await page.locator('#map .world-roads').count(),0,'Old stitched-road overlay must be gone');
  assert.equal(await page.locator('#v3ZoneNav [data-action="district"]').count(),5,'District navigation must list five accessible areas');
  const collageHidden=await page.locator('#harbourStage .map-image').evaluate(el=>getComputedStyle(el).display==='none');
  assert(collageHidden,'Old photographic map tiles must not render under the single world');
  await page.locator('#v3ZoneNav [data-key="inland"]').click();
  assert.equal(await page.locator('#v3ZoneNav [data-key="inland"]').getAttribute('aria-pressed'),'true');
  await page.locator('#v3ZoneNav [data-key="harbour"]').click();
  assert((await page.locator('#map .world-camera-tools button').count())>=4,'map camera buttons must exist');
  const cameraBound=await page.locator('#map .world-camera-tools').boundingBox(),mapBound=await page.locator('#map').boundingBox();
  assert(cameraBound&&mapBound&&cameraBound.x+cameraBound.width<=mapBound.x+mapBound.width+2,'Camera tools must fit inside map: '+JSON.stringify({camera:cameraBound,map:mapBound,device:device.name}));
  // Exercise the actual native click event chain and the V2 panel routing.
  const navigation=device.isMobile?'.mobile-nav ':'.v2-topnav ';

  await page.locator(navigation+'[data-tab="produce"]').click();
  if(device.isMobile){
   assert(await page.locator('body').evaluate(el=>el.classList.contains('v3-sheet-open')),'Mobile management sheet opens on selection');
  }
  await page.waitForFunction(()=>document.querySelector('#panel')?.textContent?.includes('Keep the town moving'));
  await page.locator(navigation+'[data-tab="trade"]').click();
  await page.waitForFunction(()=>document.querySelector('#panel')?.textContent?.toLowerCase().includes('coastal trade'));
  await page.locator(navigation+'[data-tab="build"]').click();
  await page.waitForFunction(()=>document.querySelector('#panel')?.textContent?.includes('Room to grow'));
  if(device.isMobile)await page.locator('.mobile-nav [data-action="map"]').click();
  else await page.locator('.v2-topnav [data-tab="map"]').click();
  await page.waitForFunction(()=>document.querySelector('#panel .v2-overview-panel')!==null);
  // Verify map camera and focus controls are actual working buttons.
  await page.locator('#map [data-camera="home"]').click();
  const before=await page.locator('#worldZoom').innerText();
  await page.locator('#map [data-camera="in"]').click();
  const after=await page.locator('#worldZoom').innerText();
  assert.notEqual(after,before,'map zoom must update');
  await page.locator('#map [data-camera="fit"]').click();
  if(device.isMobile)await page.locator('#v3ZoneNav [data-key="harbour"]').click();
  else await page.locator('#map [data-world-region="harbour"].world-region-label').click();
  assert((await page.locator('#v2MapPlace').innerText()).includes('harbour'),'district focus must update map title');
  // V3 replaces the three small map filters with a clear district strip.
  await page.locator('#v3ZoneNav [data-key="market"]').click();
  assert.equal(await page.locator('#v3ZoneNav [data-key="market"]').getAttribute('aria-pressed'),'true');
  await page.locator('#v3ZoneNav [data-key="harbour"]').click();
  // The first playable action must change real saved state.
  const initial=await page.evaluate(()=>JSON.parse(localStorage.getItem('little-harbour-v1')).stock.wheat);
  await page.locator('#v2TaskCards [data-key="harvest"]').click();
  const afterHarvest=await page.evaluate(()=>JSON.parse(localStorage.getItem('little-harbour-v1')).stock.wheat);
  assert.equal(afterHarvest,initial+6,'harvest task must produce six real wheat');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#panel .v2-overview-panel')!==null);
  const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('little-harbour-v1')).stock.wheat);
  assert.equal(restored,afterHarvest,'reload must preserve save progress');
  assert.deepEqual(errors,[],'browser errors: '+errors.join(' | '));
  // Sample route shares same code and should initialize normally too.
  await page.goto(base+'/demo.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#panel .v2-overview-panel')!==null);
  if(await page.locator('#dialog').evaluate(el=>el.open))await page.locator('#closeDialog').click();
  await page.locator(navigation+'[data-tab="build"]').click();
  await page.waitForFunction(()=>document.querySelector('#panel')?.textContent?.includes('Room to grow'));
  assert.deepEqual(errors,[],'sample page browser errors: '+errors.join(' | '));
  const oldCoins=await page.evaluate(()=>JSON.parse(localStorage.getItem('little-harbour-sample-v1')).coins);
  await page.locator(navigation+'[data-tab="trade"]').click();
  const dispatch=page.locator('#panel [data-action="dispatch"]');
  if(await dispatch.count()){assert(await dispatch.isEnabled(),'Sample town trade is actionable');await dispatch.click();const newCoins=await page.evaluate(()=>JSON.parse(localStorage.getItem('little-harbour-sample-v1')).coins);assert(newCoins>oldCoins,'Trade action must pay its genuine coin reward');}
  console.log('PASS '+device.name+': V4 initialized, navigated, zoomed, focused districts, harvested, restored save and opened sample.');
  await context.close();
 }
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
