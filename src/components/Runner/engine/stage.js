let worldContainer;
let hudContainer;

const _sbStage = {
  _initStage() {
    worldContainer = new PIXI.Container();
    hudContainer = new PIXI.Container();
    app.stage.addChild(worldContainer);
    app.stage.addChild(hudContainer);
  },

  // ── world ────────────────────────────────────────────────────────────────
  addToWorld(obj) {
    worldContainer.addChild(obj._handle);
    if (!_sbLifecycle._sbInstances.includes(obj)) {
      _sbLifecycle._sbInstances.push(obj);
    }
  },
  removeFromWorld(obj) {
    worldContainer.removeChild(obj._handle);
    _sbLifecycle._sbInstances = _sbLifecycle._sbInstances.filter((i) => i !== obj);
  },
  clearWorld() {
    const worldHandles = new Set(worldContainer.children);
    worldContainer.removeChildren();
    _sbLifecycle._sbInstances = _sbLifecycle._sbInstances.filter(
      (i) => !worldHandles.has(i._handle)
    );
  },

  // ── hud ──────────────────────────────────────────────────────────────────
  addToHud(obj) {
    hudContainer.addChild(obj._handle);
    if (!_sbLifecycle._sbInstances.includes(obj)) {
      _sbLifecycle._sbInstances.push(obj);
    }
  },
  removeFromHud(obj) {
    hudContainer.removeChild(obj._handle);
    _sbLifecycle._sbInstances = _sbLifecycle._sbInstances.filter((i) => i !== obj);
  },
  clearHud() {
    const hudHandles = new Set(hudContainer.children);
    hudContainer.removeChildren();
    _sbLifecycle._sbInstances = _sbLifecycle._sbInstances.filter(
      (i) => !hudHandles.has(i._handle)
    );
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
    _sbLifecycle._sbInstances = [];
    this._cameraReset();
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
};
