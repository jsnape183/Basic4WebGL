let worldContainer;
let hudContainer;

// Per-rendered-frame GPU probes (world.drawCalls / world.gpuFrameMs). Installed
// once by _initStage; both read a value snapshotted after PIXI's own render.
let _dcCount = 0;
let _dcLast = 0;
let _gpuExt = null;
let _gpuQuery = null;
let _gpuInFlight = false;
let _gpuMsLast = -1;

function _installFrameProbes() {
  const gl = app.renderer && app.renderer.gl;
  if (!gl || typeof gl.getExtension !== 'function') return;

  // draw-call counter: wrap the GL draw entry points
  for (const m of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
    if (typeof gl[m] === 'function') {
      const orig = gl[m].bind(gl);
      gl[m] = (...a) => { _dcCount += 1; return orig(...a); };
    }
  }

  _gpuExt = gl.getExtension('EXT_disjoint_timer_query_webgl2');

  // begin a GPU timer query before PIXI renders (priority above NORMAL)
  app.ticker.add(() => {
    if (_gpuExt && !_gpuInFlight) {
      _gpuQuery = gl.createQuery();
      gl.beginQuery(_gpuExt.TIME_ELAPSED_EXT, _gpuQuery);
      _gpuInFlight = true;
    }
  }, null, PIXI.UPDATE_PRIORITY.HIGH);

  // after PIXI renders (LOW = -25), close the query + snapshot the counters
  app.ticker.add(() => {
    _dcLast = _dcCount;
    _dcCount = 0;
    if (_gpuExt && _gpuInFlight) {
      gl.endQuery(_gpuExt.TIME_ELAPSED_EXT);
      const q = _gpuQuery;
      _gpuInFlight = false;
      // result is ready a frame or two later; poll on the next tick
      const poll = () => {
        if (!q) return;
        const disjoint = gl.getParameter(_gpuExt.GPU_DISJOINT_EXT);
        const available = gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE);
        if (available) {
          if (!disjoint) _gpuMsLast = gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6;
          gl.deleteQuery(q);
        } else {
          app.ticker.addOnce(poll, null, PIXI.UPDATE_PRIORITY.UTILITY);
        }
      };
      app.ticker.addOnce(poll, null, PIXI.UPDATE_PRIORITY.UTILITY);
    }
  }, null, PIXI.UPDATE_PRIORITY.UTILITY);
}

const _sbStage = {
  _initStage() {
    worldContainer = new PIXI.Container();
    worldContainer.sortableChildren = true;
    hudContainer = new PIXI.Container();
    hudContainer.sortableChildren = true;
    app.stage.addChild(worldContainer);
    app.stage.addChild(hudContainer);
    _installFrameProbes();
  },

  // ── world ────────────────────────────────────────────────────────────────
  addToWorld(obj) {
    worldContainer.addChild(obj._handle);
    if (!this._sbInstances.includes(obj)) {
      this._sbInstances.push(obj);
    }
  },
  removeFromWorld(obj) {
    worldContainer.removeChild(obj._handle);
    this._retainInstances((i) => i !== obj);
  },
  clearWorld() {
    const worldHandles = new Set(worldContainer.children);
    worldContainer.removeChildren();
    this._retainInstances((i) => !worldHandles.has(i._handle));
  },

  // ── hud ──────────────────────────────────────────────────────────────────
  addToHud(obj) {
    hudContainer.addChild(obj._handle);
    if (!this._sbInstances.includes(obj)) {
      this._sbInstances.push(obj);
    }
  },
  removeFromHud(obj) {
    hudContainer.removeChild(obj._handle);
    this._retainInstances((i) => i !== obj);
  },
  clearHud() {
    const hudHandles = new Set(hudContainer.children);
    hudContainer.removeChildren();
    this._retainInstances((i) => !hudHandles.has(i._handle));
  },

  // ── deprecated stage aliases ──────────────────────────────────────────────
  addToStage(obj) {
    this.addToWorld(obj);
  },
  removeFromStage(obj) {
    this.removeFromWorld(obj);
  },

  // ── full clear (used by scene switch) ────────────────────────────────────
  clear() {
    worldContainer.removeChildren();
    hudContainer.removeChildren();
    // Emptied in place, never replaced — see _retainInstances in lifecycle.js.
    this._sbInstances.length = 0;
    this._cameraReset();
    this._pathfindingReset();
    this._tileCollisionReset();
    this._frameLoopReset();
    this._drawingReset();
  },

  // ── canvas info ───────────────────────────────────────────────────────────
  getStageWidth() {
    return app.renderer.width;
  },
  getStageHeight() {
    return app.renderer.height;
  },
  getWorldFps() {
    return app.ticker.FPS;
  },
  // GL draw calls issued during the last rendered frame. A tiny number means
  // the frame is nowhere near a batch/draw-call ceiling.
  getWorldDrawCalls() {
    return _dcLast;
  },
  // GPU time (ms) for the last rendered frame, via EXT_disjoint_timer_query_webgl2.
  // -1 when the extension is unavailable (Firefox/Safari) or no result yet.
  getWorldGpuMs() {
    return _gpuMsLast;
  },
  setBackground(r, g, b) {
    app.renderer.background.color = (r << 16) | (g << 8) | b;
  },
  setPixelPerfect(v) {
    // Only affects textures created after this call — call from oninit(),
    // before asset preload, so every texture picks it up from the start.
    PIXI.TextureStyle.defaultOptions.scaleMode = v ? 'nearest' : 'linear';
  },
};
