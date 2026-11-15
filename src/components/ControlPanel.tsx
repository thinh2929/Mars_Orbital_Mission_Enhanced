'use client';

import React from 'react';
import { useGame } from '../context/GameContext';
import { SLOTS, LAUNCHERS, TARGET_REGIONS } from '../lib/constants';
import { Physics } from '../lib/physics';
import { LaunchCockpit } from './LaunchCockpit';

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
    assembly: 'Spacecraft Assembly & Launcher Selection',
    launch: 'Main Engine Thrust & Ascent Guidance',
    separation: 'Stage Separation & Centaur Deployment',
    parking: 'Centaur Earth Parking Orbit Burn',
    tmi: 'Trans-Mars Injection & MRO Deployment',
    cruise: 'Interplanetary Trajectory Navigation',
    capture: 'Mars Orbit Insertion & Circularization',
    science: 'Science Reconnaissance & Earth Downlink',
    end: 'Mission Debrief & Flight Evaluation',
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
          01 / SPACECRAFT MODULES
        </button>
        <button
          className={state.buildTab === 'rocket' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setBuildTab('rocket')}
        >
          02 / LAUNCH VEHICLE
        </button>
        <button
          className={state.buildTab === 'test' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setBuildTab('test')}
        >
          03 / PREFLIGHT CHECK
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
                SLOT {f + 1} — {sl.desc.toUpperCase()}. Select configuration to balance mass, power, and mission risk.
              </div>
              <div className="control-grid">
                {choices.map((opt, j) => (
                  <button
                    key={j}
                    className={`choice-card ${state.slot[f] === j ? 'selected' : ''}`}
                    onClick={() => setSlotChoice(f, j)}
                  >
                    <span className="grade">
                      OPTION {'ABC'[j]} • {opt.kind}
                    </span>
                    <b>{opt.name}</b>
                    <small>{opt.description}</small>
                    <span className="metric">{opt.detail}</span>
                  </button>
                ))}
              </div>
              <div className="details-note">
                <b>RISK FACTOR: </b>
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
            Atlas V-401 is the documented baseline; alternative options provide fictional gameplay balancing.
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
            Selected <b>{b.launcher.name}</b> • TWR: {b.twr.toFixed(2)} • FAIRING Ø {b.launcher.fairing.toFixed(1)} m.
          </div>
        </div>
      );
    }

    const checks: [string, boolean, string][] = [
      ['Payload Wet Mass', b.weightOK, `${fmt(b.mass)} / ${fmt(b.launcher.max)} kg`],
      [
        'Fairing',
        b.fairingOK,
        `stowed ${b.stowedWidth.toFixed(2)} m / usable ${(b.launcher.fairing - 0.14).toFixed(2)} m`,
      ],
      ['Mission Budget', b.priceOK, `${money(b.cost)} / ${money(state.budget)}`],
      ['TWR', b.twr > 1.05, `${b.twr.toFixed(2)} (>1.05)`],
      [
        'Electrical Power',
        true,
        b.powerOK ? `${b.gen} W ≥ ${b.draw} W` : `${b.gen} W < ${b.draw} W; instrument scheduling required`,
      ],
      ['Structural Integrity', true, 'Stowed aero-acoustic tolerances: nominal'],
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
              ? 'Warning: Insufficient power for concurrent instrument operations. Radar must be powered down during imaging exposures.'
              : 'Electrical power margins nominal.'}
            <br />
            Spacecraft wet mass includes 892 kg base bus, modular science payloads, and hydrazine propellant.
          </p>
          <button
            className="btn-primary"
            disabled={!canPreflight}
            onClick={() => executeAction('preflight')}
          >
            VERIFY PREFLIGHT &amp; LAUNCH
          </button>
        </div>
      </div>
    );
  };

  const renderLaunchControls = () => {
    return (
      <LaunchCockpit
        launch={l}
        build={b}
        guidanceUnlocked={guidanceUnlocked}
        updateRange={updateRange}
        executeAction={executeAction}
      />
    );
  };

  const renderSeparationControls = () => {
    const sep = state.sep;
    let actionBtn = (
      <button className="btn-primary" onClick={() => executeAction('stage-sep')}>
        CONFIRM STAGE 1 SEPARATION
      </button>
    );

    if (sep.stage && !sep.centaur) {
      actionBtn = (
        <button className="btn-primary" onClick={() => executeAction('centaur-ignite')}>
          IGNITE CENTAUR RL-10 ENGINE
        </button>
      );
    } else if (sep.centaur && !sep.fairing) {
      actionBtn = (
        <button className="btn-primary" onClick={() => executeAction('fairing-sep')}>
          JETTISON FAIRING
        </button>
      );
    } else if (sep.stage && sep.centaur && sep.fairing) {
      actionBtn = (
        <button className="btn-primary" onClick={() => executeAction('to-parking')}>
          PROCEED: PARKING ORBIT INSERTION →
        </button>
      );
    }

    return (
      <div>
        <p className="control-description">
          Sequence: MECO → Booster Jettison → Centaur Ignition → Fairing Jettison once above 101 km.
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
            ✓ Parking orbit confirmed: Perigee {o.peri.toFixed(1)} km • Apogee {o.apo.toFixed(1)} km.
          </div>
          <button className="btn-primary" onClick={() => executeAction('to-tmi')}>
            PROCEED: TRANS-MARS INJECTION →
          </button>
        </div>
      );
    }

    return (
      <div>
        <p className="control-description">
          Centaur upper stage burn into <b>148 × 185 km</b> parking orbit. Shaded green zone denotes target orbit. Adjust
          burn Δv and gimbal pitch angle.
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
              <span>GIMBAL PITCH ANGLE</span>
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
            EXECUTE PARKING BURN →
          </button>
        </div>

        <div className={`hint-line ${!guidanceUnlocked ? 'guidance-locked' : ''}`}>
          Guidance targets: <b>335 m/s</b> • <b>0°</b>. Off-nominal burns result in suborbital decay or excessive apogee.
        </div>
      </div>
    );
  };

  const renderTMIControls = () => {
    if (t.complete) {
      return (
        <div>
          <div className="alert-card good">
            ✓ Earth parking orbit departure confirmed. Centaur MECO; MRO spacecraft ready for separation.
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
              {t.detached ? 'PROCEED TO CRUISE →' : 'SEPARATE MRO SPACECRAFT'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <p className="control-description">
          Second Centaur burn (TMI) injects spacecraft into trans-Mars trajectory. Cutoff before MRO deployment
          MRO.
        </p>
        <div className="flight-controls">
          <div className="range-group">
            <label htmlFor="tmi-burn">
              <span>TMI INJECTION Δv</span>
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
              <span>INJECTION PITCH ANGLE</span>
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
            EXECUTE TMI BURN
          </button>
        </div>

        <div className={`hint-line ${!guidanceUnlocked ? 'guidance-locked' : ''}`}>
          Target parameters: <b>3,150 m/s • 0°</b>. Remaining Centaur propellant: {fmt(t.fuel)} kg.
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
              DEPLOY SOLAR ARRAYS (POST-SEP)
            </button>
          )}
          {!s.antenna && (
            <button className="btn-primary" onClick={() => executeAction('antenna')}>
              DEPLOY HIGH-GAIN ANTENNA
            </button>
          )}
          <span className="small-choice active">
            PIN {Math.round(powerFraction() * 100)}% • {Math.round(s.batteryWh)} Wh
          </span>
        </div>
        {!s.solar && (
          <div className="alert-card bad" style={{ marginTop: 8 }}>
            <b>POWER ALERT:</b> Solar arrays un-deployed. Battery reserves draining.
          </div>
        )}
      </div>
    );

    if (cr.corrected) {
      return (
        <div>
          {earlyOps}
          <div className="alert-card good">
            ✓ Course correction verified: Projected encounter miss distance {fmt(cr.miss)} km.
          </div>
          <button className="btn-primary" onClick={() => executeAction('to-capture')}>
            APPROACH MARS: ORBIT INSERTION →
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
          Trim trajectory errors prior to Mars encounter. Combine <b>along-track</b> and <b>cross-track</b> delta-V burns
          to intercept target arrival corridor.
        </p>
        <div className="flight-controls">
          <div className="range-group">
            <label htmlFor="along">
              <span>ALONG-TRACK Δv</span>
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
              <span>CROSS-TRACK Δv</span>
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
            EXECUTE TRAJECTORY CORRECTION
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
            <div style={{ color: '#8aa3b5', fontSize: 9, fontWeight: 700 }}>ALONG-TRACK DEV</div>
            <strong className={Math.abs(alongDev) <= 1 ? 'status-good' : 'status-warn'}>
              {alongDev > 0 ? '+' : ''}{alongDev} m/s ({alongKm.toLocaleString('en-US')} km)
            </strong>
          </div>
          <div>
            <div style={{ color: '#8aa3b5', fontSize: 9, fontWeight: 700 }}>CROSS-TRACK DEV</div>
            <strong className={Math.abs(lateralDev) <= 1 ? 'status-good' : 'status-warn'}>
              {lateralDev > 0 ? '+' : ''}{lateralDev} m/s ({lateralKm.toLocaleString('en-US')} km)
            </strong>
          </div>
          <div>
            <div style={{ color: '#8aa3b5', fontSize: 9, fontWeight: 700 }}>PROJECTED MISS DISTANCE</div>
            <strong className={totalMiss <= 45000 ? 'status-good' : 'status-bad'}>
              {totalMiss.toLocaleString('en-US')} km{' '}
              <small style={{ fontSize: 9, opacity: 0.8 }}>(Target &lt; 45,000 km)</small>
            </strong>
          </div>
        </div>

        <div className={`hint-line ${!guidanceUnlocked ? 'guidance-locked' : ''}`}>
          Navigator advisory: <b>Along-track Δv ≈ {tgt.along} m/s</b>, <b>Cross-track Δv ≈ {tgt.lateral} m/s</b>. Excessive miss distance risks hyperbolic Mars flyby escape.
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
            MRO approaching Mars: execute Mars Orbit Insertion (MOI). Off-nominal burn causes planetary impact or hyperbolic escape.
          </p>
          <div className="flight-controls">
            <div className="range-group">
              <label htmlFor="capture-burn">
                <span>DECELERATION Δv</span>
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
                <span>GIMBAL VECTOR DEVIATION</span>
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
              EXECUTE MOI BURN
            </button>
          </div>

          <div className={`hint-line ${!guidanceUnlocked ? 'guidance-locked' : ''}`}>
            Nominal targets: <b>940 m/s</b> • 0° pitch • {fmt(s.prop)} kg MRO hydrazine remaining.
          </div>
        </div>
      );
    }

    if (c.passes < need) {
      return (
        <div>
          {powerBus}
          <div className="alert-card">
            Elliptical capture orbit confirmed: apoapsis {fmt(c.apo)} km. Complete at least <b>{need} aerobraking passes</b>
            {state.slot[3] === 1 ? ' (75% tank mandates additional passes)' : ''}. Periapsis below safe corridor will thermally destroy solar array hinges.
          </div>
          <div className="flight-controls">
            <div className="range-group">
              <label htmlFor="peri">
                <span>AEROBRAKING PERIAPSIS</span>
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
              EXECUTE AEROBRAKE PASS
            </button>
          </div>

          <div className={`hint-line ${!guidanceUnlocked ? 'guidance-locked' : ''}`}>
            Safe operational corridor: <b>140–165 km</b>; periapsis below 130 km poses severe thermal risk.
          </div>
        </div>
      );
    }

    return (
      <div>
        {powerBus}
        <div className="alert-card good">
          ✓ Completed {c.passes} aerobraking passes. Current apoapsis ~{fmt(c.apo)} km. Circularize spacecraft into 300 km polar science orbit.
        </div>
        <div className="flight-controls triple">
          <div className="range-group">
            <label htmlFor="trim">
              <span>CIRCULARIZATION Δv</span>
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
              <span>ORBITAL INCLINATION</span>
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
            CONFIRM SCIENCE ORBIT →
          </button>
        </div>

        <div className={`hint-line ${!guidanceUnlocked ? 'guidance-locked' : ''}`}>
          Success criteria: Altitude <b>300 ± 25 km</b>, inclination <b>93 ± 2°</b>. Shaded green zone = target science orbit.
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
            DEPLOY SOLAR ARRAYS
          </button>
        )}
        {!s.antenna && (
          <button className="btn-primary" onClick={() => executeAction('antenna')}>
            DEPLOY HIGH-GAIN ANTENNA
          </button>
        )}
        <button className="btn-secondary" onClick={() => executeAction('radar-toggle')}>
          {s.radarActive ? 'DISABLE RADAR (SAVE POWER)' : 'ENABLE SHARAD RADAR'}
        </button>
        {state.slot[0] === 0 && (
          <button className="btn-secondary" onClick={() => executeAction('crism-toggle')}>
            {s.crismActive !== false ? 'DISABLE CRISM (STOP VIBRATION)' : 'ENABLE CRISM'}
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
        Bus Power: <b>{draw} / {b.gen} W</b>{' '}
        {powerOK ? (
          <span className="status-good">• nominal</span>
        ) : (
          <span className="status-bad">• BUS OVERLOAD</span>
        )}{' '}
        • SSR Storage: <b>{usedMemory().toFixed(1)} / {opts[4].memory} GB</b>. Downlinked{' '}
        <b>
          {s.returned.length} / {targetPhotos}
        </b>{' '}
        images (SSR capacity: {maxPhotos} images).
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
                  ? `SSR BUFFER FULL (${s.images.length}/${maxPhotos} FRAMES) • DOWNLINK REQUIRED`
                  : `EXPOSE CAMERA • ${imageSize.toFixed(1)} GB (${s.images.length}/${maxPhotos} FRAMES)`}
              </button>
              <span className="hint-line">
                Imagery downlinked from actual NASA MRO science datasets.
              </span>
            </div>
          </div>
        ) : (
          <div>
            <div className="alert-card good">
              Stored {s.images.length}/{maxPhotos} images (downlinked {s.returned.length}/{targetPhotos} images). {opts[4].name} dish. Telemetry rate: up to {opts[4].rate} GB/pass.
            </div>
            <button
              className="btn-primary"
              disabled={!s.antenna || !s.solar || !s.images.some((x) => !s.returned.some((r) => r.id === x.id))}
              onClick={() => executeAction('transmit')}
            >
              DOWNLINK DATA VIA DSN ({s.returned.length}/{targetPhotos} COMPLETE)
            </button>
            <div className="hint-line">
              Continue transmitting image packets across DSN ground station passes until complete.
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
        <p className="control-description">Flight controls locked. Simulation finalized.</p>
        <button className="btn-primary" onClick={() => setActiveModal('end-report')}>
          VIEW MISSION REPORT
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
            ◉ GUIDANCE UNLOCKED — flight failed {attempts} times at this stage. Advisory navigation telemetry online.
          </div>
        )}
      </div>
    </div>
  );
};
