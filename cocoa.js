import * as THREE from './vendor/three.module.js';

export function createCocoaMug(){
  const root=new THREE.Group();
  const ceramic=new THREE.MeshStandardMaterial({color:'#dbc8a7',roughness:.42});
  // A closed lathed cross-section gives the mug an actual hollow interior.
  const profile=[[0,-.105],[.066,-.105],[.081,-.093],[.104,.105],[.103,.122],[.09,.125],[.078,-.074],[0,-.074]].map(([x,y])=>new THREE.Vector2(x,y));
  const cup=new THREE.Mesh(new THREE.LatheGeometry(profile,48),ceramic);root.add(cup);
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.065,.015,10,32),ceramic);handle.position.set(.119,.01,0);root.add(handle);
  const inside=new THREE.Group();root.add(inside);
  const liquid=new THREE.Mesh(new THREE.CylinderGeometry(.084,.084,.006,48),new THREE.MeshStandardMaterial({color:'#543021',roughness:.25,metalness:0}));inside.add(liquid);
  const foamMat=new THREE.MeshStandardMaterial({color:'#e7d2b5',roughness:.65});const foam=new THREE.Mesh(new THREE.TorusGeometry(.076,.003,6,48),foamMat);foam.rotation.x=Math.PI/2;foam.position.y=.004;inside.add(foam);
  for(const [x,z,r] of [[-.029,.014,.019],[.027,-.023,.017],[.024,.027,.015]]){const marshmallow=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.95,.026,12),new THREE.MeshStandardMaterial({color:'#f7ead2',roughness:.95}));marshmallow.position.set(x,.015,z);marshmallow.rotation.z=.12;inside.add(marshmallow);}
  const steam=new THREE.Group();root.add(steam);
  const steamMaterial=new THREE.MeshBasicMaterial({color:'#f4e5d1',transparent:true,opacity:.035,depthWrite:false});
  for(let i=0;i<3;i++){const puff=new THREE.Mesh(new THREE.SphereGeometry(.007,8,6),steamMaterial);puff.position.set((i-1)*.025,.17+i*.025,0);puff.scale.set(1,3,1);steam.add(puff);}
  const setLevel=level=>{inside.position.y=-.06+THREE.MathUtils.clamp(level,0,1)*.148;const radius=THREE.MathUtils.lerp(.92,1,level);inside.scale.set(radius,1,radius);};
  setLevel(1);return {root,inside,steam,setLevel};
}

export function createCocoaCloseup(camera){
  const rig=new THREE.Group();camera.add(rig);const mug=createCocoaMug();rig.add(mug.root);
  const softLight=new THREE.PointLight('#ffe4bd',.65,1.8,2);softLight.position.set(-.1,.35,.35);rig.add(softLight);
  const glove=new THREE.MeshStandardMaterial({color:'#728775',roughness:1});
  for(const x of [-.105,.14]){const hand=new THREE.Mesh(new THREE.SphereGeometry(.045,16,10),glove);hand.position.set(x,-.045,.022);hand.scale.set(.75,1.2,1);rig.add(hand);}
  rig.visible=false;
  return {update(frame,t){rig.visible=frame.active;if(!frame.active)return;const mobile=innerWidth<700;rig.position.set(mobile?.02:.25,-.65+frame.lift*.31,-.91+frame.lift*.12);const scale=.85+frame.lift*.70;rig.scale.setScalar(scale);rig.rotation.set(.36+frame.sip*.05,0,frame.sip*.015);mug.setLevel(frame.level);for(let i=0;i<mug.steam.children.length;i++)mug.steam.children[i].position.y=.15+((t*.02+i*.04)%.13);},rig};
}
