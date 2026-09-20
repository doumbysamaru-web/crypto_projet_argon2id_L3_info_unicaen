import { memo } from 'react';
import type { Cell, GridSnapshot } from '../lib/gridSnapshot.ts';

const STATE_CLASSES: Record<Cell['state'], string> = {
  empty: 'bg-surface-2',
  computing: 'bg-warn',
  reference: 'bg-ref',
  filled: 'bg-signal',
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
      title={`lane ${lane} · colonne ${col}${cell.hex ? ` · ${cell.hex}…` : ''}`}
      className={`rounded-[3px] transition-colors duration-150 ${STATE_CLASSES[cell.state]} ${
        sliceBoundary ? 'ml-1' : ''
      } ${flashing ? 'animate-flash-fill' : ''} ${cell.state !== 'empty' ? 'cursor-pointer' : ''}`}
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
    <div className="flex h-full w-full flex-col gap-4">
      <div className="flex items-center gap-6 text-sm text-ink-muted">
        <Legend swatch="bg-surface-2" label="Vide" />
        <Legend swatch="bg-warn" label="Calcul" />
        <Legend swatch="bg-ref" label="Référence" />
        <Legend swatch="bg-signal" label="Rempli" />
        <span className="ml-auto font-mono">{p} × {q} blocs</span>
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
    <span className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-sm ${swatch}`} />
      {label}
    </span>
  );
}
