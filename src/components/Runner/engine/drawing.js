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
  const _gradientCache = new Map(); // `${topHex}:${botHex}` -> PIXI.FillGradient

  // A PIXI.FillGradient allocates a real backing GPU texture -- creating a new
  // one per draw call (a floor/ceiling shading path can issue dozens of these
  // per column, every frame) exhausts VRAM within seconds and takes the whole
  // WebGL context down with it (symptom: PIXI's own stock batch shader starts
  // failing to compile, then CONTEXT_LOST_WEBGL). Quantise each channel to the
  // nearest 4 (imperceptible) so nearby light levels share one cached gradient.
  //
  // Deliberately NOT LRU-capped-and-destroyed like _texFor/_meshTexFor above.
  // A FillGradient can be referenced by Graphics objects PIXI hasn't finished
  // processing for the current frame yet (its GPU resources are built lazily,
  // during batching); destroying one that's still in flight -- which a size
  // cap here WILL do once real gameplay produces more than a few hundred
  // distinct quantised colour pairs, which it does -- crashes the renderer
  // with null-texture errors, not a graceful miss. Unbounded growth for a
  // scene's lifetime is the safe trade: each gradient's texture is small
  // (PIXI's own docs: "gradient textures can be relatively small"), and the
  // quantised key space is finite, not truly unbounded. Only destroyed on
  // _drawingReset() (scene switch) below, where nothing can still be using them.
  function _quantizeChannel(c) {
    return Math.min(255, Math.max(0, Math.round(c / 4) * 4));
  }

  function _gradientFor(topR, topG, topB, botR, botG, botB) {
    const topHex = (_quantizeChannel(topR) << 16) | (_quantizeChannel(topG) << 8) | _quantizeChannel(topB);
    const botHex = (_quantizeChannel(botR) << 16) | (_quantizeChannel(botG) << 8) | _quantizeChannel(botB);
    const key = topHex + ':' + botHex;
    let g = _gradientCache.get(key);
    if (!g) {
      g = new PIXI.FillGradient({
        type: 'linear',
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
        colorStops: [
          { offset: 0, color: topHex },
          { offset: 1, color: botHex },
        ],
      });
      _gradientCache.set(key, g);
    }
    return g;
  }

  const _radialGradientCache = new Map(); // `${r}:${g}:${b}:${a}` (quantised) -> PIXI.FillGradient

  function _quantizeAlpha01(a) {
    return Math.min(1, Math.max(0, Math.round(a * 20) / 20)); // 0.05 steps -- imperceptible
  }

  // Same VRAM-exhaustion and in-flight-destroy hazards as _gradientFor above
  // apply here (a per-light-per-frame overlay can issue several of these every
  // frame) -- same fix: cache by quantised key, never evict/destroy mid-session,
  // only cleared on _drawingReset() (scene switch).
  function _radialGradientFor(r, g, b, alpha) {
    const qr = _quantizeChannel(r);
    const qg = _quantizeChannel(g);
    const qb = _quantizeChannel(b);
    const qa = _quantizeAlpha01(alpha);
    const key = qr + ':' + qg + ':' + qb + ':' + qa;
    let g2 = _radialGradientCache.get(key);
    if (!g2) {
      g2 = new PIXI.FillGradient({
        type: 'radial',
        center: { x: 0.5, y: 0.5 },
        innerRadius: 0,
        outerCenter: { x: 0.5, y: 0.5 },
        outerRadius: 0.5,
        colorStops: [
          { offset: 0, color: { r: qr, g: qg, b: qb, a: qa } },
          { offset: 1, color: { r: qr, g: qg, b: qb, a: 0 } },
        ],
      });
      _radialGradientCache.set(key, g2);
    }
    return g2;
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
    // A rect filled with a true top-to-bottom colour gradient (PIXI.FillGradient,
    // local coordinate space so start/end are 0..1 within the shape regardless of
    // its actual width/height) -- used by RcRender's floor/ceiling shading so one
    // shape covers a whole colour run's light gradient exactly, with no
    // intermediate sampling lattice. x/y is the shape's centre, matching drawRect.
    drawVGradientRect(x, y, width, height, topR, topG, topB, botR, botG, botB) {
      const o = _acquireG();
      const gradient = _gradientFor(topR, topG, topB, botR, botG, botB);
      o.rect(0, 0, width, height).fill(gradient);
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
    // A circle filled with a radial gradient from (r,g,b,alpha) at its centre
    // fading to fully transparent at its edge -- used by the raycaster
    // light-pool POC to overlay a soft "pool of light" on floor/ceiling,
    // independent of the per-column wall/floor render. x/y is the circle's
    // centre, matching drawCircle.
    drawRadialGradientCircle(x, y, radius, r, g, b, alpha) {
      const o = _acquireG();
      const gradient = _radialGradientFor(r, g, b, alpha);
      o.circle(0, 0, radius).fill(gradient);
      o.position.set(x, y);
      return o;
    },
    // Like drawRadialGradientCircle but with independent horizontal/vertical
    // radii -- used by the raycaster light-pool POC to draw a floor/ceiling
    // pool foreshortened (wide, vertically squashed) so it lies flat on the
    // surface instead of reading as a floating billboard. x/y is the centre.
    drawRadialGradientEllipse(x, y, radiusX, radiusY, r, g, b, alpha) {
      const o = _acquireG();
      const gradient = _radialGradientFor(r, g, b, alpha);
      o.ellipse(0, 0, radiusX, radiusY).fill(gradient);
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
      for (const g of _gradientCache.values()) { if (g.destroy) g.destroy(); }
      _gradientCache.clear();
      for (const g of _radialGradientCache.values()) { if (g.destroy) g.destroy(); }
      _radialGradientCache.clear();
    },
  };
})();
