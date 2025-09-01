import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Theme Provider Component
 * 
 * Provides theme management functionality across the application.
 * Supports light, dark, and system theme preferences with persistence.
 * 
 * Features:
 * - Automatic system theme detection
 * - LocalStorage persistence
 * - CSS class management for theme switching
 * - React Context for global theme state
 * 
 * Usage:
 * ```jsx
 * // Wrap your app
 * <ThemeProvider defaultTheme="system" storageKey="shopify-dashboard-theme">
 *   <App />
 * </ThemeProvider>
 * 
 * // Use in components
 * import { useTheme } from '@/providers/ThemeProvider';
 * 
 * function MyComponent() {
 *   const { theme, setTheme, toggleTheme } = useTheme();
 *   
 *   return (
 *     <button onClick={toggleTheme}>
 *       Current theme: {theme}
 *     </button>
 *   );
 * }
 * ```
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.defaultTheme - Default theme ('light' | 'dark' | 'system')
 * @param {string} props.storageKey - LocalStorage key for persistence
 */

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => null,
  toggleTheme: () => null,
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export function ThemeProvider({ 
  children, 
  defaultTheme = 'system', 
  storageKey = 'shopify-dashboard-theme' 
}) {
  const [theme, setTheme] = useState(() => {
    // Initialize theme from localStorage or default
    if (typeof window !== 'undefined') {
      return localStorage.getItem(storageKey) || defaultTheme;
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      // Use system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
      return;
    }

    // Apply selected theme
    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
    toggleTheme: () => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
