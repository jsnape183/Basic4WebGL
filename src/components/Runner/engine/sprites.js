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
  createText(content, x, y) {
    const textStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 36,
      fontStyle: 'italic',
      fontWeight: 'bold',
      fill: '#ffffff',
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
    const text = new PIXI.Text(content, textStyle);
    text.x = x;
    text.y = y;
    return text;
  },
  setText(obj, text) {
    obj.text = text;
    obj.updateText();
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
