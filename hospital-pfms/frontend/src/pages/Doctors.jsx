import { useEffect, useState } from 'react';
import {
  fetchDepartments,
  fetchDoctorsByDepartment,
  fetchDoctorSchedule
} from '../api/client';

export default function Doctors() {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDepartments() {
      try {
        const data = await fetchDepartments();
        setDepartments(data.departments || []);
        if (data.departments && data.departments.length > 0) {
          setSelectedDepartment(data.departments[0]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDepartments();
  }, []);

  useEffect(() => {
    if (!selectedDepartment) return;
    async function loadDoctors() {
      try {
        const data = await fetchDoctorsByDepartment(selectedDepartment);
        setDoctors(data || []);
        setSelectedDoctorId(data && data.length > 0 ? data[0].id : null);
      } catch (err) {
        setError(err.message);
      }
    }
    loadDoctors();
  }, [selectedDepartment]);

  useEffect(() => {
    if (!selectedDoctorId) {
      setSchedule(null);
      return;
    }
    async function loadSchedule() {
      try {
        const data = await fetchDoctorSchedule(selectedDoctorId);
        setSchedule(data);
      } catch (err) {
        setError(err.message);
      }
    }
    loadSchedule();
  }, [selectedDoctorId]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Staffing</div>
          <h1 className="page-title">Doctor Schedules</h1>
          <p className="page-subtitle">Browse availability and scheduled appointments by department and physician.</p>
        </div>
      </div>

      {error && <div className="banner banner-error">{error}</div>}

      <div className="card card-pad" style={{ marginBottom: 22 }}>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="department-select">Department</label>
            <select
              id="department-select"
              value={selectedDepartment}
              onChange={(event) => setSelectedDepartment(event.target.value)}
            >
              {loading && <option>Loading…</option>}
              {departments.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="doctor-select">Doctor</label>
            <select
              id="doctor-select"
              value={selectedDoctorId || ''}
              onChange={(event) => setSelectedDoctorId(Number(event.target.value))}
            >
              {doctors.length === 0 && <option value="">No doctors available</option>}
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {schedule && (
        <div className="card">
          <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 15 }}>{schedule.doctor.name}</h2>
              <span className="badge badge-neutral">{schedule.doctor.department}</span>
            </div>
            <div style={{ display: 'flex', gap: 20, fontSize: 12.5, color: 'var(--color-ink-muted)' }}>
              <span>Hours: <strong style={{ color: 'var(--color-ink)' }}>{schedule.doctor.availability_start}–{schedule.doctor.availability_end}</strong></span>
              <span>Consult length: <strong style={{ color: 'var(--color-ink)' }}>{schedule.doctor.consultation_duration} min</strong></span>
              <span>
                Status:{' '}
                <strong style={{ color: schedule.doctor.is_active ? 'var(--color-primary)' : 'var(--color-critical)' }}>
                  {schedule.doctor.is_active ? 'Active' : 'Inactive'}
                </strong>
              </span>
            </div>
          </div>

          {schedule.appointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No appointments scheduled</div>
              <div className="empty-state-sub">This doctor currently has an open calendar.</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {schedule.appointments.map((appointment) => (
                  <tr key={appointment.appointment_id}>
                    <td>{appointment.patient_name} <span className="mono" style={{ color: 'var(--color-ink-faint)', fontSize: 11.5 }}>#{appointment.patient_id}</span></td>
                    <td>{appointment.appointment_date}</td>
                    <td className="mono">{appointment.appointment_time}</td>
                    <td>
                      <span className={`badge ${appointment.status === 'Scheduled' ? 'badge-medium' : appointment.status === 'Cancelled' ? 'badge-critical' : 'badge-neutral'}`}>
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
