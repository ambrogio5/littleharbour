import {ITEMS,RECIPES,FLEET_BOATS,NEIGHBOURHOOD_ACCESS_COST,PLOT_COST,NEIGHBOURHOOD_BUILDINGS,HOME_UPGRADE_COST,SAIL_REFIT_COST,neighbourhoodEligible,neighbourhoodReady,neighbourhoodAccessBlocker,plotBlocker,neighbourhoodBuildBlocker,neighbourhoodMoveBlocker,neighbourhoodRemoveBlocker,homeUpgradeBlocker,sailRefitBlocker,neighbourhoodOrder,neighbourhoodOrderBlocker,RESIDENT_PROPOSALS,residentsComplete,residentsDeliveryBlocker,unlocked,capacity,recipeDuration,canCancel} from './engine.js';

export const NEIGHBOURHOOD_PLOTS=Array.from({length:6},(_,index)=>({index,x:[22,50,78][index%3],y:index<3?39:64}));
const neighbourhoodRecipes=['flax','cloth','furniture','sails'];
function districtTitle(p){return p?.type?NEIGHBOURHOOD_BUILDINGS[p.type].name:p?'Open plot':'Land available';}
export function neighbourhoodBuildingArt(type,level=0){const ids=['home','carpenter','weaver','sailmaker','square','flaxgarden'],index=ids.indexOf(type);return index<0?'':`<span class="neigh-building-art neigh-photo-art ${type==='home'&&level?'furnished':''}" style="background-position:${[0,50,100][index%3]}% ${index<3?0:100}%" aria-hidden="true">${type==='home'&&level?'<i class="neigh-furnished-garden"></i>':''}</span>`; }

