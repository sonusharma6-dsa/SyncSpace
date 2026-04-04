import axios from 'axios';
import { getPendingEdits, markEditSynced, getPendingTasks, markTaskSynced } from './indexedDB';
import { getSocket } from '../hooks/useSocket';

const CONFLICT_WINDOW_MS = 2000;

export const syncPendingEdits = async (workspaceId) => {
  try {
    const pendingEdits = await getPendingEdits();
    const prefix = `workspace_${workspaceId}_doc_`;
    const filtered = pendingEdits
      .filter(e => e.docId.startsWith(prefix))
      .sort((a, b) => a.timestamp - b.timestamp);

    for (const edit of filtered) {
      try {
        const docId = edit.docId.slice(prefix.length);
        
        // Check for conflicts (if two edits within CONFLICT_WINDOW_MS)
        const similar = filtered.filter(e => e.docId === edit.docId && Math.abs(e.timestamp - edit.timestamp) < CONFLICT_WINDOW_MS && e.id !== edit.id);
        if (similar.length > 0) {
          // Conflict detected - last write wins by default
          const latest = [...similar, edit].sort((a, b) => b.timestamp - a.timestamp)[0];
          if (latest.id !== edit.id) {
            await markEditSynced(edit.id);
            continue;
          }
        }

        await axios.put(`/api/workspaces/${workspaceId}/documents/${docId}`, { content: edit.content });
        await markEditSynced(edit.id);
        
        const socket = getSocket();
        if (socket) {
          socket.emit('document:edit', { docId, content: edit.content, workspaceId, timestamp: edit.timestamp });
        }
      } catch (err) {
        console.error('Failed to sync edit:', err);
      }
    }
  } catch (err) {
    console.error('Sync failed:', err);
  }
};

export const syncPendingTasks = async (workspaceId) => {
  try {
    const pendingTasks = await getPendingTasks();
    const filtered = pendingTasks.filter(t => t.workspaceId === workspaceId).sort((a, b) => a.timestamp - b.timestamp);
    
    for (const task of filtered) {
      try {
        await axios.put(`/api/workspaces/${workspaceId}/tasks/${task.taskId}`, { status: task.status });
        await markTaskSynced(task.id);
      } catch (err) {
        console.error('Failed to sync task:', err);
      }
    }
  } catch (err) {
    console.error('Task sync failed:', err);
  }
};
