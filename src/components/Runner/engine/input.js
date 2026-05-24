const _sbInput = {
  _keys: {},
  getKeyDown(keyCode) {
    return Boolean(this._keys[keyCode]);
  },
  registerKey(keyCode, down) {
    this._keys[keyCode] = down;
  },
};
