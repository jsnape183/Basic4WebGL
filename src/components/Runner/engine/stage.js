const _sbStage = {
  addToStage(obj) {
    app.stage.addChild(obj._handle);
    if (!_sbLifecycle._sbInstances.includes(obj)) {
      _sbLifecycle._sbInstances.push(obj);
    }
  },
  removeFromStage(obj) {
    app.stage.removeChild(obj._handle);
    _sbLifecycle._sbInstances = _sbLifecycle._sbInstances.filter((i) => i !== obj);
  },
  clear() {
    app.stage.removeChildren();
    _sbLifecycle._sbInstances = [];
  },
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
