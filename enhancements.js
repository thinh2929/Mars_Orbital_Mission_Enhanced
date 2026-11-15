/* Mars Orbital Mission — Gameplay & presentation patch v2.0
 * Preserves the original eight-stage game and its controls while adding
 * physics-coupled ascent, energy, branch endings, mechanics and full-window layout.
 */
'use strict';
const launchFX={ignition:0,stage:0,fairing:0,detach:0,solar:0,antenna:0};
let lastFXFrame=performance.now();
const baseExecuteAction=executeAction, baseFail=fail, baseSuccess=success,
      baseRenderTelemetry=renderTelemetry, baseRenderSafety=renderSafety,
      baseDrawAssembly=drawAssembly, basePlanet=planet;

function batterySetup(){
  const s=state.sat,b=build();
  s.batteryMaxWh=b.opts[2].capacity*28;
  s.batteryWh=cap(Number.isFinite(s.batteryWh)?s.batteryWh:s.batteryMaxWh,0,s.batteryMaxWh);
  s.powerHealth??=1;s.powered??=true;
  state.launch.stageFuel??=Math.min(252000,b.launcher.fullMass*.77);
  state.launch.mass??=b.launcher.fullMass;
  state.launch.trail??=[];
}
function powerFraction(){const s=state.sat;return (s.batteryWh||0)/Math.max(1,s.batteryMaxWh||5600)}
function inSunlight(){return !['capture','science'].includes(state.phase)||Math.sin(time*.40)>.0}
function availablePower(){const s=state.sat,b=build();return s.solar&&inSunlight()?Math.round(b.gen*(s.powerHealth??1)):0}
function powerDraw(){const s=state.sat,b=build();return 160+(s.antenna?75:0)+(state.phase==='science'&&s.radarActive?Math.min(210,b.opts[1].power):0)}
function spendEnergy(amount,activity){
  const s=state.sat;
  if(!s.powered){fail('Vệ tinh mất điện hoàn toàn và không thể duy trì các hệ thống thiết yếu.');return false;}
  if(s.batteryWh<amount){warn(`Năng lượng dự trữ không đủ cho ${activity}: cần ${Math.round(amount)} Wh, còn ${Math.round(s.batteryWh)} Wh. Chờ cánh pin sạc.`);return false;}
  s.batteryWh=Math.max(0,s.batteryWh-amount);return true;
}
function powerTick(dt){
  if(!state.started||state.mission.result||!['cruise','capture','science'].includes(state.phase))return;
  const s=state.sat;
  batterySetup();
  const simHours=dt*90/3600; // compressed operations timeline; not real transit duration
  const generation=availablePower();
  s.batteryWh=cap(s.batteryWh+(generation-powerDraw())*simHours,0,s.batteryMaxWh);
  if(s.batteryWh<=0.1){s.powered=false;fail('Mất nguồn điện: pin cạn trước khi vệ tinh có thể sạc lại, bộ điều khiển và máy phát tín hiệu ngừng hoạt động.');}
}
function endingDetails(){
  const m=state.mission,reason=m.reason||'';
  if(m.result==='success'){
    const score=m.score,distinct=new Set(state.sat.returned.map(r=>r.region)).size;
    if(score>=90&&distinct>=4)return {id:'discovery',headline:'GOOD ENDING · SCIENTIFIC DISCOVERY',name:'Đột phá khoa học',badge:'EXCEPTIONAL',analysis:'Tàu vào quỹ đạo chính xác, tiết kiệm nguồn lực và gửi ảnh từ bốn vùng địa hình. Dữ liệu khoa học vượt chỉ tiêu ban đầu.',advice:'Bạn đã tối ưu hóa thiết kế, quá trình bay và sản lượng khoa học.'};
    if(score>=78)return {id:'nominal',headline:'GOOD ENDING · MISSION ACCOMPLISHED',name:'Nhiệm vụ hoàn thành',badge:'MISSION SUCCESS',analysis:'Các hệ thống chính còn hoạt động, vệ tinh đã ổn định tại quỹ đạo yêu cầu và gửi đủ ảnh về Trái Đất.',advice:'Có thể cải thiện độ chính xác quỹ đạo, nhiên liệu dự phòng và phạm vi quan sát.'};
    return {id:'survival',headline:'GOOD ENDING · NARROW SUCCESS',name:'Thành công trong gang tấc',badge:'MINIMUM OBJECTIVES MET',analysis:'Đạt mục tiêu truyền ảnh nhưng còn ít nhiên liệu hoặc sai số quỹ đạo đáng kể. Các mục tiêu tối thiểu được xác nhận.',advice:'Thử quỹ đạo chính xác hơn và chọn linh kiện phù hợp để tăng điểm.'};
  }
  const checks=[
    [/lực đẩy|TWR|bệ phóng|rời bệ/i,'LAUNCH ABORT','TWR thấp hoặc sai chế độ động cơ khiến tên lửa không thể cất cánh.','Chọn tên lửa phù hợp với tải trọng và tăng throttle đủ để TWR > 1.'],
    [/Max Q|khung tên lửa|khí động|quá tải/i,'STRUCTURAL BREAKUP','Tải trọng khí động vượt khả năng kết cấu, có thể do lệch pitch/roll hoặc lực đẩy quá mạnh tại vùng khí quyển đặc.','Duy trì pitch/roll gần giá trị hướng dẫn và giảm throttle quanh Max Q.'],
    [/hành lang phóng|lệch quá xa|Sai hướng phóng|rời hành lang/i,'ASCENT GUIDANCE LOSS','Lực đẩy, nhiên liệu hoặc hướng điều khiển không cho phép đạt hành lang phóng an toàn.','Giữ lực đẩy đủ cao, chọn phương tiện phù hợp và hạn chế lệch hướng.'],
    [/tầng trên|CENTAUR|TMI|Trans-Mars|quỹ đạo chờ/i,'EARTH DEPARTURE FAILURE','Đốt tầng trên không đủ hoặc vượt giới hạn, khiến quỹ đạo chờ/chuyển tiếp không đạt điều kiện.','Kiểm tra dự trữ nhiên liệu Centaur và chọn Δv/góc đốt gần hướng dẫn.'],
    [/bay lệch|điểm tiếp cận|lướt qua sao hỏa/i,'MARS FLYBY','Sai số hiệu chỉnh hành trình quá lớn; tàu đi ngang qua Sao Hỏa mà không thể bắt vào quỹ đạo.','Giảm sai lệch along-track/cross-track; chú ý nhiên liệu cho các hiệu chỉnh tiếp theo.'],
    [/Nhiệt độ|hãm khí quyển|aerobraking|periapsis/i,'ATMOSPHERIC OVERHEAT','Quỹ đạo hãm khí quyển quá thấp làm tăng tải nhiệt, đặc biệt với cấu hình cánh pin lớn.','Sử dụng periapsis an toàn (thường 145–160 km trong game), hoặc thay đổi cấu hình năng lượng.'],
    [/nguồn điện|mất điện|pin cạn|năng lượng/i,'SPACECRAFT BLACKOUT','Không có năng lượng duy trì các hệ thống sống còn. Thiếu điện có thể do chưa mở cánh pin, vùng tối hoặc linh kiện quá tải.','Triển khai cánh pin ngay sau tách MRO, giữ pin dự phòng và cân bằng tiêu thụ điện.'],
    [/nhiên liệu|propellant|cạn/i,'PROPELLANT EXHAUSTION','Nhiên liệu đã không đủ để thực hiện phần Δv yêu cầu, nên vệ tinh không thể tiếp tục nhiệm vụ.','Chọn bình chứa phù hợp, hạn chế burn không cần thiết và dùng aerobraking hiệu quả.'],
    [/sai mục tiêu|quỹ đạo sai|quỹ đạo khoa học/i,'ORBITAL INSERTION ERROR','Độ cao hoặc độ nghiêng quỹ đạo cuối vượt giới hạn nghiệm thu của nhiệm vụ.','Đối chiếu Δv circularization với viễn điểm hiện tại và chọn nghiêng gần 93°.'],
    [/sao hỏa|Mars Orbit|MOI|bắt vào quỹ đạo/i,'MARS CAPTURE FAILURE','Đốt hãm tốc sai khiến tàu không bị Sao Hỏa giữ lại hoặc đi vào vùng quỹ đạo nguy hiểm.','Dành đủ nhiên liệu cho MOI và giữ Δv, góc đốt trong hành lang an toàn.'],
    [/ăng.ten|tín hiệu|truyền dữ liệu/i,'COMMUNICATIONS LOSS','Vệ tinh không thể gửi dữ liệu về Trái Đất dù đã đến được Sao Hỏa.','Kiểm tra ăng-ten, nguồn điện và xung đột điện từ radar.']
  ];
  for(const [pattern,id,analysis,advice] of checks){if(pattern.test(reason))return {id,headline:'BAD ENDING · '+id,name:id,badge:'MISSION FAILURE',analysis,advice};}
  return {id:'mission-loss',headline:'BAD ENDING · MISSION LOSS',name:'Nhiệm vụ thất bại',badge:'SYSTEM FAILURE',analysis:'Một điều kiện bay hoặc vận hành thiết yếu không được thỏa mãn. Hệ thống đã chấm dứt nhiệm vụ.',advice:'Xem lại sự kiện cuối cùng, chọn cấu hình khác và kiểm tra các mốc an toàn.'};
}
fail=function(reason){
  if(state.mission.result)return;
  state.mission.failurePhase=state.phase;
  state.mission.ending=null;
  baseFail(reason);
};
success=function(){
  if(state.mission.result)return;
  baseSuccess();
};
showEnd=function(){
  const m=state.mission,good=m.result==='success',e=endingDetails(),c=state.capture,s=state.sat,b=build();
  m.ending=e.id;
  const stageName=PHASES.find(p=>p.id===m.failurePhase)?.name||'Nhiệm vụ Sao Hỏa';
  const metrics=`<div class="mission-summary">
   <div class="summary-cell"><small>ENDING</small><strong class="${good?'status-good':'status-bad'}">${escapeHTML(e.badge)}</strong></div>
   <div class="summary-cell"><small>QUỸ ĐẠO MARS</small><strong>${c.finalized?c.finalAlt.toFixed(1)+' km':'CHƯA ĐẠT'}</strong></div>
   <div class="summary-cell"><small>ẢNH ĐÃ NHẬN</small><strong>${s.returned.length} / 3</strong></div>
   <div class="summary-cell"><small>ĐIỂM NHIỆM VỤ</small><strong>${good?m.score+'/100':'—'}</strong></div>
  </div>`;
  const gallery=good?`<div class="eyebrow">SCIENCE DOWNLINK / MARS SURFACE</div><div class="gallery">${s.returned.slice(0,4).map(x=>`<figure><img src="${ASSETS['mars'+(x.region+1)]}" alt="Ảnh địa hình mô phỏng Sao Hỏa"><figcaption>IMAGE ${String(x.id).padStart(2,'0')} • REGION 0${x.region+1} • RECEIVED</figcaption></figure>`).join('')}</div>`:'';
  $('modal').className='modal';
  $('modal').innerHTML=`<div class="modal-card end-report ${good?'success':'failure'}">
  <div class="modal-topline">${escapeHTML(e.headline)}</div><h2>${escapeHTML(e.name)}</h2>
  <p class="end-intro">${good?'Chúc mừng: dữ liệu nghiên cứu đã được Trái Đất xác nhận.':'Nhiệm vụ đã dừng tại: '+escapeHTML(stageName)}</p>${metrics}
  ${!good?`<div class="alert-card bad"><strong>NGUYÊN NHÂN TRỰC TIẾP</strong><p>${escapeHTML(m.reason)}</p></div>`:''}
  <div class="end-analysis"><section><h3>${good?'VÌ SAO THÀNH CÔNG?':'PHÂN TÍCH SỰ CỐ'}</h3><p>${escapeHTML(e.analysis)}</p></section>
  <section><h3>${good?'CẢI THIỆN NHIỆM VỤ':'CÁCH TRÁNH THẤT BẠI'}</h3><p>${escapeHTML(e.advice)}</p></section></div>
  <div class="end-metrics"><span>FUEL MRO: <b>${Math.max(0,s.prop).toFixed(0)} kg</b></span><span>BATTERY: <b>${Math.round(s.batteryWh||0)} Wh</b></span><span>MAX Q: <b>${state.launch.maxQ.toFixed(1)} kPa</b></span><span>BUDGET: <b>$${money(b.cost)}</b></span></div>
  ${gallery}
  <div class="modal-actions"><button class="btn-secondary" id="reviewBtn">XEM LOG NHIỆM VỤ</button><button class="btn-primary" id="playAgain">CHƠI LẠI / THỬ LỰA CHỌN KHÁC</button></div></div>`;
  $('reviewBtn').onclick=closeModal;
  $('playAgain').onclick=()=>{closeModal();reset();batterySetup();render()};
  save();
};

