import type { ReactNode } from 'react';

type Tone = 'pass' | 'salt' | 'ref' | 'signal' | 'warn';

const TONE_CLASSES: Record<Tone, string> = {
  pass: 'text-pass bg-pass/10',
  salt: 'text-salt bg-salt/10',
  ref: 'text-ref bg-ref/10',
  signal: 'text-signal bg-signal/10',
  warn: 'text-warn bg-warn/10',
};

export function Highlight({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[0.9em] font-medium ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}
