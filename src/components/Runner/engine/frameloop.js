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

  // Placeholders replaced in the next task — separated so the accumulator can
  // be tested on its own.
  _snapshot() {},
  _renderPrepare() {},
  _afterRender() {},
};
