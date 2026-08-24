import React from 'react';
import { CELL_SIZE } from './constants';

type Props = {
  slices: string[];
  /** 1-based tile id, or null when the Eraser is active */
  selectedTile: number | null;
  onSelectTile: (tileId: number | null) => void;
};

const Palette: React.FC<Props> = ({ slices, selectedTile, onSelectTile }) => {
  return (
    <div className="flex flex-col h-full p-2 gap-2 overflow-y-auto">
      <button
        type="button"
        onClick={() => onSelectTile(null)}
        aria-label="Eraser"
        aria-pressed={selectedTile === null}
        className={`text-xs px-2 py-1 rounded border ${
          selectedTile === null
            ? 'border-ds-accent text-ds-accent bg-ds-accent-subtle'
            : 'border-ds-border text-ds-text-muted hover:text-ds-text'
        }`}
      >
        Eraser
      </button>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(auto-fill, ${CELL_SIZE}px)` }}>
        {slices.map((src, index) => {
          const tileId = index + 1;
          return (
            <button
              key={tileId}
              type="button"
              onClick={() => onSelectTile(tileId)}
              aria-label={`Tile ${tileId}`}
              title={`ID: ${tileId}`}
              aria-pressed={selectedTile === tileId}
              style={{ width: CELL_SIZE, height: CELL_SIZE }}
              className={`border ${
                selectedTile === tileId ? 'border-ds-accent' : 'border-ds-border hover:border-ds-text-muted'
              }`}
            >
              <img src={src} alt="" style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Palette;
