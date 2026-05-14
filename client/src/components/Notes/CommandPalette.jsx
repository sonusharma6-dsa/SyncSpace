import React, { useMemo, useState } from 'react';
import { Archive, FilePlus2, MoonStar, Search, Settings2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const iconMap = {
  new: FilePlus2,
  search: Search,
  archive: Archive,
  trash: Trash2,
  settings: Settings2,
  theme: MoonStar,
};

const CommandPalette = ({ open, onClose, onNewNote, onFocusSearch, onToggleTheme }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const commands = useMemo(() => ([
    { id: 'new', label: 'Create new note', action: onNewNote },
    { id: 'search', label: 'Focus search', action: onFocusSearch },
    { id: 'archive', label: 'Open archive', action: () => navigate('/archive') },
    { id: 'trash', label: 'Open trash', action: () => navigate('/trash') },
    { id: 'settings', label: 'Open settings', action: () => navigate('/settings') },
    { id: 'theme', label: 'Cycle theme', action: onToggleTheme },
  ]), [navigate, onFocusSearch, onNewNote, onToggleTheme]);

  const filtered = commands.filter((command) => command.label.toLowerCase().includes(query.toLowerCase()));

  if (!open) return null;

  return (
    <div className="palette-overlay" onClick={onClose} role="presentation">
      <div className="palette-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="palette-header">
          <Search size={16} />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search commands…"
          />
        </div>
        <div className="palette-list">
          {filtered.map((command) => {
            const Icon = iconMap[command.id] || Search;
            return (
              <button
                key={command.id}
                type="button"
                className="palette-item"
                onClick={() => {
                  command.action();
                  onClose();
                }}
              >
                <Icon size={16} />
                <span>{command.label}</span>
              </button>
            );
          })}
          {!filtered.length && <div className="palette-empty">No commands match “{query}”.</div>}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
