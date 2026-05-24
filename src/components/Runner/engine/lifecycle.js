const _sbLifecycle = {
  _sbClasses: [],
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
  },
};
