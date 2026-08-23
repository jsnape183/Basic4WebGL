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
    const originalParent = this._originalParents.get(childHandle);
    if (!originalParent) return;
    originalParent.addChild(childHandle);
    this._originalParents.delete(childHandle);
  },
};
