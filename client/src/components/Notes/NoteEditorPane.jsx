import React, { useMemo, useRef, useState } from 'react';
import { Archive, CopyPlus, Eye, EyeOff, FileUp, Pin, RotateCcw, Save, Share2, Trash2 } from 'lucide-react';
import MarkdownPreview from './MarkdownPreview';

const toolActions = [
  { label: 'H1', apply: (text) => `# ${text || 'Heading'}` },
  { label: 'Bold', apply: (text) => `**${text || 'bold text'}**` },
  { label: 'Italic', apply: (text) => `*${text || 'italic text'}*` },
  { label: 'List', apply: (text) => `- ${text || 'List item'}` },
  { label: 'Check', apply: (text) => `- [ ] ${text || 'Task item'}` },
  { label: 'Quote', apply: (text) => `> ${text || 'Quote'}` },
  { label: 'Code', apply: (text) => `\`\`\`\n${text || 'const note = true;'}\n\`\`\`` },
  { label: 'Link', apply: (text) => `[${text || 'Link label'}](https://example.com)` },
  { label: 'Table', apply: () => '| Column | Value |\n| --- | --- |\n| Item | Detail |' },
];

const formatDate = (value) => new Date(value).toLocaleString([], {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const readingStats = (content) => {
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  return {
    words,
    readingTime: Math.max(1, Math.ceil(words / 220)),
  };
};

const NoteEditorPane = ({
  note,
  draft,
  setDraft,
  dirty,
  saving,
  mode,
  setMode,
  attachments,
  shareUrl,
  tagInput,
  setTagInput,
  tagSuggestions,
  onAddTag,
  onRemoveTag,
  onSave,
  onDuplicate,
  onTogglePinned,
  onToggleArchived,
  onDelete,
  onRestore,
  onCreateShare,
  onUploadFiles,
}) => {
  const textareaRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const stats = useMemo(() => readingStats(draft.content), [draft.content]);

  if (!note) {
    return (
      <section className="editor-shell empty-card large">
        <h2>Your note canvas is ready</h2>
        <p>Create a note to start capturing ideas, drafts, links, and quick research.</p>
      </section>
    );
  }

  const insertMarkdown = (transform) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = draft.content.slice(start, end);
    const replacement = transform(selectedText);
    const nextContent = `${draft.content.slice(0, start)}${replacement}${draft.content.slice(end)}`;
    setDraft((current) => ({ ...current, content: nextContent }));
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = start;
      textarea.selectionEnd = start + replacement.length;
    });
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setDragActive(false);
    if (event.dataTransfer.files?.length) {
      await onUploadFiles(Array.from(event.dataTransfer.files));
    }
  };

  return (
    <section className="editor-shell">
      <header className="editor-header">
        <div>
          <input
            className="note-title-input"
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="Untitled note"
          />
          <div className="note-meta-row">
            <span>{stats.words} words</span>
            <span>{stats.readingTime} min read</span>
            <span>Updated {formatDate(note.lastEditedAt || note.updatedAt)}</span>
            {dirty && <span className="pill-warning">Unsaved</span>}
            {!dirty && !saving && <span className="pill-subtle">Saved</span>}
            {saving && <span className="pill-subtle">Saving…</span>}
          </div>
        </div>
        <div className="editor-toolbar-actions">
          <button type="button" className="ghost-button" onClick={onSave}><Save size={16} />Save</button>
          <button type="button" className="ghost-button" onClick={onCreateShare}><Share2 size={16} />Share</button>
          <button type="button" className="ghost-button" onClick={onDuplicate}><CopyPlus size={16} />Duplicate</button>
          <button type="button" className="ghost-button" onClick={onTogglePinned}><Pin size={16} />{note.isPinned ? 'Unpin' : 'Pin'}</button>
          {note.isDeleted ? (
            <button type="button" className="ghost-button" onClick={onRestore}><RotateCcw size={16} />Restore</button>
          ) : (
            <button type="button" className="ghost-button" onClick={onToggleArchived}><Archive size={16} />{note.isArchived ? 'Unarchive' : 'Archive'}</button>
          )}
          {!note.isDeleted && <button type="button" className="ghost-button danger" onClick={onDelete}><Trash2 size={16} />Trash</button>}
        </div>
      </header>

      <div className="editor-subtoolbar">
        <div className="markdown-tools">
          {toolActions.map((tool) => (
            <button key={tool.label} type="button" className="ghost-button compact" onClick={() => insertMarkdown(tool.apply)}>{tool.label}</button>
          ))}
          <label className="ghost-button compact upload-chip">
            <FileUp size={16} />
            Attach
            <input type="file" hidden multiple onChange={(event) => onUploadFiles(Array.from(event.target.files || []))} />
          </label>
        </div>
        <div className="mode-toggle">
          {['edit', 'preview', 'split'].map((view) => (
            <button key={view} type="button" className={`ghost-button compact ${mode === view ? 'is-selected' : ''}`} onClick={() => setMode(view)}>
              {view === 'edit' ? <EyeOff size={16} /> : <Eye size={16} />}
              {view}
            </button>
          ))}
        </div>
      </div>

      <div className="tag-editor-row">
        <div className="tag-list-inline">
          {draft.tags.map((tag) => (
            <button key={tag} type="button" className="tag-pill active removable" onClick={() => onRemoveTag(tag)}>
              #{tag}
            </button>
          ))}
        </div>
        <div className="tag-input-shell">
          <input
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault();
                onAddTag(tagInput);
              }
            }}
            placeholder="Add tags"
          />
          {tagInput && !!tagSuggestions.length && (
            <div className="tag-suggestion-list">
              {tagSuggestions.map((tag) => (
                <button key={tag.name} type="button" className="tag-suggestion" onClick={() => onAddTag(tag.name)}>
                  #{tag.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {shareUrl && <div className="share-banner">Share link ready: <a href={shareUrl} target="_blank" rel="noreferrer">{shareUrl}</a></div>}

      <div
        className={`editor-grid mode-${mode} ${dragActive ? 'drag-active' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        {(mode === 'edit' || mode === 'split') && (
          <div className="editor-panel">
            <textarea
              ref={textareaRef}
              className="markdown-textarea"
              value={draft.content}
              onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
              onBlur={onSave}
              placeholder="Write in markdown…"
            />
          </div>
        )}
        {(mode === 'preview' || mode === 'split') && (
          <div className="preview-panel">
            <MarkdownPreview content={draft.content} />
          </div>
        )}
      </div>

      <footer className="editor-footer">
        <div>
          <strong>Attachments</strong>
          <span className="muted"> Drag and drop files into the editor to insert markdown links.</span>
        </div>
        <div className="attachment-list">
          {attachments.length ? attachments.map((attachment) => (
            <a key={attachment._id} href={attachment.fileUrl} className="attachment-chip" target="_blank" rel="noreferrer">
              {attachment.originalName}
            </a>
          )) : <span className="muted">No attachments yet.</span>}
        </div>
      </footer>
    </section>
  );
};

export default NoteEditorPane;
