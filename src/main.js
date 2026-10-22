import {T,mesh,canvasTexture,material} from './graphics.js';
import {Aquarium} from './world.js';
import {Player,Soundscape} from './player.js';
import {exhibits,species,questions} from './data.js';

const $=id=>document.getElementById(id);
const scene=$('scene'),camera=$('camera'),rig=$('rig');
const state={started:false,paused:false,modal:false,vr:false,zone:null,visited:new Set(),restored:new Set(),revealed:new Set(),completed:new Set(),photos:[],narration:true,captions:true,light:false,sensitivity:1,quality:'high'};
let world,player,sound,target=null,quizIndex=0,quizScore=0,gazeTarget=null,gazeTime=0,lastTime=0,lastInspect=0;
let panel3D=null,caption3D=null,panelTargets=[],ray=new T.Raycaster(),controllerLines=[];
const tempPosition=new T.Vector3(),tempDirection=new T.Vector3();

function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,4200);}
function narrate(text){
  if(state.captions){
    $('caption').textContent=text;$('caption').hidden=false;clearTimeout(narrate.timer);
    clearCaption3D();
    if(state.vr){const map=canvasTexture((ctx,w,h)=>{ctx.fillStyle='#092532';ctx.fillRect(0,0,w,h);ctx.fillStyle='#e2f7f1';ctx.font='26px sans-serif';wrap(ctx,text,25,38,w-50,35);},1024,160);caption3D=mesh(camera.object3D,new T.PlaneGeometry(2.7,.42),new T.MeshBasicMaterial({map,depthTest:false}),[0,-.75,-2.4]);}
    narrate.timer=setTimeout(()=>{$('caption').hidden=true;clearCaption3D();},12000);
  }
  if(state.narration&&'speechSynthesis' in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=.95;speechSynthesis.speak(u);}
}
function clearCaption3D(){if(caption3D){caption3D.geometry.dispose();caption3D.material.map.dispose();caption3D.material.dispose();caption3D.removeFromParent();caption3D=null;}}
function pointerLock(){if(!state.vr&&!matchMedia('(pointer: coarse)').matches){try{scene.canvas.requestPointerLock()?.catch(()=>toast('Mouse lock unavailable. Drag the view to look around.'));}catch{toast('Drag the view to look around.');}}}
function start(){
  state.started=true;state.paused=false;player.enabled=true;$('welcome').hidden=true;$('crosshair').hidden=false;
  $('touch-controls').hidden=!matchMedia('(pointer: coarse)').matches;
  sound.start();pointerLock();visitZone(true);
}
function visitZone(force=false){
  const z=rig.object3D.position.z,current=exhibits.find(e=>z<=e.range[0]&&z>e.range[1])||exhibits[0];
  if(current===state.zone&&!force)return;
  state.zone=current;$('location-name').textContent=current.name;$('location-index').textContent=`0${exhibits.indexOf(current)+1} — 06`;
  if(!state.started)return;
  state.visited.add(current.id);$('visited-count').textContent=state.visited.size;
  $('arrival-title').textContent=current.name;$('arrival-tag').textContent=current.tag;$('arrival').hidden=false;
  clearTimeout(visitZone.timer);visitZone.timer=setTimeout(()=>$('arrival').hidden=true,4200);
  narrate(`${current.name}. ${current.fact}`);
}
function setPaused(value){state.paused=value;player.enabled=state.started&&!value;player.clear();if(value){sound.pause();if('speechSynthesis'in window)speechSynthesis.cancel();}else if(state.started)sound.start();}

