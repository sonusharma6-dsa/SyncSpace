import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useSocket } from '../hooks/useSocket';
import { useOffline } from '../hooks/useOffline';
import Sidebar from '../components/Workspace/Sidebar';
import DocumentEditor from '../components/Editor/DocumentEditor';
import KanbanBoard from '../components/Tasks/KanbanBoard';
import StatusBadge from '../components/UI/StatusBadge';
import { syncPendingEdits, syncPendingTasks } from '../utils/syncQueue';

const WorkspacePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currentWorkspace, setCurrentWorkspace, documents, setDocuments, tasks, setTasks, activeDocument, setActiveDocument } = useWorkspace();
  const socket = useSocket(user?._id);
  const isOffline = useOffline();
  const [activeTab, setActiveTab] = useState('editor');
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    loadWorkspace();
  }, [id]);

  useEffect(() => {
    if (!isOffline && id) {
      syncPendingEdits(id);
      syncPendingTasks(id);
    }
  }, [isOffline, id]);

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('join:workspace', { workspaceId: id });
    const onUserJoined = ({ userId, name }) => {
      setOnlineUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
    };
    const onUserLeft = ({ userId }) => {
      setOnlineUsers(prev => prev.filter(uid => uid !== userId));
    };
    socket.on('user:joined', onUserJoined);
    socket.on('user:left', onUserLeft);
    return () => {
      socket.off('user:joined', onUserJoined);
      socket.off('user:left', onUserLeft);
    };
  }, [socket, id]);

  const loadWorkspace = async () => {
    try {
      const [wsRes, docsRes, tasksRes] = await Promise.all([
        axios.get(`/api/workspaces/${id}`),
        axios.get(`/api/workspaces/${id}/documents`),
        axios.get(`/api/workspaces/${id}/tasks`),
      ]);
      setCurrentWorkspace(wsRes.data.workspace);
      setDocuments(docsRes.data.documents);
      setTasks(tasksRes.data.tasks);
      if (docsRes.data.documents.length > 0) setActiveDocument(docsRes.data.documents[0]);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403 || err.response?.status === 404) navigate('/dashboard');
    }
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top Bar */}
      <header style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        <span style={{ fontSize: '20px', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>🚀</span>
        <span style={{ fontWeight: 700, fontSize: '16px', color: '#7C3AED' }}>SyncSpace</span>
        <span style={{ color: '#9CA3AF' }}>›</span>
        <span style={{ fontWeight: 600, fontSize: '15px' }}>{currentWorkspace?.name || 'Loading...'}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '-4px' }}>
            {currentWorkspace?.members?.slice(0, 5).map((m, i) => (
              <div key={i} title={m.user?.name} style={{ width: '28px', height: '28px', borderRadius: '50%', background: `hsl(${i * 60}, 70%, 50%)`, border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'white', marginLeft: i > 0 ? '-6px' : 0 }}>
                {(m.user?.name || 'U').charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <StatusBadge online={!isOffline} />
          <button onClick={handleLogout} style={{ padding: '5px 12px', background: '#F3F4F6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Logout</button>
        </div>
      </header>

      {/* Mobile tabs */}
      <div style={{ display: 'none' }} className="mobile-tabs">
        <button onClick={() => setActiveTab('editor')} style={{ flex: 1, padding: '10px', background: activeTab === 'editor' ? '#7C3AED' : 'white', color: activeTab === 'editor' ? 'white' : '#374151', border: 'none', cursor: 'pointer', fontWeight: 600 }}>📄 Editor</button>
        <button onClick={() => setActiveTab('tasks')} style={{ flex: 1, padding: '10px', background: activeTab === 'tasks' ? '#7C3AED' : 'white', color: activeTab === 'tasks' ? 'white' : '#374151', border: 'none', cursor: 'pointer', fontWeight: 600 }}>📋 Tasks</button>
      </div>

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar workspaceId={id} />
        
        {/* Document Editor (60%) */}
        <div style={{ flex: '6', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #E5E7EB' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #E5E7EB', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#FAFAFA' }}>
            📄 Document Editor
          </div>
          <DocumentEditor document={activeDocument} workspaceId={id} socket={socket} userId={user?._id} />
        </div>

        {/* Task Board (40%) */}
        <div style={{ flex: '4', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #E5E7EB', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#FAFAFA' }}>
            📋 Task Board
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <KanbanBoard tasks={tasks} setTasks={setTasks} workspaceId={id} socket={socket} userId={user?._id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspacePage;
