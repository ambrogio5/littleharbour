// Authored map geometry, independent of ownership and simulation state.
// All x/y values are percentages; polygon points are native 1536 × 1024 pixels.
// Crop overlays belong inside these soil polygons and should never cover the walls.
export const INLAND_SIZE={width:1536,height:1024};
export const INLAND_BASE_IMAGE='assets/inland-base.png';
export const INLAND_BUILT_IMAGE='assets/inland-built.png';
export const INLAND_PLOTS=[
 {id:0,name:'West terrace',station:'terrace0',x:27,y:34,width:38,height:21,
  polygon:'145,348 320,244 501,248 690,292 742,323 687,416 578,453 373,423 166,370',
  clip:'polygon(9.4% 34%,20.8% 23.8%,32.6% 24.2%,44.9% 28.5%,48.3% 31.5%,44.7% 40.6%,37.6% 44.2%,24.3% 41.3%,10.8% 36.1%)',
  cropRows:[[280,310,580,343],[235,343,625,386],[273,382,576,416]],
  roadPoint:{x:750,y:464},construction:{x:418,y:357}},
 {id:1,name:'East terrace',station:'terrace1',x:75,y:33,width:37,height:20,
  polygon:'879,299 1020,256 1250,247 1375,284 1468,349 1398,388 1193,420 988,427 897,389',
  clip:'polygon(57.2% 29.2%,66.4% 25%,81.4% 24.1%,89.5% 27.7%,95.6% 34.1%,91% 37.9%,77.7% 41%,64.3% 41.7%,58.4% 38%)',
  cropRows:[[1000,294,1290,289],[962,332,1374,328],[1010,377,1330,375]],
  roadPoint:{x:864,y:475},construction:{x:1155,y:340}}
];
export const INLAND_KILN={id:'kiln',station:'kiln',name:'Pottery kiln',x:66,y:64,width:21,height:25,
 builtClip:'polygon(56% 54%,63% 51%,67.5% 47%,70% 49%,70% 55%,73.4% 60%,75.7% 66%,74.5% 70.5%,64% 72%,59% 68%,56% 64%)',
 chimney:{x:1055,y:502},construction:{x:1024,y:666},roadPoint:{x:860,y:728}};
export const INLAND_PRESERVING={id:'preserving',station:'preserving',name:'Preserving shed',x:85,y:62,width:19,height:24,
 builtClip:'polygon(76% 53%,82% 47%,88% 51%,94.5% 57%,93.5% 66.5%,91% 69.3%,81% 69%,76% 63%)',
 construction:{x:1300,y:650},roadPoint:{x:1100,y:777}};
export const INLAND_CLAY={id:'claypit',station:'claypit',name:'Clay pit',x:26,y:69,width:30,height:19,
 roadPoint:{x:697,y:730},construction:{x:403,y:713}};
export const INLAND_ROADS={arrival:[[980,1024],[878,856],[777,708],[736,616]],west:[[736,616],[784,509],[750,464]],east:[[784,509],[864,475]],kiln:[[777,708],[860,728],[1007,739]],preserving:[[860,728],[1100,777],[1240,731]],clay:[[777,708],[697,730],[536,744]]};
