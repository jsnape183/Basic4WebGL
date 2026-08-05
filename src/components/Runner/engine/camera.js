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
  _zoom: 1,

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

  cameraSetZoom(z) {
    this._zoom = z;
  },
  cameraZoom() { return this._zoom; },

  cameraShake(intensity, duration) {
    this._shakeIntensity = intensity;
    this._shakeDuration = duration;
    this._shakeElapsed = 0;
  },

  _cameraUpdate(delta) {
    if (this._followTarget) {
      const visibleW = app.renderer.width / this._zoom;
      const visibleH = app.renderer.height / this._zoom;
      const desiredX = this._followTarget._handle.position.x - visibleW / 2;
      const desiredY = this._followTarget._handle.position.y - visibleH / 2;
      if (this._followSpeed === 0) {
        this._camX = desiredX;
        this._camY = desiredY;
      } else {
        this._camX += (desiredX - this._camX) * this._followSpeed;
        this._camY += (desiredY - this._camY) * this._followSpeed;
      }
    }
    if (this._boundsW !== null) {
      const visibleW = app.renderer.width / this._zoom;
      const visibleH = app.renderer.height / this._zoom;
      this._camX = Math.max(0, Math.min(this._boundsW - visibleW, this._camX));
      this._camY = Math.max(0, Math.min(this._boundsH - visibleH, this._camY));
    }

    let shakeX = 0;
    let shakeY = 0;
    if (this._shakeElapsed < this._shakeDuration) {
      // `delta` is milliseconds (the same value onupdate receives) and
      // cameraShake's `duration` is documented in seconds, so convert with
      // /1000. This read `/ 60` back when the frame loop was wired to PIXI's
      // frame-normalised ticker.deltaTime, where 1.0 per frame / 60 happened to
      // come out in seconds.
      this._shakeElapsed += (delta || 0) / 1000;
      const remaining = Math.max(0, 1 - this._shakeElapsed / this._shakeDuration);
      const magnitude = this._shakeIntensity * remaining;
      shakeX = (Math.random() * 2 - 1) * magnitude;
      shakeY = (Math.random() * 2 - 1) * magnitude;
    }

    worldContainer.scale.set(this._zoom, this._zoom);
    worldContainer.position.set(
      -this._camX * this._zoom + shakeX,
      -this._camY * this._zoom + shakeY
    );
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
    this._zoom = 1;
    worldContainer.scale.set(1, 1);
    worldContainer.position.set(0, 0);
  },
};
