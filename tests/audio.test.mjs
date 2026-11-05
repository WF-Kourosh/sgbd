import test from 'node:test';
import assert from 'node:assert/strict';
import {TheatreSound} from '../audio.mjs';

function mockAudio(t,{blocked=false}={}){
  const previous=globalThis.window;
  const control={blocked,contexts:0,resumes:0};
  class AudioContext{
    constructor(){control.contexts++;this.state='suspended';this.destination={};}
    createGain(){return {gain:{value:0},connect(){}};}
    async resume(){control.resumes++;if(control.blocked)throw new Error('Autoplay blocked');this.state='running';}
  }
  globalThis.window={AudioContext};
  t.after(()=>{if(previous===undefined)delete globalThis.window;else globalThis.window=previous;});
  return control;
}

test('sound defaults on and attempts playback without the sound button',async t=>{
  const control=mockAudio(t);const sound=new TheatreSound();
  assert.equal(sound.enabled,true);await sound.resume();
  assert.equal(sound.context.state,'running');assert.equal(control.contexts,1);
});
test('blocked autoplay preserves the preference and retries the same context',async t=>{
  const control=mockAudio(t,{blocked:true});const sound=new TheatreSound();
  await sound.resume();assert.equal(sound.enabled,true);assert.equal(sound.context.state,'suspended');
  control.blocked=false;await sound.resume();await sound.resume();
  assert.equal(sound.context.state,'running');assert.equal(control.contexts,1);assert.equal(control.resumes,2);
});
test('muting prevents later interactions from unlocking sound',async t=>{
  const control=mockAudio(t,{blocked:true});const sound=new TheatreSound();await sound.resume();
  let stopped=false;sound.voices.add({stop(){stopped=true;}});
  await sound.toggle();assert.equal(sound.enabled,false);assert.equal(stopped,true);
  control.blocked=false;await sound.resume();assert.equal(control.resumes,1);
  await sound.toggle();assert.equal(sound.enabled,true);assert.equal(sound.context.state,'running');
});
test('an unavailable audio API leaves the visual experience usable',async t=>{
  const previous=globalThis.window;globalThis.window={};
  t.after(()=>{if(previous===undefined)delete globalThis.window;else globalThis.window=previous;});
  const sound=new TheatreSound();await sound.resume();sound.cue('chime');
  assert.equal(sound.context,null);
});
