import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useDebounce } from '../../hooks/useDebounce';
import { useOffline } from '../../hooks/useOffline';
import { saveDocEdit, cacheDoc, getCachedDoc } from '../../utils/indexedDB';
import CursorPresence from './CursorPresence';
import ConflictModal from '../UI/ConflictModal';

const DocumentEditor = ({ document, workspaceId, socket, userId }) => {
  const [content, setContent] = useState(document?.content || '');
  const [title, setTitle] = useState(document?.title || 'Untitled');
  const [saving, setSaving] = useState(false);
  const [cursors, setCursors] = useState({});
  const [conflict, setConflict] = useState(null);
  const isOffline = useOffline();
  const editorRef = useRef(null);
  const lastRemoteContent = useRef(document?.content || '');

  useEffect(() => {
    if (document) {
      setContent(document.content || '');
      setTitle(document.title || 'Untitled');
      lastRemoteContent.current = document.content || '';
      cacheDoc(`workspace_${workspaceId}_doc_${document._id}`, document.content || '');
    }
  }, [document, workspaceId]);

  useEffect(() => {
    if (!socket || !document) return;
    
    const onDocUpdate = ({ docId, content: newContent, editedBy, timestamp }) => {
      if (docId !== document._id || editedBy === userId) return;
      const timeDiff = Math.abs(Date.now() - (timestamp || 0));
      if (timeDiff < 2000 && content !== lastRemoteContent.current) {
        setConflict({ remote: newContent, local: content, timestamp });
      } else {
        setContent(newContent);
        lastRemoteContent.current = newContent;
      }
    };
    
    const onCursorUpdate = ({ userId: uid, position, name }) => {
      setCursors(prev => ({ ...prev, [uid]: { ...position, name } }));
    };

    socket.on('document:updated', onDocUpdate);
    socket.on('cursor:updated', onCursorUpdate);
    return () => {
      socket.off('document:updated', onDocUpdate);
      socket.off('cursor:updated', onCursorUpdate);
    };
  }, [socket, document, userId, content]);

  const saveToServer = useCallback(async (newContent) => {
    if (!document) return;
    try {
      setSaving(true);
      await axios.put(`/api/workspaces/${workspaceId}/documents/${document._id}`, { content: newContent });
      await cacheDoc(`workspace_${workspaceId}_doc_${document._id}`, newContent);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [document, workspaceId]);

  const debouncedSave = useDebounce(saveToServer, 500);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (isOffline) {
      saveDocEdit(workspaceId, document._id, newContent);
    } else {
      debouncedSave(newContent);
      if (socket) {
        socket.emit('document:edit', { docId: document._id, content: newContent, userId, workspaceId, timestamp: Date.now() });
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!socket || !document) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const position = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    socket.emit('cursor:move', { docId: document._id, position, userId, workspaceId, name: 'You' });
  };

  const handleTitleChange = async (newTitle) => {
    setTitle(newTitle);
    try {
      await axios.put(`/api/workspaces/${workspaceId}/documents/${document._id}`, { title: newTitle });
    } catch (err) {
      console.error(err);
    }
  };

  const handleConflictResolve = (choice) => {
    const resolved = choice === 'remote' ? conflict.remote : conflict.local;
    setContent(resolved);
    lastRemoteContent.current = resolved;
    debouncedSave(resolved);
    setConflict(null);
  };

  if (!document) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <div style={{ fontSize: '16px' }}>Select a document or create a new one</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }} onMouseMove={handleMouseMove}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          style={{ flex: 1, fontSize: '18px', fontWeight: 700, border: 'none', outline: 'none', color: '#1F2937', background: 'transparent' }}
          placeholder="Document title..."
        />
        <span style={{ fontSize: '12px', color: saving ? '#F59E0B' : '#10B981' }}>
          {saving ? '⏳ Saving...' : '✓ Saved'}
        </span>
        {isOffline && <span style={{ fontSize: '12px', color: '#EF4444', fontWeight: 600 }}>📴 Offline</span>}
      </div>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }} ref={editorRef}>
        <CursorPresence cursors={cursors} currentUserId={userId} />
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Start writing... Changes auto-save every 500ms"
          style={{
            width: '100%', height: '100%', padding: '20px', border: 'none', outline: 'none',
            resize: 'none', fontSize: '15px', lineHeight: '1.7', color: '#1F2937',
            fontFamily: 'Georgia, serif', background: 'white',
          }}
        />
      </div>
      <ConflictModal conflict={conflict} onResolve={handleConflictResolve} onClose={() => setConflict(null)} />
    </div>
  );
};

export default DocumentEditor;
