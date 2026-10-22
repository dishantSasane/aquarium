import {T,mesh,box,sphere,tube,material,flat,label,floorMaterial,caustics,palette,batchStatic,waterSurface} from './graphics.js';
import {fish,visitor} from './creatures.js';
import {exhibits,species} from './data.js';

export class Aquarium {
  constructor(scene){
    this.scene=scene;this.root=new T.Group();scene.object3D.add(this.root);
    this.animals=[];this.people=[];this.plants=[];this.water=[];this.targets=[];this.obstacles=[];this.tanks=[];this.time=0;
    this.architecture();this.habitats();this.addVisitors();
    for(const t of this.tanks)batchStatic(t.group);batchStatic(this.root);
  }
  architecture(){
    const g=this.root,steel=material(palette.steel,{metalness:.45}),trim=material(palette.trim,{metalness:.6}),wall=material(0x243b48),glow=flat(0x78e8dc);
    box(g,[14,.3,132],[0,-.15,-48],floorMaterial());
    box(g,[14,8,.35],[0,4,17],wall);
    // Recessed luminous skirting and structural bays establish a human-scale interior.
    for(const x of [-6.85,6.85]){box(g,[.12,.07,128],[x,.16,-48],glow);box(g,[.25,.6,128],[x,.3,-48],steel);}
    for(let z=12;z>-112;z-=8){
      for(const x of [-6.9,6.9]){box(g,[.32,7.7,.38],[x,3.85,z],trim);box(g,[.42,.12,.52],[x,7.35,z],glow);}
      if(z>-23||z<-49){box(g,[14,.23,.45],[0,7.6,z],steel);box(g,[3,.035,.12],[0,7.45,z],flat(0xb7e3dc));}
    }
    for(const [z,len] of [[-3,39],[-81,63]])box(g,[14,.2,len],[0,7.85,z],material(0x101c26));
    // Side glass remains lightly reflective so animals can be seen from the walkway.
    this.glassMat=new T.MeshPhysicalMaterial({color:0x9edcde,transparent:true,opacity:.065,roughness:.13,metalness:.1,side:T.DoubleSide,depthWrite:false});
    for(const x of [-7,7])box(g,[.03,6.7,126],[x,3.9,-48],this.glassMat);
    for(const e of exhibits){
      const z=e.stop+6;
      label(g,`${String(exhibits.indexOf(e)+1).padStart(2,'0')}  ${e.name.toUpperCase()}`,e.tag,[0,6.7,z],7);
      label(g,'CONTINUE YOUR JOURNEY','NEXT GALLERY  ↓',[4.5,.65,z-7],2.5,-Math.PI/2);
      this.kiosk(e,[-5.1,0,e.id==='ocean'?e.stop-1:e.stop+2]);
    }
    label(g,'AQUAVR','OCEANS CONNECT US',[0,4.7,16.7],8,Math.PI);
    // The tunnel has a real curved roof, structural ribs and water above it.
    const arch=mesh(g,new T.CylinderGeometry(6.5,6.5,26,48,1,true,-Math.PI/2,Math.PI),this.glassMat,[0,.75,-36]);arch.rotation.x=-Math.PI/2;
    for(let z=-23;z>=-49;z-=4){const points=[];for(let a=0;a<=Math.PI+.01;a+=Math.PI/30)points.push([Math.cos(a)*6.5,.75+Math.sin(a)*6.5,z]);tube(g,points,.07,trim,32);}
    for(const z of [-16,-62,-82,-106]){
      this.bench(3.8,z,steel);this.obstacles.push({x:3.8,z,hx:1.35,hz:.48});
    }
    // Back wall viewing window opens onto the largest tank.
    box(g,[14,7,.04],[0,4,-112],this.glassMat);box(g,[14,.5,.6],[0,.25,-112],steel);
    box(g,[.3,7.5,.4],[-6.85,3.75,-112],trim);box(g,[.3,7.5,.4],[6.85,3.75,-112],trim);
    const hemi=new T.HemisphereLight(0xb0dcec,0x14212c,2.1);g.add(hemi);
    const sun=new T.DirectionalLight(0xa4d9ed,2.5);sun.position.set(0,20,8);g.add(sun);
    const warm=new T.DirectionalLight(0xefd6b3,.65);warm.position.set(0,8,15);g.add(warm);
  }
  bench(x,z,mat){
    box(this.root,[2.6,.16,.7],[x,.64,z],material(0x9a7955));box(this.root,[2.6,.6,.1],[x,.95,z+.35],mat);
    for(const dx of [-1,1])box(this.root,[.1,.6,.6],[x+dx,.3,z],mat);
    const seat=box(this.root,[2.6,.3,.7],[x,.8,z],new T.MeshBasicMaterial({visible:false}));
    seat.userData.target={kind:'seat',name:'Observation bench',position:[x,0,z-.5]};this.targets.push(seat);
  }
  kiosk(exhibit,pos){
    const g=new T.Group();g.position.set(...pos);this.root.add(g);
    box(g,[.65,1.1,.5],[0,.55,0],material(0x152d39,{metalness:.5}));
    const screen=label(g,exhibit.activity.toUpperCase(),'E / SELECT TO EXPLORE',[0,1.25,.3],2.4);
    screen.userData.target={kind:'activity',name:exhibit.activity,exhibit:exhibit.id};this.targets.push(screen);
    const map=label(g,'GALLERY MAP','SELECT TO TRAVEL',[0,.76,.31],1.8);
    map.userData.target={kind:'map',name:'Open gallery map'};this.targets.push(map);
    this.obstacles.push({x:pos[0],z:pos[2],hx:.6,hz:.5});
  }
  tank(side,center,length,tint){
    const group=new T.Group();group.userData.sector=true;this.root.add(group);
    const x=side*17;
    box(group,[20,.5,length],[x,.35,center],material(0x8c9c8c,{roughness:1}));
    box(group,[.2,13,length],[side*27,6.5,center],material(tint,{roughness:1,emissive:tint,emissiveIntensity:.16}));
    for(const z of [center-length/2,center+length/2])box(group,[20,12,.3],[x,6,z],material(tint));
    this.water.push(waterSurface(group,20,length,[x,11.5,center]));
    this.water.push(caustics(group,20,length,[x,.62,center]));
    const t={group,x,z:center,length};this.tanks.push(t);
    for(let i=0;i<8;i++){
      const rz=center-length*.4+(i%4)*length*.23,rx=side*(11+(i%3)*5);
      const rock=new T.IcosahedronGeometry(1,2),v=rock.attributes.position;
      for(let j=0;j<v.count;j++){const scale=1+Math.sin(v.getX(j)*8+v.getY(j)*9)*.08;v.setXYZ(j,v.getX(j)*scale,v.getY(j)*scale,v.getZ(j)*scale);}rock.computeVertexNormals();
      mesh(group,rock,material(0x596d65),[rx,.9,rz],[1.2+i%2,.8+(i%3)*.5,1.1]);
    }
    const positions=[];for(let i=0;i<100;i++)positions.push(side*(8+Math.random()*17),Math.random()*10,center+(Math.random()-.5)*length);
    const geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    const particles=new T.Points(geom,new T.PointsMaterial({color:0xb3eee7,size:.035,transparent:true,opacity:.48}));group.add(particles);t.particles=particles;
    return t;
  }
  coral(tank,x,z,color,index=0,restorable=false){
    const g=new T.Group();g.position.set(x,.65,z);tank.group.add(g);
    const mat=restorable?material(0xc6c9b5,{roughness:.8}).clone():material(color,{roughness:.8});
    for(let i=0;i<7;i++){
      const a=i/7*Math.PI*2,r=.25+(i%3)*.13,h=.5+(i%4)*.27;
      tube(g,[[0,0,0],[Math.cos(a)*r*.5,h*.5,Math.sin(a)*r*.5],[Math.cos(a)*r,h,Math.sin(a)*r]],.06,mat,7);
      sphere(g,[Math.cos(a)*r,h,Math.sin(a)*r],[.09,.11,.09],mat,8);
    }
    if(!restorable&&index%2===0)for(let k=0;k<3;k++)sphere(g,[0,.25+k*.2,0],[.65-k*.1,.09,.5-k*.1],mat);
    if(restorable){g.userData.target={kind:'coral',name:'Restore coral colony',id:`coral-${index}`,mat};this.targets.push(g);}
    return g;
  }
  kelp(tank,x,z,i){
    const stem=new T.Group();stem.userData.dynamic=true;stem.position.set(x,.65,z);tank.group.add(stem);
    const m=material([0x52743b,0x78984c,0x6e9141][i%3],{side:T.DoubleSide});
    const h=3+i%4; tube(stem,[[0,0,0],[.1,h*.5,0],[-.1,h,0]],.025,m,12);
    for(let j=0;j<9;j++){
      const leaf=sphere(stem,[(j%2?1:-1)*.25,j*h/9,0],[.38,.065,.13],m,8);leaf.rotation.z=(j%2?1:-1)*.5;
    }
    batchStatic(stem);this.plants.push({stem,phase:i});
  }
  animal(tank,type,center,radii,size,phase=0,speed=.25){
    const creature=fish(type);creature.scale.setScalar(size);tank.group.add(creature);
    creature.userData.target={kind:'species',type,name:species[type].name,id:`animal-${this.animals.length}`};this.targets.push(creature);
    this.animals.push({creature,tank,center,radii,phase,speed,type});return creature;
  }
  habitats(){
    const reef=this.tank(-1,-4,38,0x12606b),reefRight=this.tank(1,-4,38,0x174c63);
    for(let i=0;i<16;i++)this.coral(reef,-12-(i%4)*2.5,10-Math.floor(i/4)*8,[0xc98680,0xbc777e,0xdfaa6a,0x91b59d][i%4],i);
    for(let i=0;i<3;i++)this.coral(reef,-9.3,8-i*4,0xc6c9b5,i,true);
    for(let i=0;i<10;i++)this.coral(reefRight,9+(i%3)*3,8-Math.floor(i/3)*9,0x718f8c);
    for(let i=0;i<12;i++){const t=i%2?reef:reefRight;this.animal(t,['clown','tang','butterfly'][i%3],[t.x-(i%2?-3:3),2+(i%4)*.75,8-(i%4)*8],[3,.3,2.7],.65+(i%3)*.12,i*1.3,.22);}
    const sharkL=this.tank(-1,-36,25,0x123f59),sharkR=this.tank(1,-36,25,0x123f59);
    for(let i=0;i<5;i++){const t=i%2?sharkL:sharkR;this.animal(t,i===4?'ray':'shark',[t.x,3.7+(i%2)*2,-36],[5,.6,7],i===4?1.4:1.55,i*1.8,.18);}
    const overhead={group:new T.Group(),z:-36};overhead.group.userData.sector=true;this.tanks.push(overhead);this.root.add(overhead.group);this.water.push(waterSurface(overhead.group,14,26,[0,12,-36]));
    this.animal(overhead,'whale',[0,9,-35],[2.8,.2,6],2.1,1,.12);this.animal(overhead,'ray',[0,8.5,-36],[3,.2,5],1.5,3,.15);
    const tropL=this.tank(-1,-59,19,0x1a777a),tropR=this.tank(1,-59,19,0x19686d);
    for(let i=0;i<10;i++){const t=i%2?tropL:tropR;this.animal(t,i<2?'turtle':['tang','butterfly','clown'][i%3],[t.x,2+i%4,-59],[4,.4,5],i<2?1.25:.65,i,.2);this.coral(t,t.x+(i%3)*2,-65+i,0xcf9b62);}
    const kelpL=this.tank(-1,-78,17,0x31584d),kelpR=this.tank(1,-78,17,0x244f4c);
    for(let i=0;i<18;i++){const t=i%2?kelpL:kelpR;this.kelp(t,t.x+(i%4)*1.3-3,-84+Math.floor(i/4)*3,i);}
    for(let i=0;i<6;i++){const t=i%2?kelpL:kelpR;this.animal(t,'silver',[t.x,2+i%3,-78],[4,.5,5],.7,i,.21);}
    const deepL=this.tank(-1,-95,15,0x0c1632),deepR=this.tank(1,-95,15,0x111b35);
    for(let i=0;i<10;i++){const t=i%2?deepL:deepR;this.animal(t,'jelly',[t.x-((i%2)?-4:4),2+i%4,-99+(i%4)*3],[1,.6,.8],.7+(i%3)*.2,i,.2);}
    const ocean={group:new T.Group(),z:-126};ocean.group.userData.sector=true;this.tanks.push(ocean);this.root.add(ocean.group);
    box(ocean.group,[48,20,.5],[0,10,-143],material(0x0c3956));box(ocean.group,[48,.4,31],[0,.3,-127],material(0x6f8c8f));
    for(const x of [-24,24])box(ocean.group,[.5,20,31],[x,10,-127],material(0x113d55));
    this.water.push(caustics(ocean.group,48,31,[0,.55,-127]));
    this.water.push(waterSurface(ocean.group,48,31,[0,16,-127]));
    this.animal(ocean,'whale',[0,6,-126],[12,1,6],3.4,0,.09);
    this.animal(ocean,'ray',[0,3,-121],[8,.7,5],2.1,2,.15);
    this.animal(ocean,'shark',[0,9,-129],[11,.5,5],2,4,.13);
    for(let i=0;i<12;i++)this.animal(ocean,'silver',[(i%4-2)*2,2+(i%3)*.6,-124],[8,.25,5],.45,i*.2,.2);
  }
  addVisitors(){
    for(let i=0;i<8;i++){
      const person=visitor(i),lane=(i%2?1:-1)*(1.8+i%3*.35),startZ=6-i*13;person.position.set(lane,0,startZ);batchStatic(person);this.root.add(person);this.people.push({person,phase:i*1.8,startZ,lane});
    }
  }
  blocked(x,z,people=true){
    if(x < -6.35||x>6.35||z>15.5||z< -110.5)return true;
    if(this.obstacles.some(o=>Math.abs(x-o.x)<o.hx+.3&&Math.abs(z-o.z)<o.hz+.3))return true;
    return people&&this.people.some(p=>Math.hypot(x-p.person.position.x,z-p.person.position.z)<.58);
  }
  update(dt,player){
    this.time+=dt;const t=this.time;
    for(const mat of this.water)mat.uniforms.time.value=t;
    for(const a of this.animals){
      const angle=t*a.speed+a.phase,[x,y,z]=a.center,[rx,ry,rz]=a.radii;
      a.creature.position.set(x+Math.cos(angle)*rx,y+Math.sin(angle*1.7)*ry,z+Math.sin(angle)*rz);
      a.creature.rotation.y=Math.atan2(-Math.cos(angle)*rz,-Math.sin(angle)*rx);
      if(a.type==='jelly')a.creature.rotation.y=angle*.2;
      a.creature.userData.animate(t+a.phase);
    }
    for(const p of this.plants)p.stem.rotation.z=Math.sin(t*.6+p.phase)*.07;
    for(const tank of this.tanks){tank.group.visible=Math.abs(player.z-tank.z)<48;if(tank.particles)tank.particles.position.y=(t*.07)%1;}
    for(const p of this.people){
      const phase=t*.15+p.phase,walking=Math.sin(phase)>.0;
      const x=p.lane+(walking?Math.sin(phase*.5)*.35:Math.sign(p.lane)*1.3),z=p.startZ+Math.sin(phase)*3;
      const next=new T.Vector3(x,0,z);
      if(Math.hypot(next.x-player.x,next.z-player.z)>.85){p.person.position.lerp(next,Math.min(1,dt*2));p.person.rotation.y=walking?(Math.cos(phase)>0?Math.PI:0):(p.lane>0?-Math.PI/2:Math.PI/2);}
      p.person.userData.animate(t+p.phase,walking);
    }
  }
  dispose(){this.root.traverse(o=>{if(o.geometry)o.geometry.dispose();});this.root.removeFromParent();}
}
