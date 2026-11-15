# MARS ORBITAL MISSION — Enhanced Edition 2.0

Trò chơi mô phỏng nhiệm vụ đưa vệ tinh tới quỹ đạo Sao Hỏa, xây dựng từ phiên bản game người dùng đã cung cấp. Ngôn ngữ giao diện: Tiếng Việt. Chạy được trên máy tính trong trình duyệt hiện đại, **không cần backend, tài khoản hoặc thư viện từ CDN**.

## Bắt đầu trong 3 bước

1. **Giải nén TOÀN BỘ** thư mục `Mars_Orbital_Mission_Enhanced` (giữ nguyên các thư mục `assets`).
2. Nhấp đúp **`index.html`** trong Google Chrome hoặc Microsoft Edge. Nếu trình duyệt có chính sách giới hạn truy cập file nội bộ, chạy máy chủ local qua lệnh `python -m http.server 8000` trong thư mục game và mở `http://localhost:8000`.
3. Nhấn **BẮT ĐẦU NHIỆM VỤ**, cấu hình vệ tinh và tên lửa rồi mở tab **KIỂM TRA TRƯỚC PHÓNG** để Preflight. Sau đó làm theo các yêu cầu từng giai đoạn. Nút `?` mở hướng dẫn; nút `⛶` chuyển toàn màn hình khi trình duyệt cho phép.

Giao diện tự thích ứng theo kích thước cửa sổ trình duyệt. Các bảng bên tự cuộn; thanh điều khiển có cuộn độc lập nếu màn hình thấp.

## Quy trình chơi — 8 giai đoạn

1. **Lắp ráp / Preflight:** chọn 5 nhóm linh kiện và 1 trong 3 tên lửa. Trọng lượng, ngân sách, TWR, kích thước gập và fairing được kiểm tra. Cánh pin bản lớn có thể không vừa fairing nhỏ.
2. **Phóng:** điều chỉnh throttle, lệch pitch và roll. Khối lượng giảm theo chất đẩy, tốc độ/độ cao được tích phân từ lực đẩy, trọng lực và lực cản đơn giản hóa. Quá lệch hướng, cạn nhiên liệu hoặc vượt tải khí động có thể làm thất bại nhiệm vụ. Mốc mô phỏng là 101 km.
3. **Tách tầng:** ngắt động cơ tầng 1 (MECO), tách tầng 1, khởi động tầng trên Centaur, tách hai nửa fairing. Các vật thể đã tách có quán tính, vận tốc tách, xoay và rơi tương đối trong hoạt ảnh.
4. **Quỹ đạo chờ Trái Đất:** thực hiện đốt tinh chỉnh tầng trên để kiểm soát cận điểm/viễn điểm. Nhiên liệu Centaur tiêu hao theo phương trình rocket đơn giản hóa.
5. **Trans-Mars Injection:** thực hiện burn chuyển tiếp và tách vệ tinh khỏi Centaur. Trình tự tách vệ tinh khác với tách tầng tên lửa.
6. **Cruise:** **mở cánh pin và ăng-ten ngay sau khi tách MRO**. Quản lý pin và thực hiện hiệu chỉnh hành trình.
7. **Mars Orbit Insertion:** hãm tốc, chọn hành lang aerobraking phù hợp, circularization và xác nhận quỹ đạo Sao Hỏa.
8. **Science:** chụp ít nhất 3 ảnh, tránh xung đột HiRISE/CRISM và radar, dùng pin hợp lý, rồi truyền dữ liệu về Trái Đất.

## Các cải tiến trong Enhanced Edition

