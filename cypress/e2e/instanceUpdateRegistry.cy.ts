/// <reference types="cypress" />

// ---------------------------------------------------------------------------
// Runtime proof that a class instance added with world.add()/hud.add() keeps
// receiving onupdate(delta) after the instance registry has been mutated.
//
// The bug: `_sb` is built by spreading every engine module into one object, so
// `_sbInstances` existed as a property on both `_sb` and `_sbLifecycle`,
// aliasing one array. stage.js replaced its slot with a fresh array on every
// remove/clear, which detached the two. From then on the per-frame loop — which
// reads `this._sbInstances` with `this` bound to `_sb` — iterated an orphaned
// array forever. Two symptoms, both silent, no error of any kind:
//   1. objects added afterwards never updated again;
//   2. objects removed never *stopped* updating (zombies).
//
// Why this spec has to exist: the bug is entirely about object identity across
// the real async iframe boot and many real frames of app.ticker. Vitest checks
// transpiler output and can load the engine modules in isolation, but only a
// real browser proves the compiled game's actual frame loop dispatches to the
// right array.
//
// Why it is not vacuous: every test prints from a *module*-level onupdate as
// well as from the instances. Module hooks dispatch through `_sbClasses`, a
// separate path that this bug never touched — so the module counter reaching
// its threshold proves frames really are running, and any missing instance
// output is a genuine dispatch failure rather than a game that never started.
// Each test also asserts a line that must NOT appear, which catches the zombie
// half of the bug that a "did it print?" assertion alone would miss.
// ---------------------------------------------------------------------------

import { seedAndRun } from '../support/seedProject';

interface FileSpec {
  name: string;
  source: string;
}

function run(
  projectName: string,
  files: FileSpec[],
  assetNames: string[] = [],
  waitMs = 4000
) {
  seedAndRun({ name: projectName, files, assets: assetNames }, waitMs);
}

function consoleLines(): Cypress.Chainable<string[]> {
  return cy.get('ul li').then(($items) =>
    Cypress._.map($items.toArray(), (el) => (el as HTMLElement).innerText.trim())
  );
}

function hasLine(lines: string[], needle: string): boolean {
  return lines.some((l) => l.includes(needle));
}

// A display object (so world.add/hud.add accept it) that counts its own frames
// and announces exactly once when it reaches the threshold. Extending `text`
// keeps it asset-independent — nothing here depends on texture load timing.
const COUNTER_ENTITY = `
Class
Extends text

dim ticks
dim label

Constructor(name)
  super("*", 50, 50)
  self.ticks = 0
  self.label = name
EndConstructor

function onupdate(delta)
  self.ticks = self.ticks + 1
  if self.ticks = 40 then
    print self.label + "-reached-40"
  endif
endfunction

EndClass
`.trim();

describe('instance onupdate survives a scene switch', () => {
  // A scene switch runs the engine's internal clear() — the full-reset path
  // that every scene-based project hits at least once at startup. Objects the
  // incoming scene creates in onenter() are registered *after* that clear.
  const MAIN = `
dim boot = new bootscene()
dim play = new playscene()

scenemanager.register("boot", boot)
scenemanager.register("play", play)

scenemanager.switch("boot")
`.trim();

  const BOOT_SCENE = `
Class extends scene

function onenter()
  print "boot-entered"
  scenemanager.switch("play")
endfunction

EndClass
`.trim();

  const PLAY_SCENE = `
Class extends scene

dim frames

function onenter()
  self.frames = 0
  dim ticker = new counterentity("scene-entity")
  world.add(ticker)
  print "play-entered"
endfunction

function onupdate(delta)
  self.frames = self.frames + 1
  if self.frames = 40 then
    print "scene-reached-40"
  endif
endfunction

EndClass
`.trim();

  it('keeps updating an object the incoming scene added in onenter', () => {
    run('Instance Update Scene Switch', [
      { name: 'CounterEntity', source: COUNTER_ENTITY },
      { name: 'BootScene', source: BOOT_SCENE },
      { name: 'PlayScene', source: PLAY_SCENE },
      { name: 'Main', source: MAIN },
    ]);

    cy.get('span').contains('ERR').should('not.exist');
    consoleLines().then((lines) => {
      expect(hasLine(lines, 'boot-entered'), 'first scene entered').to.be.true;
      expect(hasLine(lines, 'play-entered'), 'switched to the second scene').to.be.true;
      // Control: the scene's own onupdate dispatches via a path this bug never
      // touched, so this proves at least 40 real frames ran.
      expect(hasLine(lines, 'scene-reached-40'), 'frames really are running').to.be.true;
      // The actual regression: without the fix this never appears.
      expect(
        hasLine(lines, 'scene-entity-reached-40'),
        'object added after the scene switch kept receiving onupdate'
      ).to.be.true;
    });
  });
});

