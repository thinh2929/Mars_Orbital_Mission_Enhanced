'use client';

import React from 'react';
import { GameProvider } from '../context/GameContext';
import { Header } from '../components/Header';
import { LeftSidebar } from '../components/LeftSidebar';
import { RightSidebar } from '../components/RightSidebar';
import { SimulationCanvas } from '../components/SimulationCanvas';
import { ControlPanel } from '../components/ControlPanel';
import { Footer } from '../components/Footer';
import { IntroOverlay } from '../components/IntroOverlay';
import { Modal } from '../components/Modal';
import { ToastContainer } from '../components/ToastContainer';

export default function Home() {
  return (
    <GameProvider>
      <div id="app">
        <Header />
        <div className="workspace">
          <LeftSidebar />
          <main className="main-panel">
            <SimulationCanvas />
            <ControlPanel />
          </main>
          <RightSidebar />
        </div>
        <Footer />
      </div>

      <IntroOverlay />
      <Modal />
      <ToastContainer />
    </GameProvider>
  );
}
