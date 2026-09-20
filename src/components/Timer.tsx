import { TimerIcon } from 'lucide-react';
import { formatMs } from '../lib/costModel.ts';

export function Timer({
  elapsedMs, totalMs, isPlaying,
}: { elapsedMs: number; totalMs: number; isPlaying: boolean }) {
  const progress = totalMs > 0 ? Math.min(1, elapsedMs / totalMs) : 0;

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-slate-800 bg-black/40 px-3 py-1.5 min-w-[168px]">
      <div className="flex items-center gap-2">
        <TimerIcon
          size={16}
          className={isPlaying ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}
        />
        <span className="font-mono text-lg tabular-nums leading-none text-emerald-300">
          {formatMs(elapsedMs)}
        </span>
        <span className="font-mono text-[11px] text-slate-500 leading-none">
          / {formatMs(totalMs)}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-[width] duration-150 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className="text-[9px] uppercase tracking-wide text-slate-600">
        Temps simulé (estimation pédagogique)
      </span>
    </div>
  );
}
