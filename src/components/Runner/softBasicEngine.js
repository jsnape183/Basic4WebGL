const _sb = {
  ..._sbLifecycle,
  ..._sbInput,
  ..._sbAssets,
  ..._sbDrawing,
  ..._sbStage,
  ..._sbSprites,
};

document.addEventListener('keydown', (e) => {
  _sb.registerKey(e.keyCode, true);
  onkeydown(e.keyCode);
});
document.addEventListener('keyup', (e) => {
  _sb.registerKey(e.keyCode, false);
  onkeyup(e.keyCode);
});
