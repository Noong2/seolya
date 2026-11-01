export class CabinNavigation {
  constructor(obstacles,radius=.26){this.obstacles=obstacles;this.radius=radius;this.bounds={minX:-5.8,maxX:5.78,minZ:-5.65,maxZ:5.85};}
  isFree(x,z){const r=this.radius,b=this.bounds;return Number.isFinite(x)&&Number.isFinite(z)&&x>=b.minX+r&&x<=b.maxX-r&&z>=b.minZ+r&&z<=b.maxZ-r&&!this.obstacles.some(o=>x>o.minX-r&&x<o.maxX+r&&z>o.minZ-r&&z<o.maxZ+r);}
  move(position,dx,dz){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.07));let x=position.x,z=position.z;for(let i=0;i<steps;i++){if(this.isFree(x+dx/steps,z))x+=dx/steps;if(this.isFree(x,z+dz/steps))z+=dz/steps;}return {x,z};}
  lineFree(a,b){const steps=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.07);for(let i=1;i<=steps;i++)if(!this.isFree(a.x+(b.x-a.x)*i/steps,a.z+(b.z-a.z)*i/steps))return false;return true;}
  path(start,destination){const step=.25,origin={x:-5.5,z:-5.25},width=45,depth=44;
    const point=id=>({x:origin.x+(id%width)*step,z:origin.z+Math.floor(id/width)*step});
    const valid=new Set();for(let id=0;id<width*depth;id++){const p=point(id);if(this.isFree(p.x,p.z))valid.add(id);}
    const closest=p=>{let best=-1,d=Infinity;for(const id of valid){const q=point(id),v=(q.x-p.x)**2+(q.z-p.z)**2;if(v<d){d=v;best=id;}}return best;};
    const from=closest(start),to=closest(destination);if(from<0||to<0||!this.lineFree(start,point(from)))return [];
    const frontier=[from],parents=new Map([[from,-1]]);for(let i=0;i<frontier.length&&!parents.has(to);i++){const id=frontier[i],x=id%width,z=Math.floor(id/width);for(const [nx,nz] of [[x-1,z],[x+1,z],[x,z-1],[x,z+1]]){const next=nz*width+nx;if(nx<0||nz<0||nx>=width||nz>=depth||!valid.has(next)||parents.has(next))continue;parents.set(next,id);frontier.push(next);}}
    if(!parents.has(to))return [];const route=[];for(let id=to;id!==-1;id=parents.get(id))route.unshift(point(id));if(this.isFree(destination.x,destination.z)&&this.lineFree(route.at(-1),destination))route.push(destination);
    const smooth=[];let previous=start,index=0;while(index<route.length){let furthest=index;while(furthest+1<route.length&&this.lineFree(previous,route[furthest+1]))furthest++;smooth.push(route[furthest]);previous=route[furthest];index=furthest+1;}return smooth;
  }
}
