const _sbScene = {
  _scenes: {},
  _activeScene: null,
  _pendingSwitch: null,

  sceneRegister(name, obj) {
    this._scenes[name] = obj;
  },

  sceneSwitch(name) {
    if (!this._scenes[name]) throw new Error(`Scene not found: "${name}"`);
    this._pendingSwitch = name;
  },

  _applySwitch() {
    if (!this._pendingSwitch) return;
    const name = this._pendingSwitch;
    this._pendingSwitch = null;
    if (this._activeScene && this._activeScene.onexit) {
      try { this._activeScene.onexit(); } catch(e) { _throwError(e); }
    }
    this.clear();
    this._activeScene = this._scenes[name];
    if (this._activeScene && this._activeScene.onenter) {
      try { this._activeScene.onenter(); } catch(e) { _throwError(e); }
    }
  },

  _sceneKeyDown(keyCode) {
    if (this._activeScene && this._activeScene.onkeydown) {
      try { this._activeScene.onkeydown(keyCode); } catch(e) { _throwError(e); }
    }
  },

  _sceneKeyUp(keyCode) {
    if (this._activeScene && this._activeScene.onkeyup) {
      try { this._activeScene.onkeyup(keyCode); } catch(e) { _throwError(e); }
    }
  },

  _update(delta) {
    _sbLifecycle._update.call(this, delta);
    if (this._activeScene && this._activeScene.onupdate) {
      try { this._activeScene.onupdate(delta); } catch(e) { _throwError(e); }
    }
    this._applySwitch();
    this._cameraUpdate(delta);
    this._pathfindingUpdate(delta);
    this._tweenUpdate(delta);
    this._resetFrameInput();
  },
};
