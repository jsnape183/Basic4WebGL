const _sbInput = {
  _keys: {},
  _justPressed: {},
  _justReleased: {},
  _mouseX: 0,
  _mouseY: 0,
  _mouseDown: false,
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
