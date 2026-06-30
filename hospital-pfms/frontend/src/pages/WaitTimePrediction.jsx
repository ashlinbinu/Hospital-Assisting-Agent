import { useEffect, useState } from 'react';
import { fetchDepartments, fetchWaitTimePrediction } from '../api/client';

export default function WaitTimePrediction() {
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState('');
  const [queueLength, setQueueLength] = useState(5);
  const [averageDuration, setAverageDuration] = useState(15);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchDepartments();
        const list = data.departments || [];
        setDepartments(list);
        if (list.length > 0) setDepartment(list[0]);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await fetchWaitTimePrediction({
        queueLength: Number(queueLength),
        department,
        averageDuration: Number(averageDuration)
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Admin · Forecasting</div>
          <h1 className="page-title">Wait-Time Prediction</h1>
          <p className="page-subtitle">
            Estimate patient wait time from current queue length and consultation pace, using the trained
            Random Forest regression model.
          </p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card card-pad">
          {error && <div className="banner banner-error">{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label htmlFor="department">Department</label>
              <select id="department" value={department} onChange={(e) => setDepartment(e.target.value)} required>
                {departments.length === 0 && <option value="">No departments available</option>}
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="grid-2">
              <div className="field">
                <label htmlFor="queue-length">Current queue length</label>
                <input
                  id="queue-length"
                  type="number"
                  min="0"
                  required
                  value={queueLength}
                  onChange={(e) => setQueueLength(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="avg-duration">Avg. consult duration (min)</label>
                <input
                  id="avg-duration"
                  type="number"
                  min="1"
                  required
                  value={averageDuration}
                  onChange={(e) => setAverageDuration(e.target.value)}
                />
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={submitting} style={{ alignSelf: 'flex-start' }}>
              {submitting ? 'Calculating…' : 'Predict wait time'}
            </button>
          </form>
        </div>

        <div className="card card-pad" style={{ minHeight: 220, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>Predicted result</h3>
          {!result && (
            <div className="empty-state" style={{ margin: 'auto' }}>
              <div className="empty-state-title">No prediction yet</div>
              <div className="empty-state-sub">Enter queue details to estimate expected wait time.</div>
            </div>
          )}
          {result && (
            <div style={{ textAlign: 'center', margin: 'auto', padding: '12px 0' }}>
              <div className="mono" style={{ fontSize: 44, fontWeight: 600, color: 'var(--color-primary)', lineHeight: 1 }}>
                {result.estimated_wait_time_minutes}
                <span style={{ fontSize: 16, fontWeight: 500, marginLeft: 6, color: 'var(--color-ink-muted)' }}>min</span>
              </div>
              <div style={{ marginTop: 10, fontSize: 13, color: 'var(--color-ink-muted)' }}>
                Estimated wait for {result.department}, queue of {result.current_queue_length}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
