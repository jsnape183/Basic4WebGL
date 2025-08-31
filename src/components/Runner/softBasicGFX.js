/*app.renderer.plugins.interaction.on("pointerdown", (e) => {
  main_onpointerdown(e.target?.children[0]);
});

app.renderer.plugins.interaction.on("pointermove", (e) => {
  main_onpointermove(e.data.global.x, e.data.global.y);
});*/

class _SoftBasicGfx {
  static instance = null;
  static createInstance(sbClasses) {
    this.instance = new _SoftBasicGfx(sbClasses);
  }
  static getInstance() {
    if (!this.instance) {
      this.instance = new _SoftBasicGfx([]);
    }
    return this.instance;
  }

  _sbClasses = [];
  _keys = {};

  _textStyles = new PIXI.TextStyle({
    fontFamily: 'Arial',
    fontSize: 36,
    fontStyle: 'italic',
    fontWeight: 'bold',
    fill: '#ffffff', // gradient
    stroke: '#4a1850',
    strokeThickness: 5,
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
    wordWrap: true,
    wordWrapWidth: 440,
    lineJoin: 'round',
  });

  _graphicsStyles = {
    fillColor: 0xffffff,
    lineColor: 0xffffff,
  };

  constructor(sbClasses) {
    this._sbClasses = sbClasses;
    this._sbClasses.forEach((c) => (c.enabled = false));
  }

  _update(delta) {
    this._sbClasses.forEach((c) => {
      if (c.symbol.onupdate && c.enabled) {
        c.symbol.onupdate(delta);
      }
    });
  }

  _componentToHex() {
    var hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }

  _drawWithFill(drawMethod) {
    let obj = new PIXI.Graphics();
    obj.lineStyle(2, this._graphicsStyles.lineColor, 1);
    obj.beginFill(this._graphicsStyles.fillColor);
    drawMethod(obj);
    obj.endFill();
    app.stage.addChild(obj);
    return obj;
  }

  registerNode(s) {
    const sbClass = this._sbClasses.findIndex(
      (c) => c.name === s.toLowerCase()
    );
    if (sbClass < 0) {
      throw Error(`Node class ${s} not found`);
    }
    this._sbClasses[sbClass].enabled = true;
  }

  clear() {
    app.stage.clear();
  }

  setFillColor(r, g, b) {
    const hexString = componentToHex(r) + componentToHex(g) + componentToHex(b);
    graphicsStyles.fillColor = parseInt(hexString.replace(/^#/, ''), 16);
  }

  setLineColor(r, g, b) {
    const hexString = componentToHex(r) + componentToHex(g) + componentToHex(b);
    graphicsStyles.lineColor = parseInt(hexString.replace(/^#/, ''), 16);
  }

  setAlpha(obj, a) {
    obj.alpha = a;
  }

  text(str, x, y) {
    const richText = new PIXI.Text(str, this._textStyles);
    richText.x = x;
    richText.y = y;

    app.stage.addChild(richText);
    return richText;
  }

  drawLine(x, y, x2, y2) {
    const obj = drawWithFill((obj) => {
      obj.moveTo(0, 0);
      obj.lineTo(x2, y2);
      obj.position.set(x, y);
      obj.closePath();
    });
    return obj;
  }

  drawRect(x, y, width, height) {
    const obj = drawWithFill((obj) => {
      obj.drawRect(0, 0, width, height);
      obj.pivot.set(width / 2, height / 2);
      obj.position.set(x, y);
    });
    return obj;
  }

  drawCircle(x, y, radius) {
    let obj = drawWithFill((obj) => {
      obj.drawCircle(0, 0, radius);
      obj.pivot.set(radius / 2, radius / 2);
      obj.position.set(x, y);
    });
    return obj;
  }

  setAngle(obj, angle) {
    obj.angle = angle;
  }

  setPosition(obj, x, y) {
    obj.position.set(x, y);
  }

  getPosition(obj) {
    //console.log(obj.position);
    return obj.position;
  }

  setText(obj, text) {
    obj.text = text;
    obj.updateText();
  }

  boxCollide(a, b) {
    var ab = a.getBounds();
    var bb = b.getBounds();
    return (
      ab.x + ab.width > bb.x &&
      ab.x < bb.x + bb.width &&
      ab.y + ab.height > bb.y &&
      ab.y < bb.y + bb.height
    );
  }

  getKeyDown(keyCode) {
    return Boolean(this._keys[keyCode]);
  }

  registerKey(keyCode, down) {
    this._keys[keyCode] = down;
  }

  addStageChild(obj) {
    this.getStage().addChild(obj);
  }

  getStage() {
    return this.getApp().stage;
  }

  getApp() {
    return app;
  }
  getEngine() {
    return PIXI;
  }
}

//const _sb = new _softBasicGfx();

document.addEventListener('keydown', (e) => {
  _sb.registerKey(e.keyCode, true);
  onkeydown(e.keyCode);
});
document.addEventListener('keyup', (e) => {
  _sb.registerKey(e.keyCode, false);
  onkeydown(e.keyCode);
});
