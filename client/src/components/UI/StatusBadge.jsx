import React from 'react';

const StatusBadge = ({ online }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
    background: online ? '#D1FAE5' : '#FEE2E2',
    color: online ? '#065F46' : '#991B1B',
  }}>
    <span style={{
      width: '8px', height: '8px', borderRadius: '50%',
      background: online ? '#10B981' : '#EF4444',
      display: 'inline-block',
    }} />
    {online ? 'Online' : 'Offline'}
  </span>
);

export default StatusBadge;
