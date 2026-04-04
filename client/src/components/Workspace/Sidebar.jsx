import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import InviteModal from './InviteModal';
import axios from 'axios';

const Sidebar = ({ workspaceId }) => {
  const { currentWorkspace, documents, setDocuments, activeDocument, setActiveDocument } = useWorkspace();
  const [showInvite, setShowInvite] = useState(false);
  const [creatingDoc, setCreatingDoc] = useState(false);

  const createDocument = async () => {
    setCreatingDoc(true);
    try {
      const { data } = await axios.post(`/api/workspaces/${workspaceId}/documents`, { title: 'Untitled Document' });
      setDocuments(prev => [...prev, data.document]);
      setActiveDocument(data.document);
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingDoc(false);
    }
  };

  return (
    <aside style={{ width: '240px', minWidth: '240px', background: '#F9FAFB', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ fontWeight: 700, fontSize: '16px', color: '#7C3AED', marginBottom: '4px' }}>
          {currentWorkspace?.name || 'Workspace'}
        </div>
        <div style={{ fontSize: '12px', color: '#6B7280' }}>
          {currentWorkspace?.members?.length || 0} members
        </div>
      </div>
      
      <div style={{ padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Documents</span>
          <button onClick={createDocument} disabled={creatingDoc} style={{ padding: '2px 8px', fontSize: '12px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+</button>
        </div>
        {documents.map(doc => (
          <div key={doc._id} onClick={() => setActiveDocument(doc)} style={{
            padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
            background: activeDocument?._id === doc._id ? '#EDE9FE' : 'transparent',
            color: activeDocument?._id === doc._id ? '#7C3AED' : '#374151',
            marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span>📄</span> {doc.title}
          </div>
        ))}
        {documents.length === 0 && <div style={{ fontSize: '12px', color: '#9CA3AF', padding: '4px 10px' }}>No documents yet</div>}
      </div>

      <div style={{ padding: '12px', borderTop: '1px solid #E5E7EB' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Members</div>
        {currentWorkspace?.members?.map(m => (
          <div key={m.user?._id || m.user} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '13px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#7C3AED', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
              {(m.user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 500 }}>{m.user?.name || 'User'}</div>
              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{m.role}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '12px', marginTop: 'auto' }}>
        <button onClick={() => setShowInvite(true)} style={{ width: '100%', padding: '8px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
          🔗 Invite Members
        </button>
      </div>

      {showInvite && <InviteModal inviteCode={currentWorkspace?.inviteCode} onClose={() => setShowInvite(false)} />}
    </aside>
  );
};

export default Sidebar;
