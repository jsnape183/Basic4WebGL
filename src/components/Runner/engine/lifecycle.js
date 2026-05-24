const _sbLifecycle = {
  _sbClasses: [],
  _update(delta) {
    this._sbClasses.forEach((c) => {
      if (c.symbol.onupdate) {
        c.symbol.onupdate(delta);
      }
    });
  },
};
