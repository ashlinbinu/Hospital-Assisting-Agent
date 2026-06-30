import { useEffect, useState, useCallback } from 'react';
import { fetchDailyReport } from '../api/client';
import TriageBadge from '../components/TriageBadge';

export default function EmergencyAlerts() {
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
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  const flagged = (report?.recent_patients || [])
    .filter((p) => p.priority_level === 'Critical' || p.priority_level === 'High')
    .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Admin · Live Watch</div>
          <h1 className="page-title">Emergency Alerts</h1>
          <p className="page-subtitle">
            Patients triaged as Critical or High priority, surfaced for immediate clinical attention.
            Pulled from the latest analytics snapshot — refreshes every 10 seconds.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}>Refresh now</button>
      </div>

      {error && <div className="banner banner-error">{error}</div>}

      {!loading && flagged.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-title">No active emergency cases</div>
            <div className="empty-state-sub">Patients flagged Critical or High priority will appear here as soon as they're checked in.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading
            ? [1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 76 }} />)
            : flagged.map((p) => (
                <div
                  key={p.id}
                  className="card"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    borderLeft: `4px solid ${p.priority_level === 'Critical' ? 'var(--color-critical)' : 'var(--color-high)'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14.5 }}>{p.name}</div>
                      <div className="mono" style={{ fontSize: 11.5, color: 'var(--color-ink-faint)' }}>
                        #{p.id} &middot; {p.age} / {p.gender}
                      </div>
                    </div>
                    <div style={{ maxWidth: 360, fontSize: 13, color: 'var(--color-ink-muted)' }}>
                      {p.symptoms_description}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0 }}>
                    {p.queue_position != null && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10.5, color: 'var(--color-ink-faint)' }}>QUEUE</div>
                        <div className="mono" style={{ fontSize: 16, fontWeight: 600 }}>#{p.queue_position}</div>
                      </div>
                    )}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10.5, color: 'var(--color-ink-faint)' }}>SCORE</div>
                      <div className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{p.priority_score}</div>
                    </div>
                    <TriageBadge level={p.priority_level} />
                  </div>
                </div>
              ))}
        </div>
      )}
    </div>
  );
}
