import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent((req.url||'/').split('?')[0]),rel=name==='/'?'index.html':name.slice(1),p=path.resolve(root,rel);
 if(!p.startsWith(root+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404).end();return;}
 res.writeHead(200,{'content-type':mime[path.extname(p)]||'application/octet-stream'});
 fs.createReadStream(p).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const origin='http://127.0.0.1:'+server.address().port;
 for(const device of [{key:'PHONE',width:390,height:844,isMobile:true},{key:'DESKTOP',width:1440,height:900,isMobile:false}]){
  const ctx=await browser.newContext({viewport:{width:device.width,height:device.height},isMobile:device.isMobile,hasTouch:device.isMobile,deviceScaleFactor:1});
  const page=await ctx.newPage();
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#newWorldArt')&&document.querySelector('#panel .v2-overview-panel'));
  if(await page.locator('#dialog').evaluate(el=>el.open))await page.locator('#closeDialog').click();
  await page.evaluate(()=>document.fonts.ready);
  const bytes=await page.screenshot({type:'jpeg',quality:58,fullPage:false,animations:'disabled'});
  process.stdout.write('LH_V4_'+device.key+'_IMAGE='+bytes.toString('base64')+'\n');
  await ctx.close();
 }
}finally{await browser?.close();await new Promise(r=>server.close(r));}
