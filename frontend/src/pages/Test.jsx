import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { predictAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { Mic, MicOff, FileAudio, CheckCircle, AlertCircle } from 'lucide-react';

function getBadgeClass(r) {
  if (!r) return 'badge-unknown';
  const v = r.toLowerCase();
  return v === 'healthy' ? 'badge-healthy' : v === 'asthma' ? 'badge-asthma' : v === 'copd' ? 'badge-copd' : 'badge-unknown';
}

function getColor(l) {
  return l === 'Healthy' ? '#059669' : l === 'Asthma' ? '#d97706' : l === 'COPD' ? '#dc2626' : '#2563eb';
}

function Bar({ label, score }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span style={{ color: getColor(label), fontWeight: 700 }}>{score}%</span>
      </div>
      <div className="progress-bar-track">
        <motion.div className="progress-bar-fill"
          style={{ background: `linear-gradient(90deg, ${getColor(label)}cc, ${getColor(label)})` }}
          initial={{ width: 0 }} animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
      </div>
    </div>
  );
}

export default function Test() {
  const [mode, setMode] = useState('upload');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const fileRef = useRef(null);
  const mrRef = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(null);

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f?.name.toLowerCase().endsWith('.wav')) { setFile(f); setResult(null); } else toast.error('Please upload a .wav file'); };
  const onSelect = (e) => { const f = e.target.files[0]; if (f) { setFile(f); setResult(null); } };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mr.ondataavailable = (e) => chunks.current.push(e.data);
      mr.onstop = () => { setRecordedBlob(new Blob(chunks.current, { type: 'audio/wav' })); stream.getTracks().forEach(t => t.stop()); };
      mr.start(); mrRef.current = mr; setRecording(true); setSeconds(0);
      timer.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch { toast.error('Microphone access denied'); }
  };

  const stopRec = () => { mrRef.current?.stop(); clearInterval(timer.current); setRecording(false); toast.success('Recording saved!'); };

  const predict = async () => {
    const audio = mode === 'upload' ? file : recordedBlob ? new File([recordedBlob], 'recording.wav', { type: 'audio/wav' }) : null;
    if (!audio) { toast.error('Please select or record audio'); return; }
    const fd = new FormData(); fd.append('file', audio); setLoading(true);
    try { const res = await predictAPI.predict(fd); setResult(res.data); toast.success('Analysis complete!'); }
    catch (err) { toast.error(err.response?.data?.detail || 'Prediction failed'); }
    finally { setLoading(false); }
  };

  const fmt = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <h1>Respiratory Analysis</h1>
          <p>Upload or record a cough audio sample for AI disease classification</p>
        </div>
        <div className="grid-cols-2" style={{ alignItems: 'start' }}>
          <motion.div className="glass-card" style={{ padding: 28 }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
              {['upload', 'record'].map(m => (
                <button key={m} onClick={() => { setMode(m); setResult(null); }} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: mode === m ? 'var(--gradient-primary)' : 'transparent', color: mode === m ? '#fff' : 'var(--text-secondary)', transition: 'all 0.2s' }}>
                  {m === 'upload' ? '📁 Upload File' : '🎙️ Record Audio'}
                </button>
              ))}
            </div>
            {mode === 'upload' && (
              <div className={`upload-zone ${dragOver ? 'drag-over' : ''}`} onClick={() => fileRef.current?.click()} onDrop={onDrop} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}>
                <FileAudio size={40} style={{ margin: '0 auto 12px', color: 'var(--accent-blue)', opacity: file ? 1 : 0.4 }} />
                {file ? (<div><p style={{ fontWeight: 600 }}>{file.name}</p><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB</p></div>) : (<div><p style={{ fontWeight: 600, marginBottom: 4 }}>Drop .wav file here</p><p style={{ fontSize: 13, color: 'var(--text-muted)' }}>or click to browse</p></div>)}
                <input ref={fileRef} type="file" accept=".wav" style={{ display: 'none' }} onChange={onSelect} />
              </div>
            )}
            {mode === 'record' && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
                  <button onClick={recording ? stopRec : startRec} style={{ width: 80, height: 80, borderRadius: '50%', border: 'none', cursor: 'pointer', background: recording ? 'rgba(220,38,38,0.1)' : 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'all 0.2s', boxShadow: recording ? 'none' : '0 4px 16px rgba(37,99,235,0.3)' }} className={recording ? 'recording-pulse' : ''}>
                    {recording ? <MicOff size={30} color="#dc2626" /> : <Mic size={30} color="#fff" />}
                  </button>
                </div>
                <div style={{ fontWeight: 700, fontSize: 28, letterSpacing: 2, fontVariantNumeric: 'tabular-nums', marginBottom: 8 }}>{fmt(seconds)}</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{recording ? '🔴 Recording — click to stop' : recordedBlob ? '✅ Recording ready' : 'Click mic to start recording'}</p>
              </div>
            )}
            <button id="analyze-btn" className="btn-gradient" onClick={predict} disabled={loading || (mode === 'upload' && !file) || (mode === 'record' && !recordedBlob)} style={{ width: '100%', padding: '13px', marginTop: 20, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <><div className="spinner" style={{ width: 20, height: 20 }} /> Analyzing...</> : '🧠 Analyze Audio'}
            </button>
          </motion.div>
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="result" className="glass-card" style={{ padding: 28 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}><CheckCircle size={20} color="#059669" /><span style={{ fontWeight: 700, fontSize: 15 }}>Analysis Result</span></div>
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: '20px', marginBottom: 24, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <span className={`badge ${getBadgeClass(result.prediction)}`} style={{ fontSize: 13, padding: '6px 16px', marginBottom: 10, display: 'inline-flex' }}>{result.prediction}</span>
                    <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-2px', marginTop: 8 }}><span className="gradient-text">{result.confidence}%</span></div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Confidence Score</div>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>All Probabilities</p>
                    {Object.entries(result.all_scores).sort(([,a],[,b]) => b - a).map(([l, s]) => <Bar key={l} label={l} score={s} />)}
                  </div>
                </div>
                <button onClick={() => { setResult(null); setFile(null); setRecordedBlob(null); setSeconds(0); }} style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 600, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}>Run Another Test</button>
              </motion.div>
            ) : (
              <motion.div key="empty" className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AlertCircle size={48} style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>Your analysis result will appear here after processing</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
