import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const assetmanagerSource = readFileSync('src/lib/Basic4WebGL/defs/assetmanager.bas', 'utf-8');

const transpile = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'assetmanager', source: assetmanagerSource }],
    files: [{ name: 'Main.bas', source }],
  });

describe('assetmanager.defineRegion — roadmap issue #9', () => {
  test('compiles to the expected _sb.defineRegion call', () => {
    const result = transpile(
      'assetmanager.defineRegion("enemyframes", "sheet.png", 0, 64, 128, 32)'
    );
    expect(result.diagnostics).toHaveLength(0);
    // The .bas wrapper function forwards its params straight through to
    // _sb.defineRegion; the call site invokes that wrapper with the literal
    // arguments.
    expect(result.code).toContain(
      '_sb.defineRegion(defineregion_newName, defineregion_sourceName, defineregion_x, defineregion_y, defineregion_width, defineregion_height)'
    );
    expect(result.code).toContain(
      'assetmanager.defineregion("enemyframes","sheet.png",0,64,128,32)'
    );
  });

  test('the resulting name can be passed straight into a sprite/tilemap/animatedsprite constructor', () => {
    const spriteSource = readFileSync('src/lib/Basic4WebGL/defs/sprite.bas', 'utf-8');
    const transformSource = readFileSync('src/lib/Basic4WebGL/defs/transform.bas', 'utf-8');
    const result = compiler.transpile({
      lib: [{ name: 'assetmanager', source: assetmanagerSource }],
      files: [
        { name: 'ObjectTransform.bas', source: transformSource },
        { name: 'sprite.bas', source: spriteSource },
        {
          name: 'Main.bas',
          source: [
            'assetmanager.defineRegion("enemyframes", "sheet.png", 0, 64, 128, 32)',
            'dim s as Sprite("enemyframes")',
          ].join('\n'),
        },
      ],
    });
    expect(result.diagnostics).toHaveLength(0);
  });
});