function panel(title,paragraphs,actions=[],decorate){
  state.modal=true;setPaused(true);document.exitPointerLock?.();if(caption3D)caption3D.visible=false;
  $('panel-title').textContent=title;$('panel-body').replaceChildren();$('panel-actions').replaceChildren();
  for(const text of paragraphs){const p=document.createElement('p');p.textContent=text;$('panel-body').append(p);}
  decorate?.($('panel-body'));
  actions.forEach(a=>{const b=document.createElement('button');b.textContent=a.label;b.addEventListener('click',a.run);$('panel-actions').append(b);});
  if(state.vr)spatialPanel(title,paragraphs,actions);else if(!$('panel').open)$('panel').showModal();
}
function closePanel(){
  state.modal=false;if($('panel').open)$('panel').close();clearSpatialPanel();setPaused(false);if(state.started)pointerLock();
}
function clearSpatialPanel(){
  if(panel3D){panel3D.traverse(o=>{o.geometry?.dispose();o.material?.map?.dispose();o.material?.dispose();});panel3D.removeFromParent();panel3D=null;}panelTargets=[];
}
function wrap(ctx,text,x,y,width,lineHeight){
  let line='';for(const word of text.split(' ')){if(ctx.measureText(line+word).width>width){ctx.fillText(line,x,y);y+=lineHeight;line='';}line+=word+' ';}ctx.fillText(line,x,y);return y+lineHeight;
}
function spatialPanel(title,paragraphs,actions){
  clearSpatialPanel();panel3D=new T.Group();scene.object3D.add(panel3D);camera.object3D.getWorldPosition(panel3D.position);camera.object3D.getWorldQuaternion(panel3D.quaternion);panel3D.translateZ(-2.3);
  const map=canvasTexture((ctx,w,h)=>{ctx.fillStyle='#092532';ctx.fillRect(0,0,w,h);ctx.fillStyle='#a1eed5';ctx.font='bold 38px sans-serif';wrap(ctx,title,40,64,w-80,44);ctx.fillStyle='#edf7f4';ctx.font='27px sans-serif';let y=135;for(const p of paragraphs)y=wrap(ctx,p,40,y,w-80,37)+10;},1024,512);
  mesh(panel3D,new T.PlaneGeometry(2.5,1.25),new T.MeshBasicMaterial({map,depthTest:false}),[0,.35,0]);
  [...actions,{label:'Close / resume',run:closePanel}].forEach((a,i)=>{
    const map=canvasTexture((ctx,w,h)=>{ctx.fillStyle='#214952';ctx.fillRect(0,0,w,h);ctx.fillStyle='#e5fff5';ctx.font='27px sans-serif';wrap(ctx,a.label,22,38,w-44,32);},512,112);
    const b=mesh(panel3D,new T.PlaneGeometry(1.22,.27),new T.MeshBasicMaterial({map,depthTest:false}),[(i%2?1:-1)*.64,-.48-Math.floor(i/2)*.31,.015]);
    b.userData.target={kind:'ui',name:a.label,run:a.run};panelTargets.push(b);
  });
}

