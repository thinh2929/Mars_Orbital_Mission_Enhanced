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
    'Complete preflight verification',
    'Attain 101 km altitude safely (MECO)',
    'Separate booster stage & fairing',
    'Establish Earth parking orbit',
    'Execute TMI & detach MRO',
    'Midcourse trajectory correction',
    'Achieve target Mars science orbit',
    `Downlink at least ${targetPhotos} images`,
  ];

  const fmt = (n: number) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 });
  const money = (n: number) => (n / 1000).toFixed(2) + 'B';

  const renderTelemetryGrid = () => {
    if (state.phase === 'assembly') {
      return (
        <>
          <div className="telemetry-item">
            <label>TOTAL WET MASS</label>
            <strong>{fmt(b.mass)}</strong>
            <small>kg</small>
          </div>
          <div className="telemetry-item">
            <label>MAX VEHICLE CAPACITY</label>
            <strong>{fmt(b.launcher.max)}</strong>
            <small>kg</small>
          </div>
          <div className="telemetry-item">
            <label>SPACECRAFT DRY MASS</label>
            <strong>{fmt(b.dry)}</strong>
            <small>kg</small>
          </div>
          <div className="telemetry-item">
            <label>MRO PROPELLANT</label>
            <strong>{fmt(b.prop)}</strong>
            <small>kg</small>
          </div>
          <div className="telemetry-item">
            <label>POWER GENERATION</label>
            <strong>{fmt(b.gen)}</strong>
            <small>W</small>
          </div>
          <div className="telemetry-item">
            <label>POWER CONSUMPTION</label>
            <strong>{fmt(b.draw)}</strong>
            <small>W</small>
          </div>
          <div className="telemetry-item">
            <label>ESTIMATED BUDGET</label>
            <strong>${money(b.cost)}</strong>
          </div>
          <div className="telemetry-item">
            <label>MISSION BUDGET CAP</label>
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
            <label>ALTITUDE</label>
            <strong>{l.alt.toFixed(1)}</strong>
            <small>km</small>
          </div>
          <div className="telemetry-item">
            <label>VELOCITY</label>
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
            <label>PITCH ANGLE</label>
            <strong>{pitch}</strong>
            <small>°</small>
          </div>
          <div className="telemetry-item">
            <label>DEVIATION</label>
            <strong>{l.deviation.toFixed(1)}</strong>
            <small>units</small>
          </div>
          <div className="telemetry-item">
            <label>STRUCTURAL HEALTH</label>
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
            <label>IMAGES STORED</label>
            <strong>{s.images.length}</strong>
            <small>frames</small>
          </div>
          <div className="telemetry-item">
            <label>DOWNLINKED</label>
            <strong>
              {s.returned.length}/{targetPhotos}
            </strong>
            <small>frames</small>
          </div>
          <div className="telemetry-item">
            <label>SSR BUFFER</label>
            <strong>
              {usedMemory().toFixed(1)}/{b.opts[4].memory}
            </strong>
            <small>GB</small>
          </div>
          <div className="telemetry-item">
            <label>BATTERY STORAGE</label>
            <strong>{fmt(b.opts[2].capacity || 0)}</strong>
            <small>Ah</small>
          </div>
          <div className="telemetry-item">
            <label>MRO PROPELLANT</label>
            <strong>{Math.max(0, s.prop).toFixed(1)}</strong>
            <small>kg</small>
          </div>
          <div className="telemetry-item">
            <label>SCIENCE ORBIT</label>
            <strong>{c.finalAlt.toFixed(1)}</strong>
            <small>km</small>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="telemetry-item">
          <label>CURRENT ALTITUDE</label>
          <strong>{l.alt.toFixed(0)}</strong>
          <small>km</small>
        </div>
        <div className="telemetry-item">
          <label>MRO PROPELLANT</label>
          <strong>{Math.max(0, s.prop).toFixed(0)}</strong>
          <small>kg</small>
        </div>
        <div className="telemetry-item">
          <label>CENTAUR PROPELLANT</label>
          <strong>{fmt(state.tmi.fuel)}</strong>
          <small>kg</small>
        </div>
        <div className="telemetry-item">
          <label>ORBIT DEVIATION</label>
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
          <label>POWER SYSTEM</label>
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
        <h2 className="sidebar-head">System Telemetry</h2>
        <div className="section-rule"></div>

        <div id="telemetry" className="telemetry">
          {renderTelemetryGrid()}

          <div className="telemetry-item" style={{ gridColumn: '1 / -1' }}>
            <label>SATELLITE HYDRAZINE RESERVE</label>
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
            <span>Payload Mass</span>
            <b className={b.weightOK ? '' : 'danger'}>
              {b.weightOK ? 'WITHIN LIMIT' : 'OVERWEIGHT'}
            </b>
          </div>
          <div className="safety-row">
            <span>Fairing Envelope</span>
            <b className={b.fairingOK ? '' : 'danger'}>
              {b.fairingOK ? 'COMPATIBLE' : 'TOO NARROW'}
            </b>
          </div>
          <div className="safety-row">
            <span>Dynamic Pressure</span>
            <b className={l.maxQ < 45 ? '' : 'danger'}>
              {l.maxQ < 45 ? 'NOMINAL' : 'EXCEEDED'}
            </b>
          </div>
          <div className="safety-row">
            <span>Structural Health</span>
            <b className={l.health > 60 ? '' : 'danger'}>
              {l.health > 60 ? 'NOMINAL' : 'CRITICAL'}
            </b>
          </div>
          <div className="safety-row">
            <span>Electrical Power</span>
            <b className={b.powerOK ? '' : 'warn'}>
              {b.powerOK ? 'POWER OK' : 'POWER MANAGEMENT'}
            </b>
          </div>
          {s.powered === false && (
            <div className="alert-card bad">POWER BUS OFFLINE • MISSION CANNOT PROCEED</div>
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
          Educational 2D simulation. Equations and gameplay thresholds are simplified; not intended for real-world flight design.
        </div>
      </div>
    </aside>
  );
};
