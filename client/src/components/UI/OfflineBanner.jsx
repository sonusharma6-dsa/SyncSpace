import React from 'react';
import { useOffline } from '../../hooks/useOffline';

const OfflineBanner = () => {
  const isOffline = useOffline();
  
  if (!isOffline) return null;
  
  return (
    <div className="slide-down" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: '#EF4444', color: 'white', textAlign: 'center',
      padding: '10px 16px', fontSize: '14px', fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    }}>
      <span>🔴</span>
      <span>You're offline. Changes will sync when you reconnect.</span>
    </div>
  );
};

export default OfflineBanner;
