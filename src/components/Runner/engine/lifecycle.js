const _sbLifecycle = {
  _sbClasses: [],
  _sbInstances: [],
  _deferredModuleBodies: [],

  // Two-phase module initialisation.
  //
  // The transpiler emits a module's inert declarations (the module object
  // itself, class declarations, function/method assignments) inline, but wraps
  // that module's own top-level statements in a call to _deferModuleBody. That
  // lets the whole transpiled block run *before* assets are preloaded — which
  // is what makes `oninit` possible — while the statements themselves, which
  // may create sprites and therefore need assets, still run afterwards.
  //
  // Bodies replay in registration order, which is file order, matching the
  // order they would have executed in when they were emitted inline.
  _deferModuleBody(fn) {
    this._deferredModuleBodies.push(fn);
  },

  _runModuleBodies() {
    const bodies = this._deferredModuleBodies;
    this._deferredModuleBodies = [];
    // Deliberately unguarded: a throwing top-level statement should abort the
    // boot sequence and surface through the bootstrapper's outer try/catch,
    // exactly as it did when these statements ran inline.
    bodies.forEach((body) => body());
  },

  // Fires before asset preloading, so `oninit` can configure the runtime while
  // there are still no textures. Mirrors the onenter loop: every module that
  // defines the hook gets it, modules that don't are skipped.
  _fireInit() {
    this._sbClasses.forEach((c) => {
      if (c.symbol.oninit) {
        try {
          c.symbol.oninit();
        } catch (e) {
          _throwError(e);
        }
      }
    });
  },

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
