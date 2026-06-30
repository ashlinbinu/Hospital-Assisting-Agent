import { useEffect, useState } from 'react';
import { fetchDepartments, bookAppointment } from '../api/client';

const EMPTY_FORM = {
  patient_id: '',
  department: '',
  preferred_date: '',
  preferred_time: ''
};

export default function BookAppointment() {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchDepartments();
        const list = data.departments || [];
        setDepartments(list);
        if (list.length > 0) {
          setForm((prev) => ({ ...prev, department: list[0] }));
        }
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    setResult(null);
    try {
      const response = await bookAppointment({
        ...form,
        patient_id: Number(form.patient_id)
      });
      setResult(response);
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
          <div className="page-eyebrow">Scheduling</div>
          <h1 className="page-title">Book Appointment</h1>
          <p className="page-subtitle">
            The scheduling assistant matches the patient's preferred department and time
            against doctor availability and confirms the best slot.
          </p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card card-pad">
          {error && <div className="banner banner-error">{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label htmlFor="patient_id">Patient ID</label>
              <input
                id="patient_id"
                type="number"
                required
                value={form.patient_id}
                onChange={(e) => update('patient_id', e.target.value)}
                placeholder="e.g. 14 — from check-in confirmation"
              />
            </div>

            <div className="field">
              <label htmlFor="department">Department</label>
              <select id="department" value={form.department} onChange={(e) => update('department', e.target.value)} required>
                {departments.length === 0 && <option value="">No departments available</option>}
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="grid-2">
              <div className="field">
                <label htmlFor="date">Preferred date</label>
                <input
                  id="date"
                  type="date"
                  required
                  value={form.preferred_date}
                  onChange={(e) => update('preferred_date', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="time">Preferred time</label>
                <input
                  id="time"
                  type="time"
                  required
                  value={form.preferred_time}
                  onChange={(e) => update('preferred_time', e.target.value)}
                />
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={submitting} style={{ alignSelf: 'flex-start' }}>
              {submitting ? 'Finding a slot…' : 'Book appointment'}
            </button>
          </form>
        </div>

        <div className="card card-pad" style={{ minHeight: 240, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>Booking outcome</h3>
          {!result && (
            <div className="empty-state" style={{ margin: 'auto' }}>
              <div className="empty-state-title">No booking attempted yet</div>
              <div className="empty-state-sub">Submit the form to see the assigned doctor and confirmation status.</div>
            </div>
          )}
          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="grid-2">
                <div style={{ background: 'var(--color-surface-sunken)', borderRadius: 6, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-ink-faint)', marginBottom: 4 }}>Status</div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: result.status === 'Confirmed' ? 'var(--color-primary)' : 'var(--color-critical)'
                  }}>
                    {result.status}
                  </div>
                </div>
                <div style={{ background: 'var(--color-surface-sunken)', borderRadius: 6, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-ink-faint)', marginBottom: 4 }}>Assigned doctor ID</div>
                  <div className="mono" style={{ fontSize: 16, fontWeight: 600 }}>
                    {result.doctor_id != null ? `#${result.doctor_id}` : 'Unassigned'}
                  </div>
                </div>
              </div>
              <div className={`banner ${result.status === 'Confirmed' ? 'banner-success' : 'banner-error'}`} style={{ marginBottom: 0 }}>
                {result.summary}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
