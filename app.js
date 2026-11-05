import {TheatreSound} from './audio.mjs';
import {sceneAt,DURATION,SOUND_CUES} from './timeline.mjs';

if(new URLSearchParams(location.search).get('theme')==='retro'){
  location.replace(new URL('./retro.html?theme=retro',location.href));
}else{
  queueMicrotask(start);
}
function start(){
  const root=document.querySelector('.theatre');
  const body=document.body;
  const soundButton=document.getElementById('sound-button');
  const pauseButton=document.getElementById('pause-button');
  const sign=document.getElementById('final-sign');
  const dialogue=document.getElementById('dialogue');
  const lineNode=document.getElementById('line');
  const asideNode=document.getElementById('aside');
  const speakerNode=document.getElementById('speaker');
  const announcement=document.getElementById('announcement');
  const lampButton=document.getElementById('lamp-button');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const sound=new TheatreSound();
  void sound.resume();
  body.classList.add('js');sign.inert=true;
  let startedAt=0, pausedAt=null, manualPause=false, ready=false, finished=false, skipped=false, frame=0, cueIndex=0, lastLine='', lastPhase='';
  let bounds={width:root.clientWidth,height:root.clientHeight};
  const lastValues=new Map();
  const assets=['./assets/jesus-left-arm.png','./assets/foreman-left-arm.png','./assets/theater-stage.png','./assets/theater-wreckage.png'];
  createPuppet('jesus',assets[0],{
    heads:[[70,16,386,420],[580,16,386,420],[1090,16,410,424]],body:[160,460,205,555],point:[518,505,520,260],pointUrl:assets[0],rest:[1167,470,177,515]
  });
  createPuppet('foreman',assets[1],{
    heads:[[112,0,320,430],[615,0,330,430],[1120,0,360,430]],body:[138,455,280,565],point:[518,505,525,260],pointUrl:assets[1],rest:[1165,475,185,515]
  });

  function createPuppet(id,url,parts){
    const target=document.querySelector(`#${id} .puppet-parts`);
    const ns='http://www.w3.org/2000/svg';
    function part(box,classes,container=target,source=url){
      const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',box.join(' '));svg.setAttribute('class',`sprite ${classes}`);
      if(classes.includes('arm'))svg.style.aspectRatio=`${box[2]} / ${box[3]}`;
      const defs=document.createElementNS(ns,'defs'),clip=document.createElementNS(ns,'clipPath'),rect=document.createElementNS(ns,'rect');
      const clipId=`${id}-${classes.replaceAll(' ','-')}`;clip.id=clipId;
      ['x','y','width','height'].forEach((name,i)=>rect.setAttribute(name,box[i]));clip.append(rect);defs.append(clip);svg.append(defs);
      const image=document.createElementNS(ns,'image');image.setAttribute('href',source);image.setAttribute('width','1536');image.setAttribute('height','1024');
      image.setAttribute('clip-path',`url(#${clipId})`);
      if(id==='foreman'&&classes==='sprite-arm-point'){
        const hammer=document.createElementNS(ns,'g');hammer.setAttribute('class','svg-hammer');
        const handle=document.createElementNS(ns,'rect');handle.setAttribute('x','981');handle.setAttribute('y','601');handle.setAttribute('width','14');handle.setAttribute('height','135');handle.setAttribute('rx','3');handle.setAttribute('fill','#bb8a4b');handle.setAttribute('stroke','#644628');
        const head=document.createElementNS(ns,'rect');head.setAttribute('x','945');head.setAttribute('y','584');head.setAttribute('width','87');head.setAttribute('height','30');head.setAttribute('rx','5');head.setAttribute('fill','#99968c');head.setAttribute('stroke','#514d49');head.setAttribute('stroke-width','3');
        hammer.append(handle,head);svg.append(hammer);
      }
      svg.append(image);container.append(svg);
    }
    part(parts.rest,'sprite-arm-left');part(parts.body,'sprite-body');part(parts.rest,'sprite-arm-rest');part(parts.point,'sprite-arm-point',target,parts.pointUrl);
    parts.heads.forEach((box,i)=>part(box,`sprite-head expression-${i}`));
    if(id==='jesus')part([1200,792,146,190],'raised-hand',document.querySelector('.last-hand'));
  }
  const images=assets.map(src=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(true);img.onerror=()=>resolve(false);img.src=src;}));
  Promise.all(images).then(()=>{
    ready=true;body.classList.add('ready');startedAt=performance.now();
    if(document.hidden||manualPause){pausedAt=startedAt;body.classList.add('paused');}
    if(skipped||reduced.matches)goToEnd();else requestTick();
  });
  function elapsed(now=performance.now()){return finished?DURATION:Math.max(0,(pausedAt??now)-startedAt);}
  function requestTick(){if(!frame)frame=requestAnimationFrame(tick);}
  function tick(now){frame=0;if(!ready||pausedAt!==null)return;render(elapsed(now));if(!finished)requestTick();}
  function render(time){
    const state=sceneAt(time,bounds.width,bounds.height);
    for(const [name,value]of Object.entries(state.values)){
      const text=typeof value==='number'?value.toFixed(4):value;
      if(lastValues.get(name)!==text){root.style.setProperty(name,text);lastValues.set(name,text);}
    }
    document.getElementById('jesus').dataset.face=state.jesusFace;
    document.getElementById('foreman').dataset.face=state.workerFace;
    if(state.phase!==lastPhase){body.dataset.phase=state.phase;lastPhase=state.phase;}
    dialogue.classList.toggle('is-lastwords',state.phase==='lastwords');
    if(lastLine!==state.line){lineNode.textContent=state.line;lastLine=state.line;announcement.textContent=state.line?`${state.speaker}: ${state.line} ${state.aside}`:'';}
    speakerNode.textContent=state.speaker;asideNode.textContent=state.aside;
    document.getElementById('act-number').textContent=state.act;
    document.getElementById('act-name').textContent=state.title;
    const visible=time>=29900, complete=time>=DURATION;
    sign.classList.toggle('is-visible',visible);sign.classList.toggle('is-ready',complete);sign.inert=!complete;
    document.getElementById('skip-button').hidden=complete;
    pauseButton.hidden=complete;
    while(cueIndex<SOUND_CUES.length&&SOUND_CUES[cueIndex][0]<=time){
      const [at,cue]=SOUND_CUES[cueIndex++];
      if(time-at<200&&!document.hidden)sound.cue(cue);
    }
    if(complete){finished=true;announcement.textContent='Buon compleanno, Silvio. Miracle under construction. The real surprise is still being built. Torna presto.';}
  }
  function goToEnd(){
    skipped=true;if(!ready)return;sound.stop();cueIndex=SOUND_CUES.length;
    finished=true;cancelAnimationFrame(frame);frame=0;render(DURATION);
  }
  function replay(){
    if(!ready)return;sound.stop();finished=false;skipped=false;cueIndex=0;lastPhase='';lastLine='';
    body.classList.remove('lamp-on');lampButton.setAttribute('aria-pressed','false');document.querySelector('.lamp-plaque').hidden=true;
    startedAt=performance.now();pausedAt=document.hidden?startedAt:null;
    manualPause=false;body.classList.toggle('paused',document.hidden);pauseButton.setAttribute('aria-pressed','false');pauseButton.setAttribute('aria-label','Pause performance');pauseButton.textContent='Ⅱ';
    if(reduced.matches){goToEnd();return;}render(0);requestTick();
  }
  document.getElementById('skip-button').addEventListener('click',goToEnd);
  document.getElementById('replay-button').addEventListener('click',()=>{replay();soundButton.focus({preventScroll:true});});
  soundButton.addEventListener('click',async()=>{
    soundButton.disabled=true;try{await sound.toggle();}finally{soundButton.disabled=false;}
    soundButton.setAttribute('aria-pressed',String(sound.enabled));soundButton.innerHTML=`<span aria-hidden="true">♪</span> Sound ${sound.enabled?'on':'off'}`;
    if(sound.enabled){if(pausedAt!==null)sound.pause();else sound.cue('chime');}
  });
  function unlockSound(event){
    if(document.hidden||pausedAt!==null||event.target instanceof Element&&event.target.closest('#sound-button'))return;
    void sound.resume();
  }
  for(const event of ['pointerdown','pointerup','keydown','click'])document.addEventListener(event,unlockSound,{capture:true});
  lampButton.addEventListener('click',()=>{
    if(body.classList.contains('lamp-on'))return;body.classList.add('lamp-on');lampButton.setAttribute('aria-pressed','true');
    document.querySelector('.lamp-plaque').hidden=false;sound.cue('lamp');announcement.textContent='Now you can see that it’s still unfinished.';
  });
  function syncPause(){
    if(!ready)return;
    if(document.hidden||manualPause){if(pausedAt===null)pausedAt=performance.now();body.classList.add('paused');sound.pause();cancelAnimationFrame(frame);frame=0;}
    else{if(pausedAt!==null)startedAt+=performance.now()-pausedAt;pausedAt=null;body.classList.remove('paused');sound.resume();if(!finished)requestTick();}
  }
  pauseButton.addEventListener('click',()=>{manualPause=!manualPause;pauseButton.setAttribute('aria-pressed',String(manualPause));pauseButton.setAttribute('aria-label',manualPause?'Resume performance':'Pause performance');pauseButton.textContent=manualPause?'▶':'Ⅱ';syncPause();});
  document.addEventListener('visibilitychange',syncPause);
  reduced.addEventListener('change',event=>{if(event.matches)goToEnd();});
  new ResizeObserver(()=>{bounds={width:root.clientWidth,height:root.clientHeight};if(ready)render(elapsed());}).observe(root);
}


