import React, { useEffect, useState } from 'react';
import { CELL_SIZE } from './constants';

type Props = {
  layerData: number[][];
  /** slices[i] is the thumbnail for tile id (i + 1) */
  slices: string[];
  onPaintCell: (row: number, col: number) => void;
};

const TileMapCanvas: React.FC<Props> = ({ layerData, slices, onPaintCell }) => {
  const [isPainting, setIsPainting] = useState(false);

  useEffect(() => {
    const stop = () => setIsPainting(false);
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, []);

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
              onMouseDown={() => { setIsPainting(true); onPaintCell(row, col); }}
              onMouseEnter={() => { if (isPainting) onPaintCell(row, col); }}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                border: '1px solid var(--ds-border)',
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
