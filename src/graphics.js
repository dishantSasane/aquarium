import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';
export const T = AFRAME.THREE;
export const palette = { steel: 0x18313a, dark: 0x09151f, trim: 0x416370, glow: 0x73eedc };
const materials=new Map();
export const material = (color, options = {}) => {
  if(options.map)return new T.MeshStandardMaterial({color,roughness:.65,...options});
  const key=JSON.stringify([color,options]);
  if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.65,...options}));
  return materials.get(key);
};
export const flat = color => new T.MeshBasicMaterial({color});
export function mesh(parent, geometry, mat, pos = [0,0,0], scale = [1,1,1]) {
  const m = new T.Mesh(geometry,mat); m.position.set(...pos); m.scale.set(...scale); parent.add(m); return m;
}
export function box(parent, size, pos, mat) { return mesh(parent,new T.BoxGeometry(...size),mat,pos); }
export function sphere(parent, pos, scale, mat, detail=20) { return mesh(parent,new T.SphereGeometry(1,detail,12),mat,pos,scale); }
export function tube(parent, points, radius, mat, segments=20) {
  const curve = new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
  return mesh(parent,new T.TubeGeometry(curve,segments,radius,5,false),mat);
}
export function canvasTexture(draw,w=512,h=512) {
  const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return texture;
}
export function label(parent,title,subtitle,pos,width=4,rotation=0) {
  const texture=canvasTexture((ctx,w,h)=>{
    ctx.fillStyle='#0a1e29';ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#75dfcd';ctx.fillRect(34,35,46,4);
    ctx.fillStyle='#effcf7';ctx.font='600 38px sans-serif';ctx.fillText(title,34,99);
    ctx.fillStyle='#91b6bf';ctx.font='20px sans-serif';ctx.fillText(subtitle,34,143);
  },768,192);
  const sign=mesh(parent,new T.PlaneGeometry(width,width/4),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}),pos);
  sign.rotation.y=rotation;return sign;
}
export function floorMaterial() {
  const map=canvasTexture((ctx,w,h)=>{
    ctx.fillStyle='#60737c';ctx.fillRect(0,0,w,h);
    for(let i=0;i<14000;i++){const n=80+Math.random()*70;ctx.fillStyle=`rgba(${n},${n+8},${n+12},.16)`;ctx.fillRect(Math.random()*w,Math.random()*h,2,2);}
    ctx.strokeStyle='#30434c';ctx.lineWidth=3;ctx.strokeRect(0,0,w,h);ctx.beginPath();ctx.moveTo(w/2,0);ctx.lineTo(w/2,h);ctx.stroke();
  });map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(6,40);
  return material(0xa0b2bc,{map,roughness:.37,metalness:.18});
}
export function caustics(parent,width,depth,pos) {
  const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time:{value:0}},vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,fragmentShader:`varying vec2 vUv; uniform float time; void main(){vec2 p=vUv*vec2(25.,35.);float a=sin(p.x+sin(p.y*1.3+time*.7))+cos(p.y+sin(p.x*.8-time*.5));float b=pow(max(0.,1.-abs(a)),14.);gl_FragColor=vec4(.38,.94,1.,b*.25);}`});
  const m=mesh(parent,new T.PlaneGeometry(width,depth),mat,pos);m.rotation.x=-Math.PI/2;return mat;
}

// Batch static meshes by material while preserving independent animated and interactive objects.
export function batchStatic(root){
  root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),groups=new Map();
  root.traverse(o=>{
    if(!o.isMesh||Array.isArray(o.material)||o.material.transparent)return;
    let p=o;while(p!==root){if(p.userData.dynamic||p.userData.animate||p.userData.target||p.userData.sector)return;p=p.parent;}
    const geometry=o.geometry.clone();geometry.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
    if(!geometry.getAttribute('uv'))geometry.setAttribute('uv',new T.BufferAttribute(new Float32Array(geometry.attributes.position.count*2),2));
    const key=o.material.uuid;if(!groups.has(key))groups.set(key,{material:o.material,geometries:[],objects:[]});
    const group=groups.get(key);group.geometries.push(geometry.index?geometry.toNonIndexed():geometry);group.objects.push(o);
  });
  for(const g of groups.values()){
    if(g.geometries.length<2){g.geometries.forEach(x=>x.dispose());continue;}
    const merged=mergeGeometries(g.geometries);if(!merged)continue;
    mesh(root,merged,g.material);g.objects.forEach(o=>o.removeFromParent());g.geometries.forEach(x=>x.dispose());
  }
}

export function waterSurface(parent,width,depth,pos){
  const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time:{value:0}},vertexShader:`varying vec2 vUv; uniform float time;void main(){vUv=uv;vec3 p=position;p.z+=sin(p.x*1.3+time)*.035+cos(p.y*.8-time)*.04;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`varying vec2 vUv;uniform float time;void main(){float w=sin(vUv.x*70.+time+sin(vUv.y*55.-time*.5));float glint=pow(abs(w),24.);gl_FragColor=vec4(.16+glint*.25,.47+glint*.35,.56+glint*.35,.4);}`});
  const surface=mesh(parent,new T.PlaneGeometry(width,depth,32,32),mat,pos);surface.rotation.x=-Math.PI/2;return mat;
}
