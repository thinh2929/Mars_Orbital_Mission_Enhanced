/* Mars Orbital Mission v3 — UX, retries, trajectory animation and science fixes.
 * Loaded after game.js and enhancements.js; retains original simulation physics.
 */
'use strict';
const v3Clone=x=>JSON.parse(JSON.stringify(x));
const v3Settings={attempts:{},checkpoint:null,motion:{},lastPhase:null};
function v3Randomize(p){
 const jitter=(value,min,max,step,lower)=>{let n=value;for(let i=0;i<10&&Math.abs(n-value)<(lower||step);i++)n=cap(value+Math.round((Math.random()*2-1)*Math.max(step*4,(max-min)*.20)/step)*step,min,max);return n;};
 const l=state.launch,o=state.orbit,t=state.tmi,c=state.capture,cr=state.cruise;
 if(p==='launch'){l.throttle=jitter(88,65,100,1,5);l.guidance=jitter(0,-25,25,1,4);l.roll=jitter(0,-20,20,1,3);}
 if(p==='parking'){o.burn=jitter(335,250,420,1,12);o.angle=jitter(0,-15,15,1,3);}
 if(p==='tmi'){t.burn=jitter(3150,2920,3380,10,40);t.angle=jitter(0,-12,12,1,3);}
 if(p==='cruise'){const target=cruiseTarget();cr.along=jitter(target.along,-25,35,1,7);cr.lateral=jitter(target.lateral,-20,20,1,5);}
 if(p==='capture'){c.burn=jitter(940,760,1130,5,25);c.angle=jitter(0,-12,12,1,3);c.peri=jitter(150,115,200,1,10);c.trim=jitter(280,160,400,1,15);c.incl=jitter(93,86,100,1,2);}
}
function v3Checkpoint(){if(state.phase==='end')return;const snapshot=v3Clone(state);delete snapshot.v3checkpoint;v3Settings.checkpoint={phase:state.phase,state:snapshot};}
const v3BasePhase=phase;
phase=function(next,msg){v3BasePhase(next,msg);if(next==='end')return;v3Randomize(next);v3Settings.motion[next]=0;v3Checkpoint();render();save();};
const v3BaseReset=reset;
reset=function(){soundEnabled=true;$('audioBtn').textContent='♫';v3Settings.attempts={};v3Settings.motion={};v3Settings.checkpoint=null;v3BaseReset();v3Checkpoint();};
const v3BaseLoad=load;
load=function(){const ok=v3BaseLoad();if(ok){state.v3attempts??={};v3Settings.attempts=state.v3attempts;if(!v3Settings.checkpoint||v3Settings.checkpoint.phase!==state.phase)v3Checkpoint();}return ok;};
const v3BaseFail=fail;
fail=function(reason){if(state.mission.result)return;const p=state.phase;v3Settings.attempts[p]=(v3Settings.attempts[p]||0)+1;state.v3attempts=v3Settings.attempts;v3BaseFail(reason);};
function v3Retry(){const cp=v3Settings.checkpoint,failed=state.mission.failurePhase;if(!cp||cp.phase!==failed){warn('Không còn checkpoint hợp lệ. Hãy bắt đầu nhiệm vụ mới.');return;}
 const attempts={...v3Settings.attempts};state=v3Clone(cp.state);state.v3attempts=attempts;state.mission={result:null,reason:'',score:0,ending:null,failurePhase:null};v3Randomize(state.phase);v3Settings.motion[state.phase]=0;closeModal();v3Checkpoint();log(`Thử lại ${PHASES.find(p=>p.id===state.phase)?.name||state.phase}, lần ${attempts[state.phase]+1}. Checkpoint đã khôi phục.`,'good');render();save();}
