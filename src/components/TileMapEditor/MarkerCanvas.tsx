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
};

const MarkerCanvas: React.FC<Props> = ({ rows, cols, markers, onPaintCell }) => {
  const { startPaint, continuePaint } = usePaintDrag(onPaintCell);

  const markerAt = (row: number, col: number) => markers.find((m) => m.row === row && m.col === col);

  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const marker = markerAt(row, col);
      cells.push(
        <div
          key={`${row}-${col}`}
          role="gridcell"
          aria-label={`Row ${row}, Column ${col}`}
          title={marker?.tag}
          onMouseDown={() => startPaint(row, col)}
          onMouseEnter={() => continuePaint(row, col)}
          className="border border-ds-border hover:ring-2 hover:ring-inset hover:ring-ds-accent flex items-center justify-center text-[10px] font-bold text-white"
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
    <div className="h-full overflow-auto p-2">
      <div role="grid" aria-label="Marker canvas" style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)` }}>
        {cells}
      </div>
    </div>
  );
};

export default MarkerCanvas;
