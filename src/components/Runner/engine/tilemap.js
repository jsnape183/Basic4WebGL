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

  createTileMapSet(stmPath) {
    // PIXI's asset loader recognizes `.json` and auto-parses it, but has no
    // parser registered for the custom `.stm` extension, so it loads as a raw
    // string instead of a parsed object — parse it ourselves.
    const raw = _sbAssets.get(stmPath);
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const tileW = Number(data.tileWidth);
    const tileH = Number(data.tileHeight);
    const base = _sbAssets.get(data.tileImage);
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

    const layers = {};
    for (const name of Object.keys(data.layers)) {
      const layerData = data.layers[name];
      const container = new PIXI.Container();
      container._tileW = tileW;
      container._tileH = tileH;
      container._frames = frames;
      container._map = layerData;
      for (let row = 0; row < layerData.length; row++) {
        for (let col = 0; col < layerData[row].length; col++) {
          const id = layerData[row][col];
          if (!id) continue;
          if (id < 1 || id > frames.length) continue;
          const sprite = new PIXI.Sprite(frames[id - 1]);
          sprite.x = col * tileW;
          sprite.y = row * tileH;
          container.addChild(sprite);
        }
      }
      layers[name] = container;
      // `this`, not a module-scoped `_sbStage` reference — calling sibling
      // module functions through `this` is required here, not a style choice:
      // `this` is `_sb` (the merged engine object) only when this function is
      // invoked as `_sb.createTileMapSet(...)`, and `addToWorld` reads/writes
      // `this._sbInstances`. A direct `_sbStage.addToWorld(...)` call would
      // bind `this` to the `_sbStage` module object instead, where
      // `_sbInstances` doesn't exist — this exact aliasing mistake was a real,
      // previously-shipped bug (see docs/roadmap.md known issue #16).
      this.addToWorld({ _handle: container });
    }

    return { _layers: layers };
  },

  getTileMapSetLayer(handle, name) {
    const layer = handle._layers[name];
    if (!layer) {
      const available = Object.keys(handle._layers).join(', ') || '(none)';
      throw Error(`TileMapSet: no layer named "${name}". Available layers: ${available}`);
    }
    return layer;
  },
};
