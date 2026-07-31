const _sbCamera = {
  _camX: 0,
  _camY: 0,
  _followTarget: null,
  _followSpeed: 0,
  _boundsW: null,
  _boundsH: null,
  _shakeIntensity: 0,
  _shakeDuration: 0,
  _shakeElapsed: 0,

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

  cameraShake(intensity, duration) {
    this._shakeIntensity = intensity;
    this._shakeDuration = duration;
    this._shakeElapsed = 0;
  },

  _cameraUpdate(delta) {
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

    let shakeX = 0;
    let shakeY = 0;
    if (this._shakeElapsed < this._shakeDuration) {
      this._shakeElapsed += (delta || 0) / 60;
      const remaining = Math.max(0, 1 - this._shakeElapsed / this._shakeDuration);
      const magnitude = this._shakeIntensity * remaining;
      shakeX = (Math.random() * 2 - 1) * magnitude;
      shakeY = (Math.random() * 2 - 1) * magnitude;
    }

    worldContainer.position.set(-this._camX + shakeX, -this._camY + shakeY);
  },

  _cameraReset() {
    this._camX = 0;
    this._camY = 0;
    this._followTarget = null;
    this._followSpeed = 0;
    this._boundsW = null;
    this._boundsH = null;
    this._shakeIntensity = 0;
    this._shakeDuration = 0;
    this._shakeElapsed = 0;
    worldContainer.position.set(0, 0);
  },
};
