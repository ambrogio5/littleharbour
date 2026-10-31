/**
 * Little Harbour experimental evolution model.
 * Pure deterministic state; no direct inventory, currency or save mutations.
 * Designed to be embedded behind the existing engine's validated actions later.
 */
export const EVOLUTION_SCHEMA = 1;
export const AXES = Object.freeze(['trade', 'nature', 'community', 'craft']);
const INITIAL = Object.freeze({trade: 30, nature: 45, community: 35, craft: 30});
export const ACTIONS = Object.freeze({
  'ship-cargo': {name: 'Prioritise exports', effect:{trade: 9, nature: -2, craft: 1}},
  'restore-grove': {name: 'Restore olive terraces', effect:{nature: 11, community: 3, trade: -1}},
  'fund-festival': {name: 'Fund a village festival', effect:{community: 11, craft: 2, trade: -2}},
  'train-artisans': {name: 'Support local artisans', effect:{craft: 11, community: 2, trade: 2}},
  'expand-quay': {name: 'Expand the working quay', effect:{trade: 12, craft: 2, nature: -5}},
  'repair-waterfront': {name: 'Restore the waterfront', effect:{community: 8, craft: 6, nature: 2}}
});
const EVENT_DEFS = Object.freeze([
  {id:'merchants', axis:'trade', title:'New merchant partnership', description:'A shipping cooperative asks how Porto Lume should grow.', options:[
    {id:'warehouse', label:'Welcome commercial storage', effect:{trade:9,nature:-3,craft:1}},
    {id:'small-ships', label:'Reserve space for local traders', effect:{trade:4,community:6,nature:1}}
  ]},
  {id:'groves', axis:'nature', title:'The hillside council', description:'The terraces need care after a busy growing season.', options:[
    {id:'restore', label:'Repair the old olive walls', effect:{nature:8,craft:3,trade:-1}},
    {id:'gardens', label:'Open a community garden', effect:{nature:5,community:6}}
  ]},
  {id:'neighbours', axis:'community', title:'A square for everyone', description:'Residents propose a new use for their public space.', options:[
    {id:'festival', label:'Host a seasonal market', effect:{community:7,trade:4}},
    {id:'library', label:'Build a quiet meeting place', effect:{community:8,craft:2}}
  ]},
  {id:'artisans', axis:'craft', title:'Craft guild invitation', description:'Local makers offer to train apprentices.', options:[
    {id:'workshop', label:'Expand the workshop', effect:{craft:9,trade:2,nature:-1}},
    {id:'apprentices', label:'Fund apprenticeships', effect:{craft:6,community:5}}
  ]}
]);
const clamp = (v,min=0,max=100)=>Math.max(min,Math.min(max,v));
const int=(v)=>Number.isInteger(v)&&Number.isFinite(v);
const cleanSeed=s=>((s>>>0)||1);
const hash=(s)=>{let x=s>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return x>>>0;};
function effects(axes, change){const out={...axes};for(const axis of AXES)out[axis]=clamp(out[axis]+(change[axis]||0));return out;}
function appendHistory(state,entry){return [...state.history.slice(-31),entry];}
function validState(s){return !!s&&s.schema===EVOLUTION_SCHEMA&&int(s.seed)&&s.seed>0&&int(s.season)&&s.season>=0&&s.season<=100000&&int(s.choiceCount)&&s.choiceCount>=0&&s.choiceCount<=1000000&&s.axes&&AXES.every(k=>int(s.axes[k])&&s.axes[k]>=0&&s.axes[k]<=100)&&Array.isArray(s.history)&&s.history.length<=32&&s.history.every(x=>x&&typeof x.label==='string'&&x.label.length<=120&&int(x.season))&&(!s.pendingEvent||EVENT_DEFS.some(x=>x.id===s.pendingEvent));}
export function createEvolution(seed=6187){if(!int(seed))throw new TypeError('Seed must be an integer');return {schema:EVOLUTION_SCHEMA,seed:cleanSeed(seed),season:0,choiceCount:0,axes:{...INITIAL},history:[],pendingEvent:null};}
export function applyChoice(state,actionId){assertState(state);const choice=ACTIONS[actionId];if(!choice)throw new RangeError('Unknown choice');return {...state,axes:effects(state.axes,choice.effect),choiceCount:state.choiceCount+1,history:appendHistory(state,{season:state.season,label:choice.name})};}
function eventFor(state){const sorted=[...EVENT_DEFS].sort((a,b)=>state.axes[b.axis]-state.axes[a.axis]);const offset=hash(state.seed+Math.imul(state.season,13)+state.choiceCount)%2;return sorted[offset];}
export function advanceSeason(state){assertState(state);if(state.pendingEvent)throw new Error('Resolve pending event before advancing');const nextSeason=state.season+1;const base={...state,season:nextSeason};const selected=eventFor(base);return {...base,pendingEvent:selected.id,history:appendHistory(base,{season:nextSeason,label:`Season ${nextSeason} begins`})};}
export function currentEvent(state){assertState(state);const e=EVENT_DEFS.find(x=>x.id===state.pendingEvent);return e?{...e,options:e.options.map(o=>({...o,effect:{...o.effect}}))}:null;}
export function resolveEvent(state,optionId){assertState(state);const e=currentEvent(state);if(!e)throw new Error('No event to resolve');const option=e.options.find(x=>x.id===optionId);if(!option)throw new RangeError('Unknown event option');return {...state,pendingEvent:null,axes:effects(state.axes,option.effect),choiceCount:state.choiceCount+1,history:appendHistory(state,{season:state.season,label:option.label})};}
export function deriveWorldStyle(state){assertState(state);const {trade,nature,community,craft}=state.axes;const top=AXES.reduce((best,k)=>state.axes[k]>state.axes[best]?k:best,AXES[0]);return {
  identity:({trade:'Trading port',nature:'Green sanctuary',community:'Village commons',craft:'Artisan harbour'})[top],
  tradeTraffic:Math.round(1+trade/20),
  oliveDensity:Math.round(7+nature/4),
  gardenBeds:Math.round(nature/15),
  lanterns:Math.round(2+community/10),
  marketStalls:Math.round(1+(trade+community)/28),
  workshops:Math.round(1+craft/18),
  repairedFacades:Math.round(craft/14),
  seasons:state.season
 };}
export function serializeEvolution(state){assertState(state);return JSON.stringify(state);}
export function restoreEvolution(json){let state;try{state=JSON.parse(json);}catch{throw new Error('Invalid evolution data');}assertState(state);return {schema:EVOLUTION_SCHEMA,seed:state.seed,season:state.season,choiceCount:state.choiceCount,axes:Object.fromEntries(AXES.map(k=>[k,state.axes[k]])),pendingEvent:state.pendingEvent||null,history:state.history.map(x=>({season:x.season,label:x.label}))};}
export function assertState(s){if(!validState(s))throw new Error('Invalid or incompatible evolution state');return true;}
