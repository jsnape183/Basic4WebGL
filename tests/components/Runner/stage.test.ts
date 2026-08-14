import { readFileSync } from 'node:fs';
import { describe, test, expect, vi } from 'vitest';

// The engine modules are plain scripts (not ES modules) that the runner
// concatenates verbatim into the sandboxed iframe, where `softBasicEngine.js`
// flattens them all into a single global `_sb` via object spread. These tests
// reproduce that exact concatenation so they exercise the *real* wiring —
// including the spread — rather than a hand-rolled stand-in. That matters:
// the bug these tests guard against lived entirely in the seam between a
// module's own copy of a property and the spread-time copy on `_sb`.

// Mirrors the module list and order in src/components/Runner/index.tsx.
const ENGINE_MODULES = [
  'lifecycle',
  'input',
  'assets',
  'file',
  'save',
  'audio',
  'drawing',
  'stage',
  'sprites',
  'animatedSprite',
  'tilemap',
  'collision',
  'pathfinding',
  'scene',
  'camera',
];

class FakeContainer {
  children: unknown[] = [];
  sortableChildren = false;
  scale = { set: () => {} };
  position = { set: () => {} };
  addChild(c: unknown) {
    this.children.push(c);
  }
  removeChild(c: unknown) {
    const i = this.children.indexOf(c);
    if (i !== -1) this.children.splice(i, 1);
  }
  removeChildren() {
    this.children = [];
  }
}

function loadEngine(throwError: (e: Error) => void = () => {}) {
  const src = [
    ...ENGINE_MODULES.map((m) =>
      readFileSync(`src/components/Runner/engine/${m}.js`, 'utf-8')
    ),
    readFileSync('src/components/Runner/softBasicEngine.js', 'utf-8'),
  ].join('\n');

  const PIXI = { Container: FakeContainer };
  const app = {
    stage: new FakeContainer(),
    renderer: { width: 640, height: 360, background: { color: 0 } },
  };

  const factory = new Function(
    'PIXI',
    'app',
    '_throwError',
    '_print',
    `${src}\n return { _sb, _sbLifecycle, _sbStage };`
  );
  const engine = factory(PIXI, app, throwError, () => {});
  engine._sb._initStage();
  return engine;
}

/** A stand-in for a softBASIC object instance with an onupdate hook. */
function makeEntity(name: string) {
  const calls: number[] = [];
  return {
    name,
    calls,
    _handle: new FakeContainer(),
    onupdate(delta: number) {
      calls.push(delta);
    },
  };
}

describe('instance registry stays shared between _sb and _sbLifecycle', () => {
  // _sbLifecycle._update reads `this._sbInstances` (bound to _sb), while
  // stage.js is the code that maintains the registry. If those two ever end up
  // looking at different arrays, every instance's onupdate silently stops
  // firing. Assert the identity directly after each mutating operation.
  test.each([
    ['world.remove()', (sb: any, e: any) => sb.removeFromWorld(e)],
    ['world.clear()', (sb: any) => sb.clearWorld()],
    ['hud.remove()', (sb: any, e: any) => sb.removeFromHud(e)],
    ['hud.clear()', (sb: any) => sb.clearHud()],
    ['scene switch clear()', (sb: any) => sb.clear()],
  ])('%s keeps _sb._sbInstances identical to _sbLifecycle._sbInstances', (_label, op) => {
    const { _sb, _sbLifecycle } = loadEngine();
    const entity = makeEntity('victim');
    _sb.addToWorld(entity);
    _sb.addToHud(entity);

    op(_sb, entity);

    expect(_sb._sbInstances).toBe(_sbLifecycle._sbInstances);
  });
});