const v3BaseShowEnd=showEnd;
showEnd=function(){v3BaseShowEnd();if(state.mission.result==='failure'){
 const actions=$('modal').querySelector('.modal-actions');if(actions){const btn=document.createElement('button');btn.className='btn-primary';btn.id='retryStage';btn.textContent='↻ CHƠI LẠI GIAI ĐOẠN NÀY';btn.disabled=!v3Settings.checkpoint||v3Settings.checkpoint.phase!==state.mission.failurePhase;btn.onclick=v3Retry;actions.prepend(btn);}
 }};
const v3BaseRenderControl=renderControl;
renderControl=function(){v3BaseRenderControl();const n=v3Settings.attempts[state.phase]||0;
 if(n<5){document.querySelectorAll('#controlPanel .hint-line').forEach(h=>{if(!h.closest('.mission-electrical')&&!/ĐỘ CAO|MAX Q|Lưu trữ|Đang chọn|Điện hiện thời/.test(h.textContent))h.classList.add('guidance-locked');});}
 else if(state.phase!=='end')$('controlPanel').insertAdjacentHTML('beforeend',`<div class="hint-unlocked">◉ GỢI Ý MỞ KHÓA — bạn đã thất bại ${n} lần ở giai đoạn này.</div>`);
};
const v3BaseExecute=executeAction;
executeAction=function(action){
 if(action.startsWith('target-')){const n=Number(action.slice(7));if(!Number.isInteger(n)||n<0||n>3)return;state.sat.imageTarget=n;renderControl();save();return;}
 if(action==='to-cruise'){v3BaseExecute(action);if(state.phase==='cruise'){v3Randomize('cruise');v3Checkpoint();render();}return;}
 if(action==='radar-toggle'||action==='crism-toggle'){
   // Switching equipment consumes a small amount of battery; active equipment
   // additionally draws energy over time, never produces battery on toggling.
   const s=state.sat;s.batteryWh=Math.max(0,(s.batteryWh||0)-12);
 }
 if(action==='take-photo'){
   const s=state.sat,sz=[3.5,1.7,.6][state.slot[0]];
   if(usedMemory()+sz>build().opts[4].memory+1e-6){warn(`Bộ nhớ không đủ: còn ${(build().opts[4].memory-usedMemory()).toFixed(1)} GB. Truyền ảnh hoặc chọn thiết bị nhẹ hơn.`);return;}
   if(s.images.length>=8){
     // Same operational checks as the base science action, but no fixed cap.
     const opts=build().opts,draw=opts[0].power-(state.slot[0]===0&&s.crismActive===false?180:0)+(s.radarActive?opts[1].power:0)+300;
     if(!s.solar){warn('Phải triển khai cánh pin trước khi chụp ảnh.');return;}
     if(state.slot[0]===0&&s.crismActive!==false){warn('Tắt CRISM để chụp HiRISE ổn định.');return;}
     if(draw>build().gen){warn('Quá tải nguồn: hãy tắt thiết bị không cần thiết.');return;}
     const cost=[460,255,95][state.slot[0]];
     if(s.batteryWh<cost){warn('Không đủ điện để chụp.');return;}
     const id=Math.max(0,...s.images.map(x=>x.id))+1;
     s.images.push({id,region:s.imageTarget,size:sz,sent:0});
     s.batteryWh-=cost;
     log(`CAMERA exposure ${id} • REGION ${s.imageTarget+1} • ${sz} GB.`,'good');
     toast(`CAPTURE ${id} COMPLETE`);render();save();return;
   }
 }
 v3BaseExecute(action);
 if(['ignite','stage-sep','centaur-ignite','fairing-sep','detach'].includes(action))v3SoundEffect(action);
 if(action==='tmi-exec'&&state.tmi.complete)v3Settings.motion.tmi=performance.now();
 if(action==='cruise-exec'&&state.cruise.corrected)v3Settings.motion.cruise=performance.now();
};
// Stable success scoring incorporates science diversity and actual operational
// resources rather than just three completed transmissions.
const v3BaseSuccess=success;
success=function(){v3BaseSuccess();if(state.mission.result!=='success')return;
 const distinct=new Set(state.sat.returned.map(x=>x.region)).size;
 const value=state.sat.returned.reduce((sum,x)=>sum+[1.1,1.0,1.25,1.4][x.region],0);
 state.mission.score=Math.round(cap(state.mission.score+(distinct-1)*2.5+Math.min(8,value),0,100));
 if($('modal').classList.contains('hidden')===false)showEnd();save();};
