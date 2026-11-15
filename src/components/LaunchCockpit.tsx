'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';

interface LaunchCockpitProps {
  launch: {
    throttle: number;
    guidance: number;
    roll: number;
    ignited: boolean;
    cutoff: boolean;
    alt: number;
    vel: number;
    maxQ: number;
    deviation: number;
    t: number;
    vy: number;
    health: number;
    stageFuel?: number;
  };
  build: {
    twr: number;
    mass: number;
    launcher: { name: string };
  };
  guidanceUnlocked: boolean;
  updateRange: (id: string, value: number) => void;
  executeAction: (action: string) => void;
}

export const LaunchCockpit: React.FC<LaunchCockpitProps> = ({
  launch: l,
  build: b,
  guidanceUnlocked,
  updateRange,
  executeAction,
}) => {
  const throttleTrackRef = useRef<HTMLDivElement | null>(null);
  const guidanceTrackRef = useRef<HTMLDivElement | null>(null);
  const rollTrackRef = useRef<HTMLDivElement | null>(null);

  const [isDraggingThrottle, setIsDraggingThrottle] = useState(false);
  const [isDraggingGuidance, setIsDraggingGuidance] = useState(false);
  const [isDraggingRoll, setIsDraggingRoll] = useState(false);

  // Throttle Dragging (55% to 100%)
  const handleThrottlePointer = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      if (l.cutoff) return;
      const track = throttleTrackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const clientY = e.clientY;
      const fraction = 1 - (clientY - rect.top) / rect.height;
      const clamped = Math.max(0, Math.min(1, fraction));
      const val = Math.round(55 + clamped * (100 - 55));
      updateRange('throttle', val);
    },
    [l.cutoff, updateRange]
  );

  const onThrottlePointerDown = (e: React.PointerEvent) => {
    if (l.cutoff) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDraggingThrottle(true);
    handleThrottlePointer(e);
  };

  const onThrottlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingThrottle) {
      handleThrottlePointer(e);
    }
  };

  const onThrottlePointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setIsDraggingThrottle(false);
  };

  // Guidance Dragging (-25° to +25°)
  const handleGuidancePointer = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      if (l.cutoff) return;
      const track = guidanceTrackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const clientX = e.clientX;
      const fraction = (clientX - rect.left) / rect.width;
      const clamped = Math.max(0, Math.min(1, fraction));
      const val = Math.round(-25 + clamped * 50);
      updateRange('guidance', val);
    },
    [l.cutoff, updateRange]
  );

  const onGuidancePointerDown = (e: React.PointerEvent) => {
    if (l.cutoff) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDraggingGuidance(true);
    handleGuidancePointer(e);
  };

  const onGuidancePointerMove = (e: React.PointerEvent) => {
    if (isDraggingGuidance) {
      handleGuidancePointer(e);
    }
  };

  const onGuidancePointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setIsDraggingGuidance(false);
  };

  // Roll Dragging (-20° to +20°)
  const handleRollPointer = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      if (l.cutoff) return;
      const track = rollTrackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const clientX = e.clientX;
      const fraction = (clientX - rect.left) / rect.width;
      const clamped = Math.max(0, Math.min(1, fraction));
      const val = Math.round(-20 + clamped * 40);
      updateRange('roll', val);
    },
    [l.cutoff, updateRange]
  );

  const onRollPointerDown = (e: React.PointerEvent) => {
    if (l.cutoff) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDraggingRoll(true);
    handleRollPointer(e);
  };

  const onRollPointerMove = (e: React.PointerEvent) => {
    if (isDraggingRoll) {
      handleRollPointer(e);
    }
  };

  const onRollPointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setIsDraggingRoll(false);
  };

  // MECO cut-off view
  if (l.cutoff) {
    return (
      <div className="cockpit-meco-panel">
        <div className="alert-card good" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 24 }}>✓</span>
          <div>
            <strong style={{ fontSize: 13, letterSpacing: '0.05em' }}>MECO CONFIRMED • 101 KM TARGET ALTITUDE REACHED</strong>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#a6d9ca' }}>
              RD-180 main engine cutoff confirmed. Velocity reached {l.vel.toFixed(2)} km/s. Systems primed for stage 1 separation and Centaur ignition.
            </p>
          </div>
        </div>
        <button
          className="btn-primary"
          style={{ width: '100%', minHeight: 46, fontSize: 12, letterSpacing: '0.15em', marginTop: 10 }}
          onClick={() => executeAction('to-separation')}
        >
          PROCEED: STAGE SEPARATION SEQUENCE →
        </button>
      </div>
    );
  }

  // Calculate percentages for visual feedback
  const throttlePercent = ((l.throttle - 55) / (100 - 55)) * 100;
  const guidancePercent = ((l.guidance - -25) / 50) * 100;
  const rollPercent = ((l.roll - -20) / 40) * 100;

  // Max Q state
  const isMaxQSafe = l.maxQ < 40;
  const isMaxQWarn = l.maxQ >= 40 && l.maxQ < 45;
  const isMaxQCrit = l.maxQ >= 45;

  // Corridor deviation state (-18 to +18)
  const devAbs = Math.abs(l.deviation);
  const isDevSafe = devAbs < 8;
  const isDevWarn = devAbs >= 8 && devAbs <= 14;
  const isDevDanger = devAbs > 14;
  // Position along corridor meter: 0 is center (50%), -18 is 0%, +18 is 100%
  const devMeterPercent = Math.max(0, Math.min(100, ((l.deviation + 18) / 36) * 100));

  return (
    <div className="cockpit-console">
      {/* 1. TOP AVIONICS DIGITAL DASHBOARD */}
      <div className="avionics-dashboard">
        <div className="avionics-header">
          <div className="avionics-title">
            <span className="live-dot" style={{ backgroundColor: l.ignited ? '#4ade80' : '#f59e0b' }} />
            <span>AVIONICS FLIGHT TELEMETRY HUD</span>
            <small style={{ color: '#68899f', marginLeft: 8 }}>RD-180 MAIN ENGINE</small>
          </div>
          <div className="avionics-status-badge">
            {l.ignited ? (
              <span className="hud-badge active">● ENGINE ACTIVE • ASCENT</span>
            ) : (
              <span className="hud-badge standby">○ STANDBY ON PAD</span>
            )}
          </div>
        </div>

        <div className="avionics-grid">
          {/* CELL 1: ALTITUDE */}
          <div className="avionics-cell">
            <div className="cell-label">ALTITUDE RADAR</div>
            <div className="cell-value-row">
              <span className="cell-num">{l.alt.toFixed(1)}</span>
              <span className="cell-unit">KM</span>
            </div>
            <div className="cell-bar-wrap">
              <div
                className="cell-bar-fill"
                style={{ width: `${Math.min(100, (l.alt / 101) * 100)}%`, background: 'var(--teal)' }}
              />
            </div>
            <div className="cell-foot">MECO TARGET: 101.0 KM</div>
          </div>

          {/* CELL 2: VELOCITY */}
          <div className="avionics-cell">
            <div className="cell-label">VELOCITY VECTOR</div>
            <div className="cell-value-row">
              <span className="cell-num">{l.vel.toFixed(2)}</span>
              <span className="cell-unit">KM/S</span>
            </div>
            <div className="cell-bar-wrap">
              <div
                className="cell-bar-fill"
                style={{ width: `${Math.min(100, (l.vel / 4.2) * 100)}%`, background: '#38bdf8' }}
              />
            </div>
            <div className="cell-foot">CLIMB RATE: {l.vy > 0 ? `+${l.vy.toFixed(1)}` : l.vy.toFixed(1)} m/s</div>
          </div>

          {/* CELL 3: MAX Q DYNAMIC PRESSURE */}
          <div className={`avionics-cell ${isMaxQCrit ? 'cell-danger' : isMaxQWarn ? 'cell-warn' : ''}`}>
            <div className="cell-label">DYNAMIC PRESSURE (MAX Q)</div>
            <div className="cell-value-row">
              <span
                className={`cell-num ${isMaxQCrit ? 'text-red' : isMaxQWarn ? 'text-orange' : 'text-teal'}`}
              >
                {l.maxQ.toFixed(1)}
              </span>
              <span className="cell-unit">kPa</span>
            </div>
            <div className="cell-bar-wrap">
              <div
                className="cell-bar-fill"
                style={{
                  width: `${Math.min(100, (l.maxQ / 50) * 100)}%`,
                  background: isMaxQCrit ? '#ef4444' : isMaxQWarn ? '#f59e0b' : 'var(--teal)',
                }}
              />
            </div>
            <div className="cell-foot">
              LIMIT: 45.0 kPa ({isMaxQCrit ? 'CRITICAL' : isMaxQWarn ? 'CAUTION' : 'NOMINAL'})
            </div>
          </div>

          {/* CELL 4: CORRIDOR RADAR DEVIATION */}
          <div className={`avionics-cell ${isDevDanger ? 'cell-danger' : isDevWarn ? 'cell-warn' : ''}`}>
            <div className="cell-label">CORRIDOR DEVIATION</div>
            <div className="cell-value-row">
              <span className={`cell-num ${isDevDanger ? 'text-red' : isDevWarn ? 'text-orange' : 'text-teal'}`}>
                {l.deviation > 0 ? `+${l.deviation.toFixed(1)}` : l.deviation.toFixed(1)}
              </span>
              <span className="cell-unit">units</span>
            </div>
            {/* Visual radar track for corridor */}
            <div className="corridor-track-bar">
              <div className="corridor-safe-zone" />
              <div className="corridor-center-line" />
              <div className="corridor-cursor" style={{ left: `${devMeterPercent}%` }} />
            </div>
            <div className="cell-foot">SAFETY CORRIDOR: ±18.0 UNITS</div>
          </div>
        </div>
      </div>

      {/* 2. MECHANICAL FLIGHT LEVER QUADRANT */}
      <div className="levers-quadrant">
        {/* LEVER BAY 1: MAIN ENGINE THROTTLE LEVER */}
        <div className="lever-bay throttle-bay">
          <div className="lever-bay-header">
            <span className="lever-tag">THROTTLE / ENGINE THRUST</span>
            <div className="digital-readout-box">
              <span className="digital-glow">{l.throttle}</span>
              <small>%</small>
            </div>
          </div>

          <div className="throttle-mechanism-area">
            {/* Notches markings */}
            <div className="throttle-notches">
              <span className="notch-mark active-100">100% MAX</span>
              <span className="notch-mark">85% NOM</span>
              <span className="notch-mark">70% CRZ</span>
              <span className="notch-mark">55% IDLE</span>
            </div>

            {/* Vertical Throttle Track with Grip Handle */}
            <div
              className={`throttle-track-rail ${isDraggingThrottle ? 'dragging' : ''}`}
              ref={throttleTrackRef}
              onPointerDown={onThrottlePointerDown}
              onPointerMove={onThrottlePointerMove}
              onPointerUp={onThrottlePointerUp}
              title="Drag lever vertically to adjust engine throttle"
            >
              {/* Back LED fill bar */}
              <div
                className="throttle-led-bar"
                style={{
                  height: `${throttlePercent}%`,
                  background:
                    l.throttle >= 95
                      ? 'linear-gradient(180deg, #f87171, #f59e0b, #10b981)'
                      : l.throttle >= 80
                      ? 'linear-gradient(180deg, #f59e0b, #10b981)'
                      : 'linear-gradient(180deg, #34d399, #059669)',
                }}
              />

              {/* 3D Flight Throttle Grip Handle */}
              <div
                className="throttle-grip-handle"
                style={{
                  bottom: `calc(${throttlePercent}% - 18px)`,
                }}
              >
                <div className="grip-top-groove" />
                <div className="grip-core">
                  <span className="grip-indicator-led" />
                  <span className="grip-text">{l.throttle}%</span>
                </div>
                <div className="grip-ribs" />
              </div>
            </div>

            {/* Quick throttle notches buttons */}
            <div className="lever-quick-actions vertical">
              <button
                type="button"
                className={`quick-notch-btn ${l.throttle === 100 ? 'active' : ''}`}
                onClick={() => updateRange('throttle', 100)}
                disabled={l.cutoff}
              >
                100%
              </button>
              <button
                type="button"
                className={`quick-notch-btn ${l.throttle === 85 ? 'active' : ''}`}
                onClick={() => updateRange('throttle', 85)}
                disabled={l.cutoff}
              >
                85%
              </button>
              <button
                type="button"
                className={`quick-notch-btn ${l.throttle === 70 ? 'active' : ''}`}
                onClick={() => updateRange('throttle', 70)}
                disabled={l.cutoff}
              >
                70%
              </button>
              <button
                type="button"
                className={`quick-notch-btn ${l.throttle === 55 ? 'active' : ''}`}
                onClick={() => updateRange('throttle', 55)}
                disabled={l.cutoff}
              >
                55%
              </button>
            </div>
          </div>

          <div className="lever-sub-info">
            CURRENT TWR: <b style={{ color: 'var(--teal)' }}>{((b.twr * l.throttle) / 100).toFixed(2)}</b>
          </div>
        </div>

        {/* LEVER BAY 2: TVC PITCH GIMBAL LEVER */}
        <div className="lever-bay guidance-bay">
          <div className="lever-bay-header">
            <span className="lever-tag">TVC GIMBAL PITCH</span>
            <div className="digital-readout-box">
              <span className={`digital-glow ${l.guidance !== 0 ? 'text-teal' : ''}`}>
                {l.guidance > 0 ? `+${l.guidance}` : l.guidance}
              </span>
              <small>°</small>
            </div>
          </div>

          {/* TVC Gimbal Arrow Visualizer */}
          <div className="tvc-visualizer-box">
            <div className="tvc-scale-line">
              <span>◀ PORT (-25°)</span>
              <span className="center-point">0° CENTER</span>
              <span>STBD (+25°) ▶</span>
            </div>
            <div className="tvc-compass">
              <div
                className="tvc-needle"
                style={{
                  transform: `rotate(${l.guidance * 1.4}deg)`,
                }}
              />
              <div className="tvc-center-pivot" />
            </div>
          </div>

          {/* Horizontal Steering Lever Track */}
          <div
            className={`steering-track-rail ${isDraggingGuidance ? 'dragging' : ''}`}
            ref={guidanceTrackRef}
            onPointerDown={onGuidancePointerDown}
            onPointerMove={onGuidancePointerMove}
            onPointerUp={onGuidancePointerUp}
            title="Drag lever left/right to gimbal thrust vector"
          >
            {/* Center zero detent line */}
            <div className="track-center-notch" />

            {/* Steer Grip Handle */}
            <div
              className="steer-grip-handle"
              style={{
                left: `calc(${guidancePercent}% - 22px)`,
              }}
            >
              <div className="steer-handle-cap">
                <span className="steer-marker" />
              </div>
              <span className="steer-label">{l.guidance > 0 ? `+${l.guidance}°` : `${l.guidance}°`}</span>
            </div>
          </div>

          {/* Quick Steering Stepper Buttons */}
          <div className="lever-quick-actions horizontal">
            <button
              type="button"
              className="quick-step-btn"
              onClick={() => updateRange('guidance', Math.max(-25, l.guidance - 2))}
              disabled={l.cutoff}
            >
              ◀ GIMBAL PORT (-2°)
            </button>
            <button
              type="button"
              className="quick-step-btn center"
              onClick={() => updateRange('guidance', 0)}
              disabled={l.cutoff}
            >
              0° CENTER
            </button>
            <button
              type="button"
              className="quick-step-btn"
              onClick={() => updateRange('guidance', Math.min(25, l.guidance + 2))}
              disabled={l.cutoff}
            >
              GIMBAL STBD (+2°) ▶
            </button>
          </div>

          <div className="lever-sub-info">
            {l.deviation > 3 ? (
              <span className="text-orange">DRIFTING RIGHT → GIMBAL PORT TO COUNTERACT</span>
            ) : l.deviation < -3 ? (
              <span className="text-orange">DRIFTING LEFT → GIMBAL STARBOARD TO COUNTERACT</span>
            ) : (
              <span className="text-teal">FLIGHT VECTOR CENTERED ALONG CORRIDOR</span>
            )}
          </div>
        </div>

        {/* LEVER BAY 3: ROLL ATTITUDE TRIM LEVER */}
        <div className="lever-bay roll-bay">
          <div className="lever-bay-header">
            <span className="lever-tag">ROLL ATTITUDE TRIM</span>
            <div className="digital-readout-box">
              <span className="digital-glow">{l.roll > 0 ? `+${l.roll}` : l.roll}</span>
              <small>°</small>
            </div>
          </div>

          <div className="roll-dial-wrapper">
            <div className="roll-scale-notches">
              <span>-20° CCW</span>
              <span>0°</span>
              <span>+20° CW</span>
            </div>

            {/* Horizontal Roll Lever Track */}
            <div
              className={`steering-track-rail roll-track ${isDraggingRoll ? 'dragging' : ''}`}
              ref={rollTrackRef}
              onPointerDown={onRollPointerDown}
              onPointerMove={onRollPointerMove}
              onPointerUp={onRollPointerUp}
              title="Drag lever horizontally to trim roll attitude"
            >
              <div className="track-center-notch" />
              <div
                className="steer-grip-handle roll-handle"
                style={{
                  left: `calc(${rollPercent}% - 18px)`,
                }}
              >
                <div className="steer-handle-cap" style={{ background: '#38bdf8' }}>
                  <span className="steer-marker" />
                </div>
                <span className="steer-label">{l.roll > 0 ? `+${l.roll}°` : `${l.roll}°`}</span>
              </div>
            </div>

            <div className="lever-quick-actions horizontal">
              <button
                type="button"
                className="quick-step-btn"
                onClick={() => updateRange('roll', Math.max(-20, l.roll - 2))}
                disabled={l.cutoff}
              >
                ◀ -2°
              </button>
              <button
                type="button"
                className="quick-step-btn center"
                onClick={() => updateRange('roll', 0)}
                disabled={l.cutoff}
              >
                0°
              </button>
              <button
                type="button"
                className="quick-step-btn"
                onClick={() => updateRange('roll', Math.min(20, l.roll + 2))}
                disabled={l.cutoff}
              >
                +2° ▶
              </button>
            </div>
          </div>

          <div className="lever-sub-info">3-AXIS GYROSCOPIC ATTITUDE TRIM</div>
        </div>
      </div>

      {/* 3. MASTER IGNITION / FLIGHT EXECUTION PANEL */}
      <div className="cockpit-master-actions">
        {!l.ignited ? (
          <button
            type="button"
            className="master-ignition-btn"
            onClick={() => executeAction('ignite')}
          >
            <div className="ignition-safety-cap">● MASTER ARM: READY</div>
            <div className="ignition-main-label">
              <span>🚀 IGNITE RD-180 / LAUNCH SEQUENCE</span>
            </div>
            <div className="ignition-sub-label">INITIAL TWR: {b.twr.toFixed(2)} • INCREASE THROTTLE FOR ACCELERATION</div>
          </button>
        ) : (
          <div className="flight-active-banner">
            <div className="engine-flame-indicator">
              <span className="flame-pulse" />
              <strong>RD-180 ENGINES FIRING • PILOT ASCENT VECTOR TO 101 KM</strong>
            </div>
            <div className="flight-active-sub">
              Maintain thrust and gimbal steering within ±18 units corridor; throttle down if Max Q approaches 45 kPa.
            </div>
          </div>
        )}
      </div>

      {/* 4. GUIDANCE HINT BAR */}
      <div className={`hint-line ${!guidanceUnlocked ? 'guidance-locked' : ''}`} style={{ marginTop: 10 }}>
        Flight Directive: Advance throttle to <b>85–100%</b> to ensure liftoff acceleration. As dynamic pressure rises in dense atmospheric layers, throttle back slightly if Max Q nears 40 kPa, and keep guidance centered at 0°.
      </div>
    </div>
  );
};
