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

    _tileGridOffset(reference) {
      let offsetX = 0;
      let offsetY = 0;
      let node = reference;
      while (node && node !== worldContainer && node !== hudContainer) {
        offsetX += node.x;
        offsetY += node.y;
        node = node.parent;
      }
      return { offsetX, offsetY };
    },

    // Moves an AABB by `delta` along one axis, clipping to the boundary of
    // the first solid tile it would otherwise cross. `axis` is 'x' or 'y'.
    // Scans every row (for 'x') or column (for 'y') the AABB's *other* axis
    // spans, so a sprite taller/wider than one tile is still checked fully.
    // Also scans every tile the AABB's *leading edge* sweeps through along
    // the movement axis itself (not just the single tile it lands in) --
    // otherwise a fast-moving sprite (delta spanning more than one tile in a
    // frame) can tunnel through a solid tile that its final position
    // happens to clear. The nearest solid tile to the sprite's starting
    // position wins, since that's the first one actually reached.
    // Small backward nudge applied to the scan's *starting* edge before
    // flooring it into a tile index. Without this, a leading edge resting
    // EXACTLY on a tile boundary (e.g. right after being clipped there the
    // previous frame) floors into the tile AHEAD rather than the tile it's
    // flush against, so the scan starts one tile too far ahead and skips
    // re-checking the solid tile the sprite is still pushing into -- letting
    // it tunnel in a little further every subsequent frame. Small enough to
    // never matter for any real sprite/tile size in this engine, large
    // enough to clear floating-point rounding noise.
    _resolveAxis(grid, bounds, delta, axis) {
      const TILE_EPSILON = 0.01;
      if (delta === 0) return { delta: 0, blocked: false };
      const { offsetX, offsetY } = this._tileGridOffset(grid.reference);
      const { tileW, tileH } = grid;
      const dir = delta > 0 ? 1 : -1;

      if (axis === 'x') {
        const frontBefore = delta > 0 ? bounds.x + bounds.width : bounds.x;
        const frontAfter = frontBefore + delta;
        const startCol = Math.floor((frontBefore - dir * TILE_EPSILON - offsetX) / tileW);
        const endCol = Math.floor((frontAfter - offsetX) / tileW);
        const topRow = Math.floor((bounds.y - offsetY) / tileH);
        const bottomRow = Math.floor((bounds.y + bounds.height - 1 - offsetY) / tileH);
        for (let col = startCol + dir; dir > 0 ? col <= endCol : col >= endCol; col += dir) {
          for (let row = topRow; row <= bottomRow; row++) {
            if (this._isSolidCell(grid, row, col)) {
              const boundary = delta > 0
                ? offsetX + col * tileW - bounds.width
                : offsetX + (col + 1) * tileW;
              return { delta: boundary - bounds.x, blocked: true };
            }
          }
        }
        return { delta, blocked: false };
      }

      // axis === 'y'
      const frontBefore = delta > 0 ? bounds.y + bounds.height : bounds.y;
      const frontAfter = frontBefore + delta;
      const startRow = Math.floor((frontBefore - dir * TILE_EPSILON - offsetY) / tileH);
      const endRow = Math.floor((frontAfter - offsetY) / tileH);
      const leftCol = Math.floor((bounds.x - offsetX) / tileW);
      const rightCol = Math.floor((bounds.x + bounds.width - 1 - offsetX) / tileW);
      for (let row = startRow + dir; dir > 0 ? row <= endRow : row >= endRow; row += dir) {
        for (let col = leftCol; col <= rightCol; col++) {
          if (this._isSolidCell(grid, row, col)) {
            const boundary = delta > 0
              ? offsetY + row * tileH - bounds.height
              : offsetY + (row + 1) * tileH;
            return { delta: boundary - bounds.y, blocked: true };
          }
        }
      }
      return { delta, blocked: false };
    },

    // A stable, axis-aligned bounding box in the SAME coordinate space as
    // handle.position and the tile grid (grid.tileW/tileH, offsets from
    // _tileGridOffset) -- i.e. local/world space, unscaled by any ancestor
    // container transform and unrotated by the sprite's own angle.
    //
    // getBounds() cannot be used here: it returns bounds in GLOBAL stage
    // space, inflated by (a) ancestor scaling -- e.g. camera.setZoom()
    // scales worldContainer directly -- and (b) the sprite's own rotation,
    // since a rotated rectangle's axis-aligned bounding box is larger than
    // the unrotated shape (up to sqrt(2) wider/taller at 45 degrees). A
    // sprite that both rotates (e.g. aiming at the mouse) and lives under a
    // zoomed camera -- both real, common cases -- produces bounds wildly
    // mismatched against the grid's plain coordinate space, breaking
    // collision resolution entirely. handle.width/height, in contrast, are
    // PIXI's local size in the PARENT's coordinate space: stable across
    // rotation, unaffected by ancestor transforms -- exactly what's needed.
    //
    // Zoom and rotation are not the only ways this broke: plain camera
    // panning/following (cameraFollow/cameraSetPosition), at ANY zoom
    // (including 1) and with NO rotation, was equally broken by the same
    // mismatch. Those calls translate worldContainer.position directly, and
    // that translation is baked into getBounds()'s global result -- but
    // _tileGridOffset's local-only offset walk explicitly stops at
    // worldContainer, so it never sees that translation. Any tile-collision
    // game using cameraFollow (e.g. any side-scroller keeping the camera on
    // the player) had broken collision resolution too, not just the
    // rotate+zoom combination that first surfaced the bug. _localAabb fixes
    // this case as well, since it never reads any ancestor transform at all.
    _localAabb(handle) {
      const w = handle.width;
      const h = handle.height;
      const ax = handle.anchor ? handle.anchor.x : 0;
      const ay = handle.anchor ? handle.anchor.y : 0;
      return {
        x: handle.position.x - ax * w,
        y: handle.position.y - ay * h,
        width: w,
        height: h,
      };
    },

    // Applies a sprite's stored velocity for one frame, resolving against
    // the active tile-collision grid (if any). Called once per instance per
    // frame from lifecycle.js, immediately after the instance's own
    // onupdate — see that file for the call site.
    _applyKinematics(handle, delta) {
      const vx = handle._sbVelocityX || 0;
      const vy = handle._sbVelocityY || 0;
      if (vx === 0 && vy === 0) return;

      const dt = delta / 1000;
      const dx = vx * dt;
      const dy = vy * dt;

      handle._sbBlockedLeft = false;
      handle._sbBlockedRight = false;
      handle._sbBlockedUp = false;
      handle._sbBlockedDown = false;

      const grid = this._tileCollisionGrid;
      if (!grid) {
        handle.position.x += dx;
        handle.position.y += dy;
        return;
      }

      // X resolves first, using the bounds as of frame start.
      let bounds = this._localAabb(handle);
      const xResult = this._resolveAxis(grid, bounds, dx, 'x');
      handle.position.x += xResult.delta;
      if (xResult.blocked) {
        if (dx > 0) handle._sbBlockedRight = true;
        else handle._sbBlockedLeft = true;
      }

      // Y resolves second, against bounds updated by the X move -- this
      // ordering is what makes a diagonal approach into a wall slide along
      // it instead of stopping dead.
      bounds = this._localAabb(handle);
      const yResult = this._resolveAxis(grid, bounds, dy, 'y');
      handle.position.y += yResult.delta;
      if (yResult.blocked) {
        if (dy > 0) handle._sbBlockedDown = true;
        else handle._sbBlockedUp = true;
      }
    },

    isBlockedUp(handle) { return !!handle._sbBlockedUp; },
    isBlockedDown(handle) { return !!handle._sbBlockedDown; },
    isBlockedLeft(handle) { return !!handle._sbBlockedLeft; },
    isBlockedRight(handle) { return !!handle._sbBlockedRight; },
  };
})();