function cruiseOps(){
  const s=state.sat;
  let warning=!s.solar?'<div class="alert-card bad"><b>POWER ALERT:</b> Cánh pin chưa triển khai. Dự trữ pin đang cạn dần.</div>':'';
  return `<div class="cruise-ops"><span class="eyebrow">EARLY DEPLOYMENT / MRO CONFIGURATION</span>
   <div class="task-row">${!s.solar?button('solar','MỞ CÁNH PIN SAU KHI TÁCH MRO'):''}${!s.antenna?button('antenna','TRIỂN KHAI ĂNG-TEN'):''}
   <span class="battery-chip">PIN ${Math.round(powerFraction()*100)}% • ${Math.round(s.batteryWh)} Wh</span></div>${warning}</div>`;
}
const priorCruiseControls=cruiseControls;
cruiseControls=function(){return cruiseOps()+priorCruiseControls();};
const priorCaptureControls=captureControls;
captureControls=function(){return `<div class="mission-electrical">● POWER BUS ${state.sat.powered?'ONLINE':'OFFLINE'} • BATTERY ${Math.round(powerFraction()*100)}% • SOLAR ${Math.round(availablePower())} W</div>`+priorCaptureControls();};
const priorScienceControls=scienceControls;
scienceControls=function(){const s=state.sat;return `<div class="mission-electrical">BATTERY ${Math.round(s.batteryWh)} / ${s.batteryMaxWh} Wh (${Math.round(powerFraction()*100)}%) • SOLAR ${availablePower()} W • HEALTH ${Math.round((s.powerHealth||1)*100)}%</div>`+priorScienceControls();};

