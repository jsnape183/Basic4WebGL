const _sbAttach = {
  // childHandle -> the PIXI container it lived in before its first attachTo() call
  _originalParents: new Map(),

  attachSprite(childHandle, parentObj) {
    if (!childHandle || !parentObj || !parentObj._handle) return;
    if (!this._originalParents.has(childHandle)) {
      this._originalParents.set(childHandle, childHandle.parent);
    }
    // Remove from current parent if needed (in case parentObj._handle.addChild doesn't)
    const currentParent = childHandle.parent;
    if (currentParent && currentParent.children && currentParent !== parentObj._handle) {
      const index = currentParent.children.indexOf(childHandle);
      if (index !== -1) {
        currentParent.children.splice(index, 1);
      }
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
