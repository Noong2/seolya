import * as THREE from './vendor/three.module.js';
import {CabinNavigation} from './navigation.js';
import {createCocoaMug,createCocoaCloseup} from './cocoa.js';
import {drinkFrame,DRINK_DURATION} from './experience-state.js';

function makeVisitor(){
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);
  const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.9});
  const coat=mat('#d7cbb3'),pants=mat('#4f615b'),skin=mat('#e3b791'),hat=mat('#ae7152'),scarf=mat('#6c8575'),shoe=mat('#4a3a30'),face=mat('#382e2a');
  const sphere=(r,m,x,y,z,parent=body)=>{const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),m);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;};
  const capsule=(r,length,m,x,y,z,parent=body)=>{const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(r,length,5,12),m);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;};
  capsule(.265,.33,coat,0,.97,0);sphere(.23,skin,0,1.52,.015);
  const beanie=sphere(.248,hat,0,1.66,0);beanie.scale.y=.68;
  const brim=new THREE.Mesh(new THREE.TorusGeometry(.225,.043,7,24),hat);brim.rotation.x=Math.PI/2;brim.position.y=1.63;body.add(brim);sphere(.07,coat,0,1.85,0);
  for(const x of [-.075,.075])sphere(.018,face,x,1.53,.221);const nose=sphere(.025,skin,0,1.48,.245);nose.scale.set(.8,.8,1.3);
  const neck=new THREE.Mesh(new THREE.TorusGeometry(.16,.067,7,24),scarf);neck.rotation.x=Math.PI/2;neck.position.y=1.29;body.add(neck);capsule(.06,.26,scarf,.12,1.1,.25);
  capsule(.015,.42,mat('#b7a88e'),0,.98,.266);for(const x of [-.16,.16]){const pocket=capsule(.07,.045,coat,x,.82,.18);pocket.rotation.z=Math.PI/2;}
  const arms=[],forearms=[],legs=[];for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.29,1.18,0);body.add(arm);capsule(.1,.12,coat,0,-.13,0,arm);const forearm=new THREE.Group();forearm.position.y=-.27;arm.add(forearm);capsule(.09,.1,coat,0,-.12,0,forearm);sphere(.095,scarf,0,-.27,0,forearm);arms.push(arm);forearms.push(forearm);const leg=new THREE.Group();leg.position.set(side*.135,.66,0);body.add(leg);capsule(.1,.31,pants,0,-.22,0,leg);const boot=capsule(.105,.12,shoe,0,-.51,.065,leg);boot.rotation.x=Math.PI/2;legs.push(leg);}
  const cocoa=createCocoaMug();const mug=cocoa.root;body.add(mug);mug.visible=false;
  root.scale.setScalar(.92);root.rotation.y=Math.PI;root.traverse(mesh=>{if(mesh.isMesh)mesh.castShadow=false;});
  return {root,body,arms,forearms,legs,mug,cocoa};
}

