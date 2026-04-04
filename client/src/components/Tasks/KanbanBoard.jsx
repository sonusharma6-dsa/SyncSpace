import React, { useState } from 'react';
import axios from 'axios';
import TaskCard from './TaskCard';
import { useOffline } from '../../hooks/useOffline';
import { saveTaskUpdate } from '../../utils/indexedDB';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#6B7280' },
  { id: 'in-progress', label: 'In Progress', color: '#F59E0B' },
  { id: 'done', label: 'Done', color: '#10B981' },
];

const KanbanBoard = ({ tasks, setTasks, workspaceId, socket, userId }) => {
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTo, setAddingTo] = useState(null);
  const isOffline = useOffline();

  const handleDragStart = (task) => setDragging(task);

  const handleDrop = async (columnId) => {
    if (!dragging || dragging.status === columnId) { setDragging(null); setDragOver(null); return; }
    const oldTasks = [...tasks];
    const updated = tasks.map(t => t._id === dragging._id ? { ...t, status: columnId } : t);
    setTasks(updated);
    try {
      if (isOffline) {
        await saveTaskUpdate(dragging._id, columnId, workspaceId);
      } else {
        const { data } = await axios.put(`/api/workspaces/${workspaceId}/tasks/${dragging._id}`, { status: columnId });
        if (socket) {
          socket.emit('task:update', { taskId: dragging._id, status: columnId, workspaceId, task: data.task });
        }
      }
    } catch (err) {
      setTasks(oldTasks);
      console.error(err);
    }
    setDragging(null);
    setDragOver(null);
  };

  const handleDelete = async (taskId) => {
    const oldTasks = [...tasks];
    setTasks(tasks.filter(t => t._id !== taskId));
    try {
      await axios.delete(`/api/workspaces/${workspaceId}/tasks/${taskId}`);
    } catch (err) {
      setTasks(oldTasks);
    }
  };

  const addTask = async (status) => {
    if (!newTaskTitle.trim()) return;
    try {
      const { data } = await axios.post(`/api/workspaces/${workspaceId}/tasks`, { title: newTaskTitle, status });
      setTasks(prev => [...prev, data.task]);
      setNewTaskTitle('');
      setAddingTo(null);
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (!socket) return;
    const onTaskUpdated = ({ taskId, newStatus, task }) => {
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus, ...(task || {}) } : t));
    };
    socket.on('task:updated', onTaskUpdated);
    return () => socket.off('task:updated', onTaskUpdated);
  }, [socket, setTasks]);

  return (
    <div style={{ display: 'flex', gap: '16px', padding: '16px', height: '100%', overflowX: 'auto' }}>
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        return (
          <div key={col.id}
            onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
            onDrop={() => handleDrop(col.id)}
            onDragLeave={() => setDragOver(null)}
            style={{
              flex: 1, minWidth: '240px',
              borderRadius: '10px', padding: '12px',
              border: dragOver === col.id ? `2px dashed ${col.color}` : '2px solid transparent',
              background: dragOver === col.id ? '#F5F3FF' : '#F9FAFB',
              transition: 'background 200ms, border 200ms',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: col.color }} />
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#1F2937' }}>{col.label}</span>
              <span style={{ marginLeft: 'auto', background: '#E5E7EB', borderRadius: '9999px', padding: '1px 8px', fontSize: '12px', fontWeight: 600 }}>{colTasks.length}</span>
            </div>
            {colTasks.map(task => (
              <TaskCard key={task._id} task={task} onDragStart={handleDragStart} onDelete={handleDelete} />
            ))}
            {addingTo === col.id ? (
              <div style={{ marginTop: '8px' }}>
                <input
                  autoFocus
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addTask(col.id); if (e.key === 'Escape') setAddingTo(null); }}
                  placeholder="Task title..."
                  style={{ width: '100%', padding: '8px', border: '1px solid #7C3AED', borderRadius: '6px', outline: 'none', fontSize: '13px' }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button onClick={() => addTask(col.id)} style={{ padding: '4px 12px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Add</button>
                  <button onClick={() => setAddingTo(null)} style={{ padding: '4px 12px', background: '#E5E7EB', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingTo(col.id)} style={{ width: '100%', padding: '8px', background: 'none', border: '1px dashed #D1D5DB', borderRadius: '6px', cursor: 'pointer', color: '#9CA3AF', fontSize: '13px', marginTop: '4px' }}>
                + Add task
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
