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

  _prevCamX: 0,
  _prevCamY: 0,
  // Set by cameraSetPosition. A camera.setPosition is a hard cut — Dungeon
  // Explorer uses it for instant room transitions — so it must never render as
  // a glide from the old room to the new one.
  _camSnap: false,
  // The last shake offset computed by _cameraUpdate. Shake is random jitter,
  // so there is nothing meaningful to interpolate; it is simply added on top
  // of the interpolated camera position at render time.
  _shakeX: 0,
  _shakeY: 0,

  cameraFollow(target, speed) {
    this._followTarget = target;
    this._followSpeed = speed;
  },

  cameraSetPosition(x, y) {
    this._followTarget = null;
    this._camX = x;
    this._camY = y;
    this._camSnap = true;
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

  // Records the pre-step camera position, mirroring _sbFrameLoop._snapshot for
  // sprites. Called from there at the top of every fixed step.
  _cameraSnapshot() {
    this._prevCamX = this._camX;
    this._prevCamY = this._camY;
  },

  // ONE fixed simulation step of camera state. Updates _camX/_camY and the
  // shake offset; deliberately does NOT touch worldContainer — that is
  // _cameraApply's job, once per rendered frame.
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

    this._shakeX = 0;
    this._shakeY = 0;
    if (this._shakeElapsed < this._shakeDuration) {
      // `delta` is milliseconds (the same value onupdate receives) and
      // cameraShake's `duration` is documented in seconds, so convert with
      // /1000. This read `/ 60` back when the frame loop was wired to PIXI's
      // frame-normalised ticker.deltaTime, where 1.0 per frame / 60 happened to
      // come out in seconds.
      this._shakeElapsed += (delta || 0) / 1000;
      const remaining = Math.max(0, 1 - this._shakeElapsed / this._shakeDuration);
      const magnitude = this._shakeIntensity * remaining;
      this._shakeX = (Math.random() * 2 - 1) * magnitude;
      this._shakeY = (Math.random() * 2 - 1) * magnitude;
    }
  },

  // Writes the camera to worldContainer for one rendered frame, blending
  // between the last two simulation samples. A hard cut (cameraSetPosition)
  // renders at the destination and clears its own flag.
  _cameraApply(alpha) {
    let x = this._camX;
    let y = this._camY;
    if (this._camSnap) {
      this._camSnap = false;
    } else {
      const a = alpha === undefined ? 1 : alpha;
      x = this._prevCamX + (this._camX - this._prevCamX) * a;
      y = this._prevCamY + (this._camY - this._prevCamY) * a;
    }
    worldContainer.scale.set(this._zoom, this._zoom);
    worldContainer.position.set(
      -x * this._zoom + this._shakeX,
      -y * this._zoom + this._shakeY
    );
  },

  // Puts worldContainer back on the authoritative camera position after the
  // render. Everything that reads global coordinates during a fixed step —
  // anything going through PIXI's getBounds(), i.e. spriteCollide, pointInBox,
  // raycast — then sees exactly the coordinate space it saw before
  // interpolation existed, rather than a value that drifts with frame timing.
  _cameraRestore() {
    worldContainer.position.set(
      -this._camX * this._zoom + this._shakeX,
      -this._camY * this._zoom + this._shakeY
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
    this._prevCamX = 0;
    this._prevCamY = 0;
    // A scene switch is the hardest cut there is — never render the first
    // frame of the new scene as a glide out of the old one's camera.
    this._camSnap = true;
    this._shakeX = 0;
    this._shakeY = 0;
    worldContainer.scale.set(1, 1);
    worldContainer.position.set(0, 0);
  },
};
