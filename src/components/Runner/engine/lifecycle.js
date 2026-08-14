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

  // Drops every registered instance that fails `predicate`, **in place**.
  //
  // The instance registry must never be replaced with a fresh array. `_sb` is
  // built by spreading every engine module into one object, so `_sbInstances`
  // exists as a property on both `_sb` and this module, aliasing a single
  // array. Reassigning either slot silently detaches the two: the per-frame
  // loop reads `this._sbInstances` with `this` bound to `_sb`, so it would go
  // on iterating the orphaned array forever — objects added afterwards would
  // never update, and objects removed would never stop. Mutating in place
  // keeps every holder of the reference looking at the same live registry.
  _retainInstances(predicate) {
    const instances = this._sbInstances;
    let write = 0;
    for (let read = 0; read < instances.length; read += 1) {
      if (predicate(instances[read])) {
        instances[write] = instances[read];
        write += 1;
      }
    }
    instances.length = write;
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
    // Iterate a snapshot: the registry is mutated in place, and an object's
    // own onupdate very often removes something (`world.remove(self)` when an
    // enemy dies). Walking the live array would make that splice shift the
    // remaining entries down under the cursor and silently skip an object for
    // that frame. A per-frame snapshot gives every object registered at the
    // start of the frame exactly one update, and defers new arrivals to the
    // next frame.
    this._sbInstances.slice().forEach((inst) => {
      if (inst.onupdate) {
        try {
          inst.onupdate(delta);
        } catch (e) {
          _throwError(e);
        }
      }
      // Applies stored velocity (if any) and resolves it against the active
      // tile-collision grid (if any) -- both are no-ops when unset, so a
      // sprite that never calls setVelocity is completely unaffected.
      if (inst._handle) {
        this._applyKinematics(inst._handle, delta);
      }
    });
  },
};
