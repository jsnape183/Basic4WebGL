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
  const _PF_SCALE = 2;               // drawPlaneField renders the floorcast buffer at 1/N screen resolution, upscaled by the sprite. 1 = full res (crispest, slowest); 2 = quarter the pixels; 3 = ninth.
  const _lightmapCache = new Map();  // id -> { texture, worldCols, worldRows, w, h, bytes } -- baked static light grid (registerLightmap)
  const _planeFields = new Map();    // fieldId -> { source, texture, sprite, w, h, buf } -- persistent per-plane floorcast buffer (drawPlaneField)
  const _fieldTexCache = new Map();  // imageName -> { data:Uint8ClampedArray, w, h } | null -- CPU pixels of a floor/ceiling tile texture, decoded once via a 2D canvas (null = decode unavailable -> procedural fallback)
  const _fieldTilesCache = new Map(); // atlasId -> { cols, rows, cellPix:(pix|null)[], cellCol:Int32Array } -- per-cell floor/ceiling texture + flat-colour grid (registerFieldTiles)
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

    // Register a baked static-light grid as a clamped, linearly-filtered
    // texture. `bytes` is a flat RGBA array (row-major, w*h*4); brightness is
    // stored in R (0..255). worldCols/worldRows are the world-space span the
    // grid covers, so a sampler can map a world (x,y) to a UV. Rebuilding an id
    // destroys the previous texture. Torn down in _drawingReset().
    registerLightmap(id, w, h, worldCols, worldRows, bytes) {
      const prev = _lightmapCache.get(id);
      if (prev && prev.texture && prev.texture.destroy) prev.texture.destroy();
      const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
      const source = new PIXI.BufferImageSource({
        resource: arr,
        width: w,
        height: h,
        addressMode: 'clamp-to-edge',
        scaleMode: 'linear',
      });
      const texture = new PIXI.Texture({ source });
      _lightmapCache.set(id, { texture, source, worldCols, worldRows, w, h, bytes: arr });
    },

    // The world point a screen pixel (px, py) looks at on the horizontal plane
    // at height `pose.planeZ` -- the inverse of RcRender.projectY(). Returns
    // { wx, wy, d } or null when the pixel is on the wrong side of the horizon
    // / behind the camera. Shared by drawPlaneField (the per-pixel floorcast)
    // and its tests, so the GLSL-free CPU path and any future shader agree on
    // one projection.
    _planeFieldWorldPos(px, py, pose) {
      const horizon = pose.scy + pose.camPitch;
      const rowY = py - horizon;
      const zDiff = pose.camZ + pose.eyeZ - pose.planeZ;   // >0 for the floor, <0 for the ceiling
      if (zDiff > 0) {
        if (rowY <= 0.0001) return null;
      } else {
        if (rowY >= -0.0001) return null;
      }
      const d = (zDiff * pose.viewH) / rowY;
      if (d <= 0.05 || d > 64) return null;
      const camXc = (2 * px) / pose.viewW - 1;
      const rayX = pose.fDirX + pose.fPlaneX * camXc;
      const rayY = pose.fDirY + pose.fPlaneY * camXc;
      return { wx: pose.camX + rayX * d, wy: pose.camY + rayY * d, d };
    },

    // CPU pixels of a floor/ceiling tile texture, decoded once through a 2D
    // canvas and cached. Returns null (and caches null) when no canvas 2D
    // context is available (e.g. jsdom under test) or the asset can't be
    // drawn -- drawPlaneField then falls back to its procedural checker.
    _fieldTexPixels(name) {
      if (_fieldTexCache.has(name)) return _fieldTexCache.get(name);
      let out = null;
      try {
        const asset = _sbAssets.get(name);
        const srcObj = asset && asset.source ? asset.source : asset;
        const res = srcObj && srcObj.resource ? srcObj.resource : srcObj;
        const w = (srcObj && (srcObj.pixelWidth || srcObj.width)) || (res && res.width) || (asset && asset.width);
        const h = (srcObj && (srcObj.pixelHeight || srcObj.height)) || (res && res.height) || (asset && asset.height);
        if (res && w && h && typeof document !== 'undefined' && document.createElement) {
          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          const ctx = c.getContext && c.getContext('2d', { willReadFrequently: true });
          if (ctx && ctx.drawImage && ctx.getImageData) {
            ctx.drawImage(res, 0, 0, w, h);
            out = { data: ctx.getImageData(0, 0, w, h).data, w, h };
          }
        }
      } catch (e) {
        out = null;
      }
      _fieldTexCache.set(name, out);
      return out;
    },

    // Register a per-cell floor/ceiling surface grid. Both arrays are flat
    // (row-major, cols*rows). `cellNames`: pre-loaded image names, "" for none
    // -- each distinct name decoded once via _fieldTexPixels. `cellColors`:
    // packed r*65536+g*256+b, or -1 for none. drawPlaneField picks per pixel:
    // cell texture > cell flat colour > scene default texture > procedural
    // checker. Torn down in _drawingReset().
    registerFieldTiles(atlasId, cols, rows, cellNames, cellColors, cellHeights) {
      const total = cols * rows;
      const cellPix = new Array(total).fill(null);
      const cellCol = new Int32Array(total).fill(-1);
      const cellH = new Float32Array(total); // 0 == standard floor / caller passes standard ceiling explicitly
      const nN = Math.min(cellNames.length, total);
      for (let i = 0; i < nN; i++) {
        const nm = cellNames[i];
        if (nm) cellPix[i] = this._fieldTexPixels(nm);
      }
      if (cellColors) {
        const nC = Math.min(cellColors.length, total);
        for (let i = 0; i < nC; i++) {
          const v = cellColors[i];
          if (typeof v === 'number' && v >= 0) cellCol[i] = v | 0;
        }
      }
      if (cellHeights) {
        const nH = Math.min(cellHeights.length, total);
        for (let i = 0; i < nH; i++) {
          const v = cellHeights[i];
          if (typeof v === 'number') cellH[i] = v;
        }
      }
      _fieldTilesCache.set(atlasId, { cols, rows, cellPix, cellCol, cellH, hasH: !!cellHeights });
    },

    // Per-pixel floorcaster for one flat plane. Resolves the world point each
    // screen pixel looks at, samples a world-tiled texture (`texName`, one tile
    // per world unit) -- or a procedural checker when no texture resolves --
    // and multiplies by max(ambient,
    // bakedLight(worldPos)) from the registered lightmap. Writes a persistent
    // per-field RGBA buffer uploaded in place (no per-frame GPU alloc/destroy),
    // shown via one persistent Sprite at the current draw-order zIndex so later
    // draws (walls) paint over it. Static lighting only.
    //
    // Perf: the projection is the classic floorcast form -- perpendicular
    // distance `d` is constant along a screen row and the world point steps
    // linearly across it, so the inner loop is two adds + a lightmap lookup, no
    // divide, no allocation. The buffer is rendered at 1/_PF_SCALE resolution
    // and upscaled by the sprite; _planeFieldWorldPos is the un-optimised
    // reference the tests pin this against.
    drawPlaneField(fieldId, texName, tilesId, planeZ, camX, camY, camZ, fDirX, fDirY, fPlaneX, fPlaneY, camPitch, viewW, viewH, scy, eyeZ, lightmapId, ambient, baseR, baseG, baseB) {
      const SCALE = _PF_SCALE;
      const tex = texName ? this._fieldTexPixels(texName) : null;
      const tdata = tex ? tex.data : null;
      const tw = tex ? tex.w : 1;
      const th = tex ? tex.h : 1;
      const tiles = tilesId ? _fieldTilesCache.get(tilesId) : null;
      const tiCols = tiles ? tiles.cols : 0;
      const tiRows = tiles ? tiles.rows : 0;
      const cellPix = tiles ? tiles.cellPix : null;
      const cellCol = tiles ? tiles.cellCol : null;
      // Per-cell height mask: when the atlas carries real heights, this pass
      // paints only the cells at `planeZ` (the rest is another height's pass).
      const cellH = tiles && tiles.hasH ? tiles.cellH : null;
      const W = Math.max(1, Math.round(viewW / SCALE));
      const H = Math.max(1, Math.round(viewH / SCALE));
      let f = _planeFields.get(fieldId);
      if (!f || f.w !== W || f.h !== H) {
        if (f) {
          if (f.sprite && f.sprite.parent) f.sprite.parent.removeChild(f.sprite);
          if (f.sprite && f.sprite.destroy) f.sprite.destroy();
          if (f.texture && f.texture.destroy) f.texture.destroy();
        }
        const buf = new Uint8Array(W * H * 4);
        const source = new PIXI.BufferImageSource({ resource: buf, width: W, height: H, scaleMode: 'nearest' });
        const texture = new PIXI.Texture({ source });
        const sprite = new PIXI.Sprite(texture);
        sprite.width = viewW;
        sprite.height = viewH;
        if (sprite.anchor && sprite.anchor.set) sprite.anchor.set(0, 0);
        f = { source, texture, sprite, w: W, h: H, buf };
        _planeFields.set(fieldId, f);
      }
      const buf = f.buf;
      const lm = _lightmapCache.get(lightmapId);
      const lmB = lm ? lm.bytes : null;
      const lmW = lm ? lm.w : 1;
      const lmH = lm ? lm.h : 1;
      const lmSX = lm ? lmW / lm.worldCols : 0;   // world -> lightmap texel scale
      const lmSY = lm ? lmH / lm.worldRows : 0;
      const horizon = scy + camPitch;
      const zDiff = camZ + eyeZ - planeZ;          // >0 floor, <0 ceiling
      const isFloor = zDiff > 0;
      // ray directions at the left/right screen edges (camXc = -1 .. +1)
      const dirLX = fDirX - fPlaneX, dirLY = fDirY - fPlaneY;
      const dirRX = fDirX + fPlaneX, dirRY = fDirY + fPlaneY;
      const halfStepFrac = 0.5 / W;                // sample at pixel centres
      for (let by = 0; by < H; by++) {
        let o = by * W * 4;
        const sy = (by + 0.5) * SCALE;
        const rowY = sy - horizon;
        const bad = isFloor ? rowY <= 0.0001 : rowY >= -0.0001;
        let d = bad ? 0 : (zDiff * viewH) / rowY;
        if (bad || d <= 0.05 || d > 64) {
          for (let bx = 0; bx < W; bx++) { buf[o] = 0; buf[o + 1] = 0; buf[o + 2] = 0; buf[o + 3] = 0; o += 4; }
          continue;
        }
        const spanX = (dirRX - dirLX) * d, spanY = (dirRY - dirLY) * d;
        let wx = camX + (dirLX + (dirRX - dirLX) * halfStepFrac) * d;
        let wy = camY + (dirLY + (dirRY - dirLY) * halfStepFrac) * d;
        const stepX = spanX / W, stepY = spanY / W;
        for (let bx = 0; bx < W; bx++) {
          const flx = Math.floor(wx);
          const fly = Math.floor(wy);
          if (cellH) {
            const inb = flx >= 0 && flx < tiCols && fly >= 0 && fly < tiRows;
            const ch0 = inb ? cellH[fly * tiCols + flx] : 0;
            if (!inb || Math.abs(ch0 - planeZ) > 0.02) {
              buf[o] = 0; buf[o + 1] = 0; buf[o + 2] = 0; buf[o + 3] = 0;
              o += 4; wx += stepX; wy += stepY;
              continue;
            }
          }
          const fx = wx - flx;
          const fy = wy - fly;
          let r, g, b;
          // per-cell texture > per-cell flat colour > scene texture > checker
          let cd = null, cw = 1, ch = 1, cellRGB = -1;
          if (cellPix && flx >= 0 && flx < tiCols && fly >= 0 && fly < tiRows) {
            const idx = fly * tiCols + flx;
            const cp = cellPix[idx];
            if (cp) { cd = cp.data; cw = cp.w; ch = cp.h; }
            else if (cellCol) { const v = cellCol[idx]; if (v >= 0) cellRGB = v; }
          }
          if (!cd && cellRGB < 0 && tdata) { cd = tdata; cw = tw; ch = th; }
          if (cd) {
            let tx = (fx * cw) | 0; if (tx >= cw) tx = cw - 1; else if (tx < 0) tx = 0;
            let ty = (fy * ch) | 0; if (ty >= ch) ty = ch - 1; else if (ty < 0) ty = 0;
            const ti = (ty * cw + tx) * 4;
            r = cd[ti]; g = cd[ti + 1]; b = cd[ti + 2];
          } else if (cellRGB >= 0) {
            r = (cellRGB >>> 16) & 255; g = (cellRGB >>> 8) & 255; b = cellRGB & 255;
          } else {
            let shade = ((fx < 0.5) === (fy < 0.5)) ? 1.0 : 0.82;
            if (fx < 0.03 || fx > 0.97 || fy < 0.03 || fy > 0.97) shade = 0.55;
            r = baseR * shade; g = baseG * shade; b = baseB * shade;
          }
          let L = 1.0;
          if (lmB) {
            let lx = (wx * lmSX) | 0;
            let ly = (wy * lmSY) | 0;
            if (lx < 0) lx = 0; else if (lx >= lmW) lx = lmW - 1;
            if (ly < 0) ly = 0; else if (ly >= lmH) ly = lmH - 1;
            L = lmB[(ly * lmW + lx) * 4] * 0.00392156862745098; // /255
          }
          const m = ambient > L ? ambient : L;
          r *= m; if (r > 255) r = 255;
          g *= m; if (g > 255) g = 255;
          b *= m; if (b > 255) b = 255;
          buf[o] = r; buf[o + 1] = g; buf[o + 2] = b; buf[o + 3] = 255;
          o += 4;
          wx += stepX; wy += stepY;
        }
      }
      if (f.source.update) f.source.update();
      const s = f.sprite;
      if (s.parent !== worldContainer) worldContainer.addChild(s);
      s.visible = true;
      s.zIndex = _DRAW_Z_BASE + _drawSeq++;
      return s;
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
      for (const e of _lightmapCache.values()) { if (e.texture && e.texture.destroy) e.texture.destroy(); }
      _lightmapCache.clear();
      for (const f of _planeFields.values()) {
        if (f.sprite && f.sprite.parent) f.sprite.parent.removeChild(f.sprite);
        if (f.sprite && f.sprite.destroy) f.sprite.destroy();
        if (f.texture && f.texture.destroy) f.texture.destroy();
      }
      _planeFields.clear();
      _fieldTexCache.clear();
      _fieldTilesCache.clear();
    },
  };
})();
