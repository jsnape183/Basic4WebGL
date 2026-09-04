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

  // --- batched wall mesh (wallColumn / wallFlush) -------------------------
  // One PIXI.Mesh per wall image per frame: 2 triangles per column, a thin
  // vertical UV slice at srcU, and a per-vertex colour carrying the column's
  // light tint. Accumulate with wallColumn(), emit with wallFlush().
  const _WALL_HALF_W = 2;           // half of the raycaster's RC_STRIP_W (4)
  const _wallBuffers = new Map();   // imageName -> { x, top, bot, u, vt, vb, tint } (parallel arrays, this frame)
  const _wallPool = new Map();      // imageName -> { mesh, geom, shader, cap } (cap = column capacity)
  const _wallTexCache = new Map();  // imageName -> PIXI.Texture over the full source

  // GL-only shader pair: the bootstrapper's app.init() sets no `preference`, so
  // PIXI v8 uses its WebGL default. uProjectionMatrix / uWorldTransformMatrix /
  // uTransformMatrix are the uniforms PIXI's mesh pipeline supplies to a custom
  // mesh shader; aColor is our addition, carrying the per-column light tint.
  const _WALL_VERT = `
in vec2 aPosition;
in vec2 aUV;
in vec4 aColor;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

out vec2 vUV;
out vec4 vColor;

void main() {
    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
    vUV = aUV;
    vColor = aColor;
}`;

  const _WALL_FRAG = `
in vec2 vUV;
in vec4 vColor;

uniform sampler2D uTexture;

out vec4 fragColor;

void main() {
    fragColor = texture(uTexture, vUV) * vColor;
}`;

  // A texture over the whole source image — the mesh's UVs do the slicing, so
  // (unlike _texFor's 1px sprite frame) the frame must be the full image.
  function _fullTexFor(imageName) {
    let t = _wallTexCache.get(imageName);
    if (!t) {
      const base = _sbAssets.get(imageName);
      t = new PIXI.Texture({
        source: base.source,
        frame: new PIXI.Rectangle(0, 0, base.width, base.height),
      });
      _wallTexCache.set(imageName, t);
    }
    return t;
  }

  // One shader per pooled mesh: the texture is bound as a shader resource, so a
  // shared instance would leave every mesh sampling the last image bound.
  function _wallShaderFor(imageName) {
    const base = _sbAssets.get(imageName);
    return PIXI.Shader.from({
      gl: { vertex: _WALL_VERT, fragment: _WALL_FRAG },
      resources: { uTexture: base.source },
    });
  }

  // Pooled mesh + geometry per image, capacity rounded up to the next 64 columns
  // and held at the high-water mark (same model as _poolS / _poolM).
  function _acquireWallMesh(imageName, colCount) {
    let entry = _wallPool.get(imageName);
    const need = Math.max(64, Math.ceil(colCount / 64) * 64);
    if (!entry || entry.cap < need) {
      if (entry) {
        if (entry.mesh.parent) entry.mesh.parent.removeChild(entry.mesh);
        entry.mesh.destroy();
        entry.geom.destroy();
      }
      const verts = need * 4;
      const pos = new Float32Array(verts * 2);
      const uv = new Float32Array(verts * 2);
      const col = new Float32Array(verts * 4);
      const idx = new Uint32Array(need * 6);
      for (let c = 0; c < need; c++) {
        const b = c * 4;
        idx.set([b, b + 1, b + 2, b + 1, b + 3, b + 2], c * 6);
      }
      const vertexUsage = PIXI.BufferUsage.VERTEX | PIXI.BufferUsage.COPY_DST;
      const posBuf = new PIXI.Buffer({ data: pos, usage: vertexUsage });
      const uvBuf = new PIXI.Buffer({ data: uv, usage: vertexUsage });
      const colBuf = new PIXI.Buffer({ data: col, usage: vertexUsage });
      const geom = new PIXI.Geometry({
        attributes: {
          aPosition: { buffer: posBuf },
          aUV: { buffer: uvBuf },
          aColor: { buffer: colBuf },
        },
        indexBuffer: idx,
      });
      // JS-side refs so wallFlush can mutate the arrays and re-upload in place
      geom._posArr = pos; geom._uvArr = uv; geom._colArr = col;
      geom._posBuf = posBuf; geom._uvBuf = uvBuf; geom._colBuf = colBuf;
      const shader = _wallShaderFor(imageName);
      const mesh = new PIXI.Mesh({ geometry: geom, shader });
      mesh.texture = _fullTexFor(imageName);
      entry = { mesh, geom, shader, cap: need };
      _wallPool.set(imageName, entry);
    }
    return entry;
  }

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

    // Queues one textured wall column for the batched wall mesh. Draws nothing:
    // no PIXI object, no display-list touch. topY/botY are already clipped to the
    // occlusion window; srcU is the horizontal texture coord (0..1) along the wall
    // face and srcVTop/srcVBot the vertical source clip (0..1).
    wallColumn(imageName, destX, topY, botY, srcU, srcVTop, srcVBot, tint) {
      let b = _wallBuffers.get(imageName);
      if (!b) { b = { x: [], top: [], bot: [], u: [], vt: [], vb: [], tint: [] }; _wallBuffers.set(imageName, b); }
      b.x.push(destX); b.top.push(topY); b.bot.push(botY);
      b.u.push(srcU); b.vt.push(srcVTop); b.vb.push(srcVBot);
      b.tint.push(tint === undefined ? 0xffffff : tint);
    },

    // Emits one mesh per buffered image (2 triangles per column, one buffer
    // upload per texture) and clears the buffers. Returns the number of meshes
    // drawn so the caller can account for primitive counts.
    wallFlush() {
      let meshCount = 0;
      for (const [imageName, b] of _wallBuffers) {
        const n = b.x.length;
        if (n === 0) continue;
        const entry = _acquireWallMesh(imageName, n);
        const mesh = entry.mesh;
        const geom = entry.geom;
        const cap = entry.cap;
        const pos = geom._posArr, uv = geom._uvArr, col = geom._colArr;
        for (let c = 0; c < cap; c++) {
          const vb = c * 8, cb = c * 16;
          if (c < n) {
            const x0 = b.x[c] - _WALL_HALF_W, x1 = b.x[c] + _WALL_HALF_W;
            const yt = b.top[c], yd = b.bot[c];
            pos[vb] = x0; pos[vb + 1] = yt; pos[vb + 2] = x1; pos[vb + 3] = yt;
            pos[vb + 4] = x0; pos[vb + 5] = yd; pos[vb + 6] = x1; pos[vb + 7] = yd;
            const u = b.u[c], vt = b.vt[c], vd = b.vb[c];
            uv[vb] = u; uv[vb + 1] = vt; uv[vb + 2] = u; uv[vb + 3] = vt;
            uv[vb + 4] = u; uv[vb + 5] = vd; uv[vb + 6] = u; uv[vb + 7] = vd;
            const t = b.tint[c];
            const r = ((t >> 16) & 255) / 255, g = ((t >> 8) & 255) / 255, bl = (t & 255) / 255;
            for (let v = 0; v < 4; v++) {
              col[cb + v * 4] = r; col[cb + v * 4 + 1] = g; col[cb + v * 4 + 2] = bl; col[cb + v * 4 + 3] = 1;
            }
          } else {
            // unused capacity -> collapse to a zero-area quad rather than leave stale verts
            for (let k = 0; k < 8; k++) pos[vb + k] = 0;
          }
        }
        if (geom._posBuf && geom._posBuf.update) geom._posBuf.update();
        if (geom._uvBuf && geom._uvBuf.update) geom._uvBuf.update();
        if (geom._colBuf && geom._colBuf.update) geom._colBuf.update();
        mesh.zIndex = _DRAW_Z_BASE + _drawSeq++;
        // (re)attach only when detached; draw order via zIndex (see _acquireG).
        if (mesh.parent !== worldContainer) worldContainer.addChild(mesh);
        mesh.visible = true;
        meshCount++;
      }
      // hide pooled meshes for images that had no columns this frame
      for (const [imageName, entry] of _wallPool) {
        if (!_wallBuffers.has(imageName)) entry.mesh.visible = false;
      }
      _wallBuffers.clear();
      return meshCount;
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
      for (const e of _wallPool.values()) {
        if (e.mesh) { if (e.mesh.parent) e.mesh.parent.removeChild(e.mesh); if (e.mesh.destroy) e.mesh.destroy(); }
        if (e.geom && e.geom.destroy) e.geom.destroy();
      }
      _wallPool.clear();
      _wallBuffers.clear();
      for (const t of _wallTexCache.values()) { if (t.destroy) t.destroy(); }
      _wallTexCache.clear();
      for (const t of _texCache.values()) { if (t.destroy) t.destroy(); }
      _texCache.clear();
      for (const t of _meshTexCache.values()) { if (t.destroy) t.destroy(); }
      _meshTexCache.clear();
    },
  };
})();
