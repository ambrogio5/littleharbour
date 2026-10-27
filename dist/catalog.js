export const ITEMS={wheat:'Wheat',flour:'Flour',bread:'Bread',olives:'Olives',oil:'Olive oil',fish:'Fish',wood:'Timber',stone:'Stone',planks:'Planks',boatparts:'Boat fittings',grapes:'Grapes',wine:'Wine',provisions:'Provisions',clay:'Clay',fruit:'Fruit',vegetables:'Vegetables',jars:'Jars',tiles:'Tiles',preserves:'Preserves'};
export const RECIPES={
 clay:{name:'Gather clay',station:'claypit',cost:{},output:{clay:4},duration:16},
 orchard0:{name:'Harvest upper orchard',station:'terrace0',cost:{},output:{fruit:4},duration:12},
 garden0:{name:'Harvest upper garden',station:'terrace0',cost:{},output:{vegetables:6},duration:20},
 orchard1:{name:'Harvest lower orchard',station:'terrace1',cost:{},output:{fruit:4},duration:12},
 garden1:{name:'Harvest lower garden',station:'terrace1',cost:{},output:{vegetables:6},duration:20},
 jars:{name:'Fire jars',station:'kiln',cost:{clay:2,wood:1},output:{jars:2},duration:18},
 tiles:{name:'Fire tiles',station:'kiln',cost:{clay:4,wood:2},output:{tiles:4},duration:22},
 fruitPreserves:{name:'Preserve fruit',station:'preserving',cost:{fruit:4,jars:2},output:{preserves:4},duration:24},
 vegetablePreserves:{name:'Preserve vegetables',station:'preserving',cost:{vegetables:6,jars:2},output:{preserves:4},duration:12},
 field:{name:'Grow wheat',station:'field',cost:{},output:{wheat:6},duration:12},
 mill:{name:'Mill flour',station:'mill',cost:{wheat:2},output:{flour:2},duration:8},
 bakery:{name:'Bake bread',station:'bakery',cost:{flour:2},output:{bread:2},duration:12},
 fishing:{name:'Send fishing boat',station:'fishing',cost:{},output:{fish:2},duration:14},
 olives:{name:'Gather olives',station:'olive',cost:{},output:{olives:4},duration:10},
 press:{name:'Press olive oil',station:'olive',cost:{olives:2},output:{oil:2},duration:12},
 saw:{name:'Saw planks',station:'boatyard',cost:{wood:2},output:{planks:4},duration:12},
 fittings:{name:'Make boat fittings',station:'boatyard',cost:{planks:4},output:{boatparts:2},duration:20},
 grapes:{name:'Harvest grapes',station:'estate',cost:{},output:{grapes:4},duration:18},
 provisions:{name:'Prepare provisions',station:'kitchen',cost:{bread:2,oil:2},output:{provisions:4},duration:16},
 wine:{name:'Make wine',station:'estate',cost:{grapes:4},output:{wine:2},duration:24}
};
export const BUILD_COST={coins:80,wood:12,stone:4},SECOND_COST={coins:110,wood:10,stone:4},PIER_COST={coins:140,wood:10,stone:8},WORKSHOP_COST={coins:120,wood:8,stone:4};

export const PATHS={
 maritime:{name:'Working waterfront',station:'boatyard',building:'Boatyard',requires:'fishing',cost:{coins:160,wood:12,stone:6},chain:'Timber → planks → boat fittings',description:'Refit the coastal fleet. Timber feeds your boatyard, while fish supplies the crews.'},
 estate:{name:'Coastal estate',station:'estate',building:'Vineyard & cellar',requires:'olive',cost:{coins:160,wood:8,stone:10},chain:'Grapes → wine, alongside olive oil',description:'Supply wine merchants and restaurants. Harvest grapes, make wine, and keep oil and bread moving.'}
};
export const CONTRACTS={
 fleet:{path:'maritime',name:'The coastal fishing fleet',client:'Porto Santo cooperative',description:'Refit boats and supply the crews over three shipments.',cost:{fish:4,boatparts:2,bread:2},shipments:3,coins:90,wood:2,stone:1,bonus:240},
 refit:{path:'maritime',name:'Winter refit programme',client:'Cala Verde boat owners',description:'A heavier fitting order. Timber supply matters more than food production.',cost:{fish:2,boatparts:4},shipments:3,coins:110,wood:2,stone:2,bonus:280},
 restaurants:{path:'estate',name:'The coastal restaurant route',client:'Cala Verde kitchens',description:'Keep three restaurant deliveries supplied with oil, wine and fresh bread.',cost:{oil:2,wine:2,bread:4},shipments:3,coins:90,wood:2,stone:1,bonus:240},
 merchants:{path:'estate',name:'The island wine merchants',client:'Isola Lunga merchants',description:'Larger wine shipments need a reliable harvest and cellar queue.',cost:{oil:2,wine:4},shipments:3,coins:110,wood:2,stone:2,bonus:280}
};
export const CHARTER_COST={coins:400,wood:20,stone:12};

