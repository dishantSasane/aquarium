import {T} from './graphics.js';

export class Player {
  constructor(rig,camera,world){
    this.rig=rig;this.camera=camera;this.world=world;this.keys=new Set();this.velocity=new T.Vector3();this.vertical=0;this.enabled=false;this.seated=false;this.snapReady=true;this.steps=0;
    this.direction=new T.Vector3();this.right=new T.Vector3();this.targetVelocity=new T.Vector3();
    window.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea'))return;this.keys.add(e.code);if(this.enabled&&['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();});
    window.addEventListener('keyup',e=>this.keys.delete(e.code));window.addEventListener('blur',()=>this.clear());
  }
  clear(){this.keys.clear();this.velocity.set(0,0,0);}
  teleport(z){this.rig.object3D.position.set(0,0,z);this.clear();this.vertical=0;this.stand();}
  sit(pos){this.rig.object3D.position.set(...pos);this.camera.object3D.position.y=1.12;this.seated=true;this.clear();}
  stand(){this.camera.object3D.position.y=1.65;this.seated=false;}
  update(dt,session,onStep){
    if(!this.enabled)return;
    let forward=Number(this.keys.has('KeyW')||this.keys.has('ArrowUp'))-Number(this.keys.has('KeyS')||this.keys.has('ArrowDown'));
    let side=Number(this.keys.has('KeyD')||this.keys.has('ArrowRight'))-Number(this.keys.has('KeyA')||this.keys.has('ArrowLeft'));
    if(session)for(const input of session.inputSources){
      const axes=input.gamepad?.axes;if(!axes||axes.length<2)continue;
      const x=axes[axes.length-2],y=axes[axes.length-1];
      if(input.handedness==='left'){side+=Math.abs(x)>.15?x:0;forward-=Math.abs(y)>.15?y:0;}
      if(input.handedness==='right'){if(Math.abs(x)>.7&&this.snapReady){this.rig.object3D.rotation.y-=Math.sign(x)*Math.PI/6;this.snapReady=false;}if(Math.abs(x)<.2)this.snapReady=true;}
    }
    if(this.seated&&(forward||side||this.keys.has('Space')))this.stand();
    this.camera.object3D.getWorldDirection(this.direction);this.direction.negate();this.direction.y=0;this.direction.normalize();
    this.right.crossVectors(this.direction,new T.Vector3(0,1,0));
    const speed=this.keys.has('ShiftLeft')?4.8:2.9;
    this.targetVelocity.copy(this.direction).multiplyScalar(forward).addScaledVector(this.right,side);
    if(this.targetVelocity.lengthSq()>1)this.targetVelocity.normalize();this.targetVelocity.multiplyScalar(speed);
    this.velocity.lerp(this.targetVelocity,1-Math.exp(-12*dt));
    const p=this.rig.object3D.position,dx=this.velocity.x*dt,dz=this.velocity.z*dt;
    // Swept substeps and axis sliding keep the player capsule outside barriers.
    const count=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dz))/.1));
    for(let i=0;i<count;i++){
      if(!this.world.blocked(p.x+dx/count,p.z))p.x+=dx/count;
      if(!this.world.blocked(p.x,p.z+dz/count))p.z+=dz/count;
    }
    if(!session){if(this.keys.has('Space')&&p.y<=.001&&!this.seated){this.vertical=3.4;this.keys.delete('Space');}this.vertical-=9.81*dt;p.y=Math.max(0,p.y+this.vertical*dt);if(p.y===0)this.vertical=0;}
    if(this.velocity.length()>1&&p.y===0){this.steps+=dt;if(this.steps>.48){onStep?.();this.steps=0;}}
  }
}

export class Soundscape {
  constructor(){this.enabled=true;this.context=null;}
  start(){
    if(!this.context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
      const ctx=this.context=new Audio();this.master=ctx.createGain();this.master.gain.value=.035;this.master.connect(ctx.destination);
      const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),data=buffer.getChannelData(0);let last=0;
      for(let i=0;i<data.length;i++){last=(last+(Math.random()*2-1)*.03)/1.02;data[i]=last*4;}
      const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=700;
      this.pan=ctx.createStereoPanner();source.connect(filter);filter.connect(this.pan);this.pan.connect(this.master);source.start();
    }this.context.resume().catch(()=>{});
  }
  toggle(){this.enabled=!this.enabled;if(this.master)this.master.gain.value=this.enabled?.035:0;return this.enabled;}
  step(){if(!this.context||!this.enabled)return;const c=this.context,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(110,c.currentTime);o.frequency.exponentialRampToValueAtTime(45,c.currentTime+.1);g.gain.setValueAtTime(.08,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.12);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.13);}
  update(x){if(this.pan)this.pan.pan.value=Math.max(-1,Math.min(1,x/7));}
  pause(){this.context?.suspend();}
}
