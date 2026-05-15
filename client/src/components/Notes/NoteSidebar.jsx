import React from 'react';
import { Archive, FileText, Plus, Search, Settings, Trash2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import ThemeToggle from '../UI/ThemeToggle';

const formatRelative = (value) => {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const hours = Math.round(diff / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

const Highlight = ({ text, query }) => {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'ig'));
  return parts.map((part, index) => (
    part.toLowerCase() === query.toLowerCase() ? <mark key={`${part}-${index}`}>{part}</mark> : <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
  ));
};

const NoteSidebar = ({
  user,
  notes,
  counts,
  tags,
  recentNotes,
  currentView,
  selectedTag,
  search,
  sort,
  selectedNoteId,
  onCreateNote,
  onSearchChange,
  onSortChange,
  onTagSelect,
  onSelectNote,
  onOpenSearch,
  onOpenCommandPalette,
  mobileOpen,
  onCloseMobile,
}) => (
  <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
    <div className="sidebar-top">
      <div>
        <p className="eyebrow">NoteMesh</p>
        <h1>Write clearly.</h1>
        <p className="muted">{user?.name?.split(' ')[0] || 'Writer'}, your ideas stay one search away.</p>
      </div>
      <div className="sidebar-actions-row">
        <ThemeToggle compact />
        <button type="button" className="ghost-button icon-only" onClick={onOpenCommandPalette} aria-label="Open command palette">
          <Search size={16} />
        </button>
      </div>
    </div>

    <button type="button" className="primary-button" onClick={onCreateNote}>
      <Plus size={16} />
      New note
    </button>

    <div className="search-card">
      <label htmlFor="note-search" className="search-input">
        <Search size={16} />
        <input id="note-search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search title, content, tags" />
      </label>
      <div className="search-actions">
        <button type="button" className="ghost-button" onClick={onOpenSearch}>Focus</button>
        <select value={sort} onChange={(event) => onSortChange(event.target.value)}>
          <option value="updated">Updated</option>
          <option value="created">Created</option>
          <option value="title">Title</option>
        </select>
      </div>
    </div>

    <nav className="sidebar-nav">
      <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${(isActive && currentView === 'active') ? 'active' : ''}`} onClick={onCloseMobile}>
        <FileText size={16} />
        <span>Notes</span>
        <strong>{counts.active || 0}</strong>
      </NavLink>
      <NavLink to="/archive" className={({ isActive }) => `nav-link ${(isActive && currentView === 'archived') ? 'active' : ''}`} onClick={onCloseMobile}>
        <Archive size={16} />
        <span>Archive</span>
        <strong>{counts.archived || 0}</strong>
      </NavLink>
      <NavLink to="/trash" className={({ isActive }) => `nav-link ${(isActive && currentView === 'trash') ? 'active' : ''}`} onClick={onCloseMobile}>
        <Trash2 size={16} />
        <span>Trash</span>
        <strong>{counts.trash || 0}</strong>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onCloseMobile}>
        <Settings size={16} />
        <span>Settings</span>
      </NavLink>
    </nav>

    <div className="section-block">
      <div className="section-title-row">
        <span>Tags</span>
        {selectedTag && <button type="button" className="text-button" onClick={() => onTagSelect('')}>Clear</button>}
      </div>
      <div className="tag-cloud">
        {tags.length ? tags.map((tag) => (
          <button
            type="button"
            key={tag._id || tag.name}
            className={`tag-pill ${selectedTag === tag.name ? 'active' : ''}`}
            onClick={() => onTagSelect(selectedTag === tag.name ? '' : tag.name)}
          >
            <span className="tag-swatch" style={{ backgroundColor: tag.color }} />
            {tag.name}
            <small>{tag.noteCount}</small>
          </button>
        )) : <div className="empty-inline-state">Tags appear as you use them.</div>}
      </div>
    </div>

    <div className="section-block compact">
      <div className="section-title-row">
        <span>Recently edited</span>
      </div>
      <div className="recent-list">
        {recentNotes.length ? recentNotes.map((note) => (
          <button key={note._id} type="button" className="recent-item" onClick={() => { onSelectNote(note._id); onCloseMobile(); }}>
            <span>{note.title}</span>
            <small>{formatRelative(note.lastEditedAt)}</small>
          </button>
        )) : <div className="empty-inline-state">No recent notes yet.</div>}
      </div>
    </div>

    <div className="section-block grow">
      <div className="section-title-row">
        <span>{currentView === 'trash' ? 'Trash' : currentView === 'archived' ? 'Archive' : 'All notes'}</span>
        <small>{notes.length}</small>
      </div>
      <div className="note-list">
        {notes.length ? notes.map((note) => (
          <button key={note._id} type="button" className={`note-list-item ${selectedNoteId === note._id ? 'active' : ''}`} onClick={() => { onSelectNote(note._id); onCloseMobile(); }}>
            <div className="note-list-row">
              <strong><Highlight text={note.title || 'Untitled note'} query={search} /></strong>
              {note.isPinned && <span className="pill-subtle">Pinned</span>}
            </div>
            <p><Highlight text={note.excerpt || 'No preview yet.'} query={search} /></p>
            <div className="note-list-meta">
              <span>{formatRelative(note.lastEditedAt || note.updatedAt)}</span>
              <span>{(note.tags || []).slice(0, 2).join(' • ')}</span>
            </div>
          </button>
        )) : (
          <div className="empty-card small">
            <h3>No notes found</h3>
            <p>Try a different search, tag, or create a new note.</p>
          </div>
        )}
      </div>
    </div>
  </aside>
);

export default NoteSidebar;
