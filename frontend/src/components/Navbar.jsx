import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Stethoscope, History, User, LogOut, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/test',      label: 'New Test',   icon: Stethoscope },
  { to: '/history',   label: 'History',    icon: History },
  { to: '/profile',   label: 'Profile',    icon: User },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
          }}>
            <Activity size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>BreatheX AI</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Disease Classifier</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 16, marginTop: 16 }}>
        <div style={{ padding: '8px 14px', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {user?.name || 'User'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {user?.email || ''}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="nav-item"
          style={{ width: '100%', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
