import {parseSave} from './engine.js';

// Storage is injected so quota errors, private browsing and competing tabs are testable.
// No failed read or parse ever authorizes a write to the player's slot.
export function createSaveStore(storage, key, now = Date.now) {
 let expected = null, original = null, blocked = false, reason = '', sequence = 0;
 let needsArchive = false, lastWritten = null, writes = 0;
 const backend = () => typeof storage === 'function' ? storage() : storage;
 function fail(error) { blocked = true; reason = error.message || 'Device storage is unavailable.'; return false; }
 function read() {
  try {
   expected = backend().getItem(key); original = expected;
   if (expected === null) return {state:null};
   needsArchive = true;
   return {state:parseSave(expected)};
  } catch (error) { fail(error); return {state:null, error:reason}; }
 }
 function archive(raw) {
  if (raw === null) return;
  const id = `${key}-backup-${now()}-${sequence++}`;
  backend().setItem(id, raw);
  if (backend().getItem(id) !== raw) throw Error('The backup could not be verified. Your original save has been kept.');
 }
 function checkCurrent() {
  if (backend().getItem(key) !== expected) throw Error('Another tab changed this town. Reload to use its save; export this session before reloading.');
 }
 function write(state) {
  if (blocked) return false;
  try {
   const raw = JSON.stringify(state);
   if (raw === lastWritten) return true;
   // Validate before touching storage, including engine changes made in this session.
   parseSave(raw); checkCurrent();
   if (needsArchive) { archive(expected); needsArchive = false; }
   backend().setItem(key, raw); expected = raw; lastWritten = raw; writes++;
   return true;
  } catch (error) { return fail(error); }
 }
 function replace(state) {
  try {
   const raw = JSON.stringify(state); parseSave(raw);
   // Re-read at the explicit replacement boundary and preserve those exact bytes.
   const current = backend().getItem(key); archive(current);
   if (backend().getItem(key) !== current) throw Error('Another tab changed this town during recovery. Reload before trying again.');
   backend().setItem(key, raw); expected = raw; lastWritten = raw;
   original = null; blocked = false; reason = ''; needsArchive = false; writes++;
   return true;
  } catch (error) { return fail(error); }
 }
 function backups() {
  try {
   const s = backend(), result = [];
   for (let i = 0; i < s.length; i++) {
    const id = s.key(i);
    if (id?.startsWith(key + '-backup-')) {
     const raw = s.getItem(id); let valid = false;
     try { parseSave(raw); valid = true; } catch {}
     result.push({id, raw, valid});
    }
   }
   return result.sort((a,b) => b.id.localeCompare(a.id));
  } catch { return []; }
 }
 return {read, write, replace, backups, get blocked(){return blocked;}, get reason(){return reason;}, get original(){return original;}, get writes(){return writes;}};
}
