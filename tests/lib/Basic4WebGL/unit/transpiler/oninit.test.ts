import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import '@Basic4WebGL/transpilerRules';
import { compileOk } from '../../helpers';

const sceneManagerSource = readFileSync(
  'src/lib/Basic4WebGL/defs/SceneManager.bas',
  'utf-8'
);

// Two-phase module initialisation: a root's inert declarations stay inline so
// they can run before assets preload (which is what makes `oninit` possible),
// while its own top-level statements are deferred until after preload.

describe('two-phase module initialisation', () => {
  test('defers a module top-level statements into _sb._deferModuleBody', () => {
    const code = compileOk({
      lib: [],
      files: [
        {
          name: 'Main.bas',
          source: `dim score = 0
score = 10

function onupdate(delta)
  score = score + 1
endfunction
`,
        },
      ],
    });

    expect(code).toContain('_sb._deferModuleBody(()=>{');
    const deferStart = code.indexOf('_sb._deferModuleBody');
    const body = code.slice(deferStart);
    expect(body).toContain('main.score=0;');
    expect(body).toContain('main.score=10;');
  });

  test('keeps function declarations out of the deferred body', () => {
    const code = compileOk({
      lib: [],
      files: [
        {
          name: 'Main.bas',
          source: `dim score = 0

function onupdate(delta)
  score = score + 1
endfunction
`,
        },
      ],
    });

    const declIndex = code.indexOf('main.onupdate=');
    const deferIndex = code.indexOf('_sb._deferModuleBody');
    expect(declIndex).toBeGreaterThan(-1);
    expect(deferIndex).toBeGreaterThan(-1);
    expect(declIndex).toBeLessThan(deferIndex);
  });

  test('emits no deferred body for a declaration-only module', () => {
    const code = compileOk({
      lib: [],
      files: [
        {
          name: 'Main.bas',
          source: `function onupdate(delta)
  print "tick"
endfunction
`,
        },
      ],
    });

    expect(code).toContain('constmain={};');
    expect(code).not.toContain('_sb._deferModuleBody');
  });

  test('emits an oninit hook as an ordinary module function declaration', () => {
    const code = compileOk({
      lib: [],
      files: [
        {
          name: 'Main.bas',
          source: `function oninit()
  print "booting"
endfunction
`,
        },
      ],
    });

    expect(code).toContain('main.oninit=()=>{');
    // The engine discovers it through _sbClasses, exactly like onenter.
    expect(code).toContain('_sb._sbClasses=[{name:"main",symbol:main}];');
  });

  test('defers class-level dim assignments but not the class declaration', () => {
    const code = compileOk({
      lib: [],
      files: [
        {
          name: 'Player',
          source: `Class
  dim health = 100

  function hit(amount)
    self.health = self.health - amount
  endfunction
EndClass`,
        },
      ],
    });

    const classIndex = code.indexOf('class_sb_player');
    const methodIndex = code.indexOf('_sb_player.prototype.hit=');
    const deferIndex = code.indexOf('_sb._deferModuleBody');
    expect(classIndex).toBeLessThan(deferIndex);
    expect(methodIndex).toBeLessThan(deferIndex);
    expect(code.slice(deferIndex)).toContain('_sb_player.prototype.health=100;');
  });

  test('registers deferred bodies in file order', () => {
    const code = compileOk({
      lib: [{ name: 'scenemanager', source: sceneManagerSource }],
      files: [
        {
          name: 'MenuScene',
          source: `Class
  dim label = "menu"

  function onenter()
    print "menu"
  endfunction
EndClass`,
        },
        {
          name: 'Main.bas',
          source: `dim m = new menuscene()
scenemanager.register("menu", m)
`,
        },
      ],
    });

    const first = code.indexOf('_sb._deferModuleBody');
    const second = code.indexOf('_sb._deferModuleBody', first + 1);
    expect(first).toBeGreaterThan(-1);
    expect(second).toBeGreaterThan(first);
    expect(code.slice(first, second)).toContain('_sb_menuscene.prototype.label=');
    expect(code.slice(second)).toContain('scenemanager.register("menu",main.m);');
  });

  test('emits _sbClasses after every declaration so _fireInit can walk it', () => {
    const code = compileOk({
      lib: [],
      files: [
        {
          name: 'Main.bas',
          source: `dim score = 0

function oninit()
  print "booting"
endfunction
`,
        },
      ],
    });

    expect(code.indexOf('_sb._sbClasses=')).toBeGreaterThan(
      code.indexOf('_sb._deferModuleBody')
    );
  });
});
