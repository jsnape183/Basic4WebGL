import React from 'react';
import { CELL_SIZE } from './constants';
import { usePaintDrag } from './usePaintDrag';

type Props = {
  layerData: number[][];
  /** slices[i] is the thumbnail for tile id (i + 1) */
  slices: string[];
  onPaintCell: (row: number, col: number) => void;
};

const TileMapCanvas: React.FC<Props> = ({ layerData, slices, onPaintCell }) => {
  const { startPaint, continuePaint } = usePaintDrag(onPaintCell);
  const cols = layerData[0]?.length ?? 0;

  return (
    <div className="h-full overflow-auto p-2">
      <div
        role="grid"
        aria-label="Tilemap canvas"
        style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)` }}
      >
        {layerData.map((rowData, row) =>
          rowData.map((tileId, col) => (
            <div
              key={`${row}-${col}`}
              role="gridcell"
              aria-label={`Row ${row}, Column ${col}`}
              onMouseDown={() => startPaint(row, col)}
              onMouseEnter={() => continuePaint(row, col)}
              className="border border-ds-border hover:ring-2 hover:ring-inset hover:ring-ds-accent"
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
    </div>
  );
};

export default TileMapCanvas;
