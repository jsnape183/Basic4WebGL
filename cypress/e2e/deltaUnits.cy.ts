/// <reference types="cypress" />

// ---------------------------------------------------------------------------
// Runtime proof that the `delta` handed to every onupdate(delta) is measured in
// **milliseconds**, which is what the language contract promises.
//
// The bug: bootstrapper.html wired the frame loop as
//     app.ticker.add((ticker) => _sb._update(ticker.deltaTime));
// PIXI's `ticker.deltaTime` is the *frame-count-normalised* delta — ~1.0 per
// frame at 60fps. The millisecond value is `ticker.deltaMS`. That number flowed
// unmodified through _sb._update() into every module-level and every instance
// onupdate(delta), so `delta` arrived ~16.67x too small:
//   - the Language Guide says "delta is the elapsed time in milliseconds since
//     the last frame";
//   - every tutorial that does frame-rate-independent movement writes
//     `speed * delta / 1000`, i.e. treats delta as milliseconds;
//   - tutorial 7 accumulates `timer = timer + delta` and claims the score ticks
//     up "every second" at `timer >= 1000`.
// All of it ran 16.67x slow. Tutorial 7's score actually ticked once every
// ~16.7 seconds, and its `if timer >= 1000` branch never fired at all inside
// the e2e suite's own 4-second window.
//
// Why this spec has to exist: the bug lives entirely in the value PIXI's real
// Ticker produces on a real frame. Vitest can lock the *source text* of the
// wiring (tests/components/Runner/bootstrapper.test.ts does exactly that) but
// it cannot run a PIXI.Ticker, so only a browser can prove the number arriving
// at onupdate is the right one.
//
// Why it is not vacuous:
//  - Every test prints a frame-count checkpoint driven by `frames = frames + 1`,
//    a counter that is completely independent of delta's *value*. If the game
//    never booted or the ticker never ran, that line is missing and the test
//    fails there rather than silently passing.
//  - The delta assertions are two-sided. A lower bound alone would be satisfied
//    by any accidental scaling-up; the upper bound rejects that, so only a value
//    genuinely tracking real elapsed time passes.
//  - The wall-clock test compares the accumulated delta against `performance.now()`
//    measured over the same window in the same frame, so it cannot be satisfied
//    by any fixed constant — it pins the *units*, not a magic number.
// ---------------------------------------------------------------------------

import { seedAndRun } from '../support/seedProject';

interface FileSpec {
  name: string;
  source: string;
}

function run(projectName: string, files: FileSpec[], waitMs = 5000) {
  seedAndRun({ name: projectName, files }, waitMs);
}

function consoleLines(): Cypress.Chainable<string[]> {
  return cy.get('ul li').then(($items) =>
    Cypress._.map($items.toArray(), (el) => (el as HTMLElement).innerText.trim())
  );
}

function findLine(lines: string[], needle: string): string | undefined {
  return lines.find((l) => l.includes(needle));
}

