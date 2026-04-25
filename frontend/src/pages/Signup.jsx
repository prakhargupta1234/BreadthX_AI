import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Activity } from 'lucide-react';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await authAPI.signup(form);
      login(res.data.access_token, res.data.user);
      toast.success(`Account created! Welcome, ${res.data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Signup failed');
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {fields.map(({ id, name, type, placeholder, label, icon: Icon }) => (
            <div key={name}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{label}</label>
              <div style={{ position: 'relative' }}>
                <Icon size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id={id} name={name} type={type} placeholder={placeholder} value={form[name]} onChange={handleChange} required className="glass-input" style={{ width: '100%', padding: '12px 14px 12px 42px', fontSize: 14 }} />
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
