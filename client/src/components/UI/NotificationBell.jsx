import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useWorkspace } from '../../context/WorkspaceContext';

const TYPE_ICON = {
  file_uploaded: '📎',
  task_created: '✅',
  task_updated: '🔄',
  user_joined: '👋',
};

const NotificationBell = () => {
  const { notifications, setNotifications } = useWorkspace();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (_) {}
  };

  const markAllRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (_) {}
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        title="Notifications"
        style={{
          position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '20px', padding: '4px 6px', lineHeight: 1,
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: '#EF4444', color: 'white',
            borderRadius: '9999px', fontSize: '10px', fontWeight: 700,
            minWidth: '16px', height: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '36px', right: 0, width: '320px',
          background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.12)', zIndex: 1000,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #E5E7EB',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{ fontSize: '12px', color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => !n.read && markRead(n._id)}
                  style={{
                    padding: '12px 16px', borderBottom: '1px solid #F3F4F6',
                    cursor: n.read ? 'default' : 'pointer',
                    background: n.read ? 'white' : '#F5F3FF',
                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                  }}
                >
                  <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>
                    {TYPE_ICON[n.type] || '📢'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: '#1F2937', lineHeight: '1.4' }}>{n.message}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {!n.read && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7C3AED', flexShrink: 0, marginTop: '4px' }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
