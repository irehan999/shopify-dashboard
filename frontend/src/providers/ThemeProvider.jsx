import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Theme Provider Component
 * 
 * Provides theme management functionality across the application.
 * Supports light, dark, and system theme preferences with persistence.
 * 
 * Features:
 * - Automatic system theme detection with change listeners
 * - LocalStorage persistence with error handling
 * - CSS class management for theme switching with smooth transitions
 * - React Context for global theme state
 * - Prevents theme flashing during initial load
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
 *   const { theme, setTheme, toggleTheme, effectiveTheme } = useTheme();
 *   
 *   return (
 *     <button onClick={toggleTheme}>
 *       Current theme: {effectiveTheme}
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
  effectiveTheme: 'light',
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
      try {
        return localStorage.getItem(storageKey) || defaultTheme;
      } catch {
        return defaultTheme;
      }
    }
    return defaultTheme;
  });

  const [effectiveTheme, setEffectiveTheme] = useState('light');

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (themeToApply) => {
      // Force a reflow to ensure smooth transition
      root.style.transition = 'background-color 0.2s ease, color 0.2s ease';
      
      // Remove existing theme classes
      root.classList.remove('light', 'dark');
      
      // Apply new theme
      root.classList.add(themeToApply);
      setEffectiveTheme(themeToApply);
      
      // Remove transition after it completes to avoid interfering with other transitions
      setTimeout(() => {
        root.style.transition = '';
      }, 200);
    };

    if (theme === 'system') {
      // Get system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      
      applyTheme(systemTheme);
      
      // Listen for system theme changes
      const handleChange = (e) => {
        const newSystemTheme = e.matches ? 'dark' : 'light';
        applyTheme(newSystemTheme);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Apply selected theme
      applyTheme(theme);
    }
  }, [theme]);

  const value = {
    theme,
    effectiveTheme,
    setTheme: (newTheme) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, newTheme);
        } catch (error) {
          console.warn('Failed to save theme to localStorage:', error);
        }
      }
      setTheme(newTheme);
    },
    toggleTheme: () => {
      const newTheme = effectiveTheme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, newTheme);
        } catch (error) {
          console.warn('Failed to save theme to localStorage:', error);
        }
      }
      setTheme(newTheme);
    },
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
