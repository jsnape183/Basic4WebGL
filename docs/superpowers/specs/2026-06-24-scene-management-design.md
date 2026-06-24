# Scene Management Implementation Design

## Goal

Add a `Scene` base class and a `SceneManager` module to softBASIC that let developers define named game states (menu, game, game-over, etc.) as classes, switch between them, and receive lifecycle and key events scoped to the active scene only.

## API

### Base class — `Scene`

`Scene.bas` defines a base class with silent no-op implementations of all five lifecycle hooks. User scene classes extend it and override only the methods they need.

```bas
class MenuScene extends Scene
  function onenter()
    ' runs once when this scene becomes active
  endfunction

  function onupdate(delta)
    ' runs every frame while this scene is active
    if input.keyPressed(32) then SceneManager.switch("game")
  endfunction

  function onkeydown(key)
    ' runs on keypress while this scene is active
  endfunction

  function onexit()
    ' runs once when leaving this scene
    ' stage is cleared automatically after this returns
  endfunction
endclass
```

`onkeyup(key)` is also available, identical to `onkeydown`.

### Module — `SceneManager`

`SceneManager.bas` defines two module-level functions:

```bas
SceneManager.register("menu", menuInstance)   ' associate a name with a scene object
SceneManager.switch("menu")                   ' switch to named scene
```

### Typical main file

```bas
dim menu = new MenuScene()
dim game = new GameScene()
SceneManager.register("menu", menu)
SceneManager.register("game", game)
SceneManager.switch("menu")
```

## Behaviour

### Stage auto-clear on switch

When `SceneManager.switch` fires, the stage is cleared automatically between `onexit` and `onenter`. Developers do not need to call `stage.clear()` manually. If a game needs objects to persist across scenes, they should be re-added in `onenter`.

### Deferred switching

`SceneManager.switch` is **queued**, not immediate. If called inside `onupdate`, the switch is applied at the end of that tick — after the current `onupdate` returns. This prevents mid-frame corruption. Sequence on switch:

1. Current scene's `onexit()` is called
2. Stage is cleared (`this.clear()`)
3. Active scene pointer is swapped
4. New scene's `onenter()` is called

### Initial scene

The transpiled user code runs synchronously before the PIXI ticker starts. `SceneManager.switch("menu")` during that phase queues the switch. The bootstrapper calls `_sb._applySwitch()` immediately after the transpiled block, before registering key listeners and starting the ticker. This ensures `onenter` fires before the first frame renders.

### Lifecycle routing

- `onupdate(delta)` — routed to the active scene only. Other `_sbClasses` (top-level class game loops) continue to receive `_update` as before via `_sbLifecycle._update`.
- `onkeydown(key)` / `onkeyup(key)` — routed to the active scene only, not to `_sbClasses`.
- `onenter` / `onexit` — called directly by the scene engine at switch time.

## Architecture

### New files

- `src/lib/Basic4WebGL/defs/Scene.bas` — base class with no-op lifecycle hooks
- `src/lib/Basic4WebGL/defs/SceneManager.bas` — module with `register` and `switch` functions
- `src/components/Runner/engine/scene.js` — `_sbScene` object implementing all engine behaviour

### Modified files

- `src/components/Runner/softBasicEngine.js` — add `..._sbScene` to the spread
- `src/components/Runner/bootstrapper.html` — two changes:
  1. Call `_sb._applySwitch()` after transpiled code block, before ticker/key listeners
  2. Add `_sb._sceneKeyDown(e.keyCode)` in `keydown` handler and `_sb._sceneKeyUp(e.keyCode)` in `keyup` handler
- `src/constants/packageModules.ts` — add `Scene` and `SceneManager` imports
- `src/constants/firstPartyPackages.ts` — add `'Scene'` and `'SceneManager'` to `softGfx` module list
- `src/lib/Basic4WebGL/keywords.ts` — add `'onexit'` to `SOFTBASIC_LIFECYCLE_EVENTS` (currently missing; consumed by Monaco syntax highlighting)

### `scene.js` engine module

Both `Scene.bas` and `SceneManager.bas` call into the same `_sbScene` engine object. `Scene.bas` has no engine calls (pure softBASIC no-ops). `SceneManager.bas` calls `_sb.sceneRegister` and `_sb.sceneSwitch`.

```js
const _sbScene = {
  _scenes: {},
  _activeScene: null,
  _pendingSwitch: null,

  sceneRegister(name, obj) {
    this._scenes[name] = obj;
  },

  sceneSwitch(name) {
    if (!this._scenes[name]) throw new Error(`Scene not found: "${name}"`);
    this._pendingSwitch = name;
  },

  _applySwitch() {
    if (!this._pendingSwitch) return;
    const name = this._pendingSwitch;
    this._pendingSwitch = null;
    if (this._activeScene && this._activeScene.onexit) {
      try { this._activeScene.onexit(); } catch(e) { _throwError(e); }
    }
    this.clear();
    this._activeScene = this._scenes[name];
    if (this._activeScene && this._activeScene.onenter) {
      try { this._activeScene.onenter(); } catch(e) { _throwError(e); }
    }
  },

  _sceneKeyDown(keyCode) {
    if (this._activeScene && this._activeScene.onkeydown) {
      try { this._activeScene.onkeydown(keyCode); } catch(e) { _throwError(e); }
    }
  },

  _sceneKeyUp(keyCode) {
    if (this._activeScene && this._activeScene.onkeyup) {
      try { this._activeScene.onkeyup(keyCode); } catch(e) { _throwError(e); }
    }
  },

  // Overrides _sbLifecycle._update in the spread — chains to it, then routes to active scene
  _update(delta) {
    _sbLifecycle._update.call(this, delta);
    if (this._activeScene && this._activeScene.onupdate) {
      try { this._activeScene.onupdate(delta); } catch(e) { _throwError(e); }
    }
    this._applySwitch();
  },
};
```

`_sbScene._update` overrides `_sbLifecycle._update` in the `_sb` spread because `_sbScene` is spread after `_sbLifecycle` in `softBasicEngine.js`. It chains to `_sbLifecycle._update` to preserve existing top-level class lifecycle behaviour, then delegates to the active scene, then applies any pending switch.

### `Scene.bas` def file

```bas
Class
  function onenter()
  endfunction

  function onupdate(delta)
  endfunction

  function onexit()
  endfunction

  function onkeydown(key)
  endfunction

  function onkeyup(key)
  endfunction
EndClass
```

### `SceneManager.bas` def file

```bas
function register(name, obj)
    call("_sb.sceneRegister(register_name, register_obj)")
endfunction

function switch(name)
    call("_sb.sceneSwitch(switch_name)")
endfunction
```

## Tests

Transpiler tests (`tests/lib/Basic4WebGL/unit/transpiler/scene.test.ts`) verify:

- A class extending `Scene` transpiles correctly (calls `super()` in constructor, inherits base methods)
- `SceneManager.register("menu", obj)` transpiles to the correct `call()` form
- `SceneManager.switch("game")` transpiles to the correct `call()` form

Engine behaviour (deferred switching, auto-clear, lifecycle routing) is tested via integration or manual verification — the transpiler tests don't exercise runtime behaviour.

## Docs

A new API reference page `src/docs/api-reference/scene.md` covering:
- The `Scene` base class and how to extend it
- All five lifecycle hooks with descriptions
- `SceneManager.register()` and `SceneManager.switch()`
- A complete worked example (menu → game → game-over flow)

Added to the softGfx group in `src/docs/manifest.ts`.
