// Sums a handle's own local offset (set by ObjectTransform.setPosition) plus
// every ancestor's, up to but not including the world/hud container. A plain
// TileMap/TileMapLayer added directly to the world has no ancestor besides
// worldContainer, so this is identical to just reading handle.x/handle.y. A
// TileMapLayer nested inside a TileMapSet's wrapping container additionally
// picks up the set's own transform, so moving the whole set
// (tm.transform.setPosition) is correctly reflected for any of its layers.
// worldContainer/hudContainer's own position (camera pan) is deliberately
// excluded — every caller's contract has always been world space, not
// camera-relative screen space. Shared by tileAt, setTile, and markersByTag.
// A plain top-level function, not a method on _sbTilemaps -- tileAt and
// markersByTag are both called destructured in existing tests/usage
// (`const { tileAt } = ...`), which drops `this`, so a shared helper that
// needs calling from them can't rely on `this._worldOffset` the way
// tileAtInSet relies on `this.tileAt` (tileAtInSet is only ever called bound,
// `tilemap.tileAtInSet(...)`).
function _tilemapWorldOffset(handle) {
  let offsetX = 0;
  let offsetY = 0;
  let node = handle;
  while (node && node !== worldContainer && node !== hudContainer) {
    offsetX += node.x;
    offsetY += node.y;
    node = node.parent;
  }
  return { x: offsetX, y: offsetY };
}

