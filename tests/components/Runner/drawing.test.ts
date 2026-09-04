import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

let gfxCreated = 0;
let spriteCreated = 0;
let textureCreated = 0;
let meshCreated = 0;
let meshDestroyed = 0;
let destroyed = 0;
let lastTexOpts: any = null;
let gradientCreated = 0;
let gradientDestroyed = 0;

class FakeGraphics {
  visible = true; position = { set() {} }; pivot = { set() {} };
  parent: unknown = undefined; zIndex = 0;
  lastFill: unknown = undefined;
  constructor() { gfxCreated++; }
  clear() { return this; }
  rect() { return this; } circle() { return this; } moveTo() { return this; } lineTo() { return this; }
  fill(style?: unknown) { this.lastFill = style; return this; } stroke() { return this; }
  destroy() { destroyed++; }
}
class FakeSprite {
  visible = true; width = 0; height = 0; tint = 0xffffff; anchor = { set() {} }; position = { set() {} };
  parent: unknown = undefined; zIndex = 0;
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
  parent: unknown = undefined; zIndex = 0;
  texture: unknown; opts: any; corners: number[] | null = null;
  constructor(opts?: any) { meshCreated++; this.opts = opts; this.texture = opts?.texture; }
  setCorners(...c: number[]) { this.corners = c; }
  destroy() { destroyed++; meshDestroyed++; }
}
class FakeContainer {
  children: any[] = [];
  addChild(c: any) { c.parent = this; if (!this.children.includes(c)) this.children.push(c); } // dedupe like real PIXI; track parent
  removeChild(c: any) { c.parent = undefined; this.children = this.children.filter((x) => x !== c); }
  removeChildren() { this.children.forEach((c) => { c.parent = undefined; }); this.children = []; }
}
class FakeFillGradient {
  opts: any;
  constructor(opts?: unknown) { gradientCreated++; this.opts = opts; }
  destroy() { gradientDestroyed++; }
}

