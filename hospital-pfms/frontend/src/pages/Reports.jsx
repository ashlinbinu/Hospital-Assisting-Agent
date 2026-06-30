import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { fetchDailyReport, archivePreviousDay, resetCurrentPatients, seedDoctors } from '../api/client';

const TIER_COLOR = {
  Critical: '#B0473B',
  High: '#B8893A',
  Medium: '#3D6B57',
  Low: '#5F7385'
};

export default function Reports() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionBusy, setActionBusy] = useState('');

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

  useEffect(() => { load(); }, []);

  async function runAction(key, fn, confirmMsg) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setActionBusy(key);
    setActionMessage('');
    setActionError('');
    try {
      const res = await fn();
      setActionMessage(res.message || 'Done.');
      await load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionBusy('');
    }
  }

  const priorityData = Object.entries(report?.priority_distribution || {}).map(([level, count]) => ({
    level, count
  }));

  const deptData = Object.entries(report?.departmental_load || {}).map(([dept, count]) => ({
    dept, count
  }));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Admin · Analytics</div>
          <h1 className="page-title">Reports &amp; Analytics</h1>
          <p className="page-subtitle">Operational KPIs across today's patient volume, triage distribution, and departmental load.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}>Refresh now</button>
      </div>

      {error && <div className="banner banner-error">{error}</div>}

      {loading ? (
        <div className="grid-3" style={{ marginBottom: 22 }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 96 }} />)}
        </div>
      ) : (
        <div className="grid-3" style={{ marginBottom: 22 }}>
          <div className="stat-card">
            <div className="stat-label">Total processed patients</div>
            <div className="stat-value">{report?.summary?.total_processed_patients ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active critical emergencies</div>
            <div className={`stat-value ${report?.summary?.active_critical_emergencies > 0 ? 'stat-value-critical' : ''}`}>
              {report?.summary?.active_critical_emergencies ?? 0}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Average severity score</div>
            <div className="stat-value">{report?.summary?.average_severity_score ?? 0}</div>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 22, alignItems: 'start' }}>
        <div className="card">
          <div className="card-header"><h2>Priority distribution</h2></div>
          <div style={{ padding: '18px 18px 8px', height: 240 }}>
            {priorityData.length === 0 ? (
              <div className="empty-state-sub" style={{ textAlign: 'center', paddingTop: 70 }}>No data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="level" tick={{ fontSize: 12, fill: '#5B6862' }} axisLine={{ stroke: '#DCE2E0' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#5B6862' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12.5, borderRadius: 6, borderColor: '#DCE2E0' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry) => (
                      <Cell key={entry.level} fill={TIER_COLOR[entry.level] || '#8A958F'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Appointments by department</h2></div>
          <div style={{ padding: '18px 18px 8px', height: 240 }}>
            {deptData.length === 0 ? (
              <div className="empty-state-sub" style={{ textAlign: 'center', paddingTop: 70 }}>No data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} layout="vertical" margin={{ left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#5B6862' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="dept" type="category" width={120} tick={{ fontSize: 11.5, fill: '#5B6862' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12.5, borderRadius: 6, borderColor: '#DCE2E0' }} />
                  <Bar dataKey="count" fill="#3D6B57" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2>Maintenance &amp; data operations</h2></div>
        <div className="card-pad">
          {actionMessage && <div className="banner banner-success">{actionMessage}</div>}
          {actionError && <div className="banner banner-error">{actionError}</div>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <button
              className="btn btn-secondary"
              disabled={actionBusy !== ''}
              onClick={() => runAction(
                'archive',
                archivePreviousDay,
                "Archive yesterday's queue data and retrain the wait-time model?"
              )}
            >
              {actionBusy === 'archive' ? 'Archiving…' : 'Archive previous day & retrain model'}
            </button>
            <button
              className="btn btn-secondary"
              disabled={actionBusy !== ''}
              onClick={() => runAction('seed', seedDoctors)}
            >
              {actionBusy === 'seed' ? 'Seeding…' : 'Seed default doctors'}
            </button>
            <button
              className="btn btn-danger"
              disabled={actionBusy !== ''}
              onClick={() => runAction(
                'reset',
                resetCurrentPatients,
                'This clears all current patients, queue entries, and appointments. This cannot be undone. Continue?'
              )}
            >
              {actionBusy === 'reset' ? 'Resetting…' : 'Reset current-day patient data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
