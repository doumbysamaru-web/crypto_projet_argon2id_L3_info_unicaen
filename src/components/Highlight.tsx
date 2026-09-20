import type { ReactNode } from 'react';

type Tone = 'pass' | 'salt' | 'ref' | 'signal' | 'warn';

const TONE_CLASSES: Record<Tone, string> = {
  pass: 'text-cyan-300 bg-cyan-400/10 ring-cyan-400/30',
  salt: 'text-pink-300 bg-pink-400/10 ring-pink-400/30',
  ref: 'text-violet-300 bg-violet-400/10 ring-violet-400/30',
  signal: 'text-emerald-300 bg-emerald-400/10 ring-emerald-400/30',
  warn: 'text-amber-300 bg-amber-400/10 ring-amber-400/30',
};

export function Highlight({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[0.85em] ring-1 ring-inset ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
