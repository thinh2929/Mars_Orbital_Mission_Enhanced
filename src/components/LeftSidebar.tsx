'use client';

import React from 'react';
import { useGame } from '../context/GameContext';
import { PHASES } from '../lib/constants';

export const LeftSidebar: React.FC = () => {
  const { state } = useGame();
  const phaseIdx = PHASES.findIndex((p) => p.id === state.phase);
  const isMissionSuccess = state.phase === 'end' && state.mission.result === 'success';

  return (
    <aside className="sidebar left-panel">
      <div className="sidebar-inner">
        <div className="eyebrow">FLIGHT DIRECTOR CONSOLE</div>
        <h2 className="sidebar-head">
          Tổng quan nhiệm vụ
          <span className="micro-status">● UPLINK ACTIVE</span>
        </h2>
        <div className="section-rule"></div>

        <div className="mission-label">CHIẾN DỊCH</div>
        <strong className="mission-name">
          MARS ORBITAL<br />RECONNAISSANCE
        </strong>
        <div className="small-meta">
          MISSION ID <b>MOR–28–01</b>
          <br />
          LAUNCH DATE <b>08 NOV 2028</b>
        </div>
        <div className="section-rule"></div>

        <div className="mission-label">MISSION PROGRESSION</div>
        <div id="timeline" className="timeline">
          {PHASES.map((p, idx) => {
            const isDone = phaseIdx > idx || isMissionSuccess;
            const isActive = phaseIdx === idx && !isMissionSuccess;
            return (
              <div
                key={p.id}
                className={`timeline-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
              >
                <div className="timeline-node">
                  {isDone ? '✓' : idx + 1}
                </div>
                <div>
                  <div className="timeline-label">{p.name}</div>
                  <div className="timeline-note">{p.note}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="section-rule"></div>

        <div className="mission-label">
          FLIGHT EVENTS <span className="live-small">LIVE</span>
        </div>
        <div id="eventLog" className="event-log">
          {state.logs.length === 0 ? (
            <div className="log-item">Chưa có sự kiện nào.</div>
          ) : (
            state.logs.slice(0, 8).map((log, i) => (
              <div
                key={i}
                className={`log-item ${
                  log.kind === 'good' ? 'event-good' : log.kind === 'warn' ? 'event-warn' : ''
                }`}
              >
                <span className="log-time">T+{log.time} s</span>
                {log.msg}
              </div>
            ))
          )}
        </div>

        <div className="side-bottom">
          <span className="status-light"></span>
          <span id="systemStatus">
            {state.phase === 'end'
              ? state.mission.result === 'success'
                ? 'MISSION COMPLETED'
                : 'MISSION TERMINATED'
              : 'ALL SYSTEMS STANDBY'}
          </span>
        </div>
      </div>
    </aside>
  );
};
