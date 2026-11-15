'use client';

import React from 'react';
import { useGame } from '../context/GameContext';
import { getEndingDetails } from '../lib/endings';
import { TARGET_REGIONS, ASSETS } from '../lib/constants';

export const Modal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    state,
    build,
    resetMission,
    retryStage,
    photoCapacity,
  } = useGame();

  if (activeModal === 'none' || activeModal === 'intro') return null;

  const closeModal = () => setActiveModal('none');

  if (activeModal === 'confirm-restart') {
    return (
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-card">
          <div className="modal-topline">MISSION OPERATIONS</div>
          <h2>Initialize New Mission?</h2>
          <p>Current flight telemetry and progress will be reset. You will return to the Spacecraft Assembly console.</p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={closeModal}>
              CANCEL
            </button>
            <button
              className="btn-danger"
              onClick={() => {
                closeModal();
                resetMission();
              }}
            >
              CONFIRM RESTART
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeModal === 'help') {
    return (
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-card manual">
          <div className="modal-topline">MOR–28 / FLIGHT MANUAL</div>
          <h2>Mission Flight Manual</h2>
          <p>
            Welcome to the <b>Mars Orbital Mission</b> flight simulator. Every design choice and guidance command directly impacts real-time spacecraft telemetry. Authorize operations only when system pre-requisites are nominal.
          </p>
          <ol>
            <li>
              <b>Assembly:</b> Select 1 of 3 options across 5 spacecraft module slots, choose an Atlas V or heavy launcher, and verify preflight checks.
            </li>
            <li>
              <b>Ascent:</b> Adjust throttle to maintain liftoff TWR &gt; 1.0; steer pitch toward guidance corridor. Reach 101 km altitude without exceeding Max Q (45 kPa).
            </li>
            <li>
              <b>Separation:</b> Await booster MECO at 101 km, jettison stage 1 booster, ignite Centaur RL-10, and jettison payload fairing.
            </li>
            <li>
              <b>Parking &amp; TMI:</b> Calibrate upper stage burn delta-V and gimbal pitch according to target corridor indicators.
            </li>
            <li>
              <b>Cruise Navigation:</b> Execute midcourse trajectory trim burns (along-track and cross-track) to reduce Mars encounter miss distance below 70,000 km.
            </li>
            <li>
              <b>Mars Capture:</b> Execute Mars Orbit Insertion (MOI) retro-burn into capture orbit, complete aerobraking passes through upper atmosphere, and execute circularization burn.
            </li>
            <li>
              <b>Science Operations:</b> Deploy solar arrays and High-Gain Antenna. Balance power and memory to expose science payloads and downlink imaging data to Earth (capacity depends on SSR storage and payload optics).
            </li>
            <li>
              <b>Power Management:</b> Deploy solar wings and HGA boom during early cruise; monitor battery state of charge (SoC), eclipse passes, and aerobraking thermal dissipation limits.
            </li>
            <li>
              <b>Mission Outcomes:</b> Multiple success and failure outcomes. Terminated flights provide causal telemetry analysis, post-incident reviews, and mitigation recommendations.
            </li>
          </ol>
          <p>
            <b style={{ color: '#cadde8' }}>Dashed / shaded zones</b> denote target corridors. <b style={{ color: '#7de4cf' }}>Solid lines</b> trace real-time flight vectors. Orbital tolerances and costs are simplified educational models.
          </p>
          <div className="modal-actions">
            <button className="btn-primary" onClick={closeModal}>
              ACKNOWLEDGE
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeModal === 'end-report') {
    const good = state.mission.result === 'success';
    const e = getEndingDetails(state);
    const c = state.capture;
    const s = state.sat;
    const b = build;
    const cap = photoCapacity();
    const targetPhotos = cap?.targetPhotos || 3;
    const money = (n: number) => (n / 1000).toFixed(2) + 'B';

    return (
      <div className="modal" role="dialog" aria-modal="true">
        <div className={`modal-card end-report ${good ? 'success' : 'failure'}`}>
          <div className="modal-topline">{e.headline}</div>
          <h2>{e.name}</h2>
          <p className="end-intro">
            {good
              ? 'Congratulations: Mars reconnaissance telemetry and imaging downlink verified by Deep Space Network.'
              : `Flight operations terminated during: ${state.mission.failurePhase || 'Mars Mission'}`}
          </p>

          <div className="mission-summary">
            <div className="summary-cell">
              <small>EVALUATION</small>
              <strong className={good ? 'status-good' : 'status-bad'}>{e.badge}</strong>
            </div>
            <div className="summary-cell">
              <small>MARS ORBIT</small>
              <strong>{c.finalized ? c.finalAlt.toFixed(1) + ' km' : 'UNREACHED'}</strong>
            </div>
            <div className="summary-cell">
              <small>DOWNLINKED</small>
              <strong>{s.returned.length} / {targetPhotos}</strong>
            </div>
            <div className="summary-cell">
              <small>MISSION SCORE</small>
              <strong>{good ? state.mission.score + '/100' : '—'}</strong>
            </div>
          </div>

          {!good && (
            <div className="alert-card bad">
              <strong>ROOT CAUSE TELEMETRY</strong>
              <p>{state.mission.reason}</p>
            </div>
          )}

          <div className="end-analysis">
            <section>
              <h3>{good ? 'MISSION SUCCESS ANALYSIS' : 'ANOMALY POST-MORTEM'}</h3>
              <p>{e.analysis}</p>
            </section>
            <section>
              <h3>{good ? 'MISSION ENHANCEMENTS' : 'FAILURE MITIGATION'}</h3>
              <p>{e.advice}</p>
            </section>
          </div>

          <div className="end-metrics">
            <span>
              MRO PROPELLANT: <b>{Math.max(0, s.prop).toFixed(0)} kg</b>
            </span>
            <span>
              BATTERY STORAGE: <b>{Math.round(s.batteryWh || 0)} Wh</b>
            </span>
            <span>
              MAX Q LOAD: <b>{state.launch.maxQ.toFixed(1)} kPa</b>
            </span>
            <span>
              TOTAL BUDGET: <b>${money(b.cost)}</b>
            </span>
          </div>

          {good && s.returned.length > 0 && (
            <div>
              <div className="eyebrow" style={{ marginTop: 16 }}>
                SCIENCE DOWNLINK / MARS SURFACE
              </div>
              <div className="gallery">
                {s.returned.map((x) => (
                  <figure key={x.id}>
                    <img
                      src={
                        (ASSETS as Record<string, string>)['mars' + (x.region + 1)] ||
                        ASSETS.mars1
                      }
                      alt={`Mars surface frame region ${x.region + 1}`}
                    />
                    <figcaption>
                      IMAGE {String(x.id).padStart(2, '0')} • {TARGET_REGIONS[x.region]?.name || 'Mars'} • RECEIVED
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}

          <div className="modal-actions">
            {!good && (
              <button
                className="btn-primary"
                id="retryStage"
                onClick={() => {
                  retryStage();
                }}
              >
                ↻ RETRY THIS STAGE
              </button>
            )}
            <button className="btn-secondary" onClick={closeModal}>
              REVIEW FLIGHT LOGS
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                closeModal();
                resetMission();
              }}
            >
              NEW MISSION / RECONFIGURE
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
