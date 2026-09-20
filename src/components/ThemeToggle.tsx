import { Moon, Sun } from 'lucide-react';

export function ThemeToggle({ theme, onToggle }: { theme: 'light' | 'dark'; onToggle: () => void }) {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Passer en thème clair' : 'Passer en thème sombre'}
      title={isDark ? 'Thème clair' : 'Thème sombre'}
      className="relative inline-flex h-10 w-[4.5rem] shrink-0 items-center rounded-full border border-edge bg-surface-2 px-1 transition-colors hover:border-ink-muted"
    >
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full bg-bg text-ink shadow-sm transition-transform duration-200 ease-out"
        style={{ transform: isDark ? 'translateX(0)' : 'translateX(1.75rem)' }}
      >
        {isDark ? <Moon size={16} /> : <Sun size={16} />}
      </span>
    </button>
  );
}
