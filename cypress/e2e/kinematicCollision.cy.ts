/// <reference types="cypress" />

// ---------------------------------------------------------------------------
// Runtime proof that setVelocity()-driven movement and
// collision.setupTileCollision() resolution work end-to-end against a real
// PIXI.Ticker, in a real browser -- the one thing Vitest's transpiler-output
// tests and the isolated engine-module tests (collision.test.ts,
// lifecycle.test.ts) cannot prove on their own, since neither runs a real
// frame loop. See CLAUDE.md's "E2E tests (Cypress)" section and this
// feature's design doc's Testing section for why this spec exists.
// ---------------------------------------------------------------------------

import { seedAndRun } from '../support/seedProject';

interface FileSpec {
  name: string;
  source: string;
}

// A sprite constructor calls _sb.createSprite, which needs a real preloaded
// asset — the helper seeds each named asset with a 1x1 PNG in the blob store.
function run(
  projectName: string,
  files: FileSpec[],
  assetNames: string[] = [],
  waitMs = 3000
) {
  seedAndRun({ name: projectName, files, assets: assetNames }, waitMs);
}

function consoleLines(): Cypress.Chainable<string[]> {
  return cy.get('ul li').then(($items) => Cypress._.map($items.toArray(), (el) => (el as HTMLElement).innerText.trim()));
}

function findLine(lines: string[], needle: string): string | undefined {
  return lines.find((l) => l.includes(needle));
}

// The runner iframe is same-origin (sandbox allows it) but `_sb` (and the
// engine's internal `worldContainer`) are top-level `const`/`let` bindings in
// the frame's own inline script, not properties on `window` — reach them
// through the frame's own eval, exactly as deltaUnits.cy.ts's wall-clock test
// already does.
function iframeWindow(): Cypress.Chainable<Window & { eval: (s: string) => unknown }> {
  return cy
    .get('iframe[title="Preview"]')
    .then(($f) => ($f[0] as HTMLIFrameElement).contentWindow as Window & { eval: (s: string) => unknown });
}

