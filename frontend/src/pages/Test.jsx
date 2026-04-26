import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { predictAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { Mic, MicOff, FileAudio, CheckCircle, AlertCircle, X, History, RotateCcw, Shield, ShieldAlert, ShieldX, Loader } from 'lucide-react';

/* ── helpers ──────────────────────────────────────────────── */
function getColor(l) {
  return l === 'Healthy' ? '#059669' : l === 'Asthma' ? '#d97706' : l === 'COPD' ? '#dc2626' : '#2563eb';
}
function getBadgeClass(r) {
  if (!r) return 'badge-unknown';
  const v = r.toLowerCase();
  return v === 'healthy' ? 'badge-healthy' : v === 'asthma' ? 'badge-asthma' : v === 'copd' ? 'badge-copd' : 'badge-unknown';
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

/* ── WAV encoder (converts raw PCM Float32 to 16-bit WAV blob) ── */
function encodeWavBlob(audioBuffer) {
  const numChannels = 1;
  const sampleRate = audioBuffer.sampleRate;
  const samples = audioBuffer.getChannelData(0);
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

/* ── Progress Bar component ────────────────────────────────── */
function Bar({ label, score }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
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

/* ── Circular Confidence Ring ──────────────────────────────── */
function ConfidenceRing({ value, color }) {
  const r = 54, stroke = 7;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto' }}>
      <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <motion.circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.span style={{ fontSize: 32, fontWeight: 900, color }}
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}>{value}%</motion.span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Confidence</span>
      </div>
    </div>
  );
}

/* ── Analysis Steps Indicator ─────────────────────────────── */
const STEPS = ['Recording audio', 'Uploading file', 'AI processing', 'Generating report'];
function AnalysisProgress({ step }) {
  return (
    <div style={{ padding: '32px 0' }}>
      {STEPS.map((s, i) => (
        <motion.div key={s} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: i < 3 ? 18 : 0 }}
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: i < step ? 'var(--gradient-primary)' : i === step ? 'rgba(37,99,235,0.1)' : '#f1f5f9',
            border: i === step ? '2px solid var(--accent-blue)' : '2px solid transparent',
            transition: 'all 0.3s'
          }}>
            {i < step ? <CheckCircle size={14} color="#fff" /> :
             i === step ? <Loader size={14} color="var(--accent-blue)" className="spin-slow" /> :
             <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</span>}
          </div>
          <span style={{ fontSize: 13, fontWeight: i <= step ? 600 : 400, color: i <= step ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Results Modal ────────────────────────────────────────── */
function ResultsModal({ result, onClose, onNewTest }) {
  if (!result) return null;
  const ResultIcon = getResultIcon(result.prediction);
  const color = getColor(result.prediction);

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

        {/* Close btn */}
        <button onClick={onClose} className="modal-close-btn" aria-label="Close">
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <motion.div style={{
            width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
            background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${color}30`
          }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
            <ResultIcon size={26} color={color} />
          </motion.div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Analysis Complete</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>AI-powered respiratory assessment result</p>
        </div>

        {/* Result badge + confidence ring */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 28, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <ConfidenceRing value={result.confidence} color={color} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <span className={`badge ${getBadgeClass(result.prediction)}`}
              style={{ fontSize: 15, padding: '8px 22px', fontWeight: 700 }}>{result.prediction}</span>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>Primary Classification</p>
          </div>
        </div>

        {/* Probabilities */}
        <div style={{ background: '#f8fafc', borderRadius: 14, padding: '20px 22px', marginBottom: 20, border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
            Disease Probability Breakdown
          </p>
          {Object.entries(result.all_scores).sort(([, a], [, b]) => b - a).map(([l, s]) => <Bar key={l} label={l} score={s} />)}
        </div>

        {/* Recommendation */}
        <div style={{ background: `${color}08`, borderRadius: 12, padding: '16px 20px', marginBottom: 24, border: `1px solid ${color}18` }}>
          <p style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            💡 Recommendation
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {getRecommendation(result.prediction)}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onNewTest} className="btn-gradient"
            style={{ flex: 1, padding: '12px', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <RotateCcw size={15} /> Run Another Test
          </button>
          <button onClick={onClose}
            style={{ flex: 1, padding: '12px', fontSize: 14, fontWeight: 600, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <History size={15} /> View Details
          </button>
        </div>

        {/* Disclaimer */}
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
          ⚕️ This AI analysis is for screening purposes only. Always consult a qualified healthcare professional for medical advice.
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════════════════ */
/*  MAIN TEST PAGE                                              */
/* ═════════════════════════════════════════════════════════════ */
export default function Test() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('upload');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [analysisStep, setAnalysisStep] = useState(0);
  const fileRef = useRef(null);
  const mrRef = useRef(null);
  const audioCtxRef = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(null);

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f?.name.toLowerCase().endsWith('.wav')) { setFile(f); setResult(null); } else toast.error('Please upload a .wav file'); };
  const onSelect = (e) => { const f = e.target.files[0]; if (f) { setFile(f); setResult(null); } };

  /* ── Record: capture raw PCM via ScriptProcessor, encode to WAV ── */
  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      const pcmChunks = [];

      processor.onaudioprocess = (e) => {
        pcmChunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      // Store refs for cleanup
      chunks.current = pcmChunks;
      mrRef.current = { source, processor, stream, audioCtx };
      setRecording(true);
      setSeconds(0);
      timer.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stopRec = useCallback(() => {
    clearInterval(timer.current);
    const refs = mrRef.current;
    if (!refs) return;

    refs.processor.disconnect();
    refs.source.disconnect();
    refs.stream.getTracks().forEach(t => t.stop());

    // Merge PCM chunks into one Float32Array
    const pcmChunks = chunks.current;
    const totalLen = pcmChunks.reduce((s, c) => s + c.length, 0);
    const merged = new Float32Array(totalLen);
    let offset = 0;
    for (const chunk of pcmChunks) { merged.set(chunk, offset); offset += chunk.length; }

    // Create an AudioBuffer to pass to WAV encoder
    const audioCtx = refs.audioCtx;
    const buf = audioCtx.createBuffer(1, merged.length, audioCtx.sampleRate);
    buf.copyToChannel(merged, 0);
    const wavBlob = encodeWavBlob(buf);

    audioCtx.close();
    setRecordedBlob(wavBlob);
    setRecording(false);
    toast.success('Recording saved!');
  }, []);

  const predict = async () => {
    const audio = mode === 'upload' ? file : recordedBlob ? new File([recordedBlob], 'recording.wav', { type: 'audio/wav' }) : null;
    if (!audio) { toast.error('Please select or record audio'); return; }
    const fd = new FormData(); fd.append('file', audio);
    setLoading(true);
    setAnalysisStep(0);

    // Simulate step progress
    const stepTimer = setInterval(() => {
      setAnalysisStep(s => { if (s < 3) return s + 1; clearInterval(stepTimer); return s; });
    }, 800);

    try {
      const res = await predictAPI.predict(fd);
      clearInterval(stepTimer);
      setAnalysisStep(3);
      setResult(res.data);
      setTimeout(() => setShowModal(true), 300);
      toast.success('Analysis complete!');
    } catch (err) {
      clearInterval(stepTimer);
      toast.error(err.response?.data?.detail || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNewTest = () => {
    setShowModal(false);
    setResult(null);
    setFile(null);
    setRecordedBlob(null);
    setSeconds(0);
    setAnalysisStep(0);
  };

  const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <h1>Respiratory Analysis</h1>
          <p>Upload or record a cough audio sample for AI disease classification</p>
        </div>

        <div className="grid-cols-2" style={{ alignItems: 'start' }}>
          {/* LEFT — Input Panel */}
          <motion.div className="glass-card" style={{ padding: 28 }}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>

            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
              {['upload', 'record'].map(m => (
                <button key={m} onClick={() => { setMode(m); setResult(null); setShowModal(false); }}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                    background: mode === m ? 'var(--gradient-primary)' : 'transparent',
                    color: mode === m ? '#fff' : 'var(--text-secondary)', transition: 'all 0.2s'
                  }}>
                  {m === 'upload' ? '📁 Upload File' : '🎙️ Record Audio'}
                </button>
              ))}
            </div>

            {/* Upload zone */}
            {mode === 'upload' && (
              <div className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                onClick={() => fileRef.current?.click()} onDrop={onDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}>
                <FileAudio size={40} style={{ margin: '0 auto 12px', color: 'var(--accent-blue)', opacity: file ? 1 : 0.4 }} />
                {file ? (
                  <div>
                    <p style={{ fontWeight: 600 }}>{file.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>Drop .wav file here</p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>or click to browse</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept=".wav" style={{ display: 'none' }} onChange={onSelect} />
              </div>
            )}

            {/* Record zone */}
            {mode === 'record' && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
                  <button onClick={recording ? stopRec : startRec}
                    style={{
                      width: 80, height: 80, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: recording ? 'rgba(220,38,38,0.1)' : 'var(--gradient-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative', transition: 'all 0.2s',
                      boxShadow: recording ? 'none' : '0 4px 16px rgba(37,99,235,0.3)'
                    }}
                    className={recording ? 'recording-pulse' : ''}>
                    {recording ? <MicOff size={30} color="#dc2626" /> : <Mic size={30} color="#fff" />}
                  </button>
                </div>
                <div style={{ fontWeight: 700, fontSize: 28, letterSpacing: 2, fontVariantNumeric: 'tabular-nums', marginBottom: 8 }}>
                  {fmt(seconds)}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {recording ? '🔴 Recording — click to stop' : recordedBlob ? '✅ Recording ready' : 'Click mic to start recording'}
                </p>
              </div>
            )}

            {/* Analyze button */}
            <button id="analyze-btn" className="btn-gradient" onClick={predict}
              disabled={loading || (mode === 'upload' && !file) || (mode === 'record' && !recordedBlob)}
              style={{ width: '100%', padding: '13px', marginTop: 20, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <><div className="spinner" style={{ width: 20, height: 20 }} /> Analyzing...</> : '🧠 Analyze Audio'}
            </button>
          </motion.div>

          {/* RIGHT — Status / Placeholder */}
          <motion.div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 340 }}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            {loading ? (
              <AnalysisProgress step={analysisStep} />
            ) : result ? (
              <div style={{ textAlign: 'center' }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                  <CheckCircle size={52} color="#059669" style={{ marginBottom: 16 }} />
                </motion.div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Analysis Complete!</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Your results are ready to view</p>
                <button onClick={() => setShowModal(true)} className="btn-gradient"
                  style={{ padding: '10px 28px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  View Full Report
                </button>
              </div>
            ) : (
              <>
                <AlertCircle size={48} style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>
                  Your analysis result will appear here after processing
                </p>
              </>
            )}
          </motion.div>
        </div>

        {/* Results Modal */}
        <AnimatePresence>
          {showModal && result && (
            <ResultsModal result={result} onClose={() => setShowModal(false)} onNewTest={handleNewTest} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
