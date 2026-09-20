import { useCallback, useEffect, useMemo, useState } from 'react';
import { ComparisonPanel } from './components/ComparisonPanel.tsx';
import { ExplanationPanel } from './components/ExplanationPanel.tsx';
import { Header } from './components/Header.tsx';
import { MemoryGrid } from './components/MemoryGrid.tsx';
import { ParamControls } from './components/ParamControls.tsx';
import { useArgon2Trace } from './hooks/useArgon2Trace.ts';
import { usePlayback } from './hooks/usePlayback.ts';
import { useTheme } from './hooks/useTheme.ts';
import { toHex, type TraceStep } from './lib/argon2.ts';
import { estimateArgon2Ms } from './lib/costModel.ts';
import { computeGridSnapshot } from './lib/gridSnapshot.ts';

const DEFAULTS = {
  password: 'MotDePasse!42',
  salt: 'SelDeDemo2024',
  m: 256,
  t: 3,
  p: 4,
};

function initHexesOf(trace: TraceStep[]): string[] {
  return trace.filter((s) => s.kind === 'init').map((s) => toHex(s.newBlock!, 8));
}

export default function App() {
  const [password, setPassword] = useState(DEFAULTS.password);
  const [salt, setSalt] = useState(DEFAULTS.salt);
  const [m, setM] = useState(DEFAULTS.m);
  const [t, setT] = useState(DEFAULTS.t);
  const [p, setP] = useState(DEFAULTS.p);

  const { trace, layout } = useArgon2Trace({ password, salt, m, t, p });
  const { theme, toggle: toggleTheme } = useTheme();
  const {
    stepIndex, isPlaying, speed, setSpeed, play, pause, stepForward, stepBack, reset, goTo,
  } = usePlayback(trace.length);

  // Derived from `layout`, not the live `p` state: while a parameter change is
  // still debouncing, `trace`/`layout` briefly lag behind the slider, and
  // indexing that stale trace with the already-updated `p` would read out of
  // bounds (e.g. a step with lane=7 against a freshly-shrunk 1-lane grid).
  const effectiveP = layout.mPrime / layout.laneLength;

  const snapshot = useMemo(
    () => computeGridSnapshot(trace, stepIndex, effectiveP, layout.laneLength),
    [trace, stepIndex, effectiveP, layout.laneLength],
  );

  const totalSimMs = useMemo(() => estimateArgon2Ms(layout.mPrime, t, p), [layout.mPrime, t, p]);
  const lastIndex = Math.max(1, trace.length - 1);
  const elapsedMs = totalSimMs * (Math.min(stepIndex, lastIndex) / lastIndex);

  const [flash, setFlash] = useState<{ changed: number; total: number } | null>(null);
  const [flashCells, setFlashCells] = useState<Set<string>>(new Set());

  // Detecting "the trace changed, so diff it against the last one" is exactly
  // React's documented "adjusting state when a prop changes" pattern: done
  // during render (comparing two state values) rather than in an effect, so
  // it resolves in the same pass instead of a visible extra frame.
  const [prevTrace, setPrevTrace] = useState(trace);
  const [prevInitHexes, setPrevInitHexes] = useState<string[]>(() => initHexesOf(trace));
  if (trace !== prevTrace) {
    const initSteps = trace.filter((s) => s.kind === 'init');
    const currentHexes = initSteps.map((s) => toHex(s.newBlock!, 8));

    if (prevInitHexes.length === currentHexes.length) {
      const changedCells: string[] = [];
      currentHexes.forEach((hex, i) => {
        if (hex !== prevInitHexes[i]) changedCells.push(`${initSteps[i].lane}-${initSteps[i].col}`);
      });
      if (changedCells.length > 0) {
        setFlash({ changed: changedCells.length, total: currentHexes.length });
        setFlashCells(new Set(changedCells));
      }
    }
    setPrevInitHexes(currentHexes);
    setPrevTrace(trace);
  }

  // The timeout that clears a flash IS a real external-system side effect.
  useEffect(() => {
    if (!flash) return undefined;
    const id = window.setTimeout(() => {
      setFlash(null);
      setFlashCells(new Set());
    }, 2500);
    return () => window.clearTimeout(id);
  }, [flash]);

  const handleChangeP = useCallback((newP: number) => {
    setP(newP);
    setM((prevM) => {
      const minM = 4 * newP;
      const snapped = Math.round(prevM / minM) * minM;
      return Math.max(minM, Math.min(1024, snapped));
    });
  }, []);

  const handleSelectCell = useCallback((lane: number, col: number) => {
    // Walk backwards from the current step: a cell may have been written more
    // than once (later passes overwrite earlier ones), and we want the write
    // that produced what's currently on screen.
    for (let i = Math.min(stepIndex, trace.length - 1); i >= 0; i--) {
      const s = trace[i];
      if ((s.kind === 'fill' || s.kind === 'init') && s.lane === lane && s.col === col) {
        goTo(i);
        return;
      }
    }
  }, [trace, stepIndex, goTo]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg text-ink">
      <Header
        password={password}
        salt={salt}
        onPasswordChange={setPassword}
        onSaltChange={setSalt}
        elapsedMs={elapsedMs}
        totalMs={totalSimMs}
        isPlaying={isPlaying}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <ComparisonPanel mPrime={layout.mPrime} t={t} p={p} />

      <main className="flex min-h-0 flex-1 gap-4 p-4">
        <section className="flex min-h-0 min-w-0 flex-[1.6] flex-col gap-4 rounded-2xl border border-edge bg-surface p-6">
          <h2 className="shrink-0 text-lg font-medium text-ink-muted">Matrice mémoire</h2>
          <MemoryGrid
            snapshot={snapshot}
            p={effectiveP}
            q={layout.laneLength}
            segmentLength={layout.segmentLength}
            flashSet={flashCells}
            onSelectCell={handleSelectCell}
          />
        </section>

        <aside className="flex w-[440px] shrink-0 flex-col">
          <ExplanationPanel
            step={snapshot.currentStep}
            stepIndex={stepIndex}
            totalSteps={trace.length}
            layout={layout}
            password={password}
            salt={salt}
            flash={flash}
          />
        </aside>
      </main>

      <ParamControls
        m={m}
        t={t}
        p={p}
        onChangeM={setM}
        onChangeT={setT}
        onChangeP={handleChangeP}
        layout={layout}
        isPlaying={isPlaying}
        onPlay={play}
        onPause={pause}
        onStepForward={stepForward}
        onStepBack={stepBack}
        onReset={reset}
        speed={speed}
        onSpeedChange={setSpeed}
        stepIndex={stepIndex}
        totalSteps={trace.length}
      />
    </div>
  );
}
