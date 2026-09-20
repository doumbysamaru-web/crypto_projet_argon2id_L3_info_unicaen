import { TimerIcon } from 'lucide-react';
import { formatMs } from '../lib/costModel.ts';

export function Timer({
  elapsedMs, totalMs, isPlaying,
}: { elapsedMs: number; totalMs: number; isPlaying: boolean }) {
  const progress = totalMs > 0 ? Math.min(1, elapsedMs / totalMs) : 0;

  return (
    <div className="hidden shrink-0 items-center gap-3 md:flex">
      <TimerIcon size={20} className={isPlaying ? 'text-signal' : 'text-ink-muted'} />
      <div className="w-40">
        <div className="flex items-baseline gap-1.5 font-mono">
          <span className="text-lg font-semibold tabular-nums text-ink">{formatMs(elapsedMs)}</span>
          <span className="text-sm text-ink-muted">/ {formatMs(totalMs)}</span>
        </div>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-signal transition-[width] duration-150 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
