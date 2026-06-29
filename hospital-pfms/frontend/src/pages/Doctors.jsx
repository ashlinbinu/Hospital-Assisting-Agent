import { useEffect, useState } from 'react';
import {
  fetchDepartments,
  fetchDoctorsByDepartment,
  fetchDoctorSchedule
} from '../api/doctorApi';

export default function Doctors() {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState('');

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
    <div style={{ padding: '24px', maxWidth: '980px', margin: '0 auto' }}>
      <h1>Doctor Schedules</h1>
      {error && (
        <div style={{ marginBottom: '16px', color: 'crimson' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <label htmlFor="department-select">Department</label>
          <select
            id="department-select"
            value={selectedDepartment}
            onChange={(event) => setSelectedDepartment(event.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '8px' }}
          >
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="doctor-select">Doctor</label>
          <select
            id="doctor-select"
            value={selectedDoctorId || ''}
            onChange={(event) => setSelectedDoctorId(Number(event.target.value))}
            style={{ width: '100%', padding: '8px', marginTop: '8px' }}
          >
            {doctors.length === 0 && <option value="">No doctors available</option>}
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {schedule && (
        <section style={{ marginTop: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <strong>{schedule.doctor.name}</strong> — {schedule.doctor.department}
            <div>
              Hours: {schedule.doctor.availability_start} - {schedule.doctor.availability_end}
            </div>
            <div>Consultation Duration: {schedule.doctor.consultation_duration} minutes</div>
          </div>

          <h2>Scheduled Appointments</h2>
          {schedule.appointments.length === 0 ? (
            <div>No appointments are currently scheduled for this doctor.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: '8px' }}>Patient</th>
                  <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: '8px' }}>Date</th>
                  <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: '8px' }}>Time</th>
                  <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: '8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {schedule.appointments.map((appointment) => (
                  <tr key={appointment.appointment_id}>
                    <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>
                      {appointment.patient_name} (#{appointment.patient_id})
                    </td>
                    <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>
                      {appointment.appointment_date}
                    </td>
                    <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>
                      {appointment.appointment_time}
                    </td>
                    <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>
                      {appointment.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}
