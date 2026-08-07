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
};
