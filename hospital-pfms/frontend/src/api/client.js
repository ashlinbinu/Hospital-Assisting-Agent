const BASE = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // response had no JSON body
    }
    throw new Error(detail);
  }
  return response.json();
}

// ---- Triage / Check-in ----
export function checkInPatient(payload) {
  return request('/triage/check-in', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// ---- Reports / Analytics ----
export function fetchDailyReport() {
  return request('/reports/daily');
}

// ---- Doctors / Departments ----
export function fetchDepartments() {
  return request('/departments');
}

export function fetchDoctorsByDepartment(department) {
  return request(`/departments/${encodeURIComponent(department)}/doctors`);
}

export function fetchDoctorSchedule(doctorId) {
  return request(`/doctors/${doctorId}/schedule`);
}

export function fetchAllDoctors() {
  return request('/doctors');
}

// ---- Wait time prediction ----
export function fetchWaitTimePrediction({ queueLength, department, averageDuration = 15 }) {
  const params = new URLSearchParams({
    queue_length: queueLength,
    department,
    average_duration: averageDuration
  });
  return request(`/predictions/wait-time?${params.toString()}`);
}

// ---- Appointments ----
export function bookAppointment(payload) {
  return request('/appointments/book', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// ---- Maintenance (admin) ----
export function archivePreviousDay() {
  return request('/maintenance/archive-previous-day', { method: 'POST' });
}

export function resetCurrentPatients() {
  return request('/maintenance/reset-current-patients', { method: 'POST' });
}

export function seedDoctors() {
  return request('/maintenance/seed-doctors', { method: 'POST' });
}

// ---- Health ----
export function fetchHealthCheck() {
  return request('/health-check');
}
