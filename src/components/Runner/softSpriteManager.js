class _SoftSprite {
  _ref = null;
  constructor(texture) {
    const engine = _SoftBasicGfx.getInstance().getEngine();
    this._ref = new engine.Sprite(texture);
  }

  getRef() {
    return this._ref;
  }
}

class _SoftSpriteManager {
  static _sprites = new Map(); // name -> PIXI.Sprite

  constructor() {}

  static create(name, texture) {
    if (this._sprites.has(name)) {
      throw Error(`Sprite with name "${name}" already exists`);
    }
    const sprite = new _SoftSprite(texture);
    this._sprites.set(name, sprite);
    _SoftBasicGfx.getInstance().addStageChild(sprite.getRef());
    return sprite;
  }

  static get(name) {
    if (!this._sprites.has(name)) {
      throw Error(`Sprite with name "${name}" not found`);
    }
    return this._sprites.get(name);
  }

  static remove(name) {
    if (this._sprites.has(name)) {
      const sprite = this._sprites.get(name);
      _SoftBasicGfx.getInstance().getStage().removeChild(sprite);
      this._sprites.delete(name);
    }
  }

  static clear() {
    this._sprites.forEach((sprite) => {
      _SoftBasicGfx.getInstance().getStage().removeChild(sprite);
    });
    this._sprites.clear();
  }
}
