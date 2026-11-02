// Pack the committed painted icon with macOS image tools. No generation/network.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
const input=new URL('../art-source/painted-v2/icon.png',import.meta.url);
const output=new URL('../LittleHarbour/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon.png',import.meta.url);
if(!fs.existsSync(input))throw Error('Missing committed painted icon source');
const result=spawnSync('sips',['-z','1024','1024',input.pathname,'--out',output.pathname],{stdio:'inherit'});
if(result.error)throw result.error;
process.exit(result.status??1);
