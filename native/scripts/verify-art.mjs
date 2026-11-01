import fs from 'node:fs';
import crypto from 'node:crypto';
const root=new URL('../../',import.meta.url);
const base=new URL('../LittleHarbour/Resources/Art/',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',base),'utf8'));
for(const[file,hash]of Object.entries(manifest.hashes)){
 const actual=crypto.createHash('sha256').update(fs.readFileSync(new URL(file,root))).digest('hex');
 if(actual!==hash)throw Error(`Art source changed: ${file}. Run node native/scripts/build-art.mjs`);
}
for(const name of ['terrain',...manifest.textures]){
 const png=fs.readFileSync(new URL(name+'.png',base));if(png.readUInt32BE(0)!==0x89504e47)throw Error('Invalid PNG '+name);
 const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
 if(name==='terrain'?width!==1800||height!==2700:width!==384||height!==384)throw Error('Unexpected image geometry '+name);
}
console.log(`Verified ${manifest.textures.length} state textures and terrain with matching source hashes.`);
