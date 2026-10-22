import {T,mesh,sphere,material,tube,canvasTexture,batchStatic} from './graphics.js';

const black=material(0x050b0e,{roughness:.18}), white=material(0xf2e9d6);
const skins=new Map();
function skin(type,color) {
  const key=type+color;if(skins.has(key))return skins.get(key);
  const map=canvasTexture((c,w,h)=>{
    const gradient=c.createLinearGradient(0,0,0,h);gradient.addColorStop(0,'#dce7df');gradient.addColorStop(.25,color);gradient.addColorStop(.7,color);gradient.addColorStop(1,'#dce7df');c.fillStyle=gradient;c.fillRect(0,0,w,h);
    if(type==='whale'){
      c.fillStyle='#afc5bb';for(let x=15;x<w;x+=26)for(let y=100;y<h-70;y+=25){c.beginPath();c.ellipse(x+Math.sin(y)*4,y,3,4,0,0,7);c.fill();}
      c.strokeStyle='#789d9b';for(let y=120;y<h-100;y+=48){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
    } else if(type==='clown'||type==='butterfly') {
      for(const x of [.22,.52,.79]){c.fillStyle='#16232a';c.fillRect(x*w-8,0,38,h);c.fillStyle=type==='clown'?'#fff4e5':'#eee6bd';c.fillRect(x*w,0,22,h);}
    } else if(type==='tang') {c.fillStyle='#09244a';c.beginPath();c.ellipse(w*.48,h*.48,w*.27,h*.18,0,0,7);c.fill();}
    for(let i=0;i<2000;i++){c.fillStyle='rgba(255,255,255,.055)';c.fillRect(Math.random()*w,Math.random()*h,2,1);}
  });
  const m=material(0xffffff,{map,roughness:.44,metalness:.12});skins.set(key,m);return m;
}
function bodyGeometry(shark=false,whale=false) {
  const profile=shark?[[-1.5,.04],[-1.05,.12],[-.65,.23],[-.15,.33],[.35,.35],[.75,.29],[1.1,whale?.22:.15],[1.35,whale?.16:.018]]:[[-.8,.04],[-.55,.22],[-.2,.4],[.25,.38],[.58,.24],[.78,.06]];
  const vertices=[],uv=[],indices=[],sides=24;
  for(let i=0;i<profile.length;i++)for(let j=0;j<=sides;j++){
    const angle=j/sides*Math.PI*2,[x,r]=profile[i];vertices.push(x,Math.cos(angle)*r,Math.sin(angle)*r*(shark?1.12:.6));uv.push(i/(profile.length-1),j/sides);
  }
  for(let i=0;i<profile.length-1;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,a+1,b,b,a+1,b+1);}
  for(const end of [0,profile.length-1]){const center=vertices.length/3;vertices.push(profile[end][0],0,0);uv.push(end/(profile.length-1),.5);for(let j=0;j<sides;j++){const a=end*(sides+1)+j;if(end===0)indices.push(center,a+1,a);else indices.push(center,a,a+1);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function fin(parent,points,color) {
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));g.setIndex([0,1,2]);g.computeVertexNormals();
  return mesh(parent,g,material(color,{side:T.DoubleSide,roughness:.55}));
}
export function fish(type='tang') {
  if(type==='ray')return ray();if(type==='turtle')return turtle();if(type==='jelly')return jelly();
  const large=type==='shark'||type==='whale',whale=type==='whale';
  const color={clown:'#d85d19',tang:'#287cd2',butterfly:'#ecd251',shark:'#648392',whale:'#3d6976',silver:'#a3bac1'}[type];
  const root=new T.Group();mesh(root,bodyGeometry(large,whale),skin(type,color));
  const tail=new T.Group();tail.userData.dynamic=true;tail.position.x=large?-1.48:-.78;root.add(tail);
  fin(tail,[[.12,0,0],[-.56,large?.75:.45,0],[-.36,-.04,0]],type==='tang'?'#f4cb42':color);
  fin(tail,[[.12,0,0],[-.36,.04,0],[-.48,large?-.51:-.43,0]],type==='tang'?'#f4cb42':color);
  fin(root,[[.25,.28,0],[-.23,large?.95:.62,0],[-.65,.19,0]],color);
  const fins=[];
  for(const side of [-1,1]){
    const p=new T.Group();p.userData.dynamic=true;p.position.set(.2,-.08,side*(large?.27:.15));root.add(p);
    fin(p,[[0,0,0],[-.7,-.14,side*(large?.85:.3)],[-.4,-.1,0]],color);fins.push(p);
    const ex=large?.89:.49,ey=large?.11:.09,ez=large?(whale?.25:.18):.16;
    sphere(root,[ex,ey,side*ez],[.055,.055,.025],material(0xb1ad72));sphere(root,[ex+.012,ey,side*(ez+.02)],[.034,.036,.018],black);
    sphere(root,[ex+.02,ey+.016,side*(ez+.033)],[.011,.011,.008],white,8);
    if(large)for(let i=0;i<5;i++)tube(root,[[.5-i*.055,.14,side*.29],[.49-i*.055,-.03,side*.32],[.48-i*.055,-.16,side*.26]],.008,black,5);
  }
  if(large)tube(root,[[1.1,-.12,-.13],[1.22,-.14,0],[1.1,-.12,.13]],.009,black,10);
  root.userData.animate=(t)=>{tail.rotation.y=Math.sin(t*4)*.24;fins.forEach((p,i)=>p.rotation.x=Math.sin(t*3+i)*.09);};
  batchStatic(root);return root;
}
function mantaWing(parent,sign){
  const v=[],uv=[],indices=[],n=16;
  for(let i=0;i<=n;i++)for(let j=0;j<=n;j++){
    const u=i/n,s=j/n,span=Math.pow(Math.sin(u*Math.PI),.7)*1.85;
    v.push(-.85+u*1.5-s*.2,Math.sin(s*Math.PI)*.09-s*.07,sign*(.15+s*span));uv.push(u,s);
  }
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){const a=i*(n+1)+j,b=a+n+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();mesh(parent,g,material(0x486a7a,{side:T.DoubleSide,roughness:.45}));
}
function ray(){
  const root=new T.Group(),m=material(0x43677a,{roughness:.45});sphere(root,[0,0,0],[.85,.13,.48],m);
  const wings=[];for(const sign of [-1,1]){const wing=new T.Group();wing.userData.dynamic=true;root.add(wing);mantaWing(wing,sign);wings.push(wing);sphere(root,[.62,.07,sign*.28],[.055,.05,.06],black);tube(root,[[.75,0,sign*.25],[1.05,0,sign*.34],[1.1,-.08,sign*.44]],.06,m,8);}
  tube(root,[[-.6,0,0],[-1.3,-.03,0],[-2.3,.05,0]],.025,m);
  root.userData.animate=t=>wings.forEach((w,i)=>w.rotation.x=Math.sin(t*1.8)*(i?1:-1)*.22);return root;
}
function turtle(){
  const root=new T.Group(),green=material(0x7c8651),shell=skin('shell','#526548');
  sphere(root,[0,0,0],[.8,.27,.53],shell);sphere(root,[.94,.02,0],[.29,.19,.2],green);
  for(const s of [-1,1]){sphere(root,[1.08,.1,s*.14],[.035,.035,.025],black);}
  // Raised shell plates give the carapace a recognizable tiled silhouette.
  for(let x=-.5;x<=.51;x+=.25)for(let z=-.25;z<=.26;z+=.25)sphere(root,[x,.23-Math.abs(x)*.1,z],[.15,.065,.14],material(0x68784b),8);
  const fins=[];for(const s of [-1,1])for(const x of [-.5,.45]){const f=new T.Group();f.userData.dynamic=true;f.position.set(x,-.08,s*.32);root.add(f);sphere(f,[-.15,0,s*.3],[x>0?.42:.25,.055,.4],green);fins.push(f);}
  root.userData.animate=t=>fins.forEach((f,i)=>f.rotation.x=Math.sin(t*2+i*.5)*(i<2?1:-1)*.25);return root;
}
function jelly(){
  const root=new T.Group(),mat=material(0x9f9eea,{transparent:true,opacity:.62,emissive:0x4833aa,emissiveIntensity:.65,side:T.DoubleSide,depthWrite:false});
  const bell=mesh(root,new T.SphereGeometry(.6,24,14,0,Math.PI*2,0,Math.PI/2),mat,[0,.1,0],[1,.7,1]);
  bell.userData.dynamic=true;const strands=new T.Group();strands.userData.dynamic=true;root.add(strands);
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2;const points=[];for(let j=0;j<9;j++)points.push([Math.cos(a)*(.38-j*.02)+Math.sin(j*.9+i)*.06,-j*.18,Math.sin(a)*(.38-j*.02)]);tube(strands,points,.012,mat,20);}
  root.userData.animate=t=>{bell.scale.y=.7+Math.sin(t*2)*.13;strands.rotation.y=Math.sin(t)*.09;};return root;
}
export function visitor(index){
  const root=new T.Group(),skinMat=material([0xcc9270,0x966345,0xe2b495][index%3]),shirt=material([0x488b94,0xc69a64,0x917d9e,0x77917a][index%4]),pants=material(0x243541);
  sphere(root,[0,1.21,0],[.24,.34,.14],shirt);sphere(root,[0,1.69,0],[.14,.18,.145],skinMat);sphere(root,[0,1.79,-.02],[.145,.11,.14],material(0x30251f));
  const limbs=[];for(const side of [-1,1]){
    const leg=new T.Group();leg.userData.dynamic=true;leg.position.set(side*.12,.91,0);root.add(leg);mesh(leg,new T.CapsuleGeometry(.085,.62,4,8),pants,[0,-.35,0]);sphere(leg,[0,-.81,-.05],[.1,.07,.18],material(0x16232a));limbs.push(leg);
    const arm=new T.Group();arm.userData.dynamic=true;arm.position.set(side*.25,1.4,0);root.add(arm);mesh(arm,new T.CapsuleGeometry(.065,.36,4,8),shirt,[side*.025,-.22,0]);sphere(arm,[side*.025,-.52,0],[.06,.095,.06],skinMat);limbs.push(arm);
  }
  root.userData.animate=(t,walking)=>limbs.forEach((l,i)=>l.rotation.x=walking?Math.sin(t*4+(i<2?0:Math.PI))*(i%2?.3:.5):Math.sin(t*.8)*.025);
  return root;
}
