import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../retro.js',import.meta.url),'utf8').replace(/^\uFEFF?import[^\n]+\n/,'');

function createRetro({reduced=false,allowSound=true}={}){
  const frames=[];const soundCalls=[];const nodes=new Map();let now=1000;
  const classes=()=>{
    const values=new Set();return {
      add(...names){names.forEach(n=>values.add(n));},remove(...names){names.forEach(n=>values.delete(n));},
      contains(name){return values.has(name);},toggle(name,on){on??=!values.has(name);on?values.add(name):values.delete(name);return on;}
    };
  };
  function node(id){
    if(!nodes.has(id))nodes.set(id,{
      dataset:{},classList:classes(),disabled:false,inert:false,textContent:'',attributes:new Map(),listeners:new Map(),
      setAttribute(name,value){this.attributes.set(name,value);},focus(){},
      addEventListener(name,listener){this.listeners.set(name,listener);},
      async click(){if(!this.disabled)await this.listeners.get('click')?.();}
    });return nodes.get(id);
  }
  const document={body:node('body'),documentElement:node('html'),hidden:false,getElementById:node,querySelector:node,addEventListener(){}};
  class Sound{
    constructor(){this.enabled=false;this.context=null;this.master=null;}
    async setEnabled(enabled){soundCalls.push(enabled);return this.enabled=enabled&&allowSound;}
    pause(){}async resume(){return this.enabled;}
  }
  vm.runInNewContext(source,{
    document,window:{matchMedia:()=>({matches:reduced,addEventListener(){}})},TheatreSound:Sound,
    URLSearchParams,location:{search:'?theme=retro'},performance:{now:()=>now},
    requestAnimationFrame:callback=>frames.push(callback),console
  });
  return {node,document,frames,soundCalls,advance(ms){now+=ms;frames.shift()?.(now);}};
}

test('Retro waits at its choice without scheduling the birthday or audio',()=>{
  const r=createRetro();assert.equal(r.frames.length,0);assert.deepEqual(r.soundCalls,[]);
  assert.equal(r.node('.controls').inert,true);assert.equal(r.node('.stage-inner').inert,true);
  assert.equal(r.document.body.classList.contains('started'),false);
});
test('Silent but blessed starts from the greeting with sound off',async()=>{
  const r=createRetro();await r.node('retro-watch-quietly').click();
  assert.deepEqual(r.soundCalls,[false]);assert.equal(r.frames.length,1);
  assert.equal(r.node('sound-button').attributes.get('aria-pressed'),'false');
  assert.equal(r.node('retro-welcome').inert,true);assert.equal(r.node('.stage-inner').inert,false);
  r.advance(5000);assert.equal(r.document.body.dataset.phase,'greeting');
});
test('Holy noise starts with sound and a repeated choice cannot restart it',async()=>{
  const r=createRetro();await r.node('retro-watch-with-sound').click();await r.node('retro-watch-quietly').click();
  assert.deepEqual(r.soundCalls,[true]);assert.equal(r.frames.length,1);
  assert.equal(r.node('sound-button').attributes.get('aria-pressed'),'true');
  await r.node('sound-button').click();assert.equal(r.node('sound-button').attributes.get('aria-pressed'),'false');
  await r.node('replay-button').click();assert.equal(r.frames.length,1);
  assert.equal(r.node('sound-button').attributes.get('aria-pressed'),'false');
});
test('unavailable sound starts the chosen experience quietly',async()=>{
  const r=createRetro({allowSound:false});await r.node('retro-watch-with-sound').click();
  assert.equal(r.document.body.classList.contains('started'),true);assert.equal(r.frames.length,1);
  assert.equal(r.node('sound-button').attributes.get('aria-pressed'),'false');
});
test('reduced motion still waits for the choice before the construction ending',async()=>{
  const r=createRetro({reduced:true});assert.equal(r.frames.length,0);
  await r.node('retro-watch-quietly').click();
  assert.equal(r.document.body.dataset.phase,'construction');assert.equal(r.document.body.classList.contains('dead'),true);
});