executeAction=function(action){
  if(action==='preflight'){
    const b=build();if(b.weightOK&&b.priceOK&&b.fairingOK&&b.twr>1.05){
      state.sat.batteryMaxWh=b.opts[2].capacity*28;
      state.sat.batteryWh=state.sat.batteryMaxWh;
      state.sat.powerHealth=1;
      state.launch.stageFuel=Math.min(252000,b.launcher.fullMass*.77);
      state.launch.mass=b.launcher.fullMass;
      state.launch.trail=[];
    }
  }
  if(action==='park-exec'){
    // Centaur propellant expense uses the rocket equation with actual payload mass.
    const fuel=state.tmi.fuel;
    const need=Physics.stageFuelForDV(fuel,build().mass,state.orbit.burn);
    if(need>fuel-100){fail('Cạn nhiên liệu Centaur trong thao tác đốt quỹ đạo chờ.');return;}
    const o=state.orbit,e=Physics.parking(o.burn,o.angle);
    const dx=(state.launch.deviation||0)*.25 + Math.abs(state.launch.vx||0)/2500;
    o.peri=e.peri-dx;o.apo=e.apo+dx;
    state.tmi.fuel-=need;
    if(o.peri<115||o.apo>300||o.apo<130||Math.abs(o.angle)>8){fail(`Đốt quỹ đạo chờ sai: cận điểm ${o.peri.toFixed(0)} km, viễn điểm ${o.apo.toFixed(0)} km; Centaur không vào quỹ đạo ổn định.`);return;}
    o.confirmed=true;log(`Quỹ đạo chờ ${o.peri.toFixed(0)} × ${o.apo.toFixed(0)} km; Centaur đã tiêu hao ${need.toFixed(0)} kg nhiên liệu.`,'good');toast('PARKING ORBIT CONFIRMED');render();save();return;
  }
  if(action==='tmi-exec'){
    const t=state.tmi,need=Physics.stageFuelForDV(t.fuel,build().mass,t.burn);
    if(need>t.fuel-100){fail('Không đủ nhiên liệu Centaur để hoàn thành TMI.');return;}
    t.fuel-=need;
    if(Math.abs(t.burn-3150)>110||Math.abs(t.angle)>6){fail(`Trans-Mars Injection lệch quỹ đạo: Δv ${t.burn} m/s, hướng ${t.angle}°; hành lang Mars không đạt.`);return;}
    t.complete=true;log(`TMI COMPLETE • Δv ${t.burn} m/s • còn ${t.fuel.toFixed(0)} kg Centaur fuel.`,'good');toast('TRANS-MARS TRAJECTORY ACHIEVED');render();save();return;
  }
  if(action==='to-cruise'){
    if(!state.tmi.detached){warn('MRO chưa tách khỏi tầng Centaur.');return;}
    state.phase='cruise';log('MRO đã tách Centaur. Triển khai cánh pin và ăng-ten trước khi hiệu chỉnh hành trình.','good');render();save();return;
  }
  if(action==='cruise-exec'&&(!state.sat.solar||!state.sat.antenna)){
    warn('Cần mở cánh pin và ăng-ten để cấp điện và nhận lệnh hiệu chỉnh hành trình.');return;
  }
  if(['solar','antenna'].includes(action)){
    const s=state.sat;
    if(!['cruise','science'].includes(state.phase)){warn('Chỉ triển khai thiết bị sau khi MRO đã tách khỏi Centaur.');return;}
    if(!s.powered){fail('Không thể triển khai thiết bị vì máy tính điều khiển đã mất nguồn.');return;}
    if(action==='solar'){
      if(s.solar)return;
      s.solar=true;launchFX.solar=performance.now();log('Hai khớp cánh pin mở theo chu trình; nguồn sạc khả dụng.','good');toast('SOLAR ARRAYS DEPLOYED');
    }else{
      if(s.antenna)return;
      s.antenna=true;launchFX.antenna=performance.now();log('Bản lề ăng-ten khóa, high-gain dish hướng Trái Đất.','good');toast('HIGH-GAIN ANTENNA DEPLOYED');
    }
    render();save();return;
  }
  if(['take-photo','transmit','capture-exec','circularize','cruise-exec'].includes(action)&&!state.sat.powered){
    fail('Không thể thực hiện lệnh: máy tính và hệ thống điều khiển đã mất nguồn điện.');return;
  }
  if(action==='take-photo'){
    const opts=build().opts,s=state.sat;
    if(!s.solar){warn('Chưa triển khai cánh pin.');return;}
    if(!inSunlight()&&powerFraction()<.2){warn('Đang ở vùng tối Sao Hỏa; pin quá thấp để chụp ảnh.');return;}
    const effective=build().gen*(s.powerHealth??1);
    const draw=opts[0].power-(state.slot[0]===0&&s.crismActive===false?180:0)+(s.radarActive?opts[1].power:0)+300;
    if(draw>effective){warn(`Nguồn cấp suy giảm: cần ${Math.round(draw)} W nhưng cánh pin chỉ còn ${Math.round(effective)} W; hãy giảm thiết bị hoạt động.`);return;}
    const cost=[460,255,95][state.slot[0]];
    if(s.batteryWh<cost){warn(`Không đủ điện để chụp: cần ${cost} Wh, còn ${Math.round(s.batteryWh)} Wh.`);return;}
    const before=s.images.length;
    baseExecuteAction(action);
    if(s.images.length>before){s.batteryWh-=cost;log(`Hệ thống ảnh sử dụng ${cost} Wh; battery ${Math.round(s.batteryWh)} Wh.`);render();}
    return;
  }
  if(action==='transmit'){
    if(!state.sat.antenna){warn('Chưa mở ăng-ten cao ích.');return;}
    if(state.sat.batteryWh<100){warn('Pin quá thấp để truyền dữ liệu. Hãy đợi cánh pin sạc.');return;}
    const sentBefore=state.sat.images.reduce((a,x)=>a+(x.sent||0),0);
    baseExecuteAction(action);
    const sentAfter=state.sat.images.reduce((a,x)=>a+(x.sent||0),0);
    state.sat.batteryWh=cap(state.sat.batteryWh-(sentAfter-sentBefore)*38,0,state.sat.batteryMaxWh);
    if(state.mission.result)showEnd();else render();save();return;
  }
  baseExecuteAction(action);
  if(action==='ignite'&&state.launch.ignited)launchFX.ignition=performance.now();
  if(action==='stage-sep'&&state.sep.stage)launchFX.stage=performance.now();
  if(action==='fairing-sep'&&state.sep.fairing)launchFX.fairing=performance.now();
  if(action==='detach'&&state.tmi.detached)launchFX.detach=performance.now();
};

