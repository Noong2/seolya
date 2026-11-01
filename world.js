import * as THREE from './vendor/three.module.js';
import {CABIN_OBSTACLES} from './multiplayer-shared.js';
import {deviceProfile} from './device.js';

// Every visible part of the landscape is geometry; no backdrop image is loaded.
export function createWinterLandscape(scene,random){
  scene.background=new THREE.Color('#a2b7cd');
  scene.fog=new THREE.Fog('#a2b7cd',65,310);
  const sky=new THREE.Mesh(new THREE.SphereGeometry(450,24,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{night:{value:0}},vertexShader:'varying vec3 vPosition; void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 vPosition;uniform float night;void main(){float h=normalize(vPosition).y;vec3 day=mix(vec3(.67,.75,.81),vec3(.19,.29,.43),smoothstep(0.,.85,h));vec3 dark=mix(vec3(.055,.085,.15),vec3(.009,.019,.055),smoothstep(0.,.85,h));float glow=pow(max(0.,dot(normalize(vPosition),normalize(vec3(1.,.22,-.6)))),18.);day+=vec3(.14,.10,.10)*glow;gl_FragColor=vec4(mix(day,dark,night),1.);}'}));scene.add(sky);
  const starPositions=[];for(let i=0;i<850;i++){const angle=random()*Math.PI*2,y=.12+random()*.86,r=Math.sqrt(1-y*y)*390;starPositions.push(Math.cos(angle)*r,y*390,Math.sin(angle)*r);}
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:'#e2edff',size:.65,transparent:true,opacity:0,fog:false,depthWrite:false}));scene.add(stars);
  const moon=new THREE.Mesh(new THREE.SphereGeometry(6,24,16),new THREE.MeshBasicMaterial({color:'#e6eddd',transparent:true,opacity:0,fog:false}));moon.position.set(205,105,-130);scene.add(moon);
  const peaks=[[100,-95,55,46,47],[175,-15,72,55,55],[115,100,53,43,48],[-85,-130,49,50,45],[-150,80,58,53,50],[15,185,42,55,44]];
  const height=(x,z)=>{const distance=Math.hypot(x,z);if(distance<11)return -.28;let h=0;for(const [px,pz,ph,sx,sz] of peaks){const d=((x-px)/sx)**2+((z-pz)/sz)**2;h+=ph*Math.exp(-d*1.4);}const detail=(Math.sin(x*.14+z*.08)*Math.cos(z*.11-x*.045)*3+Math.sin(x*.39)*Math.cos(z*.32)*1.2+Math.sin(x*.82+z*.64)*.3);const blend=THREE.MathUtils.smoothstep(distance,11,45);return -.3+(h+detail)*blend;};
  const detail=deviceProfile().mobile?128:200;const terrainGeo=new THREE.PlaneGeometry(600,600,detail,detail);terrainGeo.rotateX(-Math.PI/2);const p=terrainGeo.attributes.position;
  for(let i=0;i<p.count;i++)p.setY(i,height(p.getX(i),p.getZ(i)));terrainGeo.computeVertexNormals();
  const color=new THREE.Color(),colors=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i);const slope=terrainGeo.attributes.normal.getY(i);const grain=.5+.5*Math.sin(x*.8+z*.6);if(slope<.72&&y>15)color.set('#697b8a').lerp(new THREE.Color('#a4afba'),grain*.6);else color.set('#e5edf1').lerp(new THREE.Color('#bdccd8'),grain*.19+Math.max(0,1-slope)*.4);colors.set([color.r,color.g,color.b],i*3);}terrainGeo.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const terrain=new THREE.Mesh(terrainGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));terrain.receiveShadow=true;scene.add(terrain);
  // Irregular tiered branches with white upper faces, shared by the whole forest.
  const branchPositions=[],branchColors=[];const green=new THREE.Color('#314e4d'),white=new THREE.Color('#e3ebee');
  function tri(a,b,c,snow){branchPositions.push(...a,...b,...c);const col=snow?white:green;for(let i=0;i<3;i++)branchColors.push(col.r,col.g,col.b);}
  for(let tier=0;tier<9;tier++){const y=.7+tier*.43,r=1.55*(1-tier/10),tip=y+1.6;for(let j=0;j<13;j++){const a=j/13*Math.PI*2,b=(j+1)/13*Math.PI*2;const ra=r*(.85+random()*.23),rb=r*(.85+random()*.23);const va=[Math.cos(a)*ra,y+(random()-.5)*.16,Math.sin(a)*ra],vb=[Math.cos(b)*rb,y+(random()-.5)*.16,Math.sin(b)*rb],vc=[0,tip,0];tri(va,vb,vc,true);tri([va[0],va[1]-.2,va[2]],[vb[0],vb[1]-.2,vb[2]],[0,y+.3,0],false);}}
  const foliageGeo=new THREE.BufferGeometry();foliageGeo.setAttribute('position',new THREE.Float32BufferAttribute(branchPositions,3));foliageGeo.setAttribute('color',new THREE.Float32BufferAttribute(branchColors,3));foliageGeo.computeVertexNormals();
  const trees=[];for(let i=0;i<440;i++){const x=(random()-.5)*340,z=(random()-.5)*340;if(Math.hypot(x,z)<19||Math.abs(x)<8&&Math.abs(z)<15)continue;trees.push({x,z,y:height(x,z),scale:.65+random()*1.2,rotation:random()*Math.PI*2});}
  const forest=new THREE.InstancedMesh(foliageGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}),trees.length);
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.10,.19,3.4,6),new THREE.MeshStandardMaterial({color:'#584435',roughness:1}),trees.length);const dummy=new THREE.Object3D();
  trees.forEach((tree,i)=>{dummy.position.set(tree.x,tree.y,tree.z);dummy.rotation.y=tree.rotation;dummy.scale.setScalar(tree.scale);dummy.updateMatrix();forest.setMatrixAt(i,dummy.matrix);dummy.position.y+=1.3*tree.scale;dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);});scene.add(forest,trunks);
  // Low snowdrifts and rocks near the glass give the foreground real parallax.
  const driftGeo=new THREE.SphereGeometry(1,10,6),driftMat=new THREE.MeshStandardMaterial({color:'#dfe9ee',roughness:1});
  for(let i=0;i<20;i++){const drift=new THREE.Mesh(driftGeo,driftMat);const x=8+random()*15,z=-18+random()*37;drift.position.set(x,height(x,z)-.1,z);drift.scale.set(1+random()*2,.15+random()*.3,.8+random()*2);scene.add(drift);}
  const dayFog=new THREE.Color('#a2b7cd'),nightFog=new THREE.Color('#101c35');
  return {height,forest,terrain,updateNight(value){sky.material.uniforms.night.value=value;scene.fog.color.copy(dayFog).lerp(nightFog,value);stars.material.opacity=value*value*.88;moon.material.opacity=Math.max(0,(value-.4)/.6);}};
}

