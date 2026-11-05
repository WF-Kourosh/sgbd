import test from 'node:test';
import assert from 'node:assert/strict';
import {sceneAt,PHASES,DURATION,SOUND_CUES} from '../timeline.mjs';

test('each act starts at its defined boundary',()=>{
  for(const [time,phase]of PHASES)assert.equal(sceneAt(time).phase,phase);
  assert.equal(sceneAt(DURATION+5000).phase,'construction');
});
test('the final wish finishes before the foreman arrives',()=>{
  assert.match(sceneAt(21000).line,/outlive me, Silvio/);
  assert.equal(sceneAt(22000).dead,false);
  assert.equal(sceneAt(22500).dead,true);
  assert.equal(sceneAt(24299).values['--worker'],0);
  assert.equal(sceneAt(24300).phase,'worker');
});
test('landed wreckage and the fallen pose persist through construction',()=>{
  for(const time of[19000,24300,30000,33000]){
    const s=sceneAt(time);assert.equal(s.values['--wreck'],1);assert.notEqual(s.values['--jr'],'0deg');
  }
  assert.equal(sceneAt(0).dead,false);assert.equal(sceneAt(0).values['--wreck'],0);
});
test('posts precede tape and the sign; final controls appear at the end',()=>{
  assert.equal(sceneAt(27000).values['--tape'],0);
  assert.equal(sceneAt(29000).values['--sign'],0);
  assert.equal(sceneAt(DURATION).values['--sign'],1);
  assert.equal(sceneAt(DURATION).values['--buttons'],1);
});
test('scene values remain finite at desktop and phone dimensions',()=>{
  for(const [w,h]of[[1280,720],[390,751],[320,610]])for(let t=0;t<=DURATION;t+=83){
    const s=sceneAt(t,w,h);
    for(const value of Object.values(s.values))assert.ok(typeof value==='number'?Number.isFinite(value):!value.includes('NaN'));
  }
});
test('sound cues are ordered and leave silence for the birthday wish',()=>{
  assert.deepEqual(SOUND_CUES.map(([t])=>t),SOUND_CUES.map(([t])=>t).sort((a,b)=>a-b));
  assert.equal(SOUND_CUES.find(([t])=>t===19000)[1],'silence');
  assert.equal(SOUND_CUES.some(([t])=>t>19000&&t<24300),false);
});
