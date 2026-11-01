// Repack committed painted artwork; no model/API/network access is needed.
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const result=spawnSync('swift',['native/scripts/pack-painted-art.swift'],{cwd:fileURLToPath(new URL('../../',import.meta.url)),stdio:'inherit'});
if(result.error)throw result.error;
process.exit(result.status??1);
