const _sbDrawing = (() => {
  const _styles = {
    fillColor: 0xffffff,
    lineColor: 0xffffff,
    lineWidth: 2,
  };
  const _live = [];                 // drawn this frame
  const _poolG = [];                // free Graphics
  const _poolS = [];                // free Sprites
  const _texCache = new Map();      // `${imageName}:${srcX}` -> PIXI.Texture

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
      g._sbKind = 'g';
    }
    // always (re)attach -- pooled objects may have been detached by a worldContainer.removeChildren() (scene switch / world.clearWorld())
    worldContainer.addChild(g);
    _live.push(g);
    return g;
  }
  function _acquireS() {
    let s = _poolS.pop();
    if (s) {
      s.visible = true;
    } else {
      s = new PIXI.Sprite(PIXI.Texture.EMPTY ?? undefined);
      s._sbKind = 's';
    }
    // always (re)attach -- pooled objects may have been detached by a worldContainer.removeChildren() (scene switch / world.clearWorld())
    worldContainer.addChild(s);
    _live.push(s);
    return s;
  }
  function _texFor(imageName, srcX) {
    const key = imageName + ':' + srcX;
    let t = _texCache.get(key);
    if (!t) {
      const base = _sbAssets.get(imageName);
      t = new PIXI.Texture({
        source: base.source,
        frame: new PIXI.Rectangle(srcX, 0, 1, base.height),
      });
      _texCache.set(key, t);
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
    drawImageStrip(imageName, srcX, destX, destY, destWidth, destHeight) {
      const o = _acquireS();
      o.texture = _texFor(imageName, srcX);
      o.width = destWidth;
      o.height = destHeight;
      o.anchor.set(0.5, 0.5);
      o.position.set(destX, destY);
      return o;
    },

    clearDrawing() {
      for (const o of _live) {
        o.visible = false;
        (o._sbKind === 's' ? _poolS : _poolG).push(o);
      }
      _live.length = 0;
    },

    // Full teardown — pooled + live objects destroyed, caches cleared. Called by
    // stage.clear() on scene switch (also fixes the old cross-scene leak where
    // _drawObjs kept references after worldContainer.removeChildren()).
    _drawingReset() {
      for (const o of _live) { if (o.parent) o.parent.removeChild(o); o.destroy(); }
      for (const o of _poolG) { if (o.parent) o.parent.removeChild(o); o.destroy(); }
      for (const o of _poolS) { if (o.parent) o.parent.removeChild(o); o.destroy(); }
      _live.length = 0;
      _poolG.length = 0;
      _poolS.length = 0;
      for (const t of _texCache.values()) { if (t.destroy) t.destroy(); }
      _texCache.clear();
    },
  };
})();
