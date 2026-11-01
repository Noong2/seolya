export const ROOM_CAPACITY=8;
export const BIRD_NAMES=['참새','박새','곤줄박이','동고비','오목눈이','방울새','멧새','딱새','울새','굴뚝새','직박구리','종달새','찌르레기','까치','물까치','어치','두루미','백로','왜가리','청둥오리','원앙','산비둘기','제비','칼새','후투티','꾀꼬리','동박새','소쩍새','올빼미','부엉이','황조롱이','새매','딱따구리','물총새','파랑새','도요새','물떼새','비오리','기러기','고니'];
export const OUTFITS=[{hat:'#ae7152',scarf:'#6c8575',coat:'#d7cbb3'},{hat:'#647d91',scarf:'#b99c66',coat:'#c8c0ab'},{hat:'#ad8d52',scarf:'#68827e',coat:'#ded1b8'},{hat:'#967c96',scarf:'#bca579',coat:'#c8cebd'},{hat:'#6f895d',scarf:'#a57961',coat:'#d7ccb9'},{hat:'#ac6e73',scarf:'#6e8693',coat:'#d8c6af'},{hat:'#657a78',scarf:'#ad895d',coat:'#c5cbbc'},{hat:'#9d845d',scarf:'#957d8e',coat:'#ddd1bf'}];
export const SEATS=[
  {id:0,x:-1.12,y:.2,z:4.1,yaw:Math.PI,label:'소파 첫 번째 자리'},
  {id:1,x:-.12,y:.2,z:4.1,yaw:Math.PI,label:'소파 두 번째 자리'},
  {id:2,x:.88,y:.2,z:4.1,yaw:Math.PI,label:'소파 세 번째 자리'},
  {id:3,x:1.88,y:.2,z:4.1,yaw:Math.PI,label:'소파 네 번째 자리'},
  {id:4,x:3.70,y:.2,z:.61,yaw:Math.PI*1.5-.25,label:'창가 안락의자'},
  {id:5,x:-4.30,y:.2,z:.16,yaw:Math.PI*.5+.25,label:'벽난로 안락의자'},
  {id:6,x:4.55,y:.2,z:-2.5,yaw:Math.PI*1.5,label:'창가 소파 첫 번째 자리'},
  {id:7,x:4.55,y:.2,z:-3.5,yaw:Math.PI*1.5,label:'창가 소파 두 번째 자리'}
];
export const SPAWNS=[{x:0,z:-1.85},{x:1.1,z:-1.85},{x:2.1,z:-2.1},{x:-1.2,z:-2.1},{x:2.3,z:2.3},{x:-2.4,z:2.4},{x:-3,z:-2.4},{x:1.4,z:-3.1}];
export const CABIN_OBSTACLES=[
  {minX:-4.3,maxX:-.15,minZ:-5.95,maxZ:-4.25},
  {minX:-1.25,maxX:1.75,minZ:-.57,maxZ:1.37},
  {minX:-2.04,maxX:2.84,minZ:3.64,maxZ:5.16},
  {minX:3.05,maxX:4.68,minZ:-.3,maxZ:1.62},
  {minX:-5.25,maxX:-3.65,minZ:-.75,maxZ:1.15},
  {minX:3.48,maxX:5.35,minZ:5.35,maxZ:6.2},
  {minX:.95,maxX:2.25,minZ:5.34,maxZ:6.2},
  {minX:-5.52,maxX:-4.88,minZ:1.88,maxZ:2.52},
  {minX:5.15,maxX:5.78,minZ:3.5,maxZ:4.1},
  {minX:3.9,maxX:5.5,minZ:-4.2,maxZ:-1.8}
];
