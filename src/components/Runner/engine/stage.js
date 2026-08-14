let worldContainer;
let hudContainer;

const _sbStage = {
  _initStage() {
    worldContainer = new PIXI.Container();
    worldContainer.sortableChildren = true;
    hudContainer = new PIXI.Container();
    hudContainer.sortableChildren = true;
    app.stage.addChild(worldContainer);
    app.stage.addChild(hudContainer);
  },

  // ── world ────────────────────────────────────────────────────────────────
  addToWorld(obj) {
    worldContainer.addChild(obj._handle);
    if (!this._sbInstances.includes(obj)) {
      this._sbInstances.push(obj);
    }
  },
  removeFromWorld(obj) {
    worldContainer.removeChild(obj._handle);
    this._retainInstances((i) => i !== obj);
  },
  clearWorld() {
    const worldHandles = new Set(worldContainer.children);
    worldContainer.removeChildren();
    this._retainInstances((i) => !worldHandles.has(i._handle));
  },

  // ── hud ──────────────────────────────────────────────────────────────────
  addToHud(obj) {
    hudContainer.addChild(obj._handle);
    if (!this._sbInstances.includes(obj)) {
      this._sbInstances.push(obj);
    }
  },
  removeFromHud(obj) {
    hudContainer.removeChild(obj._handle);
    this._retainInstances((i) => i !== obj);
  },
  clearHud() {
    const hudHandles = new Set(hudContainer.children);
    hudContainer.removeChildren();
    this._retainInstances((i) => !hudHandles.has(i._handle));
  },

  // ── deprecated stage aliases ──────────────────────────────────────────────
  addToStage(obj) {
    this.addToWorld(obj);
  },
  removeFromStage(obj) {
    this.removeFromWorld(obj);
  },

  // ── full clear (used by scene switch) ────────────────────────────────────
  clear() {
    worldContainer.removeChildren();
    hudContainer.removeChildren();
    // Emptied in place, never replaced — see _retainInstances in lifecycle.js.
    this._sbInstances.length = 0;
    this._cameraReset();
    this._pathfindingReset();
    this._tileCollisionReset();
  },

  // ── canvas info ───────────────────────────────────────────────────────────
  getStageWidth() {
    return app.renderer.width;
  },
  getStageHeight() {
    return app.renderer.height;
  },
  setBackground(r, g, b) {
    app.renderer.background.color = (r << 16) | (g << 8) | b;
  },
  setPixelPerfect(v) {
    // Only affects textures created after this call — call from oninit(),
    // before asset preload, so every texture picks it up from the start.
    PIXI.TextureStyle.defaultOptions.scaleMode = v ? 'nearest' : 'linear';
  },
};
