export const DURATION = 33000;
export const PHASES = [
  [0, 'arrival'], [1200, 'greeting'], [6800, 'reveal'], [12000, 'malfunction'],
  [15000, 'collapse'], [19000, 'lastwords'], [24300, 'worker'],
  [27000, 'installation'], [33000, 'construction']
];
export const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
export const between = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = n => n * n * (3 - 2 * n);
const out = n => 1 - Math.pow(1 - n, 3);
const mix = (a, b, p) => a + (b - a) * p;

// Every physical part follows this clock. Pausing or replaying never restarts a
// separate CSS timer, and landed pieces remain in their exact final position.
export function sceneAt(ms, width = 1280, height = 720) {
  const t = clamp(ms, 0, DURATION);
  const phase = PHASES.filter(([start]) => t >= start).at(-1)[1];
  const mobile = width <= 700;
  const walk = smooth(between(t, 6900, 8600));
  const knock = out(between(t, 16900, 17800));
  const dead = t >= 22500;
  const catchPiece = t >= 14300 && t < 16600;
  const workerWalk = out(between(t, 24300, 26900));
  const installing = t >= 27000 && t < DURATION;
  const shake = t >= 12000 && t < 15000 ? Math.sin((t - 12000) / 38) * between(t, 12000, 14900) : 0;
  const cloth = between(t, 16400, 18300);
  const beam = between(t, 15600, 17500);
  const cabinetFall = between(t, 16500, 18500);
  const dust = between(t, 16900, 19100);
  const installSign = out(between(t, 29900, 32000));
  const installBounce = t >= 32000 && t < 32700 ? Math.sin(between(t,32000,32700)*Math.PI*3) * (1-between(t,32000,32700)) * 2 : 0;
  let jx = width * (mobile ? .035 : .065) * walk;
  let jy = walk > 0 && walk < 1 ? Math.sin(walk * Math.PI * 7) * -4 : 0;
  jy += height * (mobile ? .045 : .085) * knock;
  jx -= width * (mobile ? -.10 : .045) * knock;
  const jr = (mobile ? -28 : -58) * knock;
  const stepBack=smooth(between(t,31500,33000));
  const wx = width * .7 * (1 - workerWalk) + width * .135 * stepBack - width*(mobile?.25:.16)*smooth(between(t,27000,28000))*(1-stepBack);
  const wy = workerWalk > 0 && workerWalk < 1 ? Math.sin(workerWalk * Math.PI * 10) * -4 : 0;
  const reaching = t >= 8550 && t < 15300 || catchPiece ? 1 : 0;
  const artGone = between(t, 16000, 18300);
  const bannerSag = smooth(between(t, 13000, 14300));
  const screw = between(t, 12300, 13200);
  const fragment = between(t, 14000, 14700);
  const values = {
    '--progress': t / DURATION, '--opening': out(between(t, 100, 1800)),
    '--shake-x': `${shake * 4}px`, '--shake-y': `${shake * 1.8}px`,
    '--camera': 1 + .025 * smooth(between(t, 19000, 20900)) * (1 - smooth(between(t, 23800, 25300))),
    '--backdrop': 1 - artGone, '--lights': t >= 19000 && t < 24300 ? .2 : .8,
    '--set': 1 - between(t, 16400, 18300), '--banner-angle': `${-1 + bannerSag * 12 + between(t,15600,17700)*18}deg`,
    '--banner-y': `${height * .8 * between(t,15600,18000)}px`,
    '--column-angle': `${-3 * between(t,13700,15000) - 75 * between(t,15800,18000)}deg`,
    '--column-y': `${height * .5 * between(t,16000,18200)}px`,
    '--cabinet': between(t,7000,8000) * (1-between(t,17700,18900)),
    '--cabinet-y': `${16 * (1-between(t,7000,8000)) + height * .6 * cabinetFall}px`,
    '--cabinet-angle': `${cabinetFall * 22}deg`, '--curtain-pull': `${between(t,10300,11500)*9}%`,
    '--cord-y': `${between(t,10100,11300)*20}px`,
    '--jx':`${jx}px`, '--jy':`${jy}px`, '--jr':`${jr}deg`,
    '--head-r':`${t >= 12000 && t < 16000 ? -8 : dead ? 8 : 0}deg`,
    '--left-arm':`${knock*35}deg`, '--right-arm':`${dead?25:0}deg`,
    '--reaching':reaching, '--point-r':`${catchPiece ? -35 : -8 + between(t,10100,11300)*12}deg`,
    '--halo-r':`${-8 + between(t,12500,15500)*35}deg`,
    '--worker':t >= 24300 ? 1 : 0, '--wx':`${wx}px`, '--wy':`${wy}px`,
    '--wr':`${workerWalk>0&&workerWalk<1?Math.sin(workerWalk*Math.PI*10)*2:0}deg`,
    '--screw':t>=12300&&t<13400?1:0, '--screw-y':`${screw*height*.65}px`, '--screw-x':`${screw*20}px`, '--screw-r':`${screw*540}deg`,
    '--fragment':t>=14000&&t<16800?1:0, '--fragment-y':`${Math.min(fragment,.8)*height*(mobile?.3:.4)}px`, '--fragment-r':`${fragment*70}deg`,
    '--lintel':t>=15600?1:0, '--lintel-y':`${mix(-height*.5,height*.66,out(beam))}px`, '--lintel-x':`${-width*.12*beam}px`, '--lintel-r':`${beam*14}deg`,
    '--cloth':t>=16400?1:0, '--cloth-y':`${mix(-height*.7,height*.78,out(cloth))}px`, '--cloth-r':`${cloth*-26}deg`,
    '--wreck':smooth(between(t,17400,18900)), '--wreck-y':`${15*(1-between(t,17400,18900))}px`,
    '--dust':t>=16900&&t<19100?Math.sin(dust*Math.PI)*.85:0, '--dust-y':`${-dust*50}px`, '--dust-scale':1+dust*.5,
    '--post-y':`${height*(1-out(between(t,27000,28200)))}px`, '--post2-y':`${height*(1-out(between(t,27700,28900)))}px`,
    '--tape':smooth(between(t,28500,30000)), '--sign':between(t,29900,30300),
    '--sign-y':`${height*.75*(1-installSign)}px`, '--sign-r':`${9*(1-installSign)+installBounce-1}deg`,
    '--hammer':installing?1:0, '--hammer-r':`${installing?Math.sin((t-27000)/65)*27:-25}deg`,
    '--worker-reach':installing?1:0, '--worker-arm-r':`${installing?-10+Math.sin((t-27000)/65)*8:-8}deg`,
    '--box':1-smooth(between(t,27000,27600)), '--buttons':between(t,32500,33000),
    '--last-hand':t>=19000?1-between(t,22500,23600):0, '--hand-drop':`${between(t,22500,23600)*65}deg`,
    '--proscenium':1-between(t,16800,18400), '--proscenium-y':`${height*between(t,15900,18500)}px`,
    '--proscenium-r':`${between(t,15900,18500)*9}deg`, '--front-drop':`${height*between(t,16200,18300)}px`, '--front-r':`${between(t,16200,18300)*12}deg`
  };
  let line='', aside='', speaker='', act='ACT I', title='A DIVINE OCCASION';
  if(t>=1200&&t<6800){speaker='JESUS';line='Buon compleanno, Silvio!';aside=t>=3500?'33 today. Both of us.':'';}
  if(t>=6800&&t<12000){speaker='JESUS';line=t<10100?'I prepared something miraculous…':'Behold!';aside=t<10100?'A surprise of biblical proportions.':'';}
  if(t>=12000&&t<15000){act='ACT II';title='A SMALL TECHNICAL DIFFICULTY';speaker='JESUS';line=t<13700?'Did you hear that?':'I’ve got it. Everything is—';}
  if(t>=15000&&t<19000){act='ACT II';title='A SMALL TECHNICAL DIFFICULTY';}
  if(t>=19000&&t<24300){act='ACT III';title='THE FINAL BIRTHDAY WISH';speaker='JESUS';line='I hope you outlive me, Silvio…';}
  if(t>=24300&&t<27000){act='ACT IV';title='GERMAN ENGINEERING';speaker='BAULEITER';line=t<25700?'Mein Gott…':'Das ist eine Baustelle.';}
  if(t>=27000&&t<DURATION){act='ACT IV';title='GERMAN ENGINEERING';speaker='BAULEITER';line=t<30000?'Erst mal absichern.':'Wunder dauern etwas länger.';aside=t>=30000?'Even miracles take a little longer.':'';}
  if(t>=DURATION){act='XXXIII';title='TO BE CONTINUED';}
  return {time:t,phase,dead,values,line,aside,speaker,act,title,
    jesusFace:dead?2:t>=5700&&t<6250?1:0,
    workerFace:t<27000?1:t>=32000?2:0};
}

export const SOUND_CUES = [
  [1200,'chime'],[6950,'steps'],[7600,'steps'],[8600,'reveal'],[12300,'screw'],
  [13050,'shake'],[14000,'crack'],[14500,'shake'],[15300,'crash'],[16900,'impact'],
  [19000,'silence'],[24500,'steps'],[25000,'steps'],[25500,'steps'],[26000,'steps'],
  [27400,'hammer'],[28200,'hammer'],[28900,'tape'],[30400,'hammer'],[31100,'hammer'],[32000,'chime']
];