const _sbTilemaps = {
  createTileMap(tilesetPath, tileW, tileH) {
    tileW = Number(tileW);
    tileH = Number(tileH);
    const frames = _sbAssets.getSlices(tilesetPath, tileW, tileH);
    const container = new PIXI.Container();
    container._tileW = tileW;
    container._tileH = tileH;
    container._frames = frames;
    container._map = [];
    container._tileSprites = [];
    return container;
  },

  loadTileMap(handle, jsonPath) {
    const data = _sbAssets.get(jsonPath);
    handle.removeChildren();
    handle._tileSprites = [];
    for (let row = 0; row < data.length; row++) {
      handle._tileSprites[row] = [];
      for (let col = 0; col < data[row].length; col++) {
        const id = data[row][col];
        if (!id) continue;
        if (id < 1 || id > handle._frames.length) continue;
        const sprite = new PIXI.Sprite(handle._frames[id - 1]);
        sprite.x = col * handle._tileW;
        sprite.y = row * handle._tileH;
        handle.addChild(sprite);
        handle._tileSprites[row][col] = sprite;
      }
    }
    handle._map = data;
  },

  tileAt(handle, worldX, worldY) {
    const offset = _tilemapWorldOffset(handle);
    const col = Math.floor((Number(worldX) - offset.x) / handle._tileW);
    const row = Math.floor((Number(worldY) - offset.y) / handle._tileH);
    if (row < 0 || row >= handle._map.length) return 0;
    if (col < 0 || col >= (handle._map[0]?.length ?? 0)) return 0;
    return handle._map[row][col] ?? 0;
  },

  // Swaps a single cell's tile art at runtime (e.g. a door changing
  // appearance once the player has a key) -- removes whatever sprite was at
  // that cell (whether painted at load time or by an earlier setTile call)
  // and, for a non-zero id, adds a fresh one in its place. handle._map is
  // updated to match, so a later tileAt on this same cell reflects the
  // change. Silently does nothing for a cell outside the map or an id
  // outside the tileset, same as tileAt's existing out-of-bounds contract.
  setTile(handle, worldX, worldY, tileId) {
    tileId = Number(tileId);
    const offset = _tilemapWorldOffset(handle);
    const col = Math.floor((Number(worldX) - offset.x) / handle._tileW);
    const row = Math.floor((Number(worldY) - offset.y) / handle._tileH);
    if (row < 0 || row >= handle._map.length) return;
    if (col < 0 || col >= (handle._map[0]?.length ?? 0)) return;

    if (!handle._tileSprites) handle._tileSprites = [];
    if (!handle._tileSprites[row]) handle._tileSprites[row] = [];
    const existing = handle._tileSprites[row][col];
    if (existing) {
      handle.removeChild(existing);
      handle._tileSprites[row][col] = undefined;
    }

    handle._map[row][col] = tileId;

    if (tileId >= 1 && tileId <= handle._frames.length) {
      const sprite = new PIXI.Sprite(handle._frames[tileId - 1]);
      sprite.x = col * handle._tileW;
      sprite.y = row * handle._tileH;
      handle.addChild(sprite);
      handle._tileSprites[row][col] = sprite;
    }
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
    const frames = _sbAssets.getSlices(data.tileImage, tileW, tileH);

    // One wrapping container holds every tile layer as a child, in file
    // order — this is the object handed back as TileMapSet's own `_handle`,
    // so it plugs into `world.add`/`world.remove` exactly like Sprite/TileMap
    // do (no auto-render at construction; the softBASIC caller decides when
    // and whether to add it, same as every other renderable).
    const handle = new PIXI.Container();
    const layerContainers = {};
    const markers = [];
    for (const name of Object.keys(data.layers)) {
      const layerValue = data.layers[name];
      if (!Array.isArray(layerValue)) {
        if (layerValue.type === 'collision') {
          // Collision layer: data-only, no tile art, no PIXI sprite
          // children -- but stored in `layerContainers` with a `_map` the
          // same shape a tile layer's is, so `pathfinding.setup()` can
          // treat it as a blocking layer with zero changes on that side.
          const container = new PIXI.Container();
          container._tileW = tileW;
          container._tileH = tileH;
          container._map = layerValue.data;
          // Distinguishes this from a tile-art layer (which also has a
          // _map) for collision.setupTileCollision, which merges every
          // collision-kind layer and must not also merge in tile art.
          container._isCollisionLayer = true;
          layerContainers[name] = container;
          continue;
        }
        // Marker layer: never rendered, no PIXI.Container child — just
        // accumulate its entries into the set-level marker list, which
        // markersByTag searches across every marker layer at once (not
        // scoped to one named layer).
        for (const m of layerValue.markers) {
          markers.push({ row: m.row, col: m.col, tag: m.tag });
        }
        continue;
      }
      const layerData = layerValue;
      const container = new PIXI.Container();
      container._tileW = tileW;
      container._tileH = tileH;
      container._frames = frames;
      container._map = layerData;
      container._tileSprites = [];
      for (let row = 0; row < layerData.length; row++) {
        container._tileSprites[row] = [];
        for (let col = 0; col < layerData[row].length; col++) {
          const id = layerData[row][col];
          if (!id) continue;
          if (id < 1 || id > frames.length) continue;
          const sprite = new PIXI.Sprite(frames[id - 1]);
          sprite.x = col * tileW;
          sprite.y = row * tileH;
          container.addChild(sprite);
          container._tileSprites[row][col] = sprite;
        }
      }
      layerContainers[name] = container;
      handle.addChild(container);
    }
    handle._layerContainers = layerContainers;
    handle._markers = markers;
    handle._tileW = tileW;
    handle._tileH = tileH;

    return handle;
  },

  getTileMapSetLayer(handle, name) {
    const layer = handle._layerContainers[name];
    if (!layer) {
      const available = Object.keys(handle._layerContainers).join(', ') || '(none)';
      throw Error(`TileMapSet: no layer named "${name}". Available layers: ${available}`);
    }
    return layer;
  },

  // Convenience method for `TileMapSet.tileAt(name, x, y)` — looks up the
  // named layer and delegates to the same `tileAt` used everywhere else, so
  // there is exactly one offset-accumulation implementation, not two.
  tileAtInSet(setHandle, name, worldX, worldY) {
    const layer = this.getTileMapSetLayer(setHandle, name);
    return this.tileAt(layer, worldX, worldY);
  },

  // Searches every marker layer in the set at once (markers aren't
  // partitioned by which named layer they came from — that's a level-
  // authoring organization detail, not a query dimension). Reuses the exact
  // same ancestor-offset-walking technique tileAt already uses, so if the
  // TileMapSet's own .transform moves the whole map, returned positions move
  // with it, matching tileAt's existing offset contract.
  markersByTag(setHandle, tag) {
    const offset = _tilemapWorldOffset(setHandle);
    const offsetX = offset.x;
    const offsetY = offset.y;
    const results = [];
    for (const m of setHandle._markers) {
      if (m.tag !== tag) continue;
      results.push({
        x: offsetX + m.col * setHandle._tileW + setHandle._tileW / 2,
        y: offsetY + m.row * setHandle._tileH + setHandle._tileH / 2,
      });
    }
    return results;
  },
};
