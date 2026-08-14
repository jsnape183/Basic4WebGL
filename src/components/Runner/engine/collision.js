const _sbCollision = (() => {
  function _slabTest(ox, oy, dx, dy, b, maxDist) {
    const left = b.x;
    const right = b.x + b.width;
    const top = b.y;
    const bottom = b.y + b.height;

    let tMin = 0;
    let tMax = maxDist;

    if (Math.abs(dx) < 1e-10) {
      if (ox < left || ox > right) return null;
    } else {
      const tx1 = (left - ox) / dx;
      const tx2 = (right - ox) / dx;
      tMin = Math.max(tMin, Math.min(tx1, tx2));
      tMax = Math.min(tMax, Math.max(tx1, tx2));
    }

    if (Math.abs(dy) < 1e-10) {
      if (oy < top || oy > bottom) return null;
    } else {
      const ty1 = (top - oy) / dy;
      const ty2 = (bottom - oy) / dy;
      tMin = Math.max(tMin, Math.min(ty1, ty2));
      tMax = Math.min(tMax, Math.max(ty1, ty2));
    }

    return tMin <= tMax ? tMin : null;
  }

  return {
    spriteCollide(a, b) {
      if (!a || !a._handle || !b || !b._handle) return false;
      const ab = a._handle.getBounds();
      const bb = b._handle.getBounds();
      return (
        ab.x + ab.width > bb.x &&
        ab.x < bb.x + bb.width &&
        ab.y + ab.height > bb.y &&
        ab.y < bb.y + bb.height
      );
    },

    boxCollide(x1, y1, w1, h1, x2, y2, w2, h2) {
      const l1 = Number(x1) - Number(w1) / 2;
      const r1 = Number(x1) + Number(w1) / 2;
      const t1 = Number(y1) - Number(h1) / 2;
      const b1 = Number(y1) + Number(h1) / 2;
      const l2 = Number(x2) - Number(w2) / 2;
      const r2 = Number(x2) + Number(w2) / 2;
      const t2 = Number(y2) - Number(h2) / 2;
      const b2 = Number(y2) + Number(h2) / 2;
      return !(r1 < l2 || l1 > r2 || b1 < t2 || t1 > b2);
    },

    circleCollide(a, rA, b, rB) {
      if (!a || !a._handle || !b || !b._handle) return false;
      const ax = a._handle.position.x;
      const ay = a._handle.position.y;
      const bx = b._handle.position.x;
      const by = b._handle.position.y;
      const dx = ax - bx;
      const dy = ay - by;
      return Math.sqrt(dx * dx + dy * dy) < (Number(rA) + Number(rB));
    },

    pointInBox(x, y, sprite) {
      if (!sprite || !sprite._handle) return false;
      const b = sprite._handle.getBounds();
      return (
        Number(x) >= b.x &&
        Number(x) <= b.x + b.width &&
        Number(y) >= b.y &&
        Number(y) <= b.y + b.height
      );
    },

    raycast(x, y, angle, dist, sprites) {
      const ox = Number(x);
      const oy = Number(y);
      const rad = Number(angle) * Math.PI / 180;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);
      const maxDist = Number(dist);

      let nearest = null;
      let nearestT = Infinity;

      for (let i = 0; i < sprites.length; i++) {
        const sprite = sprites[i];
        if (!sprite || !sprite._handle) continue;
        const b = sprite._handle.getBounds();
        const t = _slabTest(ox, oy, dx, dy, b, maxDist);
        if (t !== null && t < nearestT) {
          nearestT = t;
          nearest = sprite;
        }
      }

      return nearest !== null ? nearest : false;
    },

    raycastAll(x, y, angle, dist, sprites) {
      const ox = Number(x);
      const oy = Number(y);
      const rad = Number(angle) * Math.PI / 180;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);
      const maxDist = Number(dist);

      const hits = [];

      for (let i = 0; i < sprites.length; i++) {
        const sprite = sprites[i];
        if (!sprite || !sprite._handle) continue;
        const b = sprite._handle.getBounds();
        const t = _slabTest(ox, oy, dx, dy, b, maxDist);
        if (t !== null) {
          hits.push({ sprite, distance: t });
        }
      }

      hits.sort((a, b) => a.distance - b.distance);
      return hits;
    },

    _tileCollisionGrid: null,

    // Merges every `'collision'`-kind layer in the given TileMapSet into one
    // solid-cell grid (OR'd — a cell is solid if ANY collision layer marks
    // it solid). Implicit and unnamed by design: a collision layer's only
    // purpose is being collision data, so there's nothing to disambiguate
    // (see docs/superpowers/specs/2026-08-12-kinematic-tile-collision-design.md).
    setupTileCollision(tileMapSetObj) {
      if (!tileMapSetObj || !tileMapSetObj._handle) {
        throw new Error('collision.setupTileCollision: expected a TileMapSet instance');
      }
      const handle = tileMapSetObj._handle;
      const layerContainers = handle._layerContainers || {};
      const collisionLayers = Object.values(layerContainers).filter((l) => l._isCollisionLayer);
      if (collisionLayers.length === 0) {
        throw new Error('collision.setupTileCollision: TileMapSet has no collision layer');
      }

      const first = collisionLayers[0];
      const rows = first._map.length;
      const cols = first._map[0] ? first._map[0].length : 0;
      const solid = new Uint8Array(rows * cols);

      for (const layer of collisionLayers) {
        for (let row = 0; row < rows; row++) {
          const layerRow = layer._map[row];
          if (!layerRow) continue;
          for (let col = 0; col < cols; col++) {
            if (layerRow[col]) solid[row * cols + col] = 1;
          }
        }
      }

      this._tileCollisionGrid = {
        solid,
        rows,
        cols,
        tileW: first._tileW,
        tileH: first._tileH,
        // The TileMapSet's own wrapping container, not a per-layer
        // container: collision layers are never added to the scene graph
        // (no tile art to render), so a per-layer container's .parent walk
        // would stop dead at null. Every layer shares this same effective
        // world position, so this is correct for all of them, not just a
        // fallback. See this plan's header note for the full reasoning.
        reference: handle,
      };
    },

    _tileCollisionReset() {
      this._tileCollisionGrid = null;
    },

    _isSolidCell(grid, row, col) {
      if (row < 0 || row >= grid.rows || col < 0 || col >= grid.cols) return false;
      return grid.solid[row * grid.cols + col] === 1;
    },
  };
})();