function enhancedAscent(dt){
  if(!state.started||state.phase!=='launch'||!state.launch.ignited||state.launch.cutoff)return;
  const l=state.launch,vehicle=build().launcher;
  const d=dt*11.5;
  const oldT=l.t;
  const stepCount=Math.max(1,Math.ceil(d/.22)),sub=d/stepCount;
  for(let k=0;k<stepCount;k++){
    const next=Physics.ascentStep(l,vehicle,l.throttle,l.guidance,l.roll,sub);
    Object.assign(l,next);l.t+=sub;
    l.maxQ=Math.max(l.maxQ,l.q);
    l.deviation+=sub*(Math.abs(l.guidance)*.004+Math.abs(l.roll)*.0025+(state.slot[3]===2?.006:0));
    if(l.q>45)l.health-=sub*(l.q-45)*.27;
    if(l.alt<.04&&l.t>14&&l.vy<0){fail('Tên lửa không rời được bệ phóng: tỷ số lực đẩy/trọng lượng quá thấp.');return;}
    if(l.health<55){fail(`Max Q đạt ${l.maxQ.toFixed(1)} kPa: thân tên lửa chịu tải khí động vượt giới hạn và bị phá hủy.`);return;}
    if(l.deviation>18){fail(`Sai hướng phóng ${l.deviation.toFixed(1)} units: tên lửa rời hành lang an toàn.`);return;}
    if(l.stageFuel<=0&&l.alt<100.8){fail(`Tầng 1 cạn nhiên liệu tại ${l.alt.toFixed(1)} km, chưa đạt độ cao tách tầng 101 km.`);return;}
    if(l.alt>=100.8){l.alt=101;l.cutoff=true;l.ignited=false;log('MECO tại 101 km; velocity '+l.vel.toFixed(2)+' km/s • engine cutoff.','good');toast('MECO / STAGE 1 CUTOFF');render();return;}
    if(l.trail.length===0||l.alt-l.trail[l.trail.length-1].alt>.32){l.trail.push({alt:l.alt,downrange:l.downrange,dev:l.deviation});if(l.trail.length>350)l.trail.shift();}
  }
  if(Math.floor(l.t/15)!==Math.floor(oldT/15))render();
}
updateSim=enhancedAscent;

