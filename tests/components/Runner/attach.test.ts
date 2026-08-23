import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// engine/attach.js is a plain script (not an ES module) — same loading
// technique tests/components/Runner/tween.test.ts uses for engine/tween.js,
// since it declares a bare `const _sbAttach` that the runner concatenates
// into the sandboxed iframe rather than importing.
function loadAttach() {
  const src = readFileSync('src/components/Runner/engine/attach.js', 'utf-8');
  const factory = new Function(`${src}\n return _sbAttach;`);
  return factory();
}

function makeContainer(name: string) {
  return {
    name,
    children: [] as unknown[],
    parent: null as unknown,
    addChild(child: { parent: unknown }) {
      if (child.parent && (child.parent as { children: unknown[] }).children) {
        const siblings = (child.parent as { children: unknown[] }).children;
        const i = siblings.indexOf(child);
        if (i !== -1) siblings.splice(i, 1);
      }
      this.children.push(child);
      child.parent = this;
    },
  };
}

function makeHandle(initialParent: ReturnType<typeof makeContainer>) {
  const handle = { parent: initialParent as unknown };
  initialParent.addChild(handle as unknown as { parent: unknown });
  return handle;
}

describe('attachSprite / detachSprite', () => {
  test('attachSprite reparents the child under the parent handle', () => {
    const attach = loadAttach();
    const world = makeContainer('world');
    const childHandle = makeHandle(world);
    const parentHandle = { parent: world as unknown, children: [] as unknown[], addChild(c: { parent: unknown }) { this.children.push(c); c.parent = this; } };

    attach.attachSprite(childHandle, { _handle: parentHandle });

    expect(childHandle.parent).toBe(parentHandle);
    expect(world.children).not.toContain(childHandle);
  });

  test('detachSprite restores the container the child lived in before its first attachTo', () => {
    const attach = loadAttach();
    const world = makeContainer('world');
    const childHandle = makeHandle(world);
    const parentHandle = { parent: world as unknown, children: [] as unknown[], addChild(c: { parent: unknown }) { this.children.push(c); c.parent = this; } };

    attach.attachSprite(childHandle, { _handle: parentHandle });
    attach.detachSprite(childHandle);

    expect(childHandle.parent).toBe(world);
    expect(world.children).toContain(childHandle);
  });

  test('re-attaching to a different parent preserves the ORIGINAL container for eventual detach', () => {
    const attach = loadAttach();
    const world = makeContainer('world');
    const childHandle = makeHandle(world);
    const parentA = { parent: world as unknown, children: [] as unknown[], addChild(c: { parent: unknown }) { this.children.push(c); c.parent = this; } };
    const parentB = { parent: world as unknown, children: [] as unknown[], addChild(c: { parent: unknown }) { this.children.push(c); c.parent = this; } };

    attach.attachSprite(childHandle, { _handle: parentA });
    attach.attachSprite(childHandle, { _handle: parentB }); // switch parents mid-attachment
    expect(childHandle.parent).toBe(parentB);

    attach.detachSprite(childHandle);
    expect(childHandle.parent).toBe(world); // not parentA — the ORIGINAL container
  });

  test('detachSprite on a sprite that was never attached is a no-op', () => {
    const attach = loadAttach();
    const world = makeContainer('world');
    const childHandle = makeHandle(world);

    expect(() => attach.detachSprite(childHandle)).not.toThrow();
    expect(childHandle.parent).toBe(world);
  });

  test('attachSprite does nothing given a missing child handle or parent object', () => {
    const attach = loadAttach();
    const world = makeContainer('world');
    const childHandle = makeHandle(world);

    expect(() => attach.attachSprite(null, { _handle: {} })).not.toThrow();
    expect(() => attach.attachSprite(childHandle, null)).not.toThrow();
    expect(() => attach.attachSprite(childHandle, {})).not.toThrow(); // parentObj._handle missing
    expect(childHandle.parent).toBe(world); // untouched
  });
});
