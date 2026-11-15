export default function NotFound() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#fff', background: '#050b14', minHeight: '100vh' }}>
      <h2>404 - Page Not Found</h2>
      <p>The requested mission telemetry route does not exist.</p>
      <a href="/" style={{ color: '#4cc9f0', textDecoration: 'underline' }}>Return to Mission Control</a>
    </div>
  );
}
