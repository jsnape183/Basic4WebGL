function _pathfindingCreateMinHeap() {
  const items = [];

  function push(key, f) {
    items.push({ key, f });
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (items[parent].f <= items[i].f) break;
      const tmp = items[parent];
      items[parent] = items[i];
      items[i] = tmp;
      i = parent;
    }
  }

  function pop() {
    const top = items[0];
    const last = items.pop();
    if (items.length > 0) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const left = i * 2 + 1;
        const right = i * 2 + 2;
        let smallest = i;
        if (left < items.length && items[left].f < items[smallest].f) smallest = left;
        if (right < items.length && items[right].f < items[smallest].f) smallest = right;
        if (smallest === i) break;
        const tmp = items[smallest];
        items[smallest] = items[i];
        items[i] = tmp;
        i = smallest;
      }
    }
    return top.key;
  }

  return { size: () => items.length, push, pop };
}

function _pathfindingOctileDistance(r1, c1, r2, c2) {
  const dr = Math.abs(r1 - r2);
  const dc = Math.abs(c1 - c2);
  return Math.max(dr, dc) + (Math.SQRT2 - 1) * Math.min(dr, dc);
}

const _sbPathfinding = {
  _navGrid: null,
  _navState: new Map(),
  _recomputeInterval: 200,

  setupNavGrid(tileMapSetObj, blockingLayerNames) {
    if (!tileMapSetObj || !tileMapSetObj._handle) {
      throw new Error('pathfinding.setup: expected a TileMapSet instance');
    }
    const layerContainers = tileMapSetObj._handle._layerContainers || {};

    const flaggedLayers = [];
    for (let i = 0; i < blockingLayerNames.length; i++) {
      const name = blockingLayerNames[i];
      const layer = layerContainers[name];
      if (!layer) {
        const available = Object.keys(layerContainers).join(', ') || '(none)';
        throw new Error(`pathfinding.setup: no layer named "${name}". Available layers: ${available}`);
      }
      flaggedLayers.push(layer);
    }

    const reference = Object.values(layerContainers)[0];
    if (!reference) {
      throw new Error('pathfinding.setup: TileMapSet has no layers');
    }

    const rows = reference._map.length;
    const cols = reference._map[0] ? reference._map[0].length : 0;
    const blocked = new Uint8Array(rows * cols);

    for (const layer of flaggedLayers) {
      for (let row = 0; row < rows; row++) {
        const layerRow = layer._map[row];
        if (!layerRow) continue;
        for (let col = 0; col < cols; col++) {
          if (layerRow[col]) blocked[row * cols + col] = 1;
        }
      }
    }

    this._navGrid = {
      blocked,
      rows,
      cols,
      tileW: reference._tileW,
      tileH: reference._tileH,
      reference,
    };
    this._navState.clear();
  },

  _isBlocked(row, col) {
    const grid = this._navGrid;
    if (row < 0 || row >= grid.rows || col < 0 || col >= grid.cols) return true;
    return grid.blocked[row * grid.cols + col] === 1;
  },

  _gridOffset() {
    let offsetX = 0;
    let offsetY = 0;
    let node = this._navGrid.reference;
    while (node && node !== worldContainer && node !== hudContainer) {
      offsetX += node.x;
      offsetY += node.y;
      node = node.parent;
    }
    return { offsetX, offsetY };
  },

  _worldToCell(worldX, worldY) {
    const grid = this._navGrid;
    const { offsetX, offsetY } = this._gridOffset();
    const col = Math.floor((Number(worldX) - offsetX) / grid.tileW);
    const row = Math.floor((Number(worldY) - offsetY) / grid.tileH);
    return { row, col };
  },

  _cellCenterWorld(row, col) {
    const grid = this._navGrid;
    const { offsetX, offsetY } = this._gridOffset();
    return {
      x: offsetX + col * grid.tileW + grid.tileW / 2,
      y: offsetY + row * grid.tileH + grid.tileH / 2,
    };
  },

  _nearestWalkable(row, col) {
    const grid = this._navGrid;
    if (!this._isBlocked(row, col)) return { row, col };
    const maxRadius = Math.max(grid.rows, grid.cols);
    for (let radius = 1; radius <= maxRadius; radius++) {
      // Top and bottom edges of the ring (full width, includes corners).
      for (const dr of [-radius, radius]) {
        const r = row + dr;
        if (r < 0 || r >= grid.rows) continue;
        for (let dc = -radius; dc <= radius; dc++) {
          const c = col + dc;
          if (c < 0 || c >= grid.cols) continue;
          if (!this._isBlocked(r, c)) return { row: r, col: c };
        }
      }
      // Left and right edges of the ring, excluding corners already visited above.
      for (const dc of [-radius, radius]) {
        const c = col + dc;
        if (c < 0 || c >= grid.cols) continue;
        for (let dr = -radius + 1; dr <= radius - 1; dr++) {
          const r = row + dr;
          if (r < 0 || r >= grid.rows) continue;
          if (!this._isBlocked(r, c)) return { row: r, col: c };
        }
      }
    }
    return null;
  },

  _resolveTargetCell(worldX, worldY) {
    const cell = this._worldToCell(worldX, worldY);
    if (!this._isBlocked(cell.row, cell.col)) return cell;
    return this._nearestWalkable(cell.row, cell.col);
  },

  _findPath(startRow, startCol, goalRow, goalCol) {
    if (this._isBlocked(goalRow, goalCol)) return null;
    if (startRow === goalRow && startCol === goalCol) return [];

    const cols = this._navGrid.cols;
    const key = (r, c) => r * cols + c;
    const goalKey = key(goalRow, goalCol);
    const startKey = key(startRow, startCol);

    const open = _pathfindingCreateMinHeap();
    const gScore = new Map([[startKey, 0]]);
    const cameFrom = new Map();
    const visited = new Set();
    open.push(startKey, _pathfindingOctileDistance(startRow, startCol, goalRow, goalCol));

    const neighbors = [
      [-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1],
      [-1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [1, 1, Math.SQRT2],
    ];

    while (open.size() > 0) {
      const currentKey = open.pop();
      if (visited.has(currentKey)) continue;
      visited.add(currentKey);
      if (currentKey === goalKey) {
        return this._reconstructPath(cameFrom, currentKey, cols);
      }

      const row = Math.floor(currentKey / cols);
      const col = currentKey % cols;

      for (const [dr, dc, cost] of neighbors) {
        const nr = row + dr;
        const nc = col + dc;
        if (this._isBlocked(nr, nc)) continue;
        if (dr !== 0 && dc !== 0 && (this._isBlocked(row + dr, col) || this._isBlocked(row, col + dc))) {
          continue;
        }
        const nKey = key(nr, nc);
        const tentativeG = gScore.get(currentKey) + cost;
        if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
          gScore.set(nKey, tentativeG);
          cameFrom.set(nKey, currentKey);
          open.push(nKey, tentativeG + _pathfindingOctileDistance(nr, nc, goalRow, goalCol));
        }
      }
    }
    return null;
  },

  _reconstructPath(cameFrom, currentKey, cols) {
    const path = [];
    let k = currentKey;
    while (cameFrom.has(k)) {
      path.push({ row: Math.floor(k / cols), col: k % cols });
      k = cameFrom.get(k);
    }
    path.reverse();
    return path;
  },
};