renderTelemetry=function(){
  baseRenderTelemetry();
  if(['assembly','end'].includes(state.phase))return;
  const s=state.sat;
  $('telemetry').insertAdjacentHTML('beforeend',`<div class="telemetry-item" style="grid-column:1/-1"><label>BATTERY / ENERGY STORAGE</label>
  <strong>${Math.round(s.batteryWh||0)} <small>Wh</small></strong><div class="meter"><i style="width:${Math.round(powerFraction()*100)}%;background:${powerFraction()<.22?'#f07975':'#7de4cc'}"></i></div>
  <small>${Math.round(powerFraction()*100)}% • SOLAR ${availablePower()} W • ${s.powered?'BUS ONLINE':'BLACKOUT'}</small></div>`);
};
renderSafety=function(){baseRenderSafety();if(state.sat.powered===false)$('safetyPanel').insertAdjacentHTML('beforeend','<div class="alert-card bad">POWER BUS OFFLINE • NHIỆM VỤ KHÔNG THỂ TIẾP TỤC</div>');};

planet=function(x,y,r,type='mars'){
  if(r<=1)return;
  const renderer=window.NASAPlanetRenderer;
  if(!renderer?.render(type,time*(type==='earth'?.10:.074)+1.1)){basePlanet(x,y,r,type);return;}
  ctx.save();const rad=r*1.105;
  ctx.drawImage(renderer.canvas,x-rad,y-rad,rad*2,rad*2);
  ctx.strokeStyle=type==='mars'?'#dc815334':'#9dcef044';ctx.lineWidth=1.2;
  ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);ctx.stroke();
  ctx.restore();
};

