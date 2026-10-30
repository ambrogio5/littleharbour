// Keep live controls, scroll positions and focus when only labels or counts change.
// The simulation clock never calls this for timer-only changes.
export function renderMarkup(root, html) {
 if (root.__markup === html) return false;
 const template = document.createElement('template'); template.innerHTML = html;
 function patch(parent, desired) {
  const old = [...parent.childNodes], next = [...desired.childNodes];
  for (let i=0;i<Math.max(old.length,next.length);i++) {
   const a=old[i], b=next[i];
   if (!b) { a.remove(); continue; }
   if (!a) { parent.appendChild(b.cloneNode(true)); continue; }
   if (a.nodeType!==b.nodeType || a.nodeName!==b.nodeName) { a.replaceWith(b.cloneNode(true)); continue; }
   if (a.nodeType===3 || a.nodeType===8) { if(a.nodeValue!==b.nodeValue)a.nodeValue=b.nodeValue; continue; }
   for(const attr of [...a.attributes])if(!b.hasAttribute(attr.name)&&!['data-focus-key',...(a.tagName==='DETAILS'?['open']:[])].includes(attr.name))a.removeAttribute(attr.name);
   for(const attr of [...b.attributes])if(a.getAttribute(attr.name)!==attr.value)a.setAttribute(attr.name,attr.value);
   patch(a,b);
  }
 }
 patch(root,template.content);root.__markup=html;return true;
}
