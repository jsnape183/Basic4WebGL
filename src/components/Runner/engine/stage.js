const _sbStage = {
  addToStage(obj) {
    app.stage.addChild(obj._handle);
  },
  removeFromStage(obj) {
    app.stage.removeChild(obj._handle);
  },
  clear() {
    app.stage.removeChildren();
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
