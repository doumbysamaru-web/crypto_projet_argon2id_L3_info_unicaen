import { useCallback, useState } from 'react';

type Theme = 'light' | 'dark';

function readInitialTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem('argon2id-theme', next);
      } catch {
        // Private browsing / storage disabled: theme just won't persist.
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