function sourceLink(body,url,label='Read the scientific source'){
  const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;body.append(a);
}
function inspect(data){
  if(!data)return;
  if(data.kind==='ui'){data.run();return;}
  if(state.paused)return;
  if(data.kind==='activity'){activity(data.exhibit);return;}
  if(data.kind==='map'){mapPanel();return;}
  if(data.kind==='seat'){player.sit(data.position);toast('Take a moment. Use WASD to stand up again.');return;}
  if(data.kind==='coral'){
    if(state.restored.has(data.id)){toast('This colony is already restored.');return;}
    state.restored.add(data.id);data.mat.color.set(0xeaa489);data.mat.emissive.set(0x48251b);data.mat.emissiveIntensity=.2;
    if(state.restored.size===3)state.completed.add('reef');toast(`Reef restoration: ${state.restored.size} / 3 colonies restored.`);return;
  }
  if(data.kind==='species'){
    if(data.type==='jelly'&&state.light){state.revealed.add(data.id);if(state.revealed.size>=3)state.completed.add('deep');toast(`Research observations: ${Math.min(3,state.revealed.size)} / 3`);}
    const info=species[data.type];panel(info.name,[info.latin,info.fact],[{label:'Listen to the field note',run:()=>narrate(info.fact)},{label:'Back to the aquarium',run:closePanel}],body=>sourceLink(body,state.zone.source));
  }
}
function activity(id){
  const e=exhibits.find(x=>x.id===id);
  if(id==='reef')panel(e.activity,[e.instruction,`${state.restored.size} of 3 colonies restored. Look for the three small colonies nearest the front of the coral tank. Aim and press E, click, or use the controller trigger.`],[{label:'Begin observation',run:closePanel}],body=>sourceLink(body,e.source));
  if(id==='shark')panel('Myth or fact?',['“Sharks naturally hunt humans as their usual prey.”'],[
    {label:'Myth',run:()=>{state.completed.add('shark');panel('Correct — it is a myth',['People are not the natural prey of sharks. Shark species have varied diets; whale sharks are filter feeders.'],[{label:'Continue exploring',run:closePanel}],b=>sourceLink(b,e.source));}},
    {label:'Fact',run:()=>panel('Have another look',['People are not natural prey for sharks. Think about the different diets you have seen in these exhibits.'],[{label:'Try again',run:()=>activity('shark')}])}
  ]);
  if(id==='tropical')matchHabitat(0);
  if(id==='kelp')panel('Watch the forest move',[e.fact,'Look through the tall viewing windows, find a fish among the fronds, and press P to record a photograph.'],[{label:'Return to the forest',run:closePanel}],b=>sourceLink(b,e.source));
  if(id==='deep')panel(e.activity,[e.instruction,`${Math.min(3,state.revealed.size)} of 3 observations recorded.`],[{label:state.light?'Turn research light off':'Turn research light on',run:()=>{toggleLight();closePanel();}}],b=>sourceLink(b,e.source));
  if(id==='ocean'){quizIndex=0;quizScore=0;quizQuestion();}
}
function matchHabitat(step){
  const animal=step===0?'Green turtle':'Butterflyfish',correct=step===0?0:1;
  panel('Match the habitat',[`${animal}: which feeding habitat is the best match?`],['Seagrass meadow','Coral reef'].map((label,i)=>({label,run:()=>{
    if(i!==correct){panel('Try another habitat',[step===0?'Adult green turtles feed mainly on seagrasses and algae.':'Many butterflyfish feed on coral polyps.'],[{label:'Try again',run:()=>matchHabitat(step)}]);return;}
    if(step===0)matchHabitat(1);else{state.completed.add('tropical');panel('Both habitats matched',['Seagrass meadows support green turtles; coral reefs support many butterflyfish.'],[{label:'Continue exploring',run:closePanel}]);}
  }})));
}
function quizQuestion(){
  if(quizIndex===questions.length){state.completed.add('quiz');panel('Your ocean field report',[`${quizScore} / ${questions.length} correct.`,`${state.visited.size} galleries explored · ${state.photos.length} photographs collected.`,quizScore===4?'Excellent observations. Keep exploring and discover more.':'Revisit the exhibits to learn more, then try the quiz again.'],[{label:'Keep exploring',run:closePanel},{label:'Replay from the entrance',run:restart}]);return;}
  const q=questions[quizIndex];panel(`Field quiz · ${quizIndex+1} / 4`,[q.q],q.a.map((answer,i)=>({label:answer,run:()=>{
    const correct=i===q.correct;if(correct)quizScore++;quizIndex++;panel(correct?'Correct':'A new thing to remember',[q.why],[{label:quizIndex===4?'See my score':'Next question',run:quizQuestion}]);
  }})));
}
function toggleLight(){state.light=!state.light;camera.getObject3D('research-light').visible=state.light;toast(`Research light ${state.light?'on':'off'}. Aim at a jellyfish and inspect it.`);}
function mapPanel(){
  panel('Explore the aquarium',['Walk along the illuminated route, or choose a gallery to travel there. VR visitors can use these stops for comfortable teleportation.'],exhibits.map(e=>({label:`${state.visited.has(e.id)?'✓ ':''}${e.name}`,run:()=>{player.teleport(e.stop+(e.id==='ocean'?0:4));if(!state.vr){const look=camera.components['look-controls'];look.yawObject.rotation.y=0;look.pitchObject.rotation.x=0;}closePanel();visitZone(true);}})),body=>{
    for(let i=0;i<exhibits.length;i++){const e=exhibits[i],row=document.createElement('div');row.className=`map-row ${state.zone===e?'current':''}`;const n=document.createElement('span');n.className='number';n.textContent=`0${i+1}`;const name=document.createElement('span');name.textContent=e.name;const status=document.createElement('small');status.textContent=state.zone===e?'YOU ARE HERE':state.visited.has(e.id)?'EXPLORED':'TO DISCOVER';row.append(n,name,status);body.append(row);}
  });
}
function photograph(){
  if(!state.started||state.modal)return;
  if(state.vr){toast('Photographs are available in desktop mode.');panel('Photo journal',['Exit VR to capture photographs from the desktop camera. Your exploration progress will be retained.'],[]);return;}
  if(state.photos.length>=12){toast('Your journal holds 12 photographs. Open it to download or clear them.');return;}
  try{
    const url=scene.renderer.domElement.toDataURL('image/jpeg',.75);const name=target?.kind==='species'?target.name:state.zone.name;
    state.photos.push({url,name,zone:state.zone.name});$('photo-count').textContent=state.photos.length;document.body.classList.add('flash');setTimeout(()=>document.body.classList.remove('flash'),250);toast(`Captured: ${name}. Press J to open your journal.`);
  }catch{toast('The photograph could not be captured. Please try again.');}
}
function journal(){
  panel('Your ocean journal',[state.photos.length?`${state.photos.length} / 12 photographs. Select a photograph to download it.`:'Your journal is waiting. Close this guide and press P to photograph the aquarium.'],[{label:'Back to exploring',run:closePanel},...(state.photos.length?[{label:'Clear photographs',run:()=>{state.photos=[];$('photo-count').textContent='0';journal();}}]:[])],body=>{
    const grid=document.createElement('div');grid.className='journal-grid';state.photos.forEach((photo,i)=>{const f=document.createElement('figure'),a=document.createElement('a'),img=document.createElement('img'),caption=document.createElement('figcaption');a.href=photo.url;a.download=`aquavr-${i+1}.jpg`;img.src=photo.url;img.alt=photo.name;caption.textContent=`${photo.name} · ${photo.zone}`;a.append(img);f.append(a,caption);grid.append(f);});body.append(grid);
  });
}
function menu(){
  panel('Take a breath',['Explore freely with WASD and mouse look. E inspects what you are looking at. Shift walks faster; Space makes a small hop. M opens the map, P takes a photo, J opens the journal and F switches the research light.'],[
    {label:state.started?'Resume exploring':'Enter the aquarium',run:()=>{closePanel();if(!state.started)start();}},
    {label:'Aquarium map',run:mapPanel},{label:'Photo journal',run:journal},{label:'Settings',run:settings},{label:'Sources & credits',run:credits},{label:'Restart visit',run:restart}
  ]);
}
function settings(){
  panel('Comfort & sound',['Mouse look is adjustable. Movement has no camera shake or head bob. In VR, use the map to teleport, the left stick to walk and the right stick to snap turn.'],[
    {label:`Ambient sound: ${sound.enabled?'on':'off'}`,run:()=>{sound.toggle();settings();}},
    {label:`Narration: ${state.narration?'on':'off'}`,run:()=>{state.narration=!state.narration;if(!state.narration&&'speechSynthesis'in window)speechSynthesis.cancel();settings();}},
    {label:`Captions: ${state.captions?'on':'off'}`,run:()=>{state.captions=!state.captions;if(!state.captions)$('caption').hidden=true;settings();}},
    {label:`Graphics: ${state.quality}`,run:()=>{state.quality=state.quality==='high'?'balanced':'high';scene.renderer.setPixelRatio(state.quality==='high'?Math.min(devicePixelRatio,1.5):.85);settings();}}
  ],body=>{const row=document.createElement('label');row.className='setting-row';row.textContent='Mouse sensitivity';const slider=document.createElement('input');slider.type='range';slider.min='.25';slider.max='2';slider.step='.05';slider.value=state.sensitivity;slider.setAttribute('aria-label','Mouse sensitivity');slider.addEventListener('input',()=>state.sensitivity=Number(slider.value));row.append(slider);body.append(row);});
}
function credits(){
  panel('An ocean of inspiration',['An original educational aquarium inspired by Georgia Aquarium’s tunnel, Monterey Bay’s kelp forest, Lisbon’s connected galleries and Churaumi’s panoramic ocean tank.','Marine animals, visitors, architecture and textures are original procedural 3D artwork distributed under this project’s MIT license. Animal forms and deep-sea exhibits are illustrative; this is not a replica or affiliation.','Built with A-Frame 1.6.0 (MIT) and its bundled Three.js (MIT). Water uses animated light patterns and transparent surfaces; player collision and gravity use a custom kinematic controller.'],[],body=>{
    for(const e of exhibits){const p=document.createElement('p');sourceLink(p,e.source,e.name+' — scientific reference');body.append(p);}
    for(const [name,url] of [['Georgia Aquarium','https://www.georgiaaquarium.org/gallery/ocean-voyager/'],['Monterey Bay Aquarium','https://www.montereybayaquarium.org/visit/exhibits/kelp-forest'],['Oceanário de Lisboa','https://oceanario.pt/en/exhibitions/'],['Okinawa Churaumi Aquarium','https://churaumi.okinawa/en/area/the-kuroshio/']]){const p=document.createElement('p');sourceLink(p,url,name);body.append(p);}
  });
}
function restart(){
  state.visited.clear();state.completed.clear();state.restored.clear();state.revealed.clear();state.photos=[];$('photo-count').textContent='0';
  for(const obj of world.targets)if(obj.userData.target?.kind==='coral'){obj.userData.target.mat.color.set(0xc6c9b5);obj.userData.target.mat.emissive.set(0);}
  state.light=false;camera.getObject3D('research-light').visible=false;player.teleport(11);state.started=true;$('welcome').hidden=true;$('crosshair').hidden=false;closePanel();visitZone(true);
}
function hitTest(origin,direction,targets){
  ray.set(origin,direction);ray.far=40;
  const hits=ray.intersectObjects(targets,true);
  for(const hit of hits){if(!visible(hit.object))continue;let o=hit.object;while(o&&!o.userData.target)o=o.parent;if(o){const data=o.userData.target;if((data.kind==='activity'||data.kind==='seat')&&hit.distance>6)continue;return data;}}
  return null;
}
function visible(obj){let p=obj;while(p){if(!p.visible)return false;p=p.parent;}return true;}
function controllerTarget(el){el.object3D.getWorldPosition(tempPosition);el.object3D.getWorldDirection(tempDirection).negate();return hitTest(tempPosition,tempDirection,state.modal?panelTargets:world.targets);}