// Mechanical satellite: actual custom solar-array spans and deploy state,
// with the original user-provided MRO central bus texture.
drawSatellite=function(x,y,size=124,angle=0,alpha=1){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=alpha;
  const arraySpan=[1,.76,1.18][state.slot[2]];
  let deploy=state.sat.solar?1:.12;
  if(state.phase==='assembly')deploy=1;
  if(state.phase==='tmi'&&!state.tmi.detached)deploy=.10;
  const arrW=size*.50*arraySpan*deploy,arrH=size*.25;
  for(const side of [-1,1]){
    const start=side*size*.16;
    ctx.strokeStyle='#9ab6b7';ctx.lineWidth=Math.max(1,size*.012);
    ctx.beginPath();ctx.moveTo(start,0);ctx.lineTo(start+side*arrW,0);ctx.stroke();
    const left=side>0?start:start-arrW;
    ctx.fillStyle='#123a59';ctx.fillRect(left,-arrH*.5,arrW,arrH);
    ctx.strokeStyle='#7dbbcb';ctx.lineWidth=1;ctx.strokeRect(left,-arrH*.5,arrW,arrH);
    ctx.strokeStyle='#568eaa';
    for(let i=1;i<4;i++){const gx=left+i*arrW/4;ctx.beginPath();ctx.moveTo(gx,-arrH*.5);ctx.lineTo(gx,arrH*.5);ctx.stroke()}
  }
  const im=sprites.mroN;
  if(im?.naturalWidth){ctx.drawImage(im,192,136,133,188,-size*.20,-size*.35,size*.40,size*.70)}
  else{ctx.fillStyle='#c7b8a1';ctx.fillRect(-size*.15,-size*.2,size*.30,size*.40)}
  if(state.sat.antenna||state.phase==='assembly'){
    const antennaSize=[.17,.125,.095][state.slot[4]]*size;
    ctx.fillStyle='#d2c6a9';ctx.strokeStyle='#40576b';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.ellipse(0,-size*.19,antennaSize,antennaSize*.57,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#1b2736';ctx.beginPath();ctx.arc(0,-size*.19,Math.max(1,size*.015),0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
};

drawAssembly=function(){
  const b=build(),cx=W*.46,cy=H*.54;
  ctx.strokeStyle='#6b9fbd30';ctx.lineWidth=1;ctx.setLineDash([5,8]);ctx.strokeRect(W*.19,H*.25,W*.52,H*.52);ctx.setLineDash([]);
  drawSatellite(cx,cy,Math.min(W*.44,H*.73,345),.02);
  const x=W*.85,y=H*.53;
  drawRocket(x,y,Math.min(H*.6,255),0,false);
  ctx.strokeStyle='#a8b6c955';ctx.strokeRect(x-40,y-Math.min(H*.34,133),80,Math.min(H*.68,266));
  const rows=[['MASS',fmt(b.mass)+' kg'],['FOLDED WIDTH',b.stowedWidth.toFixed(2)+' m'],['SOLAR CAPACITY',fmt(b.gen)+' W'],['BATTERY',fmt(b.opts[2].capacity*28)+' Wh']];
  rows.forEach((a,i)=>{const y=H*.32+i*43;textAt(a[0],19,y,'#89a6b6',9,'left','700');textAt(a[1],19,y+17,'#d3e4ec',13,'left','700')});
  textAt('MRO / CONFIGURABLE SPACECRAFT',cx,H*.89,'#b4d5df',11,'center','700');
  textAt('LAUNCH VEHICLE',x,H*.88,'#a4c0ca',10,'center','700');
  textAt('STOWED FAIRING '+(b.fairingOK?'PASS':'FAIL'),W*.61,H*.25,b.fairingOK?'#88e1c8':'#fa9485',10,'right','700');
};

// Flight trail follows the rocket's *tail*, not its fuselage center.
drawLaunch=function(){
  const l=state.launch,p=cap(l.alt/101,0,1),er=Math.max(W*.56,H*.70),sx=W*.24,sy=H*.83;
  planet(W*.18,H+er*.52,er,'earth');
  const tipX=W*.80,tipY=H*.17;
  drawCurved(sx,sy,W*.35,H*.38,tipX,tipY,'#c7d9e861',2,[7,9]);
  const xy=(alt,dev)=>{const t=cap(alt/101,0,1);return {x:sx+(tipX-sx)*t+Math.sin(t*Math.PI)*dev*4,
    y:sy-(sy-tipY)*t-Math.sin(t*Math.PI)*H*.14};};
  const pos=xy(l.alt,l.deviation),angle=.2+p*.7+l.guidance*Math.PI/180+l.roll*Math.PI/180*.2;
  const size=Math.min(110,H*.24),tail={x:pos.x-Math.sin(angle)*size*.44,y:pos.y+Math.cos(angle)*size*.44};
  ctx.beginPath();ctx.strokeStyle='#80decce0';ctx.lineWidth=2.7;
  ctx.moveTo(sx,sy);
  const points=(l.trail||[]).filter((v,i)=>i%3===0&&v.alt<l.alt-7);
  for(const v of points){const t=xy(v.alt,v.dev);ctx.lineTo(t.x,t.y)}
  // The last segment is anchored to the engine nozzle behind the rocket.
  ctx.lineTo(tail.x,tail.y);ctx.stroke();
  if(l.ignited){ctx.strokeStyle='#faac6a70';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(tail.x,tail.y);ctx.lineTo(tail.x-Math.sin(angle)*25,tail.y+Math.cos(angle)*25);ctx.stroke();}
  drawRocket(pos.x,pos.y,size,angle,l.ignited&&!l.cutoff);
  textAt('ALTITUDE '+l.alt.toFixed(1)+' KM',W*.70,H*.26,'#e2edf4',15,'left','700');
  textAt('101 KM / MECO',W*.82,H*.13,'#deedf3',10,'right','700');
  line(W*.80,H*.16,W*.80,H*.82,'#97b3c355',1,[5,7]);
  dot(W*.80,H*.82-(H*.82-H*.16)*p,4,l.cutoff?'#6ef0cf':'#f2ab70');
  const meterX=W-16,top=H*.23,bottom=H*.79;
  line(meterX,top,meterX,bottom,'#7f9bab8f',5);line(meterX,bottom,meterX,bottom-(bottom-top)*p,'#83ddc9',5);
  textAt('TWR '+(l.twr||0).toFixed(2),W*.67,H*.87,'#a7dcd3',12,'left','700');
  textAt('MAX Q '+l.maxQ.toFixed(1)+' kPa',W*.67,H*.91,l.maxQ>45?'#f38c83':'#a7dcd3',11,'left','700');
};

function pyroFlash(x,y,age){if(age>1.1)return;ctx.save();ctx.globalAlpha=1-age/1.1;
  ctx.strokeStyle='#f9be76';ctx.lineWidth=2;for(let i=0;i<12;i++){
    const a=i*Math.PI*2/12,dist=age*50,xx=x+Math.cos(a)*dist,yy=y+Math.sin(a)*dist;
    line(xx,yy,xx+Math.cos(a)*(5+age*15),yy+Math.sin(a)*(5+age*15),'#ffc882',1.5);
  }ctx.restore();}
function ageOf(key){return launchFX[key]?Math.max(0,(performance.now()-launchFX[key])/1000):5;}
drawSeparation=function(){
  planet(W*.13,H*.91,Math.max(W*.27,H*.46),'earth');
  drawCurved(W*.20,H*.77,W*.41,H*.25,W*.81,H*.23,'#a9bfcb60',1.5,[6,9]);
  const x=W*.56,y=H*.46,s=state.sep,size=Math.min(195,H*.41);
  if(!s.stage){drawRocket(x,y,size,.70,false)}
  else{
    // Upper stage retains positive inertial velocity while the spent booster
    // tumbles away under a small lateral separation impulse and local gravity.
    ctx.save();ctx.translate(x,y);ctx.rotate(.70);
    drawSprite(sprites.centaur,0,0,size*.20,size*.76,0);
    if(!s.fairing){drawSprite(sprites.fair1,-size*.11,-size*.41,size*.13,size*.30,0);drawSprite(sprites.fair2,size*.11,-size*.41,size*.13,size*.30,0)}
    if(s.fairing)drawSatellite(0,-size*.51,size*.59,-.7);
    if(s.centaur){ctx.strokeStyle='#f4a56c';ctx.lineWidth=5;line(0,size*.35,0,size*.57+6*Math.sin(time*35),'#ffd19b8a',4)}
    ctx.restore();
    const t=Math.min(5,ageOf('stage')),g=15*t*t;
    drawSprite(sprites.booster,x-72-26*t,y+69+27*t+g,size*.20,size*.77,1.1+t*.45,Math.max(.18,1-t*.15));
    pyroFlash(x-25,y+size*.11,t);
    if(s.fairing){
      const f=Math.min(4,ageOf('fairing'));
      for(const side of [-1,1]){
        const fx=x+side*(size*.14+38*f+5*f*f),fy=y-size*.36+12*f*f;
        drawSprite(sprites[side<0?'fair1':'fair2'],fx,fy,size*.16,size*.36,side*(.26+f*.55),Math.max(.2,1-f*.14));
      }
      pyroFlash(x,y-size*.35,f);
    }
  }
  textAt('STAGE 1 • '+(s.stage?'JETTISONED':'ATTACHED'),W*.28,H*.84,s.stage?'#8de2d2':'#c5d7df',11);
  textAt('CENTAUR RL-10 • '+(s.centaur?'IGNITED':'STANDBY'),W*.73,H*.25,'#c7d6dc',10,'center','700');
  textAt('MECHANICAL SEPARATION / PYRO RELEASE',W*.53,H*.92,'#89c8c7',10,'center','700');
};
const baseDrawTMI=drawTMI;
drawTMI=function(){
  baseDrawTMI();
  if(state.tmi.detached){
    const t=Math.min(3,ageOf('detach'));
    const x=W*.51,y=H*.40;
    drawSprite(sprites.centaur,x-12*t,y+8*t*t,18,80,-.28+t*.18,Math.max(.1,1-t*.2));
    drawSatellite(x+16+22*t,y-12*t,70,.3);
    pyroFlash(x,y,t);
  }
};

// Screen shake applies only to the scene (not the mission controls).
function shakeScene(){
  if(state.phase!=='launch'||!state.launch.ignited)return;
  const t=ageOf('ignition');
  const amplitude=t<3?8*(1-t/3)+1.6:1.25+(state.launch.q>30?1.7:0);
  ctx.translate((Math.sin(time*64)+Math.cos(time*91))*.5*amplitude,(Math.cos(time*71)-Math.sin(time*48))*.5*amplitude);
}
// Patch the render loop in game.js to invoke shakeScene and powerTick.

const fullscreen=$('fullscreenBtn');
fullscreen.addEventListener('click',async()=>{
 try{
  if(document.fullscreenElement)await document.exitFullscreen();
  else await document.documentElement.requestFullscreen();
 }catch(e){toast('Không thể bật toàn màn hình trong trình duyệt này.','warn')}
});
document.addEventListener('fullscreenchange',()=>fullscreen.textContent=document.fullscreenElement?'⤢':'⛶');

const priorHelp=showHelp;
showHelp=function(){priorHelp();const ul=$('modal').querySelector('ol');if(ul){
  ul.insertAdjacentHTML('beforeend','<li><b>Năng lượng:</b> sau khi tách vệ tinh, mở cánh pin và ăng-ten ngay trong giai đoạn Cruise; chú ý % pin, vùng tối và rủi ro hãm khí quyển.</li><li><b>Ending:</b> có nhiều good/bad ending. Kết thúc thất bại sẽ ghi nguyên nhân trực tiếp, phân tích kỹ thuật và cách tránh.</li>');
 }};

// Re-render dynamic statuses after the patched controls are registered.
render();
