import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {nativeBuilding} from './architecture-art.mjs';
const output=new URL('../LittleHarbour/Resources/Assets.xcassets/',import.meta.url);
fs.mkdirSync(new URL('AppIcon.appiconset/',output),{recursive:true});
fs.writeFileSync(new URL('Contents.json',output),JSON.stringify({info:{author:'xcode',version:1}},null,2));
fs.writeFileSync(new URL('AppIcon.appiconset/Contents.json',output),JSON.stringify({images:[{filename:'AppIcon.png',idiom:'universal',platform:'ios',size:'1024x1024'}],info:{author:'xcode',version:1}},null,2));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage({viewport:{width:1024,height:1024}});await page.setContent(`<style>body{margin:0}svg{display:block}</style><svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs><linearGradient id="sea" x2=".8" y2="1"><stop stop-color="#6fa2a1"/><stop offset="1" stop-color="#174e61"/></linearGradient></defs><path fill="url(#sea)" d="M0 0h1024v1024H0Z"/><path d="M0 0h1024v450Q800 430 720 660T0 870Z" fill="#c4bd9b" stroke="#eee0be" stroke-width="20"/><path d="M50 900q100-30 180 0t180 0m160-20q110-30 180 0t180 0" fill="none" stroke="#dce6d0" stroke-width="7" opacity=".4"/><g transform="translate(485 475) scale(2.4)">${nativeBuilding({id:'lighthouse',kind:'lighthouse',stage:'built',level:3})}</g><g transform="translate(310 690) scale(1.55)">${nativeBuilding({id:'bakery',kind:'bakery',stage:'built',level:1})}</g><g transform="translate(790 800) scale(1.25)">${nativeBuilding({id:'boat',kind:'boat',stage:'built',level:1})}</g></svg>`);await page.screenshot({path:new URL('AppIcon.appiconset/AppIcon.png',output).pathname});}finally{await browser.close();}
