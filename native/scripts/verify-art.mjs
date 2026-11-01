import fs from 'node:fs';
import crypto from 'node:crypto';
const root=new URL('../../',import.meta.url);
const base=new URL('../LittleHarbour/Resources/Art/',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',base),'utf8'));
for(const[file,hash]of Object.entries(manifest.hashes)){
 const actual=crypto.createHash('sha256').update(fs.readFileSync(new URL(file,root))).digest('hex');
 if(actual!==hash)throw Error(`Art source changed: ${file}. Run node native/scripts/build-art.mjs`);
}
for(const name of ['terrain',...manifest.textures,...(manifest.extras||[])]){
 const png=fs.readFileSync(new URL(name+'.png',base));if(png.readUInt32BE(0)!==0x89504e47)throw Error('Invalid PNG '+name);
 if(manifest.outputHashes && crypto.createHash('sha256').update(png).digest('hex')!==manifest.outputHashes[name])throw Error('Packed texture changed: '+name);
 const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
 if(name==='terrain'?width!==1800||height!==2700:width!==384||height!==384)throw Error('Unexpected image geometry '+name);
}
console.log(`Verified ${manifest.textures.length} state textures and terrain with matching source hashes.`);

const resources=JSON.parse(fs.readFileSync(new URL('resource-manifest.json',base),'utf8'));
const {ITEMS}=await import('../../dist/engine.js');
const expected=[...Object.keys(ITEMS),'coins'].sort();
if(JSON.stringify([...resources.goods].sort())!==JSON.stringify(expected))throw Error('Resource icon coverage differs from the real economy');
for(const[file,hash]of Object.entries(resources.hashes)){
 if(crypto.createHash('sha256').update(fs.readFileSync(new URL(file,root))).digest('hex')!==hash)throw Error('Resource source changed: '+file);
}
for(const good of resources.goods){
 const name='good-'+good,png=fs.readFileSync(new URL(name+'.png',base));
 if(png.readUInt32BE(16)!==192||png.readUInt32BE(20)!==192||png[25]!==6)throw Error('Resource must be 192px RGBA: '+good);
 if(crypto.createHash('sha256').update(png).digest('hex')!==resources.outputHashes[name])throw Error('Resource icon changed: '+good);
}
console.log('Verified 24 painted resources covering every economic item and coins.');
