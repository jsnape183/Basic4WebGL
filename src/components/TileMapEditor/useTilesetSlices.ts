// src/components/TileMapEditor/useTilesetSlices.ts
import { useEffect, useState } from 'react';

export type TilesetSlices = {
  /** Data URLs, one per tile, row-major order. slices[i] corresponds to tile id (i + 1). */
  slices: string[];
  cols: number;
  rows: number;
  loading: boolean;
};

export function useTilesetSlices(
  imageContent: string | undefined,
  tileWidth: number,
  tileHeight: number
): TilesetSlices {
  const [state, setState] = useState<TilesetSlices>({ slices: [], cols: 0, rows: 0, loading: true });

  useEffect(() => {
    if (!imageContent || tileWidth <= 0 || tileHeight <= 0) {
      setState({ slices: [], cols: 0, rows: 0, loading: false });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const cols = Math.floor(img.width / tileWidth);
      const rows = Math.floor(img.height / tileHeight);
      const canvas = document.createElement('canvas');
      canvas.width = tileWidth;
      canvas.height = tileHeight;
      const ctx = canvas.getContext('2d');
      const slices: string[] = [];
      if (ctx) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            ctx.clearRect(0, 0, tileWidth, tileHeight);
            ctx.drawImage(
              img,
              c * tileWidth, r * tileHeight, tileWidth, tileHeight,
              0, 0, tileWidth, tileHeight
            );
            slices.push(canvas.toDataURL());
          }
        }
      }
      setState({ slices, cols, rows, loading: false });
    };
    img.onerror = () => {
      if (!cancelled) setState({ slices: [], cols: 0, rows: 0, loading: false });
    };
    img.src = imageContent;

    return () => { cancelled = true; };
  }, [imageContent, tileWidth, tileHeight]);

  return state;
}
