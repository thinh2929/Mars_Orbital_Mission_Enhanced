'use client';

import React from 'react';
import { useGame } from '../context/GameContext';
import { Mars3DView } from './Mars3DView';

export const IntroOverlay: React.FC = () => {
  const { activeModal, startMission, continueMission, hasSavedGame } = useGame();

  if (activeModal !== 'intro') return null;

  return (
    <div id="introOverlay" className="intro-overlay">
      <div className="intro-shade"></div>
      <div className="intro-mars-3d-wrapper">
        <Mars3DView />
      </div>
      <div className="intro-content">
        <div className="intro-top">
          <span className="intro-icon">✳</span> UNITED STATES • SPACE EXPLORATION INITIATIVE{' '}
          <span className="redacted">/ CLASSIFIED BRIEFING</span>
        </div>
        <div className="intro-serial">DIRECTIVE 001 / 15.09.2028</div>
        <div className="intro-hairline"></div>
        <div className="intro-super">THE NEXT FRONTIER</div>
        <h1>
          MARS
          <br />
          <em>ORBITAL</em>
          <br />
          MISSION<span className="title-dot">.</span>
        </h1>
        <p>
          Congress has authorized a fictional <strong>$100 billion investment</strong> for the Mars exploration initiative.
          You are appointed Flight Director and Lead Systems Engineer: configure the orbiter, select the launch vehicle,
          pilot the interplanetary trajectory, and insert the spacecraft into Mars science orbit.
        </p>
        <div className="intro-stats">
          <div>
            <small>DESTINATION</small>
            <b>MARS ORBIT</b>
          </div>
          <div>
            <small>REFERENCE BUS</small>
            <b>NASA MRO</b>
          </div>
          <div>
            <small>LAUNCH WINDOW</small>
            <b>08 NOV 2028</b>
          </div>
        </div>
        <div className="intro-buttons">
          <button id="startBtn" className="btn-primary btn-start" onClick={startMission}>
            INITIALIZE MISSION <span>↗</span>
          </button>
          {hasSavedGame && (
            <button id="continueBtn" className="btn-secondary" onClick={continueMission}>
              RESUME MISSION →
            </button>
          )}
        </div>
        <div className="intro-disclaimer">
          GOVERNMENTAL CAMPAIGN SCENARIO AND LAUNCH DATES ARE FICTIONAL • PHYSICS-INSPIRED EDUCATIONAL GAME (NEXT.JS EDITION)
        </div>
      </div>
      <div className="intro-right-caption">
        MOR–28–01
        <br />
        DEEP SPACE SIMULATION
        <br />
        EARTH → MARS
      </div>
    </div>
  );
};
