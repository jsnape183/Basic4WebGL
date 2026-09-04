import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

let gfxCreated = 0;
let spriteCreated = 0;
let textureCreated = 0;
let meshCreated = 0;
let meshDestroyed = 0;
let destroyed = 0;
let wallMeshCreated = 0;
let lastTexOpts: any = null;

class FakeGraphics {
  visible = true; position = { set() {} }; pivot = { set() {} };
  parent: unknown = undefined; zIndex = 0;
  constructor() { gfxCreated++; }
  clear() { return this; }
  rect() { return this; } circle() { return this; } moveTo() { return this; } lineTo() { return this; }
  fill() { return this; } stroke() { return this; }
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
class FakeBuffer {
  data: unknown; updated = 0;
  constructor(o: any) { this.data = o?.data ?? o; }
  update() { this.updated++; }
}
class FakeGeometry {
  attributes: any; indexBuffer: any; _posArr: any; _uvArr: any; _colArr: any; destroyedCount = 0;
  constructor(o: any) { this.attributes = o?.attributes ?? {}; this.indexBuffer = o?.indexBuffer; }
  getBuffer(name: string) { return this.attributes?.[name]?.buffer ?? { update() {} }; }
  destroy() { this.destroyedCount++; destroyed++; }
}
class FakeShader {
  resources: any;
  static from(o: any) { return new FakeShader(o); }
  constructor(o?: any) { this.resources = o?.resources ?? {}; }
}
class FakeMesh {
  geometry: any; shader: any; texture: any; tint = 0xffffff; visible = true; zIndex = 0;
  parent: unknown = undefined; position = { set() {} };
  constructor(o: any) { wallMeshCreated++; this.geometry = o?.geometry; this.shader = o?.shader; this.texture = o?.texture; }
  destroy() { destroyed++; }
}
(globalThis as any).FakeMesh = FakeMesh;
(FakeTexture as any).WHITE = { source: {} };

class FakeContainer {
  children: any[] = [];
  addChild(c: any) { c.parent = this; if (!this.children.includes(c)) this.children.push(c); } // dedupe like real PIXI; track parent
  removeChild(c: any) { c.parent = undefined; this.children = this.children.filter((x) => x !== c); }
  removeChildren() { this.children.forEach((c) => { c.parent = undefined; }); this.children = []; }
}

function loadDrawing() {
  gfxCreated = spriteCreated = textureCreated = destroyed = meshCreated = meshDestroyed = 0;
  wallMeshCreated = 0;
  lastTexOpts = null;
  const src = readFileSync('src/components/Runner/engine/drawing.js', 'utf-8');
  const PIXI = {
    Graphics: FakeGraphics, Sprite: FakeSprite, Texture: FakeTexture,
    Rectangle: FakeRectangle, PerspectiveMesh: FakePerspectiveMesh,
    Mesh: FakeMesh, Geometry: FakeGeometry, Shader: FakeShader, Buffer: FakeBuffer,
    BufferUsage: { VERTEX: 1, INDEX: 2, COPY_DST: 4 },
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

describe('drawing — wallColumn / wallFlush (batched wall mesh)', () => {
  test('wallFlush emits one mesh per distinct image with 6 indices per column', () => {
    const { d, worldContainer } = loadDrawing();
    d.wallColumn('brick.png', 10, 20, 180, 0.25, 0, 1, 0xff8080);
    d.wallColumn('brick.png', 14, 30, 170, 0.30, 0, 1, 0xff8080);
    d.wallColumn('panel.png', 200, 40, 160, 0.50, 0.1, 0.9, 0xffffff);
    expect(d.wallFlush()).toBe(2);
    const meshes = worldContainer.children.filter((c: any) => c instanceof (globalThis as any).FakeMesh || c.geometry);
    expect(meshes.length).toBe(2);                         // brick + panel
    const brick = meshes.find((m: any) => m.geometry._colArr.some((v: number) => v !== 1 && v !== 0));
    // 2 columns -> 8 verts -> positions length 16, colors length 32; indexBuffer holds >= 12 used entries
    expect(brick.geometry._posArr.length).toBeGreaterThanOrEqual(16);
    expect(brick.geometry._uvArr.length).toBeGreaterThanOrEqual(16);
    expect(brick.geometry.indexBuffer.length).toBeGreaterThanOrEqual(12);
    expect(Array.from(brick.geometry.indexBuffer.slice(0, 6))).toEqual([0, 1, 2, 1, 3, 2]);
    expect(brick.zIndex).toBeGreaterThanOrEqual(1_000_000);
  });

  test('a second wallFlush with no wallColumn calls draws an empty (zero-area) mesh', () => {
    const { d, worldContainer } = loadDrawing();
    d.wallColumn('brick.png', 10, 20, 180, 0.25, 0, 1, 0xffffff);
    d.wallFlush();
    expect(d.wallFlush()).toBe(0);  // buffers cleared -> nothing to draw
    // no throw; the mesh's used column count is 0 -> it is hidden
    const m = worldContainer.children.find((c: any) => c.geometry);
    expect(m.visible).toBe(false);
  });

  test('wallColumn packs the passed quad: positions span [x±2, top..bot], uv.x == srcU', () => {
    const { d, worldContainer } = loadDrawing();
    d.wallColumn('brick.png', 100, 50, 150, 0.5, 0, 1, 0xffffff);
    d.wallFlush();
    const m = worldContainer.children.find((c: any) => c.geometry);
    const pos = m.geometry._posArr;
    // first quad: 4 verts (x-2,top)(x+2,top)(x-2,bot)(x+2,bot)
    expect([pos[0], pos[2], pos[4], pos[6]].sort((a: number, b: number) => a - b)).toEqual([98, 98, 102, 102]);
    expect([pos[1], pos[3], pos[5], pos[7]].sort((a: number, b: number) => a - b)).toEqual([50, 50, 150, 150]);
    const uv = m.geometry._uvArr;
    expect(uv[0]).toBeCloseTo(0.5);
    // unused capacity slots are zero-area, not stale
    expect(pos[8]).toBe(0); expect(pos[9]).toBe(0);
  });

  test('_drawingReset destroys the wall mesh pool', () => {
    const { d } = loadDrawing();
    d.wallColumn('brick.png', 10, 20, 180, 0.25, 0, 1, 0xffffff);
    d.wallFlush();
    const before = wallMeshCreated;
    d._drawingReset();
    d.wallColumn('brick.png', 10, 20, 180, 0.25, 0, 1, 0xffffff);
    d.wallFlush();
    expect(wallMeshCreated).toBe(before + 1);  // pool was cleared, mesh re-created
  });
});
