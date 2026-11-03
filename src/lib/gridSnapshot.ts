import { toHex, type TraceStep } from './argon2.ts';

export type CellState = 'empty' | 'computing' | 'previous' | 'reference' | 'filled';

export interface Cell {
  state: CellState;
  hex: string | null;
  lastStep: number;
}

export interface GridSnapshot {
  cells: Cell[][]; // [lane][col]
  currentStep: TraceStep | null;
}

export function computeGridSnapshot(
  trace: TraceStep[], stepIndex: number, p: number, q: number,
): GridSnapshot {
  const cells: Cell[][] = Array.from({ length: p }, () =>
    Array.from({ length: q }, () => ({ state: 'empty' as CellState, hex: null, lastStep: -1 })));

  const last = Math.min(stepIndex, trace.length - 1);
  for (let i = 0; i <= last; i++) {
    const step = trace[i];
    if ((step.kind === 'init' || step.kind === 'fill') && step.lane !== undefined && step.col !== undefined) {
      cells[step.lane][step.col] = {
        state: 'filled',
        hex: toHex(step.newBlock!, 8),
        lastStep: i,
      };
    }
  }

  const current = last >= 0 ? trace[last] : null;

  if (current) {
    if ((current.kind === 'fill' || current.kind === 'init') && current.lane !== undefined && current.col !== undefined) {
      cells[current.lane][current.col] = {
        ...cells[current.lane][current.col],
        state: 'computing',
      };
    }
    if (current.kind === 'fill' && current.lane !== undefined && current.col !== undefined) {
      const prevCol = current.col === 0 ? q - 1 : current.col - 1;
      cells[current.lane][prevCol] = { ...cells[current.lane][prevCol], state: 'previous' };
    }
    if (current.kind === 'fill' && current.ref) {
      const { lane, col } = current.ref;
      if (!(lane === current.lane && col === current.col)) {
        cells[lane][col] = { ...cells[lane][col], state: 'reference' };
      }
    }
    if (current.kind === 'final') {
      for (let lane = 0; lane < p; lane++) {
        cells[lane][q - 1] = { ...cells[lane][q - 1], state: 'reference' };
      }
    }
  }

  return { cells, currentStep: current };
}
