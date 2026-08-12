import React from 'react';
import { CELL_SIZE } from './constants';
import { usePaintDrag } from './usePaintDrag';

type Props = {
  rows: number;
  cols: number;
  data: number[][];
  onPaintCell: (row: number, col: number) => void;
  /** When false, renders the same solid/not-solid fill with no aria-label/role/mouse handlers — used for dimmed, non-active reference layers so their cells never collide with the active layer's "Row X, Column Y" labels. Defaults to true. */
  interactive?: boolean;
};

const CollisionCanvas: React.FC<Props> = ({ rows, cols, data, onPaintCell, interactive = true }) => {
  const { startPaint, continuePaint } = usePaintDrag(onPaintCell);

  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Optional chaining: a data grid smaller than rows/cols (shouldn't normally
      // happen) renders as "not solid" rather than crashing, matching this file's
      // siblings' general leniency about malformed input shape.
      const isSolid = Boolean(data[row]?.[col]);
      cells.push(
        <div
          key={`${row}-${col}`}
          role={interactive ? 'gridcell' : undefined}
          aria-label={interactive ? `Row ${row}, Column ${col}` : undefined}
          onMouseDown={interactive ? () => startPaint(row, col) : undefined}
          onMouseEnter={interactive ? () => continuePaint(row, col) : undefined}
          // ds-error's red/pink reads well as "this blocks movement" (a standard
          // collision-visualization convention), even though it's not an error state.
          className={`border border-ds-border ${interactive ? 'hover:ring-2 hover:ring-inset hover:ring-ds-accent' : ''} ${isSolid ? 'bg-ds-error/70' : ''}`}
          style={{ width: CELL_SIZE, height: CELL_SIZE }}
        />
      );
    }
  }

  return (
    <div
      role={interactive ? 'grid' : undefined}
      aria-label={interactive ? 'Collision canvas' : undefined}
      style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)` }}
    >
      {cells}
    </div>
  );
};

export default CollisionCanvas;