describe('instance onupdate survives world.remove()', () => {
  // world.remove() is a separate trigger from a scene switch: it takes the
  // filter path rather than the full reset.
  const MAIN = `
dim frames = 0
dim keeper = new counterentity("keeper")
dim doomed = new counterentity("doomed")

world.add(keeper)
world.add(doomed)

function onupdate(delta)
  frames = frames + 1
  if frames = 40 then
    print "module-reached-40"
  endif
  if frames = 5 then
    world.remove(doomed)
    dim latecomer = new counterentity("latecomer")
    world.add(latecomer)
  endif
endfunction
`.trim();

  it('keeps the survivor updating, stops the removed one, and picks up later arrivals', () => {
    run('Instance Update World Remove', [
      { name: 'CounterEntity', source: COUNTER_ENTITY },
      { name: 'Main', source: MAIN },
    ]);

    cy.get('span').contains('ERR').should('not.exist');
    consoleLines().then((lines) => {
      expect(hasLine(lines, 'module-reached-40'), 'frames really are running').to.be.true;
      expect(hasLine(lines, 'keeper-reached-40'), 'untouched object still updates').to.be.true;
      // Zombie half of the bug: a removed object went on updating forever.
      expect(
        hasLine(lines, 'doomed-reached-40'),
        'removed object stopped receiving onupdate'
      ).to.be.false;
      // Lost-registration half: objects added after the first remove were never
      // seen by the frame loop again.
      expect(
        hasLine(lines, 'latecomer-reached-40'),
        'object added after a remove receives onupdate'
      ).to.be.true;
    });
  });
});

describe('instance onupdate survives world.clear()', () => {
  const MAIN = `
dim frames = 0
dim worldguy = new counterentity("worldguy")
dim hudguy = new counterentity("hudguy")

world.add(worldguy)
hud.add(hudguy)

function onupdate(delta)
  frames = frames + 1
  if frames = 40 then
    print "module-reached-40"
  endif
  if frames = 5 then
    world.clear()
    dim fresh = new counterentity("fresh")
    world.add(fresh)
  endif
endfunction
`.trim();

  it('drops only world objects and keeps updating everything else', () => {
    run('Instance Update World Clear', [
      { name: 'CounterEntity', source: COUNTER_ENTITY },
      { name: 'Main', source: MAIN },
    ]);

    cy.get('span').contains('ERR').should('not.exist');
    consoleLines().then((lines) => {
      expect(hasLine(lines, 'module-reached-40'), 'frames really are running').to.be.true;
      expect(
        hasLine(lines, 'worldguy-reached-40'),
        'cleared world object stopped receiving onupdate'
      ).to.be.false;
      expect(hasLine(lines, 'hudguy-reached-40'), 'hud object survived world.clear()').to.be
        .true;
      expect(
        hasLine(lines, 'fresh-reached-40'),
        'object added after world.clear() receives onupdate'
      ).to.be.true;
    });
  });
});

describe('instance onupdate survives hud.clear()', () => {
  const MAIN = `
dim frames = 0
dim worldguy = new counterentity("worldguy")
dim hudguy = new counterentity("hudguy")

world.add(worldguy)
hud.add(hudguy)

function onupdate(delta)
  frames = frames + 1
  if frames = 40 then
    print "module-reached-40"
  endif
  if frames = 5 then
    hud.clear()
    dim freshhud = new counterentity("freshhud")
    hud.add(freshhud)
  endif
endfunction
`.trim();

  it('drops only hud objects and keeps updating everything else', () => {
    run('Instance Update Hud Clear', [
      { name: 'CounterEntity', source: COUNTER_ENTITY },
      { name: 'Main', source: MAIN },
    ]);

    cy.get('span').contains('ERR').should('not.exist');
    consoleLines().then((lines) => {
      expect(hasLine(lines, 'module-reached-40'), 'frames really are running').to.be.true;
      expect(
        hasLine(lines, 'hudguy-reached-40'),
        'cleared hud object stopped receiving onupdate'
      ).to.be.false;
      expect(hasLine(lines, 'worldguy-reached-40'), 'world object survived hud.clear()').to.be
        .true;
      expect(
        hasLine(lines, 'freshhud-reached-40'),
        'object added after hud.clear() receives onupdate'
      ).to.be.true;
    });
  });
});
