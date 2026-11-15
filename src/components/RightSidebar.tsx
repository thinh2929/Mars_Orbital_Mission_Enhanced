'use client';

import React from 'react';
import { useGame } from '../context/GameContext';

export const RightSidebar: React.FC = () => {
  const { state, build, usedMemory, availablePower, powerFraction, photoCapacity } = useGame();
  const b = build;
  const l = state.launch;
  const c = state.capture;
  const s = state.sat;

  const satFuelPct = (100 * Math.max(0, s.prop)) / Math.max(1, b.prop || 1);
  const batteryPct = Math.round(powerFraction() * 100);
  const { targetPhotos } = photoCapacity();

  const objMarks = [
    state.preflight,
    state.launch.cutoff,
    state.sep.stage && state.sep.fairing,
    state.orbit.confirmed,
    state.tmi.detached,
    state.cruise.corrected,
    state.capture.finalized,
    state.sat.returned.length >= targetPhotos,
  ];

  const objLabels = [
    'Hoàn thành kiểm tra trước phóng',
    'Đạt mốc 101 km an toàn',
    'Tách tầng và vỏ fairing',
    'Thiết lập quỹ đạo chờ Trái Đất',
    'Tiêm quỹ đạo chuyển tiếp & tách MRO',
    'Hiệu chỉnh hành trình đến Sao Hỏa',
    'Đạt quỹ đạo Sao Hỏa mục tiêu',
    `Gửi về ít nhất ${targetPhotos} ảnh`,
  ];

  const fmt = (n: number) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 });
  const money = (n: number) => (n / 1000).toFixed(2) + 'B';

  const renderTelemetryGrid = () => {
    if (state.phase === 'assembly') {
      return (
        <>
          <div className="telemetry-item">
            <label>TỔNG KHỐI LƯỢNG</label>
            <strong>{fmt(b.mass)}</strong>
            <small>kg</small>
          </div>
          <div className="telemetry-item">
            <label>SỨC TẢI TỐI ĐA</label>
            <strong>{fmt(b.launcher.max)}</strong>
            <small>kg</small>
          </div>
          <div className="telemetry-item">
            <label>KHỐI LƯỢNG KHÔ</label>
            <strong>{fmt(b.dry)}</strong>
            <small>kg</small>
          </div>
          <div className="telemetry-item">
            <label>CHẤT ĐẨY MRO</label>
            <strong>{fmt(b.prop)}</strong>
            <small>kg</small>
          </div>
          <div className="telemetry-item">
            <label>ĐIỆN TẠO RA</label>
            <strong>{fmt(b.gen)}</strong>
            <small>W</small>
          </div>
          <div className="telemetry-item">
            <label>ĐIỆN TIÊU THỤ</label>
            <strong>{fmt(b.draw)}</strong>
            <small>W</small>
          </div>
          <div className="telemetry-item">
            <label>CHI PHÍ DỰ KIẾN</label>
            <strong>${money(b.cost)}</strong>
          </div>
          <div className="telemetry-item">
            <label>GIỚI HẠN MISSION</label>
            <strong>${money(state.budget)}</strong>
          </div>
        </>
      );
    }

    if (state.phase === 'launch' || state.phase === 'separation') {
      const pitch = Math.round(90 - Math.min(1, Math.max(0, l.t / 250)) * 67 + l.guidance);
      return (
        <>
          <div className="telemetry-item">
            <label>ĐỘ CAO</label>
            <strong>{l.alt.toFixed(1)}</strong>
            <small>km</small>
          </div>
          <div className="telemetry-item">
            <label>VẬN TỐC</label>
            <strong>{l.vel.toFixed(2)}</strong>
            <small>km/s</small>
          </div>
          <div className="telemetry-item">
            <label>DYNAMIC PRESSURE</label>
            <strong>{l.q.toFixed(1)}</strong>
            <small>kPa</small>
          </div>
          <div className="telemetry-item">
            <label>MAX Q</label>
            <strong>{l.maxQ.toFixed(1)}</strong>
            <small>kPa</small>
          </div>
          <div className="telemetry-item">
            <label>PITCH</label>
            <strong>{pitch}</strong>
            <small>°</small>
          </div>
          <div className="telemetry-item">
            <label>ĐỘ LỆCH</label>
            <strong>{l.deviation.toFixed(1)}</strong>
            <small>units</small>
          </div>
          <div className="telemetry-item">
            <label>KẾT CẤU</label>
            <strong>{l.health.toFixed(0)}</strong>
            <small>%</small>
          </div>
          <div className="telemetry-item">
            <label>ROLL</label>
            <strong>{l.roll.toFixed(0)}</strong>
            <small>°</small>
          </div>
        </>
      );
    }

    if (state.phase === 'science') {
      return (
        <>
          <div className="telemetry-item">
            <label>ẢNH ĐÃ CHỤP</label>
            <strong>{s.images.length}</strong>
            <small>images</small>
          </div>
          <div className="telemetry-item">
            <label>ẢNH ĐÃ GỬI</label>
            <strong>
              {s.returned.length}/{targetPhotos}
            </strong>
            <small>images</small>
          </div>
          <div className="telemetry-item">
            <label>BỘ NHỚ SSR</label>
            <strong>
              {usedMemory().toFixed(1)}/{b.opts[4].memory}
            </strong>
            <small>GB</small>
          </div>
          <div className="telemetry-item">
            <label>DUNG LƯỢNG PIN</label>
            <strong>{fmt(b.opts[2].capacity || 0)}</strong>
            <small>Ah</small>
          </div>
          <div className="telemetry-item">
            <label>NHIÊN LIỆU MRO</label>
            <strong>{Math.max(0, s.prop).toFixed(1)}</strong>
            <small>kg</small>
          </div>
          <div className="telemetry-item">
            <label>QUỸ ĐẠO</label>
            <strong>{c.finalAlt.toFixed(1)}</strong>
            <small>km</small>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="telemetry-item">
          <label>ĐỘ CAO PHÓNG</label>
          <strong>{l.alt.toFixed(0)}</strong>
          <small>km</small>
        </div>
        <div className="telemetry-item">
          <label>NHIÊN LIỆU MRO</label>
          <strong>{Math.max(0, s.prop).toFixed(0)}</strong>
          <small>kg</small>
        </div>
        <div className="telemetry-item">
          <label>CHẤT ĐẨY CENTAUR</label>
          <strong>{fmt(state.tmi.fuel)}</strong>
          <small>kg</small>
        </div>
        <div className="telemetry-item">
          <label>ĐỘ LỆCH QUỸ ĐẠO</label>
          <strong>{l.deviation.toFixed(1)}</strong>
          <small>units</small>
        </div>
        <div className="telemetry-item">
          <label>MARS PERIAPSIS</label>
          <strong>{state.phase === 'capture' ? fmt(c.peri) : '—'}</strong>
          <small>km</small>
        </div>
        <div className="telemetry-item">
          <label>MARS APOAPSIS</label>
          <strong>{state.phase === 'capture' ? fmt(c.apo) : '—'}</strong>
          <small>km</small>
        </div>
        <div className="telemetry-item">
          <label>ĐIỆN HỆ THỐNG</label>
          <strong>{fmt(b.gen)}</strong>
          <small>W</small>
        </div>
        <div className="telemetry-item">
          <label>SSR CAPACITY</label>
          <strong>{b.opts[4].memory}</strong>
          <small>GB</small>
        </div>
      </>
    );
  };

  return (
    <aside className="sidebar right-panel">
      <div className="sidebar-inner">
        <div className="eyebrow">REAL-TIME TELEMETRY</div>
        <h2 className="sidebar-head">Thông số hệ thống</h2>
        <div className="section-rule"></div>

        <div id="telemetry" className="telemetry">
          {renderTelemetryGrid()}

          <div className="telemetry-item" style={{ gridColumn: '1 / -1' }}>
            <label>SATELLITE FUEL RESERVE</label>
            <div className="meter">
              <i
                style={{
                  width: `${Math.min(100, Math.max(0, satFuelPct))}%`,
                  background: satFuelPct < 15 ? '#f07872' : '',
                }}
              ></i>
            </div>
            <small>{satFuelPct.toFixed(1)}% REMAINING</small>
          </div>

          {!['assembly', 'end'].includes(state.phase) && (
            <div className="telemetry-item" style={{ gridColumn: '1 / -1' }}>
              <label>BATTERY / ENERGY STORAGE</label>
              <strong>
                {Math.round(s.batteryWh || 0)} <small>Wh</small>
              </strong>
              <div className="meter">
                <i
                  style={{
                    width: `${batteryPct}%`,
                    background: batteryPct < 22 ? '#f07975' : '#7de4cc',
                  }}
                ></i>
              </div>
              <small>
                {batteryPct}% • SOLAR {availablePower()} W • {s.powered ? 'BUS ONLINE' : 'BLACKOUT'}
              </small>
            </div>
          )}
        </div>
        <div className="section-rule"></div>

        <div className="mission-label">FLIGHT SAFETY</div>
        <div id="safetyPanel" className="safety-panel">
          <div className="safety-row">
            <span>Khối lượng</span>
            <b className={b.weightOK ? '' : 'danger'}>
              {b.weightOK ? 'WITHIN LIMIT' : 'OVERWEIGHT'}
            </b>
          </div>
          <div className="safety-row">
            <span>Khoang tải</span>
            <b className={b.fairingOK ? '' : 'danger'}>
              {b.fairingOK ? 'COMPATIBLE' : 'TOO NARROW'}
            </b>
          </div>
          <div className="safety-row">
            <span>Max Q</span>
            <b className={l.maxQ < 45 ? '' : 'danger'}>
              {l.maxQ < 45 ? 'NOMINAL' : 'EXCEEDED'}
            </b>
          </div>
          <div className="safety-row">
            <span>Tình trạng kết cấu</span>
            <b className={l.health > 60 ? '' : 'danger'}>
              {l.health > 60 ? 'NOMINAL' : 'CRITICAL'}
            </b>
          </div>
          <div className="safety-row">
            <span>Nguồn &amp; cảm biến</span>
            <b className={b.powerOK ? '' : 'warn'}>
              {b.powerOK ? 'POWER OK' : 'POWER MANAGEMENT'}
            </b>
          </div>
          {s.powered === false && (
            <div className="alert-card bad">POWER BUS OFFLINE • NHIỆM VỤ KHÔNG THỂ TIẾP TỤC</div>
          )}
        </div>
        <div className="section-rule"></div>

        <div className="mission-label">MISSION OBJECTIVES</div>
        <div id="objectives" className="objectives">
          {objLabels.map((lbl, idx) => (
            <div key={idx} className={`objective ${objMarks[idx] ? 'done' : ''}`}>
              <span className="mark">{objMarks[idx] ? '☑' : '□'}</span>
              <span>{lbl}</span>
            </div>
          ))}
        </div>

        <div className="right-footnote">
          Mô phỏng giáo dục 2D. Các công thức và ngưỡng gameplay được đơn giản hóa; không dùng cho thiết kế chuyến bay thực.
        </div>
      </div>
    </aside>
  );
};
