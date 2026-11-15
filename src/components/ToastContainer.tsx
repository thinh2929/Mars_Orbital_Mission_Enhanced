'use client';

import React from 'react';
import { useGame } from '../context/GameContext';

export const ToastContainer: React.FC = () => {
  const { toasts } = useGame();

  return (
    <div id="toastContainer" className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.kind === 'warn' ? 'warn' : t.kind === 'bad' ? 'bad' : ''}`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
};
