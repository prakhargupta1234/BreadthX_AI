import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { historyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Activity, TestTube, TrendingUp, Clock, ArrowRight, X, Shield, ShieldAlert, ShieldX, RotateCcw, FileAudio } from 'lucide-react';

/* ── helpers ──────────────────────────────────────────────── */
function getBadgeClass(result) {
  if (!result) return 'badge-unknown';
  const r = result.toLowerCase();
  if (r === 'healthy') return 'badge-healthy';
  if (r === 'asthma') return 'badge-asthma';
  if (r === 'copd') return 'badge-copd';
  return 'badge-unknown';
}
function getColor(l) {
  return l === 'Healthy' ? '#059669' : l === 'Asthma' ? '#d97706' : l === 'COPD' ? '#dc2626' : '#2563eb';
}
function getResultIcon(r) {
  if (!r) return Shield;
  const v = r.toLowerCase();
  return v === 'healthy' ? Shield : v === 'asthma' ? ShieldAlert : ShieldX;
}
function getRecommendation(r) {
  if (!r) return '';
  const v = r.toLowerCase();
  if (v === 'healthy') return 'Your respiratory pattern appears normal. Continue maintaining healthy habits and regular check-ups.';
  if (v === 'asthma') return 'Indicators suggest possible asthma patterns. Consider consulting a pulmonologist for professional evaluation.';
  if (v === 'copd') return 'Indicators suggest possible COPD patterns. We recommend scheduling an appointment with a respiratory specialist.';
  return 'Analysis complete. Consult a healthcare professional for interpretation.';
}

/* ── Confidence Ring ──────────────────────────────────────── */
function ConfidenceRing({ value, color }) {
  const r = 50, stroke = 6;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <motion.circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.span style={{ fontSize: 26, fontWeight: 900, color }}
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}>{value}%</motion.span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Confidence</span>
      </div>
    </div>
  );
}

/* ── Bar ──────────────────────────────────────────────────── */
function Bar({ label, score }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span style={{ color: getColor(label), fontWeight: 700 }}>{score}%</span>
      </div>
      <div className="progress-bar-track">
        <motion.div className="progress-bar-fill"
          style={{ background: `linear-gradient(90deg, ${getColor(label)}cc, ${getColor(label)})` }}
          initial={{ width: 0 }} animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
      </div>
    </div>
  );
}

/* ── Report Modal ─────────────────────────────────────────── */
function ReportModal({ item, onClose }) {
  if (!item) return null;
  const color = getColor(item.result);
  const ResultIcon = getResultIcon(item.result);
  const navigate = useNavigate();

  return (
    <motion.div className="modal-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div className="modal-card results-modal"
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}>

        <button onClick={onClose} className="modal-close-btn" aria-label="Close">
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <motion.div style={{
            width: 52, height: 52, borderRadius: '50%', margin: '0 auto 14px',
            background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${color}30`
          }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
            <ResultIcon size={24} color={color} />
          </motion.div>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Test Report</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            <FileAudio size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            {item.filename} · {new Date(item.created_at).toLocaleString()}
          </p>
        </div>

        {/* Result + Ring */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 24, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <ConfidenceRing value={item.confidence} color={color} />
          <div style={{ textAlign: 'center' }}>
            <span className={`badge ${getBadgeClass(item.result)}`}
              style={{ fontSize: 15, padding: '8px 22px', fontWeight: 700 }}>{item.result}</span>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>Classification</p>
          </div>
        </div>

        {/* Probabilities */}
        {item.all_scores && Object.keys(item.all_scores).length > 0 && (
          <div style={{ background: '#f8fafc', borderRadius: 14, padding: '18px 20px', marginBottom: 18, border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
              Disease Probability Breakdown
            </p>
            {Object.entries(item.all_scores).sort(([, a], [, b]) => b - a).map(([l, s]) => <Bar key={l} label={l} score={s} />)}
          </div>
        )}

        {/* Recommendation */}
        <div style={{ background: `${color}08`, borderRadius: 12, padding: '14px 18px', marginBottom: 20, border: `1px solid ${color}18` }}>
          <p style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>💡 Recommendation</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{getRecommendation(item.result)}</p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/test')} className="btn-gradient"
            style={{ flex: 1, padding: '11px', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <RotateCcw size={15} /> New Test
          </button>
          <button onClick={onClose}
            style={{ flex: 1, padding: '11px', fontSize: 14, fontWeight: 600, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            Close
          </button>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
          ⚕️ For screening only — consult a qualified healthcare professional.
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════════════════ */
const fadeIn = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    historyAPI.getAll().then(res => setHistory(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const total = history.length;
  const lastResult = history[0]?.result ?? '—';
  const avgConf = total ? (history.reduce((s, h) => s + h.confidence, 0) / total).toFixed(1) : '—';
  const recentItems = history.slice(0, 5);

  const stats = [
    { label: 'Total Tests', value: total, icon: TestTube, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Last Result', value: lastResult, icon: Activity, color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'Avg Confidence', value: avgConf !== '—' ? `${avgConf}%` : '—', icon: TrendingUp, color: '#059669', bg: '#ecfdf5' },
  ];

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        {/* Header with Start New Test top-right */}
        <motion.div className="page-header"
          initial="hidden" animate="show" variants={fadeIn} transition={{ duration: 0.4 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back, <span className="gradient-text">{user?.name}</span> 👋</p>
          </div>
          <Link to="/test">
            <button className="btn-gradient" style={{ padding: '10px 22px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TestTube size={16} /> Start New Test
            </button>
          </Link>
        </motion.div>

        {/* Stat cards */}
        <motion.div className="grid-cols-3" style={{ marginBottom: 28 }}
          initial="hidden" animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
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
        <motion.div className="glass-card"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}>
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
                  <tr key={item.id} className="clickable-row" onClick={() => setSelectedItem(item)}>
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

        {/* Report modal */}
        <AnimatePresence>
          {selectedItem && (
            <ReportModal item={selectedItem} onClose={() => setSelectedItem(null)} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
