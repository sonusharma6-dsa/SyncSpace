import React, { useRef, useState } from 'react';
import axios from 'axios';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';

const MAX_SIZE_MB = 10;
const ICON_MAP = {
  'image/': '🖼️',
  'application/pdf': '📕',
  'text/': '📝',
  'application/zip': '🗜️',
  'application/vnd': '📊',
  'application/msword': '📄',
};

const getFileIcon = (mimetype) => {
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (mimetype.startsWith(key)) return icon;
  }
  return '📎';
};

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileList = ({ workspaceId }) => {
  const { files, setFiles } = useWorkspace();
  const { user } = useAuth();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_SIZE_MB} MB.`);
      return;
    }
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await axios.post(`/api/workspaces/${workspaceId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFiles(prev => [data.file, ...prev]);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await axios.delete(`/api/workspaces/${workspaceId}/files/${fileId}`);
      setFiles(prev => prev.filter(f => f._id !== fileId));
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleDownload = (file) => {
    const link = document.createElement('a');
    link.href = `/api/workspaces/serve/${file.filename}`;
    link.setAttribute('download', file.originalName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Files</span>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          title="Upload file (max 10 MB)"
          style={{ padding: '2px 8px', fontSize: '12px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {uploading ? '⏳' : '↑'}
        </button>
        <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={handleUpload} />
      </div>

      {error && (
        <div style={{ fontSize: '11px', color: '#EF4444', marginBottom: '6px', padding: '4px 6px', background: '#FEF2F2', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {files.length === 0 && !uploading && (
        <div style={{ fontSize: '12px', color: '#9CA3AF', padding: '4px 10px' }}>No files yet</div>
      )}

      {files.map(file => (
        <div
          key={file._id}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px',
            borderRadius: '6px', fontSize: '12px', marginBottom: '2px',
            background: '#F3F4F6', border: '1px solid #E5E7EB',
          }}
        >
          <span style={{ flexShrink: 0 }}>{getFileIcon(file.mimetype)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.originalName}>
              {file.originalName}
            </div>
            <div style={{ color: '#9CA3AF', fontSize: '10px' }}>
              {formatBytes(file.size)} · {file.uploadedBy?.name || 'Unknown'}
            </div>
          </div>
          <button
            onClick={() => handleDownload(file)}
            title="Download"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px', color: '#7C3AED', flexShrink: 0 }}
          >
            ↓
          </button>
          {(file.uploadedBy?._id === user?._id) && (
            <button
              onClick={() => handleDelete(file._id)}
              title="Delete"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px', color: '#EF4444', flexShrink: 0 }}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default FileList;