- **Fit-to-window:** khung game luôn bám viewport; bàn điều khiển và các thanh bên cuộn độc lập; nút fullscreen.
- **Good / Bad endings:** ít nhất 3 kết thúc tốt theo hiệu quả nhiệm vụ; nhiều nhóm kết thúc thất bại như không đủ lực đẩy, rời hành lang phóng, hết nhiên liệu, không bắt quỹ đạo Mars, quá nhiệt aerobraking, blackout, quỹ đạo sai mục tiêu. Báo cáo kết thúc ghi **nguyên nhân trực tiếp, phân tích kỹ thuật và cách tránh**.
- **Đường bay sau đuôi tên lửa** chứ không nối vào tâm sprite; có đường mục tiêu đứt nét.
- **Tách tầng cơ học:** upper stage giữ chuyển động, core stage trôi/tumbling, fairing tách đôi, hiệu ứng pyro, MRO tách khỏi tầng trên.
- **Rung cảnh khi phóng** (chỉ khung cảnh, không làm rung các nút điều khiển), cùng lửa động cơ.
- **Mô hình hành tinh 3D từ 2 file GLB do người dùng cung cấp:** Earth / Mars. Hình học mesh và bản đồ UV/texture được chuyển sẵn thành `planet_mesh.js` + ảnh texture để render WebGL offline mà không cần tải Three.js hoặc GLTFLoader. Bản gốc `.glb` vẫn được lưu trong `assets/nasa_planets/` để bạn sử dụng/chỉnh sửa tiếp. Nếu WebGL không khả dụng, game tự sử dụng mặt cầu 2D dự phòng.
- **Gameplay liên kết cấu hình:** fairing kiểm tra kích thước gập; thùng nhiên liệu thay đổi khối lượng và propellant; cánh pin có công suất, pin lưu trữ và suy giảm do aerobraking; antenna giới hạn băng thông; ảnh tiêu thụ điện và bộ nhớ.
- **Tự lưu:** localStorage với key phiên bản `mars-orbital-mission-v2` (tách khỏi save của bản game gốc, không ghi đè tiến trình cũ).

## Mã nguồn

- `index.html`: cấu trúc giao diện và tải mã.
- `style.css`: thiết kế Mission Control và layout theo kích thước viewport.
- `physics.js`: hàm tính vật lý thuần; ascent 2 trục, drag, gravity, rocket equation.
- `game.js`: gameplay, HUD, trạng thái, vẽ Canvas của game gốc đã được tinh chỉnh.
- `enhancements.js`: bổ sung các giai đoạn năng lượng, hệ thống endings, renderer/motion, HUD và interactions.
- `planet_mesh.js`: mesh/normal/UV/index rút từ GLB của người dùng.
- `planet_renderer.js`: WebGL renderer 3D không dùng thư viện ngoài.
- `assets/`: sprite gốc của game, hình địa hình và mô hình hành tinh.

## Lưu ý về mô phỏng và nguồn tài nguyên

Đây là trò chơi giáo dục **physics-inspired**. Mô hình ascent có lực, khối lượng, nhiên liệu và gia tốc phụ thuộc nhau, nhưng **không phải** phần mềm dẫn đường hàng không vũ trụ: Earth parking orbit, TMI, interplanetary transfer, aerobraking, nhiên liệu Centaur, thời gian, mục tiêu 300 km/93°, chi phí 3,6 tỷ USD và ngân sách chính phủ 100 tỷ USD đã được điều chỉnh để có thể chơi trong thời gian ngắn. Không sử dụng kết quả game để tính toán thiết kế phóng thực tế.

Hai tệp 3D được lưu lại nguyên bản: `Earth_1_12756.glb` → `assets/nasa_planets/earth.glb`, `24881_Mars_1_6792.glb` → `assets/nasa_planets/mars.glb`. Đây là dữ liệu người dùng cung cấp và mô tả là từ NASA; game không tự chứng thực quyền sử dụng hoặc nguồn tải ban đầu. Không xóa file texture hoặc `planet_mesh.js`, vì WebGL renderer cần các tệp này để chạy offline.
# Mars_Orbital_Mission_Enhanced
# Mars_Orbital_Mission_Enhanced
