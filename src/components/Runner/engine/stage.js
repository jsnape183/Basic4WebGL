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
};
