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
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          if (Math.max(Math.abs(dr), Math.abs(dc)) !== radius) continue;
          const r = row + dr;
          const c = col + dc;
          if (r < 0 || r >= grid.rows || c < 0 || c >= grid.cols) continue;
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
};
