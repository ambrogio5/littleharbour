export const ITEMS={wheat:'Wheat',flour:'Flour',bread:'Bread',olives:'Olives',oil:'Olive oil',fish:'Fish',wood:'Timber',stone:'Stone',planks:'Planks',boatparts:'Boat fittings',grapes:'Grapes',wine:'Wine',provisions:'Provisions'};
export const RECIPES={
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
