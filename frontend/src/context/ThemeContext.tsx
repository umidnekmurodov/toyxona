import React, { createContext, useState, useEffect, useContext } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;

    if (isDark) {
      // html elementiga dark klass qo'shish (Tailwind v4 dark: va html.dark CSS uchun)
      root.classList.add('dark');
      root.style.backgroundColor = '#0B0F19';
      document.body.style.backgroundColor = '#0B0F19';
      document.body.style.color = '#F9FAFB';
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#F9FAFB';
      document.body.style.backgroundColor = '#F9FAFB';
      document.body.style.color = '#111827';
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