// Stage 8 is no longer limited by an arbitrary 8-image count; only storage
// limits how many images can be captured. Science target selection stays stable.
const v3BaseScienceControls=scienceControls;
scienceControls=function(){return v3BaseScienceControls();};
// User-initiated WebAudio effects (no external media dependency).
function v3SoundEffect(which){if(!soundEnabled)return;try{
 audioContext??=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();
 const ctxA=audioContext,now=ctxA.currentTime;
 const durations={ignite:2.2,'stage-sep':.50,'centaur-ignite':1.2,'fairing-sep':.45,detach:.64};
 const duration=durations[which]||.4;const osc=ctxA.createOscillator(),gain=ctxA.createGain();
 osc.type=which==='ignite'?'sawtooth':which==='centaur-ignite'?'triangle':'square';
 osc.frequency.setValueAtTime(which==='ignite'?45:which==='centaur-ignite'?110:270,now);
 osc.frequency.exponentialRampToValueAtTime(which==='ignite'?155:which==='centaur-ignite'?190:70,now+duration);
 gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(which==='ignite'?.095:.065,now+.06);
 gain.gain.exponentialRampToValueAtTime(.001,now+duration);
 osc.connect(gain);gain.connect(ctxA.destination);osc.start(now);osc.stop(now+duration);
 }catch(e){} }
