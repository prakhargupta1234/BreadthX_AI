import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { historyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Activity, TestTube, TrendingUp, Clock, ArrowRight } from 'lucide-react';

function getBadgeClass(result) {
  if (!result) return 'badge-unknown';
  const r = result.toLowerCase();
  if (r === 'healthy') return 'badge-healthy';
  if (r === 'asthma')  return 'badge-asthma';
  if (r === 'copd')    return 'badge-copd';
  return 'badge-unknown';
}

const fadeIn = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    historyAPI.getAll().then(res => {
      setHistory(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const total        = history.length;
  const lastResult   = history[0]?.result ?? '—';
  const avgConf      = total ? (history.reduce((s, h) => s + h.confidence, 0) / total).toFixed(1) : '—';
  const recentItems  = history.slice(0, 5);

  const stats = [
    { label: 'Total Tests', value: total, icon: TestTube, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Last Result', value: lastResult, icon: Activity, color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'Avg Confidence', value: avgConf !== '—' ? `${avgConf}%` : '—', icon: TrendingUp, color: '#059669', bg: '#ecfdf5' },
  ];

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        {/* Header */}
        <motion.div
          className="page-header"
          initial="hidden" animate="show" variants={fadeIn}
          transition={{ duration: 0.4 }}
        >
          <h1>Dashboard</h1>
          <p>Welcome back, <span className="gradient-text">{user?.name}</span> 👋</p>
        </motion.div>

        {/* Stat cards */}
        <motion.div
          className="grid-cols-3"
          style={{ marginBottom: 28 }}
          initial="hidden" animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        >
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <motion.div key={label} className="glass-card stat-card glass-card-hover" variants={fadeIn}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="stat-label">{label}</span>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={color} />
                </div>
              </div>
              <span className="stat-value gradient-text">{loading ? '...' : value}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Tests */}
        <motion.div
          className="glass-card"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={17} color="var(--accent-blue)" />
              <span style={{ fontWeight: 700, fontSize: 15 }}>Recent Tests</span>
            </div>
            <Link to="/history" style={{ fontSize: 13, color: 'var(--accent-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : recentItems.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Activity size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>No tests yet.</p>
              <Link to="/test" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontSize: 14, fontWeight: 600, display: 'inline-block', marginTop: 8 }}>
                Run your first test →
              </Link>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Result</th>
                  <th>Confidence</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.filename}
                    </td>
                    <td>
                      <span className={`badge ${getBadgeClass(item.result)}`}>{item.result}</span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.confidence}%</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>

        {/* Quick action */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ marginTop: 20 }}
        >
          <Link to="/test">
            <button className="btn-gradient" style={{ padding: '13px 28px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TestTube size={16} />
              Start New Test
            </button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
