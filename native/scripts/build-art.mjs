// Reproducible textures from the approved repository art direction. No new AI art.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {createWorldArt} from '../../dist/lab/world-art-v2.js';
import {nativeBuilding} from './architecture-art.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const out=path.join(root,'native/LittleHarbour/Resources/Art');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1800,height:2700},deviceScaleFactor:1});
try{
 const raster=fs.readFileSync(path.join(root,'dist/assets/unified-terrain.png')).toString('base64');
 await page.setContent('<style>html,body{margin:0}svg{display:block;width:1800px;height:2700px}</style>'+createWorldArt().replace('assets/unified-terrain.png','data:image/png;base64,'+raster));
 await page.locator('svg').screenshot({path:path.join(out,'terrain.png')});
 await page.setViewportSize({width:384,height:384});
 const kinds=['boatyard','estate','mill','bakery','olive','fishing','pier','waterfront','lighthouse','ferry','specialist','kiln','clay','square','market','field','garden','orchard','flaxgarden','home','carpenter','weaver','sailmaker','boat'];
 const manifest={source:'dist/lab/painterly-assets.js + dist/lab/world-art-v2.js',coordinateFrame:{width:320,height:320,anchorX:160,anchorY:160},textures:[]};
 for(const kind of kinds)for(const phase of ['unbuilt','building','built','upgraded','ripe']){
  const level=phase==='upgraded'?3:1,e={id:kind,kind,level,stage:['unbuilt','building'].includes(phase)?phase:'built',ripe:phase==='ripe'};
  const name=kind+'-'+phase;
  await page.setContent('<style>html,body{margin:0;background:transparent}svg{display:block;width:384px;height:384px}</style><svg xmlns="http://www.w3.org/2000/svg" viewBox="-160 -160 320 320">'+nativeBuilding(e)+'</svg>');
  await page.locator('svg').screenshot({path:path.join(out,name+'.png'),omitBackground:true});manifest.textures.push(name);
 }
 const hashes=Object.fromEntries(['dist/lab/painterly-assets.js','dist/lab/world-art-v2.js','dist/assets/unified-terrain.png','native/scripts/architecture-art.mjs'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')]));
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({...manifest,hashes},null,2)+'\n');
 console.log(`Exported terrain and ${manifest.textures.length} transparent state textures.`);
}finally{await browser.close();}
