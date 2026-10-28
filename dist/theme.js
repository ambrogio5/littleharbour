// Apply before paint; appearance is independent of town saves and sample progress.
(()=>{
 const key='little-harbour-theme',root=document.documentElement,system=matchMedia('(prefers-color-scheme: dark)');
 let choice=null;
 try{const saved=localStorage.getItem(key);if(saved==='dark'||saved==='light')choice=saved;}catch{}
 function apply(){const dark=(choice|| (system.matches?'dark':'light'))==='dark';root.dataset.theme=dark?'dark':'light';root.style.colorScheme=dark?'dark':'light';const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=dark?'#172321':'#f5f3ed';const button=document.getElementById('themeToggle');if(button){button.textContent=dark?'☀':'☾';button.setAttribute('aria-pressed',String(dark));button.setAttribute('aria-label','Dark mode');button.title=dark?'Switch to light mode':'Switch to dark mode';}}
 apply();
 document.addEventListener('DOMContentLoaded',()=>{apply();document.getElementById('themeToggle')?.addEventListener('click',()=>{choice=root.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem(key,choice);}catch{}apply();});});
 system.addEventListener?.('change',()=>{if(!choice)apply();});
 window.addEventListener('storage',event=>{if(event.key!==key)return;choice=['dark','light'].includes(event.newValue)?event.newValue:null;apply();});
})();
