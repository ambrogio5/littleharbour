import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const version=JSON.parse(readFileSync(new URL('../package.json',import.meta.url))).version;
test('Release entry points and the entire module graph avoid stale previous-release cache URLs',()=>{
 for(const name of readdirSync(new URL('../dist/',import.meta.url)).filter(n=>n.endsWith('.js'))){
  const source=readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
  for(const [,link]of source.matchAll(/from\s*['"](\.\/[^'"]+\.js(?:\?[^'"]+)?)['"]/g))assert(link.endsWith('?v='+version),name+' imports a stale URL: '+link);
 }
 for(const name of ['index.html','demo.html']){
  const html=readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
  for(const entry of ['app.js','theme.js','game.css'])assert(html.includes(entry+'?v='+version),name+' must refresh '+entry);
 }
});
