import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/Auth/AuthShell';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Create account"
      title="Build your own personal note mesh"
      description="Capture ideas, drafts, research, and checklists in one fast markdown-first workspace."
      footer={<p>Already have an account? <Link to="/login">Sign in</Link></p>}
    >
      {error && <div className="inline-alert error">{error}</div>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          <span>Name</span>
          <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ada Lovelace" required />
        </label>
        <label>
          <span>Email</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ada@example.com" required />
        </label>
        <label>
          <span>Password</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" minLength={6} required />
        </label>
        <button type="submit" className="primary-button wide" disabled={loading}>{loading ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthShell>
  );
};

export default Signup;
