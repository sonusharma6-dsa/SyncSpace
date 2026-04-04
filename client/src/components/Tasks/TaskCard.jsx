import React from 'react';

const STATUS_COLORS = { 'todo': '#6B7280', 'in-progress': '#F59E0B', 'done': '#10B981' };

const TaskCard = ({ task, onDragStart, onDelete }) => {
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && task.status !== 'done';

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task)}
      className="drag-transition"
      style={{
        background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px',
        padding: '12px', marginBottom: '8px', cursor: 'grab',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        borderLeft: `3px solid ${STATUS_COLORS[task.status] || '#6B7280'}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontWeight: 600, fontSize: '14px', color: '#1F2937', flex: 1 }}>{task.title}</div>
        <button onClick={() => onDelete(task._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '16px', padding: '0 0 0 8px' }}>×</button>
      </div>
      {task.description && <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>{task.description}</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
        {task.assignee ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6B7280' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#7C3AED', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>
              {(task.assignee?.name || 'U').charAt(0).toUpperCase()}
            </div>
            {task.assignee?.name || 'Unassigned'}
          </div>
        ) : <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Unassigned</span>}
        {dueDate && (
          <span style={{ fontSize: '11px', color: isOverdue ? '#EF4444' : '#6B7280', fontWeight: isOverdue ? 600 : 400 }}>
            {isOverdue ? '⚠️ ' : ''}{dueDate.toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
