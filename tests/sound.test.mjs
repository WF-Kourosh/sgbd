import test from 'node:test';
import assert from 'node:assert/strict';
import {TheatreSound} from '../js/sound.mjs';

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

test('sound defaults off and does not create an audio context before a choice',async t=>{
  const control=mockAudio(t);const sound=new TheatreSound();
  assert.equal(sound.enabled,false);await sound.resume();
  assert.equal(sound.context,null);assert.equal(control.contexts,0);
});
test('an explicit sound choice starts audio',async t=>{
  const control=mockAudio(t);const sound=new TheatreSound();
  assert.equal(await sound.setEnabled(true),true);
  assert.equal(sound.context.state,'running');assert.equal(control.contexts,1);
});
test('blocked audio stays off and can be retried with the sound button',async t=>{
  const control=mockAudio(t,{blocked:true});const sound=new TheatreSound();
  await sound.setEnabled(true);assert.equal(sound.enabled,false);assert.equal(sound.context.state,'suspended');
  control.blocked=false;await sound.toggle();await sound.resume();
  assert.equal(sound.context.state,'running');assert.equal(control.contexts,1);assert.equal(control.resumes,2);
});
test('muting prevents later playback resumes from enabling sound',async t=>{
  const control=mockAudio(t);const sound=new TheatreSound();await sound.setEnabled(true);
  let stopped=false;sound.voices.add({stop(){stopped=true;}});
  await sound.toggle();assert.equal(sound.enabled,false);assert.equal(stopped,true);
  await sound.resume();assert.equal(control.resumes,1);
  await sound.toggle();assert.equal(sound.enabled,true);assert.equal(sound.context.state,'running');
});
test('an unavailable audio API leaves the visual experience usable',async t=>{
  const previous=globalThis.window;globalThis.window={};
  t.after(()=>{if(previous===undefined)delete globalThis.window;else globalThis.window=previous;});
  const sound=new TheatreSound();await sound.setEnabled(true);sound.cue('chime');
  assert.equal(sound.context,null);assert.equal(sound.enabled,false);
});
test('an unresolved resume cannot leave the opening choice stuck',async t=>{
  mockAudio(t);window.AudioContext.prototype.resume=()=>new Promise(()=>{});
  const sound=new TheatreSound();await sound.setEnabled(true);
  assert.equal(sound.enabled,false);
});
