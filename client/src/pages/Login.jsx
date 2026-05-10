import React, { useState } from 'react';
import axios from 'axios';
import { LogIn, User, Lock, Mail, KeyRound, ArrowLeft } from 'lucide-react';

const Login = ({ setUser }) => {
  const [usernameOrId, setUsernameOrId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password States
  const [forgotMode, setForgotMode] = useState('none'); // none, email, otp, reset
  const [email, setEmail] = useState('');
  const [userIdForReset, setUserIdForReset] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { usernameOrId, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password', { email, userId: userIdForReset });
      setForgotMode('otp');
      setSuccess('OTP has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('http://localhost:5000/api/auth/verify-otp', { email, otp });
      setForgotMode('reset');
      setSuccess('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('http://localhost:5000/api/auth/reset-password', { email, otp, newPassword });
      setForgotMode('none');
      setSuccess('Password reset successful! Please login with your new password.');
      setEmail('');
      setOtp('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setForgotMode('none');
    setError('');
    setSuccess('');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div className="glass-card animate-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            background: 'var(--primary)', 
            borderRadius: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 1rem',
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
          }}>
            {forgotMode === 'none' ? <LogIn color="white" size={32} /> : <KeyRound color="white" size={32} />}
          </div>
          
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>
            {forgotMode === 'none' ? 'Welcome Back' : 
             forgotMode === 'email' ? 'Forgot Password' : 
             forgotMode === 'otp' ? 'Verify OTP' : 'New Password'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {forgotMode === 'none' ? 'Login to manage your efforts' : 
             forgotMode === 'email' ? 'Enter your email to receive an OTP' : 
             forgotMode === 'otp' ? 'Check your email for the 6-digit code' : 'Enter your new secure password'}
          </p>
        </div>

        {/* LOGIN FORM */}
        {forgotMode === 'none' && (
          <form onSubmit={handleLogin} className="grid">
            <div>
              <label>Username or User ID</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Enter username or ID" 
                  value={usernameOrId}
                  onChange={(e) => setUsernameOrId(e.target.value)}
                  style={{ paddingLeft: '3rem' }}
                  required 
                />
              </div>
            </div>

            <div>
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '3rem' }}
                  required 
                />
              </div>
            </div>

            {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>}
            {success && <p style={{ color: 'var(--success)', fontSize: '0.875rem', textAlign: 'center' }}>{success}</p>}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? 'Logging in...' : 'Sign In'}
            </button>

            <button 
              type="button" 
              onClick={() => setForgotMode('email')}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.875rem', cursor: 'pointer', marginTop: '1rem' }}
            >
              Forgot Password?
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD - EMAIL & USER ID STEP */}
        {forgotMode === 'email' && (
          <form onSubmit={handleSendOtp} className="grid">
            <div>
              <label>User ID</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Enter your User ID" 
                  value={userIdForReset}
                  onChange={(e) => setUserIdForReset(e.target.value)}
                  style={{ paddingLeft: '3rem' }}
                  required 
                />
              </div>
            </div>

            <div>
              <label>Registered Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '3rem' }}
                  required 
                />
              </div>
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? 'Verifying...' : 'Send OTP'}
            </button>
            <button onClick={resetFlow} type="button" className="btn" style={{ gap: '0.5rem', background: 'none', color: 'var(--text-muted)' }}>
              <ArrowLeft size={16} /> Back to Login
            </button>
          </form>
        )}

        {/* OTP VERIFICATION STEP */}
        {forgotMode === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="grid">
            <div>
              <label>Enter 6-digit OTP</label>
              <input 
                type="text" 
                placeholder="123456" 
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.25rem', fontWeight: 700 }}
                required 
              />
            </div>
            {success && <p style={{ color: 'var(--success)', fontSize: '0.875rem', textAlign: 'center' }}>{success}</p>}
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button onClick={() => setForgotMode('email')} type="button" className="btn" style={{ gap: '0.5rem', background: 'none', color: 'var(--text-muted)' }}>
              <ArrowLeft size={16} /> Use different email
            </button>
          </form>
        )}

        {/* RESET PASSWORD STEP */}
        {forgotMode === 'reset' && (
          <form onSubmit={handleResetPassword} className="grid">
            <div>
              <label>New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingLeft: '3rem' }}
                  required 
                />
              </div>
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default Login;
