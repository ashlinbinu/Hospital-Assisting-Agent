import { useState } from 'react';
import { checkInPatient } from '../api/client';
import TriageBadge from '../components/TriageBadge';

const EMPTY_FORM = {
  name: '',
  age: '',
  gender: 'Female',
  contact_number: '',
  symptoms: ''
};

export default function CheckIn() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await checkInPatient({
        ...form,
        age: Number(form.age)
      });
      setResult(response);
      setForm(EMPTY_FORM);
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
          <div className="page-eyebrow">Front Desk</div>
          <h1 className="page-title">Patient Check-In &amp; Triage</h1>
          <p className="page-subtitle">
            Register an arriving patient. Symptoms are reviewed by the triage assistant
            to set queue priority — it does not diagnose or recommend treatment.
          </p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card card-pad">
          {error && <div className="banner banner-error">{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Jane Carter"
                />
              </div>
              <div className="field">
                <label htmlFor="age">Age</label>
                <input
                  id="age"
                  type="number"
                  min="0"
                  required
                  value={form.age}
                  onChange={(e) => update('age', e.target.value)}
                  placeholder="34"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label htmlFor="gender">Gender</label>
                <select id="gender" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                  <option>Prefer not to say</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="contact">Contact number</label>
                <input
                  id="contact"
                  required
                  value={form.contact_number}
                  onChange={(e) => update('contact_number', e.target.value)}
                  placeholder="555-0199"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="symptoms">Presenting symptoms</label>
              <textarea
                id="symptoms"
                required
                value={form.symptoms}
                onChange={(e) => update('symptoms', e.target.value)}
                placeholder="Describe what the patient reports in their own words, e.g. severe chest pressure since this morning, shortness of breath."
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={submitting} style={{ alignSelf: 'flex-start' }}>
              {submitting ? 'Checking in…' : 'Check in patient'}
            </button>
          </form>
        </div>

        <div className="card card-pad" style={{ minHeight: 280, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>Triage outcome</h3>
          {!result && (
            <div className="empty-state" style={{ margin: 'auto' }}>
              <div className="empty-state-title">No patient checked in yet</div>
              <div className="empty-state-sub">
                Submit the form to register a patient and view their assigned priority and queue position here.
              </div>
            </div>
          )}
          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-ink-faint)', marginBottom: 4 }}>Patient ID</div>
                  <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>#{result.patient_id}</div>
                </div>
                <TriageBadge level={result.priority_level} />
              </div>

              <div className="grid-2">
                <div style={{ background: 'var(--color-surface-sunken)', borderRadius: 6, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-ink-faint)', marginBottom: 4 }}>Priority score</div>
                  <div className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{result.priority_score} / 10</div>
                </div>
                <div style={{ background: 'var(--color-surface-sunken)', borderRadius: 6, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-ink-faint)', marginBottom: 4 }}>Emergency flag</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: result.emergency_flag ? 'var(--color-critical)' : 'var(--color-ink)' }}>
                    {result.emergency_flag ? 'Yes — flagged' : 'No'}
                  </div>
                </div>
              </div>

              <div className="banner banner-success" style={{ marginBottom: 0 }}>
                {result.status_message}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