export const REFITS={
 mill:{name:'Stone mill',speed:{name:'Improved gearing',cost:{coins:90,wood:6,stone:2}},queue:{name:'Grain staging area',cost:{coins:90,wood:8,stone:2}}},
 bakery:{name:'Bakery',speed:{name:'Efficient oven',cost:{coins:120,wood:4,stone:6}},queue:{name:'Preparation benches',cost:{coins:120,wood:8,stone:4}}},
 fishing:{name:'Fishing jetty',speed:{name:'Refitted engine',cost:{coins:140,wood:10,stone:4}},queue:{name:'Extra loading berths',cost:{coins:140,wood:14,stone:2}}}
};

export const WATERFRONT_SECONDS=12;
export const WATERFRONT_STAGES=[
 {name:'Sea wall',description:'Repair the stone edge and pave the working quay.',cost:{coins:200,wood:12,stone:20},maritime:{bread:4,fish:2},estate:{bread:4,oil:2}},
 {name:'Public landing',description:'Rebuild the landing, steps and mooring points.',cost:{coins:300,wood:24,stone:12},maritime:{planks:6,boatparts:2},estate:{wine:4,oil:4}},
 {name:'Trading arcade',description:'Fit out covered counters beside the harbour warehouse.',cost:{coins:400,wood:16,stone:16},maritime:{bread:6,boatparts:4,fish:4},estate:{bread:6,wine:6,oil:4}}
];

export const MARKET_ACCESS_COST={coins:200,wood:16,stone:12};
export const MARKET_SECONDS={access:12,business:8,demand:60};
export const MARKET_BUSINESSES={
 fishmonger:{plot:0,name:'Fishmonger',requires:'fishing',cost:{coins:120,wood:8,stone:4},order:{fish:4},coins:60},
 kitchen:{plot:1,name:'Harbour kitchen',requires:'olive',cost:{coins:120,wood:8,stone:4},order:{provisions:4},coins:90}
};

// Inland recipes share ordinary inventory, queues and simulation time.
export const INLAND_ACCESS_COST={coins:240,wood:16,stone:16};
export const INLAND_SECONDS={access:12,terrace:10,kiln:12,courtyard:12};
export const TERRACE_TYPES={
 orchard:{name:'Fruit orchard',recipePrefix:'orchard',cost:{coins:140,wood:10,stone:4},description:'Frequent fruit harvests; slower preserving. Four fruit fill a batch of jars.'},
 garden:{name:'Kitchen garden',recipePrefix:'garden',cost:{coins:140,wood:6,stone:8},description:'Slower, larger harvests; quick preserving. Six vegetables fill a batch of jars.'}
};
export const KILN_COST={coins:200,wood:10,stone:16};
export const COURTYARD_COST={coins:240,tiles:12,stone:8};