function update(time,delta){
  if(!world)return;const dt=Math.min(delta/1000,.05);
  if(!state.paused){world.update(dt,rig.object3D.position);if(state.started){player.update(dt,scene.renderer.xr.getSession(),()=>sound.step());sound.update(rig.object3D.position.x);visitZone();}}
  if(!state.started)return;
  camera.object3D.getWorldPosition(tempPosition);camera.object3D.getWorldDirection(tempDirection).negate();
  target=hitTest(tempPosition,tempDirection,state.modal&&state.vr?panelTargets:world.targets);
  $('interaction').hidden=!target||state.modal;$('crosshair').classList.toggle('target',!!target);
  if(target)$('interaction-label').textContent=target.name;
  if(state.vr){
    if(target===gazeTarget)gazeTime+=dt;else{gazeTarget=target;gazeTime=0;}
    if(target&&gazeTime>1.8){gazeTime=-2;inspect(target);}
    for(const {el,line} of controllerLines)line.material.color.set(controllerTarget(el)?0xaaffcc:0x5a9fbd);
  }
  lastTime=time;
}
function bindControls(){
  // A-Frame retains its mouse listener after mouseEnabled changes; use only our sensitivity-aware handler.
  window.removeEventListener('mousemove',camera.components['look-controls'].onMouseMove);
  $('start').onclick=start;$('enter-vr').onclick=async()=>{try{await scene.enterVR();}catch{toast('VR is unavailable. Use a WebXR headset on HTTPS or localhost.');}};
  $('brand').onclick=e=>{e.preventDefault();menu();};$('menu-button').onclick=menu;$('map-button').onclick=mapPanel;$('journal-button').onclick=journal;$('photo-button').onclick=photograph;
  $('close-panel').onclick=closePanel;$('panel').addEventListener('cancel',e=>{e.preventDefault();closePanel();});
  document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&state.started&&!state.modal&&!state.vr)menu();});
  window.addEventListener('blur',()=>{if(state.started&&!state.modal&&!state.vr)menu();});
  let dragging=false;
  scene.canvas.addEventListener('mousedown',e=>{if(e.button===0)dragging=true;});window.addEventListener('mouseup',()=>dragging=false);
  document.addEventListener('mousemove',e=>{
    if(!state.started||state.modal||state.vr||(!document.pointerLockElement&&!dragging))return;
    const c=camera.components['look-controls'];c.yawObject.rotation.y-=e.movementX*.002*state.sensitivity;c.pitchObject.rotation.x=Math.max(-1.5,Math.min(1.5,c.pitchObject.rotation.x-e.movementY*.002*state.sensitivity));
  });
  scene.canvas.addEventListener('click',()=>{if(!state.started||state.modal)return;if(document.pointerLockElement&&target)inspect(target);else pointerLock();});
  window.addEventListener('keydown',e=>{
    if(e.repeat||!state.started||state.modal||e.target.matches('input'))return;
    if(e.code==='KeyE')inspect(target);
    if(e.code==='KeyM')mapPanel();if(e.code==='KeyJ')journal();if(e.code==='KeyP')photograph();if(e.code==='KeyF')toggleLight();if(e.code==='KeyR')narrate(state.zone.fact);
    if(e.code==='Escape'&&!document.pointerLockElement)menu();
  });
  document.querySelectorAll('[data-move]').forEach(b=>{b.addEventListener('pointerdown',e=>{b.setPointerCapture(e.pointerId);player.keys.add(b.dataset.move);});for(const name of ['pointerup','pointercancel'])b.addEventListener(name,()=>player.keys.delete(b.dataset.move));});$('touch-interact').onclick=()=>inspect(target);
  scene.addEventListener('enter-vr',()=>{state.vr=true;document.body.classList.add('in-vr');state.started=true;$('welcome').hidden=true;player.enabled=true;state.paused=false;sound.start();if($('panel').open)$('panel').close();state.modal=false;visitZone(true);panel('Welcome to AquaVR',['Use controller triggers to select. The left stick moves; the right stick snap turns. Gaze at a button for two seconds to select without controllers.','The gallery map provides comfortable teleportation.'],[{label:'Explore the aquarium',run:closePanel},{label:'Open gallery map',run:mapPanel}]);});
  scene.addEventListener('exit-vr',()=>{state.vr=false;document.body.classList.remove('in-vr');clearSpatialPanel();clearCaption3D();state.modal=false;menu();});
  for(const id of ['left-controller','right-controller']){
    const el=$(id),line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-12)]),new T.LineBasicMaterial({color:0x77c4d7,transparent:true,opacity:.65}));line.visible=false;el.object3D.add(line);controllerLines.push({el,line});el.addEventListener('controllerconnected',()=>line.visible=true);el.addEventListener('controllerdisconnected',()=>line.visible=false);
    el.addEventListener('triggerdown',()=>inspect(controllerTarget(el)));el.addEventListener('abuttondown',mapPanel);el.addEventListener('xbuttondown',menu);
  }
}
async function initialize(){
  try{
    camera.setAttribute('look-controls','mouseEnabled',false);camera.setAttribute('look-controls','pointerLockEnabled',false);
    world=new Aquarium(scene);player=new Player(rig,camera,world);sound=new Soundscape();
    scene.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));scene.renderer.toneMapping=T.ACESFilmicToneMapping;scene.renderer.toneMappingExposure=1.15;
    const light=new T.SpotLight(0xc8dfff,24,27,Math.PI/7,.7,1);light.position.set(0,-.15,0);light.target.position.set(0,-.1,-10);camera.object3D.add(light.target);camera.setObject3D('research-light',light);light.visible=false;
    bindControls();
    AFRAME.registerComponent('aquarium-runtime',{tick:update});scene.setAttribute('aquarium-runtime','');
    $('loading').hidden=true;$('interface').hidden=false;$('start').disabled=false;$('start').textContent='Enter the aquarium  →';visitZone();
    if(!navigator.xr||!await navigator.xr.isSessionSupported('immersive-vr').catch(()=>false)){$('enter-vr').textContent='VR unavailable';$('enter-vr').title='Connect a WebXR headset using a compatible browser.';$('enter-vr').disabled=true;}
    // Read-only diagnostics for browser verification and the university demonstration.
    window.aquavr={get status(){return {ready:true,started:state.started,paused:state.paused,zone:state.zone?.id,visited:[...state.visited],activities:[...state.completed],photos:state.photos.length,position:rig.object3D.position.toArray(),animals:world.animals.length,visitors:world.people.length,time:world.time,drawCalls:scene.renderer.info.render.calls};}};
  }catch(error){console.error(error);$('loading').hidden=false;$('load-status').textContent='The aquarium could not start. Reload in a browser with WebGL enabled.';}
}
if(scene.hasLoaded)initialize();else scene.addEventListener('loaded',initialize,{once:true});