describe('_sb._update keeps dispatching onupdate after registry mutations', () => {
  test('survivor still updates after another object is removed from the world', () => {
    const { _sb } = loadEngine();
    const survivor = makeEntity('survivor');
    const doomed = makeEntity('doomed');
    _sb.addToWorld(survivor);
    _sb.addToWorld(doomed);

    _sb._update(1);
    expect(survivor.calls).toHaveLength(1);

    _sb.removeFromWorld(doomed);

    _sb._update(1);
    _sb._update(1);
    expect(survivor.calls).toHaveLength(3);
    expect(doomed.calls).toHaveLength(1); // removed, so no further updates
  });

  test('objects added after world.clear() receive updates', () => {
    const { _sb } = loadEngine();
    _sb.addToWorld(makeEntity('old'));
    _sb.clearWorld();

    const fresh = makeEntity('fresh');
    _sb.addToWorld(fresh);

    _sb._update(1);
    _sb._update(1);
    expect(fresh.calls).toHaveLength(2);
  });

  test('objects added after hud.clear() receive updates', () => {
    const { _sb } = loadEngine();
    _sb.addToHud(makeEntity('old'));
    _sb.clearHud();

    const fresh = makeEntity('fresh');
    _sb.addToHud(fresh);

    _sb._update(1);
    expect(fresh.calls).toHaveLength(1);
  });

  test('objects spawned by a scene after a switch receive updates', () => {
    const { _sb } = loadEngine();
    const spawned = makeEntity('player');

    _sb.sceneRegister('menu', {});
    _sb.sceneRegister('level1', {
      onenter() {
        _sb.addToWorld(spawned);
      },
    });

    // Boot into the menu, then switch — the switch runs clear(), which is the
    // full-reset path taken on every scene change.
    _sb.sceneSwitch('menu');
    _sb._applySwitch();
    _sb.sceneSwitch('level1');
    _sb._applySwitch();

    _sb._update(1);
    _sb._update(1);
    _sb._update(1);
    expect(spawned.calls).toHaveLength(3);
  });

  test('an entity surviving in the hud keeps updating across a scene switch cycle', () => {
    const { _sb } = loadEngine();
    const hudScore = makeEntity('score');
    _sb.addToHud(hudScore);
    _sb.clearHud();
    _sb.addToHud(hudScore);

    _sb._update(1);
    expect(hudScore.calls).toHaveLength(1);
  });
});

describe('registry mutation still removes what it should', () => {
  test('removeFromWorld stops that object updating and detaches its handle', () => {
    const { _sb } = loadEngine();
    const entity = makeEntity('gone');
    _sb.addToWorld(entity);
    _sb.removeFromWorld(entity);

    _sb._update(1);
    expect(entity.calls).toHaveLength(0);
    expect(_sb._sbInstances).not.toContain(entity);
  });

  test('clearWorld only drops world objects, leaving hud objects registered', () => {
    const { _sb } = loadEngine();
    const worldObj = makeEntity('enemy');
    const hudObj = makeEntity('score');
    _sb.addToWorld(worldObj);
    _sb.addToHud(hudObj);

    _sb.clearWorld();

    _sb._update(1);
    expect(worldObj.calls).toHaveLength(0);
    expect(hudObj.calls).toHaveLength(1);
  });

  test('clearHud only drops hud objects, leaving world objects registered', () => {
    const { _sb } = loadEngine();
    const worldObj = makeEntity('enemy');
    const hudObj = makeEntity('score');
    _sb.addToWorld(worldObj);
    _sb.addToHud(hudObj);

    _sb.clearHud();

    _sb._update(1);
    expect(worldObj.calls).toHaveLength(1);
    expect(hudObj.calls).toHaveLength(0);
  });

  test('clear() drops everything', () => {
    const { _sb } = loadEngine();
    const worldObj = makeEntity('enemy');
    const hudObj = makeEntity('score');
    _sb.addToWorld(worldObj);
    _sb.addToHud(hudObj);

    _sb.clear();

    _sb._update(1);
    expect(worldObj.calls).toHaveLength(0);
    expect(hudObj.calls).toHaveLength(0);
    expect(_sb._sbInstances).toHaveLength(0);
  });

  test('adding the same object twice registers it once', () => {
    const { _sb } = loadEngine();
    const entity = makeEntity('player');
    _sb.addToWorld(entity);
    _sb.addToWorld(entity);

    _sb._update(1);
    expect(entity.calls).toHaveLength(1);
  });
});