describe('onupdate(delta) receives milliseconds', () => {
  // A frame counter (delta-value independent) plus a delta accumulator. The
  // counter decides *when* to report, the accumulator is what is under test —
  // so the checkpoint line proves 120 real frames elapsed no matter what units
  // delta happens to be in.
  const MODULE_PROBE = `
dim frames = 0
dim total = 0

function onupdate(delta)
  frames = frames + 1
  total = total + delta
  if frames = 120 then
    print "module-checkpoint total=" + string.str(total)
  endif
endfunction
`.trim();

  const INSTANCE_PROBE = `
Class
Extends text

dim frames
dim total

Constructor()
  super("*", 20, 20)
  self.frames = 0
  self.total = 0
EndConstructor

function onupdate(delta)
  self.frames = self.frames + 1
  self.total = self.total + delta
  if self.frames = 120 then
    print "instance-checkpoint total=" + string.str(self.total)
  endif
endfunction

EndClass
`.trim();

  const MAIN_WITH_INSTANCE = `
dim frames = 0
dim total = 0
dim probe = new deltaprobe()

world.add(probe)

function onupdate(delta)
  frames = frames + 1
  total = total + delta
  if frames = 120 then
    print "module-checkpoint total=" + string.str(total)
  endif
endfunction
`.trim();

  function assertMillisecondScale(line: string | undefined, label: string) {
    expect(line, `${label} reported — 120 real frames elapsed`).to.be.a('string');
    const total = Number(/total=([0-9.eE+-]+)/.exec(line as string)?.[1]);
    expect(total, `${label} total parsed`).to.be.a('number').and.not.be.NaN;

    const msPerFrame = total / 120;
    // A real frame is somewhere between 5ms (200fps) and 100ms (PIXI clamps at
    // its default minFPS of 10). Frame-normalised units land at ~1.0, which is
    // an order of magnitude below the floor — so this band separates the two
    // decisively while staying agnostic about the machine's actual frame rate.
    expect(
      msPerFrame,
      `${label}: delta averaged ${msPerFrame.toFixed(3)} per frame; ` +
        `milliseconds are expected (~16.7 at 60fps), ~1.0 means frame-normalised units`
    ).to.be.within(5, 100);
  }

  it('hands a module onupdate a per-frame delta in milliseconds', () => {
    run('Delta Units Module', [
      { name: 'Main', source: MODULE_PROBE },
    ]);

    cy.get('span').contains('ERR').should('not.exist');
    consoleLines().then((lines) => {
      assertMillisecondScale(findLine(lines, 'module-checkpoint'), 'module onupdate');
    });
  });

  it('hands an instance onupdate a per-frame delta in milliseconds', () => {
    run('Delta Units Instance', [
      { name: 'DeltaProbe', source: INSTANCE_PROBE },
      { name: 'Main', source: MAIN_WITH_INSTANCE },
    ]);

    cy.get('span').contains('ERR').should('not.exist');
    consoleLines().then((lines) => {
      // Control: module dispatch goes through _sbClasses, instance dispatch
      // through _sbInstances. Both read the same `delta`, so both must agree.
      assertMillisecondScale(findLine(lines, 'module-checkpoint'), 'module onupdate');
      assertMillisecondScale(findLine(lines, 'instance-checkpoint'), 'instance onupdate');
    });
  });

  // The strongest form of the proof: compare the deltas the engine actually
  // handed out against real elapsed time measured in the same window. No fixed
  // constant can satisfy this — it pins the units themselves.
  it('accumulates to the real elapsed wall-clock time in milliseconds', () => {
    run('Delta Units Wall Clock', [
      { name: 'Main', source: MODULE_PROBE },
    ], 2000);

    // The runner iframe is same-origin (sandbox allows it) but `_sb` is a
    // top-level `const`, so it lives in the frame's lexical scope rather than on
    // `window` — reach it through the frame's own eval.
    cy.get('iframe[title="Preview"]').then(($f) => {
      const win = ($f[0] as HTMLIFrameElement).contentWindow as Window & {
        eval: (s: string) => unknown;
      };
      win.eval(`
        globalThis.__deltaProbe = { sum: 0, frames: 0, t0: performance.now() };
        (() => {
          const original = _sb._update.bind(_sb);
          _sb._update = function (d) {
            globalThis.__deltaProbe.sum += d;
            globalThis.__deltaProbe.frames += 1;
            return original(d);
          };
        })();
      `);
    });

    cy.wait(3000);

    cy.get('iframe[title="Preview"]').then(($f) => {
      const win = ($f[0] as HTMLIFrameElement).contentWindow as Window & {
        eval: (s: string) => unknown;
      };
      const result = win.eval(`
        (() => {
          const p = globalThis.__deltaProbe;
          return { sum: p.sum, frames: p.frames, wall: performance.now() - p.t0 };
        })()
      `) as { sum: number; frames: number; wall: number };

      // Control: proves the ticker really drove frames during the window.
      expect(result.frames, 'frames really ran during the sample window').to.be.greaterThan(30);
      expect(result.wall, 'wall clock advanced').to.be.greaterThan(2000);

      const ratio = result.sum / result.wall;
      expect(
        ratio,
        `accumulated delta ${result.sum.toFixed(1)} vs wall clock ${result.wall.toFixed(1)}ms ` +
          `over ${result.frames} frames (ratio ${ratio.toFixed(4)}); ` +
          `1.0 means delta is milliseconds, ~0.06 means frame-normalised units`
      ).to.be.within(0.8, 1.2);
    });
  });

  // The user-facing contract from tutorial 7: "the score should tick up by one
  // every second". Pre-fix this branch never fired even once in a 5s window.
  it('drives the documented once-per-second timer pattern in real time', () => {
    run('Delta Units Timer', [
      {
        name: 'Main',
        source: `
dim timer = 0
dim ticks = 0
dim frames = 0

function onupdate(delta)
  frames = frames + 1
  timer = timer + delta
  if timer >= 1000 then
    ticks = ticks + 1
    timer = timer - 1000
    print "second-elapsed-" + string.str(ticks)
  endif
  if frames = 120 then
    print "frames-120"
  endif
endfunction
`.trim(),
      },
    ]);

    cy.get('span').contains('ERR').should('not.exist');
    consoleLines().then((lines) => {
      // Control: independent of delta's value, proves the game ran.
      expect(findLine(lines, 'frames-120'), '120 real frames elapsed').to.be.a('string');

      const ticks = lines.filter((l) => l.includes('second-elapsed-')).length;
      // A ~5s window minus boot time. Two-sided: too few means the timer is
      // running slow (the original bug), too many means it overshot.
      expect(
        ticks,
        `the once-per-second accumulator fired ${ticks} times in a ~5s window`
      ).to.be.within(2, 8);
    });
  });
});
