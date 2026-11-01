import * as THREE from './vendor/three.module.js';

export function createHearthFire(scene,x,z){
  const group=new THREE.Group();group.position.set(x,.39,z);scene.add(group);
  const uniforms={time:{value:0},boost:{value:0}};
  const vertexShader='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
  const fragmentShader=`varying vec2 vUv;uniform float time;uniform float boost;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float a=.5,v=0.;for(int i=0;i<4;i++){v+=noise(p)*a;p=p*2.02+vec2(1.4,3.1);a*=.5;}return v;}
    void main(){vec2 uv=vUv;float n=fbm(vec2(uv.x*5.,uv.y*4.-time*1.7));float warp=fbm(vec2(uv.x*9.+time*.2,uv.y*7.-time*2.1));float taper=pow(max(0.,1.-uv.y),1.25)*.47;float edge=taper-abs(uv.x-.5+(n-.5)*.2)+(warp-.5)*.15;float density=smoothstep(-.035,.09,edge);density*=smoothstep(0.,.07,uv.y)*(1.-smoothstep(.73+n*.14,1.,uv.y));float tongues=smoothstep(.22,.55,n+(.5-uv.y)*.6);float alpha=density*(.45+tongues*.55)*.83;if(alpha<.015)discard;vec3 orange=vec3(1.,.21,.025),gold=vec3(1.,.65,.12),core=vec3(1.,.93,.62);vec3 col=mix(orange,gold,clamp(density*(1.-uv.y),0.,1.));col=mix(col,core,pow(density,3.)*pow(1.-uv.y,2.));gl_FragColor=vec4(col,alpha);}`;
  for(let i=0;i<3;i++){const mat=new THREE.ShaderMaterial({uniforms,vertexShader,fragmentShader,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});const plane=new THREE.Mesh(new THREE.PlaneGeometry(1.7,1.28),mat);plane.position.set((i-1)*.10,.6,-.03+i*.09);plane.rotation.y=(i-1)*.3;group.add(plane);}
  const embers=[];const emberMat=new THREE.MeshBasicMaterial({color:'#ffbc62',transparent:true,opacity:.8});for(let i=0;i<10;i++){const ember=new THREE.Mesh(new THREE.SphereGeometry(.012,5,4),emberMat.clone());group.add(ember);embers.push(ember);}
  return {update(t,boost=0,reducedMotion=false){uniforms.time.value=reducedMotion?1:t;uniforms.boost.value=boost;group.scale.y=1+boost*.18;embers.forEach((ember,i)=>{const phase=(t*.33+i*.17)%1;ember.position.set(Math.sin(i*3.4+t)*.35*(1-phase),phase*1.1,Math.cos(i*2.4)*.15);ember.material.opacity=(1-phase)*.65;ember.visible=!reducedMotion;});},group};
}
