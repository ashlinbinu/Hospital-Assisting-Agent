export async function fetchDepartments() {
  const response = await fetch('/api/departments');
  if (!response.ok) {
    throw new Error('Failed to load departments');
  }
  return response.json();
}

export async function fetchDoctorsByDepartment(department) {
  const response = await fetch(`/api/departments/${encodeURIComponent(department)}/doctors`);
  if (!response.ok) {
    throw new Error(`Failed to load doctors for ${department}`);
  }
  return response.json();
}

export async function fetchDoctorSchedule(doctorId) {
  const response = await fetch(`/api/doctors/${doctorId}/schedule`);
  if (!response.ok) {
    throw new Error(`Failed to load schedule for Doctor ${doctorId}`);
  }
  return response.json();
}
