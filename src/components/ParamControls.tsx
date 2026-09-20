import {
  Pause, Play, RotateCcw, StepBack, StepForward,
} from 'lucide-react';
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
  label, value, min, max, step, onChange, accent, suffix, hint,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; accent: string; suffix: string; hint: string;
}) {
  return (
    <div className="flex-1 min-w-[150px]">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
        <span className={`font-mono text-sm font-semibold ${accent}`}>{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-800 ${accent}`}
        style={{ accentColor: 'currentColor' }}
      />
      <div className="flex justify-between">
        <span className="text-[9px] text-slate-600">{hint}</span>
        <span className="text-[9px] text-slate-600">max {max}{suffix}</span>
      </div>
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
    <footer className="flex flex-wrap items-center gap-5 border-t border-slate-800/80 bg-black/30 px-4 py-2.5">
      <div className="flex flex-1 flex-wrap items-center gap-5 min-w-[420px]">
        <Slider
          label="Mémoire (m)" value={m} min={mMin} max={M_MAX} step={mStep}
          onChange={onChangeM} accent="text-cyan-300" suffix=" Ko"
          hint={`grille ${p}×${layout.laneLength}`}
        />
        <Slider
          label="Itérations (t)" value={t} min={1} max={T_MAX} step={1}
          onChange={onChangeT} accent="text-emerald-300" suffix=" passes"
          hint="passes sur la mémoire"
        />
        <Slider
          label="Parallélisme (p)" value={p} min={1} max={P_MAX} step={1}
          onChange={onChangeP} accent="text-violet-300" suffix=" lanes"
          hint="lignes de la grille"
        />
      </div>

      <div className="h-9 w-px bg-slate-800" />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/60 p-1">
          <button
            type="button"
            onClick={onReset}
            title="Réinitialiser"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            onClick={onStepBack}
            title="Étape précédente"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <StepBack size={16} />
          </button>
          {isPlaying ? (
            <button
              type="button"
              onClick={onPause}
              title="Pause"
              className="rounded-md bg-cyan-500/90 p-1.5 text-slate-950 hover:bg-cyan-400"
            >
              <Pause size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onPlay}
              title="Lecture"
              className="rounded-md bg-emerald-500/90 p-1.5 text-slate-950 hover:bg-emerald-400"
            >
              <Play size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={onStepForward}
            title="Étape suivante"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <StepForward size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSpeedChange(s)}
              className={`rounded px-1.5 py-1 font-mono text-[11px] ${
                speed === s ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        <span className="font-mono text-[10px] text-slate-600 tabular-nums">
          étape {Math.min(stepIndex + 1, totalSteps)}/{totalSteps}
        </span>
      </div>
    </footer>
  );
}
