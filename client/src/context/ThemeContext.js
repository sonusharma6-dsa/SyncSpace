import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'notemesh-theme';

const resolveTheme = (theme) => {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
};

export const ThemeProvider = ({ children }) => {
  const { user, updatePreferences } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) || user?.themePreference || 'system');

  useEffect(() => {
    if (user?.themePreference && !localStorage.getItem(STORAGE_KEY)) {
      setTheme(user.themePreference);
    }
  }, [user?.themePreference]);

  useEffect(() => {
    const appliedTheme = resolveTheme(theme);
    document.documentElement.dataset.theme = appliedTheme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if ((localStorage.getItem(STORAGE_KEY) || 'system') === 'system') {
        document.documentElement.dataset.theme = resolveTheme('system');
      }
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const setThemePreference = useCallback(async (nextTheme, persist = true) => {
    setTheme(nextTheme);
    if (persist && user) {
      try {
        await updatePreferences({ themePreference: nextTheme });
      } catch (_error) {
        // UI already reflects the persisted local preference.
      }
    }
  }, [updatePreferences, user]);

  const cycleTheme = useCallback(() => {
    const order = ['light', 'dark', 'system'];
    const nextTheme = order[(order.indexOf(theme) + 1) % order.length];
    setThemePreference(nextTheme);
  }, [setThemePreference, theme]);

  const value = useMemo(() => ({ theme, resolvedTheme: resolveTheme(theme), setThemePreference, cycleTheme }), [cycleTheme, setThemePreference, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
