/* Micro-benchmark: drawing pool per-frame cost, OLD (unconditional addChild) vs NEW (conditional + zIndex).
 * Run: npx vite-node scripts/benchDrawingPool.ts
 * Not a committed test. */
import { readFileSync } from 'node:fs';

class FakeGraphics {
  visible = true; parent: any = undefined; zIndex = 0;
  position = { set() {} }; pivot = { set() {} };
  clear() { return this; } rect() { return this; } circle() { return this; }
  moveTo() { return this; } lineTo() { return this; } fill() { return this; } stroke() { return this; }
  destroy() {}
}
class FakeSprite { visible = true; parent: any = undefined; zIndex = 0; width = 0; height = 0; tint = 0; anchor = { set() {} }; position = { set() {} }; texture: any; destroy() {} }
class FakeTexture { constructor(public opts?: any) {} destroy() {} }
class FakeRectangle { constructor(public x: number, public y: number, public w: number, public h: number) {} }
class FakePerspectiveMesh { visible = true; parent: any = undefined; zIndex = 0; tint = 0; position = { set() {} }; texture: any; constructor(o?: any) { this.texture = o?.texture; } setCorners() {} destroy() {} }

// FakeContainer that models REAL PIXI v8 addChild: re-splice-to-end when already a child.
function makeContainer() {
  return {
    children: [] as any[],
    sortableChildren: true,
    addChild(c: any) {
      const i = this.children.indexOf(c);
      if (i !== -1) this.children.splice(i, 1);
      c.parent = this;
      this.children.push(c);
    },
    removeChild(c: any) { c.parent = undefined; this.children = this.children.filter((x) => x !== c); },
    removeChildren() { this.children.forEach((c) => (c.parent = undefined)); this.children = []; },
  };
}

function loadDrawing(variant: 'old' | 'new') {
  let src = readFileSync('src/components/Runner/engine/drawing.js', 'utf-8');
  if (variant === 'old') {
    // revert to unconditional addChild, no zIndex
    src = src.replace(/if \(([gsm])\.parent !== worldContainer\) worldContainer\.addChild\(\1\);\n\s*\1\.zIndex = _DRAW_Z_BASE \+ _drawSeq\+\+;/g,
      'worldContainer.addChild($1);');
  }
  const PIXI = { Graphics: FakeGraphics, Sprite: FakeSprite, Texture: FakeTexture, Rectangle: FakeRectangle, PerspectiveMesh: FakePerspectiveMesh };
  const worldContainer = makeContainer();
  const _sbAssets = { get: () => ({ source: { style: {} }, width: 64, height: 64 }) };
  const factory = new Function('PIXI', 'worldContainer', '_sbAssets', `${src}\n; return _sbDrawing;`);
  return factory(PIXI, worldContainer, _sbAssets);
}

function bench(variant: 'old' | 'new', N: number, frames = 30) {
  const d = loadDrawing(variant);
  // warm
  for (let f = 0; f < 3; f++) { for (let i = 0; i < N; i++) d.drawRect(i, i, 4, 40); d.clearDrawing(); }
  const t0 = performance.now();
  for (let f = 0; f < frames; f++) {
    for (let i = 0; i < N; i++) d.drawRect(i, i, 4, 40);
    d.clearDrawing();
  }
  return (performance.now() - t0) / frames;
}

console.log('N\tOLD ms/frame\tNEW ms/frame');
for (const N of [1000, 2000, 4000, 8000]) {
  const o = bench('old', N).toFixed(2);
  const n = bench('new', N).toFixed(2);
  console.log(`${N}\t${o}\t\t${n}`);
}