export class CabinExplorer {
  constructor({scene,camera,canvas,obstacles,onMove,onSit,notify}){
    Object.assign(this,{scene,camera,canvas,onMove,onSit,notify});this.navigation=new CabinNavigation(obstacles);this.visitor=makeVisitor();scene.add(this.visitor.root);this.position=new THREE.Vector3(0,0,-1.85);this.visitor.root.position.copy(this.position);
    this.mode='third';this.yaw=-.35;this.pitch=.14;this.distance=3.6;this.seated=false;this.keys=new Set();this.route=[];this.joy={x:0,y:0};this.walkTime=0;this.drinkStart=null;this.cocoaLevel=1;this.drinkFrom=1;this.drinkTo=1;this.gestureUntil=0;this.drag=null;this.view='wide';this.moving=false;this.drinkState=drinkFrame(-1);this.closeup=createCocoaCloseup(camera);scene.add(camera);
    this.look=new THREE.Vector3(0,1.1,-1.85);this.desired=new THREE.Vector3();this.pointer=new THREE.Vector2();this.raycaster=new THREE.Raycaster();this.floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
    this.targetMarker=new THREE.Mesh(new THREE.RingGeometry(.13,.19,24),new THREE.MeshBasicMaterial({color:'#e2c694',transparent:true,opacity:.65,depthWrite:false}));this.targetMarker.rotation.x=-Math.PI/2;this.targetMarker.position.y=.028;this.targetMarker.visible=false;scene.add(this.targetMarker);
    this.contactShadow=new THREE.Mesh(new THREE.CircleGeometry(.28,24),new THREE.MeshBasicMaterial({color:'#211b16',transparent:true,opacity:.22,depthWrite:false}));this.contactShadow.rotation.x=-Math.PI/2;scene.add(this.contactShadow);
    camera.position.set(1,2.8,1.6);camera.lookAt(this.look);this.bindInput();
  }
  bindInput(){
    const canvas=this.canvas;canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{const d=this.drag;if(!d||d.id!==e.pointerId)return;if(Math.hypot(e.clientX-d.startX,e.clientY-d.startY)>6)d.moved=true;if(d.moved){this.yaw-=(e.clientX-d.x)*.004;this.pitch=THREE.MathUtils.clamp(this.pitch+(e.clientY-d.y)*.003,-.38,.8);this.view='free';this.onMove?.();}d.x=e.clientX;d.y=e.clientY;});
    canvas.addEventListener('pointerup',e=>{const d=this.drag;if(d&&!d.moved)this.clickFloor(e.clientX,e.clientY);this.drag=null;});canvas.addEventListener('pointercancel',()=>this.drag=null);
    canvas.addEventListener('wheel',e=>{e.preventDefault();if(this.mode==='third')this.distance=THREE.MathUtils.clamp(this.distance+e.deltaY*.004,1.25,5);else this.camera.fov=THREE.MathUtils.clamp(this.camera.fov+e.deltaY*.015,48,88);},{passive:false});
    window.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))return;const key=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){e.preventDefault();this.keys.add(key);this.route=[];}});window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>this.clearInput());document.addEventListener('visibilitychange',()=>{if(document.hidden)this.clearInput();});
    const joystick=document.getElementById('move-pad'),knob=document.getElementById('move-knob');let joyId=null;const update=e=>{const r=joystick.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),length=Math.max(34,Math.hypot(dx,dy));this.joy.x=dx/length;this.joy.y=-dy/length;knob.style.transform=`translate(${this.joy.x*24}px,${-this.joy.y*24}px)`;};
    joystick.addEventListener('pointerdown',e=>{joyId=e.pointerId;joystick.setPointerCapture(e.pointerId);update(e);this.route=[];this.onMove?.();});joystick.addEventListener('pointermove',e=>{if(e.pointerId===joyId)update(e);});const release=()=>{joyId=null;this.joy.x=this.joy.y=0;knob.style.transform='';};joystick.addEventListener('pointerup',release);joystick.addEventListener('pointercancel',release);
  }
  clearInput(){this.keys.clear();this.joy.x=this.joy.y=0;this.drag=null;}
  clickFloor(x,y){const rect=this.canvas.getBoundingClientRect();this.pointer.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const hit=new THREE.Vector3();if(!this.raycaster.ray.intersectPlane(this.floorPlane,hit))return;if(Math.abs(hit.x)>5.65||hit.z< -5.4||hit.z>5.6)return;
    if(this.seated)this.setSeated(false);const route=this.navigation.path(this.position,hit);if(!route.length){this.notify?.('그쪽으로는 갈 수 없어요. 빈 바닥을 눌러주세요.');return;}this.route=route;this.targetMarker.position.set(route.at(-1).x,.028,route.at(-1).z);this.targetMarker.visible=true;this.onMove?.();
  }
  setMode(mode){this.mode=mode;this.camera.fov=innerWidth<700?76:65;this.camera.updateProjectionMatrix();this.visitor.root.visible=mode==='third';if(this.seated){if(mode==='first')this.setView('wide');else{this.yaw=-.95;this.pitch=.14;}}this.onMove?.();}
  setView(view){this.view=view;this.pitch=view==='window'?-.09:.14;const target=view==='fire'?new THREE.Vector3(-2.25,1.3,-5):view==='window'?new THREE.Vector3(30,6,-25):new THREE.Vector3(0,1.3,-5);this.yaw=Math.atan2(this.position.x-target.x,this.position.z-target.z);}
  setSeated(value){this.route=[];this.targetMarker.visible=false;if(value){this.clearInput();this.standPosition=this.position.clone();this.position.set(-.55,.2,4.1);this.visitor.root.rotation.y=Math.PI;this.yaw=this.mode==='third'?-.95:0;this.pitch=.14;}else if(this.standPosition)this.position.copy(this.standPosition);else this.position.set(-2.6,0,2.7);this.seated=value;this.onSit?.(value);}
  drinkCocoa(){if(this.drinkState.active)return {started:false};if(this.cocoaLevel<=.1){this.cocoaLevel=1;this.drinkFrom=this.drinkTo=1;this.drinkStart=null;return {started:false,refilled:true};}this.clearInput();this.route=[];this.targetMarker.visible=false;this.drinkFrom=this.cocoaLevel;this.drinkTo=Math.max(.04,this.cocoaLevel-.32);this.drinkStart=performance.now();return {started:true};}
  addLog(){this.gestureUntil=performance.now()+2200;}
  update(dt,t){
    this.drinkState=drinkFrame(this.drinkStart===null?-1:(performance.now()-this.drinkStart)/1000,this.drinkFrom,this.drinkTo);const drinking=this.drinkState.active;if(this.drinkStart!==null)this.cocoaLevel=this.drinkState.level;
    const disabled=!!document.querySelector('dialog[open]')||drinking;if(disabled)this.clearInput();
    let forward=disabled?0:((this.keys.has('w')||this.keys.has('arrowup')?1:0)-(this.keys.has('s')||this.keys.has('arrowdown')?1:0)+this.joy.y),right=disabled?0:((this.keys.has('d')||this.keys.has('arrowright')?1:0)-(this.keys.has('a')||this.keys.has('arrowleft')?1:0)+this.joy.x);
    let dx=0,dz=0;if(Math.hypot(forward,right)>.1){if(this.seated)this.setSeated(false);const length=Math.max(1,Math.hypot(forward,right));dx=(-Math.sin(this.yaw)*forward+Math.cos(this.yaw)*right)/length;dz=(-Math.cos(this.yaw)*forward-Math.sin(this.yaw)*right)/length;this.onMove?.();}
    else if(this.route.length&&!disabled){const target=this.route[0],dist=Math.hypot(target.x-this.position.x,target.z-this.position.z);if(dist<.09){this.route.shift();if(!this.route.length)this.targetMarker.visible=false;}else{dx=(target.x-this.position.x)/dist;dz=(target.z-this.position.z)/dist;}}
    const before=this.position.clone(),speed=2.05;if(!this.seated&&(dx||dz)){const next=this.navigation.move(this.position,dx*speed*dt,dz*speed*dt);this.position.set(next.x,0,next.z);}
    this.moving=before.distanceTo(this.position)>.001;
    const v=this.visitor;v.root.position.copy(this.position);if(this.moving){const facing=Math.atan2(this.position.x-before.x,this.position.z-before.z);v.root.rotation.y+=Math.atan2(Math.sin(facing-v.root.rotation.y),Math.cos(facing-v.root.rotation.y))*Math.min(1,dt*12);this.walkTime+=dt*8;}
    const stride=this.moving?Math.sin(this.walkTime)*.48:0;v.body.position.y=-.035+(this.moving?Math.abs(Math.sin(this.walkTime))*.025:Math.sin(t*1.4)*.007);this.contactShadow.position.set(this.position.x,.045,this.position.z);this.contactShadow.visible=!this.seated;
    v.legs[0].rotation.x=this.seated?-1.28:stride;v.legs[1].rotation.x=this.seated?-1.28:-stride;v.arms[0].rotation.x=-stride*.6;v.arms[1].rotation.x=stride*.6;
    v.forearms[0].rotation.x=v.forearms[1].rotation.x=0;v.mug.visible=drinking;v.arms[1].rotation.x=stride*.6;
    if(drinking){const f=this.drinkState,lift=f.lift;v.mug.position.set(.28-.14*lift,.74+.61*lift,.19+.14*lift);v.mug.rotation.set(-f.sip*.12,0,0);v.cocoa.inside.rotation.x=f.sip*.12;v.cocoa.setLevel(f.level);const dy=v.mug.position.y+.015-1.18,dz=v.mug.position.z,reach=Math.min(.535,Math.hypot(dy,dz));const elbow=Math.acos(THREE.MathUtils.clamp((reach*reach-2*.27*.27)/(2*.27*.27),-1,1));v.arms[1].rotation.x=Math.atan2(-dz,-dy)-Math.atan2(Math.sin(elbow),1+Math.cos(elbow));v.forearms[1].rotation.x=elbow;}
    if(performance.now()<this.gestureUntil&&!drinking)v.arms[0].rotation.x=-1.25;
    this.closeup.update(this.drinkState,t);
    const eye=this.seated?1.57:1.52,pivot=new THREE.Vector3(this.position.x,this.position.y+(this.seated?1.04:1.07),this.position.z);
    if(this.mode==='first'){this.desired.set(this.position.x,this.seated?eye:eye,this.position.z);this.look.copy(this.desired).add(new THREE.Vector3(-Math.sin(this.yaw)*Math.cos(this.pitch),-Math.sin(this.pitch),-Math.cos(this.yaw)*Math.cos(this.pitch)).multiplyScalar(8));}
    else {this.look.copy(pivot);const distance=this.distance;const offset=new THREE.Vector3(Math.sin(this.yaw)*distance*Math.cos(this.pitch),.65+Math.sin(this.pitch)*distance,Math.cos(this.yaw)*distance*Math.cos(this.pitch));
      let scale=1;for(const [axis,min,max] of [['x',-5.82,5.82],['z',-5.75,5.87],['y',.3,4.65]]){const component=offset[axis];if(component>0)scale=Math.min(scale,(max-pivot[axis])/component);else if(component<0)scale=Math.min(scale,(min-pivot[axis])/component);}this.desired.copy(pivot).addScaledVector(offset,Math.max(.12,scale));}
    const blend=1-Math.exp(-dt*10);this.camera.position.lerp(this.desired,blend);this.camera.position.x=THREE.MathUtils.clamp(this.camera.position.x,-5.82,5.82);this.camera.position.z=THREE.MathUtils.clamp(this.camera.position.z,-5.75,5.87);this.camera.position.y=THREE.MathUtils.clamp(this.camera.position.y,.3,4.65);this.camera.lookAt(this.look);this.camera.updateProjectionMatrix();v.root.visible=this.mode==='third';
  }
  get state(){return {mode:this.mode,seated:this.seated,position:{x:this.position.x,y:this.position.y,z:this.position.z},yaw:this.yaw,moving:this.moving,routeLength:this.route.length,cocoaLevel:+this.cocoaLevel.toFixed(3),drinking:this.drinkState.active,cupTilt:+this.visitor.mug.rotation.x.toFixed(3),cupHeight:+this.visitor.mug.position.y.toFixed(3),closeupVisible:this.closeup.rig.visible,insideRoom:this.position.x>=-5.8&&this.position.x<=5.78&&this.position.z>=-5.65&&this.position.z<=5.85};}
}
