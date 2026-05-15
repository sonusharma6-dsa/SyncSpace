import React from 'react';
import { MoonStar, SunMedium, MonitorCog } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const icons = {
  light: SunMedium,
  dark: MoonStar,
  system: MonitorCog,
};

const ThemeToggle = ({ compact = false }) => {
  const { theme, cycleTheme } = useTheme();
  const Icon = icons[theme] || SunMedium;

  return (
    <button type="button" className={`ghost-button ${compact ? 'icon-only' : ''}`} onClick={cycleTheme}>
      <Icon size={16} />
      {!compact && <span>{theme}</span>}
    </button>
  );
};

export default ThemeToggle;
