import { useEffect, useState } from 'react';

/** Shared drag-paint interaction for a grid of clickable cells: mouse-down
 * starts painting (and paints the cell under the cursor immediately),
 * mouse-enter continues painting while the button is held, and a window
 * `mouseup` stops it — even if the cursor has left the grid entirely. Used
 * by both the tile Canvas and the marker Canvas so this state machine isn't
 * duplicated between them. */
export function usePaintDrag(onPaintCell: (row: number, col: number) => void) {
  const [isPainting, setIsPainting] = useState(false);

  useEffect(() => {
    const stop = () => setIsPainting(false);
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, []);

  const startPaint = (row: number, col: number) => {
    setIsPainting(true);
    onPaintCell(row, col);
  };

  const continuePaint = (row: number, col: number) => {
    if (isPainting) onPaintCell(row, col);
  };

  return { startPaint, continuePaint };
}
