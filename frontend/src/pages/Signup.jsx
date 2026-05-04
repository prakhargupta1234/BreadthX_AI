import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Activity, AlertCircle } from 'lucide-react';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Ensure fields are empty on mount and clear errors
  useEffect(() => {
    setForm({ name: '', email: '', password: '' });
    setError('');
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { 
      const msg = 'Password must be at least 6 characters';
      setError(msg);
      toast.error(msg); 
      return; 
    }
    setLoading(true);
    setError('');
    try {
      await authAPI.signup(form);
      toast.success('Registration successful! Please check your email to activate your account.', {
        duration: 6000,
      });
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Signup failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { id: 'signup-name', name: 'name', type: 'text', placeholder: 'John Doe', label: 'Full name', icon: User },
    { id: 'signup-email', name: 'email', type: 'email', placeholder: 'you@example.com', label: 'Email address', icon: Mail },
    { id: 'signup-password', name: 'password', type: 'password', placeholder: '••••••••', label: 'Password', icon: Lock },
  ];

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <motion.div className="auth-card"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 6px 24px rgba(37,99,235,0.25)' }}>
            <Activity size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Create account</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 14 }}>Join BreatheX AI — respiratory disease detection</p>
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
          {fields.map(({ id, name, type, placeholder, label, icon: Icon }) => (
            <div key={name}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{label}</label>
              <div style={{ position: 'relative' }}>
                <Icon size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  id={id} 
                  name={name} 
                  type={type} 
                  placeholder={placeholder} 
                  value={form[name]} 
                  onChange={handleChange} 
                  required 
                  autoComplete={name === 'password' ? 'new-password' : (name === 'email' ? 'email' : 'name')} 
                  className="glass-input" 
                  style={{ width: '100%', padding: '12px 14px 12px 42px', fontSize: 14 }} 
                />
              </div>
            </div>
          ))}
          <button id="signup-submit" type="submit" className="btn-gradient" disabled={loading} style={{ padding: '14px', fontSize: 15, marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <><div className="spinner" style={{ width: 20, height: 20 }} /> Creating...</> : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-blue)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
