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
          Chính phủ phê duyệt khoản đầu tư giả tưởng <strong>100 tỷ USD</strong> cho chương trình khám phá Sao Hỏa. Bạn
          được bổ nhiệm làm kỹ sư trưởng nhiệm vụ: thiết kế vệ tinh, lựa chọn phương tiện phóng, điều khiển hành trình và
          đưa tàu vào quỹ đạo mục tiêu.
        </p>
        <div className="intro-stats">
          <div>
            <small>ĐIỂM ĐẾN</small>
            <b>MARS ORBIT</b>
          </div>
          <div>
            <small>VỆ TINH THAM CHIẾU</small>
            <b>NASA MRO</b>
          </div>
          <div>
            <small>PHÓNG</small>
            <b>08 NOV 2028</b>
          </div>
        </div>
        <div className="intro-buttons">
          <button id="startBtn" className="btn-primary btn-start" onClick={startMission}>
            BẮT ĐẦU NHIỆM VỤ <span>↗</span>
          </button>
          {hasSavedGame && (
            <button id="continueBtn" className="btn-secondary" onClick={continueMission}>
              TIẾP TỤC NHIỆM VỤ →
            </button>
          )}
        </div>
        <div className="intro-disclaimer">
          KỊCH BẢN CHÍNH PHỦ VÀ NGÀY PHÓNG LÀ HƯ CẤU • PHYSICS-INSPIRED EDUCATIONAL GAME (NEXT.JS EDITION)
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
