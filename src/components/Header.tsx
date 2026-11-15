'use client';

import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { PHASES } from '../lib/constants';

export const Header: React.FC = () => {
  const { state, soundOn, toggleSound, setActiveModal } = useGame();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // ignore
    }
  };

  const currentPhase = PHASES.find((p) => p.id === state.phase);
  const phaseTitle = currentPhase ? currentPhase.name.toUpperCase() : 'MISSION FINALIZED';
  const stepTitle = state.phase === 'end' ? 'TERMINATED' : `MISSION CLOCK T+${Math.floor(state.elapsed)}s`;

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">✳</span>
        <div>
          <strong>
            ARES<span className="brand-accent">/</span>MISSION
          </strong>
          <small>DEEP SPACE OPERATIONS • GAME SIMULATION</small>
        </div>
      </div>

      <div className="top-center">
        <span className="live-dot"></span>
        <span id="topPhase">{phaseTitle}</span>
        <span className="top-separator">/</span>
        <span id="topStep">{stepTitle}</span>
      </div>

      <div className="top-actions">
        <span className="tag-muted" id="topClock">
          MOR–28–01 • 08 NOV 2028
        </span>
        <button
          className="icon-btn"
          id="audioBtn"
          onClick={toggleSound}
          title="Toggle audio"
        >
          {soundOn ? '♫' : '♪'}
        </button>
        <button
          className="icon-btn"
          id="fullscreenBtn"
          onClick={toggleFullscreen}
          title="Toggle fullscreen"
        >
          {isFullscreen ? '⤢' : '⛶'}
        </button>
        <button
          className="icon-btn"
          id="helpBtn"
          onClick={() => setActiveModal('help')}
          title="Flight Manual"
        >
          ?
        </button>
        <button
          className="outline-btn"
          id="restartBtn"
          onClick={() => setActiveModal('confirm-restart')}
          title="Restart simulation"
        >
          ↺ RESTART
        </button>
      </div>
    </header>
  );
};
