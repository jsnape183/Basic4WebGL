const _sbDrawing = (() => {
  const _styles = {
    fillColor: 0xffffff,
    lineColor: 0xffffff,
    lineWidth: 2,
  };

  function _componentToHex(c) {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
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
      const obj = new PIXI.Graphics();
      obj.moveTo(0, 0).lineTo(x2, y2).stroke({ width: _styles.lineWidth, color: _styles.lineColor });
      obj.position.set(x, y);
      app.stage.addChild(obj);
      return obj;
    },
    drawRect(x, y, width, height) {
      const obj = new PIXI.Graphics();
      obj.rect(0, 0, width, height).fill(_styles.fillColor).stroke({ width: _styles.lineWidth, color: _styles.lineColor });
      obj.pivot.set(width / 2, height / 2);
      obj.position.set(x, y);
      app.stage.addChild(obj);
      return obj;
    },
    drawCircle(x, y, radius) {
      const obj = new PIXI.Graphics();
      obj.circle(0, 0, radius).fill(_styles.fillColor).stroke({ width: _styles.lineWidth, color: _styles.lineColor });
      obj.pivot.set(radius / 2, radius / 2);
      obj.position.set(x, y);
      app.stage.addChild(obj);
      return obj;
    },
  };
})();
