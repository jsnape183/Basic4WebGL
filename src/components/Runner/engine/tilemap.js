const _sbTilemaps = {
  createTileMap(tilesetPath, tileW, tileH) {
    tileW = Number(tileW);
    tileH = Number(tileH);
    const base = _sbAssets.get(tilesetPath);
    const cols = Math.floor(base.width / tileW);
    const rows = Math.floor(base.height / tileH);
    const frames = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        frames.push(
          new PIXI.Texture({
            source: base.source,
            frame: new PIXI.Rectangle(c * tileW, r * tileH, tileW, tileH),
          })
        );
      }
    }
    const container = new PIXI.Container();
    container._tileW = tileW;
    container._tileH = tileH;
    container._frames = frames;
    container._map = [];
    return container;
  },

  loadTileMap(handle, jsonPath) {
    const data = _sbAssets.get(jsonPath);
    handle.removeChildren();
    for (let row = 0; row < data.length; row++) {
      for (let col = 0; col < data[row].length; col++) {
        const id = data[row][col];
        if (!id) continue;
        if (id < 1 || id > handle._frames.length) continue;
        const sprite = new PIXI.Sprite(handle._frames[id - 1]);
        sprite.x = col * handle._tileW;
        sprite.y = row * handle._tileH;
        handle.addChild(sprite);
      }
    }
    handle._map = data;
  },

  tileAt(handle, worldX, worldY) {
    // handle.x / handle.y reflect the scroll offset applied by ObjectTransform.setPosition
    const col = Math.floor((Number(worldX) - handle.x) / handle._tileW);
    const row = Math.floor((Number(worldY) - handle.y) / handle._tileH);
    if (row < 0 || row >= handle._map.length) return 0;
    if (col < 0 || col >= (handle._map[0]?.length ?? 0)) return 0;
    return handle._map[row][col] ?? 0;
  },

  tileMapWidthPx(handle) {
    return (handle._map[0]?.length ?? 0) * handle._tileW;
  },

  tileMapHeightPx(handle) {
    return handle._map.length * handle._tileH;
  },
};
