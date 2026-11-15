'use client';

import React from 'react';
import { useGame } from '../context/GameContext';
import { SLOTS, LAUNCHERS, TARGET_REGIONS } from '../lib/constants';
import { Physics } from '../lib/physics';

export const ControlPanel: React.FC = () => {
  const {
    state,
    build,
    setBuildTab,
    setSlotFocus,
    setSlotChoice,
    setLauncher,
    updateRange,
    executeAction,
    usedMemory,
    availablePower,
    powerFraction,
    cruiseTarget,
    targetTrim,
    requiredPasses,
    photoCapacity,
    setActiveModal,
  } = useGame();

  const b = build;
  const l = state.launch;
  const o = state.orbit;
  const t = state.tmi;
  const cr = state.cruise;
  const c = state.capture;
  const s = state.sat;

  const attempts = state.v3attempts[state.phase] || 0;
  const guidanceUnlocked = attempts >= 2;

  const fmt = (n: number) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 });
  const money = (n: number) => (n / 1000).toFixed(2) + 'B';

  const controlHeadingText = {
    assembly: 'Lắp ráp vệ tinh & chọn tên lửa',
    launch: 'Điều khiển lực đẩy và hướng phóng',
    separation: 'Chuỗi tách tầng an toàn',
    parking: 'Đốt động cơ đưa vào quỹ đạo chờ',
    tmi: 'Đốt chuyển tiếp và giải phóng MRO',
    cruise: 'Hiệu chỉnh quỹ đạo xuyên hành tinh',
    capture: 'Hãm tốc và xác nhận quỹ đạo Sao Hỏa',
    science: 'Chụp ảnh & truyền dữ liệu về Trái Đất',
    end: 'Báo cáo nhiệm vụ',
  }[state.phase];

  const stageHintText = {
    assembly: 'DESIGN & PREFLIGHT',
    launch: 'LIFTOFF & MAX Q',
    separation: 'MECO / CENTAUR',
    parking: 'UPPER STAGE BURN',
    tmi: 'TRANS-MARS INJECTION',
    cruise: 'MIDCOURSE MANEUVER',
    capture: 'MOI / AEROBRAKE',
    science: 'IMAGING / DOWNLINK',
    end: 'MISSION REPORT',
  }[state.phase];

  const renderAssemblyControls = () => {
    const f = state.slotFocus;
    const sl = SLOTS[f];
    const choices = sl.opts;

    const nav = (
      <div className="control-stack" style={{ marginBottom: 13 }}>
        <button
          className={state.buildTab === 'component' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setBuildTab('component')}
        >
          01 / LỰA CHỌN LINH KIỆN
        </button>
        <button
          className={state.buildTab === 'rocket' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setBuildTab('rocket')}
        >
          02 / PHƯƠNG TIỆN PHÓNG
        </button>
        <button
          className={state.buildTab === 'test' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setBuildTab('test')}
        >
          03 / KIỂM TRA TRƯỚC PHÓNG
        </button>
      </div>
    );

    if (state.buildTab === 'component') {
      return (
        <div>
          {nav}
          <div className="build-grid">
            <div className="slot-list">
              {SLOTS.map((sGroup, i) => (
                <button
                  key={i}
                  className={`slot-button ${f === i ? 'selected' : ''}`}
                  onClick={() => setSlotFocus(i)}
                >
                  <span className="slot-count">0{i + 1}</span>
                  <span>{sGroup.label}</span>
                </button>
              ))}
            </div>

            <div>
              <div className="control-description">
                KHE {f + 1} — {sl.desc.toUpperCase()}. Chọn cấu hình để thay đổi khối lượng, hiệu năng và rủi ro.
              </div>
              <div className="control-grid">
                {choices.map((opt, j) => (
                  <button
                    key={j}
                    className={`choice-card ${state.slot[f] === j ? 'selected' : ''}`}
                    onClick={() => setSlotChoice(f, j)}
                  >
                    <span className="grade">
                      PHƯƠNG ÁN {'ABC'[j]} • {opt.kind}
                    </span>
                    <b>{opt.name}</b>
                    <small>{opt.description}</small>
                    <span className="metric">{opt.detail}</span>
                  </button>
                ))}
              </div>
              <div className="details-note">
                <b>RỦI RO: </b>
                {choices[state.slot[f]].issue}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (state.buildTab === 'rocket') {
      return (
        <div>
          {nav}
          <p className="control-description">
            Atlas V-401 là cấu hình có thông số theo PDF; hai lựa chọn khác là giả tưởng cho cân bằng gameplay.
          </p>
          <div className="rocket-options">
            {LAUNCHERS.map((r, i) => (
              <button
                key={r.id}
                className={`rocket-option ${state.launcher === i ? 'selected' : ''}`}
                onClick={() => setLauncher(i)}
              >
                <b>{r.name}</b>
                <small>{r.kind}</small>
                <span>
                  {fmt(r.max)} kg • ${r.cost}M
                </span>
                <small>{r.description}</small>
              </button>
            ))}
          </div>
          <div className="hint-line">
            Đang chọn <b>{b.launcher.name}</b> • TWR: {b.twr.toFixed(2)} • FAIRING Ø {b.launcher.fairing.toFixed(1)} m.
          </div>
        </div>
      );
    }

    const checks: [string, boolean, string][] = [
      ['Tổng tải', b.weightOK, `${fmt(b.mass)} / ${fmt(b.launcher.max)} kg`],
      [
        'Fairing',
        b.fairingOK,
        `gập ${b.stowedWidth.toFixed(2)} m / fairing hữu dụng ${(b.launcher.fairing - 0.14).toFixed(2)} m`,
      ],
      ['Ngân sách nhiệm vụ', b.priceOK, `$${money(b.cost)} / $${money(state.budget)}`],
      ['TWR', b.twr > 1.05, `${b.twr.toFixed(2)} (>1.05)`],
      [
        'Nguồn điện',
        true,
        b.powerOK ? `${b.gen} W ≥ ${b.draw} W` : `${b.gen} W < ${b.draw} W; cần lập lịch thiết bị`,
      ],
      ['Tính toàn vẹn', true, 'Cấu hình gập và gia tốc: game model'],
    ];

    const canPreflight = b.weightOK && b.priceOK && b.fairingOK && b.twr > 1.05;

    return (
      <div>
        {nav}
        <div className="preflight-checks">
          {checks.map((ck, i) => (
            <div key={i} className={`check-item ${ck[1] ? 'ok' : 'fail'}`}>
              {ck[1] ? '✓' : '✕'} <b>{ck[0]}</b> — {ck[2]}
            </div>
          ))}
        </div>
        <div className="control-flex">
          <p className="control-description" style={{ margin: 0 }}>
            {!b.powerOK
              ? 'Cảnh báo: nguồn không đủ cho tất cả thiết bị chạy cùng lúc. Người chơi phải tắt radar khi chụp ảnh.'
              : 'Hệ thống nguồn nominal.'}
            <br />
            Trọng lượng vệ tinh gồm 892 kg khô khác đã điều chỉnh theo cấu hình, thiết bị khoa học và chất đẩy.
          </p>
          <button
            className="btn-primary"
            disabled={!canPreflight}
            onClick={() => executeAction('preflight')}
          >
            XÁC NHẬN KIỂM TRA &amp; PHÓNG
          </button>
        </div>
      </div>
    );
  };

  const renderLaunchControls = () => {
    if (l.cutoff) {
      return (
        <div>
          <div className="alert-card good">
            ✓ Đạt mốc 101 km — động cơ tầng 1 đã ngừng (MECO). Trạng thái tách tầng an toàn.
          </div>
          <button className="btn-primary" onClick={() => executeAction('to-separation')}>
            TIẾP TỤC: TÁCH TẦNG →
          </button>
        </div>
      );
    }

    return (
      <div>
        <p className="control-description">
          Khởi động RD-180 khi lực đẩy lớn hơn trọng lượng. Giữ pitch/roll ổn định; tránh vượt Max Q 45 kPa (ngưỡng
          gameplay).
        </p>
        <div className="flight-controls triple">
          <div className="range-group">
            <label htmlFor="throttle">
              <span>THROTTLE / LỰC ĐẨY</span>
              <output>{l.throttle}%</output>
            </label>
            <input
              id="throttle"
              type="range"
              min={55}
              max={100}
              step={1}
              value={l.throttle}
              disabled={l.cutoff}
              onChange={(e) => updateRange('throttle', Number(e.target.value))}
            />
          </div>

          <div className="range-group">
            <label htmlFor="guidance">
              <span>BẺ LÁI VECTOR PITCH</span>
              <output>{l.guidance}°</output>
            </label>
            <input
              id="guidance"
              type="range"
              min={-25}
              max={25}
              step={1}
              value={l.guidance}
              disabled={l.cutoff}
              onChange={(e) => updateRange('guidance', Number(e.target.value))}
            />
          </div>

          <div className="range-group">
            <label htmlFor="roll">
              <span>ROLL / GÓC XOAY</span>
              <output>{l.roll}°</output>
            </label>
            <input
              id="roll"
              type="range"
              min={-20}
              max={20}
              step={1}
              value={l.roll}
              disabled={l.cutoff}
              onChange={(e) => updateRange('roll', Number(e.target.value))}
            />
          </div>

          <div>
            <button
              className={l.ignited ? 'btn-secondary' : 'btn-primary'}
              disabled={l.ignited}
              onClick={() => executeAction('ignite')}
            >
              {l.ignited ? 'ENGINE ON • ASCENDING' : 'IGNITE RD-180 / LIFTOFF'}
            </button>
          </div>
        </div>

        {l.ignited && !l.cutoff && (
          <div className="task-row" style={{ marginTop: 8 }}>
            <span style={{ fontSize: 9, color: '#88a6b6', letterSpacing: '0.1em' }}>ĐIỀU CHỈNH HƯỚNG BAY:</span>
            <button
              type="button"
              className="btn-secondary"
              style={{ minHeight: 28, padding: '4px 10px', fontSize: 10 }}
              onClick={() => updateRange('guidance', Math.max(-25, l.guidance - 2))}
            >
              ◀ LÁI TRÁI (-2°)
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ minHeight: 28, padding: '4px 10px', fontSize: 10 }}
              onClick={() => updateRange('guidance', 0)}
            >
              CÂN BẰNG (0°)
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ minHeight: 28, padding: '4px 10px', fontSize: 10 }}
              onClick={() => updateRange('guidance', Math.min(25, l.guidance + 2))}
            >
              LÁI PHẢI (+2°) ▶
            </button>
          </div>
        )}

        <div className="hint-line">
          {l.ignited ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px 12px' }}>
              <span>ĐỘ CAO: <b>{l.alt.toFixed(1)} km</b> / 101 km</span>
              <span>ÁP SUẤT MAX Q: <b className={l.maxQ < 45 ? 'status-good' : 'status-bad'}>{l.maxQ.toFixed(1)} kPa</b></span>
              <span>LỆCH QUỸ ĐẠO: <b className={Math.abs(l.deviation) < 6 ? 'status-good' : 'status-warn'}>{l.deviation > 0 ? '+' : ''}{l.deviation.toFixed(1)} units</b> (Giới hạn: ±18)</span>
              <span>LỰC ĐẨY: <b>{l.throttle}%</b></span>
            </div>
          ) : (
            <>
              TWR ở 100% công suất: <b>{b.twr.toFixed(2)}</b>. Throttle quá thấp có thể không rời bệ phóng.
            </>
          )}
        </div>
      </div>
    );
  };

  const renderSeparationControls = () => {
    const sep = state.sep;
    let actionBtn = (
      <button className="btn-primary" onClick={() => executeAction('stage-sep')}>
        XÁC NHẬN TÁCH TẦNG 1
      </button>
    );

    if (sep.stage && !sep.centaur) {
      actionBtn = (
        <button className="btn-primary" onClick={() => executeAction('centaur-ignite')}>
          KHỞI ĐỘNG ĐỘNG CƠ RL-10
        </button>
      );
    } else if (sep.centaur && !sep.fairing) {
      actionBtn = (
        <button className="btn-primary" onClick={() => executeAction('fairing-sep')}>
          TÁCH FAIRING
        </button>
      );
    } else if (sep.stage && sep.centaur && sep.fairing) {
      actionBtn = (
        <button className="btn-primary" onClick={() => executeAction('to-parking')}>
          TIẾP TỤC QUỸ ĐẠO CHỜ →
        </button>
      );
    }

    return (
      <div>
        <p className="control-description">
          Trình tự: MECO → tách tầng 1 → khởi động Centaur → tách vỏ bảo vệ khi đạt độ cao an toàn.
        </p>
        <div className="mini-pair">
          <span>
            MECO <b className="status-good">✓ COMPLETE</b>
          </span>
          <span>
            BOOSTERS <b>NONE (401)</b>
          </span>
          <span>
            STAGE 1 <b>{sep.stage ? '✓ RELEASED' : 'ATTACHED'}</b>
          </span>
          <span>
            CENTAUR <b>{sep.centaur ? '✓ IGNITED' : 'IDLE'}</b>
          </span>
          <span>
            FAIRING <b>{sep.fairing ? '✓ RELEASED' : 'ATTACHED'}</b>
          </span>
        </div>
        <div className="control-stack" style={{ marginTop: 13 }}>
          {actionBtn}
        </div>
      </div>
    );
  };

  const renderParkingControls = () => {
    if (o.confirmed) {
      return (
        <div>
          <div className="alert-card good">
            ✓ Quỹ đạo chờ đã xác nhận. Cận điểm {o.peri.toFixed(1)} km • viễn điểm {o.apo.toFixed(1)} km.
          </div>
          <button className="btn-primary" onClick={() => executeAction('to-tmi')}>
            TIẾP TỤC: TRANS-MARS INJECTION →
          </button>
        </div>
      );
    }

    return (
      <div>
        <p className="control-description">
          Centaur thực hiện đốt quỹ đạo chờ mục tiêu <b>148 × 185 km</b>. Đường đứt mờ cho biết quỹ đạo yêu cầu. Điều
          chỉnh Δv và góc hướng đốt.
        </p>
        <div className="flight-controls">
          <div className="range-group">
            <label htmlFor="park-burn">
              <span>Δv CENTAUR</span>
              <output>{o.burn} m/s</output>
            </label>
            <input
              id="park-burn"
              type="range"
              min={250}
              max={420}
              step={1}
              value={o.burn}
              onChange={(e) => updateRange('park-burn', Number(e.target.value))}
            />
          </div>

          <div className="range-group">
            <label htmlFor="park-angle">
              <span>LỆCH HƯỚNG ĐỐT</span>
              <output>{o.angle}°</output>
            </label>
            <input
              id="park-angle"
              type="range"
              min={-15}
              max={15}
              step={1}
              value={o.angle}
              onChange={(e) => updateRange('park-angle', Number(e.target.value))}
            />
          </div>

          <button className="btn-primary" onClick={() => executeAction('park-exec')}>
            THỰC HIỆN BURN →
          </button>
        </div>

        <div className={`hint-line ${!guidanceUnlocked ? 'guidance-locked' : ''}`}>
          Khuyến nghị gameplay: <b>335 m/s</b> và <b>0°</b>. Một sai lệch lớn làm mất quỹ đạo chờ.
        </div>
      </div>
    );
  };

  const renderTMIControls = () => {
    if (t.complete) {
      return (
        <div>
          <div className="alert-card good">
            ✓ Đã thoát khỏi quỹ đạo chờ Trái Đất. Centaur MECO; MRO đã sẵn sàng để tách khỏi tầng trên.
          </div>
          <div className="task-row">
            <span className="mini-pair">
              <span>
                PAYLOAD RELEASE <b>{t.detached ? '✓ SAFE' : 'READY'}</b>
              </span>
            </span>
            <button
              className="btn-primary"
              onClick={() => executeAction(t.detached ? 'to-cruise' : 'detach')}
            >
              {t.detached ? 'ĐI TỚI HÀNH TRÌNH →' : 'TÁCH VỆ TINH MRO'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <p className="control-description">
          Đốt động cơ Centaur lần hai (TMI) để đưa vệ tinh vào quỹ đạo chuyển tiếp đến Sao Hỏa. Cắt động cơ trước khi tách
          MRO.
        </p>
        <div className="flight-controls">
          <div className="range-group">
            <label htmlFor="tmi-burn">
              <span>Δv CHUYỂN TIẾP</span>
              <output>{t.burn} m/s</output>
            </label>
            <input
              id="tmi-burn"
              type="range"
              min={2920}
              max={3380}
              step={10}
              value={t.burn}
              onChange={(e) => updateRange('tmi-burn', Number(e.target.value))}
            />
          </div>

          <div className="range-group">
            <label htmlFor="tmi-angle">
              <span>GÓC TIÊM QUỸ ĐẠO</span>
              <output>{t.angle}°</output>
            </label>
            <input
              id="tmi-angle"
              type="range"
              min={-12}
              max={12}
              step={1}
              value={t.angle}
              onChange={(e) => updateRange('tmi-angle', Number(e.target.value))}
            />
          </div>

          <button className="btn-primary" onClick={() => executeAction('tmi-exec')}>
            THỰC HIỆN TMI BURN
          </button>
        </div>

        <div className={`hint-line ${!guidanceUnlocked ? 'guidance-locked' : ''}`}>
          Mục tiêu mô phỏng: <b>3,150 m/s • 0°</b>. Centaur fuel remaining {fmt(t.fuel)} kg.
        </div>
      </div>
    );
  };

  const renderCruiseControls = () => {
    const tgt = cruiseTarget();

    const earlyOps = (
      <div className="cruise-ops" style={{ marginBottom: 12 }}>
        <span className="eyebrow">EARLY DEPLOYMENT / MRO CONFIGURATION</span>
        <div className="task-row" style={{ marginTop: 6 }}>
          {!s.solar && (
            <button className="btn-primary" onClick={() => executeAction('solar')}>
              MỞ CÁNH PIN SAU KHI TÁCH MRO
            </button>
          )}
          {!s.antenna && (
            <button className="btn-primary" onClick={() => executeAction('antenna')}>
              TRIỂN KHAI ĂNG-TEN
            </button>
          )}
          <span className="small-choice active">
            PIN {Math.round(powerFraction() * 100)}% • {Math.round(s.batteryWh)} Wh
          </span>
        </div>
        {!s.solar && (
          <div className="alert-card bad" style={{ marginTop: 8 }}>
            <b>POWER ALERT:</b> Cánh pin chưa triển khai. Dự trữ pin đang cạn dần.
          </div>
        )}
      </div>
    );

    if (cr.corrected) {
      return (
        <div>
          {earlyOps}
          <div className="alert-card good">
            ✓ Course correction thành công. Sai số tiếp cận dự đoán {fmt(cr.miss)} km.
          </div>
          <button className="btn-primary" onClick={() => executeAction('to-capture')}>
            CHUYỂN ĐẾN SAO HỎA →
          </button>
        </div>
      );
    }

    const alongDev = cr.along - tgt.along;
    const lateralDev = cr.lateral - tgt.lateral;
    const alongKm = Math.abs(alongDev) * 11000;
    const lateralKm = Math.abs(lateralDev) * 20000;
    const totalMiss = Physics.missDistance(cr.along, cr.lateral, tgt.along, tgt.lateral, state.launch.deviation);

    return (
      <div>
        {earlyOps}
        <p className="control-description">
          Sửa sai số hành trình trước khi tiếp cận hành tinh. Kết hợp burn <b>along-track</b> và <b>cross-track</b> để
          khớp đường chuyển tiếp đứt mờ.
        </p>
        <div className="flight-controls">
          <div className="range-group">
            <label htmlFor="along">
              <span>Δv DỌC QUỸ ĐẠO</span>
              <output>
                {cr.along} m/s{' '}
                <span className={Math.abs(alongDev) <= 1 ? 'status-good' : 'status-warn'} style={{ fontSize: 10, marginLeft: 4 }}>
                  ({alongDev > 0 ? '+' : ''}{alongDev} m/s · {alongKm.toLocaleString('en-US')} km)
                </span>
              </output>
            </label>
            <input
              id="along"
              type="range"
              min={-25}
              max={35}
              step={1}
              value={cr.along}
              onChange={(e) => updateRange('along', Number(e.target.value))}
            />
          </div>

          <div className="range-group">
            <label htmlFor="lateral">
              <span>Δv NGANG QUỸ ĐẠO</span>
              <output>
                {cr.lateral} m/s{' '}
                <span className={Math.abs(lateralDev) <= 1 ? 'status-good' : 'status-warn'} style={{ fontSize: 10, marginLeft: 4 }}>
                  ({lateralDev > 0 ? '+' : ''}{lateralDev} m/s · {lateralKm.toLocaleString('en-US')} km)
                </span>
              </output>
            </label>
            <input
              id="lateral"
              type="range"
              min={-20}
              max={20}
              step={1}
              value={cr.lateral}
              onChange={(e) => updateRange('lateral', Number(e.target.value))}
            />
          </div>

          <button className="btn-primary" onClick={() => executeAction('cruise-exec')}>
            THỰC HIỆN HIỆU CHỈNH
          </button>
        </div>

        <div
          className="telemetry-deviation-bar"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            padding: '8px 12px',
            background: 'rgba(10, 24, 38, 0.75)',
            border: '1px solid #284459',
            borderRadius: 4,
            margin: '10px 0',
            fontSize: 11,
          }}
        >
          <div>
            <div style={{ color: '#8aa3b5', fontSize: 9, fontWeight: 700 }}>ĐỘ LỆCH DỌC TRỤC</div>
            <strong className={Math.abs(alongDev) <= 1 ? 'status-good' : 'status-warn'}>
              {alongDev > 0 ? '+' : ''}{alongDev} m/s ({alongKm.toLocaleString('en-US')} km)
            </strong>
          </div>
          <div>
            <div style={{ color: '#8aa3b5', fontSize: 9, fontWeight: 700 }}>ĐỘ LỆCH NGANG TRỤC</div>
            <strong className={Math.abs(lateralDev) <= 1 ? 'status-good' : 'status-warn'}>
              {lateralDev > 0 ? '+' : ''}{lateralDev} m/s ({lateralKm.toLocaleString('en-US')} km)
            </strong>
          </div>
          <div>
            <div style={{ color: '#8aa3b5', fontSize: 9, fontWeight: 700 }}>SAI SỐ TIẾP CẬN DỰ KIẾN</div>
            <strong className={totalMiss <= 45000 ? 'status-good' : 'status-bad'}>
              {totalMiss.toLocaleString('en-US')} km{' '}
              <small style={{ fontSize: 9, opacity: 0.8 }}>(Mục tiêu &lt; 45.000)</small>
            </strong>
          </div>
        </div>

        <div className={`hint-line ${!guidanceUnlocked ? 'guidance-locked' : ''}`}>
          Dữ liệu navigator: <b>Δv dọc ≈ {tgt.along} m/s</b>, <b>Δv ngang ≈ {tgt.lateral} m/s</b>. Sai số lớn có thể bay
          lướt qua Sao Hỏa.
        </div>
      </div>
    );
  };

  const renderCaptureControls = () => {
    const need = requiredPasses();
    const optimal = targetTrim();

    const powerBus = (
      <div className="hint-line" style={{ color: '#6fe3c8', marginBottom: 10 }}>
        ● POWER BUS {s.powered ? 'ONLINE' : 'OFFLINE'} • BATTERY {Math.round(powerFraction() * 100)}% • SOLAR{' '}
        {availablePower()} W
      </div>
    );

    if (!c.inserted) {
      return (
        <div>
          {powerBus}
          <p className="control-description">
            MRO tiếp cận Sao Hỏa: thực hiện Mars Orbit Insertion (MOI). Burn sai có thể lao vào hành tinh hoặc không bị
            bắt vào quỹ đạo.
          </p>
          <div className="flight-controls">
            <div className="range-group">
              <label htmlFor="capture-burn">
                <span>Δv HÃM TỐC</span>
                <output>{c.burn} m/s</output>
              </label>
              <input
                id="capture-burn"
                type="range"
                min={760}
                max={1130}
                step={5}
                value={c.burn}
                onChange={(e) => updateRange('capture-burn', Number(e.target.value))}
              />
            </div>

            <div className="range-group">
              <label htmlFor="capture-angle">
                <span>SAI LỆCH VECTOR</span>
                <output>{c.angle}°</output>
              </label>
              <input
                id="capture-angle"
                type="range"
                min={-12}
                max={12}
                step={1}
                value={c.angle}
                onChange={(e) => updateRange('capture-angle', Number(e.target.value))}
              />
            </div>

            <button className="btn-primary" onClick={() => executeAction('capture-exec')}>
              THỰC HIỆN MOI
            </button>
          </div>

          <div className={`hint-line ${!guidanceUnlocked ? 'guidance-locked' : ''}`}>
            Mục tiêu đơn giản hóa: <b>940 m/s</b> • góc 0° • còn {fmt(s.prop)} kg chất đẩy MRO.
          </div>
        </div>
      );
    }

    if (c.passes < need) {
      return (
        <div>
          {powerBus}
          <div className="alert-card">
            Đã bắt vào quỹ đạo elip: viễn điểm {fmt(c.apo)} km. Cần ít nhất <b>{need} lượt hãm khí quyển</b>
            {state.slot[3] === 1 ? ' (bình 75% bắt buộc hãm nhiều hơn)' : ''}. Lựa chọn periapsis quá thấp có thể phá
            hủy cánh pin.
          </div>
          <div className="flight-controls">
            <div className="range-group">
              <label htmlFor="peri">
                <span>PERIAPSIS HÃM KHÍ QUYỂN</span>
                <output>{c.peri} km</output>
              </label>
              <input
                id="peri"
                type="range"
                min={115}
                max={190}
                step={1}
                value={c.peri}
                onChange={(e) => updateRange('peri', Number(e.target.value))}
              />
            </div>

            <div>
              <span className="eyebrow">AEROBRAKE PASS</span>
              <h2 style={{ margin: '4px 0', fontSize: 22 }}>
                {c.passes}/{need}
              </h2>
            </div>

            <button className="btn-primary" onClick={() => executeAction('aerobrake')}>
              THỰC HIỆN AEROBRAKING
            </button>
          </div>

          <div className={`hint-line ${!guidanceUnlocked ? 'guidance-locked' : ''}`}>
            Hành lang tham khảo trong game <b>140–165 km</b>; dưới 130 km làm tăng nguy cơ nhiệt.
          </div>
        </div>
      );
    }

    return (
      <div>
        {powerBus}
        <div className="alert-card good">
          ✓ Đã hoàn thành {c.passes} lượt hãm khí quyển. Viễn điểm hiện tại ~{fmt(c.apo)} km. Đưa tàu vào quỹ đạo khoa
          học 300 km.
        </div>
        <div className="flight-controls triple">
          <div className="range-group">
            <label htmlFor="trim">
              <span>Δv CIRCULARIZATION</span>
              <output>{c.trim} m/s</output>
            </label>
            <input
              id="trim"
              type="range"
              min={120}
              max={420}
              step={5}
              value={c.trim}
              onChange={(e) => updateRange('trim', Number(e.target.value))}
            />
          </div>

          <div className="range-group">
            <label htmlFor="incl">
              <span>ĐỘ NGHIÊNG QUỸ ĐẠO</span>
              <output>{c.incl}°</output>
            </label>
            <input
              id="incl"
              type="range"
              min={85}
              max={100}
              step={0.5}
              value={c.incl}
              onChange={(e) => updateRange('incl', Number(e.target.value))}
            />
          </div>

          <div>
            <span className="eyebrow">TARGET Δv</span>
            <h2 style={{ margin: '5px 0', fontSize: 20, color: 'var(--teal)' }}>{optimal} m/s</h2>
          </div>

          <button className="btn-primary" onClick={() => executeAction('circularize')}>
            XÁC NHẬN QUỸ ĐẠO →
          </button>
        </div>

        <div className={`hint-line ${!guidanceUnlocked ? 'guidance-locked' : ''}`}>
          Thắng khi độ cao quanh <b>300 ± 25 km</b>, độ nghiêng <b>93 ± 2°</b>. Đường đứt mờ = quỹ đạo mục tiêu.
        </div>
      </div>
    );
  };

  const renderScienceControls = () => {
    const opts = b.opts;
    const draw =
      opts[0].power -
      (state.slot[0] === 0 && s.crismActive === false ? 180 : 0) +
      (s.radarActive ? opts[1].power || 0 : 0) +
      300;
    const cap = photoCapacity();
    const imageSize = cap.imageSize;
    const maxPhotos = cap.maxPhotos;
    const targetPhotos = cap.targetPhotos;
    const isBufferFull = usedMemory() + imageSize > opts[4].memory + 1e-6;
    const powerOK = availablePower() >= draw || (s.batteryWh > 200 && powerFraction() > 0.1);

    const deploy = (
      <div className="mini-pair">
        <span>
          SOLAR ARRAYS <b>{s.solar ? '✓ DEPLOYED' : 'STOWED'}</b>
        </span>
        <span>
          HIGH-GAIN ANTENNA <b>{s.antenna ? '✓ DEPLOYED' : 'STOWED'}</b>
        </span>
        <span>
          RADAR <b>{s.radarActive ? 'ON' : 'OFF'}</b>
        </span>
        <span>
          CRISM <b>{s.crismActive !== false ? 'ON' : 'OFF'}</b>
        </span>
      </div>
    );

    const steps = (
      <div className="task-row" style={{ margin: '12px 0' }}>
        {!s.solar && (
          <button className="btn-primary" onClick={() => executeAction('solar')}>
            TRIỂN KHAI CÁNH PIN
          </button>
        )}
        {!s.antenna && (
          <button className="btn-primary" onClick={() => executeAction('antenna')}>
            MỞ ĂNG-TEN CAO ÍCH
          </button>
        )}
        <button className="btn-secondary" onClick={() => executeAction('radar-toggle')}>
          {s.radarActive ? 'TẮT RADAR • TIẾT KIỆM ĐIỆN' : 'BẬT RADAR'}
        </button>
        {state.slot[0] === 0 && (
          <button className="btn-secondary" onClick={() => executeAction('crism-toggle')}>
            {s.crismActive !== false ? 'TẮT CRISM • CHỤP HiRISE' : 'BẬT CRISM'}
          </button>
        )}
      </div>
    );

    const photos = (
      <div className="control-grid">
        {TARGET_REGIONS.map((reg) => (
          <button
            key={reg.id}
            className={`choice-card ${s.imageTarget === reg.id ? 'selected' : ''}`}
            onClick={() => executeAction(`target-${reg.id}`)}
          >
            <span className="grade">REGION {String(reg.id + 1).padStart(2, '0')}</span>
            <b>{reg.name}</b>
            <small>{reg.sub}</small>
          </button>
        ))}
      </div>
    );

    const last = (
      <div className="hint-line" style={{ marginTop: 12 }}>
        Điện hiện thời: <b>{draw} / {b.gen} W</b>{' '}
        {powerOK ? (
          <span className="status-good">• nominal</span>
        ) : (
          <span className="status-bad">• quá tải</span>
        )}{' '}
        • Lưu trữ <b>{usedMemory().toFixed(1)} / {opts[4].memory} GB</b>. Đã gửi{' '}
        <b>
          {s.returned.length} / {targetPhotos}
        </b>{' '}
        ảnh (Sức chứa bộ nhớ: {maxPhotos} ảnh).
      </div>
    );

    return (
      <div>
        <div className="hint-line" style={{ color: '#6fe3c8', marginBottom: 10 }}>
          BATTERY {Math.round(s.batteryWh)} / {s.batteryMaxWh} Wh ({Math.round(powerFraction() * 100)}%) • SOLAR{' '}
          {availablePower()} W • HEALTH {Math.round((s.powerHealth || 1) * 100)}%
        </div>
        {deploy}
        {steps}
        <div className="control-stack" style={{ marginBottom: 12 }}>
          <button
            className={s.scienceMode === 'photo' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => executeAction('science-photo')}
          >
            CAMERA / PHOTO
          </button>
          <button
            className={s.scienceMode === 'send' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => executeAction('science-send')}
          >
            DATA LINK / TRANSMIT
          </button>
        </div>

        {s.scienceMode === 'photo' ? (
          <div>
            {photos}
            <div className="task-row" style={{ marginTop: 12 }}>
              <button
                className="btn-primary"
                disabled={!s.solar || isBufferFull}
                onClick={() => executeAction('take-photo')}
              >
                {isBufferFull
                  ? `BỘ NHỚ ĐẦY (${s.images.length}/${maxPhotos} ẢNH) • HÃY TRUYỀN DỮ LIỆU`
                  : `CHỤP ẢNH • ${imageSize.toFixed(1)} GB (${s.images.length}/${maxPhotos} ẢNH)`}
              </button>
              <span className="hint-line">
                Các ảnh được cung cấp sẵn trong bộ tư liệu và dùng làm kết quả mô phỏng.
              </span>
            </div>
          </div>
        ) : (
          <div>
            <div className="alert-card good">
              Đã chụp {s.images.length}/{maxPhotos} ảnh (đã truyền {s.returned.length}/{targetPhotos} ảnh). Đĩa {opts[4].name}. Mỗi lệnh gửi tối đa {opts[4].rate} GB dữ liệu.
            </div>
            <button
              className="btn-primary"
              disabled={!s.antenna || !s.solar || !s.images.some((x) => !s.returned.some((r) => r.id === x.id))}
              onClick={() => executeAction('transmit')}
            >
              TRUYỀN DỮ LIỆU VỀ TRÁI ĐẤT ({s.returned.length}/{targetPhotos} HOÀN TẤT)
            </button>
            <div className="hint-line">
              Nếu ảnh chưa truyền hết, tiếp tục phát gói dữ liệu cho tới khi hoàn tất.
            </div>
          </div>
        )}
        {last}
      </div>
    );
  };

  const renderEndControls = () => {
    return (
      <div>
        <p className="control-description">Đã khóa bảng điều khiển chuyến bay.</p>
        <button className="btn-primary" onClick={() => setActiveModal('end-report')}>
          XEM BÁO CÁO NHIỆM VỤ
        </button>
      </div>
    );
  };

  return (
    <div className="control-shell">
      <div className="control-title">
        <div>
          <span className="eyebrow">MISSION CONTROL</span>
          <h2 id="controlHeading">{controlHeadingText}</h2>
        </div>
        <div id="stageHint" className="stage-hint">
          {stageHintText}
        </div>
      </div>

      <div id="controlPanel" className="control-body">
        {state.phase === 'assembly' && renderAssemblyControls()}
        {state.phase === 'launch' && renderLaunchControls()}
        {state.phase === 'separation' && renderSeparationControls()}
        {state.phase === 'parking' && renderParkingControls()}
        {state.phase === 'tmi' && renderTMIControls()}
        {state.phase === 'cruise' && renderCruiseControls()}
        {state.phase === 'capture' && renderCaptureControls()}
        {state.phase === 'science' && renderScienceControls()}
        {state.phase === 'end' && renderEndControls()}

        {guidanceUnlocked && state.phase !== 'end' && (
          <div className="hint-unlocked">
            ◉ GỢI Ý MỞ KHÓA — bạn đã thất bại {attempts} lần ở giai đoạn này. Dữ liệu hoa tiêu tự động đã mở.
          </div>
        )}
      </div>
    </div>
  );
};
