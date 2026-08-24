const _sb = {
  ..._sbLifecycle,
  ..._sbScene,
  ..._sbInput,
  ..._sbAssets,
  ..._sbFile,
  ..._sbSave,
  ..._sbAudio,
  ..._sbDrawing,
  ..._sbStage,
  ..._sbCamera,
  ..._sbSprites,
  ..._sbAnimatedSprites,
  ..._sbTilemaps,
  ..._sbCollision,
  ..._sbPathfinding,
  ..._sbTween,
  ..._sbAttach,
  // Last on purpose. _sbFrameLoop supplies `_update`, the single per-frame
  // entry point, and it must win over the same-named members _sbLifecycle and
  // _sbScene still carry (both are now called explicitly rather than through
  // `_sb._update`, but a spread-order change would silently repoint the ticker
  // at one of them and disable fixed stepping entirely).
  ..._sbFrameLoop,
};
