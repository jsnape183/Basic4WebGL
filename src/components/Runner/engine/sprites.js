const _sbSprites = {
  createSprite(imagePath) {
    const texture = _sbAssets.get(imagePath);
    return new PIXI.Sprite(texture);
  },
  setPosition(obj, x, y) {
    obj.position.set(x, y);
  },
  getPositionX(obj) {
    return obj.position.x;
  },
  getPositionY(obj) {
    return obj.position.y;
  },
  setAngle(obj, angle) {
    obj.angle = angle;
  },
  setAlpha(obj, a) {
    obj.alpha = a;
  },
  setScale(obj, sx, sy) {
    obj.scale.set(sx, sy);
  },
  setFlip(obj, h, v) {
    obj.scale.x = h ? -Math.abs(obj.scale.x) : Math.abs(obj.scale.x);
    obj.scale.y = v ? -Math.abs(obj.scale.y) : Math.abs(obj.scale.y);
  },
  setVisible(obj, v) {
    obj.visible = v;
  },
  setTexture(obj, path) {
    obj.texture = _sbAssets.get(path);
  },
  getSpriteWidth(obj) {
    return obj.width;
  },
  getSpriteHeight(obj) {
    return obj.height;
  },
  createText(content, x, y) {
    const textStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 36,
      fontStyle: 'italic',
      fontWeight: 'bold',
      fill: '#ffffff',
      stroke: { color: '#4a1850', width: 5 },
      dropShadow: {
        color: '#000000',
        blur: 4,
        angle: Math.PI / 6,
        distance: 6,
      },
      wordWrap: true,
      wordWrapWidth: 440,
      lineJoin: 'round',
    });
    const text = new PIXI.Text({ text: content, style: textStyle });
    text.x = x;
    text.y = y;
    return text;
  },
  setText(obj, text) {
    obj.text = text;
  },
  boxCollide(a, b) {
    const ab = a.getBounds();
    const bb = b.getBounds();
    return (
      ab.x + ab.width > bb.x &&
      ab.x < bb.x + bb.width &&
      ab.y + ab.height > bb.y &&
      ab.y < bb.y + bb.height
    );
  },
};
