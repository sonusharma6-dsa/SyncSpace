import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/Auth/AuthShell';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithDemo } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithDemo();
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to launch demo mode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="A calmer place for markdown notes"
      description="Quick capture, live preview, instant search, and clean organization without folder sprawl."
      footer={<p>New here? <Link to="/signup">Create an account</Link></p>}
    >
      {error && <div className="inline-alert error">{error}</div>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          <span>Email</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
        </label>
        <label>
          <span>Password</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required />
        </label>
        <button type="submit" className="primary-button wide" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <div className="auth-card-actions">
        <button type="button" className="ghost-button wide" onClick={handleDemo} disabled={loading}>Try demo mode</button>
        <Link to="/forgot-password" className="text-button">Forgot password?</Link>
      </div>
    </AuthShell>
  );
};

export default Login;
