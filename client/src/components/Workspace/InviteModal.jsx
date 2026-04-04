import React, { useState } from 'react';

const InviteModal = ({ inviteCode, onClose }) => {
  const [copied, setCopied] = useState(false);
  
  const copy = () => {
    navigator.clipboard.writeText(inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%' }}>
        <h3 style={{ marginTop: 0, color: '#1F2937' }}>Invite Team Members</h3>
        <p style={{ color: '#6B7280', fontSize: '14px' }}>Share this invite code with your teammates:</p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '16px 0' }}>
          <div style={{ flex: 1, padding: '12px', background: '#F3F4F6', borderRadius: '8px', fontFamily: 'monospace', fontSize: '24px', textAlign: 'center', letterSpacing: '0.2em', fontWeight: 700, color: '#7C3AED' }}>
            {inviteCode}
          </div>
          <button onClick={copy} style={{ padding: '12px 16px', background: copied ? '#10B981' : '#7C3AED', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, minWidth: '80px' }}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Anyone with this code can join your workspace as an editor.</p>
        <button onClick={onClose} style={{ width: '100%', padding: '10px', background: '#F3F4F6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>Close</button>
      </div>
    </div>
  );
};

export default InviteModal;
