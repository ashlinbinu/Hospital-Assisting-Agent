import { Routes, Route, Navigate } from 'react-router-dom';
import { RoleProvider, useRole } from './context/RoleContext';
import Sidebar from './components/Sidebar';
import CheckIn from './pages/CheckIn';
import QueueMonitor from './pages/QueueMonitor';
import BookAppointment from './pages/BookAppointment';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import WaitTimePrediction from './pages/WaitTimePrediction';
import EmergencyAlerts from './pages/EmergencyAlerts';
import Reports from './pages/Reports';

function AdminRoute({ children }) {
  const { role } = useRole();
  if (role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function Shell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Routes>
          <Route path="/" element={<CheckIn />} />
          <Route path="/queue" element={<QueueMonitor />} />
          <Route path="/appointments" element={<BookAppointment />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/wait-time" element={<AdminRoute><WaitTimePrediction /></AdminRoute>} />
          <Route path="/alerts" element={<AdminRoute><EmergencyAlerts /></AdminRoute>} />
          <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <RoleProvider>
      <Shell />
    </RoleProvider>
  );
}