const v3BasePlayTone=playTone;
playTone=function(freq=550,dur=.1){if(!soundEnabled)return;v3BasePlayTone(freq,dur);};
// Pad: the rocket visibly launches from a terrestrial ground installation,
// instead of a giant orbital Earth sphere.
drawLaunch=function(){
 const l=state.launch,p=cap(l.alt/101,0,1),sx=W*.23,sy=H*.81,tx=W*.79,ty=H*.20;
 const groundY=H*.87;
 let g=ctx.createLinearGradient(0,groundY,0,H);g.addColorStop(0,'#243443');g.addColorStop(1,'#0d1b27');ctx.fillStyle=g;ctx.fillRect(0,groundY,W,H-groundY);
 line(0,groundY,W,groundY,'#8a9aaa',2);
 // Flame trench, transport tower, crossbars, support platform.
 ctx.fillStyle='#253746';ctx.fillRect(sx-62,groundY-13,125,13);ctx.fillStyle='#a4b2b8';ctx.fillRect(sx-36,groundY-18,73,7);
 ctx.strokeStyle='#748e9e';ctx.lineWidth=3;line(sx-64,groundY-170,sx-64,groundY-13,'#7f94a3',4);
 for(let z=0;z<6;z++){const yy=groundY-24-z*24;line(sx-82,yy,sx-48,yy,'#627e90',2);line(sx-82,yy,sx-48,yy-24,'#3d6278',1.5);}
 if(p<.15){line(sx-63,groundY-85,sx-14,groundY-96,'#e1ae76',3);line(sx-64,groundY-125,sx-13,groundY-138,'#8499aa',2);}
 drawCurved(sx,sy,W*.37,H*.32,tx,ty,'#c5d5e068',2,[7,10]);
 const xy=(t,dev)=>({x:sx+(tx-sx)*t+Math.sin(t*Math.PI)*dev*3,y:sy+(ty-sy)*t-Math.sin(t*Math.PI)*H*.12});
 const pos=xy(p,l.deviation),angle=.10+p*.79+l.guidance*Math.PI/180+l.roll*Math.PI/180*.2;
 const size=Math.min(124,H*.27),tail={x:pos.x-Math.sin(angle)*size*.44,y:pos.y+Math.cos(angle)*size*.44};
 ctx.beginPath();ctx.strokeStyle='#86dec9';ctx.lineWidth=2.5;ctx.moveTo(sx,sy);
 for(const v of (l.trail||[]).filter((v,i)=>i%3===0&&v.alt<l.alt-7)){const q=xy(cap(v.alt/101,0,1),v.dev);ctx.lineTo(q.x,q.y);}
 ctx.lineTo(tail.x,tail.y);ctx.stroke();drawRocket(pos.x,pos.y,size,angle,l.ignited&&!l.cutoff);
 textAt('GROUND LAUNCH COMPLEX • SLC-41',W*.48,H*.91,'#a7c5d1',11,'left','700');
 textAt('ALTITUDE '+l.alt.toFixed(1)+' KM',W*.64,H*.29,'#e3f0f5',15,'left','700');
 textAt('101 KM / MECO',W*.80,H*.15,'#dfedf4',11,'right','700');
};
// Correct Centaur upper stage: shorter cylindrical tank, RL-10 nozzle at rear,
// nose fairing on the forward end until the payload is detached.
function v3Centaur(x,y,size,angle=0,withMro=true){ctx.save();ctx.translate(x,y);ctx.rotate(angle);
 const h=size,w=size*.26;
 ctx.fillStyle='#d7e2df';ctx.fillRect(-w/2,-h*.39,w,h*.66);
 ctx.fillStyle='#8ca5ba';ctx.fillRect(-w*.55,h*.16,w*1.1,h*.13);
 ctx.fillStyle='#dfe6df';ctx.beginPath();ctx.moveTo(-w/2,-h*.39);ctx.lineTo(0,-h*.63);ctx.lineTo(w/2,-h*.39);ctx.closePath();ctx.fill();
 ctx.fillStyle='#3e5166';ctx.beginPath();ctx.moveTo(-w*.28,h*.29);ctx.lineTo(-w*.42,h*.48);ctx.lineTo(w*.42,h*.48);ctx.lineTo(w*.28,h*.29);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#6b8da1';ctx.lineWidth=2;line(-w*.55,-h*.08,w*.55,-h*.08,'#66889a',2);
 if(state.sep.centaur&&!state.tmi.complete){ctx.fillStyle='#faab68aa';ctx.beginPath();ctx.moveTo(-w*.22,h*.48);ctx.lineTo(0,h*.84+Math.sin(time*17)*h*.03);ctx.lineTo(w*.22,h*.48);ctx.fill();}
 ctx.restore();}
