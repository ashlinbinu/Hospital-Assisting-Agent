import { useEffect, useState } from 'react';
import { fetchDailyReport } from '../api/client';
import TriageBadge from '../components/TriageBadge';

export default function Patients() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchDailyReport();
        setReport(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const patients = (report?.recent_patients || []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || String(p.id).includes(search)
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Records</div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">Most recently checked-in patients, with triage and scheduling status.</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or ID…"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 13.5,
            padding: '9px 12px',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 6,
            width: 240,
            background: 'var(--color-surface)'
          }}
        />
      </div>

      {error && <div className="banner banner-error">{error}</div>}

      <div className="card">
        {loading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 38 }} />)}
          </div>
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No patients found</div>
            <div className="empty-state-sub">Try a different search, or check in a new patient from the Check-In page.</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Age / Gender</th>
                <th>Priority</th>
                <th>Queue position</th>
                <th>Scheduled appts.</th>
                <th>Checked in</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id}>
                  <td className="mono">#{p.id}</td>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td>{p.age} / {p.gender}</td>
                  <td><TriageBadge level={p.priority_level} /></td>
                  <td className="mono">{p.queue_position ?? '—'}</td>
                  <td className="mono">{p.scheduled_appointments}</td>
                  <td style={{ color: 'var(--color-ink-muted)', fontSize: 12 }}>
                    {p.created_at ? new Date(p.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
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
