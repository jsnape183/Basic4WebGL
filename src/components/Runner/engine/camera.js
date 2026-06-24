const _sbCamera = {
  _camX: 0,
  _camY: 0,
  _followTarget: null,
  _followSpeed: 0,
  _boundsW: null,
  _boundsH: null,

  cameraFollow(target, speed) {
    this._followTarget = target;
    this._followSpeed = speed;
  },

  cameraSetPosition(x, y) {
    this._followTarget = null;
    this._camX = x;
    this._camY = y;
  },

  cameraSetBounds(w, h) {
    this._boundsW = w;
    this._boundsH = h;
  },

  cameraX() { return this._camX; },
  cameraY() { return this._camY; },

  _cameraUpdate() {
    if (this._followTarget) {
      const sw = app.renderer.width;
      const sh = app.renderer.height;
      const desiredX = this._followTarget._handle.position.x - sw / 2;
      const desiredY = this._followTarget._handle.position.y - sh / 2;
      if (this._followSpeed === 0) {
        this._camX = desiredX;
        this._camY = desiredY;
      } else {
        this._camX += (desiredX - this._camX) * this._followSpeed;
        this._camY += (desiredY - this._camY) * this._followSpeed;
      }
    }
    if (this._boundsW !== null) {
      const sw = app.renderer.width;
      const sh = app.renderer.height;
      this._camX = Math.max(0, Math.min(this._boundsW - sw, this._camX));
      this._camY = Math.max(0, Math.min(this._boundsH - sh, this._camY));
    }
    worldContainer.position.set(-this._camX, -this._camY);
  },

  _cameraReset() {
    this._camX = 0;
    this._camY = 0;
    this._followTarget = null;
    this._followSpeed = 0;
    this._boundsW = null;
    this._boundsH = null;
    worldContainer.position.set(0, 0);
  },
};
