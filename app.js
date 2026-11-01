import * as THREE from './vendor/three.module.js';
import {createWinterLandscape,completeCabin} from './world.js';
import {CabinExplorer} from './explorer.js';
import {CabinAudio} from './audio.js';
import {createHearthFire} from './fire.js';
import {nightProgress,DRINK_DURATION} from './experience-state.js';

const $ = id => document.getElementById(id);
const iconPaths = {
  cabin:'<path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7M15 3h3v5"/>',
  flame:'<path d="M13 2c1 5-3 5-1 9 2-1 3-3 3-4 4 4 5 7 3 11a7 7 0 0 1-12 0c-2-4 0-8 3-11-1 4 0 5 1 6 0-5 4-6 3-11Z"/><path d="M10 20c-2-3 0-5 2-7 0 3 4 4 2 7"/>',
  snow:'<path d="M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4M20 14l-4 1 1 4M4 14l4 1-1 4M20 10l-4-1 1-4"/>',
  cup:'<path d="M4 9h13v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3ZM17 10h2a3 3 0 0 1 0 6h-2M7 2v3M11 1v4M15 2v3"/>',
  sofa:'<path d="M5 12V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5M5 12a2 2 0 0 0-4 0v6h22v-6a2 2 0 0 0-4 0v3H5ZM4 18v3M20 18v3"/>',
  muted:'<path d="m11 5-6 4H2v6h3l6 4ZM17 9l5 6M22 9l-5 6"/>',
  sound:'<path d="m11 5-6 4H2v6h3l6 4ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
  sliders:'<path d="M4 6h7M15 6h5M4 18h3M11 18h9M4 12h13M21 12h-1M11 3v6M17 9v6M7 15v6"/>',
  expand:'<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
  arrow:'<path d="M4 12h15M13 6l6 6-6 6"/>',
  wind:'<path d="M3 8h12a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M5 17h5a2 2 0 1 1-2 2"/>'
};
function icon(name){return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name]||iconPaths.cabin}</svg>`;}
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
let settings={fire:65,wind:30,snow:true,eco:false};
try{settings={...settings,...JSON.parse(localStorage.getItem('seolya-settings')||'{}')};}catch{}
function saveSettings(){try{localStorage.setItem('seolya-settings',JSON.stringify(settings));}catch{}}
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(err){$('loading').innerHTML='<p>오두막을 열지 못했어요.</p><p>WebGL을 지원하는 브라우저에서 다시 열어주세요.</p>';throw err;}
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,settings.eco?1:1.7));
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
$('scene').appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','드래그하면 시선을 돌릴 수 있는 겨울 오두막');
const scene=new THREE.Scene();scene.background=new THREE.Color('#b1bbce');
const camera=new THREE.PerspectiveCamera(innerWidth<700?76:65,innerWidth/innerHeight,.08,600);
let randomSeed=4412;function rand(){randomSeed=(randomSeed*1664525+1013904223)>>>0;return randomSeed/4294967296;}
function material(color,roughness=.8,extra={}){return new THREE.MeshStandardMaterial({color,roughness,...extra});}
const woodCanvas=document.createElement('canvas');woodCanvas.width=512;woodCanvas.height=512;
const wc=woodCanvas.getContext('2d');wc.fillStyle='#73523a';wc.fillRect(0,0,512,512);
for(let i=0;i<1800;i++){const x=rand()*512;wc.strokeStyle=`rgba(${rand()>.5?'35,20,11':'202,158,107'},${.025+rand()*.1})`;wc.lineWidth=.3+rand()*2;wc.beginPath();wc.moveTo(x,0);wc.bezierCurveTo(x+rand()*12,150,x-rand()*12,380,x+rand()*4,512);wc.stroke();}
const woodTexture=new THREE.CanvasTexture(woodCanvas);woodTexture.colorSpace=THREE.SRGBColorSpace;woodTexture.wrapS=woodTexture.wrapT=THREE.RepeatWrapping;
const wood=material('#b48a61',.85,{map:woodTexture});const darkWood=material('#51402d',.8,{map:woodTexture});const frameWood=material('#65462c',.7,{map:woodTexture});
const stoneCanvas=document.createElement('canvas');stoneCanvas.width=stoneCanvas.height=128;const sc=stoneCanvas.getContext('2d');sc.fillStyle='#aaa69c';sc.fillRect(0,0,128,128);for(let i=0;i<5500;i++){sc.fillStyle=`rgba(${rand()>.5?'30,27,20':'240,232,213'},${rand()*.15})`;sc.fillRect(rand()*128,rand()*128,1+rand()*3,1+rand()*2);}const stoneTexture=new THREE.CanvasTexture(stoneCanvas);stoneTexture.colorSpace=THREE.SRGBColorSpace;
const stoneMaterials=Array.from({length:7},(_,i)=>material(new THREE.Color().setHSL(.09,.1,.27+i*.026),.97,{map:stoneTexture}));
const cream=material('#c2b49a',.97);const creamLight=material('#d2c6ac',.95);const green=material('#56624c',1);const brass=material('#a48a51',.4,{metalness:.65});const iron=material('#272724',.55,{metalness:.55});
function box(w,h,d,mat,x=0,y=0,z=0,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function roundBox(w,h,d,r,mat,x=0,y=0,z=0,parent=scene){const shape=new THREE.Shape();const a=-w/2,b=-h/2;shape.moveTo(a+r,b);shape.lineTo(a+w-r,b);shape.quadraticCurveTo(a+w,b,a+w,b+r);shape.lineTo(a+w,b+h-r);shape.quadraticCurveTo(a+w,b+h,a+w-r,b+h);shape.lineTo(a+r,b+h);shape.quadraticCurveTo(a,b+h,a,b+h-r);shape.lineTo(a,b+r);shape.quadraticCurveTo(a,b,a+r,b);const geo=new THREE.ExtrudeGeometry(shape,{depth:Math.max(.02,d-2*r),bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:r,bevelThickness:r,curveSegments:6});geo.translate(0,0,-(d-2*r)/2);const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
function cylinder(rt,rb,h,mat,x,y,z,parent=scene,n=18){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,n),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
function sphere(r,mat,x,y,z,parent=scene){const m=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),mat);m.position.set(x,y,z);parent.add(m);return m;}

// A room built from individual planks, exposed beams, stone and upholstered furniture.
for(let i=0;i<31;i++){const m=wood.clone();m.color.setHSL(.083,.26,.27+rand()*.07);box(.39,.13,13,m,-6+i*.4,-.07,0);}
box(12.6,5,.12,darkWood,0,2.4,-6.1);box(.12,5,12.2,darkWood,-6.3,2.4,0);
for(let i=0;i<16;i++){box(12.5,.30,.14,wood,0,.16+i*.31,-6);box(.14,.30,12,wood,-6.2,.16+i*.31,0);}
box(.16,1.15,12,wood,6.2,.55,0);box(.16,.65,12,wood,6.2,4.65,0);
box(12.7,.18,13,darkWood,0,5,0);for(let z=-6;z<=6;z+=2.4){box(12.5,.27,.22,frameWood,0,4.85,z);}
for(const x of [-6.05,6.05]){for(const z of [-5.9,5.9])box(.3,5,.3,frameWood,x,2.5,z);}
box(12.4,.17,.12,frameWood,0,.1,-5.87);box(.14,.18,12,frameWood,-6.06,.1,0);

// Floor-to-ceiling corner picture window; all snow remains outside the room.
const glass=material('#afc6d4',.07,{transparent:true,opacity:.07,metalness:.1,depthWrite:false});
box(.025,3.15,10.9,glass,6.19,2.65,-.05);
for(const z of [-5.5,-1.9,1.7,5.3])box(.22,3.55,.13,frameWood,6.05,2.66,z);
for(const y of [1.05,4.3])box(.26,.15,11.1,frameWood,6.04,y,-.1);
box(.55,.14,11.2,darkWood,5.95,1.01,-.1);
const frostCanvas=document.createElement('canvas');frostCanvas.width=64;frostCanvas.height=256;const fc=frostCanvas.getContext('2d');const fg=fc.createLinearGradient(0,0,0,256);fg.addColorStop(0,'rgba(207,226,233,.43)');fg.addColorStop(.15,'rgba(207,226,233,.025)');fg.addColorStop(.78,'rgba(207,226,233,0)');fg.addColorStop(1,'rgba(226,235,238,.45)');fc.fillStyle=fg;fc.fillRect(0,0,64,256);const frost=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(frostCanvas),transparent:true,depthWrite:false,side:THREE.DoubleSide});const frostPlane=new THREE.Mesh(new THREE.PlaneGeometry(10.8,3.13),frost);frostPlane.rotation.y=-Math.PI/2;frostPlane.position.set(6.12,2.65,-.1);scene.add(frostPlane);

const winterWorld=createWinterLandscape(scene,rand);
const snowCount=1700;const snowPositions=new Float32Array(snowCount*3);const snowSpeeds=new Float32Array(snowCount);
for(let i=0;i<snowCount;i++){snowPositions[i*3]=6.5+rand()*14;snowPositions[i*3+1]=rand()*13;snowPositions[i*3+2]=-23+rand()*42;snowSpeeds[i]=.22+rand()*.42;}
const snowGeo=new THREE.BufferGeometry();snowGeo.setAttribute('position',new THREE.BufferAttribute(snowPositions,3));
const flakeCanvas=document.createElement('canvas');flakeCanvas.width=32;flakeCanvas.height=32;const fl=flakeCanvas.getContext('2d');const flg=fl.createRadialGradient(16,16,0,16,16,16);flg.addColorStop(0,'rgba(255,255,255,1)');flg.addColorStop(.25,'rgba(255,255,255,.8)');flg.addColorStop(1,'rgba(255,255,255,0)');fl.fillStyle=flg;fl.fillRect(0,0,32,32);
const snowPoints=new THREE.Points(snowGeo,new THREE.PointsMaterial({color:'#f1f4f8',size:.075,map:new THREE.CanvasTexture(flakeCanvas),transparent:true,opacity:.8,depthWrite:false}));scene.add(snowPoints);snowPoints.visible=settings.snow;

// Broad stone hearth and recessed firebox.
const fx=-2.25,fz=-5.52;
box(3.75,.22,1.7,stoneMaterials[3],fx,.11,-5.28);
box(3.15,4.8,.48,stoneMaterials[1],fx,2.5,fz);
box(1.9,1.65,.55,material('#171514'),fx,1.05,-5.19);
for(let row=0;row<12;row++){const y=.34+row*.37;for(let col=0;col<5;col++){const x=fx-1.32+col*.64;if(y<1.9&&Math.abs(x-fx)<.94)continue;box(.61,.34,.48,stoneMaterials[Math.floor(rand()*7)],x+(row%2?.1:0),y,-5.15);}}
box(3.6,.23,.84,darkWood,fx,2.18,-5.02);
for(const x of [fx-1.45,fx+1.45])box(.35,1.85,.9,stoneMaterials[4],x,1.1,-5.15);
box(2.2,.27,.85,stoneMaterials[4],fx,1.94,-5.15);
box(2.15,.14,1.05,iron,fx,.31,-4.97);
const logMat=material('#3b271b',1,{map:woodTexture});
const logGroup=new THREE.Group();scene.add(logGroup);
function addLog(x,y,z,angle){const log=cylinder(.12,.14,1.5,logMat,x,y,z,logGroup,12);log.rotation.z=Math.PI/2;log.rotation.y=angle;const tip=cylinder(.105,.105,.012,material('#98764e'),0,0,0,log,12);tip.position.y=.756;}
addLog(fx,.52,-4.92,.23);addLog(fx,.67,-5.15,-.32);addLog(fx,.43,-5.32,.08);
for(let i=0;i<7;i++)box(.025,.24,.025,iron,fx-.8+i*.26,.38,-4.6);
box(1.9,.025,.025,iron,fx,.5,-4.6);
const fireLight=new THREE.PointLight('#ffae58',22,10,2);fireLight.position.set(fx,1,-4.25);fireLight.castShadow=true;fireLight.shadow.mapSize.set(1024,1024);fireLight.shadow.bias=-.003;scene.add(fireLight);
const hearthFire=createHearthFire(scene,fx,-4.95);

// Mantel objects and framed mountain study.
const art=new THREE.Group();art.position.set(fx,3.23,-4.84);box(1.35,1.13,.08,frameWood,0,0,0,art);box(1.18,.96,.018,material('#b9ab8f'),0,0,.05,art);
const mountainShape=new THREE.Shape();mountainShape.moveTo(-.54,-.39);mountainShape.lineTo(-.2,.18);mountainShape.lineTo(.04,-.1);mountainShape.lineTo(.28,.31);mountainShape.lineTo(.56,-.39);const mountainMesh=new THREE.Mesh(new THREE.ShapeGeometry(mountainShape),material('#5b665b'));mountainMesh.position.z=.065;art.add(mountainMesh);
function candle(x,y,z){cylinder(.07,.075,.3,material('#e4d4b3'),x,y+.15,z);const s=sphere(.025,material('#ffcf76',.3,{emissive:'#ffb34f',emissiveIntensity:2}),x,y+.33,z);s.scale.y=1.8;}
candle(fx-1.25,2.31,-4.94);candle(fx-1.05,2.31,-4.94);
cylinder(.12,.18,.36,green,fx+1.1,2.48,-4.95);for(let i=0;i<4;i++){const sprig=box(.015,.55,.015,frameWood,fx+1.1+(rand()-.5)*.16,2.9,-4.95);sprig.rotation.z=(rand()-.5)*.6;}

// A thick woven rug, a low oak table and soft seats.
const rugCanvas=document.createElement('canvas');rugCanvas.width=rugCanvas.height=256;const rc=rugCanvas.getContext('2d');rc.fillStyle='#a99d85';rc.fillRect(0,0,256,256);for(let i=0;i<256;i+=2){rc.strokeStyle=i%4?'#b5a98f':'#9a8f79';rc.lineWidth=.7;rc.beginPath();rc.moveTo(i,0);rc.lineTo(i,256);rc.stroke();rc.beginPath();rc.moveTo(0,i);rc.lineTo(256,i);rc.stroke();}rc.strokeStyle='#645d4c';rc.lineWidth=3;rc.strokeRect(12,12,232,232);rc.lineWidth=1;rc.strokeRect(18,18,220,220);const rugTex=new THREE.CanvasTexture(rugCanvas);rugTex.colorSpace=THREE.SRGBColorSpace;
box(6.7,.025,5.7,material('#e2d8bb',1,{map:rugTex}),.2,.025,.3);
function sofa(x,z,rotation=0,width=3.6){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);for(const a of [-width/2+.25,width/2-.25])for(const b of [-.45,.45])box(.12,.25,.12,darkWood,a,.15,b,g);roundBox(width-.1,.35,1.3,.12,cream,0,.43,0,g);roundBox(width,.8,.3,.14,cream,0,.97,.57,g);roundBox(.3,.6,1.32,.13,cream,-width/2,.77,0,g);roundBox(.3,.6,1.32,.13,cream,width/2,.77,0,g);const cushions=Math.round(width/1.2);for(let i=0;i<cushions;i++){roundBox((width-.4)/cushions-.04,.2,1.05,.07,creamLight,-width/2+.2+(i+.5)*(width-.4)/cushions,.69,-.03,g);roundBox((width-.4)/cushions-.04,.58,.16,.07,creamLight,-width/2+.2+(i+.5)*(width-.4)/cushions,1.03,.39,g);}const pillow=roundBox(.5,.5,.19,.08,green,-width/2+.45,.98,.23,g);pillow.rotation.z=.2;const pillow2=roundBox(.49,.49,.19,.08,material('#9b7454'),width/2-.45,.99,.26,g);pillow2.rotation.z=-.2;return g;}
const mainSofa=sofa(.4,4.4,0,4.4);const sideChair=sofa(3.85,.65,Math.PI/2-.25,1.5);const leftChair=sofa(-4.45,.2,-Math.PI/2+.25,1.5);
const blanket=roundBox(1.15,.06,1.18,.025,material('#718074'),1.45,.83,4.32);blanket.rotation.z=.02;box(1.15,.5,.04,material('#718074'),1.45,.56,3.74);
roundBox(2.7,.16,1.65,.18,wood,.25,.63,.4);for(const x of [-.75,1.25])for(const z of [-.1,.9])box(.12,.55,.12,darkWood,x,.3,z);
function mug(x,y,z){cylinder(.115,.085,.24,material('#cabd9e',.35),x,y+.12,z);cylinder(.094,.094,.006,material('#58412a',.1),x,y+.243,z);const handle=new THREE.Mesh(new THREE.TorusGeometry(.08,.022,8,18),material('#cabd9e',.35));handle.position.set(x+.12,y+.13,z);scene.add(handle);}
mug(-.45,.74,.45);mug(.94,.74,.03);cylinder(.32,.32,.025,wood,.82,.73,.1);
const book=box(.5,.055,.7,material('#4d5f56'),.2,.75,.07);book.rotation.y=.18;const book2=box(.43,.05,.62,material('#a28a66'),.19,.81,.06);book2.rotation.y=-.08;
box(.26,.045,.37,material('#d3c8af'),-1.04,.74,.72);
// Basket of spare logs, fire tools and a floor lamp.
cylinder(.42,.32,.59,material('#806342'),-4.6,.34,-4.64);for(let i=0;i<7;i++){const l=cylinder(.075,.09,.7,wood,-4.85+rand()*.47,.66,-4.85+rand()*.4);l.rotation.z=(rand()-.5)*.9;}
for(let i=0;i<3;i++){const rod=cylinder(.015,.015,1.12,iron,-.2+i*.13,.61,-5.13);rod.rotation.z=.1;}box(.5,.05,.38,iron,-.05,.06,-5.07);
cylinder(.3,.3,.06,iron,-5.2,.05,2.2);cylinder(.025,.025,2.55,brass,-5.2,1.31,2.2);const lampShade=cylinder(.28,.5,.57,material('#ddc9a3',.9,{emissive:'#b98a3c',emissiveIntensity:.32,side:THREE.DoubleSide}),-5.2,2.55,2.2);const lampLight=new THREE.PointLight('#ffe0a6',15,7,2);lampLight.position.set(-5.2,2.25,2.2);scene.add(lampLight);
// A small plant by the window and a cushion on the sill.
cylinder(.22,.17,.38,material('#a58162'),5.45,.24,3.8);for(let i=0;i<7;i++){const leaf=sphere(.19,green,5.45+(rand()-.5)*.35,.6+rand()*.4,3.8+(rand()-.5)*.35);leaf.scale.set(.4,1.8,.75);leaf.rotation.z=(rand()-.5);}
roundBox(.4,.12,.8,.04,green,5.88,1.17,2.8);
const obstacles=completeCabin({scene,box,cylinder,sphere,wood,darkWood,frameWood,brass,iron,material});

const ambientLight=new THREE.AmbientLight('#d4c9ad',1.15);scene.add(ambientLight);const skyLight=new THREE.HemisphereLight('#afc9ed','#60432b',1.45);scene.add(skyLight);
const moonLight=new THREE.DirectionalLight('#a9c9f4',2.3);moonLight.position.set(12,9,-3);scene.add(moonLight);
const warmFill=new THREE.PointLight('#ffcc8e',20,16,2);warmFill.position.set(-1,3,1);scene.add(warmFill);
const windowFill=new THREE.PointLight('#bbd7ff',14,13,2);windowFill.position.set(5.5,3,0);scene.add(windowFill);

let seated=false,currentView='wide',logBoost=0,lastLog=-Infinity,cocoaBusy=false,nightOffset=0,nightEpoch=0,night=0;
const soundEngine=new CabinAudio(settings);let soundEnabled=false;
let toastTimeout;function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('toast').classList.remove('visible'),3600);}
function dismissWelcome(){if($('welcome').inert)return;$('welcome').classList.add('dismissed');$('welcome').inert=true;$('welcome').setAttribute('aria-hidden','true');}
function updateSeat(value){seated=value;$('seat-label').hidden=!seated;$('sit-action').classList.toggle('active',seated);$('sit-action').setAttribute('aria-pressed',String(seated));$('sit-text').textContent=seated?'일어나기':'앉기';}
const explorer=new CabinExplorer({scene,camera,canvas:renderer.domElement,obstacles,onMove:dismissWelcome,onSit:updateSeat,notify:toast});
function setView(view){currentView=view;explorer.setView(view);document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));}
function sit(){explorer.setSeated(!seated);dismissWelcome();toast(seated?'편히 앉으세요. V 버튼으로 1인칭 감상도 가능해요.':'이동키나 바닥 클릭으로 오두막을 둘러보세요.');}
$('sit-action').onclick=sit;$('welcome-sit').onclick=()=>{if(!seated)sit();};
document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{setView(button.dataset.view);dismissWelcome();});
$('reset-view').onclick=()=>setView('wide');
function togglePerspective(){explorer.setMode(explorer.mode==='third'?'first':'third');const first=explorer.mode==='first';$('perspective-text').textContent=first?'3인칭으로':'1인칭으로';$('perspective-toggle').setAttribute('aria-pressed',String(first));$('perspective-toggle').setAttribute('aria-label',first?'3인칭으로 전환':'1인칭으로 전환');$('perspective-badge').textContent=first?'1인칭':'3인칭';toast(first?'1인칭 · 내 눈높이에서 바라봐요.':'3인칭 · 캐릭터와 함께 둘러봐요.');}
$('perspective-toggle').onclick=togglePerspective;

async function toggleSound(){try{soundEnabled=await soundEngine.toggle();$('sound-toggle').innerHTML=icon(soundEnabled?'sound':'muted');$('sound-toggle').setAttribute('aria-label',soundEnabled?'소리 끄기':'소리 켜기');$('sound-toggle').title=soundEnabled?'소리 끄기':'소리 켜기';$('sound-toggle').setAttribute('aria-pressed',String(soundEnabled));$('settings-sound').textContent=soundEnabled?'소리 끄기':'소리 켜기';if(soundEnabled)toast('실제 장작 타는 소리와 겨울바람이 들려요.');}catch(err){toast(err.message);}}
$('sound-toggle').onclick=toggleSound;$('settings-sound').onclick=toggleSound;
function addFirewood(){const now=performance.now();if(now-lastLog<8000){toast('새 장작이 천천히 타고 있어요.');return;}lastLog=now;logBoost=1;explorer.addLog();toast('장작을 보탰어요. 불이 조금 더 따뜻해졌어요.');$('log-action').classList.add('active');setTimeout(()=>$('log-action').classList.remove('active'),5000);soundEngine.boost();}
$('log-action').onclick=addFirewood;
async function drinkCocoa(){if(cocoaBusy)return;cocoaBusy=true;dismissWelcome();try{if(!soundEngine.context)await toggleSound();const result=explorer.drinkCocoa();if(result.refilled){toast('따뜻한 핫초코를 가득 채웠어요.');cocoaBusy=false;return;}if(!result.started){cocoaBusy=false;return;}soundEngine.sip();$('tea-action').classList.add('active');$('cocoa-status').hidden=false;setTimeout(()=>{$('cocoa-status').hidden=true;$('tea-action').classList.remove('active');cocoaBusy=false;},DRINK_DURATION*1000);}catch(error){cocoaBusy=false;toast(error.message);}}
$('tea-action').onclick=drinkCocoa;
$('night-preview').onclick=()=>{if(nightOffset||night>.85){nightOffset=0;nightEpoch=elapsed;}else nightOffset=180;$('night-preview').textContent=nightOffset?'저녁으로 돌아가기':'밤 풍경 미리 보기';toast(nightOffset?'눈 내리는 밤으로 바뀌어요.':'오두막의 저녁으로 돌아왔어요.');};
$('about-open').onclick=()=>$('about-dialog').showModal();$('settings-open').onclick=()=>$('settings-dialog').showModal();
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
$('fire-volume').value=settings.fire;$('wind-volume').value=settings.wind;$('snow-toggle').checked=settings.snow;$('eco-toggle').checked=settings.eco;
$('fire-volume').oninput=e=>{settings.fire=+e.target.value;soundEngine.setVolume('fire',settings.fire);saveSettings();};
$('wind-volume').oninput=e=>{settings.wind=+e.target.value;soundEngine.setVolume('wind',settings.wind);saveSettings();};
$('snow-toggle').onchange=e=>{settings.snow=e.target.checked;snowPoints.visible=settings.snow;saveSettings();};
$('eco-toggle').onchange=e=>{settings.eco=e.target.checked;renderer.setPixelRatio(Math.min(devicePixelRatio,settings.eco?1:1.7));snowGeo.setDrawRange(0,settings.eco?600:snowCount);saveSettings();};
snowGeo.setDrawRange(0,settings.eco?600:snowCount);
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('이 브라우저에서는 전체 화면을 열 수 없어요.');}};
window.addEventListener('keydown',e=>{if(e.repeat||document.querySelector('dialog[open]')||/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))return;if(e.key==='1')sit();if(e.key==='2')drinkCocoa();if(e.key==='3')addFirewood();if(e.key.toLowerCase()==='v')togglePerspective();});
document.addEventListener('visibilitychange',()=>soundEngine.visibility());
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<700?76:65;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
let elapsed=0,lastFrame=performance.now(),lastClock=-1;
function animate(now){requestAnimationFrame(animate);const frameSeconds=(now-lastFrame)/1000,dt=Math.min(frameSeconds,.05);lastFrame=now;if(document.hidden)return;elapsed+=frameSeconds;const t=elapsed;
  explorer.update(dt,t);
  logBoost=Math.max(0,logBoost-dt*.055);const flicker=reducedMotion?1:1+Math.sin(t*7.2)*.07+Math.sin(t*12.4)*.05;fireLight.intensity=(22+logBoost*16)*flicker;
  hearthFire.update(t,logBoost,reducedMotion);
  const targetNight=nightProgress(t-nightEpoch+nightOffset);night=THREE.MathUtils.lerp(night,targetNight,1-Math.exp(-dt*.8));winterWorld.updateNight(night);ambientLight.intensity=THREE.MathUtils.lerp(1.15,.12,night);skyLight.intensity=THREE.MathUtils.lerp(1.45,.18,night);moonLight.intensity=THREE.MathUtils.lerp(2.3,.3,night);windowFill.intensity=THREE.MathUtils.lerp(14,1.3,night);warmFill.intensity=THREE.MathUtils.lerp(20,14,night);
  $('cocoa-level').textContent=Math.round(explorer.cocoaLevel*100)+'%';$('tea-action-label').textContent=explorer.cocoaLevel<=.1?'핫초코 채우기':'핫초코 마시기';
  const nightButtonText=nightOffset||night>.85?'저녁으로 돌아가기':'밤 풍경 미리 보기';if($('night-preview').textContent!==nightButtonText)$('night-preview').textContent=nightButtonText;
  if(settings.snow&&!reducedMotion){const pos=snowGeo.attributes.position.array;for(let i=0;i<(settings.eco?600:snowCount);i++){pos[i*3+1]-=snowSpeeds[i]*dt;pos[i*3+2]+=Math.sin(t*.35+i)*dt*.08;if(pos[i*3+1]<-.3)pos[i*3+1]=13;}snowGeo.attributes.position.needsUpdate=true;}
  if(Math.floor(t)!==lastClock){lastClock=Math.floor(t);const minutes=Math.floor(t/60).toString().padStart(2,'0');const seconds=Math.floor(t%60).toString().padStart(2,'0');$('stay-timer').textContent=`${minutes}:${seconds}`;$('local-time').textContent=night>.85?'눈 내리는 밤':night>.15?'해가 저무는 중':'푸른 저녁';$('experience').dataset.explorer=JSON.stringify({...explorer.state,night:+night.toFixed(3),audio:soundEngine.state,frameMs:Math.round(frameSeconds*1000),drawCalls:renderer.info.render.calls});}
  renderer.render(scene,camera);
}
// Static room shadows need only one pass; the moving visitor uses a contact shadow.
renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
renderer.render(scene,camera);requestAnimationFrame(animate);setTimeout(()=>{$('loading').classList.add('loaded');setTimeout(()=>$('loading').hidden=true,850);},700);
// Stable debug hooks for meaningful visual and interaction verification.
window.__seolya={get state(){return{...explorer.state,currentView,soundEnabled,snow:settings.snow,eco:settings.eco,cocoaBusy,night,logBoost,landscape:'procedural-3d',treeCount:winterWorld.forest.count,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}};
window.addEventListener('pagehide',()=>soundEngine.destroy());
