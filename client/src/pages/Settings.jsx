import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Keyboard, MonitorCog, MoonStar, SunMedium } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

const themeOptions = [
  { id: 'light', label: 'Light', icon: SunMedium, copy: 'Bright canvas for daytime writing.' },
  { id: 'dark', label: 'Dark', icon: MoonStar, copy: 'Comfortable contrast for low-light editing.' },
  { id: 'system', label: 'System', icon: MonitorCog, copy: 'Follow your device preference automatically.' },
];

const shortcuts = [
  ['Ctrl/Cmd + K', 'Open the command palette'],
  ['/', 'Focus global search'],
  ['N', 'Create a new note from anywhere in the app'],
  ['Blur editor', 'Trigger an immediate save'],
];

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setThemePreference } = useTheme();
  const { showToast } = useToast();

  const handleThemeChange = async (nextTheme) => {
    await setThemePreference(nextTheme);
    showToast(`Theme set to ${nextTheme}.`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <Link to="/dashboard" className="ghost-button"><ArrowLeft size={16} />Back to notes</Link>
        <button type="button" className="ghost-button" onClick={handleLogout}>Logout</button>
      </header>
      <main className="settings-grid">
        <section className="settings-card">
          <p className="eyebrow">Preferences</p>
          <h1>Keep NoteMesh feeling like your own workspace</h1>
          <p className="muted">Signed in as {user?.email}. These preferences persist locally and sync to your account when available.</p>
          <div className="theme-grid">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button key={option.id} type="button" className={`theme-option ${theme === option.id ? 'active' : ''}`} onClick={() => handleThemeChange(option.id)}>
                  <Icon size={18} />
                  <div>
                    <strong>{option.label}</strong>
                    <p>{option.copy}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-header">
            <Keyboard size={18} />
            <div>
              <h2>Keyboard flow</h2>
              <p>NoteMesh is designed for quick capture and low-friction navigation.</p>
            </div>
          </div>
          <div className="shortcut-list">
            {shortcuts.map(([shortcut, description]) => (
              <div key={shortcut} className="shortcut-row">
                <kbd>{shortcut}</kbd>
                <span>{description}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="settings-card">
          <h2>Sample UI copy</h2>
          <ul className="copy-list">
            <li>“Write clearly. Search instantly. Keep your note mesh tidy.”</li>
            <li>“No folders. No clutter. Just notes, tags, and momentum.”</li>
            <li>“Pinned notes keep your current work a click away.”</li>
            <li>“Trash keeps mistakes reversible, not permanent.”</li>
          </ul>
        </section>
      </main>
    </div>
  );
};

export default Settings;
