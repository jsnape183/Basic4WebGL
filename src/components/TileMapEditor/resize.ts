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
