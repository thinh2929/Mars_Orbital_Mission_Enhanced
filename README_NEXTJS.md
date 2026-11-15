# MARS ORBITAL MISSION — Next.js Edition

Phiên bản chuyển đổi toàn diện của dự án mô phỏng nhiệm vụ vũ trụ **Mars Orbital Mission (MOR-28-01)** sang framework **Next.js (App Router, React 19, TypeScript)**.

---

## 🚀 Hướng dẫn khởi chạy

### Cách 1: Chạy bằng file Batch (Windows)
Nhấp đúp vào tệp **`start_nextjs.bat`**. Tệp này sẽ tự động mở trình duyệt tại `http://localhost:3000` và khởi chạy máy chủ phát triển.

### Cách 2: Chạy bằng dòng lệnh (Terminal / PowerShell)
```bash
# Cài đặt thư viện (nếu chưa cài)
npm install

# Khởi chạy máy chủ phát triển
npm run dev

# Hoặc tạo bản build sản phẩm và chạy
npm run build
npm start
```
Mở trình duyệt tại: [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Cấu trúc dự án Next.js

```
Mars_Orbital_Mission_Enhanced/
├── public/
│   └── assets/                     # Toàn bộ sprite tên lửa, MRO, bề mặt Sao Hỏa, 3D GLB & texture
├── src/
│   ├── app/
│   │   ├── globals.css             # Giao diện Mission Control cyberpunk/retro sci-fi gốc & responsive
│   │   ├── layout.tsx              # Root Layout, Metadata & Viewport tiếng Việt
│   │   └── page.tsx                # Trang chủ tích hợp GameProvider và các shell layout
│   ├── components/
│   │   ├── Header.tsx              # Thanh điều hướng trên cùng, Sol clock, âm thanh, fullscreen, restart
│   │   ├── LeftSidebar.tsx         # Flight Director Console, Tiến trình nhiệm vụ 8 giai đoạn, Live Event Log
│   │   ├── RightSidebar.tsx        # Real-time Telemetry, thanh pin & năng lượng, an toàn bay, mục tiêu
│   │   ├── SimulationCanvas.tsx    # Canvas 60 FPS mô phỏng trực quan: sao bay, bệ phóng SLC-41, tách tầng, WebGL 3D
│   │   ├── ControlPanel.tsx        # Bàn điều khiển 8 giai đoạn (lắp ráp, phóng, tách tầng, parking, TMI, cruise, capture, science)
│   │   ├── Footer.tsx              # Thanh trạng thái footer Mission Operations Center
│   │   ├── IntroOverlay.tsx        # Màn hình mở đầu giới thiệu chỉ thị nhiệm vụ & nút Tiếp tục save cũ
│   │   ├── Modal.tsx               # Cửa sổ sổ tay điều khiển, xác nhận khởi động lại, báo cáo kết thúc đa nhánh
│   │   └── ToastContainer.tsx      # Hệ thống thông báo toast nổi với phản hồi âm thanh
│   ├── context/
│   │   └── GameContext.tsx         # State management toàn cục (React Context), vòng lặp vật lý, lưu trữ localStorage & checkpoint
│   └── lib/
│       ├── types.ts                # Định nghĩa kiểu dữ liệu TypeScript chặt chẽ cho toàn bộ game
│       ├── constants.ts            # Hằng số SLOTS, LAUNCHERS, PHASES, ASSETS, TARGET_REGIONS
│       ├── physics.ts              # Động lực học phóng 2 trục, lực cản khí động Max Q, công thức tên lửa Tsiolkovsky, aerobraking
│       ├── planetMesh.ts           # Dữ liệu hình học 3D (vertices, normals, UVs, indices) trích xuất từ NASA GLB
│       ├── planetRenderer.ts       # Bộ dựng hình WebGL 3D xoay cho Trái Đất và Sao Hỏa
│       ├── audio.ts                # Bộ tạo âm thanh số qua Web Audio API (động cơ, tách tầng, thông báo)
│       └── endings.ts              # Hệ thống 11+ kết thúc đa nhánh (Good/Bad Endings), chẩn đoán lỗi kỹ thuật
├── package.json                    # Cấu hình dependency (Next.js 15+, React 19, TypeScript)
├── tsconfig.json                   # Cấu hình TypeScript
├── next.config.mjs                 # Cấu hình Next.js
└── start_nextjs.bat                # Phím tắt khởi động nhanh trên Windows
```

---

## 🌟 Các tính năng nổi bật giữ nguyên & nâng cấp trong Next.js

1. **Hiệu năng 60 FPS Canvas & WebGL 3D**:
   - Sử dụng `requestAnimationFrame` độc lập kết hợp `useRef` giúp việc render đồ họa mô phỏng tách biệt khỏi chu kỳ re-render của React.
   - Trái Đất và Sao Hỏa được vẽ bằng WebGL 3D trực tiếp từ mesh NASA offline, có cơ chế tự động chuyển sang 2D procedural gradient nếu thiết bị không hỗ trợ WebGL.

2. **Vật lý bay & cơ chế 8 giai đoạn**:
   - **Giai đoạn 1 (Lắp ráp / Preflight):** Chọn 5 nhóm linh kiện vệ tinh, 3 loại tên lửa đẩy, kiểm tra ngân sách, khối lượng, TWR, đường kính fairing.
   - **Giai đoạn 2 (Phóng):** Điều chỉnh lực đẩy throttle, pitch, roll; mô hình vật lý khí động học Max Q, tiêu hao nhiên liệu tầng 1, mốc MECO 101 km.
   - **Giai đoạn 3 (Tách tầng):** Tách booster tầng 1 (hiệu ứng pyro sparks), kích hoạt Centaur RL-10, tách 2 nửa vỏ fairing.
   - **Giai đoạn 4 (Quỹ đạo chờ):** Đốt động cơ Centaur để duy trì cận điểm/viễn điểm Trái Đất (148 x 185 km).
   - **Giai đoạn 5 (TMI):** Đốt chuyển tiếp thoát trọng lực Trái Đất đến Sao Hỏa và giải phóng vệ tinh MRO.
   - **Giai đoạn 6 (Hành trình):** Triển khai cánh pin mặt trời, ăng-ten cao ích, sửa sai số along-track & cross-track.
   - **Giai đoạn 7 (Vào quỹ đạo Mars):** Hãm tốc MOI, nhiều vòng aerobraking làm giảm apoapsis, circularization đưa tàu về 300 km / độ nghiêng cực 93°.
   - **Giai đoạn 8 (Khoa học):** Quản lý pin, tránh xung đột thiết bị, chụp ảnh 4 vùng bề mặt và truyền dữ liệu về Trái Đất.

3. **Hệ thống Checkpoint & Thử lại giai đoạn (v3)**:
   - Lưu trạng thái tự động tại mỗi giai đoạn vào `localStorage`. Khi gặp sự cố thất bại, người chơi có thể nhấn **"CHƠI LẠI GIAI ĐOẠN NÀY"** thay vì phải chơi lại từ đầu.
   - Tự động mở khóa gợi ý hướng dẫn sau 5 lần thất bại liên tiếp ở một giai đoạn.

4. **Web Audio Synthesis tự nhiên**:
   - Hoàn toàn không phụ thuộc file mp3 bên ngoài: các âm thanh động cơ phản lực, tách tầng, mở chốt pyro, và tín hiệu beep giao diện được tổng hợp bằng Web Audio Oscillator theo thời gian thực.
