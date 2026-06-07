const _sbInput = {
  _keys: {},
  _mouseX: 0,
  _mouseY: 0,
  _mouseDown: false,
  getKeyDown(keyCode) {
    return Boolean(this._keys[keyCode]);
  },
  registerKey(keyCode, down) {
    this._keys[keyCode] = down;
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
