import { Hash, KeyRound, ShieldHalf } from 'lucide-react';
import { Timer } from './Timer.tsx';

interface HeaderProps {
  password: string;
  salt: string;
  onPasswordChange: (v: string) => void;
  onSaltChange: (v: string) => void;
  elapsedMs: number;
  totalMs: number;
  isPlaying: boolean;
}

export function Header({
  password, salt, onPasswordChange, onSaltChange, elapsedMs, totalMs, isPlaying,
}: HeaderProps) {
  return (
    <header className="flex items-center gap-4 border-b border-slate-800/80 bg-black/30 px-4 py-2.5">
      <div className="flex items-center gap-2 pr-2">
        <ShieldHalf className="text-cyan-400" size={22} />
        <div className="leading-tight">
          <h1 className="text-sm font-semibold tracking-wide text-slate-100">Argon2id</h1>
          <p className="text-[10px] text-slate-500">démonstrateur interactif</p>
        </div>
      </div>

      <div className="h-8 w-px bg-slate-800" />

      <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-cyan-500/25 bg-cyan-400/5 px-3 py-1.5 focus-within:border-cyan-400/70 focus-within:bg-cyan-400/10">
        <KeyRound size={15} className="shrink-0 text-cyan-400" />
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-cyan-300/80">
          Mot de passe
        </span>
        <input
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          placeholder="(vide autorisé)"
          className="w-full min-w-0 bg-transparent font-mono text-sm text-cyan-100 placeholder:text-cyan-100/30 focus:outline-none"
        />
      </label>

      <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-pink-500/25 bg-pink-400/5 px-3 py-1.5 focus-within:border-pink-400/70 focus-within:bg-pink-400/10">
        <Hash size={15} className="shrink-0 text-pink-400" />
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-pink-300/80">
          Sel
        </span>
        <input
          value={salt}
          onChange={(e) => onSaltChange(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          placeholder="(vide autorisé)"
          className="w-full min-w-0 bg-transparent font-mono text-sm text-pink-100 placeholder:text-pink-100/30 focus:outline-none"
        />
      </label>

      <Timer elapsedMs={elapsedMs} totalMs={totalMs} isPlaying={isPlaying} />
    </header>
  );
}
