import { useEffect, useState, useCallback } from 'react';
import { fetchDailyReport } from '../api/client';
import TriageBadge from '../components/TriageBadge';

export default function QueueMonitor() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchDailyReport();
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const queued = (report?.recent_patients || [])
    .filter((p) => p.queue_position != null)
    .sort((a, b) => a.queue_position - b.queue_position);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Live Operations</div>
          <h1 className="page-title">Queue Monitor</h1>
          <p className="page-subtitle">
            Patients currently waiting, ordered by AI-assigned priority score. Refreshes automatically every 15 seconds.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}>
          Refresh now
        </button>
      </div>

      {error && <div className="banner banner-error">{error}</div>}

      <div
        className="card"
        style={{
          marginBottom: 22,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          overflowX: 'auto'
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--color-ink-faint)', flexShrink: 0 }}>
          QUEUE ORDER
        </span>
        {loading && <div className="skeleton" style={{ height: 30, width: '100%' }} />}
        {!loading && queued.length === 0 && (
          <span style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>No patients currently waiting.</span>
        )}
        {!loading &&
          queued.map((p, i) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0,
                background: 'var(--color-surface-sunken)',
                borderRadius: 100,
                padding: '5px 12px 5px 6px'
              }}
            >
              <span
                className="mono"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#fff',
                  background: tierColor(p.priority_level)
                }}
              >
                {p.queue_position}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 500 }}>{p.name}</span>
              {i < queued.length - 1 && (
                <span style={{ color: 'var(--color-border-strong)', marginLeft: 4 }}>—</span>
              )}
            </div>
          ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Waiting room detail</h2>
          <span style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>
            {queued.length} patient{queued.length === 1 ? '' : 's'} waiting
          </span>
        </div>
        {loading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 38 }} />)}
          </div>
        ) : queued.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">Waiting room is empty</div>
            <div className="empty-state-sub">Checked-in patients with an active queue position will appear here.</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Pos.</th>
                <th>Patient</th>
                <th>Age / Gender</th>
                <th>Priority</th>
                <th>Score</th>
                <th>Symptoms</th>
                <th>Checked in</th>
              </tr>
            </thead>
            <tbody>
              {queued.map((p) => (
                <tr key={p.id}>
                  <td className="mono">{p.queue_position}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--color-ink-faint)' }}>#{p.id}</div>
                  </td>
                  <td>{p.age} / {p.gender}</td>
                  <td><TriageBadge level={p.priority_level} /></td>
                  <td className="mono">{typeof p.priority_score === 'number' ? p.priority_score.toFixed(1) : p.priority_score}</td>
                  <td style={{ maxWidth: 280, color: 'var(--color-ink-muted)' }}>{p.symptoms_description}</td>
                  <td style={{ color: 'var(--color-ink-muted)', fontSize: 12 }}>
                    {p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function tierColor(level) {
  switch (level) {
    case 'Critical': return 'var(--color-critical)';
    case 'High': return 'var(--color-high)';
    case 'Medium': return 'var(--color-medium)';
    case 'Low': return 'var(--color-low)';
    default: return 'var(--color-ink-faint)';
  }
}
