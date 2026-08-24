// Fixed-timestep simulation with interpolated rendering — the "Fix Your
// Timestep!" pattern.
//
// Before this existed, every per-frame system (kinematics, pathfinding, tween,
// and every user class's own onupdate) read PIXI's raw, variable
// `ticker.deltaMS` and applied it directly to handle.position in one step. The
// delta-time maths was correct — average speed was frame-rate independent — but
// there was zero temporal smoothing, so any real frame-time variance (a GC
// pause, a compositor hiccup, a refresh rate that isn't 60Hz) landed unsmoothed
// on screen as uneven step sizes. Correct average speed, visibly uneven motion.
//
// Now: real elapsed time accumulates here, simulation advances in constant
// FIXED_STEP_MS increments, and rendering blends between the last two
// simulation samples.
const _sbFrameLoop = {
  // 60Hz. Chosen to match the rate softBASIC games have always effectively run
  // at, so no existing game's tuning constants change meaning.
  FIXED_STEP_MS: 1000 / 60,

  // Longest real frame the loop will believe. A backgrounded tab, a breakpoint,
  // or a device waking from sleep can hand us seconds of elapsed time; without
  // this the loop would try to simulate all of it at once.
  MAX_FRAME_MS: 250,

  // Hard cap on catch-up steps per rendered frame. If simulating N steps
  // reliably takes longer than N steps of real time, an uncapped loop falls
  // into a death spiral where each frame is slower than the last. When the cap
  // is hit we drop the outstanding backlog: the game runs briefly in slow
  // motion, which is recoverable, instead of locking up, which is not.
  MAX_STEPS: 5,

  // Per-step displacement above which a position change is treated as a
  // teleport and rendered without interpolation. HEURISTIC, but with a very
  // wide margin: 64px per 1/60s is 3840 px/s, six canvas-widths per second on
  // the 640x360 stage. Nothing in any demo moves within two orders of
  // magnitude of that, while a room-cut teleport clears it easily. Both
  // failure modes are benign — a false snap is exactly the pre-interpolation
  // behaviour for one frame, and a false interpolation smears by under 64px
  // for under one frame. The exact detector for teleports issued *outside* a
  // fixed step (spawns, onenter, key handlers) is _inFixedStep in
  // _sbSprites.setPosition; this only catches teleports issued from inside a
  // step, such as Dungeon Explorer's room transitions.
  MAX_INTERP_STEP_PX: 64,

  // Handles whose position currently holds an interpolated render value and
  // must be restored. Kept as its own list so the restore never has to rescan
  // the instance registry.
  _displaced: [],

  _accumulator: 0,
  _alpha: 0,
  // True only while _fixedStep is on the stack. Read by _sbSprites.setPosition
  // to tell a spawn/teleport (outside a step) from movement (inside one).
  _inFixedStep: false,

  // The PIXI ticker's single per-frame entry point. Wired in bootstrapper.html.
  _update(deltaMS) {
    let elapsed = Number(deltaMS) || 0;
    if (elapsed <= 0) {
      // A zero or negative delta still needs a render pass at the current
      // alpha — the frame is being drawn either way.
      this._renderPrepare();
      return;
    }
    if (elapsed > this.MAX_FRAME_MS) elapsed = this.MAX_FRAME_MS;

    this._accumulator += elapsed;

    let steps = 0;
    while (this._accumulator >= this.FIXED_STEP_MS && steps < this.MAX_STEPS) {
      this._snapshot();
      this._inFixedStep = true;
      try {
        this._fixedStep(this.FIXED_STEP_MS);
      } finally {
        this._inFixedStep = false;
      }
      this._accumulator -= this.FIXED_STEP_MS;
      steps += 1;
    }

    if (steps === this.MAX_STEPS && this._accumulator >= this.FIXED_STEP_MS) {
      this._accumulator = 0;
    }

    this._alpha = this._accumulator / this.FIXED_STEP_MS;
    this._renderPrepare();
  },

  // Records each instance's pre-step position. Runs at the top of EVERY fixed
  // step, so after a multi-step frame the recorded sample is the one from the
  // start of the LAST step — which is exactly what the render must blend from.
  _snapshot() {
    const instances = this._sbInstances;
    for (let i = 0; i < instances.length; i += 1) {
      const handle = instances[i]._handle;
      if (!handle) continue;
      handle._sbPrevX = handle.position.x;
      handle._sbPrevY = handle.position.y;
      handle._sbHasPrev = true;
    }
    this._cameraSnapshot();
  },

  // Runs after the last fixed step of a frame and before PIXI renders. Saves
  // each moving object's authoritative position and overwrites position with
  // the interpolated blend. _afterRender puts the authoritative values back.
  _renderPrepare() {
    const alpha = this._alpha;
    const instances = this._sbInstances;
    const limit = this.MAX_INTERP_STEP_PX;
    for (let i = 0; i < instances.length; i += 1) {
      const handle = instances[i]._handle;
      if (!handle) continue;

      // An object registered since the last snapshot has no previous sample to
      // blend from — rendering it against a stale or absent one would fling it
      // across the screen on its first frame.
      if (!handle._sbHasPrev) continue;

      // A hard teleport this step: show the destination, not the journey.
      if (handle._sbNoInterp) {
        handle._sbNoInterp = false;
        continue;
      }

      const simX = handle.position.x;
      const simY = handle.position.y;
      const dx = simX - handle._sbPrevX;
      const dy = simY - handle._sbPrevY;
      if (dx === 0 && dy === 0) continue;
      if (Math.abs(dx) > limit || Math.abs(dy) > limit) continue;

      handle._sbSimX = simX;
      handle._sbSimY = simY;
      handle.position.set(
        handle._sbPrevX + dx * alpha,
        handle._sbPrevY + dy * alpha
      );
      this._displaced.push(handle);
    }
    this._cameraApply(alpha);
  },

  // Registered on the PIXI ticker at UPDATE_PRIORITY.UTILITY (-50), which runs
  // after PIXI's own render (UPDATE_PRIORITY.LOW, -25), so the displaced window
  // is confined to the render itself. Nothing softBASIC can run — not
  // onupdate, not a key handler, not a collision query — falls inside it.
  _afterRender() {
    const displaced = this._displaced;
    for (let i = 0; i < displaced.length; i += 1) {
      const handle = displaced[i];
      handle.position.set(handle._sbSimX, handle._sbSimY);
    }
    displaced.length = 0;
    this._cameraRestore();
  },
};
