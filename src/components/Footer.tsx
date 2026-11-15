'use client';

import React from 'react';
import { useGame } from '../context/GameContext';

export const Footer: React.FC = () => {
  const { state } = useGame();
  const latestMessage = state.logs[0]?.msg || 'AWAITING FLIGHT DIRECTOR AUTHORIZATION';

  return (
    <footer className="statusbar">
      <span>
        <i className="live-dot"></i> MISSION OPERATIONS CENTER
      </span>
      <span id="footerMessage">{latestMessage}</span>
      <span>SIMULATION BUILD 3.0 • NEXT.JS / NASA GLB / OFFLINE READY</span>
    </footer>
  );
};
