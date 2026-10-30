import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const destination=process.argv[2]||path.resolve(root,'../Little-Harbour-V3-Playtest.html');
const theme=fs.readFileSync(path.join(root,'dist/theme.js'),'utf8');
let html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
// Embed each image only once. Earlier standalone builds repeated multi-megabyte
// Base64 PNGs for every CSS selector and inflated the HTML unnecessarily.
const styleSource=['style.css','fleet-depth.css','boat-art.css','neighbourhood.css','ferry.css','project-planning.css','dark.css','world-map.css','v2.css','v3.css']
 .map(file=>fs.readFileSync(path.join(root,'dist',file),'utf8')).join('\n');
const assetFiles=[...new Set([...styleSource.matchAll(/url\('assets\/([^']+)'\)/g)].map(match=>match[1]))];
const assetVars=new Map(assetFiles.map((file,index)=>[file,'--lh-art-'+index]));
const css=':root{'+assetFiles.map(file=>assetVars.get(file)+":url('data:image/png;base64,"+fs.readFileSync(path.join(root,'dist/assets',file)).toString('base64')+"');").join('')+'}\n'
 +styleSource.replace(/url\('assets\/([^']+)'\)/g,(_,file)=>'var('+assetVars.get(file)+')');
const catalog=fs.readFileSync(path.join(root,'dist/catalog.js'),'utf8').replace(/^export /gm,'');
const engine=fs.readFileSync(path.join(root,'dist/engine.js'),'utf8').replace(/^import .*\n/gm,'').replace(/^export \* .*\n/gm,'').replace(/^export /gm,'');
const scene=fs.readFileSync(path.join(root,'dist/scene.js'),'utf8').replace(/^export /gm,'');
const districts=fs.existsSync(path.join(root,'dist/districts.js'))?fs.readFileSync(path.join(root,'dist/districts.js'),'utf8').replace(/^import .*\n/gm,'').replace(/^export /gm,''):'';
const inlandMap=fs.readFileSync(path.join(root,'dist/inland-map.js'),'utf8').replace(/^export /gm,'');
const coastMap=fs.readFileSync(path.join(root,'dist/coast-map.js'),'utf8').replace(/^export /gm,'');
const boatArt=fs.readFileSync(path.join(root,'dist/boat-art.js'),'utf8').replace(/^export /gm,'');
const neighbourhoodUIBundle=fs.readFileSync(path.join(root,'dist/neighbourhood-ui.js'),'utf8').replace(/^import .*\n/gm,'').replace(/^export /gm,'');
const fleetUI=fs.readFileSync(path.join(root,'dist/fleet-ui.js'),'utf8').replace(/^import .*\n/gm,'').replace(/^export \{.*\n/gm,'').replace(/^export /gm,'');
const ferryArt=fs.readFileSync(path.join(root,'dist/ferry-art.js'),'utf8').replace(/^export /gm,'');
const coastView=fs.readFileSync(path.join(root,'dist/coast-view.js'),'utf8').replace(/^import .*\n/gm,'').replace(/^export /gm,'');
const demo=fs.readFileSync(path.join(root,'dist/demo-town.js'),'utf8').replace(/^import .*\n/gm,'').replace(/^export /gm,'');
const planning=fs.readFileSync(path.join(root,'dist/planning.js'),'utf8').replace(/^import .*\n/gm,'').replace(/^export /gm,'');
const projectPlanning=fs.readFileSync(path.join(root,'dist/project-planning.js'),'utf8').replace(/^import .*\n/gm,'').replace(/^export /gm,'');
const projectUI=fs.readFileSync(path.join(root,'dist/project-ui.js'),'utf8').replace(/^import .*\n/gm,'').replace(/^export /gm,'');
const ferryUI=fs.readFileSync(path.join(root,'dist/ferry-ui.js'),'utf8').replace(/^import .*\n/gm,'').replace(/^export /gm,'');
const worldArt=fs.readFileSync(path.join(root,'dist/world-art.js'),'utf8').replace(/^export /gm,'');
const worldMap=fs.readFileSync(path.join(root,'dist/world-map.js'),'utf8').replace(/^import .*\n/gm,'').replace(/^export /gm,'');
const worldGuide=fs.readFileSync(path.join(root,'dist/world-guide.js'),'utf8').replace(/^import .*\n/gm,'').replace(/^export /gm,'');
const v2UI=fs.readFileSync(path.join(root,'dist/v2-ui.js'),'utf8').replace(/^import .*\n/gm,'').replace(/^export /gm,'');
const app=fs.readFileSync(path.join(root,'dist/app.js'),'utf8').replace(/^import .*\n/gm,'');
html=html.replace('<link rel="stylesheet" href="style.css">',()=>'<style>'+css+'</style>');
html=html.replace('<link rel="stylesheet" href="fleet-depth.css">','').replace('<link rel="stylesheet" href="boat-art.css">','').replace('<link rel="stylesheet" href="neighbourhood.css">','');
html=html.replace(/<link rel="stylesheet" href="v2\.css(?:\?v=[^"]+)?">/,'');
html=html.replace(/<link rel="stylesheet" href="v3\.css(?:\?v=[^"]+)?">/,'');
html=html.replace('<link rel="stylesheet" href="world-map.css">','').replace('<link rel="stylesheet" href="dark.css">','').replace('<link rel="stylesheet" href="ferry.css">','').replace('<link rel="stylesheet" href="project-planning.css">','').replace('<script src="theme.js"></script>',()=>'<script>'+theme+'</script>');
html=html.replace(/<script type="module" src="app\.js(?:\?v=[^"]+)?"><\/script>/,()=>'<script>'+catalog+'\n'+engine+'\n'+scene+'\n'+districts+'\n'+inlandMap+'\n'+coastMap+'\n'+boatArt+'\n'+fleetUI+'\n'+ferryArt+'\n'+coastView+'\n'+demo+'\n'+planning+'\n'+neighbourhoodUIBundle+'\n'+projectPlanning+'\n'+projectUI+'\n'+ferryUI+'\n'+worldArt+'\n'+worldMap+'\n'+worldGuide+'\n'+v2UI+'\n'+app+'</script>');
if(/(?:src|href)="https?:\/\//.test(html)||/@import/.test(html))throw new Error('External assets must not be present.');
fs.writeFileSync(destination,html);
console.log(destination);