drawSeparation=function(){
 planet(W*.12,H*1.15,Math.min(W,H)*.30,'earth');
 drawCurved(W*.23,H*.82,W*.42,H*.26,W*.83,H*.24,'#bad2d075',2,[7,9]);
 const x=W*.53,y=H*.46,v=state.sep,age=ageOf('stage');
 v3Centaur(x,y,Math.min(H*.38,180),.72,true);
 if(v.stage){const z=Math.min(4,age);drawRocket(x-48-z*23,y+70+z*z*11,Math.min(115,H*.25),1.35+z*.24,false);}
 if(v.fairing){const q=Math.min(3,ageOf('fairing'));drawSprite(sprites.fair1,x+32+q*24,y-52+q*12,36,85,-.6-q*.18);drawSprite(sprites.fair2,x+60+q*22,y-55+q*18,36,85,.8+q*.15);}
 textAt('CENTAUR RL-10 • '+(v.centaur?'IGNITED':'STANDBY'),W*.71,H*.28,'#e0e9ed',12,'center','700');
 textAt('STAGE 1 '+(v.stage?'RELEASED':'ATTACHED'),W*.3,H*.83,'#9fc9cf',11);
};
function v3Bezier(a,b,c,d,u){const t=1-u;return {x:t*t*t*a.x+3*t*t*u*b.x+3*t*u*u*c.x+u*u*u*d.x,y:t*t*t*a.y+3*t*t*u*b.y+3*t*u*u*c.y+u*u*u*d.y};}
function v3Trail(a,b,c,d,progress){ctx.beginPath();ctx.moveTo(a.x,a.y);for(let i=1;i<=65;i++){const t=progress*i/65,p=v3Bezier(a,b,c,d,t);ctx.lineTo(p.x,p.y)}ctx.strokeStyle='#74ead4';ctx.lineWidth=2.5;ctx.setLineDash([]);ctx.stroke();}
function v3PathScene(stage){
 const isT=stage==='tmi',ex={x:W*.17,y:H*.69},mars={x:W*.86,y:H*.43};
 planet(ex.x,ex.y,Math.min(W,H)*.12,'earth');planet(mars.x,mars.y,Math.min(W,H)*.13,'mars');
 const a={x:ex.x+Math.min(W,H)*.10,y:ex.y-Math.min(W,H)*.06},d={x:mars.x-Math.min(W,H)*.12,y:mars.y-Math.min(W,H)*.06};
 const b={x:W*.37,y:H*.16},c={x:W*.65,y:H*.13};
 // Desired orbit drawn behind spacecraft; actual path is independently traced.
 ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.bezierCurveTo(b.x,b.y,c.x,c.y,d.x,d.y);ctx.setLineDash([8,9]);ctx.strokeStyle='#a8b9c870';ctx.lineWidth=1.6;ctx.stroke();ctx.setLineDash([]);
 const e=isT?state.tmi:state.cruise,active=isT?e.complete:e.corrected;
 const start=v3Settings.motion[stage];const progress=active?cap(start?(performance.now()-start)/6500:0,0,1):0;
 const deviation=isT?(e.angle||0)*2:(e.lateral-cruiseTarget().lateral)*2;
 const b2={...b,y:b.y+deviation},c2={...c,y:c.y+deviation*.6};
 if(active)v3Trail(a,b2,c2,d,progress);
 const hovering=!active?Math.sin(time*2.8)*5:0;
 const pos=active?v3Bezier(a,b2,c2,d,progress):{x:a.x+18,y:a.y-14+hovering};
 if(isT){
  if(!e.detached){v3Centaur(pos.x,pos.y,Math.min(H*.25,125),1.0);}
  else{
    // Show exactly ONE MRO sprite, separate from its discarded Centaur.
    drawSatellite(pos.x,pos.y,Math.min(H*.19,92),.22);
    if(progress<.95)v3Centaur(pos.x-56-36*progress,pos.y+34+55*progress,Math.min(H*.16,70),1.15);
  }
 }else drawSatellite(pos.x,pos.y,Math.min(H*.19,94),.1+progress*.25);
 textAt(isT?'CENTAUR → MARS TRANSFER':'MIDCOURSE NAVIGATION',W*.52,H*.20,'#dcecf2',12,'center','700');
 textAt(active?`TRANSFER ${Math.round(progress*100)}%`:'AWAITING TRAJECTORY CONFIRMATION',W*.50,H*.85,'#8de2cf',11,'center','700');
}
drawTMI=function(){v3PathScene('tmi');};
drawCruise=function(){v3PathScene('cruise');};
// Persist checkpoint across reload, without recursively copying the snapshot.
const v3OriginalSave=save;
save=function(){try{if(state.started){state.v3attempts=v3Settings.attempts;localStorage.setItem('mars-mission-v3-checkpoint',JSON.stringify(v3Settings.checkpoint));}}catch(e){}v3OriginalSave();};
try{const previous=localStorage.getItem('mars-mission-v3-checkpoint');if(previous)v3Settings.checkpoint=JSON.parse(previous);}catch(e){}