describe('kinematic movement + tile collision', () => {
  it('moves a sprite by setVelocity() alone, with no collision grid active', () => {
    const source = `
dim s as sprite
dim frames = 0

function onenter()
  s = new sprite("dot.png")
  s.setVelocity(100, 0)
  world.add(s)
endfunction

function onupdate(delta)
  frames = frames + 1
  if frames = 30 then
    print "x=" + string.str(s.transform.x())
  endif
endfunction
`.trim();

    run('Kinematic Free Move', [{ name: 'Main', source }], ['dot.png'], 4000);
    cy.get('span').contains('ERR').should('not.exist');
    consoleLines().then((lines) => {
      const line = findLine(lines, 'x=');
      expect(line, 'x= checkpoint reported after 30 frames').to.be.a('string');
      const x = Number(/x=([0-9.eE+-]+)/.exec(line as string)?.[1]);
      // This assertion's job is only "moved right, not runaway" -- not
      // precise frame timing (that's deltaUnits.cy.ts's job). Bound it
      // against real per-frame timing variance rather than an assumed
      // ~60fps: deltaUnits.cy.ts documents PIXI's real observed frame time
      // as 5-100ms/frame (bounded above by the ticker's default minFPS
      // clamp). Over 30 frames at vx=100px/s that puts x anywhere from
      // ~15 (30 * 5ms) to ~300 (30 * 100ms) under legitimate real-world
      // timing variance (e.g. CI load) -- wide enough to only rule out "did
      // not move" or "runaway/wrong units", with margin on both ends.
      expect(x, 'sprite x after 30 frames of vx=100').to.be.within(5, 350);
    });
  });

  it('stops a sprite at a solid tile and reports isBlockedRight()', () => {
    // Reacts to isBlockedRight() by zeroing velocity, exactly the pattern a
    // real game uses -- this is the ordinary "stop when blocked" gameplay
    // pattern, not a workaround for an engine limitation. As of commit
    // a03ba21 ("fix: prevent tunneling when a sprite rests exactly on a tile
    // boundary with unchanged velocity"), collision.js's _resolveAxis()
    // applies a small backward nudge (TILE_EPSILON) to the scan's starting
    // edge specifically so that a leading edge resting exactly on a tile
    // boundary keeps re-checking the solid tile it's flush against, even
    // with velocity left unchanged frame after frame -- see the next test,
    // which exercises that exact scenario in this same real browser.
    const source = `
dim s as sprite
dim reportedBlocked = false

function onenter()
  s = new sprite("dot.png")
  s.transform.setPosition(0, 0)
  s.setVelocity(500, 0)
  world.add(s)
endfunction

function onupdate(delta)
  if s.isBlockedRight() and reportedBlocked = false then
    reportedBlocked = true
    s.setVelocity(0, 0)
    print "blocked-x=" + string.str(s.transform.x())
  endif
endfunction
`.trim();

    run('Kinematic Tile Block', [{ name: 'Main', source }], ['dot.png']);
    cy.get('span').contains('ERR').should('not.exist');

    // Install a synthetic solid-tile grid directly against the running
    // game's _sb -- no real .stm asset is needed since setupTileCollision
    // only reads the shape below. In the same call, snap the sprite back to
    // a known start position: the `run()` wait above already let it drift
    // freely (no collision grid was active yet), and boot + that wait's
    // real elapsed time is not something this test can predict, so this
    // reset makes the rest of the test independent of that timing. The
    // fake tile-map handle needs `x`/`y`/`parent` set to a real container so
    // collision.js's `_tileGridOffset` walk resolves to a (0, 0) offset
    // instead of walking off into `undefined` (which would produce NaN and
    // silently disable collision resolution).
    iframeWindow().then((win) => {
      win.eval(`
        (() => {
          // This game only ever creates the one sprite ("s"), so it's the
          // sole entry in _sbInstances -- ".length - 1" just means "the
          // sprite", not "the most recent of several".
          const inst = _sb._sbInstances[_sb._sbInstances.length - 1];
          inst._handle.position.set(0, 0);
          _sb.setupTileCollision({
            _handle: {
              x: 0,
              y: 0,
              parent: worldContainer,
              _layerContainers: {
                walls: { _isCollisionLayer: true, _map: [[0, 0, 1, 0, 0]], _tileW: 20, _tileH: 20 },
              },
            },
          });
        })();
      `);
    });

    cy.wait(1500);

    cy.get('span').contains('ERR').should('not.exist');
    consoleLines().then((lines) => {
      const blockedLine = findLine(lines, 'blocked-x=');
      expect(blockedLine, 'sprite reported isBlockedRight() and reacted to it').to.be.a('string');
      const blockedX = Number(/blocked-x=([0-9.eE+-]+)/.exec(blockedLine as string)?.[1]);
      // Wall starts at tile col 2 * 20px = x:40. The sprite's right edge
      // must have been clipped at or before that boundary, not passed
      // through it, at the moment it reported being blocked.
      expect(blockedX, 'sprite was stopped at/before the wall when it reported blocked').to.be.lessThan(40);
    });

    // Having zeroed its own velocity in reaction, the sprite must stay put:
    // read its live position again after more real frames elapse, and
    // confirm it has not continued drifting past the wall.
    iframeWindow().then((win) => {
      const finalX = win.eval(`
        _sb._sbInstances[_sb._sbInstances.length - 1]._handle.position.x
      `) as number;
      expect(finalX, 'sprite remained stopped at/before the wall after reacting to the block').to.be.lessThan(40);
    });
  });

  it('stays pinned at the wall over many frames when resting exactly on the boundary with velocity never reacted to', () => {
    // Regression coverage, in a real browser, for commit a03ba21 ("fix:
    // prevent tunneling when a sprite rests exactly on a tile boundary with
    // unchanged velocity"). Unlike the previous test, onupdate() here never
    // reacts to isBlockedRight() -- velocity is left pointing into the wall
    // for the entire run. Before a03ba21, once the sprite's leading edge
    // came to rest exactly on the solid tile's near boundary, the next
    // frame's floor() division of that exact boundary value landed on the
    // solid column's own index rather than the tile behind it, so the scan
    // (which starts one column past that index) stopped seeing the solid
    // tile it was flush against -- letting the sprite creep a little further
    // into the wall every subsequent frame. With the fix, _resolveAxis()'s
    // TILE_EPSILON nudge keeps re-detecting that same tile every frame, so
    // the sprite must stay pinned at/before the boundary indefinitely, not
    // just at the instant it was first reported blocked.
    const source = `
dim s as sprite

function onenter()
  s = new sprite("dot.png")
  s.transform.setPosition(0, 0)
  s.setVelocity(50, 0)
  world.add(s)
endfunction

function onupdate(delta)
endfunction
`.trim();

    run('Kinematic Boundary Rest', [{ name: 'Main', source }], ['dot.png']);
    cy.get('span').contains('ERR').should('not.exist');

    // Same synthetic wall shape as the previous test (solid tile at col 2,
    // x:40-60, tileW=20). Velocity is deliberately kept low (50px/s) so a
    // single frame's movement never spans a whole tile even under the
    // worst-case ~100ms frame time documented in deltaUnits.cy.ts (dx <= 5px
    // << tileW). That isolates the boundary-rest fix under test from the
    // separate multi-tile-jump fix that already covers fast motion clearing
    // a tile in one frame.
    iframeWindow().then((win) => {
      win.eval(`
        (() => {
          const inst = _sb._sbInstances[_sb._sbInstances.length - 1];
          inst._handle.position.set(0, 0);
          _sb.setupTileCollision({
            _handle: {
              x: 0,
              y: 0,
              parent: worldContainer,
              _layerContainers: {
                walls: { _isCollisionLayer: true, _map: [[0, 0, 1, 0, 0]], _tileW: 20, _tileH: 20 },
              },
            },
          });
        })();
      `);
    });

    // Let dozens of real frames elapse -- long enough to first reach the
    // wall and then keep pushing into it repeatedly -- entirely without any
    // script-level reaction to being blocked.
    cy.wait(3000);

    cy.get('span').contains('ERR').should('not.exist');
    iframeWindow().then((win) => {
      const finalX = win.eval(`
        _sb._sbInstances[_sb._sbInstances.length - 1]._handle.position.x
      `) as number;
      const stillBlocked = win.eval(`
        _sb.isBlockedRight(_sb._sbInstances[_sb._sbInstances.length - 1]._handle)
      `) as boolean;
      // Wall starts at tile col 2 * 20px = x:40. If the pre-a03ba21 bug were
      // still present, the sprite would have crept past this boundary a
      // little further every frame once resting flush against it; with the
      // fix it must still be at/before it, and still reported blocked, after
      // many unreacted frames.
      expect(finalX, 'sprite stayed pinned at/before the wall after many frames with velocity never zeroed').to.be.lessThan(40);
      expect(stillBlocked, 'still reports blocked against the wall on the final frame, not having slipped past it').to.equal(true);
    });
  });
});
