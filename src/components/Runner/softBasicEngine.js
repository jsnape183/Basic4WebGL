const _sb = {
  ..._sbLifecycle,
  ..._sbInput,
  ..._sbAssets,
  ..._sbDrawing,
  ..._sbStage,
  ..._sbSprites,
};

_sb._initMouse(app.canvas || app.view);

document.addEventListener('keydown', (e) => {
  _sb.registerKey(e.keyCode, true);
  onkeydown(e.keyCode);
});
document.addEventListener('keyup', (e) => {
  _sb.registerKey(e.keyCode, false);
  onkeyup(e.keyCode);
});
