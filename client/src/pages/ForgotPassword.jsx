import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../components/Auth/AuthShell';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await forgotPassword(email);
      setMessage(response);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to submit that request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Password help"
      title="Reset flow placeholder for self-hosted deployments"
      description="This MVP returns a production-style response so you can connect your preferred mail provider later."
      footer={<p>Back to <Link to="/login">sign in</Link></p>}
    >
      {message && <div className="inline-alert success">{message}</div>}
      {error && <div className="inline-alert error">{error}</div>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          <span>Email</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
        </label>
        <button type="submit" className="primary-button wide" disabled={loading}>{loading ? 'Submitting…' : 'Request reset'}</button>
      </form>
    </AuthShell>
  );
};

export default ForgotPassword;
