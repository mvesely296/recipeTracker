export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Recipe Tracker API</h1>
      <p>API server is running on port 3001.</p>
      <p>
        <a href="/api/health">Health Check</a>
      </p>
    </main>
  );
}