export function completeCabin({scene,box,cylinder,sphere,wood,darkWood,frameWood,brass,iron,material}){
  // Rear facade and entry door: the room is enclosed on all four sides.
  box(12.65,5,.2,darkWood,0,2.45,6.35);
  for(let i=0;i<16;i++)box(12.5,.3,.14,wood,0,.16+i*.31,6.2);
  for(const z of [-5.85,5.85])box(.22,4.25,.55,frameWood,6.1,2.15,z);
  box(12.5,.18,.14,frameWood,0,.1,6.08);box(12.5,.2,.2,frameWood,0,4.78,6.07);
  // Fully modeled door, inset panels, frame and brass handle.
  box(1.62,2.95,.22,frameWood,-3.95,1.5,6.02);box(1.32,2.69,.1,darkWood,-3.95,1.43,5.86);
  for(const x of [-4.69,-3.21])box(.12,3.03,.28,wood,x,1.52,5.95);box(1.67,.14,.28,wood,-3.95,3.03,5.95);
  for(const y of [.66,1.78])box(1.05,.76,.05,wood,-3.95,y,5.78);
  sphere(.055,brass,-3.48,1.4,5.73);box(.22,.04,.05,brass,-3.55,1.4,5.69);
  box(1.8,.04,1.25,material('#635f4d'),-3.95,.04,5.15);
  // Tall bookcase and low storage cabinet at the back of the cabin.
  for(const x of [3.65,5.2])box(.12,2.7,.55,darkWood,x,1.4,5.75);
  for(const y of [.16,.9,1.68,2.65])box(1.7,.1,.58,wood,4.43,y,5.75);
  for(let row=0;row<3;row++){for(let i=0;i<7;i++){const h=.37+(i%3)*.09;const book=box(.12,h,.31,material(['#7c7460','#637567','#ac8c62','#825c4b'][i%4]),3.85+i*.19,[.21,.95,1.73][row]+h/2,5.65);book.rotation.z=i===6?.15:0;}}
  box(1.2,.75,.65,wood,1.6,.42,5.74);box(1.05,.55,.035,darkWood,1.6,.45,5.39);sphere(.035,brass,1.6,.49,5.34);
  cylinder(.13,.1,.3,material('#b29a7b'),1.6,.96,5.7);for(let i=0;i<5;i++){const stem=box(.015,.5,.015,wood,1.6+(i-2)*.035,1.32,5.7);stem.rotation.z=(i-2)*.13;}
  // Coat rail, winter coats and a round mirror make looking behind meaningful.
  box(1.6,.12,.1,wood,-.9,2.63,5.99);
  for(let i=0;i<3;i++){const x=-1.45+i*.52;sphere(.035,brass,x,2.6,5.87);box(.32,.75,.18,material(['#697663','#9b7956','#697b87'][i]),x,2.02,5.83);const arm=box(.13,.55,.14,material('#697663'),x-.21,2.05,5.83);arm.rotation.z=-.2;}
  const mirror=new THREE.Mesh(new THREE.CircleGeometry(.51,40),material('#7d96a0',.23,{metalness:.7}));mirror.rotation.y=Math.PI;mirror.position.set(-.9,3.65,6.04);scene.add(mirror);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.52,.035,8,40),brass);rim.position.copy(mirror.position);scene.add(rim);
  // Outer roof, eaves, chimney and foundations are present even when viewed at an angle.
  const roofMat=material('#514b42'),roofSnow=material('#e1e9ee');
  for(const side of [-1,1]){const roof=box(7.1,.21,13.7,roofMat,side*3.15,5.77,0);roof.rotation.z=-side*.26;const cap=box(7.15,.17,13.8,roofSnow,side*3.15,5.94,0);cap.rotation.z=-side*.26;}
  box(.9,2.1,.9,material('#827c70'),-2.25,6,-5.5);box(1.15,.15,1.15,roofSnow,-2.25,7.1,-5.5);
  box(12.8,.35,13.1,material('#6f736d'),0,-.22,0);
  return CABIN_OBSTACLES;
}
