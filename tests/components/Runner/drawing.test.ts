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
  rect() { return this; } circle() { return this; } ellipse() { return this; } moveTo() { return this; } lineTo() { return this; }
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
let bufSourceCreated = 0;
let bufSourceUpdated = 0;
class FakeBufferImageSource {
  opts: any; resource: unknown; width: number; height: number;
  constructor(opts?: any) { bufSourceCreated++; this.opts = opts; this.resource = opts?.resource; this.width = opts?.width; this.height = opts?.height; }
  update() { bufSourceUpdated++; }
  destroy() { destroyed++; }
}
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
  bufSourceCreated = bufSourceUpdated = 0;
  lastTexOpts = null;
  const src = readFileSync('src/components/Runner/engine/drawing.js', 'utf-8');
  const PIXI = {
    Graphics: FakeGraphics, Sprite: FakeSprite, Texture: FakeTexture,
    Rectangle: FakeRectangle, PerspectiveMesh: FakePerspectiveMesh,
    FillGradient: FakeFillGradient, BufferImageSource: FakeBufferImageSource,
  };
  const worldContainer = new FakeContainer();
  const _sharedSource = { style: {} as { addressMode?: string } };
  const _sbAssets = { get: () => ({ source: _sharedSource, width: 64, height: 64 }) };
  const factory = new Function(
    'PIXI', 'worldContainer', '_sbAssets',
    `${src}\n; return _sbDrawing;`,
  );
  return { d: factory(PIXI, worldContainer, _sbAssets), worldContainer, sharedSource: _sharedSource };
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

  test('a V range beyond [0,1] tiles: oversized frame + source set to repeat', () => {
    const { d, sharedSource } = loadDrawing();
    d.drawImageStrip('w.png', 3, 0, 0, 4, 120, 0xffffff, 0, 3); // 3 tiles tall
    const rect = lastTexOpts.frame;
    expect(rect.y).toBe(0);
    expect(rect.h).toBe(192); // 3 * 64
    expect(sharedSource.style.addressMode).toBe('repeat');
  });

  test('an in-range V clip leaves the frame maths as-is', () => {
    const { d } = loadDrawing();
    d.drawImageStrip('w.png', 3, 0, 0, 4, 40, 0xffffff, 0.25, 0.75);
    expect(lastTexOpts.frame.h).toBe(32);
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

describe('drawing — radial gradient fill (light-pool POC)', () => {
  test('drawRadialGradientCircle fills a circle with a radial gradient from the given colour to fully transparent', () => {
    const { d } = loadDrawing();
    const o = d.drawRadialGradientCircle(50, 60, 40, 255, 220, 160, 0.6) as FakeGraphics;
    const style = o.lastFill as {
      opts: {
        type: string;
        center: { x: number; y: number };
        innerRadius: number;
        outerCenter: { x: number; y: number };
        outerRadius: number;
        colorStops: Array<{ offset: number; color: { r: number; g: number; b: number; a: number } }>;
      };
    };
    expect(style.opts.type).toBe('radial');
    expect(style.opts.center).toEqual({ x: 0.5, y: 0.5 });
    expect(style.opts.innerRadius).toBe(0);
    expect(style.opts.outerCenter).toEqual({ x: 0.5, y: 0.5 });
    expect(style.opts.outerRadius).toBe(0.5);
    expect(style.opts.colorStops[0].offset).toBe(0);
    expect(style.opts.colorStops[0].color.a).toBeCloseTo(0.6, 5);
    expect(style.opts.colorStops[1].offset).toBe(1);
    expect(style.opts.colorStops[1].color.a).toBe(0);
  });

  test('is pooled exactly like drawCircle', () => {
    const { d } = loadDrawing();
    d.drawRadialGradientCircle(0, 0, 10, 255, 255, 255, 0.5);
    d.drawRadialGradientCircle(0, 0, 10, 255, 255, 255, 0.5);
    expect(gfxCreated).toBe(2);
    d.clearDrawing();
    d.drawRadialGradientCircle(0, 0, 10, 255, 255, 255, 0.5);
    d.drawRadialGradientCircle(0, 0, 10, 255, 255, 255, 0.5);
    expect(gfxCreated).toBe(2); // reused from the pool
  });

  test('reuses a cached PIXI.FillGradient for the same colour+alpha instead of allocating a new GPU resource every call', () => {
    const { d } = loadDrawing();
    for (let i = 0; i < 50; i++) {
      d.drawRadialGradientCircle(0, 0, 10, 255, 220, 160, 0.6);
    }
    expect(gradientCreated).toBe(1);
  });

  test('does not evict or destroy cached gradients no matter how many distinct colour+alpha pairs accumulate', () => {
    const { d } = loadDrawing();
    for (let i = 0; i < 1000; i++) {
      d.drawRadialGradientCircle(0, 0, 10, i % 256, 0, 0, 0.5);
    }
    expect(gradientDestroyed).toBe(0);
  });

  test('_drawingReset destroys the cached radial gradients too', () => {
    const { d } = loadDrawing();
    d.drawRadialGradientCircle(0, 0, 10, 255, 220, 160, 0.6);
    const createdBefore = gradientCreated;
    d._drawingReset();
    expect(gradientDestroyed).toBeGreaterThanOrEqual(createdBefore);
    d.drawRadialGradientCircle(0, 0, 10, 255, 220, 160, 0.6);
    expect(gradientCreated).toBe(createdBefore + 1); // rebuilt, not reused from a destroyed instance
  });

  test('drawRadialGradientEllipse fills an ellipse with the same radial gradient, and shares the circle cache', () => {
    const { d } = loadDrawing();
    // same colour+alpha as a circle call -> must reuse the one cached gradient
    d.drawRadialGradientCircle(0, 0, 10, 255, 220, 160, 0.6);
    const o = d.drawRadialGradientEllipse(50, 60, 80, 20, 255, 220, 160, 0.6) as FakeGraphics;
    expect(gradientCreated).toBe(1);
    const style = o.lastFill as { opts: { type: string; colorStops: Array<{ color: { a: number } }> } };
    expect(style.opts.type).toBe('radial');
    expect(style.opts.colorStops[1].color.a).toBe(0);
  });

  test('drawRadialGradientEllipse is pooled like the other shapes', () => {
    const { d } = loadDrawing();
    d.drawRadialGradientEllipse(0, 0, 40, 10, 255, 255, 255, 0.5);
    d.drawRadialGradientEllipse(0, 0, 40, 10, 255, 255, 255, 0.5);
    expect(gfxCreated).toBe(2);
    d.clearDrawing();
    d.drawRadialGradientEllipse(0, 0, 40, 10, 255, 255, 255, 0.5);
    d.drawRadialGradientEllipse(0, 0, 40, 10, 255, 255, 255, 0.5);
    expect(gfxCreated).toBe(2); // reused from the pool
  });
});

describe('drawing — registerLightmap + drawPlaneField (floor-field POC)', () => {
  // Forward projection: world (wx,wy) on plane height planeZ -> screen pixel,
  // using the same camera-plane transform RcRender uses. Inverse of
  // _planeFieldWorldPos, written independently here.
  function projectPixel(wx: number, wy: number, p: any) {
    const relX = wx - p.camX;
    const relY = wy - p.camY;
    const invDet = 1 / (p.fPlaneX * p.fDirY - p.fDirX * p.fPlaneY);
    const d = invDet * (-p.fPlaneY * relX + p.fPlaneX * relY);
    const tX = invDet * (p.fDirY * relX - p.fDirX * relY);
    const px = (p.viewW / 2) * (1 + tX / d);
    const zDiff = p.camZ + p.eyeZ - p.planeZ;
    const py = p.scy + p.camPitch + (zDiff * p.viewH) / d;
    return { px, py, d };
  }

  function pose(angle: number, camX = 4.5, camY = 4.5): any {
    const fov = 0.66;
    const dirX = Math.cos(angle), dirY = Math.sin(angle);
    return {
      camX, camY, camZ: 0,
      fDirX: dirX, fDirY: dirY,
      fPlaneX: -dirY * fov, fPlaneY: dirX * fov,
      camPitch: 0, viewW: 320, viewH: 200, scy: 100, eyeZ: 0.5, planeZ: 0,
    };
  }

  test('_planeFieldWorldPos is the exact inverse of the forward projection, at every camera angle', () => {
    const { d: draw } = loadDrawing();
    const targets = [
      { wx: 5.5, wy: 6.0 },
      { wx: 3.2, wy: 7.8 },
      { wx: 6.9, wy: 4.7 },
    ];
    for (const ang of [0, 0.4, Math.PI / 2, 2.1, -1.3]) {
      const p = pose(ang);
      for (const t of targets) {
        const fwd = projectPixel(t.wx, t.wy, p);
        if (fwd.d <= 0.05 || fwd.py <= p.scy) continue; // not on the visible floor for this pose
        const back = draw._planeFieldWorldPos(fwd.px, fwd.py, p);
        expect(back).not.toBeNull();
        expect(back.wx).toBeCloseTo(t.wx, 4);
        expect(back.wy).toBeCloseTo(t.wy, 4);
      }
    }
  });

  test('a fixed screen pixel maps to a pose-dependent world point, but the round-trip always holds (ground-lock)', () => {
    const { d: draw } = loadDrawing();
    const px = 200, py = 150;
    const wpA = draw._planeFieldWorldPos(px, py, pose(0.2));
    const wpB = draw._planeFieldWorldPos(px, py, pose(0.2 + 0.15)); // small rotation
    expect(wpA).not.toBeNull();
    expect(wpB).not.toBeNull();
    // the world point under the pixel moves when the camera turns...
    expect(Math.hypot(wpA.wx - wpB.wx, wpA.wy - wpB.wy)).toBeGreaterThan(0.01);
    // ...but each still projects back to exactly that pixel
    const rtA = projectPixel(wpA.wx, wpA.wy, pose(0.2));
    expect(rtA.px).toBeCloseTo(px, 3);
    expect(rtA.py).toBeCloseTo(py, 3);
  });

  test('_planeFieldWorldPos returns null above the horizon for a floor plane', () => {
    const { d: draw } = loadDrawing();
    expect(draw._planeFieldWorldPos(160, 40, pose(0))).toBeNull(); // py < horizon (100)
  });

  test('registerLightmap builds a clamped buffer source + texture; rebuilding an id destroys the old', () => {
    const { d } = loadDrawing();
    const bytes = new Array(2 * 2 * 4).fill(255);
    d.registerLightmap('lm', 2, 2, 10, 20, bytes);
    expect(bufSourceCreated).toBe(1);
    expect(textureCreated).toBe(1);
    expect(lastTexOpts.source.opts.addressMode).toBe('clamp-to-edge');
    expect(lastTexOpts.source.opts.width).toBe(2);
    const before = destroyed;
    d.registerLightmap('lm', 2, 2, 10, 20, bytes);
    expect(destroyed).toBe(before + 1); // previous texture destroyed
  });

  test('drawPlaneField paints lit floor pixels, reuses its sprite + buffer across frames, and honours the lightmap', () => {
    const { d, worldContainer } = loadDrawing();
    // 1x1 lightmap, fully dark
    d.registerLightmap('lmDark', 1, 1, 10, 20, [0, 0, 0, 255]);
    const p = pose(Math.PI / 2, 4.5, 3.0);
    const args = [
      'floor', '', '', 0, p.camX, p.camY, p.camZ, p.fDirX, p.fDirY, p.fPlaneX, p.fPlaneY,
      p.camPitch, p.viewW, p.viewH, p.scy, p.eyeZ, 'lmDark', 0.1, 200, 180, 150,
    ] as const;
    const s1 = d.drawPlaneField(...args);
    expect(worldContainer.children).toContain(s1);
    expect(spriteCreated).toBe(1);
    expect(bufSourceCreated).toBe(2); // lightmap + field
    // dark lightmap + ambient 0.1 -> floor pixels are dim but present (alpha 255)
    const src = (s1.texture as any).opts.source;
    const buf = src.resource as Uint8Array;
    const bw = src.width as number; // downscaled buffer width
    const bh = src.height as number;
    let litBelow = 0;
    for (let y = Math.floor(bh / 2) + 5; y < bh; y++) {
      const o = (y * bw + Math.floor(bw / 2)) * 4;
      if (buf[o + 3] === 255 && buf[o] > 0 && buf[o] < 120) litBelow++;
    }
    expect(litBelow).toBeGreaterThan(5);
    const s2 = d.drawPlaneField(...args);
    expect(s2).toBe(s1);              // same persistent sprite
    expect(spriteCreated).toBe(1);    // no new allocation
    expect(bufSourceUpdated).toBeGreaterThan(0); // updated in place

    d._drawingReset();
    expect(worldContainer.children).not.toContain(s1);
  });

  test('_fieldTexPixels returns null when no 2D canvas is available, and drawPlaneField still renders (procedural fallback)', () => {
    const { d } = loadDrawing();
    expect(d._fieldTexPixels('some_tiles.png')).toBeNull(); // jsdom: no canvas 2D context
    d.registerLightmap('lm1', 1, 1, 10, 20, [255, 255, 255, 255]);
    const p = pose(Math.PI / 2, 4.5, 3.0);
    const s = d.drawPlaneField(
      'floorTex', 'some_tiles.png', '', 0, p.camX, p.camY, p.camZ, p.fDirX, p.fDirY, p.fPlaneX, p.fPlaneY,
      p.camPitch, p.viewW, p.viewH, p.scy, p.eyeZ, 'lm1', 0.1, 200, 180, 150,
    );
    const src = (s.texture as any).opts.source;
    const buf = src.resource as Uint8Array;
    let lit = 0;
    for (let i = 3; i < buf.length; i += 4) if (buf[i] === 255) lit++;
    expect(lit).toBeGreaterThan(0); // still drew a floor via the checker fallback
  });

  test('registerFieldTiles decodes each named cell texture and drawPlaneField accepts the atlas id', () => {
    const { d } = loadDrawing();
    d.registerLightmap('lm2', 1, 1, 4, 4, [255, 255, 255, 255]);
    // 2x2 grid: one cell textured, three empty
    // cell 0 names a texture (undecodable under jsdom); every cell is also
    // flat-coloured 0x3366cc
    const names = new Array(16).fill('');
    names[0] = 'tileA.png';
    d.registerFieldTiles('atlas1', 4, 4, names, new Array(16).fill(0x3366cc));
    // the named tile was decode-attempted and cached (null under jsdom)
    expect(d._fieldTexPixels('tileA.png')).toBeNull();
    const p = pose(Math.PI / 2, 1.5, 0.5);
    const s = d.drawPlaneField(
      'ff', '', 'atlas1', 0, p.camX, p.camY, p.camZ, p.fDirX, p.fDirY, p.fPlaneX, p.fPlaneY,
      p.camPitch, p.viewW, p.viewH, p.scy, p.eyeZ, 'lm2', 1.0, 160, 150, 140,
    );
    const buf = (s.texture as any).opts.source.resource as Uint8Array;
    let lit = 0;
    let sawBlue = 0;
    for (let i = 0; i < buf.length; i += 4) {
      if (buf[i + 3] === 255) lit++;
      // the flat-colour cell paints 0x33/0x66/0xcc at full light
      if (buf[i] === 0x33 && buf[i + 1] === 0x66 && buf[i + 2] === 0xcc) sawBlue++;
    }
    expect(lit).toBeGreaterThan(0);
    expect(sawBlue).toBeGreaterThan(0); // the per-cell flat colour rendered
  });

  test('cellHeights mask: a plane pass paints only the cells at its planeZ', () => {
    const { d } = loadDrawing();
    d.registerLightmap('lm3', 1, 1, 8, 8, [255, 255, 255, 255]);
    // 8x8 grid, near half (rows >= 4 in the camera's forward direction) raised to 0.2
    const heights = new Array(64).fill(0);
    for (let r = 4; r < 8; r++) for (let c = 0; c < 8; c++) heights[r * 8 + c] = 0.2;
    const names = new Array(64).fill('');
    const colors = new Array(64).fill(0x3366cc);
    d.registerFieldTiles('atlasH', 8, 8, names, colors, heights);

    const p = pose(Math.PI / 2, 3.5, 2.0); // facing +y, into rows 2..7
    const common = [
      '', 'atlasH', 0 /* planeZ placeholder */, p.camX, p.camY, p.camZ, p.fDirX, p.fDirY, p.fPlaneX, p.fPlaneY,
      p.camPitch, p.viewW, p.viewH, p.scy, p.eyeZ, 'lm3', 1.0, 160, 150, 140,
    ];
    const opaque = (s: any) => {
      const buf = (s.texture as any).opts.source.resource as Uint8Array;
      let n = 0;
      for (let i = 3; i < buf.length; i += 4) if (buf[i] === 255) n++;
      return n;
    };

    const flat = d.drawPlaneField('h0', ...([common[0], common[1], 0, ...common.slice(3)] as any));
    const raised = d.drawPlaneField('h02', ...([common[0], common[1], 0.2, ...common.slice(3)] as any));

    // both passes paint something, and neither paints the whole buffer
    // (each is masked to roughly half the cells)
    expect(opaque(flat)).toBeGreaterThan(50);
    expect(opaque(raised)).toBeGreaterThan(50);
    const total = (p.viewW / 2) * (p.viewH / 2);
    expect(opaque(flat)).toBeLessThan(total * 0.95);
    expect(opaque(raised)).toBeLessThan(total * 0.95);
  });
});
