const _sbLifecycle = {
  _sbClasses: [],
  _sbInstances: [],
  _update(delta) {
    this._sbClasses.forEach((c) => {
      if (c.symbol.onupdate) {
        try {
          c.symbol.onupdate(delta);
        } catch (e) {
          _throwError(e);
        }
      }
    });
    this._sbInstances.forEach((inst) => {
      if (inst.onupdate) {
        try {
          inst.onupdate(delta);
        } catch (e) {
          _throwError(e);
        }
      }
    });
  },
};