export function neighbourhoodMapView(s,ui={}){
 return NEIGHBOURHOOD_PLOTS.map(({index,x,y})=>{const p=s.neighbourhood.plots[index],moving=ui.moveFrom!==null&&ui.moveFrom!==undefined,selected=ui.plot===index;return `<button class="neigh-map-plot ${p?.type?'built':p?'owned':'for-sale'} ${selected?'selected':''} ${moving?'move-target':''}" style="left:${x}%;top:${y}%" data-action="${moving?'neigh-move-target':'neigh-plot'}" data-slot="${index}" aria-label="Plot ${index+1}: ${districtTitle(p)}${p?.level?' · furnished':''}${moving?' · move building here':''}">${p?.type?neighbourhoodBuildingArt(p.type,p.level):'<span class="neigh-empty-pad">'+(p?'+':'◇')+'</span>'}<span class="neigh-map-label"><strong>${p?.type?districtTitle(p):'Plot '+(index+1)}</strong><small>${p?.type?p.type==='home'?(p.level?'Furnished home':'Home · furnishing available'):'Workshop open':p?'Choose a building':'Purchase land'}</small></span></button>`;}).join('')+residentsMapView(s);
}
function neighbourhoodFunding(cost,goal,view){return `<div class="cost">${view.costs(cost)}</div>${view.ingredients(Object.fromEntries(Object.entries(cost).filter(([k])=>k!=='coins')),goal)}${view.goalTools(goal)}`;}
function neighbourhoodPlotTabs(s,ui){return `<div class="neigh-plot-tabs" aria-label="Neighbourhood plots">${s.neighbourhood.plots.map((p,i)=>`<button data-action="neigh-plot" data-slot="${i}" aria-pressed="${ui.plot===i}"><strong>${i+1}</strong><small>${districtTitle(p)}</small></button>`).join('')}</div>`;}
function neighbourhoodJobs(s,station){const jobs=s.jobs.map((j,i)=>({j,i})).filter(({j})=>RECIPES[j.key].station===station);return `<div class="queue"><div class="section-label">PRODUCTION QUEUE <span>${capacity(s,station)} SLOTS HERE</span></div>${jobs.length?jobs.map(({j,i})=>`<div class="job"><div class="job-name"><span>${RECIPES[j.key].name}</span><small data-jobtime="${i}"></small></div><div class="progress"><i data-jobbar="${i}"></i></div>${canCancel(s,i)?`<div class="job-actions"><button data-action="prioritize" data-index="${i}">Move next</button><button data-action="cancel" data-index="${i}">Cancel & refund</button></div>`:''}</div>`).join(''):'<div class="empty-queue">No batches queued.</div>'}</div>`;}
function neighbourhoodRecipeView(s,key,view){const r=RECIPES[key],ready=unlocked(s,key);return `<article class="neigh-production"><h3 class="ingredient-name">${view.resourceIcon(Object.keys(r.output)[0])}${r.name}</h3><p class="hint">${Object.keys(r.cost).length?view.costs(r.cost):'No ingredients needed'} → ${view.costs(r.output)} · ${recipeDuration(s,key)} simulation seconds</p>${ready?`${view.ingredients(r.cost)}${view.recipeButton(key,r.name)}${view.autoControl(key)}${neighbourhoodJobs(s,r.station)}`:`<p class="hint">Build the ${NEIGHBOURHOOD_BUILDINGS[r.station]?.name||r.station} to start this production.</p><button class="text-button" data-action="neigh-section" data-key="overview">Choose a plot →</button>`}</article>`;}
function neighbourhoodProductionView(s,view){return `<h2>Make things for a growing town.</h2><p class="description">Grow flax, weave cloth and make sails. Furniture supplies homes and district orders. Workshops work in parallel; stock targets use their existing queues.</p>${neighbourhoodRecipes.map(key=>neighbourhoodRecipeView(s,key,view)).join('')}`;}
function neighbourhoodOrdersView(s,view){const order=neighbourhoodOrder(s),reason=neighbourhoodOrderBlocker(s);return `<h2>Supply your neighbours.</h2><p class="description">A rotating order gives your workshops ongoing work. Deliver from storage when ready; nothing expires while you are away.</p><article class="neigh-order"><div class="panel-eyebrow">DISTRICT ORDER ${s.neighbourhood.orders+1}</div><h3>${order.name}</h3>${neighbourhoodFunding(order.cost,order.goal,view)}<div class="reward"><span>In return</span><strong>${view.costs(order.reward)}</strong></div><button class="button" data-action="neigh-order" data-count="${order.id}" ${reason?'disabled':''}>Deliver district order</button>${reason?`<p class="hint">${reason}</p>`:''}</article><h3 class="neigh-subheading">Permanent fleet refits</h3><p class="hint">Locally made sails cut future voyage times by 10%. The permanent refit combines with speed or cargo upgrades and leaves a voyage already at sea unchanged.</p>${s.fleet.boats.map((boat,i)=>{const why=sailRefitBlocker(s,i);return `<article class="neigh-refit"><h3>Berth ${i+1}${boat?' · '+FLEET_BOATS[boat.type].name:''}</h3>${boat?.sails?'<span class="success-tag">New sails fitted</span>':`${neighbourhoodFunding(SAIL_REFIT_COST,'neighbourhood:sails:'+i,view)}<button class="button secondary" data-action="neigh-refit" data-slot="${i}" ${why?'disabled':''}>Fit new sails</button>${why?`<p class="hint">${why}</p>`:''}`}</article>`;}).join('')}`;}
function neighbourhoodPlotView(s,ui,view){const index=Number.isInteger(ui.plot)&&ui.plot>=0&&ui.plot<6?ui.plot:0,p=s.neighbourhood.plots[index];let html=neighbourhoodPlotTabs(s,{...ui,plot:index});
 if(ui.moveFrom!==null&&ui.moveFrom!==undefined){return html+`<article class="neigh-move"><h3>Move ${districtTitle(s.neighbourhood.plots[ui.moveFrom]).toLowerCase()}</h3><p>Choose any purchased plot. Occupied plots swap buildings for free; their upgrades stay with them.</p><div class="neigh-move-targets">${s.neighbourhood.plots.map((target,i)=>{const why=neighbourhoodMoveBlocker(s,ui.moveFrom,i);return `<button class="button secondary" data-action="neigh-move-target" data-slot="${i}" ${why?'disabled':''}>Plot ${i+1} · ${districtTitle(target)}</button>`;}).join('')}</div><button class="text-button" data-action="neigh-move-cancel">Cancel move</button></article>`;}
 html+=`<div class="panel-eyebrow">PLOT ${index+1} OF 6</div>`;
 if(!p){const reason=plotBlocker(s,index);return html+`<article class="neigh-order"><h2>Room to grow.</h2><p class="description">Purchase this plot, then choose what to build. Six plots keep space valuable; you can move buildings or redevelop a plot later.</p>${neighbourhoodFunding(PLOT_COST,'neighbourhood:plot:'+index,view)}<button class="button" data-action="neigh-buy" data-slot="${index}" ${reason?'disabled':''}>Purchase plot ${index+1}</button>${reason?`<p class="hint">${reason}</p>`:''}</article>`;}
 if(!p.type)return html+`<h2>Choose what belongs here.</h2><p class="description">Each workshop and the square can be built once. You can build up to two homes. With six plots, a second home means making a choice about another building.</p>${Object.entries(NEIGHBOURHOOD_BUILDINGS).map(([type,d])=>{const reason=neighbourhoodBuildBlocker(s,index,type),goal='neighbourhood:build:'+index+':'+type;return `<article class="neigh-build-choice">${neighbourhoodBuildingArt(type)}<h3>${d.name}</h3><p>${d.description}</p>${neighbourhoodFunding(d.cost,goal,view)}<button class="button" data-action="neigh-build" data-slot="${index}" data-key="${type}" ${reason?'disabled':''}>Build ${d.name.toLowerCase()}</button>${reason?`<p class="hint">${reason}</p>`:''}</article>`;}).join('')}`;
 const d=NEIGHBOURHOOD_BUILDINGS[p.type],removeReason=neighbourhoodRemoveBlocker(s,index);html+=`<article class="neigh-built-summary">${neighbourhoodBuildingArt(p.type,p.level)}<h2>${d.name}</h2><p class="description">${d.description}</p>${p.type==='home'?p.level?'<span class="success-tag">Furnished home · upgrade complete</span>':(()=>{const why=homeUpgradeBlocker(s,index);return `<h3>Make it a home.</h3><p class="hint">Furnishing adds one more queue slot to every neighbourhood workshop.</p>${neighbourhoodFunding(HOME_UPGRADE_COST,'neighbourhood:home:'+index,view)}<button class="button" data-action="neigh-upgrade" data-slot="${index}" ${why?'disabled':''}>Furnish this home</button>${why?`<p class="hint">${why}</p>`:''}`;})():''}</article>`;
 const keys=neighbourhoodRecipes.filter(k=>RECIPES[k].station===p.type);html+=keys.map(k=>neighbourhoodRecipeView(s,k,view)).join('');
 return html+`<div class="neigh-building-tools"><button class="button secondary" data-action="neigh-move-start" data-slot="${index}">Move or swap building</button><button class="text-button" data-action="neigh-remove" data-slot="${index}" ${removeReason?'disabled':''}>Redevelop this plot…</button><p class="hint">Redevelopment removes this building, returns half its original coin cost and keeps the land. Materials and furnishing costs are not refunded.${removeReason?' '+removeReason:''}</p></div>`;
}
export function neighbourhoodPanelView(s,ui,view){let html=`<div class="panel-eyebrow">CHAPTER 04 · THE NEW NEIGHBOURHOOD</div><button class="text-button" data-action="district" data-key="neighbourhood">Explore the neighbourhood →</button>`;
 if(!neighbourhoodReady(s)){const reason=neighbourhoodAccessBlocker(s);return html+`<h2>A new part of town.</h2><p class="description">Turn coastal trade into a place to live and work. Purchase six plots, build a textile chain and furnish homes, then supply your neighbours and refit your fleet.</p>${neighbourhoodEligible(s)?neighbourhoodFunding(NEIGHBOURHOOD_ACCESS_COST,'neighbourhood:access',view):''}<button class="button" data-action="neigh-open" ${reason?'disabled':''}>Open the neighbourhood</button>${reason?`<p class="hint">${reason}</p>`:''}`;}
 html+=`<div class="neigh-navigation" aria-label="Neighbourhood sections">${[['overview','Plots & homes'],['production','Workshops'],['orders','Orders & refits']].map(([key,label])=>`<button data-action="neigh-section" data-key="${key}" aria-pressed="${ui.section===key}">${label}</button>`).join('')}</div>`;
 html+='<button class="text-button" data-action="residents-open">Visit the residents’ plot →</button>';
 return html+(ui.section==='production'?neighbourhoodProductionView(s,view):ui.section==='orders'?neighbourhoodOrdersView(s,view):neighbourhoodPlotView(s,ui,view));
}


