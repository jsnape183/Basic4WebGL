import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

let gfxCreated = 0;
let spriteCreated = 0;
let textureCreated = 0;
let meshCreated = 0;
let meshDestroyed = 0;
let destroyed = 0;
let lastTexOpts: any = null;

class FakeGraphics {
  visible = true; position = { set() {} }; pivot = { set() {} };
  constructor() { gfxCreated++; }
  clear() { return this; }
  rect() { return this; } circle() { return this; } moveTo() { return this; } lineTo() { return this; }
  fill() { return this; } stroke() { return this; }
  destroy() { destroyed++; }
}
class FakeSprite {
  visible = true; width = 0; height = 0; tint = 0xffffff; anchor = { set() {} }; position = { set() {} };
  texture: unknown;
  constructor(t?: unknown) { spriteCreated++; this.texture = t; }
  destroy() { destroyed++; }
}
class FakeTexture {
  opts: any;
  constructor(opts?: unknown) { textureCreated++; this.opts = opts; lastTexOpts = opts; }
  destroy() { destroyed++; }
}
class FakeRectangle { constructor(public x: number, public y: number, public w: number, public h: number) {} }
class FakePerspectiveMesh {
  visible = true; tint = 0xffffff; position = { set() {} };
  texture: unknown; opts: any; corners: number[] | null = null;
  constructor(opts?: any) { meshCreated++; this.opts = opts; this.texture = opts?.texture; }
  setCorners(...c: number[]) { this.corners = c; }
  destroy() { destroyed++; meshDestroyed++; }
}
class FakeContainer {
  children: unknown[] = [];
  addChild(c: unknown) { if (!this.children.includes(c)) this.children.push(c); } // dedupe like real PIXI
  removeChild(c: unknown) { this.children = this.children.filter((x) => x !== c); }
  removeChildren() { this.children = []; }
}

function loadDrawing() {
  gfxCreated = spriteCreated = textureCreated = destroyed = meshCreated = meshDestroyed = 0;
  lastTexOpts = null;
  const src = readFileSync('src/components/Runner/engine/drawing.js', 'utf-8');
  const PIXI = {
    Graphics: FakeGraphics, Sprite: FakeSprite, Texture: FakeTexture,
    Rectangle: FakeRectangle, PerspectiveMesh: FakePerspectiveMesh,
  };
  const worldContainer = new FakeContainer();
  const _sbAssets = { get: () => ({ source: { style: {} }, width: 64, height: 64 }) };
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
    expect(destroyed).toBe(3); // 1 Graphics (reused via pool) + 1 pooled Sprite + 1 cached Texture
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

describe('drawing — drawImageStrip tint + vertical source clip', () => {
  test('drawImageStrip applies tint', () => {
    const { d } = loadDrawing();
    const s = d.drawImageStrip('w.png', 3, 0, 0, 4, 40, 0x804020);
    expect(s.tint).toBe(0x804020);
    const s2 = d.drawImageStrip('w.png', 3, 0, 0, 4, 40); // 6-arg -> default white
    expect(s2.tint).toBe(0xffffff);
  });

  test('drawImageStrip clips source V', () => {
    const { d } = loadDrawing();
    d.drawImageStrip('w.png', 3, 0, 0, 4, 40, 0xffffff, 0.25, 0.75);
    let rect = lastTexOpts.frame;
    expect(rect.y).toBe(16);
    expect(rect.h).toBe(32);
    d.drawImageStrip('w.png', 7, 0, 0, 4, 40); // 6-arg -> full height
    rect = lastTexOpts.frame;
    expect(rect.y).toBe(0);
    expect(rect.h).toBe(64);
  });

  test('_texCache key includes V window', () => {
    const { d } = loadDrawing();
    d.drawImageStrip('w.png', 3, 0, 0, 4, 40, 0xffffff, 0, 1);
    d.drawImageStrip('w.png', 3, 0, 0, 4, 40, 0xffffff, 0.25, 1);
    expect(textureCreated).toBe(2);
  });
});

describe('drawing — drawFloorStrip (perspective mesh)', () => {
  test('drawFloorStrip creates a mesh with the four screen corners', () => {
    const { d } = loadDrawing();
    const m = d.drawFloorStrip('f.png', 100, 50, 30, 2, 3, 5, 8, 4, 0xc0c0c0);
    expect(meshCreated).toBe(1);
    // corners: TL/TR at yFar=30, BR/BL at yNear=50, x = destX ± stripW/2 (100 ± 2)
    expect(m.corners).toEqual([98, 30, 102, 30, 102, 50, 98, 50]);
    expect(m.tint).toBe(0xc0c0c0);
  });

  test('drawFloorStrip pools the mesh across clearDrawing', () => {
    const { d } = loadDrawing();
    d.drawFloorStrip('f.png', 100, 50, 30, 2, 3, 5, 8, 4, 0xc0c0c0);
    d.clearDrawing();
    d.drawFloorStrip('f.png', 100, 50, 30, 2, 3, 5, 8, 4, 0xc0c0c0);
    expect(meshCreated).toBe(1);
  });

  test('drawFloorStrip defaults tint to white when omitted', () => {
    const { d } = loadDrawing();
    const m = d.drawFloorStrip('f.png', 100, 50, 30, 2, 3, 5, 8, 4);
    expect(m.tint).toBe(0xffffff);
  });

  test('_drawingReset destroys pooled meshes', () => {
    const { d } = loadDrawing();
    d.drawFloorStrip('f.png', 100, 50, 30, 2, 3, 5, 8, 4, 0xc0c0c0);
    d.clearDrawing();
    d._drawingReset();
    expect(meshDestroyed).toBe(1);
  });
});
