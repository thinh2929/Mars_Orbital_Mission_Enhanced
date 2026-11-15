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
  } = useGame();

  if (activeModal === 'none' || activeModal === 'intro') return null;

  const closeModal = () => setActiveModal('none');

  if (activeModal === 'confirm-restart') {
    return (
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-card">
          <div className="modal-topline">MISSION OPERATIONS</div>
          <h2>Bắt đầu nhiệm vụ mới?</h2>
          <p>Tiến trình cũ sẽ bị thay thế. Bạn sẽ quay lại màn hình lắp ráp vệ tinh.</p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={closeModal}>
              HỦY
            </button>
            <button
              className="btn-danger"
              onClick={() => {
                closeModal();
                resetMission();
              }}
            >
              KHỞI ĐỘNG LẠI
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
          <div className="modal-topline">MOR–28 / FIELD MANUAL</div>
          <h2>Sổ tay điều khiển</h2>
          <p>
            Đây là trò chơi <b>mission-based 2D</b>. Mỗi quyết định thay đổi điều kiện qua màn hình trạm điều khiển. Chỉ
            thực hiện lệnh ở thanh dưới khi hệ thống đã sẵn sàng.
          </p>
          <ol>
            <li>
              <b>Assembly:</b> chọn một trong 3 biến thể ở mỗi 5 khe, chọn tên lửa và hoàn thành preflight.
            </li>
            <li>
              <b>Launch:</b> throttle phải cho TWR &gt; 1; góc lái tốt là 0° so với guidance. Đạt 101 km và không vượt Max
              Q.
            </li>
            <li>
              <b>Separation:</b> chờ MECO rồi tách tầng 1, khởi động RL-10, tách fairing.
            </li>
            <li>
              <b>Parking &amp; TMI:</b> dùng slider burn Δv và góc lái, so với guidance của màn hình.
            </li>
            <li>
              <b>Cruise:</b> hiệu chỉnh Δv dọc và ngang để điểm tiếp cận Mars đủ gần.
            </li>
            <li>
              <b>Mars capture:</b> phanh MOI, thực hiện aerobraking ở periapsis an toàn rồi circularization.
            </li>
            <li>
              <b>Science:</b> mở solar arrays, mở antenna, quản lý điện. Chụp và truyền ảnh về Trái Đất (số ảnh tùy thuộc dung lượng bộ nhớ SSR và loại máy ảnh).
            </li>
            <li>
              <b>Năng lượng:</b> sau khi tách vệ tinh, mở cánh pin và ăng-ten ngay trong giai đoạn Cruise; chú ý % pin,
              vùng tối và rủi ro hãm khí quyển.
            </li>
            <li>
              <b>Ending:</b> có nhiều good/bad ending. Kết thúc thất bại sẽ ghi nguyên nhân trực tiếp, phân tích kỹ thuật
              và cách tránh.
            </li>
          </ol>
          <p>
            Đường <b style={{ color: '#cadde8' }}>đứt mờ</b> là tuyến mục tiêu. Đường{' '}
            <b style={{ color: '#7de4cf' }}>liền xanh</b> là tuyến thực tế. Ngưỡng quỹ đạo và giá cả trong game là mô
            hình đơn giản hóa; không phải phương trình điều khiển nhiệm vụ MRO thực.
          </p>
          <div className="modal-actions">
            <button className="btn-primary" onClick={closeModal}>
              ĐÃ HIỂU
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
    const money = (n: number) => (n / 1000).toFixed(2) + 'B';

    return (
      <div className="modal" role="dialog" aria-modal="true">
        <div className={`modal-card end-report ${good ? 'success' : 'failure'}`}>
          <div className="modal-topline">{e.headline}</div>
          <h2>{e.name}</h2>
          <p className="end-intro">
            {good
              ? 'Chúc mừng: dữ liệu nghiên cứu đã được Trái Đất xác nhận.'
              : `Nhiệm vụ đã dừng tại: ${state.mission.failurePhase || 'Nhiệm vụ Sao Hỏa'}`}
          </p>

          <div className="mission-summary">
            <div className="summary-cell">
              <small>ENDING</small>
              <strong className={good ? 'status-good' : 'status-bad'}>{e.badge}</strong>
            </div>
            <div className="summary-cell">
              <small>QUỸ ĐẠO MARS</small>
              <strong>{c.finalized ? c.finalAlt.toFixed(1) + ' km' : 'CHƯA ĐẠT'}</strong>
            </div>
            <div className="summary-cell">
              <small>ẢNH ĐÃ NHẬN</small>
              <strong>{s.returned.length} / 3</strong>
            </div>
            <div className="summary-cell">
              <small>ĐIỂM NHIỆM VỤ</small>
              <strong>{good ? state.mission.score + '/100' : '—'}</strong>
            </div>
          </div>

          {!good && (
            <div className="alert-card bad">
              <strong>NGUYÊN NHÂN TRỰC TIẾP</strong>
              <p>{state.mission.reason}</p>
            </div>
          )}

          <div className="end-analysis">
            <section>
              <h3>{good ? 'VÌ SAO THÀNH CÔNG?' : 'PHÂN TÍCH SỰ CỐ'}</h3>
              <p>{e.analysis}</p>
            </section>
            <section>
              <h3>{good ? 'CẢI THIỆN NHIỆM VỤ' : 'CÁCH TRÁNH THẤT BẠI'}</h3>
              <p>{e.advice}</p>
            </section>
          </div>

          <div className="end-metrics">
            <span>
              FUEL MRO: <b>{Math.max(0, s.prop).toFixed(0)} kg</b>
            </span>
            <span>
              BATTERY: <b>{Math.round(s.batteryWh || 0)} Wh</b>
            </span>
            <span>
              MAX Q: <b>{state.launch.maxQ.toFixed(1)} kPa</b>
            </span>
            <span>
              BUDGET: <b>${money(b.cost)}</b>
            </span>
          </div>

          {good && s.returned.length > 0 && (
            <div>
              <div className="eyebrow" style={{ marginTop: 16 }}>
                SCIENCE DOWNLINK / MARS SURFACE
              </div>
              <div className="gallery">
                {s.returned.slice(0, 4).map((x) => (
                  <figure key={x.id}>
                    <img
                      src={
                        (ASSETS as Record<string, string>)['mars' + (x.region + 1)] ||
                        ASSETS.mars1
                      }
                      alt={`Ảnh bề mặt Sao Hỏa vùng ${x.region + 1}`}
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
                ↻ CHƠI LẠI GIAI ĐOẠN NÀY
              </button>
            )}
            <button className="btn-secondary" onClick={closeModal}>
              XEM LOG NHIỆM VỤ
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                closeModal();
                resetMission();
              }}
            >
              CHƠI LẠI / THỬ LỰA CHỌN KHÁC
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
