import {
  Pause, Play, RotateCcw, StepBack, StepForward,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { Argon2Layout } from '../lib/argon2.ts';

interface ParamControlsProps {
  m: number;
  t: number;
  p: number;
  onChangeM: (v: number) => void;
  onChangeT: (v: number) => void;
  onChangeP: (v: number) => void;
  layout: Argon2Layout;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (v: number) => void;
  stepIndex: number;
  totalSteps: number;
}

const M_MAX = 1024;
const T_MAX = 5;
const P_MAX = 8;
const SPEEDS = [0.5, 1, 2, 4];

function Slider({
  label, value, min, max, step, onChange, accent, suffix,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; accent: string; suffix: string;
}) {
  return (
    <div className="flex-1 min-w-[180px]">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink-muted">{label}</span>
        <span className="font-mono text-2xl font-semibold" style={{ color: accent }}>{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-2"
        style={{ accentColor: accent }}
      />
    </div>
  );
}

export function ParamControls({
  m, t, p, onChangeM, onChangeT, onChangeP, layout,
  isPlaying, onPlay, onPause, onStepForward, onStepBack, onReset,
  speed, onSpeedChange, stepIndex, totalSteps,
}: ParamControlsProps) {
  const mStep = 4 * p;
  const mMin = 4 * p;

  return (
    <footer className="flex flex-wrap items-center gap-8 border-t border-edge px-6 py-5">
      <div className="flex flex-1 flex-wrap items-center gap-8 min-w-[480px]">
        <Slider label="Mémoire (m)" value={m} min={mMin} max={M_MAX} step={mStep} onChange={onChangeM} accent="var(--pass)" suffix=" Ko" />
        <Slider label="Itérations (t)" value={t} min={1} max={T_MAX} step={1} onChange={onChangeT} accent="var(--signal)" suffix="" />
        <Slider label="Parallélisme (p)" value={p} min={1} max={P_MAX} step={1} onChange={onChangeP} accent="var(--ref)" suffix="" />
        <p className="hidden shrink-0 font-mono text-sm text-ink-muted lg:block">grille {p}×{layout.laneLength}</p>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1.5 rounded-full border border-edge bg-surface p-1.5">
          <IconButton title="Réinitialiser" onClick={onReset}><RotateCcw size={20} /></IconButton>
          <IconButton title="Étape précédente" onClick={onStepBack}><StepBack size={20} /></IconButton>
          {isPlaying ? (
            <button
              type="button"
              onClick={onPause}
              title="Pause"
              className="rounded-full bg-ink p-2.5 text-bg transition-opacity hover:opacity-90"
            >
              <Pause size={20} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onPlay}
              title="Lecture"
              className="rounded-full bg-signal p-2.5 text-bg transition-opacity hover:opacity-90"
            >
              <Play size={20} />
            </button>
          )}
          <IconButton title="Étape suivante" onClick={onStepForward}><StepForward size={20} /></IconButton>
        </div>

        <div className="flex items-center gap-0.5 rounded-full border border-edge p-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSpeedChange(s)}
              className={`rounded-full px-3 py-1.5 font-mono text-sm transition-colors ${
                speed === s ? 'bg-ink text-bg' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        <span className="font-mono text-sm text-ink-muted tabular-nums">
          {Math.min(stepIndex + 1, totalSteps)} / {totalSteps}
        </span>
      </div>
    </footer>
  );
}

function IconButton({
  title, onClick, children,
}: { title: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded-full p-2.5 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {children}
    </button>
  );
}
