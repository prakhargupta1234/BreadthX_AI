import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Activity, AlertCircle } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Ensure fields are empty on mount and clear errors
  useEffect(() => {
    setForm({ email: '', password: '' });
    setError('');
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.login(form);
      login(res.data.access_token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid email or password';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-bg-overlay" />

      {/* Top Left Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{ position: 'absolute', top: 32, left: 40, zIndex: 10, display: 'flex', alignItems: 'center' }}
      >
        <img src="/logo-light-text.png" alt="BreatheX AI" style={{ height: 42, objectFit: 'contain' }} />
      </motion.div>

      <motion.div className="auth-card"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img src="/logo-dark-text.png" alt="BreatheX AI Logo" style={{ height: 48, objectFit: 'contain', margin: '0 auto 18px', display: 'block' }} />
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 14 }}>Sign in to continue to BreatheX AI</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="alert-error"
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input id="login-email" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required autoComplete="email" className="glass-input" style={{ width: '100%', padding: '12px 14px 12px 42px', fontSize: 14 }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input id="login-password" type="password" name="password" placeholder="••••••••" value={form.password} onChange={handleChange} required autoComplete="current-password" className="glass-input" style={{ width: '100%', padding: '12px 14px 12px 42px', fontSize: 14 }} />
            </div>
          </div>
          <button id="login-submit" type="submit" className="btn-gradient" disabled={loading} style={{ padding: '14px', fontSize: 15, marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <><div className="spinner" style={{ width: 20, height: 20 }} /> Signing in...</> : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--accent-blue)', fontWeight: 600, textDecoration: 'none' }}>Create one</Link>
        </p>
      </motion.div>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        style={{ position: 'absolute', bottom: 32, left: 40, right: 40, zIndex: 10, display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)', fontSize: 13, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}
      >
        <span>© 2026 BreatheX AI. All Rights Reserved.</span>
        <div style={{ display: 'flex', gap: 24 }}>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e)=>e.target.style.color='#fff'} onMouseLeave={(e)=>e.target.style.color='rgba(255,255,255,0.7)'}>Privacy Policy</span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e)=>e.target.style.color='#fff'} onMouseLeave={(e)=>e.target.style.color='rgba(255,255,255,0.7)'}>Terms of Service</span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e)=>e.target.style.color='#fff'} onMouseLeave={(e)=>e.target.style.color='rgba(255,255,255,0.7)'}>Contact Support</span>
        </div>
      </motion.div>
    </div>
  );
}
