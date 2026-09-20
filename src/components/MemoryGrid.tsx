import { memo } from 'react';
import type { Cell, GridSnapshot } from '../lib/gridSnapshot.ts';

const STATE_CLASSES: Record<Cell['state'], string> = {
  empty: 'bg-slate-900/70 border border-slate-800/70',
  computing: 'bg-amber-400 border border-amber-200 shadow-[0_0_10px_2px_rgba(251,191,36,0.65)] animate-pulse',
  reference: 'bg-violet-500 border border-violet-300 shadow-[0_0_8px_2px_rgba(167,139,250,0.6)]',
  filled: 'bg-emerald-600/85 border border-emerald-400/40 hover:brightness-125',
};

interface GridCellProps {
  cell: Cell;
  lane: number;
  col: number;
  sliceBoundary: boolean;
  flashing: boolean;
  onSelect: (lane: number, col: number) => void;
}

function cellsEqual(a: GridCellProps, b: GridCellProps): boolean {
  return a.cell.state === b.cell.state
    && a.cell.hex === b.cell.hex
    && a.flashing === b.flashing
    && a.sliceBoundary === b.sliceBoundary;
}

const GridCell = memo(function GridCell({
  cell, lane, col, sliceBoundary, flashing, onSelect,
}: GridCellProps) {
  return (
    <div
      role="button"
      tabIndex={cell.state === 'empty' ? -1 : 0}
      onClick={() => cell.state !== 'empty' && onSelect(lane, col)}
      title={`lane ${lane}, colonne ${col}${cell.hex ? ` — ${cell.hex}…` : ' — vide'}`}
      className={`rounded-[2px] transition-colors duration-150 ${STATE_CLASSES[cell.state]} ${
        sliceBoundary ? 'ml-[3px]' : ''
      } ${flashing ? 'animate-flash-fill ring-2 ring-rose-400' : ''} ${
        cell.state !== 'empty' ? 'cursor-pointer' : ''
      }`}
    />
  );
}, cellsEqual);

export function MemoryGrid({
  snapshot, p, q, segmentLength, flashSet, onSelectCell,
}: {
  snapshot: GridSnapshot;
  p: number;
  q: number;
  segmentLength: number;
  flashSet: Set<string>;
  onSelectCell: (lane: number, col: number) => void;
}) {
  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400">
        <Legend swatch="bg-slate-900/70 border border-slate-800/70" label="Vide" />
        <Legend swatch="bg-amber-400" label="En cours de calcul" />
        <Legend swatch="bg-violet-500" label="Bloc de référence lu" />
        <Legend swatch="bg-emerald-600/85" label="Rempli" />
        <span className="ml-auto font-mono text-slate-600">
          {p} lane{p > 1 ? 's' : ''} × {q} colonnes ({p * q} blocs de 1 Ko)
        </span>
      </div>

      <div
        className="grid min-h-0 flex-1 gap-[3px]"
        style={{
          gridTemplateRows: `repeat(${p}, minmax(0, 1fr))`,
          gridTemplateColumns: `repeat(${q}, minmax(0, 1fr))`,
        }}
      >
        {snapshot.cells.map((row, lane) => row.map((cell, col) => (
          <GridCell
            // eslint-disable-next-line react/no-array-index-key
            key={`${lane}-${col}`}
            cell={cell}
            lane={lane}
            col={col}
            sliceBoundary={col > 0 && col % segmentLength === 0}
            flashing={flashSet.has(`${lane}-${col}`)}
            onSelect={onSelectCell}
          />
        )))}
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-sm ${swatch}`} />
      {label}
    </span>
  );
}
