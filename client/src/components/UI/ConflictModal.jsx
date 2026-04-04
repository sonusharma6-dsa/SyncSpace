import React from 'react';

const ConflictModal = ({ conflict, onResolve, onClose }) => {
  if (!conflict) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
        <h2 style={{ color: '#7C3AED', marginTop: 0 }}>⚠️ Conflict Detected</h2>
        <p style={{ color: '#6B7280' }}>Two edits were made around the same time. Choose which version to keep:</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '16px 0' }}>
          <div style={{ border: '2px solid #E5E7EB', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontWeight: 600, marginBottom: '8px', color: '#7C3AED' }}>Version A (Remote)</div>
            <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto', margin: 0 }}>{conflict.remote}</pre>
          </div>
          <div style={{ border: '2px solid #E5E7EB', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontWeight: 600, marginBottom: '8px', color: '#10B981' }}>Version B (Local)</div>
            <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto', margin: 0 }}>{conflict.local}</pre>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={() => onResolve('remote')} style={{ padding: '8px 16px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Use Remote</button>
          <button onClick={() => onResolve('local')} style={{ padding: '8px 16px', background: '#10B981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Use Local</button>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ConflictModal;
