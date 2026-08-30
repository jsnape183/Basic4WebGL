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

  _pollGamepads() {
    const pads =
      (typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function')
        ? navigator.getGamepads()
        : [];
    let pad = null;
    for (let i = 0; i < pads.length; i++) {
      if (pads[i]) { pad = pads[i]; break; }
    }
    this._padConnected = pad != null;

    if (!pad) {
      this._padButtons = [];
      this._padAxisHalves = [0, 0, 0, 0, 0, 0, 0, 0];
    } else {
      this._padButtons = Array.from(pad.buttons, (b) => ({
        pressed: !!b.pressed,
        value: typeof b.value === 'number' ? b.value : (b.pressed ? 1 : 0),
      }));

      const dz = this._deadzone;
      const rescale = (x) => {
        const m = Math.min(Math.max(x - dz, 0), 1);
        return dz < 1 ? m / (1 - dz) : m;
      };
      const ax = pad.axes || [];
      const lx = ax[0] || 0, ly = ax[1] || 0, rx = ax[2] || 0, ry = ax[3] || 0;
      this._padAxisHalves = [
        rescale(-lx), rescale(lx),
        rescale(-ly), rescale(ly),
        rescale(-rx), rescale(rx),
        rescale(-ry), rescale(ry),
      ];
    }

    const nButtons = Math.max(this._padButtons.length, this._padButtonsPrev.length);
    for (let i = 0; i < nButtons; i++) {
      const cur = this._padButtons[i];
      const now = cur ? cur.pressed : false;
      const prev = this._padButtonsPrev[i];
      const was = prev ? prev.pressed : false;
      if (now && !was) this._justPressed['b' + i] = true;
      if (!now && was) this._justReleased['b' + i] = true;
    }
    for (let i = 0; i < 8; i++) {
      const now = this._padAxisHalves[i] >= this._axisThreshold;
      const was = (this._padAxisHalvesPrev[i] || 0) >= this._axisThreshold;
      if (now && !was) this._justPressed['h' + i] = true;
      if (!now && was) this._justReleased['h' + i] = true;
    }
  },

  _digital(action) {
    const list = this._actions[action];
    if (!list) return false;
    for (let i = 0; i < list.length; i++) {
      const src = list[i];
      if (src.device === 'key') {
        if (this._keys[src.code]) return true;
      } else if (src.device === 'button') {
        const b = this._padButtons[src.code];
        if (b && b.pressed) return true;
      } else if (src.device === 'axis') {
        if ((this._padAxisHalves[src.code] || 0) >= this._axisThreshold) return true;
      }
    }
    return false;
  },

  held(action) {
    return this._digital(action);
  },

  pressed(action) {
    const list = this._actions[action];
    if (!list) return false;
    for (let i = 0; i < list.length; i++) {
      const src = list[i];
      if (src.device === 'key') {
        if (this._justPressed[src.code]) return true;
      } else if (src.device === 'button') {
        if (this._justPressed['b' + src.code]) return true;
      } else if (src.device === 'axis') {
        if (this._justPressed['h' + src.code]) return true;
      }
    }
    return false;
  },

  released(action) {
    const list = this._actions[action];
    if (!list) return false;
    for (let i = 0; i < list.length; i++) {
      const src = list[i];
      if (src.device === 'key') {
        if (this._justReleased[src.code]) return true;
      } else if (src.device === 'button') {
        if (this._justReleased['b' + src.code]) return true;
      } else if (src.device === 'axis') {
        if (this._justReleased['h' + src.code]) return true;
      }
    }
    return false;
  },

  _resetFrameInput() {
    this._justPressed = {};
    this._justReleased = {};
    this._padButtonsPrev = this._padButtons;
    this._padAxisHalvesPrev = this._padAxisHalves;
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