/* An authored lightweight SVG changes with completed supply transactions.
   Kept as vector markup instead of encoding any large photographic asset. */
function residentsIllustration(proposal,delivered){
 const base='<svg class="residents-illustration" viewBox="0 0 360 230" aria-hidden="true" focusable="false">'
  +'<defs><linearGradient id="residents-soil" x2=".7" y2="1"><stop stop-color="#a9a17d"/><stop offset="1" stop-color="#647c62"/></linearGradient></defs>'
  +'<path d="M13 113 179 22 351 114 182 210Z" fill="#364c3c" opacity=".3" transform="translate(1 7)"/>'
  +'<path d="M13 113 179 22 351 114 182 210Z" fill="url(#residents-soil)" stroke="#e4d5ae" stroke-width="5"/>'
  +'<path d="M48 112 181 43 316 114 182 187Z" fill="#7d8c70" opacity=".76"/>';
 const path=delivered>0?'<path d="M68 112 181 52 292 113 181 172Z" fill="#c9baa0" stroke="#f0dfbb" stroke-width="3"/><path d="M181 52V172M68 112H292" stroke="#a7a086" stroke-width="6" opacity=".75"/>':'<path d="M82 113 181 65 282 114 181 162Z" stroke="#eee5bf" stroke-dasharray="8 7" stroke-width="3" fill="none"/>';
 let work='';
 if(proposal==='garden'&&delivered>1){
   work='<ellipse cx="117" cy="94" rx="27" ry="16" fill="#3f6443"/><ellipse cx="229" cy="93" rx="28" ry="17" fill="#466b48"/><ellipse cx="116" cy="137" rx="27" ry="17" fill="#416b48"/><ellipse cx="229" cy="139" rx="27" ry="17" fill="#4b704a"/>'
    +'<circle cx="116" cy="91" r="15" fill="#7d9464"/><circle cx="228" cy="93" r="15" fill="#829b67"/><circle cx="116" cy="136" r="15" fill="#90a66f"/><circle cx="227" cy="136" r="15" fill="#7f9b67"/>';
 }else if(proposal==='square'&&delivered>1){
   work='<path d="M92 82 125 63 154 81 120 101Z" fill="#c98755" stroke="#eed7ab" stroke-width="3"/><path d="M202 82 235 63 265 82 231 100Z" fill="#b97958" stroke="#eed7ab" stroke-width="3"/>'
   +'<path d="M92 82v29l28 17V101M154 81v30l-34 17M202 82v29l29 17V100M265 82v29l-34 17" stroke="#e9ddc4" stroke-width="4" fill="none"/>';
 }
 if(delivered===3&&proposal==='garden'){
   work+='<path d="M160 110 183 99 205 110 183 124Z" fill="#e8dfc5"/><path d="M171 108v12M194 109v10" stroke="#7e6543" stroke-width="4"/><circle cx="157" cy="86" r="4" fill="#e1b0a0"/><circle cx="204" cy="149" r="4" fill="#d9c17a"/>';
 }
 if(delivered===3&&proposal==='square'){
   work+='<ellipse cx="179" cy="123" rx="29" ry="14" fill="#8d9e94" stroke="#f2ead6" stroke-width="5"/><path d="M179 103v18" stroke="#e4edf0" stroke-width="5"/><ellipse cx="179" cy="101" rx="11" ry="6" fill="#d9e9e3"/><path d="M83 116l-10 5M276 117l12 7" stroke="#cfab67" stroke-width="7"/>';
 }
 return base+path+work+'</svg>';
}
export function residentsMapView(s){
 const r=s.residents,done=residentsComplete(s),title=r?.proposal?RESIDENT_PROPOSALS[r.proposal].name:'Residents’ plot';
 const status=!neighbourhoodReady(s)?'Open the neighbourhood':done?'Completed · permanent benefit':r.delivered?'Delivery '+r.delivered+' / 3':'Compare the proposals';
 const dots=[0,1,2].map(i=>'<i class="'+(i<r.delivered?'done':'')+'"></i>').join('');
 return '<button class="residents-map-site" type="button" data-action="residents-open" aria-label="Residents’ plot: '+status+'">'
  +residentsIllustration(r.proposal,r.delivered)
  +'<span class="residents-map-label"><strong>'+title+'</strong><small>'+status+'</small><span class="residents-stage-dots" aria-hidden="true">'+dots+'</span></span></button>';
}
export function residentsEntryView(s){
 if(!neighbourhoodReady(s))return '';
 const r=s.residents,done=residentsComplete(s),name=r.proposal?RESIDENT_PROPOSALS[r.proposal].name:'Choose a civic project';
 return '<article class="build-card residents-entry"><div class="panel-eyebrow">CHAPTER 04 · RESIDENTS’ PLOT</div><h3>'+name+'</h3><p>Two proposals. Three deliveries. Your first delivery commits the plot; the finished project changes town life permanently.</p>'
  +'<span class="resident-entry-status">'+(done?'Completed · benefit active':r.delivered?r.delivered+' / 3 deliveries made':r.proposal?'Selected · not yet committed':'Ready for your decision')+'</span>'
  +'<button class="button secondary" data-action="residents-open">'+(!r.proposal?'Compare the proposals':done?'Visit the completed plot':'Manage the residents’ project')+' →</button></article>';
}
export function residentsPanelView(s,view){
 const r=s.residents;
 let html='<button class="text-button" data-action="go-build">← Town development</button><div class="panel-eyebrow">CHAPTER 04 · THE RESIDENTS’ PLOT</div><h2>A place chosen by its residents.</h2>';
 if(!neighbourhoodReady(s))return html+'<p class="description">Open the new neighbourhood to unlock the civic plot.</p><button class="button" data-action="go-neighbourhood">Open neighbourhood plan →</button>';
 const locked=r.delivered>0;
 html+='<p class="description">Compare two permanent town improvements. Changing proposals is free until you make the first supply delivery. Once supplies are delivered, your choice is final.</p>'
  +'<div class="residents-proposals">'
  +Object.entries(RESIDENT_PROPOSALS).map(([key,p])=>{
    const active=r.proposal===key,selected=active?' selected':'',complete=residentsComplete(s,key);
    return '<article class="resident-proposal'+selected+'"><div class="resident-preview">'+residentsIllustration(key,3)+'</div><div class="panel-eyebrow">'+(active?complete?'COMPLETED':locked?'COMMITTED':'SELECTED':'PROPOSAL')+'</div><h3>'+p.name+'</h3><p>'+p.description+'</p><strong class="resident-benefit">'+p.benefit+'</strong>'
     +(!locked?'<button class="button '+(active?'secondary':'')+'" data-action="residents-select" data-key="'+key+'" '+(active?'disabled':'')+'>'+(active?'Current proposal':'Choose '+p.name.toLowerCase())+'</button>':'')+'</article>';
   }).join('')+'</div>';
 if(!r.proposal)return html+'<p class="hint">Choose either proposal to see the first stage and available supplies. No resources are spent when selecting.</p>';
 if(residentsComplete(s))return html+'<article class="resident-delivery complete"><span class="success-tag">All three deliveries complete</span><h3>'+RESIDENT_PROPOSALS[r.proposal].name+' is open</h3><p>'+RESIDENT_PROPOSALS[r.proposal].benefit+'</p><button class="button secondary" data-action="district" data-key="neighbourhood">View the finished site on the map →</button></article>';
 const p=RESIDENT_PROPOSALS[r.proposal],stage=p.stages[r.delivered],goal='residents:'+r.proposal+':'+r.delivered,reason=residentsDeliveryBlocker(s,r.proposal,r.delivered);
 html+='<article class="resident-delivery"><div class="panel-eyebrow">'+(locked?'COMMITTED PROJECT':'UNCOMMITTED CHOICE')+'</div><h3>'+stage.name+'</h3>'
  +'<p>Delivery '+(r.delivered+1)+' of 3 · '+p.name+'</p>'
  +'<div class="resident-stage-track" aria-label="'+r.delivered+' of 3 deliveries complete">'+[0,1,2].map(i=>'<span class="'+(i<r.delivered?'done':'')+'">'+(i+1)+'</span>').join('')+'</div>'
  +'<div class="cost">'+view.costs(stage.cost)+'</div>'+view.ingredients(stage.cost,goal)+view.goalTools(goal)
  +'<button class="button" data-action="residents-deliver" data-key="'+r.proposal+'" data-stage="'+r.delivered+'" '+(reason?'disabled':'')+'>'+(r.delivered?'Deliver supplies '+(r.delivered+1)+' of 3':'Deliver first supplies & commit to '+p.name.toLowerCase())+'</button>'
  +(reason?'<p class="hint">'+reason+'</p>':'<p class="hint">Supplies will be taken from storage immediately.</p>')
  +'<button class="text-button" data-action="district" data-key="neighbourhood">Locate this project on the map →</button></article>';
 return html;
}
