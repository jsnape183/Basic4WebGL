const _sbAttach = {
  // childHandle -> the PIXI container it lived in before its first attachTo() call
  _originalParents: new Map(),

  attachSprite(childHandle, parentObj) {
    if (!childHandle || !parentObj || !parentObj._handle) return;
    if (!this._originalParents.has(childHandle)) {
      this._originalParents.set(childHandle, childHandle.parent);
    }
    parentObj._handle.addChild(childHandle);
  },

  detachSprite(childHandle) {
    // A falsy `.has()`-free check here would wrongly treat "attached before
    // ever being added to world/hud" (a legitimate null original parent) the
    // same as "never attached at all", silently no-oping forever and leaking
    // the map entry. `.has()` distinguishes the two.
    if (!this._originalParents.has(childHandle)) return;
    const originalParent = this._originalParents.get(childHandle);
    this._originalParents.delete(childHandle);
    if (originalParent) {
      originalParent.addChild(childHandle);
    } else if (childHandle.parent) {
      // The sprite had no parent before its first attachTo() (never added to
      // world/hud yet) -- there's nothing to add it back to, so just detach
      // it from whatever it's currently parented under.
      childHandle.parent.removeChild(childHandle);
      childHandle.parent = null;
    }
  },
};