function loadDrawing() {
  gfxCreated = spriteCreated = textureCreated = destroyed = meshCreated = meshDestroyed = 0;
  gradientCreated = gradientDestroyed = 0;
  lastTexOpts = null;
  const src = readFileSync('src/components/Runner/engine/drawing.js', 'utf-8');
  const PIXI = {
    Graphics: FakeGraphics, Sprite: FakeSprite, Texture: FakeTexture,
    Rectangle: FakeRectangle, PerspectiveMesh: FakePerspectiveMesh,
    FillGradient: FakeFillGradient,
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
    d.drawRect(0, 0, 10, 10);
    d.clearDrawing();                 // -> pool, still (hidden) children
    worldContainer.removeChildren();  // scene switch / world.clearWorld()
    d.drawRect(0, 0, 10, 10);         // pops the detached pooled objects
    d.drawRect(0, 0, 10, 10);
    expect(worldContainer.children.length).toBe(2);        // both re-attached
    expect(worldContainer.children.every((c: any) => c.visible)).toBe(true);
  });

  test('drawRect does not re-addChild a pooled object across frames', () => {
    const { d, worldContainer } = loadDrawing();
    let addCalls = 0;
    const realAdd = worldContainer.addChild.bind(worldContainer);
    worldContainer.addChild = (c: any) => { addCalls++; realAdd(c); };
    d.drawRect(0, 0, 10, 10); d.drawRect(0, 0, 10, 10); d.drawRect(0, 0, 10, 10);
    d.clearDrawing();
    d.drawRect(0, 0, 10, 10); d.drawRect(0, 0, 10, 10); d.drawRect(0, 0, 10, 10);
    expect(addCalls).toBe(3);                       // not 6 -- reused objects are not re-added
    expect(worldContainer.children.length).toBe(3);
  });

  test('assigns increasing zIndex in draw order, resetting each frame', () => {
    const { d } = loadDrawing();
    const a = d.drawRect(0, 0, 10, 10);
    const b = d.drawImageStrip('wall.png', 3, 0, 0, 4, 40);
    const c = d.drawRect(0, 0, 10, 10);
    expect(a.zIndex).toBeGreaterThanOrEqual(1_000_000);
    expect(a.zIndex).toBeLessThan(b.zIndex);
    expect(b.zIndex).toBeLessThan(c.zIndex);
    d.clearDrawing();
    const dd = d.drawRect(0, 0, 10, 10);
    expect(dd.zIndex).toBe(1_000_000);             // counter reset each frame
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

describe('drawing — vertical gradient fill', () => {
  test('drawVGradientRect fills with a linear top-to-bottom gradient using the given colours', () => {
    const { d } = loadDrawing();
    const o = d.drawVGradientRect(10, 20, 4, 30, 255, 0, 0, 0, 0, 255) as FakeGraphics;
    const style = o.lastFill as { opts: { type: string; start: { x: number; y: number }; end: { x: number; y: number }; colorStops: Array<{ offset: number; color: number }> } };
    expect(style.opts.type).toBe('linear');
    expect(style.opts.start).toEqual({ x: 0, y: 0 });
    expect(style.opts.end).toEqual({ x: 0, y: 1 });
    expect(style.opts.colorStops).toEqual([
      { offset: 0, color: 0xff0000 },
      { offset: 1, color: 0x0000ff },
    ]);
  });

  test('drawVGradientRect is pooled exactly like drawRect', () => {
    const { d } = loadDrawing();
    d.drawVGradientRect(0, 0, 10, 10, 255, 255, 255, 0, 0, 0);
    d.drawVGradientRect(0, 0, 10, 10, 255, 255, 255, 0, 0, 0);
    expect(gfxCreated).toBe(2);
    d.clearDrawing();
    d.drawVGradientRect(0, 0, 10, 10, 255, 255, 255, 0, 0, 0);
    d.drawVGradientRect(0, 0, 10, 10, 255, 255, 255, 0, 0, 0);
    expect(gfxCreated).toBe(2); // reused from the pool
  });

  test('reuses a cached PIXI.FillGradient for the same colour pair instead of allocating a new GPU resource every call', () => {
    // Each PIXI.FillGradient allocates a real backing texture -- a raycaster
    // floor/ceiling shading path calling this per column, every frame, with no
    // reuse exhausts VRAM within seconds and takes the whole WebGL context down
    // with it. This must not scale with call count for a small palette of
    // distinct light levels.
    const { d } = loadDrawing();
    for (let i = 0; i < 50; i++) {
      d.drawVGradientRect(0, 0, 4, 30, 255, 0, 0, 0, 0, 255);
    }
    expect(gradientCreated).toBe(1);
  });

  test('quantises colour channels so nearly-identical light levels still share a cached gradient', () => {
    // Quantisation step is 4 (round(c/4)*4); 98..101 and 46..49 both round to
    // the same bucket (100 and 48 respectively) -- values chosen to stay
    // inside one bucket, not straddle a rounding boundary.
    const { d } = loadDrawing();
    d.drawVGradientRect(0, 0, 4, 30, 99, 100, 101, 47, 48, 49);
    d.drawVGradientRect(0, 0, 4, 30, 100, 99, 100, 48, 47, 48);
    expect(gradientCreated).toBe(1);
  });

  test('clearDrawing() never destroys cached gradients -- only a full scene reset does', () => {
    const { d } = loadDrawing();
    d.drawVGradientRect(0, 0, 4, 30, 255, 0, 0, 0, 0, 255);
    d.clearDrawing();
    // clearDrawing() clears the Graphics pool, not the gradient cache (it's
    // keyed by colour, independent of any one frame) -- it should NOT be
    // destroyed here, only on a full scene reset.
    expect(gradientDestroyed).toBe(0);
  });

  test('does not evict or destroy cached gradients no matter how many distinct colour pairs accumulate', () => {
    // Regression guard: an earlier version LRU-capped this cache at 512 and
    // destroyed the oldest entry past that -- but a FillGradient can still be
    // referenced by a Graphics object PIXI hasn't finished batching for the
    // current frame (its GPU resources are built lazily), so destroying one
    // still in flight crashed the renderer with null-texture errors, not a
    // graceful cache miss. Real gameplay (many distinct quantised light
    // levels across a level) exceeds 512 in normal use, so this must never
    // destroy anything mid-session.
    const { d } = loadDrawing();
    for (let i = 0; i < 1000; i++) {
      d.drawVGradientRect(0, 0, 4, 30, i % 256, 0, 0, 0, 0, 255);
    }
    expect(gradientDestroyed).toBe(0);
  });

  test('_drawingReset destroys the whole gradient cache (safe -- everything referencing it is torn down together)', () => {
    const { d } = loadDrawing();
    d.drawVGradientRect(0, 0, 4, 30, 255, 0, 0, 0, 0, 255);
    d.drawVGradientRect(0, 0, 4, 30, 0, 255, 0, 0, 0, 255);
    d._drawingReset();
    expect(gradientDestroyed).toBe(2);
    // and a subsequent call must rebuild from scratch, not reuse a destroyed instance
    d.drawVGradientRect(0, 0, 4, 30, 255, 0, 0, 0, 0, 255);
    expect(gradientCreated).toBe(3);
  });
});
