let app = new PIXI.Application({ width: 640, height: 360 });
app.stage.interactive = true;

document.body.appendChild(app.view);
app.view.focus();

app.renderer.plugins.interaction.on("pointerdown", (e) => {
  main_onpointerdown(e.target?.children[0]);
});

app.renderer.plugins.interaction.on("pointermove", (e) => {
  main_onpointermove(e.data.global.x, e.data.global.y);
});

app.ticker.add((delta) => main_onupdate(delta));

const _softBasicGfx = () => {
  const keys = {};

  const textStyles = new PIXI.TextStyle({
    fontFamily: "Arial",
    fontSize: 36,
    fontStyle: "italic",
    fontWeight: "bold",
    fill: ["#ffffff", "#00ff99"], // gradient
    stroke: "#4a1850",
    strokeThickness: 5,
    dropShadow: true,
    dropShadowColor: "#000000",
    dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
    wordWrap: true,
    wordWrapWidth: 440,
    lineJoin: "round",
  });

  const graphicsStyles = {
    fillColor: 0xffffff,
    lineColor: 0xffffff,
  };

  const componentToHex = (c) => {
    var hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  const drawWithFill = (drawMethod) => {
    let obj = new PIXI.Graphics();
    obj.lineStyle(2, graphicsStyles.lineColor, 1);
    obj.beginFill(graphicsStyles.fillColor);
    drawMethod(obj);
    obj.endFill();
    app.stage.addChild(obj);
    return obj;
  };

  return {
    setFillColor: (r, g, b) => {
      const hexString =
        componentToHex(r) + componentToHex(g) + componentToHex(b);
      graphicsStyles.fillColor = parseInt(hexString.replace(/^#/, ""), 16);
    },
    setLineColor: (r, g, b) => {
      const hexString =
        componentToHex(r) + componentToHex(g) + componentToHex(b);
      graphicsStyles.lineColor = parseInt(hexString.replace(/^#/, ""), 16);
    },
    setAlpha: (obj, a) => {
      obj.alpha = a;
    },
    text: (str, x, y) => {
      const richText = new PIXI.Text(str, textStyles);
      richText.x = x;
      richText.y = y;

      app.stage.addChild(richText);
      return richText;
    },
    drawLine: (x, y, x2, y2) => {
      const obj = drawWithFill((obj) => {
        obj.moveTo(0, 0);
        obj.lineTo(x2, y2);
        obj.position.set(x, y);
        obj.closePath();
      });
      return obj;
    },
    drawRect: (x, y, width, height) => {
      const obj = drawWithFill((obj) => {
        console.log({ x, y });
        obj.drawRect(0, 0, width, height);
        obj.pivot.set(width / 2, height / 2);
        obj.position.set(x, y);
      });
      return obj;
    },
    drawCircle: (x, y, radius) => {
      let obj = drawWithFill((obj) => {
        obj.drawCircle(0, 0, radius);
        obj.pivot.set(radius / 2, radius / 2);
        obj.position.set(x, y);
      });
      return obj;
    },
    setAngle: (obj, angle) => {
      obj.angle = angle;
    },
    setPosition: (obj, x, y) => {
      obj.position.set(x, y);
    },
    getPosition: (obj) => {
      //console.log(obj.position);
      return obj.position;
    },
    setText: (obj, text) => {
      obj.text = text;
      obj.updateText();
    },
    boxCollide: (a, b) => {
      var ab = a.getBounds();
      var bb = b.getBounds();
      return (
        ab.x + ab.width > bb.x &&
        ab.x < bb.x + bb.width &&
        ab.y + ab.height > bb.y &&
        ab.y < bb.y + bb.height
      );
    },
    getKeyDown: (keyCode) => Boolean(keys[keyCode]),
    registerKey: (keyCode, down) => {
      keys[keyCode] = down;
    },
    App: app,
    Pixi: PIXI,
  };
};

const _sb = _softBasicGfx();

document.addEventListener("keydown", (e) => {
  _sb.registerKey(e.keyCode, true);
  onkeydown(e.keyCode);
});
document.addEventListener("keyup", (e) => {
  _sb.registerKey(e.keyCode, false);
  onkeydown(e.keyCode);
});
