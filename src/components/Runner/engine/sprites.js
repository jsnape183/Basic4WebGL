const _sbSprites = {
  createSprite(imagePath) {
    const texture = _sbAssets.get(imagePath);
    return new PIXI.Sprite(texture);
  },
  // setPosition is BOTH softBASIC's movement primitive (the tutorials teach
  // `setPosition(x + speed * delta / 1000, y)` inside onupdate) and its
  // teleport primitive (spawning, room transitions, respawns). Interpolation
  // has to treat those differently, and the frame loop's _inFixedStep flag
  // separates them exactly: game state only advances inside a fixed step, so a
  // setPosition issued anywhere else — module top-level, oninit, onenter, a key
  // handler — is by definition a placement, not motion, and must render at its
  // destination rather than smearing there. Teleports issued from *inside* a
  // step are caught separately by _sbFrameLoop.MAX_INTERP_STEP_PX.
  setPosition(obj, x, y) {
    obj.position.set(x, y);
    if (!this._inFixedStep) obj._sbNoInterp = true;
  },
  getPositionX(obj) {
    return obj.position.x;
  },
  getPositionY(obj) {
    return obj.position.y;
  },
  setVelocity(obj, vx, vy) {
    obj._sbVelocityX = Number(vx);
    obj._sbVelocityY = Number(vy);
  },
  getVelocityX(obj) {
    return obj._sbVelocityX || 0;
  },
  getVelocityY(obj) {
    return obj._sbVelocityY || 0;
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
  setDepth(obj, n) {
    obj.zIndex = n;
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
  setTextStyle(obj, size, r, g, b) {
    obj.style.fontSize = size;
    obj.style.fill = `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  },
  setTextFont(obj, fontFamily) {
    obj.style.fontFamily = fontFamily;
  },
  setTextAlign(obj, align) {
    obj.style.align = align;
  },
};
