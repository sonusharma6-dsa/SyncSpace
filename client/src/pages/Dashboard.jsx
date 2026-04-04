import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import StatusBadge from '../components/UI/StatusBadge';
import { useOffline } from '../hooks/useOffline';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { workspaces, setWorkspaces } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [newName, setNewName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const isOffline = useOffline();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const { data } = await axios.get('/api/workspaces');
      setWorkspaces(data.workspaces);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { data } = await axios.post('/api/workspaces', { name: newName });
      setWorkspaces(prev => [...prev, data.workspace]);
      setNewName('');
      navigate(`/workspace/${data.workspace._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    if (!inviteCode.trim()) return;
    setJoining(true);
    try {
      const { data } = await axios.post('/api/workspaces/join', { inviteCode });
      setWorkspaces(prev => [...prev, data.workspace]);
      setInviteCode('');
      navigate(`/workspace/${data.workspace._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join workspace');
    } finally {
      setJoining(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🚀</span>
          <span style={{ fontWeight: 800, fontSize: '20px', color: '#7C3AED' }}>SyncSpace</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <StatusBadge online={!isOffline} />
          <span style={{ fontSize: '14px', color: '#374151' }}>👋 {user?.name}</span>
          <button onClick={handleLogout} style={{ padding: '6px 14px', background: '#F3F4F6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Logout</button>
        </div>
      </header>
      
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1F2937', marginTop: 0 }}>Your Workspaces</h2>
        
        {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          <form onSubmit={handleCreate} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #E5E7EB' }}>
            <h3 style={{ marginTop: 0, fontSize: '16px', color: '#1F2937' }}>Create Workspace</h3>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Workspace name..." style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none', fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px' }} />
            <button type="submit" disabled={creating || !newName.trim()} style={{ width: '100%', padding: '10px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
              {creating ? 'Creating...' : 'Create'}
            </button>
          </form>
          
          <form onSubmit={handleJoin} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #E5E7EB' }}>
            <h3 style={{ marginTop: 0, fontSize: '16px', color: '#1F2937' }}>Join Workspace</h3>
            <input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="Enter invite code..." maxLength={6} style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none', fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px', fontFamily: 'monospace', letterSpacing: '0.1em' }} />
            <button type="submit" disabled={joining || inviteCode.length !== 6} style={{ width: '100%', padding: '10px', background: '#10B981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
              {joining ? 'Joining...' : 'Join'}
            </button>
          </form>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#6B7280', padding: '40px' }}>Loading workspaces...</div>
        ) : workspaces.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '60px', background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No workspaces yet</div>
            <div style={{ fontSize: '14px' }}>Create or join a workspace to get started</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {workspaces.map(ws => (
              <div key={ws._id} onClick={() => navigate(`/workspace/${ws._id}`)} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #E5E7EB', cursor: 'pointer', transition: 'box-shadow 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(124,58,237,0.15)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}>🏢</div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: '#1F2937', marginBottom: '4px' }}>{ws.name}</div>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>{ws.members?.length || 0} members</div>
                <div style={{ marginTop: '12px', padding: '4px 8px', background: '#EDE9FE', borderRadius: '4px', display: 'inline-block', fontSize: '11px', color: '#7C3AED', fontFamily: 'monospace', fontWeight: 600 }}>{ws.inviteCode}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
