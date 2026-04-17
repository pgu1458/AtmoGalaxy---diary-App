// src/context/ThemeContext.tsx
import React, { createContext, useContext, useState } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark', isDark: true, toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() { return useContext(ThemeContext); }

// �׸��� ���� �ȷ�Ʈ
export const THEME = {
  dark: {
    bg:           '#060d1f',
    panelBg:      'rgba(13,17,30,0.97)',
    panelBorder:  'rgba(255,255,255,0.1)',
    searchBg:     'rgba(6,13,31,0.92)',
    text:         '#ffffff',
    textSub:      'rgba(255,255,255,0.4)',
    inputBg:      'rgba(255,255,255,0.06)',
    inputBorder:  'rgba(255,255,255,0.1)',
    modeBg:       'rgba(6,13,31,0.88)',
    modeText:     '#ffffff',
    mapStyle:     'mapbox://styles/mapbox/dark-v11',
  },
  light: {
    bg:           '#e8edf5',
    panelBg:      'rgba(245,247,252,0.98)',
    panelBorder:  'rgba(0,0,0,0.08)',
    searchBg:     'rgba(255,255,255,0.95)',
    text:         '#0f172a',
    textSub:      'rgba(15,23,42,0.45)',
    inputBg:      'rgba(0,0,0,0.04)',
    inputBorder:  'rgba(0,0,0,0.1)',
    modeBg:       'rgba(255,255,255,0.92)',
    modeText:     '#0f172a',
    mapStyle:     'mapbox://styles/mapbox/light-v11',
  },
};