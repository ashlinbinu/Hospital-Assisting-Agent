import { NavLink } from 'react-router-dom';
import { useRole } from '../context/RoleContext';

const ICONS = {
  checkin: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4M12 3l8 4v5c0 5-3.4 8.4-8 9-4.6-.6-8-4-8-9V7l8-4z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  queue: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
  ),
  appointment: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
  ),
  patients: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7"/><path d="M3.5 19.5c0-3 2.4-5.4 5.5-5.4s5.5 2.4 5.5 5.4M16 8.5a3 3 0 110 6M20.5 19.5c0-2.6-1.8-4.7-4.2-5.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
  ),
  doctors: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M9 3v4a3 3 0 006 0V3M9.5 7c-2.7.7-4.5 2.7-4.5 6 0 3.5 3 6.5 7 6.5s7-3 7-6.5c0-3.3-1.8-5.3-4.5-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><circle cx="18.5" cy="17.5" r="2.3" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  wait: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7"/><path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  alerts: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 3l9.5 16.5h-19L12 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M12 10v4.2M12 17h.01" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>
  ),
  reports: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M5 20V10M12 20V4M19 20v-7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>
  )
};

const NAV_ITEMS = [
  { to: '/', label: 'Check-In & Triage', icon: 'checkin', roles: ['front_desk', 'admin'] },
  { to: '/queue', label: 'Queue Monitor', icon: 'queue', roles: ['front_desk', 'admin'] },
  { to: '/appointments', label: 'Book Appointment', icon: 'appointment', roles: ['front_desk', 'admin'] },
  { to: '/patients', label: 'Patients', icon: 'patients', roles: ['front_desk', 'admin'] },
  { to: '/doctors', label: 'Doctor Schedules', icon: 'doctors', roles: ['front_desk', 'admin'] },
  { to: '/wait-time', label: 'Wait-Time Prediction', icon: 'wait', roles: ['admin'] },
  { to: '/alerts', label: 'Emergency Alerts', icon: 'alerts', roles: ['admin'] },
  { to: '/reports', label: 'Reports & Analytics', icon: 'reports', roles: ['admin'] }
];

export default function Sidebar() {
  const { role, setRole } = useRole();
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 'var(--sidebar-width)',
        background: 'var(--color-sidebar)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10
      }}
    >
      <div style={{ padding: '22px 20px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 7,
            background: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 3l8 4v5c0 5-3.4 8.4-8 9-4.6-.6-8-4-8-9V7l8-4z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M12 8.5v6M9 11.5h6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div style={{ color: 'var(--color-sidebar-ink)', fontWeight: 600, fontSize: 14.5, letterSpacing: '-0.01em' }}>
            MediFlow
          </div>
          <div style={{ color: 'var(--color-sidebar-ink-muted)', fontSize: 10.5, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
            PATIENT FLOW SYSTEM
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '9px 12px',
              borderRadius: 6,
              marginBottom: 2,
              fontSize: 13.5,
              fontWeight: 500,
              textDecoration: 'none',
              color: isActive ? '#fff' : 'var(--color-sidebar-ink-muted)',
              background: isActive ? 'var(--color-sidebar-active)' : 'transparent',
              transition: 'background-color 120ms ease, color 120ms ease'
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.background = 'var(--color-sidebar-hover)';
                e.currentTarget.style.color = 'var(--color-sidebar-ink)';
              }
            }}
            onMouseLeave={(e) => {
              const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--color-sidebar-ink-muted)';
              }
            }}
          >
            <span style={{ display: 'flex', flexShrink: 0 }}>{ICONS[item.icon]}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '14px 16px 18px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', color: 'var(--color-sidebar-ink-muted)', marginBottom: 8 }}>
          VIEWING AS
        </div>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 7, padding: 3 }}>
          {[
            { key: 'front_desk', label: 'Front Desk' },
            { key: 'admin', label: 'Admin' }
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setRole(opt.key)}
              style={{
                flex: 1,
                border: 'none',
                cursor: 'pointer',
                padding: '7px 8px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 5,
                fontFamily: 'var(--font-ui)',
                background: role === opt.key ? 'var(--color-accent)' : 'transparent',
                color: role === opt.key ? '#fff' : 'var(--color-sidebar-ink-muted)',
                transition: 'background-color 120ms ease'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
