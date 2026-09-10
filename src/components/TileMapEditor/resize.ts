import { StmDoc } from './types';

/**
 * Reshape a dense grid to `rows` x `cols`. Existing values are kept where their
 * row and column still fit (top-left anchored); every new cell is `0`.
 */
export function resizeGrid(data: number[][], rows: number, cols: number): number[][] {
  const out: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const srcRow = data[r] ?? [];
    const row: number[] = [];
    for (let c = 0; c < cols; c++) row.push(srcRow[c] ?? 0);
    out.push(row);
  }
  return out;
}

/**
 * Reshape every layer of a doc to the new grid size. Tile and collision layers
 * go through `resizeGrid`; marker layers drop any marker whose row or column
 * now falls outside the grid. All other fields (tags, tile size, image, layer
 * identity) are carried through unchanged. The input doc is not mutated.
 */
export function resizeStmDoc(doc: StmDoc, rows: number, cols: number): StmDoc {
  return {
    ...doc,
    layers: doc.layers.map((l) => {
      if (l.kind === 'tile') return { ...l, data: resizeGrid(l.data, rows, cols) };
      if (l.kind === 'collision') return { ...l, data: resizeGrid(l.data, rows, cols) };
      return { ...l, markers: l.markers.filter((m) => m.row < rows && m.col < cols) };
    }),
  };
}

export type ResizeLoss = { tiles: number; collisionCells: number; markers: number };

/**
 * Count what resizing to `rows` x `cols` would permanently discard: non-zero
 * tiles, non-zero collision cells, and markers whose row/col is now outside the
 * grid. Growing (or keeping) both dimensions always returns all zeros.
 */
export function describeResizeLoss(doc: StmDoc, rows: number, cols: number): ResizeLoss {
  const loss: ResizeLoss = { tiles: 0, collisionCells: 0, markers: 0 };
  for (const l of doc.layers) {
    if (l.kind === 'marker') {
      loss.markers += l.markers.filter((m) => m.row >= rows || m.col >= cols).length;
      continue;
    }
    for (let r = 0; r < l.data.length; r++) {
      const dataRow = l.data[r] ?? [];
      for (let c = 0; c < dataRow.length; c++) {
        if ((r >= rows || c >= cols) && dataRow[c] !== 0) {
          if (l.kind === 'tile') loss.tiles += 1;
          else loss.collisionCells += 1;
        }
      }
    }
  }
  return loss;
}
