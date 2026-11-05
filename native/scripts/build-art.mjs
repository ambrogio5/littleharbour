// Repack committed painted artwork; no model/API/network access is needed.
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
for(const script of ['pack-painted-art.swift','pack-resource-art.swift','pack-living-art.swift','pack-chronicle-art.swift','pack-advanced-art.swift']){
 const result=spawnSync('swift',['native/scripts/'+script],{cwd:fileURLToPath(new URL('../../',import.meta.url)),stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status??1);
}