describe('mutating the registry from inside onupdate', () => {
  // The registry is now spliced in place, so the per-frame dispatch must walk a
  // snapshot. Otherwise an object removing something during its own update
  // shifts the array under the iteration cursor and skips a sibling — the
  // classic "enemy dies and the next enemy misses a frame" bug.
  test('an object removing itself does not skip the objects after it', () => {
    const { _sb } = loadEngine();
    const first = makeEntity('first');
    const suicidal = makeEntity('suicidal');
    const third = makeEntity('third');
    const fourth = makeEntity('fourth');
    suicidal.onupdate = function (delta: number) {
      suicidal.calls.push(delta);
      _sb.removeFromWorld(suicidal);
    };
    [first, suicidal, third, fourth].forEach((e) => _sb.addToWorld(e));

    _sb._update(1);

    expect(first.calls).toHaveLength(1);
    expect(suicidal.calls).toHaveLength(1);
    expect(third.calls, 'object after the removed one still updated').toHaveLength(1);
    expect(fourth.calls).toHaveLength(1);

    _sb._update(1);
    expect(suicidal.calls, 'removed object stops updating next frame').toHaveLength(1);
    expect(third.calls).toHaveLength(2);
  });

  test('world.clear() from inside onupdate does not skip the rest of the frame', () => {
    const { _sb } = loadEngine();
    const clearer = makeEntity('clearer');
    const other = makeEntity('other');
    clearer.onupdate = function (delta: number) {
      clearer.calls.push(delta);
      _sb.clearWorld();
    };
    _sb.addToWorld(clearer);
    _sb.addToWorld(other);

    _sb._update(1);
    expect(other.calls, 'still updated in the frame it was cleared in').toHaveLength(1);

    _sb._update(1);
    expect(other.calls, 'no longer registered afterwards').toHaveLength(1);
  });

  test('an object added during onupdate starts updating on the next frame', () => {
    const { _sb } = loadEngine();
    const spawner = makeEntity('spawner');
    const spawned = makeEntity('spawned');
    let spawnedOnce = false;
    spawner.onupdate = function (delta: number) {
      spawner.calls.push(delta);
      if (!spawnedOnce) {
        spawnedOnce = true;
        _sb.addToWorld(spawned);
      }
    };
    _sb.addToWorld(spawner);

    _sb._update(1);
    expect(spawned.calls, 'not updated in its own spawn frame').toHaveLength(0);

    _sb._update(1);
    expect(spawned.calls).toHaveLength(1);
  });
});

describe('class-level onupdate is unaffected', () => {
  test('module onupdate hooks keep firing across a clear', () => {
    const { _sb } = loadEngine();
    const onupdate = vi.fn();
    _sb._sbClasses = [{ name: 'main', symbol: { onupdate } }];

    _sb._update(1);
    _sb.clear();
    _sb._update(1);

    expect(onupdate).toHaveBeenCalledTimes(2);
  });
});

describe('clear() resets pathfinding state alongside the camera', () => {
  function loadStageOnly() {
    const src = readFileSync('src/components/Runner/engine/stage.js', 'utf-8');
    const PIXI = { Container: FakeContainer };
    const app = { stage: new FakeContainer(), renderer: { width: 640, height: 360, background: { color: 0 } } };
    const factory = new Function('PIXI', 'app', `${src}\n return _sbStage;`);
    const stage = factory(PIXI, app);
    stage._sbInstances = [];
    stage._initStage();
    return stage;
  }

  test('calls _pathfindingReset()', () => {
    const stage = loadStageOnly();
    stage._cameraReset = vi.fn();
    stage._pathfindingReset = vi.fn();
    stage._tileCollisionReset = vi.fn();

    stage.clear();

    expect(stage._pathfindingReset).toHaveBeenCalledTimes(1);
  });

  test('clear() also resets the active tile-collision grid', () => {
    const stage = loadStageOnly();
    stage._cameraReset = vi.fn();
    stage._pathfindingReset = vi.fn();
    const resetCalls: string[] = [];
    stage._tileCollisionReset = () => resetCalls.push('reset');

    stage.clear();

    expect(resetCalls).toEqual(['reset']);
  });
});
