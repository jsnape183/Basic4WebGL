const _sbDrawing = (() => {
  const _styles = {
    fillColor: 0xffffff,
    lineColor: 0xffffff,
    lineWidth: 2,
  };
  const _liveG = [];                // drawn this frame
  const _liveS = [];                // drawn this frame
  const _liveM = [];                // PerspectiveMeshes drawn this frame (drawFloorStrip)
  const _poolG = [];                // free Graphics; pools grow to the frame's high-water mark and hold it until _drawingReset() (scene switch) -- deliberate, bounded by the max objects drawn in one frame
  const _poolS = [];                // free Sprites; pools grow to the frame's high-water mark and hold it until _drawingReset() (scene switch) -- deliberate, bounded by the max objects drawn in one frame
  const _poolM = [];                // free PerspectiveMeshes; same high-water-mark growth model as _poolS
  const _DRAW_Z_BASE = 1_000_000;   // drawing objects render above ordinary world sprites
  let _drawSeq = 0;                  // per-frame draw-order counter -> zIndex
  const _texCache = new Map();      // `${imageName}:${srcX}:${vTop}:${vBot}` -> PIXI.Texture (LRU-capped at 512)
  const _meshTexCache = new Map();  // `${imageName}:${uOff}:${vOff}:${uSpan}:${vSpan}` -> PIXI.Texture (world-tiled frame, repeat wrap; LRU-capped at 256)

  function _componentToHex(c) {
    const hex = Math.floor(c).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }

  function _acquireG() {
    let g = _poolG.pop();
    if (g) {
      g.clear();
      g.visible = true;
    } else {
      g = new PIXI.Graphics();
    }
    // (re)attach only when detached -- pooled objects may have been detached by a worldContainer.removeChildren() (scene switch / world.clearWorld()).
    // Draw order is expressed via zIndex (worldContainer.sortableChildren is true), not child-array position -- avoids a per-frame O(n) re-splice.
    if (g.parent !== worldContainer) worldContainer.addChild(g);
    g.zIndex = _DRAW_Z_BASE + _drawSeq++;
    _liveG.push(g);
    return g;
  }
  function _acquireS() {
    let s = _poolS.pop();
    if (s) {
      s.visible = true;
    } else {
      s = new PIXI.Sprite();
    }
    // (re)attach only when detached; draw order via zIndex, not child-array position (see _acquireG).
    if (s.parent !== worldContainer) worldContainer.addChild(s);
    s.zIndex = _DRAW_Z_BASE + _drawSeq++;
    _liveS.push(s);
    return s;
  }
  function _texFor(imageName, srcX, srcVTop, srcVBot) {
    const vt = srcVTop === undefined ? 0 : srcVTop;
    const vb = srcVBot === undefined ? 1 : srcVBot;
    const qt = Math.round(vt * 1000) / 1000;   // quantise so a jittering clip
    const qb = Math.round(vb * 1000) / 1000;   // doesn't churn the cache
    const key = imageName + ':' + srcX + ':' + qt + ':' + qb;
    let t = _texCache.get(key);
    if (!t) {
      const base = _sbAssets.get(imageName);
      t = new PIXI.Texture({
        source: base.source,
        frame: new PIXI.Rectangle(srcX, qt * base.height, 1, Math.max(1, (qb - qt) * base.height)),
      });
      _texCache.set(key, t);
      // LRU cap — evict oldest if over (Map preserves insertion order)
      if (_texCache.size > 512) {
        const oldest = _texCache.keys().next().value;
        const old = _texCache.get(oldest);
        _texCache.delete(oldest);
        if (old && old.destroy) old.destroy();
      }
    }
    return t;
  }

  function _acquireM(texture) {
    let m = _poolM.pop();
    if (m) {
      m.visible = true;
      m.texture = texture;
    } else {
      // verticesX: 2 -> no across-strip subdivision (a 4px strip tolerates affine U);
      // verticesY: 12 -> depth subdivision so PerspectiveMesh's homography keeps the
      // world-tiled V perspective-correct toward the horizon.
      m = new PIXI.PerspectiveMesh({ texture, verticesX: 2, verticesY: 12 });
    }
    // (re)attach only when detached; draw order via zIndex, not child-array position (see _acquireG).
    if (m.parent !== worldContainer) worldContainer.addChild(m);
    m.zIndex = _DRAW_Z_BASE + _drawSeq++;
    _liveM.push(m);
    return m;
  }

  // A texture whose frame spans multiple source repeats, so the mesh's 0..1 UVs
  // tile the image by world position. uOff/vOff/uSpan/vSpan are in source-image
  // units (1.0 == one full tile). Quantised so a drifting camera doesn't churn.
  function _meshTexFor(imageName, uOff, vOff, uSpan, vSpan) {
    const q = (n) => Math.round(n * 100) / 100;
    const qUo = q(uOff), qVo = q(vOff), qUs = Math.max(0.01, q(uSpan)), qVs = Math.max(0.01, q(vSpan));
    const key = imageName + ':' + qUo + ':' + qVo + ':' + qUs + ':' + qVs;
    let t = _meshTexCache.get(key);
    if (!t) {
      const base = _sbAssets.get(imageName);
      if (base.source && base.source.style) base.source.style.addressMode = 'repeat';
      t = new PIXI.Texture({
        source: base.source,
        frame: new PIXI.Rectangle(qUo * base.width, qVo * base.height, qUs * base.width, qVs * base.height),
      });
      _meshTexCache.set(key, t);
      if (_meshTexCache.size > 256) {
        const oldest = _meshTexCache.keys().next().value;
        const old = _meshTexCache.get(oldest);
        _meshTexCache.delete(oldest);
        if (old && old.destroy) old.destroy();
      }
    }
    return t;
  }

  return {
    setFillColor(r, g, b) {
      const hex = _componentToHex(r) + _componentToHex(g) + _componentToHex(b);
      _styles.fillColor = parseInt(hex, 16);
    },
    setLineColor(r, g, b) {
      const hex = _componentToHex(r) + _componentToHex(g) + _componentToHex(b);
      _styles.lineColor = parseInt(hex, 16);
    },
    setLineWidth(n) {
      _styles.lineWidth = n;
    },
    drawLine(x, y, x2, y2) {
      const o = _acquireG();
      o.moveTo(0, 0).lineTo(x2, y2).stroke({ width: _styles.lineWidth, color: _styles.lineColor });
      o.position.set(x, y);
      return o;
    },
    drawRect(x, y, width, height) {
      const o = _acquireG();
      o.rect(0, 0, width, height).fill(_styles.fillColor);
      if (_styles.lineWidth > 0) o.stroke({ width: _styles.lineWidth, color: _styles.lineColor });
      o.pivot.set(width / 2, height / 2);
      o.position.set(x, y);
      return o;
    },
    drawCircle(x, y, radius) {
      const o = _acquireG();
      o.circle(0, 0, radius).fill(_styles.fillColor);
      if (_styles.lineWidth > 0) o.stroke({ width: _styles.lineWidth, color: _styles.lineColor });
      o.pivot.set(radius / 2, radius / 2);
      o.position.set(x, y);
      return o;
    },
    drawImageStrip(imageName, srcX, destX, destY, destWidth, destHeight, tint, srcVTop, srcVBot) {
      const o = _acquireS();
      o.texture = _texFor(imageName, srcX, srcVTop, srcVBot);
      o.width = destWidth;
      o.height = destHeight;
      o.tint = tint === undefined ? 0xffffff : tint;
      o.anchor.set(0.5, 0.5);
      o.position.set(destX, destY);
      return o;
    },

    // Draws one column-wide, perspective-correct, world-tiled textured strip for a
    // horizontal surface band (floor / ceiling). The screen quad is
    // [destX ± stripW/2] x [yFar, yNear]; the texture tiles once per world unit,
    // sampled along the world segment (wNearX,wNearY) -> (wFarX,wFarY).
    drawFloorStrip(imageName, destX, yNear, yFar, wNearX, wNearY, wFarX, wFarY, stripW, tint) {
      const hw = stripW / 2;
      // depth axis (far -> near) and its length in world units == tile repeats along V
      let dx = wNearX - wFarX;
      let dy = wNearY - wFarY;
      const segLen = Math.hypot(dx, dy) || 0.001;
      dx /= segLen;
      dy /= segLen;
      // across-strip (U) axis: perpendicular to the depth axis
      const px = -dy;
      const py = dx;
      // approximate the strip's world width from the screen-width : screen-depth ratio
      const dyScreen = Math.abs(yNear - yFar);
      const worldW = dyScreen < 0.0001 ? 0.001 : segLen * (stripW / dyScreen);
      // world coords of the near point resolved onto the (U, V) axes
      const uCenter = wNearX * px + wNearY * py;
      const vNear = wNearX * dx + wNearY * dy;
      // frame: U from uCenter-worldW/2 spanning worldW; V from (vNear-segLen) spanning segLen
      const tex = _meshTexFor(imageName, uCenter - worldW / 2, vNear - segLen, worldW, segLen);
      const m = _acquireM(tex);
      if (dyScreen < 0.0001) { m.visible = false; return m; }  // degenerate band
      // corners: TL far-left, TR far-right, BR near-right, BL near-left
      m.setCorners(
        destX - hw, yFar,
        destX + hw, yFar,
        destX + hw, yNear,
        destX - hw, yNear,
      );
      m.tint = tint === undefined ? 0xffffff : tint;
      return m;
    },

    clearDrawing() {
      _drawSeq = 0;   // reset per-frame draw-order counter so zIndex stays in a stable band and never drifts past Number range
      for (const o of _liveG) { o.visible = false; _poolG.push(o); }
      for (const o of _liveS) { o.visible = false; _poolS.push(o); }
      for (const o of _liveM) { o.visible = false; _poolM.push(o); }
      _liveG.length = 0;
      _liveS.length = 0;
      _liveM.length = 0;
    },

    // Full teardown — pooled + live objects destroyed, caches cleared. Called by
    // stage.clear() on scene switch (also fixes the old cross-scene leak where
    // _drawObjs kept references after worldContainer.removeChildren()).
    _drawingReset() {
      _drawSeq = 0;
      for (const o of _liveG) { if (o.parent) o.parent.removeChild(o); o.destroy(); }
      for (const o of _liveS) { if (o.parent) o.parent.removeChild(o); o.destroy(); }
      for (const o of _liveM) { if (o.parent) o.parent.removeChild(o); o.destroy(); }
      for (const o of _poolG) { if (o.parent) o.parent.removeChild(o); o.destroy(); }
      for (const o of _poolS) { if (o.parent) o.parent.removeChild(o); o.destroy(); }
      for (const o of _poolM) { if (o.parent) o.parent.removeChild(o); o.destroy(); }
      _liveG.length = 0;
      _liveS.length = 0;
      _liveM.length = 0;
      _poolG.length = 0;
      _poolS.length = 0;
      _poolM.length = 0;
      for (const t of _texCache.values()) { if (t.destroy) t.destroy(); }
      _texCache.clear();
      for (const t of _meshTexCache.values()) { if (t.destroy) t.destroy(); }
      _meshTexCache.clear();
    },
  };
})();
