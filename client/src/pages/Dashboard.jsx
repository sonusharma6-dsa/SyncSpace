import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Command, LogOut, Menu, Plus } from 'lucide-react';
import NoteSidebar from '../components/Notes/NoteSidebar';
import NoteEditorPane from '../components/Notes/NoteEditorPane';
import CommandPalette from '../components/Notes/CommandPalette';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

const emptyDraft = { title: '', content: '', tags: [] };

const Dashboard = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { cycleTheme } = useTheme();

  const currentView = pathname === '/archive' ? 'archived' : pathname === '/trash' ? 'trash' : 'active';
  const [notes, setNotes] = useState([]);
  const [counts, setCounts] = useState({ active: 0, archived: 0, trash: 0, pinned: 0 });
  const [tags, setTags] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [shareUrl, setShareUrl] = useState('');
  const [draft, setDraftState] = useState(emptyDraft);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sort, setSort] = useState('updated');
  const [mode, setMode] = useState('split');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const setDraft = useCallback((updater) => {
    setDraftState((current) => {
      const nextValue = typeof updater === 'function' ? updater(current) : updater;
      return nextValue;
    });
    setDirty(true);
  }, []);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/notes', {
        params: {
          status: currentView,
          q: debouncedQuery || undefined,
          tag: selectedTag || undefined,
          sort,
        },
      });

      setNotes(data.notes || []);
      setCounts(data.counts || { active: 0, archived: 0, trash: 0, pinned: 0 });
      setTags(data.tags || []);
      setRecentNotes(data.recentNotes || []);

      const nextNotes = data.notes || [];
      setSelectedNoteId((current) => {
        if (current && nextNotes.some((note) => note._id === current)) {
          return current;
        }
        return nextNotes[0]?._id || '';
      });
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to load notes.', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentView, debouncedQuery, selectedTag, showToast, sort]);

  const loadSelectedNote = useCallback(async () => {
    if (!selectedNoteId) {
      setSelectedNote(null);
      setAttachments([]);
      setShareUrl('');
      setDraftState(emptyDraft);
      setDirty(false);
      return;
    }

    try {
      const { data } = await axios.get(`/api/notes/${selectedNoteId}`);
      setSelectedNote(data.note);
      setAttachments(data.attachments || []);
      setShareUrl(data.shareLink?.isActive ? `${window.location.origin}/share/${data.shareLink.token}` : '');
      setDraftState({
        title: data.note.title || '',
        content: data.note.content || '',
        tags: data.note.tags || [],
      });
      setDirty(false);
      setTagInput('');
    } catch (error) {
      setSelectedNoteId('');
      showToast(error.response?.data?.message || 'Unable to open note.', 'error');
    }
  }, [selectedNoteId, showToast]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    loadSelectedNote();
  }, [loadSelectedNote]);

  const handleSave = useCallback(async (silent = false) => {
    if (!selectedNoteId || !dirty || selectedNote?.isDeleted) return;
    setSaving(true);
    try {
      const { data } = await axios.patch(`/api/notes/${selectedNoteId}`, draft);
      setSelectedNote(data.note);
      setNotes((current) => current.map((note) => (note._id === data.note._id ? data.note : note)));
      setRecentNotes((current) => {
        const next = [data.note, ...current.filter((note) => note._id !== data.note._id)];
        return next.slice(0, 5);
      });
      setDirty(false);
      if (!silent) showToast('Note saved.');
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to save note.', 'error');
    } finally {
      setSaving(false);
    }
  }, [dirty, draft, selectedNote?.isDeleted, selectedNoteId, showToast]);

  useEffect(() => {
    if (!selectedNoteId || !dirty || selectedNote?.isDeleted) return undefined;
    const timer = window.setTimeout(() => {
      handleSave(true);
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [dirty, handleSave, selectedNote?.isDeleted, selectedNoteId]);

  const refreshAndSelect = async (noteId = '') => {
    await loadNotes();
    if (noteId) setSelectedNoteId(noteId);
  };

  const handleCreateNote = useCallback(async () => {
    try {
      if (currentView !== 'active') {
        navigate('/dashboard');
      }
      const { data } = await axios.post('/api/notes', { title: 'Untitled note', content: '', tags: [] });
      setQuery('');
      setSelectedTag('');
      setSelectedNoteId(data.note._id);
      setSelectedNote(data.note);
      setDraftState({ title: data.note.title, content: data.note.content, tags: data.note.tags || [] });
      setDirty(false);
      showToast('New note created.');
      if (currentView === 'active') {
        await loadNotes();
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to create note.', 'error');
    }
  }, [currentView, loadNotes, navigate, showToast]);

  const handleDuplicate = async () => {
    if (!selectedNoteId) return;
    try {
      const { data } = await axios.post(`/api/notes/${selectedNoteId}/duplicate`);
      showToast('Note duplicated.');
      await refreshAndSelect(data.note._id);
      navigate(data.note.isArchived ? '/archive' : '/dashboard');
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to duplicate note.', 'error');
    }
  };

  const toggleBooleanField = async (field) => {
    if (!selectedNoteId || !selectedNote) return;
    try {
      const { data } = await axios.patch(`/api/notes/${selectedNoteId}`, { [field]: !selectedNote[field] });
      showToast(field === 'isPinned' ? (data.note.isPinned ? 'Note pinned.' : 'Note unpinned.') : (data.note.isArchived ? 'Note archived.' : 'Note moved back to notes.'));
      setSelectedNote(data.note);
      await loadNotes();
      if (field === 'isArchived') {
        navigate(data.note.isArchived ? '/archive' : '/dashboard');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to update note.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedNoteId) return;
    try {
      await axios.delete(`/api/notes/${selectedNoteId}`);
      setSelectedNoteId('');
      setSelectedNote(null);
      showToast('Note moved to trash.');
      navigate('/trash');
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to move note to trash.', 'error');
    }
  };

  const handleRestore = async () => {
    if (!selectedNoteId) return;
    try {
      const { data } = await axios.post(`/api/notes/${selectedNoteId}/restore`);
      showToast('Note restored.');
      navigate('/dashboard');
      await refreshAndSelect(data.note._id);
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to restore note.', 'error');
    }
  };

  const handleCreateShare = async () => {
    if (!selectedNoteId) return;
    try {
      const { data } = await axios.post(`/api/notes/${selectedNoteId}/share`);
      setShareUrl(data.shareUrl);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(data.shareUrl);
      }
      showToast('Share link copied to clipboard.');
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to create share link.', 'error');
    }
  };

  const appendAttachmentMarkdown = (uploadedAttachments) => {
    const markdown = uploadedAttachments.map((attachment) => (
      attachment.fileType.startsWith('image/')
        ? `![${attachment.originalName}](${attachment.fileUrl})`
        : `[${attachment.originalName}](${attachment.fileUrl})`
    )).join('\n');

    setDraft((current) => ({
      ...current,
      content: `${current.content.trimEnd()}${current.content ? '\n\n' : ''}${markdown}`,
    }));
  };

  const handleUploadFiles = async (files) => {
    if (!selectedNoteId || !files.length) return;
    try {
      const uploaded = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await axios.post(`/api/notes/${selectedNoteId}/attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploaded.push(data.attachment);
      }
      setAttachments((current) => [...uploaded, ...current]);
      appendAttachmentMarkdown(uploaded);
      showToast(`${uploaded.length} attachment${uploaded.length > 1 ? 's' : ''} added.`);
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to upload files.', 'error');
    }
  };

  const handleAddTag = (rawTag) => {
    const normalized = String(rawTag || '').trim().toLowerCase().replace(/[^a-z0-9- ]/g, '').replace(/\s+/g, '-');
    if (!normalized || draft.tags.includes(normalized)) {
      setTagInput('');
      return;
    }

    setDraft((current) => ({ ...current, tags: [...current.tags, normalized].slice(0, 8) }));
    setTagInput('');
  };

  const handleRemoveTag = (tag) => setDraft((current) => ({
    ...current,
    tags: current.tags.filter((item) => item !== tag),
  }));

  const tagSuggestions = useMemo(() => tags.filter((tag) => (
    tagInput &&
    tag.name.includes(tagInput.toLowerCase()) &&
    !draft.tags.includes(tag.name)
  )).slice(0, 5), [draft.tags, tagInput, tags]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const targetTag = event.target.tagName;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag) || event.target.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
      }

      if (!isTyping && event.key === '/') {
        event.preventDefault();
        document.getElementById('note-search')?.focus();
      }

      if (!isTyping && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        handleCreateNote();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCreateNote]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const title = currentView === 'trash' ? 'Trash' : currentView === 'archived' ? 'Archive' : 'Notes';

  return (
    <div className="app-frame">
      <NoteSidebar
        user={user}
        notes={notes}
        counts={counts}
        tags={tags}
        recentNotes={recentNotes}
        currentView={currentView}
        selectedTag={selectedTag}
        search={query}
        sort={sort}
        selectedNoteId={selectedNoteId}
        onCreateNote={handleCreateNote}
        onSearchChange={setQuery}
        onSortChange={setSort}
        onTagSelect={setSelectedTag}
        onSelectNote={setSelectedNoteId}
        onOpenSearch={() => document.getElementById('note-search')?.focus()}
        onOpenCommandPalette={() => setPaletteOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <main className="workspace-main">
        <header className="workspace-topbar">
          <div>
            <div className="topbar-title-row">
              <button type="button" className="ghost-button icon-only mobile-only" onClick={() => setMobileSidebarOpen((current) => !current)} aria-label="Toggle sidebar">
                <Menu size={18} />
              </button>
              <span className="eyebrow">{title}</span>
            </div>
            <h2>{selectedTag ? `#${selectedTag}` : debouncedQuery ? `Results for “${debouncedQuery}”` : title}</h2>
          </div>
          <div className="topbar-actions">
            <button type="button" className="ghost-button" onClick={() => setPaletteOpen(true)}><Command size={16} />Command</button>
            <button type="button" className="primary-button" onClick={handleCreateNote}><Plus size={16} />New</button>
            <button type="button" className="ghost-button" onClick={handleLogout}><LogOut size={16} />Logout</button>
          </div>
        </header>

        {loading ? (
          <div className="editor-shell skeleton-card">
            <div className="skeleton-line large" />
            <div className="skeleton-line medium" />
            <div className="skeleton-grid">
              <div className="skeleton-panel" />
              <div className="skeleton-panel" />
            </div>
          </div>
        ) : (
          <>
            {notes.length === 0 && currentView === 'active' && !query && !selectedTag ? (
              <section className="editor-shell empty-card large">
                <h2>Capture your first note</h2>
                <p>Use NoteMesh for class notes, writing drafts, meeting capture, code snippets, and research highlights.</p>
                <div className="empty-actions">
                  <button type="button" className="primary-button" onClick={handleCreateNote}>Create first note</button>
                  <Link to="/settings" className="ghost-button">Open settings</Link>
                </div>
              </section>
            ) : (
              <NoteEditorPane
                note={selectedNote}
                draft={draft}
                setDraft={setDraft}
                dirty={dirty}
                saving={saving}
                mode={mode}
                setMode={setMode}
                attachments={attachments}
                shareUrl={shareUrl}
                tagInput={tagInput}
                setTagInput={setTagInput}
                tagSuggestions={tagSuggestions}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
                onSave={() => handleSave(false)}
                onDuplicate={handleDuplicate}
                onTogglePinned={() => toggleBooleanField('isPinned')}
                onToggleArchived={() => toggleBooleanField('isArchived')}
                onDelete={handleDelete}
                onRestore={handleRestore}
                onCreateShare={handleCreateShare}
                onUploadFiles={handleUploadFiles}
              />
            )}
          </>
        )}
      </main>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNewNote={handleCreateNote}
        onFocusSearch={() => document.getElementById('note-search')?.focus()}
        onToggleTheme={cycleTheme}
      />
    </div>
  );
};

export default Dashboard;
