import React, { useState } from 'react';
import api from '../services/api';
import { User, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        mobile,
        password,
        role: 'admin',
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.location.href = '/';
    } catch (error) {
      alert(
        'Login Failed: ' +
          (error.response?.data?.message || 'Invalid credentials')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={styles.title}>Welcome Back</h1>
          <p style={styles.subtitle}>Sign in to Stella Admin Portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={styles.form}>
          {/* Mobile */}
          <div>
            <label style={styles.label}>Mobile Number / Login ID</label>
            <div style={styles.inputWrapper}>
              <User size={18} style={styles.icon} />
              <input
                type="text"
                placeholder="Enter Admin ID"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                style={styles.input}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.icon} />
              <input
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
              />
            </div>
          </div>

          {/* Button */}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? (
              'Signing In...'
            ) : (
              <span style={styles.buttonContent}>
                Sign In <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        {/* Footer */}
        <p style={styles.footerText}>
          Having trouble? Contact IT Support.
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  card: {
    width: '100%',
    maxWidth: '420px', // 🔥 THIS fixes stretched inputs
    backgroundColor: '#ffffff',
    padding: '32px',
    borderRadius: '14px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '6px',
    display: 'block',
    color: '#334155',
  },
  inputWrapper: {
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
  },
  input: {
    width: '100%',
    height: '44px',
    padding: '10px 12px 10px 40px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
  },
  button: {
    marginTop: '12px',
    height: '46px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  buttonContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  footerText: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '12px',
    color: '#94a3b8',
  },
};

export default Login;