export const FLEET_BOATS={
 cutter:{name:'Coastal cutter',description:'A light, quick vessel. Smaller cargo keeps departures affordable.',cost:{coins:240,wood:16,stone:4},cargoScale:1,timeScale:.75},
 coaster:{name:'Trading coaster',description:'Twice the cargo and reward per voyage, with longer journeys.',cost:{coins:360,wood:24,stone:8},cargoScale:2,timeScale:1.25}
};
export const FLEET_UPGRADES={
 speed:{name:'Improved rigging',description:'Voyages take 25% less time. Replaces the cargo setup.',cost:{coins:180,wood:12,stone:8},timeScale:.75,cargoScale:1},
 cargo:{name:'Expanded hold',description:'Single-destination voyages carry 50% more goods for 50% more reward. Circuits gain 50% hold capacity. Replaces the speed setup.',cost:{coins:220,wood:16,stone:12},timeScale:1,cargoScale:1.5}
};
export const FLEET_ROUTES={
 quarry:{name:'Pietra Cove',description:'Preserves, bread and empty jars supply the quarry crews. Return with building materials.',tiers:[
  {name:'Quarry supply run',cost:{preserves:4,bread:4,jars:2},reward:{coins:80,wood:14,stone:18},duration:40,visits:0,lighthouse:false},
  {name:'Quarry partnership',cost:{preserves:4,bread:4,jars:2},reward:{coins:100,wood:18,stone:23},duration:40,visits:3,lighthouse:false},
  {name:'Outer quarry expedition',cost:{preserves:8,bread:8,jars:4},reward:{coins:240,wood:42,stone:54},duration:70,visits:3,lighthouse:true}
 ]},
 island:{name:'Isola dei Pescatori',description:'Preserves, bread and roof tiles support the island fishing community. Return with stronger coin earnings.',tiers:[
  {name:'Island supply run',cost:{preserves:4,bread:2,tiles:2},reward:{coins:340,wood:4,stone:4},duration:48,visits:0,lighthouse:false},
  {name:'Island partnership',cost:{preserves:4,bread:2,tiles:2},reward:{coins:425,wood:5,stone:5},duration:48,visits:3,lighthouse:false},
  {name:'Outer island expedition',cost:{preserves:8,bread:4,tiles:4},reward:{coins:1020,wood:12,stone:12},duration:84,visits:3,lighthouse:true}
 ]}
};
export const LIGHTHOUSE_SECONDS=18;
export const LIGHTHOUSE_STAGES=[
 {name:'Lighthouse foundation',description:'Secure the headland after making your first quarry connection.',cost:{coins:300,wood:8,stone:20,tiles:4},requires:{quarry:1,island:0}},
 {name:'Keeper’s house',description:'Roof and provision the keeper’s house after establishing a quarry partnership and reaching the island.',cost:{coins:450,wood:12,stone:24,tiles:8,preserves:4},requires:{quarry:3,island:1}},
 {name:'Lantern and second berth',description:'Complete both coastal partnerships. The beacon opens a second berth and longer expeditions.',cost:{coins:600,wood:16,stone:20,tiles:12,preserves:8},requires:{quarry:3,island:3}}
];

export const COASTAL_PROJECTS={
 quarry:[
  {name:'Crew landing',description:'Rebuild the landing. All quarry voyages return 20% more timber and stone.',cost:{coins:280,wood:20,stone:16,tiles:8},visits:3},
  {name:'Cargo crane',description:'Fit a loading crane. Every boat gains six cargo spaces per base cargo scale.',cost:{coins:420,wood:28,stone:24,jars:12},visits:5},
  {name:'Masons’ workshop',description:'Open a workshop with rotating supply commissions for construction materials.',cost:{coins:650,wood:32,stone:40,tiles:20,preserves:12},visits:8}
 ],
 island:[
  {name:'Covered fish market',description:'Roof the trading square. All island voyages return 15% more coins.',cost:{coins:320,wood:16,stone:16,tiles:12},visits:3},
  {name:'Coastal pilot station',description:'Establish local pilots. All fleet voyages become 15% faster.',cost:{coins:460,wood:24,stone:20,preserves:12},visits:5},
  {name:'Island chandlery',description:'Open a chandlery with rotating supply commissions for strong coin returns.',cost:{coins:700,wood:30,stone:32,tiles:20,jars:16},visits:8}
 ]
};
export const COASTAL_COMMISSIONS={
 quarry:[
  {name:'Masons’ lunch provision',cost:{bread:12,preserves:8},reward:{coins:140,wood:28,stone:46}},
  {name:'Workshop roof repair',cost:{tiles:12,wood:8},reward:{coins:180,wood:16,stone:48}},
  {name:'Crew pantry restock',cost:{jars:8,preserves:8,oil:4},reward:{coins:180,wood:36,stone:36}}
 ],
 island:[
  {name:'Harbour feast',cost:{bread:10,fish:8,preserves:6},reward:{coins:720}},
  {name:'Roofing the waterfront',cost:{tiles:12,wood:10},reward:{coins:620}},
  {name:'Chandlery provisions',cost:{jars:10,oil:6,preserves:8},reward:{coins:820}}
 ]
};
