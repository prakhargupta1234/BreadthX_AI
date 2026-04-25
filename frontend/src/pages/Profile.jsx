import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { historyAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { User, Mail, Calendar, Activity, Shield } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, lastResult: '—', joinedDays: 0 });

  useEffect(() => {
    historyAPI.getAll().then(res => {
      const history = res.data;
      const joinDate = new Date(user?.created_at);
      const days = Math.floor((Date.now() - joinDate) / 86400000);
      setStats({ total: history.length, lastResult: history[0]?.result ?? '—', joinedDays: isNaN(days) ? 0 : days });
    }).catch(() => {});
  }, [user]);

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase() || '?';

  const fields = [
    { icon: User, label: 'Full Name', value: user?.name },
    { icon: Mail, label: 'Email', value: user?.email },
    { icon: Calendar, label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
    { icon: Shield, label: 'Account Type', value: 'Standard User' },
  ];

  const profileStats = [
    { label: 'Total Tests', value: stats.total },
    { label: 'Days Active', value: stats.joinedDays },
    { label: 'Last Result', value: stats.lastResult },
  ];

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <h1>Profile</h1>
          <p>Your account information and activity summary</p>
        </div>

        <div className="grid-cols-2" style={{ alignItems: 'start', gap: 24 }}>
          {/* Profile card */}
          <motion.div className="glass-card" style={{ padding: 32 }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 800, color: '#fff',
                margin: '0 auto 16px',
                boxShadow: '0 6px 24px rgba(37,99,235,0.25)',
              }}>
                {initials}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>{user?.name}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{user?.email}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {fields.map(({ icon: Icon, label, value }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px', borderRadius: 10,
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={15} color="var(--accent-blue)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{value || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Stats card */}
          <motion.div className="glass-card" style={{ padding: 28 }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Activity size={17} color="var(--accent-blue)" />
              <span style={{ fontWeight: 700, fontSize: 15 }}>Activity Summary</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {profileStats.map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 16px', borderRadius: 10,
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                }}>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontSize: 20, fontWeight: 800 }} className="gradient-text">{value}</span>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 24, padding: 20, borderRadius: 12,
              background: '#eff6ff', border: '1px solid rgba(37,99,235,0.1)',
              textAlign: 'center',
            }}>
              <Activity size={28} color="var(--accent-blue)" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                BreatheX AI uses advanced deep learning to classify respiratory diseases from cough audio patterns.
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
