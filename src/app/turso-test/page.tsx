import { turso } from '@/utils/turso'

export const dynamic = 'force-dynamic';

export default async function TursoTestPage() {
  let errorMsg = null
  let tables: any[] = []

  try {
    const result = await turso.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = result.rows
  } catch (err: any) {
    errorMsg = err.message
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Turso Connection Test</h1>
      {errorMsg ? (
        <div style={{ padding: '1rem', background: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
          <strong>Error:</strong> {errorMsg}
        </div>
      ) : (
        <div>
          <p style={{ color: '#2e7d32' }}>✓ Successfully connected to Turso database!</p>
          <h3>Tables found in database:</h3>
          <ul>
            {tables.map((row, idx) => (
              <li key={idx}>{String(row.name)}</li>
            ))}
            {tables.length === 0 && <li>No tables found. Database is currently empty.</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
