import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import MarkdownPreview from '../components/Notes/MarkdownPreview';

const SharedNote = () => {
  const { token } = useParams();
  const [note, setNote] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSharedNote = async () => {
      try {
        const { data } = await axios.get(`/api/shares/${token}`);
        setNote(data.note);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to open this shared note.');
      } finally {
        setLoading(false);
      }
    };

    loadSharedNote();
  }, [token]);

  if (loading) {
    return <div className="page-loader">Loading shared note…</div>;
  }

  if (error || !note) {
    return (
      <div className="not-found-page">
        <div className="empty-card large">
          <h1>Shared note unavailable</h1>
          <p>{error || 'This share link is missing or expired.'}</p>
          <Link to="/login" className="primary-button">Go to NoteMesh</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-page">
      <header className="shared-header">
        <div>
          <p className="eyebrow">Shared note</p>
          <h1>{note.title}</h1>
          <p className="muted">Shared by {note.owner} • Updated {new Date(note.updatedAt).toLocaleString()}</p>
        </div>
        <Link to="/login" className="ghost-button">Open NoteMesh</Link>
      </header>
      <main className="shared-content">
        <MarkdownPreview content={note.content} emptyMessage="This shared note is empty." />
      </main>
    </div>
  );
};

export default SharedNote;
