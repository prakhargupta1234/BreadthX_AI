import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { historyAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { Trash2, History as HistoryIcon, FileAudio, Calendar } from 'lucide-react';

function getBadgeClass(r) {
  if (!r) return 'badge-unknown';
  const v = r.toLowerCase();
  return v === 'healthy' ? 'badge-healthy' : v === 'asthma' ? 'badge-asthma' : v === 'copd' ? 'badge-copd' : 'badge-unknown';
}

export default function History() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    historyAPI.getAll()
      .then(res => setRecords(res.data))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try { await historyAPI.deleteOne(id); setRecords(prev => prev.filter(r => r.id !== id)); toast.success('Record deleted'); }
    catch { toast.error('Failed to delete'); }
    finally { setDeletingId(null); }
  };

  const filteredRecords = records.filter(r => {
    if (!startDate && !endDate) return true;
    const d = new Date(r.created_at);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const recordDate = `${yy}-${mm}-${dd}`;
    
    if (startDate && recordDate < startDate) return false;
    if (endDate && recordDate > endDate) return false;
    return true;
  });

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <h1>Test History</h1>
          <p>All your past respiratory analysis results</p>
        </div>

        <motion.div className="glass-card"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <HistoryIcon size={17} color="var(--accent-blue)" />
              <span style={{ fontWeight: 700, fontSize: 15 }}>
                {loading ? 'Loading...' : `${filteredRecords.length} record${filteredRecords.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Calendar size={16} color="var(--text-secondary)" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>From:</span>
                <input 
                  type="date" 
                  className="glass-input" 
                  style={{ padding: '6px 12px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 8, color: 'var(--text-primary)' }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>To:</span>
                <input 
                  type="date" 
                  className="glass-input" 
                  style={{ padding: '6px 12px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 8, color: 'var(--text-primary)' }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              {(startDate || endDate) && (
                <button onClick={() => { setStartDate(''); setEndDate(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Clear</button>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : filteredRecords.length === 0 ? (
            <div style={{ padding: 64, textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileAudio size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>{records.length === 0 ? 'No predictions yet. Start by running a test!' : 'No records found for the selected date.'}</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>#</th><th>File</th><th>Result</th><th>Confidence</th><th>Date</th><th>Action</th></tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredRecords.map((rec, idx) => (
                      <motion.tr key={rec.id}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }} transition={{ delay: idx * 0.03 }}>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{rec.id}</td>
                        <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{rec.filename}</td>
                        <td><span className={`badge ${getBadgeClass(rec.result)}`}>{rec.result}</span></td>
                        <td style={{ fontWeight: 700 }}>
                          <span style={{ color: rec.confidence > 70 ? '#059669' : rec.confidence > 40 ? '#d97706' : '#dc2626' }}>{rec.confidence}%</span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{new Date(rec.created_at).toLocaleString()}</td>
                        <td>
                          <button id={`delete-${rec.id}`} onClick={() => handleDelete(rec.id)} disabled={deletingId === rec.id}
                            style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.12)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#dc2626', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {deletingId === rec.id ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Trash2 size={14} />}
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
