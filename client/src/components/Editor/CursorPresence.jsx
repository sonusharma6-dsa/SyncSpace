import React from 'react';

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

const CursorPresence = ({ cursors, currentUserId }) => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 10 }}>
      {Object.entries(cursors).filter(([uid]) => uid !== currentUserId).map(([uid, data], idx) => {
        const color = COLORS[idx % COLORS.length];
        return (
          <div key={uid} className="fade-in" style={{
            position: 'absolute',
            top: data.y || 0,
            left: data.x || 0,
            pointerEvents: 'none',
          }}>
            <div style={{ width: '2px', height: '20px', background: color }} />
            <div style={{
              background: color, color: 'white', fontSize: '11px', fontWeight: 600,
              padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', marginTop: '2px',
            }}>
              {data.name || 'User'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CursorPresence;
