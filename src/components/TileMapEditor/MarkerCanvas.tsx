import React from 'react';
import { CELL_SIZE } from './constants';
import { usePaintDrag } from './usePaintDrag';
import { tagColor } from './tagColor';
import { MarkerEntry } from './types';

type Props = {
  rows: number;
  cols: number;
  markers: MarkerEntry[];
  onPaintCell: (row: number, col: number) => void;
  /** When false, renders the same marker chips with no aria-label/role/mouse handlers — used for dimmed, non-active reference layers so their cells never collide with the active layer's "Row X, Column Y" labels. Defaults to true. */
  interactive?: boolean;
  /** Fires as the cursor moves over a cell, for a coordinate readout elsewhere in the editor. Only wired up when interactive. */
  onHoverCell?: (row: number, col: number) => void;
  /** Fires when the cursor leaves the grid entirely, to clear the readout. */
  onHoverEnd?: () => void;
};

const MarkerCanvas: React.FC<Props> = ({
  rows,
  cols,
  markers,
  onPaintCell,
  interactive = true,
  onHoverCell,
  onHoverEnd,
}) => {
  const { startPaint, continuePaint } = usePaintDrag(onPaintCell);

  const markerAt = (row: number, col: number) => markers.find((m) => m.row === row && m.col === col);

  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const marker = markerAt(row, col);
      cells.push(
        <div
          key={`${row}-${col}`}
          role={interactive ? 'gridcell' : undefined}
          aria-label={interactive ? `Row ${row}, Column ${col}` : undefined}
          title={marker?.tag}
          onMouseDown={interactive ? () => startPaint(row, col) : undefined}
          onMouseEnter={
            interactive
              ? () => {
                  continuePaint(row, col);
                  onHoverCell?.(row, col);
                }
              : undefined
          }
          className={`border border-ds-border flex items-center justify-center text-[10px] font-bold text-white ${interactive ? 'hover:ring-2 hover:ring-inset hover:ring-ds-accent' : ''}`}
          style={{
            width: CELL_SIZE,
            height: CELL_SIZE,
            backgroundColor: marker ? tagColor(marker.tag) : undefined,
          }}
        >
          {marker ? marker.tag.charAt(0).toUpperCase() : ''}
        </div>
      );
    }
  }

  return (
    <div
      role={interactive ? 'grid' : undefined}
      aria-label={interactive ? 'Marker canvas' : undefined}
      onMouseLeave={interactive ? onHoverEnd : undefined}
      style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)` }}
    >
      {cells}
    </div>
  );
};

export default MarkerCanvas;
