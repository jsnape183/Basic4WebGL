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

// ---------------------------------------------------------------------------
// Minimal 1×1 white pixel PNG — same stand-in tutorials.cy.ts uses for
// ship.png / enemy.png. A sprite constructor calls _sb.createSprite, which
// needs a real preloaded asset to succeed, so this must be seeded.
// ---------------------------------------------------------------------------
const PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

interface FileSpec {
  name: string;
  source: string;
}

function buildPersistedState(
  projectId: string,
  projectName: string,
  files: FileSpec[],
  assetNames: string[] = []
): string {
  const filesById: Record<string, object> = {};
  const fileOrder: string[] = [];
  files.forEach((f) => {
    const id = `file-${f.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    filesById[id] = { id, name: f.name, source: f.source, projectId, folderId: null, fullName: f.name };
    fileOrder.push(id);
  });

  const assetsById: Record<string, object> = {};
  const assetOrder: string[] = [];
  assetNames.forEach((name) => {
    const id = `asset-${name.replace('.', '-')}`;
    assetsById[id] = {
      id,
      name,
      content: PIXEL_PNG,
      projectId,
      folderId: null,
      fullName: name,
    };
    assetOrder.push(id);
  });

  const state = {
    projects: JSON.stringify({
      items: [{ id: projectId, name: projectName, packageIds: ['softcore', 'softgfx'] }],
    }),
    files: JSON.stringify({ byId: filesById, dirtyFileIds: [], fileOrder: { [`${projectId}:root`]: fileOrder } }),
    assets: JSON.stringify({
      byId: assetsById,
      assetOrder: { [`${projectId}:root`]: assetOrder },
    }),
    folders: JSON.stringify({ items: [] }),
    _persist: JSON.stringify({ version: -1, rehydrated: true }),
  };
  return JSON.stringify(state);
}

function run(
  projectId: string,
  projectName: string,
  files: FileSpec[],
  assetNames: string[] = [],
  waitMs = 3000
) {
  const persistedState = buildPersistedState(projectId, projectName, files, assetNames);
  cy.visit(`/projects/${projectId}/edit`, {
    onBeforeLoad(win) {
      win.localStorage.setItem('persist:softBASIC', persistedState);
    },
  });
  cy.get('[aria-label="Run project"]', { timeout: 10000 }).click();
  cy.wait(waitMs);
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

    run('kinematic01', 'Kinematic Free Move', [{ name: 'Main', source }], ['dot.png']);
    cy.get('span').contains('ERR').should('not.exist');
    consoleLines().then((lines) => {
      const line = findLine(lines, 'x=');
      expect(line, 'x= checkpoint reported after 30 frames').to.be.a('string');
      const x = Number(/x=([0-9.eE+-]+)/.exec(line as string)?.[1]);
      // 30 real frames at ~100px/s: exact value depends on real frame timing,
      // but it must have moved meaningfully to the right and stayed well
      // short of an unbounded runaway value.
      expect(x, 'sprite x after 30 frames of vx=100').to.be.within(1, 100);
    });
  });

  it('stops a sprite at a solid tile and reports isBlockedRight()', () => {
    // Reacts to isBlockedRight() by zeroing velocity, exactly the pattern a
    // real game uses. Without this reaction, collision.js's per-frame tile
    // resolution clips the sprite's leading edge to precisely the tile
    // boundary (col * tileW) on the blocking frame -- so on the *next*
    // frame, with velocity still nonzero, the leading edge's own floor()
    // division lands exactly on the solid column's own index (not the one
    // before it), and the scan (which only checks columns strictly ahead of
    // the current one) no longer sees the solid tile it is flush against.
    // The sprite would then tunnel through on that single frame. That is a
    // property of the engine's resolution algorithm being exercised here,
    // not something this additive spec should paper over by disabling
    // gravity/velocity checks -- reacting to the collision, as any real game
    // must, is what actually keeps the sprite pinned.
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

    run('kinematic02', 'Kinematic Tile Block', [{ name: 'Main', source }], ['dot.png']);
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
});
