export default function NotFound() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#fff', background: '#050b14', minHeight: '100vh' }}>
      <h2>404 - Không tìm thấy trang</h2>
      <p>Trang bạn yêu cầu không tồn tại.</p>
      <a href="/" style={{ color: '#4cc9f0', textDecoration: 'underline' }}>Quay lại trung tâm điều khiển</a>
    </div>
  );
}
