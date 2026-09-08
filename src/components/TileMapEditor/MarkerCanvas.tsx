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
  /** When true, clicking a cell selects it (via onSelectCell) instead of painting/erasing it. */
  selectMode?: boolean;
  /** The currently selected cell, highlighted with a ring. */
  selectedCell?: { row: number; col: number } | null;
  /** Fires when a cell is clicked while selectMode is on. */
  onSelectCell?: (row: number, col: number) => void;
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
  selectMode = false,
  selectedCell = null,
  onSelectCell,
  onHoverCell,
  onHoverEnd,
}) => {
  const { startPaint, continuePaint } = usePaintDrag(onPaintCell);

  // A cell can carry more than one tag — each is its own MarkerEntry sharing
  // the same row/col. Collect them all so multi-tag cells render truthfully.
  const tagsAt = (row: number, col: number) =>
    markers.filter((m) => m.row === row && m.col === col).map((m) => m.tag);

  const cursorClass = interactive ? (selectMode ? 'cursor-pointer' : 'cursor-crosshair') : '';

  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cellTags = tagsAt(row, col);
      const isSelected = !!selectedCell && selectedCell.row === row && selectedCell.col === col;
      cells.push(
        <div
          key={`${row}-${col}`}
          role={interactive ? 'gridcell' : undefined}
          aria-label={interactive ? `Row ${row}, Column ${col}` : undefined}
          aria-selected={interactive && selectMode ? isSelected : undefined}
          title={cellTags.join(', ') || undefined}
          onMouseDown={
            interactive
              ? () => (selectMode ? onSelectCell?.(row, col) : startPaint(row, col))
              : undefined
          }
          onMouseEnter={
            interactive
              ? () => {
                  if (!selectMode) continuePaint(row, col);
                  onHoverCell?.(row, col);
                }
              : undefined
          }
          className={`relative border border-ds-border flex items-center justify-center text-[10px] font-bold text-white ${cursorClass} ${interactive ? 'hover:ring-2 hover:ring-inset hover:ring-ds-accent' : ''} ${isSelected ? 'ring-2 ring-inset ring-ds-accent' : ''}`}
          style={{
            width: CELL_SIZE,
            height: CELL_SIZE,
            backgroundColor: cellTags.length ? tagColor(cellTags[0]) : undefined,
          }}
        >
          {cellTags.length ? cellTags[0].charAt(0).toUpperCase() : ''}
          {cellTags.length > 1 && (
            <span className="absolute bottom-0 right-0.5 text-[8px] leading-none opacity-90">
              +{cellTags.length - 1}
            </span>
          )}
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
