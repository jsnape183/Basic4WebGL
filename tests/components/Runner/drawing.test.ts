import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

let gfxCreated = 0;
let spriteCreated = 0;
let textureCreated = 0;
let destroyed = 0;

class FakeGraphics {
  visible = true; position = { set() {} }; pivot = { set() {} };
  constructor() { gfxCreated++; }
  clear() { return this; }
  rect() { return this; } circle() { return this; } moveTo() { return this; } lineTo() { return this; }
  fill() { return this; } stroke() { return this; }
  destroy() { destroyed++; }
}
class FakeSprite {
  visible = true; width = 0; height = 0; anchor = { set() {} }; position = { set() {} };
  texture: unknown;
  constructor(t: unknown) { spriteCreated++; this.texture = t; }
  destroy() { destroyed++; }
}
class FakeTexture { constructor() { textureCreated++; } destroy() { destroyed++; } }
class FakeRectangle { constructor(public x: number, public y: number, public w: number, public h: number) {} }
class FakeContainer {
  children: unknown[] = [];
  addChild(c: unknown) { if (!this.children.includes(c)) this.children.push(c); } // dedupe like real PIXI
  removeChild(c: unknown) { this.children = this.children.filter((x) => x !== c); }
  removeChildren() { this.children = []; }
}

function loadDrawing() {
  gfxCreated = spriteCreated = textureCreated = destroyed = 0;
  const src = readFileSync('src/components/Runner/engine/drawing.js', 'utf-8');
  const PIXI = { Graphics: FakeGraphics, Sprite: FakeSprite, Texture: FakeTexture, Rectangle: FakeRectangle };
  const worldContainer = new FakeContainer();
  const _sbAssets = { get: () => ({ source: {}, width: 16, height: 64 }) };
  const factory = new Function(
    'PIXI', 'worldContainer', '_sbAssets',
    `${src}\n; return _sbDrawing;`,
  );
  return { d: factory(PIXI, worldContainer, _sbAssets), worldContainer };
}

describe('drawing — object pooling', () => {
  test('drawRect after clear reuses the Graphics, does not allocate a new one', () => {
    const { d } = loadDrawing();
    d.drawRect(0, 0, 10, 10);
    d.drawRect(0, 0, 10, 10);
    expect(gfxCreated).toBe(2);
    d.clearDrawing();
    d.drawRect(0, 0, 10, 10);
    d.drawRect(0, 0, 10, 10);
    expect(gfxCreated).toBe(2); // reused from the pool, no new allocations
  });

  test('clearDrawing does not destroy pooled objects', () => {
    const { d } = loadDrawing();
    d.drawRect(0, 0, 10, 10);
    d.clearDrawing();
    expect(destroyed).toBe(0);
  });

  test('drawImageStrip caches the texture per (image, srcX)', () => {
    const { d } = loadDrawing();
    d.drawImageStrip('wall.png', 3, 0, 0, 4, 40);
    d.drawImageStrip('wall.png', 3, 8, 0, 4, 40); // same srcX -> cached texture
    expect(textureCreated).toBe(1);
    d.drawImageStrip('wall.png', 5, 0, 0, 4, 40); // new srcX -> new texture
    expect(textureCreated).toBe(2);
  });

  test('drawImageStrip after clear reuses the Sprite', () => {
    const { d } = loadDrawing();
    d.drawImageStrip('wall.png', 3, 0, 0, 4, 40);
    d.clearDrawing();
    d.drawImageStrip('wall.png', 3, 0, 0, 4, 40);
    expect(spriteCreated).toBe(1);
  });

  test('_drawingReset destroys everything (pooled + live) and clears caches', () => {
    const { d } = loadDrawing();
    d.drawRect(0, 0, 10, 10);
    d.drawImageStrip('wall.png', 3, 0, 0, 4, 40);
    d.clearDrawing();          // -> pool
    d.drawRect(0, 0, 10, 10);  // -> live
    d._drawingReset();
    expect(destroyed).toBe(3); // 1 live Graphics + 1 pooled Graphics + 1 pooled Sprite
    // after reset, a fresh draw allocates anew
    d.drawRect(0, 0, 10, 10);
    const before = gfxCreated;
    d.clearDrawing();
    d.drawRect(0, 0, 10, 10);
    expect(gfxCreated).toBe(before); // pool still works post-reset
  });

  test('a shrinking frame returns excess objects to the pool, not leaked as visible', () => {
    const { d, worldContainer } = loadDrawing();
    d.drawRect(0, 0, 1, 1); d.drawRect(0, 0, 1, 1); d.drawRect(0, 0, 1, 1);
    d.clearDrawing();
    d.drawRect(0, 0, 1, 1); // only 1 this frame
    const visible = worldContainer.children.filter((c: any) => c.visible).length;
    expect(visible).toBe(1);
  });

  test('drawRect re-attaches a pooled object after worldContainer.removeChildren()', () => {
    const { d, worldContainer } = loadDrawing();
    d.drawRect(0, 0, 10, 10);
    d.clearDrawing();                 // -> pool, still a (hidden) child
    worldContainer.removeChildren();  // scene switch / world.clearWorld()
    d.drawRect(0, 0, 10, 10);         // pops the detached pooled object
    expect(worldContainer.children.length).toBe(1);        // re-attached
    expect((worldContainer.children[0] as any).visible).toBe(true);
  });
});
