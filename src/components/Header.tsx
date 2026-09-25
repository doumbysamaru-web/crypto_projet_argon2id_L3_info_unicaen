import { Dices, KeyRound, ShieldHalf } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle.tsx';
import { Timer } from './Timer.tsx';

interface HeaderProps {
  password: string;
  salt: string;
  saltAuto: boolean;
  onPasswordChange: (v: string) => void;
  onSaltChange: (v: string) => void;
  onRegenerateSalt: () => void;
  elapsedMs: number;
  totalMs: number;
  isPlaying: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Header({
  password, salt, saltAuto, onPasswordChange, onSaltChange, onRegenerateSalt,
  elapsedMs, totalMs, isPlaying, theme, onToggleTheme,
}: HeaderProps) {
  return (
    <header className="flex items-center gap-6 border-b border-edge px-6 py-4">
      <div className="flex items-center gap-2.5">
        <ShieldHalf className="text-pass" size={26} strokeWidth={2} />
        <h1 className="text-xl font-semibold tracking-tight">Argon2id</h1>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-4">
        <Field
          label="Mot de passe"
          value={password}
          onChange={onPasswordChange}
          icon={<KeyRound size={17} />}
          accent="pass"
        />
        <Field
          label="Sel"
          value={salt}
          onChange={onSaltChange}
          icon={<span className="text-[17px] font-semibold leading-none">#</span>}
          accent="salt"
          trailing={
            <div className="flex shrink-0 items-center gap-2">
              {saltAuto && <span className="text-sm text-ink-muted">auto</span>}
              <button
                type="button"
                onClick={onRegenerateSalt}
                title="Générer un nouveau sel aléatoire"
                className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-2 hover:text-salt"
              >
                <Dices size={18} />
              </button>
            </div>
          }
        />
      </div>

      <Timer elapsedMs={elapsedMs} totalMs={totalMs} isPlaying={isPlaying} />
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
    </header>
  );
}

function Field({
  label, value, onChange, icon, accent, trailing,
}: {
  label: string; value: string; onChange: (v: string) => void; icon: ReactNode; accent: 'pass' | 'salt'; trailing?: ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-edge bg-surface px-4 py-2.5 transition-colors focus-within:border-[--c] has-[input:focus]:border-[--c]"
      style={{ '--c': accent === 'pass' ? 'var(--pass)' : 'var(--salt)' } as CSSProperties}
    >
      <span className={accent === 'pass' ? 'text-pass' : 'text-salt'}>{icon}</span>
      <span className="shrink-0 text-sm font-medium text-ink-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        placeholder="vide autorisé"
        className="w-full min-w-0 bg-transparent font-mono text-lg text-ink placeholder:text-ink-muted/50 focus:outline-none"
      />
      {trailing}
    </label>
  );
}
