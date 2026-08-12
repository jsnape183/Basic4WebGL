import React from 'react';
import { CELL_SIZE } from './constants';
import { usePaintDrag } from './usePaintDrag';

type Props = {
  layerData: number[][];
  /** slices[i] is the thumbnail for tile id (i + 1) */
  slices: string[];
  onPaintCell: (row: number, col: number) => void;
  /** When false, renders the same tile art with no aria-label/role/mouse handlers — used for dimmed, non-active reference layers so their cells never collide with the active layer's "Row X, Column Y" labels. Defaults to true. */
  interactive?: boolean;
};

const TileMapCanvas: React.FC<Props> = ({ layerData, slices, onPaintCell, interactive = true }) => {
  const { startPaint, continuePaint } = usePaintDrag(onPaintCell);
  const cols = layerData[0]?.length ?? 0;

  return (
    <div
      role="grid"
      aria-label="Tilemap canvas"
      style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)` }}
    >
      {layerData.map((rowData, row) =>
        rowData.map((tileId, col) => (
          <div
            key={`${row}-${col}`}
            role={interactive ? 'gridcell' : undefined}
            aria-label={interactive ? `Row ${row}, Column ${col}` : undefined}
            onMouseDown={interactive ? () => startPaint(row, col) : undefined}
            onMouseEnter={interactive ? () => continuePaint(row, col) : undefined}
            className={`border border-ds-border ${interactive ? 'hover:ring-2 hover:ring-inset hover:ring-ds-accent' : ''}`}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundImage: tileId > 0 && slices[tileId - 1] ? `url(${slices[tileId - 1]})` : undefined,
              backgroundSize: 'cover',
            }}
          />
        ))
      )}
    </div>
  );
};

export default TileMapCanvas;
