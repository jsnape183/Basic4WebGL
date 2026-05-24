const _sbDrawing = (() => {
  const _styles = {
    fillColor: 0xffffff,
    lineColor: 0xffffff,
  };

  function _componentToHex(c) {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }

  function _drawWithFill(drawMethod) {
    const obj = new PIXI.Graphics();
    obj.lineStyle(2, _styles.lineColor, 1);
    obj.beginFill(_styles.fillColor);
    drawMethod(obj);
    obj.endFill();
    app.stage.addChild(obj);
    return obj;
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
    drawLine(x, y, x2, y2) {
      return _drawWithFill((obj) => {
        obj.moveTo(0, 0);
        obj.lineTo(x2, y2);
        obj.position.set(x, y);
        obj.closePath();
      });
    },
    drawRect(x, y, width, height) {
      return _drawWithFill((obj) => {
        obj.drawRect(0, 0, width, height);
        obj.pivot.set(width / 2, height / 2);
        obj.position.set(x, y);
      });
    },
    drawCircle(x, y, radius) {
      return _drawWithFill((obj) => {
        obj.drawCircle(0, 0, radius);
        obj.pivot.set(radius / 2, radius / 2);
        obj.position.set(x, y);
      });
    },
  };
})();
