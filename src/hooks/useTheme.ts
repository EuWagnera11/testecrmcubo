import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme;
      return stored || 'system';
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (t: Theme) => {
      let resolved: 'light' | 'dark';

      if (t === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolved = t;
      }

      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
      setResolvedTheme(resolved);
    };

    applyTheme(theme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    // Save to profile if user is logged in
    if (user) {
      await supabase
        .from('profiles')
        .update({ theme: newTheme })
        .eq('user_id', user.id);
    }
  };

  // Load theme from profile on mount
  useEffect(() => {
    if (!user) return;

    const loadTheme = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('theme')
        .eq('user_id', user.id)
        .single();

      if (data?.theme) {
        setThemeState(data.theme as Theme);
        localStorage.setItem('theme', data.theme);
      }
    };

    loadTheme();
  }, [user]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    isDark: resolvedTheme === 'dark',
  };
}
