const _sbInput = {
  _keys: {},
  _justPressed: {},
  _justReleased: {},
  _mouseX: 0,
  _mouseY: 0,
  _mouseDown: false,
  // ── Action map (bind + query) ──────────────────────────────────────────────
  // _actions: { actionName: [ { device: "key"|"button"|"axis", code: number } ] }
  _actions: {},
  _deadzone: 0.15,
  _axisThreshold: 0.5, // analog -> digital crossover, fixed
  _padButtons: [],        // current poll: [{ pressed, value }]
  _padButtonsPrev: [],    // previous poll, for edge detection
  _padAxisHalves: [0, 0, 0, 0, 0, 0, 0, 0],     // 8 deadzoned 0..1 strengths
  _padAxisHalvesPrev: [0, 0, 0, 0, 0, 0, 0, 0],
  _padConnected: false,
  getKeyDown(keyCode) {
    return Boolean(this._keys[keyCode]);
  },
  keyPressed(keyCode) {
    return Boolean(this._justPressed[keyCode]);
  },
  keyReleased(keyCode) {
    return Boolean(this._justReleased[keyCode]);
  },
  registerKey(keyCode, down) {
    if (down && !this._keys[keyCode]) this._justPressed[keyCode] = true;
    if (!down && this._keys[keyCode]) this._justReleased[keyCode] = true;
    this._keys[keyCode] = down;
  },
  bind(action, device, code) {
    if (device !== 'key' && device !== 'button' && device !== 'axis') {
      throw new Error(
        `input.bind: unknown device "${device}" — expected "key", "button", or "axis"`
      );
    }
    if (!this._actions[action]) this._actions[action] = [];
    this._actions[action].push({ device, code });
  },

  clearBindings(action) {
    this._actions[action] = [];
  },

  setDeadzone(value) {
    this._deadzone = Math.min(Math.max(value, 0), 0.9);
  },

  padConnected() {
    return this._padConnected;
  },

  _resetFrameInput() {
    this._justPressed = {};
    this._justReleased = {};
  },
  getMouseX() {
    return this._mouseX;
  },
  getMouseY() {
    return this._mouseY;
  },
  getMouseDown() {
    return this._mouseDown;
  },
  _initMouse(canvas) {
    canvas.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this._mouseX = e.clientX - rect.left;
      this._mouseY = e.clientY - rect.top;
    });
    canvas.addEventListener('pointerdown', () => {
      this._mouseDown = true;
    });
    canvas.addEventListener('pointerup', () => {
      this._mouseDown = false;
    });
    canvas.addEventListener('pointercancel', () => {
      this._mouseDown = false;
    });
  },
};
