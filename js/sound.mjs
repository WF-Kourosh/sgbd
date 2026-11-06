// Create and resume audio only after an explicit sound choice.
export class TheatreSound{
  constructor(){this.enabled=false;this.context=null;this.master=null;this.voices=new Set();this.timers=new Set();}
  toggle(){return this.setEnabled(!this.enabled);}
  async setEnabled(enabled){
    this.enabled=enabled;
    if(!enabled){this.stop();return false;}
    if(!await this.resume()){this.enabled=false;this.stop();}
    return this.enabled;
  }
  voice(source,nodes,duration){this.voices.add(source);source.onended=()=>{this.voices.delete(source);source.disconnect();nodes.forEach(n=>n.disconnect());};source.start();source.stop(this.context.currentTime+duration+.04);}
  tone(hz,length=.3,volume=.2,type='sine',end=hz){
    if(!this.enabled||!this.context||this.context.state!=='running')return;
    const c=this.context,o=c.createOscillator(),g=c.createGain(),now=c.currentTime;o.type=type;o.frequency.setValueAtTime(hz,now);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),now+length);
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(volume,now+.025);g.gain.exponentialRampToValueAtTime(.0001,now+length);o.connect(g);g.connect(this.master);this.voice(o,[g],length);
  }
  noise(length=.4,volume=.4,cutoff=350){
    if(!this.enabled||!this.context||this.context.state!=='running')return;
    const c=this.context,b=c.createBuffer(1,Math.ceil(c.sampleRate*length),c.sampleRate),d=b.getChannelData(0);let brown=0;
    for(let i=0;i<d.length;i++){brown=(brown+.04*(Math.random()*2-1))/1.04;d[i]=brown*3;}
    const source=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain(),now=c.currentTime;source.buffer=b;filter.type='lowpass';filter.frequency.value=cutoff;
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(volume,now+.025);g.gain.exponentialRampToValueAtTime(.0001,now+length);source.connect(filter);filter.connect(g);g.connect(this.master);this.voice(source,[filter,g],length);
  }
  cue(name){
    if(name==='silence'){this.stop();return;}if(!this.enabled)return;
    switch(name){
      case'chime':this.tone(523,.8,.12);this.tone(659,.9,.08);this.tone(784,1,.06);break;
      case'reveal':this.tone(392,1,.12);this.tone(494,1.2,.1);this.tone(587,1.3,.08);break;
      case'blip':this.tone(880,.035,.025,'square');break;
      case'select':this.tone(660,.08,.07,'square');this.later(()=>this.tone(990,.12,.07,'square'),70);break;
      case'start':[523,659,784,1047].forEach((hz,i)=>this.later(()=>this.tone(hz,.16,.08,'square'),i*90));break;
      case'upload':[392,523,659].forEach((hz,i)=>this.later(()=>this.tone(hz,.12,.06,'square'),i*120));break;
      case'round':this.tone(440,.1,.08,'square');this.later(()=>this.tone(440,.1,.08,'square'),160);this.later(()=>this.tone(880,.3,.09,'square'),320);break;
      case'whoosh':this.noise(.7,.5,1800);break;
      case'relight':this.tone(300,.25,.06,'triangle',900);this.noise(.12,.2,3000);break;
      case'victory':[523,659,784,1047,784,1047].forEach((hz,i)=>this.later(()=>this.tone(hz,.18,.08,'square'),i*110));break;
      case'creak':this.tone(140,.9,.08,'sawtooth',95);break;
      case'tick':this.tone(1320,.06,.06,'square');break;
      case'stall':this.tone(330,.6,.08,'square',160);break;
      case'gameover':[392,349,330,262].forEach((hz,i)=>this.later(()=>this.tone(hz,.32,.08,'square'),i*260));break;
      case'coin':this.tone(988,.08,.08,'square');this.later(()=>this.tone(1319,.4,.08,'square'),80);break;
      case'switch':this.tone(2200,.03,.09,'square',1800);this.noise(.05,.25,3500);break;
      case'fiat':[262,392,523,659].forEach((hz,i)=>this.later(()=>this.tone(hz,2.4,.045,'sine'),i*220));break;
      case'ufo':this.tone(520,1.3,.035,'sine',820);this.later(()=>this.tone(820,1.3,.035,'sine',480),1300);this.later(()=>this.tone(480,1.6,.03,'sine',700),2600);break;
      case'nein':this.tone(196,.18,.08,'square');this.later(()=>this.tone(147,.3,.08,'square'),150);break;
      case'steps':this.noise(.13,.28,250);this.tone(95,.13,.1,'triangle',55);break;
      case'screw':this.tone(1200,.12,.07,'triangle',600);break;
      case'shake':this.noise(.65,.7,400);this.tone(75,.5,.3,'triangle',38);this.tone(185,.3,.03,'sawtooth',90);break;
      case'crack':this.noise(.2,.6,2200);this.tone(220,.3,.08,'sawtooth',75);break;
      case'crash':this.noise(.9,.8,1400);this.tone(125,.7,.3,'triangle',30);break;
      case'impact':this.noise(1,.9,500);this.tone(80,.7,.35,'triangle',25);break;
      case'hammer':this.noise(.09,.5,1800);this.tone(420,.12,.18,'triangle',170);break;
      case'tape':this.noise(.8,.2,2600);break;
      case'lamp':this.tone(660,.3,.1);this.tone(880,.4,.08);break;
    }
  }
  // Short arpeggios are scheduled with timers so stop() can cancel the notes that haven't started.
  later(play,ms){const id=setTimeout(()=>{this.timers.delete(id);play();},ms);this.timers.add(id);}
  stop(){for(const id of this.timers)clearTimeout(id);this.timers.clear();for(const v of this.voices){try{v.stop();}catch{}}this.voices.clear();}
  pause(){if(this.context?.state==='running')this.context.suspend().catch(()=>{});}
  async resume(){
    if(!this.enabled)return false;
    let timer;
    try{
      if(!this.context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=.23;this.master.connect(this.context.destination);}
      if(this.context.state==='closed')return false;
      if(this.context.state!=='running')await Promise.race([
        this.context.resume(),
        new Promise(resolve=>{timer=setTimeout(resolve,1500);})
      ]);
      return this.enabled&&this.context.state==='running';
    }catch{return false;}finally{clearTimeout(timer);}
  }
}

