# Monaco Phase 1 Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement six Monaco editor improvements for the softBASIC IDE — token-linked syntax highlighting, language config (brackets/comments/auto-indent), status bar cursor position, static library completions, hover documentation, and library-only signature help.

**Architecture:** A central `catalogue.ts` serves as the data layer for completions, hover, and signature help. It combines structural data from existing TypeScript descriptors (softGfx modules) with inline entries for softCore (math, string, array). Description strings live in a separate `descriptions.ts` data file, keeping IDE concerns out of the compiler's descriptor types. Provider logic lives in focused pure-function files tested without Monaco. All providers are registered once in `Editor/index.tsx`. The Monarch tokeniser is rewritten to derive keywords from a single exported constant.

**Tech Stack:** Monaco Editor ~0.47 via `@monaco-editor/react` 4.7.0, TypeScript, Vitest

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/lib/Basic4WebGL/keywords.ts` | CREATE | `SOFTBASIC_KEYWORDS` and `SOFTBASIC_LIFECYCLE_EVENTS` arrays |
| `src/monacoHelpers/descriptions.ts` | CREATE | IDE documentation strings for every library method |
| `src/monacoHelpers/catalogue.ts` | CREATE | Typed lookup table built from descriptors + softCore inline entries |
| `src/monacoHelpers/completions.ts` | CREATE | `parseCompletionModule()` pure function + `registerCompletionProvider()` |
| `src/monacoHelpers/hover.ts` | CREATE | `parseHoverContext()` pure function + `registerHoverProvider()` |
| `src/monacoHelpers/signatures.ts` | CREATE | `parseCallContext()` pure function + `registerSignatureHelpProvider()` |
| `src/monacoHelpers/index.ts` | MODIFY | Rewrite — export `buildMonarchRules()`, `buildLanguageConfig()`, `getMonacoTheme()` |
| `src/components/Editor/index.tsx` | MODIFY | Register all providers + language config; add `onMount` cursor tracking; add `onCursorChange` prop |
| `src/pages/EditPage.tsx` | MODIFY | Add `cursorPos` state; wire `onCursorChange`; update footer |
| `tests/lib/Basic4WebGL/keywords.test.ts` | CREATE | Verify keyword list completeness |
| `tests/monacoHelpers/catalogue.test.ts` | CREATE | Verify catalogue entries and lookup functions |
| `tests/monacoHelpers/completions.test.ts` | CREATE | Unit tests for `parseCompletionModule` |
| `tests/monacoHelpers/hover.test.ts` | CREATE | Unit tests for `parseHoverContext` |
| `tests/monacoHelpers/signatures.test.ts` | CREATE | Unit tests for `parseCallContext` |

---

### Task 1: Keyword List — Single Source of Truth

**Files:**
- Create: `src/lib/Basic4WebGL/keywords.ts`
- Create: `tests/lib/Basic4WebGL/keywords.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/Basic4WebGL/keywords.test.ts
import { describe, it, expect } from 'vitest';
import { SOFTBASIC_KEYWORDS, SOFTBASIC_LIFECYCLE_EVENTS } from '../../src/lib/Basic4WebGL/keywords';

describe('SOFTBASIC_KEYWORDS', () => {
  it('contains control flow keywords', () => {
    for (const kw of ['function', 'endfunction', 'if', 'endif', 'while', 'endwhile', 'for', 'next', 'to', 'in', 'do', 'until']) {
      expect(SOFTBASIC_KEYWORDS).toContain(kw);
    }
  });

  it('contains declaration keywords', () => {
    for (const kw of ['dim', 'class', 'as', 'constructor', 'endconstructor', 'endclass']) {
      expect(SOFTBASIC_KEYWORDS).toContain(kw);
    }
  });

  it('contains operator and literal keywords', () => {
    for (const kw of ['and', 'or', 'not', 'return', 'true', 'false', 'print', 'call']) {
      expect(SOFTBASIC_KEYWORDS).toContain(kw);
    }
  });

  it('has no duplicates', () => {
    expect(SOFTBASIC_KEYWORDS.length).toBe(new Set(SOFTBASIC_KEYWORDS).size);
  });
});

describe('SOFTBASIC_LIFECYCLE_EVENTS', () => {
  it('contains lifecycle hook names', () => {
    for (const e of ['onenter', 'onupdate', 'onkeydown', 'onpointerdown', 'onpointermove']) {
      expect(SOFTBASIC_LIFECYCLE_EVENTS).toContain(e);
    }
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

```
npm test -- keywords.test.ts
```

Expected: FAIL — `Cannot find module '../../src/lib/Basic4WebGL/keywords'`

- [ ] **Step 3: Create the keyword list**

```ts
// src/lib/Basic4WebGL/keywords.ts

export const SOFTBASIC_KEYWORDS: string[] = [
  // Declarations
  'dim', 'class', 'as',
  'constructor', 'endconstructor', 'endclass',
  // Functions
  'function', 'return', 'endfunction',
  // Control flow
  'if', 'endif',
  'while', 'endwhile',
  'for', 'next', 'to', 'in',
  'do', 'until',
  // Boolean operators
  'and', 'or', 'not',
  // Literals
  'true', 'false',
  // Built-in statements
  'print', 'call',
];

export const SOFTBASIC_LIFECYCLE_EVENTS: string[] = [
  'onenter',
  'onupdate',
  'onkeydown',
  'onpointerdown',
  'onpointermove',
];
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npm test -- keywords.test.ts
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/Basic4WebGL/keywords.ts tests/lib/Basic4WebGL/keywords.test.ts
git commit -m "feat(monaco): add softBASIC keyword list as single source of truth"
```

---

### Task 2: Library Descriptions Data File

**Files:**
- Create: `src/monacoHelpers/descriptions.ts`

No unit tests for this task — it is a pure data file. Correctness is validated by the catalogue tests in Task 3.

- [ ] **Step 1: Create the descriptions data file**

```ts
// src/monacoHelpers/descriptions.ts
//
// IDE documentation strings for every first-party library symbol.
// Keyed by [moduleName][methodName]. Use 'constructor' for class constructors.
// These strings appear in completions, hover tooltips, and signature help.

export const DESCRIPTIONS: Record<string, Record<string, string>> = {
  sprite: {
    constructor: 'Creates a sprite from a named image asset in the project.',
    setPosition: 'Moves the sprite to coordinates (x, y).',
    getX: "Returns the sprite's current x position.",
    getY: "Returns the sprite's current y position.",
    setAngle: 'Rotates the sprite to the given angle in degrees.',
    setAlpha: 'Sets the sprite opacity. 0.0 = invisible, 1.0 = fully opaque.',
  },
  text: {
    constructor: 'Creates a text display object with the given content at position (x, y).',
    setText: 'Updates the displayed text string.',
    setPosition: 'Moves the text object to coordinates (x, y).',
    setAlpha: 'Sets the text opacity. 0.0 = invisible, 1.0 = fully opaque.',
  },
  gfx: {
    boxCollide: "Returns true if two display objects' bounding boxes overlap.",
    getKeyDown: 'Returns true if the specified key is currently held down. Use key codes such as "ArrowUp", "Space", "KeyA".',
  },
  drawing: {
    drawLine: 'Draws a line from (x, y) to (x2, y2) using the current pen style.',
    drawRect: 'Draws a filled rectangle at (x, y) with the given width and height.',
    drawCircle: 'Draws a filled circle centred at (x, y) with the given radius.',
  },
  stage: {
    add: 'Adds a display object (Sprite or Text) to the visible stage.',
    remove: 'Removes a display object from the stage.',
    clear: 'Removes all display objects from the stage.',
  },
  pen: {
    setFillColor: 'Sets the fill colour for drawing operations. RGB values are 0–255.',
    setLineColor: 'Sets the stroke colour for drawing operations. RGB values are 0–255.',
  },
  assetmanager: {
    loadImage: 'Loads an image asset by filename and returns a reference to it.',
  },
  math: {
    abs: 'Returns the absolute value of n.',
    acos: 'Returns the arccosine of n in radians.',
    acosh: 'Returns the hyperbolic arccosine of n.',
    asin: 'Returns the arcsine of n in radians.',
    asinh: 'Returns the hyperbolic arcsine of n.',
    atan: 'Returns the arctangent of n in radians.',
    atan2: 'Returns the angle in radians between the positive x-axis and the point (n2, n1).',
    atanh: 'Returns the hyperbolic arctangent of n.',
    cbrt: 'Returns the cube root of n.',
    ceil: 'Returns n rounded up to the nearest integer.',
    cos: 'Returns the cosine of n (n in radians).',
    cosh: 'Returns the hyperbolic cosine of n.',
    euler: "Returns Euler's number e ≈ 2.718.",
    exp: 'Returns e raised to the power n.',
    floor: 'Returns n rounded down to the nearest integer.',
    log: 'Returns the natural logarithm of n.',
    log2: 'Returns the base-2 logarithm of n.',
    log10: 'Returns the base-10 logarithm of n.',
    pi: 'Returns π ≈ 3.14159.',
    pow: 'Returns x raised to the power y.',
    random: 'Returns a random number between 0 (inclusive) and max (exclusive).',
    round: 'Returns n rounded to the nearest integer.',
    sign: 'Returns 1 if n > 0, −1 if n < 0, or 0 if n = 0.',
    sin: 'Returns the sine of n (n in radians).',
    sinh: 'Returns the hyperbolic sine of n.',
    sqrt: 'Returns the square root of n.',
    tan: 'Returns the tangent of n (n in radians).',
    tanh: 'Returns the hyperbolic tangent of n.',
    trunc: 'Returns n with the fractional part removed (rounds toward zero).',
    val: 'Converts a string to a number.',
  },
  string: {
    len: 'Returns the number of characters in string s.',
    lcase: 'Returns s converted to lowercase.',
    ucase: 'Returns s converted to uppercase.',
    str: 'Converts a number n to its string representation.',
    substr: 'Returns the substring of s from index start to end (exclusive).',
    split: 'Splits string s by delimiter c and returns an array of substrings.',
    trim: 'Returns s with leading and trailing whitespace removed.',
    padstart: 'Pads the beginning of s with character p until the string reaches length n.',
    padend: 'Pads the end of s with character p until the string reaches length n.',
  },
  array: {
    arrLength: 'Returns the number of elements in array a.',
    join: 'Joins all elements of array a into a string, separated by s.',
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/monacoHelpers/descriptions.ts
git commit -m "feat(monaco): add library documentation strings for IDE features"
```

---

### Task 3: Completions Catalogue

**Files:**
- Create: `src/monacoHelpers/catalogue.ts`
- Create: `tests/monacoHelpers/catalogue.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/monacoHelpers/catalogue.test.ts
import { describe, it, expect } from 'vitest';
import {
  CATALOGUE,
  getModuleMethods,
  getModuleMethod,
  getConstructor,
  isKnownModule,
} from '../../src/monacoHelpers/catalogue';

describe('CATALOGUE', () => {
  it('contains all expected modules', () => {
    for (const name of ['sprite', 'text', 'gfx', 'drawing', 'stage', 'pen', 'assetmanager', 'math', 'string', 'array']) {
      expect(name in CATALOGUE).toBe(true);
    }
  });

  it('sprite is a class with a constructor', () => {
    expect(CATALOGUE['sprite'].kind).toBe('class');
    expect(CATALOGUE['sprite'].constructorEntry).toBeDefined();
    expect(CATALOGUE['sprite'].constructorEntry!.params).toContain('imagePath');
  });

  it('math is a module with no constructor', () => {
    expect(CATALOGUE['math'].kind).toBe('module');
    expect(CATALOGUE['math'].constructorEntry).toBeUndefined();
  });
});

describe('getModuleMethods', () => {
  it('returns methods for sprite', () => {
    const names = getModuleMethods('sprite').map(m => m.name);
    expect(names).toContain('setPosition');
    expect(names).toContain('getX');
    expect(names).toContain('setAlpha');
  });

  it('returns methods for math', () => {
    const names = getModuleMethods('math').map(m => m.name);
    expect(names).toContain('sin');
    expect(names).toContain('atan2');
    expect(names).toContain('floor');
  });

  it('returns methods for string', () => {
    const names = getModuleMethods('string').map(m => m.name);
    expect(names).toContain('len');
    expect(names).toContain('split');
  });

  it('returns empty array for unknown module', () => {
    expect(getModuleMethods('unknown')).toEqual([]);
  });

  it('is case-insensitive', () => {
    expect(getModuleMethods('MATH').length).toBeGreaterThan(0);
  });
});

describe('getModuleMethod', () => {
  it('finds a known method with its params and description', () => {
    const m = getModuleMethod('math', 'sin');
    expect(m).toBeDefined();
    expect(m!.params).toEqual(['n']);
    expect(m!.description.length).toBeGreaterThan(0);
    expect(m!.hasReturn).toBe(true);
  });

  it('finds a stage method', () => {
    const m = getModuleMethod('stage', 'add');
    expect(m).toBeDefined();
    expect(m!.params).toEqual(['obj']);
  });

  it('returns undefined for unknown method', () => {
    expect(getModuleMethod('math', 'unknownfn')).toBeUndefined();
  });

  it('is case-insensitive on method name', () => {
    expect(getModuleMethod('math', 'SIN')).toBeDefined();
  });
});

describe('getConstructor', () => {
  it('returns constructor for sprite', () => {
    const ctor = getConstructor('sprite');
    expect(ctor).toBeDefined();
    expect(ctor!.params).toContain('imagePath');
    expect(ctor!.description.length).toBeGreaterThan(0);
  });

  it('returns constructor for text', () => {
    const ctor = getConstructor('text');
    expect(ctor).toBeDefined();
    expect(ctor!.params).toEqual(['content', 'x', 'y']);
  });

  it('returns undefined for modules (not classes)', () => {
    expect(getConstructor('math')).toBeUndefined();
    expect(getConstructor('stage')).toBeUndefined();
  });
});

describe('isKnownModule', () => {
  it('returns true for known modules', () => {
    expect(isKnownModule('sprite')).toBe(true);
    expect(isKnownModule('math')).toBe(true);
  });

  it('returns false for unknown names', () => {
    expect(isKnownModule('xyz')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isKnownModule('SPRITE')).toBe(true);
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

```
npm test -- catalogue.test.ts
```

Expected: FAIL — `Cannot find module '../../src/monacoHelpers/catalogue'`

- [ ] **Step 3: Create the catalogue**

```ts
// src/monacoHelpers/catalogue.ts
import { spriteDescriptor } from '../lib/Basic4WebGL/library/descriptors/sprite.descriptor';
import { textDescriptor } from '../lib/Basic4WebGL/library/descriptors/text.descriptor';
import { gfxDescriptor } from '../lib/Basic4WebGL/library/descriptors/gfx.descriptor';
import { drawingDescriptor } from '../lib/Basic4WebGL/library/descriptors/drawing.descriptor';
import { stageDescriptor } from '../lib/Basic4WebGL/library/descriptors/stage.descriptor';
import { penDescriptor } from '../lib/Basic4WebGL/library/descriptors/pen.descriptor';
import { assetmanagerDescriptor } from '../lib/Basic4WebGL/library/descriptors/assetmanager.descriptor';
import type { ClassDescriptor, ModuleDescriptor } from '../lib/Basic4WebGL/library/generator/types';
import { DESCRIPTIONS } from './descriptions';

export interface CatalogueMethod {
  name: string;
  params: string[];
  description: string;
  hasReturn: boolean;
}

export interface CatalogueEntry {
  kind: 'module' | 'class';
  methods: CatalogueMethod[];
  constructorEntry?: CatalogueMethod;
}

function d(module: string, method: string): string {
  return DESCRIPTIONS[module]?.[method] ?? '';
}

function fromModule(desc: ModuleDescriptor): CatalogueEntry {
  return {
    kind: 'module',
    methods: desc.functions.map(f => ({
      name: f.name,
      params: f.params,
      description: d(desc.name, f.name),
      hasReturn: !!f.returns,
    })),
  };
}

function fromClass(desc: ClassDescriptor): CatalogueEntry {
  return {
    kind: 'class',
    constructorEntry: desc.constructor
      ? {
          name: desc.name,
          params: desc.constructor.params,
          description: d(desc.name, 'constructor'),
          hasReturn: false,
        }
      : undefined,
    methods: desc.methods.map(m => ({
      name: m.name,
      params: m.params,
      description: d(desc.name, m.name),
      hasReturn: !!m.returns,
    })),
  };
}

// softCore modules — hand-written .bas files with no TypeScript descriptors
const SOFT_CORE: Record<string, CatalogueEntry> = {
  math: {
    kind: 'module',
    methods: [
      { name: 'abs', params: ['n'], description: d('math', 'abs'), hasReturn: true },
      { name: 'acos', params: ['n'], description: d('math', 'acos'), hasReturn: true },
      { name: 'acosh', params: ['n'], description: d('math', 'acosh'), hasReturn: true },
      { name: 'asin', params: ['n'], description: d('math', 'asin'), hasReturn: true },
      { name: 'asinh', params: ['n'], description: d('math', 'asinh'), hasReturn: true },
      { name: 'atan', params: ['n'], description: d('math', 'atan'), hasReturn: true },
      { name: 'atan2', params: ['n1', 'n2'], description: d('math', 'atan2'), hasReturn: true },
      { name: 'atanh', params: ['n'], description: d('math', 'atanh'), hasReturn: true },
      { name: 'cbrt', params: ['n'], description: d('math', 'cbrt'), hasReturn: true },
      { name: 'ceil', params: ['n'], description: d('math', 'ceil'), hasReturn: true },
      { name: 'cos', params: ['n'], description: d('math', 'cos'), hasReturn: true },
      { name: 'cosh', params: ['n'], description: d('math', 'cosh'), hasReturn: true },
      { name: 'euler', params: [], description: d('math', 'euler'), hasReturn: true },
      { name: 'exp', params: ['n'], description: d('math', 'exp'), hasReturn: true },
      { name: 'floor', params: ['n'], description: d('math', 'floor'), hasReturn: true },
      { name: 'log', params: ['n'], description: d('math', 'log'), hasReturn: true },
      { name: 'log2', params: ['n'], description: d('math', 'log2'), hasReturn: true },
      { name: 'log10', params: ['n'], description: d('math', 'log10'), hasReturn: true },
      { name: 'pi', params: [], description: d('math', 'pi'), hasReturn: true },
      { name: 'pow', params: ['x', 'y'], description: d('math', 'pow'), hasReturn: true },
      { name: 'random', params: ['max'], description: d('math', 'random'), hasReturn: true },
      { name: 'round', params: ['n'], description: d('math', 'round'), hasReturn: true },
      { name: 'sign', params: ['n'], description: d('math', 'sign'), hasReturn: true },
      { name: 'sin', params: ['n'], description: d('math', 'sin'), hasReturn: true },
      { name: 'sinh', params: ['n'], description: d('math', 'sinh'), hasReturn: true },
      { name: 'sqrt', params: ['n'], description: d('math', 'sqrt'), hasReturn: true },
      { name: 'tan', params: ['n'], description: d('math', 'tan'), hasReturn: true },
      { name: 'tanh', params: ['n'], description: d('math', 'tanh'), hasReturn: true },
      { name: 'trunc', params: ['n'], description: d('math', 'trunc'), hasReturn: true },
      { name: 'val', params: ['s'], description: d('math', 'val'), hasReturn: true },
    ],
  },
  string: {
    kind: 'module',
    methods: [
      { name: 'len', params: ['s'], description: d('string', 'len'), hasReturn: true },
      { name: 'lcase', params: ['s'], description: d('string', 'lcase'), hasReturn: true },
      { name: 'ucase', params: ['s'], description: d('string', 'ucase'), hasReturn: true },
      { name: 'str', params: ['n'], description: d('string', 'str'), hasReturn: true },
      { name: 'substr', params: ['s', 'start', 'end'], description: d('string', 'substr'), hasReturn: true },
      { name: 'split', params: ['s', 'c'], description: d('string', 'split'), hasReturn: true },
      { name: 'trim', params: ['s'], description: d('string', 'trim'), hasReturn: true },
      { name: 'padstart', params: ['s', 'n', 'p'], description: d('string', 'padstart'), hasReturn: true },
      { name: 'padend', params: ['s', 'n', 'p'], description: d('string', 'padend'), hasReturn: true },
    ],
  },
  array: {
    kind: 'module',
    methods: [
      { name: 'arrLength', params: ['a'], description: d('array', 'arrLength'), hasReturn: true },
      { name: 'join', params: ['a', 's'], description: d('array', 'join'), hasReturn: true },
    ],
  },
};

// softGfx modules — built from TypeScript descriptors
export const CATALOGUE: Record<string, CatalogueEntry> = {
  ...SOFT_CORE,
  sprite: fromClass(spriteDescriptor),
  text: fromClass(textDescriptor),
  gfx: fromModule(gfxDescriptor),
  drawing: fromModule(drawingDescriptor),
  stage: fromModule(stageDescriptor),
  pen: fromModule(penDescriptor),
  assetmanager: fromModule(assetmanagerDescriptor),
};

export function getModuleMethods(moduleName: string): CatalogueMethod[] {
  return CATALOGUE[moduleName.toLowerCase()]?.methods ?? [];
}

export function getModuleMethod(
  moduleName: string,
  methodName: string
): CatalogueMethod | undefined {
  return getModuleMethods(moduleName).find(
    m => m.name.toLowerCase() === methodName.toLowerCase()
  );
}

export function getConstructor(className: string): CatalogueMethod | undefined {
  return CATALOGUE[className.toLowerCase()]?.constructorEntry;
}

export function isKnownModule(name: string): boolean {
  return name.toLowerCase() in CATALOGUE;
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

```
npm test -- catalogue.test.ts
```

Expected: all PASS

- [ ] **Step 5: Run the full test suite to confirm nothing regressed**

```
npm test
```

Expected: all existing tests PASS plus the new catalogue tests

- [ ] **Step 6: Commit**

```bash
git add src/monacoHelpers/catalogue.ts tests/monacoHelpers/catalogue.test.ts
git commit -m "feat(monaco): add static library catalogue for IDE providers"
```

---

### Task 4: Monaco Config Rewrite — Monarch + Language Config (Features A & B)

**Files:**
- Modify: `src/monacoHelpers/index.ts`
- Create: `tests/monacoHelpers/monarchRules.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/monacoHelpers/monarchRules.test.ts
import { describe, it, expect } from 'vitest';
import { buildMonarchRules } from '../../src/monacoHelpers';
import { SOFTBASIC_KEYWORDS, SOFTBASIC_LIFECYCLE_EVENTS } from '../../src/lib/Basic4WebGL/keywords';

describe('buildMonarchRules', () => {
  it('includes all keywords from the keyword list', () => {
    const rules = buildMonarchRules();
    for (const kw of SOFTBASIC_KEYWORDS) {
      expect(rules.keywords).toContain(kw);
    }
  });

  it('includes all lifecycle events', () => {
    const rules = buildMonarchRules();
    for (const ev of SOFTBASIC_LIFECYCLE_EVENTS) {
      expect(rules.lifecycleEvents).toContain(ev);
    }
  });

  it('has a tokenizer with a root rule array', () => {
    const rules = buildMonarchRules();
    expect(Array.isArray(rules.tokenizer.root)).toBe(true);
    expect(rules.tokenizer.root.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

```
npm test -- monarchRules.test.ts
```

Expected: FAIL — `buildMonarchRules is not a function` (current export is `getMonacoConfig`)

- [ ] **Step 3: Rewrite `src/monacoHelpers/index.ts`**

```ts
// src/monacoHelpers/index.ts
import { SOFTBASIC_KEYWORDS, SOFTBASIC_LIFECYCLE_EVENTS } from '../lib/Basic4WebGL/keywords';

export function buildMonarchRules() {
  return {
    keywords: SOFTBASIC_KEYWORDS,
    lifecycleEvents: SOFTBASIC_LIFECYCLE_EVENTS,
    tokenizer: {
      root: [
        // Comments — apostrophe to end of line
        [/'.*/, 'comment'],
        // String literals
        [/"[^"]*"/, 'string'],
        // Numeric literals (integer and decimal)
        [/[+-]?([0-9]*[.])?[0-9]+/, 'number'],
        // Identifiers — keywords, lifecycle events, plain identifiers
        [/[A-Za-z_][A-Za-z_$0-9]*/, {
          cases: {
            '@keywords': 'keyword',
            '@lifecycleEvents': 'type.identifier',
            '@default': 'identifier',
          },
        }],
        // Arithmetic and comparison operators
        [/<>|>=|<=|[+\-*/=<>]/, 'operator'],
        // Delimiters
        [/[(),.]/, 'delimiter'],
      ],
    },
  };
}

export function buildLanguageConfig() {
  return {
    comments: {
      lineComment: "'",
    },
    brackets: [
      ['(', ')'],
    ] as [string, string][],
    autoClosingPairs: [
      { open: '(', close: ')' },
      { open: '"', close: '"' },
    ],
    surroundingPairs: [
      { open: '(', close: ')' },
      { open: '"', close: '"' },
    ],
    indentationRules: {
      // Indent the next line when the current line starts with these keywords
      increaseIndentPattern: /^\s*(function|if|while|for|constructor)\b.*/i,
      // Outdent when the current line starts with an end-keyword
      decreaseIndentPattern: /^\s*(endfunction|endif|endwhile|endclass|next|endconstructor|until)\b/i,
    },
  };
}

export function getMonacoTheme() {
  return {
    base: 'vs-dark' as const,
    inherit: true,
    colors: {
      'editor.background': '#0b0b18',
      'editor.foreground': '#e0e0f0',
      'editor.lineHighlightBackground': '#12122a',
      'editor.selectionBackground': '#3030aa55',
      'editorCursor.foreground': '#6060dd',
      'editorLineNumber.foreground': '#4a4a88',
      'editorLineNumber.activeForeground': '#8888bb',
      'editor.inactiveSelectionBackground': '#1e1e4440',
      'editorIndentGuide.background': '#2a2a55',
      'editorIndentGuide.activeBackground': '#6060dd',
      'scrollbar.shadow': '#0b0b18',
      'scrollbarSlider.background': '#2a2a5566',
      'scrollbarSlider.hoverBackground': '#3030aa88',
    },
    rules: [
      { token: 'keyword', foreground: '8080ff', fontStyle: 'bold' },
      { token: 'type.identifier', foreground: 'cc9933' },  // lifecycle events — amber
      { token: 'comment', foreground: '4a4a88', fontStyle: 'italic' },
      { token: 'string', foreground: 'cc8866', fontStyle: 'italic' },
      { token: 'number', foreground: 'b5cea8' },
      { token: 'operator', foreground: '608b4e' },
      { token: 'delimiter', foreground: 'e0e0f0' },
    ],
  };
}

// Legacy default export removed — Editor/index.tsx imports named functions directly.
```

- [ ] **Step 4: Run the tests**

```
npm test -- monarchRules.test.ts
```

Expected: all PASS

- [ ] **Step 5: Run the full test suite**

```
npm test
```

Expected: all PASS — the only compilation failure would be in `Editor/index.tsx` which still imports the old `getMonacoConfig` default. That file is updated in Task 8.

- [ ] **Step 6: Commit**

```bash
git add src/monacoHelpers/index.ts tests/monacoHelpers/monarchRules.test.ts
git commit -m "feat(monaco): rewrite Monarch rules from keyword list; add language config"
```

---

### Task 5: Completion Provider Logic (Feature E)

**Files:**
- Create: `src/monacoHelpers/completions.ts`
- Create: `tests/monacoHelpers/completions.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/monacoHelpers/completions.test.ts
import { describe, it, expect } from 'vitest';
import { parseCompletionModule } from '../../src/monacoHelpers/completions';

describe('parseCompletionModule', () => {
  it('extracts module name from "math."', () => {
    expect(parseCompletionModule('math.')).toBe('math');
  });

  it('extracts module name from mid-line text', () => {
    expect(parseCompletionModule('dim x = math.')).toBe('math');
  });

  it('extracts module name from "stage."', () => {
    expect(parseCompletionModule('stage.')).toBe('stage');
  });

  it('lowercases the module name', () => {
    expect(parseCompletionModule('Math.')).toBe('math');
    expect(parseCompletionModule('STAGE.')).toBe('stage');
  });

  it('returns null when there is no dot', () => {
    expect(parseCompletionModule('math')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(parseCompletionModule('')).toBeNull();
  });

  it('returns null when dot is not at the end', () => {
    // "math.sin" — dot is in the middle, cursor is after "sin" not after "."
    expect(parseCompletionModule('math.sin')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

```
npm test -- completions.test.ts
```

Expected: FAIL — `Cannot find module '../../src/monacoHelpers/completions'`

- [ ] **Step 3: Create the completion provider**

```ts
// src/monacoHelpers/completions.ts
import type { Monaco } from '@monaco-editor/react';
import { getModuleMethods, isKnownModule, CatalogueMethod } from './catalogue';

/**
 * Extracts the module name from text ending in "identifier.".
 * Returns the lowercased module name, or null if the pattern does not match.
 */
export function parseCompletionModule(textBeforeCursor: string): string | null {
  const match = textBeforeCursor.match(/(\w+)\.$/);
  if (!match) return null;
  return match[1].toLowerCase();
}

function buildSnippet(m: CatalogueMethod): string {
  if (m.params.length === 0) return `${m.name}()`;
  const paramSnippets = m.params.map((p, i) => `\${${i + 1}:${p}}`).join(', ');
  return `${m.name}(${paramSnippets})`;
}

export function registerCompletionProvider(monaco: Monaco): { dispose(): void } {
  return monaco.languages.registerCompletionItemProvider('softBasic', {
    triggerCharacters: ['.'],
    provideCompletionItems(model, position) {
      const lineContent = model.getLineContent(position.lineNumber);
      // position.column is 1-based and is AFTER the '.' trigger character
      const textBeforeCursor = lineContent.substring(0, position.column - 1);
      const moduleName = parseCompletionModule(textBeforeCursor);
      if (!moduleName || !isKnownModule(moduleName)) return { suggestions: [] };

      const methods = getModuleMethods(moduleName);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: position.column,
        endColumn: position.column,
      };

      return {
        suggestions: methods.map(m => ({
          label: m.name,
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: buildSnippet(m),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: m.description,
          range,
        })),
      };
    },
  });
}
```

- [ ] **Step 4: Run the tests**

```
npm test -- completions.test.ts
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/monacoHelpers/completions.ts tests/monacoHelpers/completions.test.ts
git commit -m "feat(monaco): add static library completion provider (Feature E)"
```

---

### Task 6: Hover Provider Logic (Feature F)

**Files:**
- Create: `src/monacoHelpers/hover.ts`
- Create: `tests/monacoHelpers/hover.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/monacoHelpers/hover.test.ts
import { describe, it, expect } from 'vitest';
import { parseHoverContext } from '../../src/monacoHelpers/hover';

// Monaco word ranges use 1-based columns.
// startColumn is the column of the first character of the word.

describe('parseHoverContext', () => {
  it('identifies module.method when cursor is over the method', () => {
    // "stage.add(bunny)" — "add" starts at column 7 (1-based)
    const word = { word: 'add', startColumn: 7 };
    const result = parseHoverContext('stage.add(bunny)', word);
    expect(result).toEqual({ moduleName: 'stage', methodName: 'add' });
  });

  it('identifies module.method mid-line', () => {
    // "    result = math.sin(x)" — "sin" starts at column 18
    const line = '    result = math.sin(x)';
    const word = { word: 'sin', startColumn: 18 };
    const result = parseHoverContext(line, word);
    expect(result).toEqual({ moduleName: 'math', methodName: 'sin' });
  });

  it('lowercases both module and method names', () => {
    const word = { word: 'Sin', startColumn: 6 };
    const result = parseHoverContext('math.Sin(x)', word);
    expect(result).toEqual({ moduleName: 'math', methodName: 'sin' });
  });

  it('returns null when char before word is not a dot', () => {
    // Hovering over a plain variable name
    const word = { word: 'bunny', startColumn: 5 };
    expect(parseHoverContext('dim bunny', word)).toBeNull();
  });

  it('returns null when word is at column 1 (nothing before it)', () => {
    const word = { word: 'stage', startColumn: 1 };
    expect(parseHoverContext('stage', word)).toBeNull();
  });

  it('returns null when dot is at the very start (no module before it)', () => {
    // ".add(x)" — dot is at column 1, word "add" starts at column 2
    const word = { word: 'add', startColumn: 2 };
    expect(parseHoverContext('.add(x)', word)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

```
npm test -- hover.test.ts
```

Expected: FAIL — `Cannot find module '../../src/monacoHelpers/hover'`

- [ ] **Step 3: Create the hover provider**

```ts
// src/monacoHelpers/hover.ts
import type { Monaco } from '@monaco-editor/react';
import { getModuleMethod, getConstructor } from './catalogue';

/**
 * Given a line of source and a word range (Monaco 1-based columns),
 * checks whether the word is immediately preceded by '.' and extracts
 * the module name from the text before the dot.
 *
 * Returns { moduleName, methodName } or null if the pattern does not match.
 */
export function parseHoverContext(
  lineContent: string,
  word: { word: string; startColumn: number }
): { moduleName: string; methodName: string } | null {
  // startColumn is 1-based: the char immediately before the word is at index (startColumn - 2)
  const charBefore = lineContent[word.startColumn - 2];
  if (charBefore !== '.') return null;

  // Extract the module name — the word immediately before the dot
  const textBeforeDot = lineContent.substring(0, word.startColumn - 2);
  const moduleMatch = textBeforeDot.match(/(\w+)$/);
  if (!moduleMatch) return null;

  return {
    moduleName: moduleMatch[1].toLowerCase(),
    methodName: word.word.toLowerCase(),
  };
}

export function registerHoverProvider(monaco: Monaco): { dispose(): void } {
  return monaco.languages.registerHoverProvider('softBasic', {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const lineContent = model.getLineContent(position.lineNumber);

      // Case 1: hovering over the method in a "module.method" expression
      const ctx = parseHoverContext(lineContent, word);
      if (ctx) {
        const method = getModuleMethod(ctx.moduleName, ctx.methodName);
        if (!method) return null;
        return {
          contents: [
            { value: `**${ctx.moduleName}.${method.name}(${method.params.join(', ')})**` },
            { value: method.description },
          ],
        };
      }

      // Case 2: hovering over a bare class name — show the constructor signature
      const ctor = getConstructor(word.word.toLowerCase());
      if (ctor) {
        const className = word.word.charAt(0).toUpperCase() + word.word.slice(1).toLowerCase();
        return {
          contents: [
            { value: `**${className}(${ctor.params.join(', ')})**` },
            { value: ctor.description },
          ],
        };
      }

      return null;
    },
  });
}
```

- [ ] **Step 4: Run the tests**

```
npm test -- hover.test.ts
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/monacoHelpers/hover.ts tests/monacoHelpers/hover.test.ts
git commit -m "feat(monaco): add library hover documentation provider (Feature F)"
```

---

### Task 7: Signature Help Provider Logic (Feature H)

**Files:**
- Create: `src/monacoHelpers/signatures.ts`
- Create: `tests/monacoHelpers/signatures.test.ts`

Signature help fires when the user types `(` or `,`. It scans backward from the cursor to find the function call that owns the current argument position, then shows the parameter list.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/monacoHelpers/signatures.test.ts
import { describe, it, expect } from 'vitest';
import { parseCallContext } from '../../src/monacoHelpers/signatures';

describe('parseCallContext', () => {
  it('identifies a module.method call with no args yet', () => {
    // "stage.add(" — cursor just after the opening paren
    const result = parseCallContext('stage.add(');
    expect(result).toEqual({ moduleName: 'stage', methodName: 'add', activeParameter: 0 });
  });

  it('identifies a module.method call with one arg', () => {
    // "math.atan2(dy, " — cursor after the comma, second param active
    const result = parseCallContext('math.atan2(dy, ');
    expect(result).toEqual({ moduleName: 'math', methodName: 'atan2', activeParameter: 1 });
  });

  it('identifies a module.method call with three args', () => {
    // "pen.setFillColor(255, 128, " — third param active
    const result = parseCallContext('pen.setFillColor(255, 128, ');
    expect(result).toEqual({ moduleName: 'pen', methodName: 'setFillColor', activeParameter: 2 });
  });

  it('identifies a bare class constructor', () => {
    // "dim x as Sprite(" — no module, methodName = "sprite" (lowercased)
    const result = parseCallContext('dim x as Sprite(');
    expect(result).toEqual({ moduleName: undefined, methodName: 'sprite', activeParameter: 0 });
  });

  it('handles nested parens by tracking only the outermost call', () => {
    // "stage.add(bunny.getX(" — outer call is stage.add
    // The inner call (bunny.getX) creates depth, so the active call is stage.add, param 0
    // Actually this cursor position is INSIDE bunny.getX(, so result should be bunny.getX
    const result = parseCallContext('stage.add(bunny.getX(');
    expect(result).toEqual({ moduleName: 'bunny', methodName: 'getx', activeParameter: 0 });
  });

  it('returns null when there is no open paren', () => {
    expect(parseCallContext('stage.add')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(parseCallContext('')).toBeNull();
  });

  it('returns null when paren is closed before cursor', () => {
    // "stage.add(bunny)" — all parens balanced; no active call
    expect(parseCallContext('stage.add(bunny)')).toBeNull();
  });

  it('lowercases module and method names', () => {
    const result = parseCallContext('Math.Sin(');
    expect(result).toEqual({ moduleName: 'math', methodName: 'sin', activeParameter: 0 });
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

```
npm test -- signatures.test.ts
```

Expected: FAIL — `Cannot find module '../../src/monacoHelpers/signatures'`

- [ ] **Step 3: Create the signature help provider**

```ts
// src/monacoHelpers/signatures.ts
import type { Monaco } from '@monaco-editor/react';
import { getModuleMethod, getConstructor } from './catalogue';

export interface CallContext {
  moduleName?: string;
  methodName: string;
  activeParameter: number;
}

/**
 * Scans backward through `textBeforeCursor` to find the opening paren of the
 * innermost active function call, counting commas at that depth to determine
 * which parameter is active.
 *
 * Returns a CallContext or null if no open call site is found.
 */
export function parseCallContext(textBeforeCursor: string): CallContext | null {
  let depth = 0;
  let parenIndex = -1;
  let activeParameter = 0;

  for (let i = textBeforeCursor.length - 1; i >= 0; i--) {
    const ch = textBeforeCursor[i];
    if (ch === ')') {
      depth++;
    } else if (ch === '(') {
      if (depth === 0) {
        parenIndex = i;
        break;
      }
      depth--;
    } else if (ch === ',' && depth === 0) {
      activeParameter++;
    }
  }

  if (parenIndex < 0) return null;

  const beforeParen = textBeforeCursor.substring(0, parenIndex).trimEnd();

  // "module.method" pattern
  const dotMatch = beforeParen.match(/(\w+)\.(\w+)$/);
  if (dotMatch) {
    return {
      moduleName: dotMatch[1].toLowerCase(),
      methodName: dotMatch[2].toLowerCase(),
      activeParameter,
    };
  }

  // Bare word — class constructor or unqualified function
  const wordMatch = beforeParen.match(/(\w+)$/);
  if (wordMatch) {
    return {
      methodName: wordMatch[1].toLowerCase(),
      activeParameter,
    };
  }

  return null;
}

export function registerSignatureHelpProvider(monaco: Monaco): { dispose(): void } {
  return monaco.languages.registerSignatureHelpProvider('softBasic', {
    signatureHelpTriggerCharacters: ['(', ','],
    provideSignatureHelp(model, position) {
      const lineContent = model.getLineContent(position.lineNumber);
      const textBeforeCursor = lineContent.substring(0, position.column - 1);
      const ctx = parseCallContext(textBeforeCursor);
      if (!ctx) return null;

      let method;
      let signatureLabel: string;

      if (ctx.moduleName) {
        method = getModuleMethod(ctx.moduleName, ctx.methodName);
        if (!method) return null;
        signatureLabel = `${ctx.moduleName}.${method.name}(${method.params.join(', ')})`;
      } else {
        // Try as a class constructor (e.g., Sprite, Text)
        method = getConstructor(ctx.methodName);
        if (!method) return null;
        const className =
          ctx.methodName.charAt(0).toUpperCase() + ctx.methodName.slice(1);
        signatureLabel = `${className}(${method.params.join(', ')})`;
      }

      const activeParameter = Math.min(ctx.activeParameter, method.params.length - 1);

      return {
        value: {
          signatures: [
            {
              label: signatureLabel,
              documentation: method.description,
              parameters: method.params.map(p => ({ label: p })),
            },
          ],
          activeSignature: 0,
          activeParameter,
        },
        dispose: () => {},
      };
    },
  });
}
```

- [ ] **Step 4: Run the tests**

```
npm test -- signatures.test.ts
```

Expected: all PASS

- [ ] **Step 5: Run the full test suite**

```
npm test
```

Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add src/monacoHelpers/signatures.ts tests/monacoHelpers/signatures.test.ts
git commit -m "feat(monaco): add library signature help provider (Feature H)"
```

---

### Task 8: Wire Everything into the Editor (Features A, B, E, F, H)

**Files:**
- Modify: `src/components/Editor/index.tsx`

This task updates the editor to use the new Monaco config functions and registers all three providers. It also adds the `onCursorChange` prop needed in Task 9.

The current file imports `getMonacoConfig` (default export from the old index.ts). After this task it imports named functions and the three provider modules.

- [ ] **Step 1: Replace `src/components/Editor/index.tsx` with the updated version**

```tsx
// src/components/Editor/index.tsx
import React, { useState, useEffect } from 'react';
import Editor, { useMonaco, OnMount } from '@monaco-editor/react';
import { IFile } from '../../features/files/filesSlice';
import { buildMonarchRules, buildLanguageConfig, getMonacoTheme } from '../../monacoHelpers';
import { registerCompletionProvider } from '../../monacoHelpers/completions';
import { registerHoverProvider } from '../../monacoHelpers/hover';
import { registerSignatureHelpProvider } from '../../monacoHelpers/signatures';

type SBEditorProps = {
  file: IFile | undefined;
  height: string;
  onChange: (source: string | undefined) => void;
  onCursorChange?: (line: number, col: number) => void;
};

const SBEditor: React.FC<SBEditorProps> = ({ file, height, onChange, onCursorChange }) => {
  const monaco = useMonaco();
  const [languageLoaded, setLanguageLoaded] = useState(false);

  useEffect(() => {
    if (!monaco) return;

    monaco.languages.register({ id: 'softBasic' });
    monaco.languages.setMonarchTokensProvider('softBasic', buildMonarchRules());
    monaco.languages.setLanguageConfiguration('softBasic', buildLanguageConfig());
    monaco.editor.defineTheme('softBasicTheme', getMonacoTheme());

    const completionDisposable = registerCompletionProvider(monaco);
    const hoverDisposable = registerHoverProvider(monaco);
    const signatureDisposable = registerSignatureHelpProvider(monaco);

    setLanguageLoaded(true);

    return () => {
      completionDisposable.dispose();
      hoverDisposable.dispose();
      signatureDisposable.dispose();
    };
  }, [monaco]);

  const handleMount: OnMount = (editor) => {
    editor.onDidChangeCursorPosition((e) => {
      onCursorChange?.(e.position.lineNumber, e.position.column);
    });
  };

  if (!file) {
    return <p>File not found.</p>;
  }

  if (!languageLoaded) return null;

  return (
    <Editor
      height={height}
      defaultValue=""
      language="softBasic"
      defaultLanguage="softBasic"
      theme="softBasicTheme"
      value={file.source}
      options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true }}
      onChange={onChange}
      onMount={handleMount}
    />
  );
};

export default SBEditor;
```

- [ ] **Step 2: Run the full test suite to confirm no regressions**

```
npm test
```

Expected: all PASS (the Editor component itself is not unit tested — verify visually via `npm run dev`)

- [ ] **Step 3: Start the dev server and verify highlighting works**

```
npm run dev
```

Open any `.bas` file in the editor. Confirm:
- Keywords like `function`, `endif`, `constructor` are highlighted in blue/bold
- Lifecycle events (`onenter`, `onupdate`) are highlighted in amber
- Comments (`' this is a comment`) are greyed out and italic
- Strings (`"hello"`) are coloured distinctly from keywords
- Typing `(` opens a paren — check it appears as matching pair (bracket matching)
- Pressing `Ctrl+/` on a line inserts a leading `'` comment character

- [ ] **Step 4: Commit**

```bash
git add src/components/Editor/index.tsx
git commit -m "feat(monaco): wire Monarch, language config, and all IDE providers into editor"
```

---

### Task 9: Status Bar Cursor Position (Feature C)

**Files:**
- Modify: `src/pages/EditPage.tsx`

- [ ] **Step 1: Open `src/pages/EditPage.tsx` and add cursor position state**

Add `useState` import (it's already imported — just add to the existing import). Add the `cursorPos` state near the other state declarations at the top of the component:

```tsx
// Add after the existing const declarations (around line 31):
const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
```

- [ ] **Step 2: Wire `onCursorChange` into the Editor slot**

Find the `<Editor>` usage inside the `editor={}` prop of `<ProjectShell>`. It currently reads:

```tsx
<Editor onChange={handleChange} file={selectedFile} height="100%" />
```

Replace with:

```tsx
<Editor
  onChange={handleChange}
  file={selectedFile}
  height="100%"
  onCursorChange={(line, col) => setCursorPos({ line, col })}
/>
```

- [ ] **Step 3: Update the footer to show live cursor position**

Find the `footer={}` prop. It currently reads:

```tsx
footer={
  <>
    <span>Ln 1, Col 1</span>
    <span>Spaces: 2 · UTF-8 · LF</span>
  </>
}
```

Replace with:

```tsx
footer={
  <>
    <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
    <span>Spaces: 2 · UTF-8 · LF</span>
  </>
}
```

- [ ] **Step 4: Run the full test suite**

```
npm test
```

Expected: all PASS

- [ ] **Step 5: Verify cursor position in the running app**

```
npm run dev
```

Open any `.bas` file. Click around — the status bar should update to reflect the cursor's line and column. Move cursor to end of a long line and confirm the column number is correct.

- [ ] **Step 6: Verify completions, hover, and signatures work end-to-end**

Still in the running app:

- Type `math.` — a dropdown should appear with all math functions. Select one — it inserts with tab stops for parameters.
- Hover over `stage` in `stage.add` — a tooltip should appear with the method signature and description.
- Type `stage.add(` — a signature help popup should appear showing `add(obj)` with `obj` highlighted.
- Type `dim x as Sprite(` — signature help should appear showing `Sprite(imagePath)`.
- Type `math.atan2(dy,` — signature help should show `math.atan2(n1, n2)` with `n2` highlighted as active.

- [ ] **Step 7: Commit**

```bash
git add src/pages/EditPage.tsx
git commit -m "feat(monaco): wire live cursor position into status bar (Feature C)"
```

---

## Self-Review

**Spec coverage:**

| Feature | Tasks |
|---|---|
| A — Token-linked highlighting | Task 4 (buildMonarchRules uses SOFTBASIC_KEYWORDS), Task 8 (wires it) |
| B — Language config (brackets, comments, indent) | Task 4 (buildLanguageConfig), Task 8 (registers it) |
| C — Status bar cursor | Task 8 (onCursorChange prop + onMount), Task 9 (EditPage wiring) |
| E — Static library completions | Tasks 2–3 (data), Task 5 (provider), Task 8 (registers it) |
| F — Hover documentation | Tasks 2–3 (data), Task 6 (provider), Task 8 (registers it) |
| H — Signature help (library only) | Tasks 2–3 (data), Task 7 (provider), Task 8 (registers it) |

All six features are covered. No gaps identified.

**Placeholder scan:** No TBDs, no "similar to Task N" references, no missing code blocks. ✅

**Type consistency:**
- `CatalogueMethod` defined in Task 3 (`catalogue.ts`) — used in Tasks 5, 6, 7 ✅
- `CatalogueEntry` defined in Task 3 — used internally in `catalogue.ts` only ✅
- `CallContext` defined in Task 7 (`signatures.ts`) — used in tests only ✅
- `parseCompletionModule` exported from `completions.ts` — imported in tests ✅
- `parseHoverContext` exported from `hover.ts` — imported in tests ✅
- `parseCallContext` exported from `signatures.ts` — imported in tests ✅
- `registerCompletionProvider`, `registerHoverProvider`, `registerSignatureHelpProvider` — all imported in `Editor/index.tsx` in Task 8 ✅
- `OnMount` type from `@monaco-editor/react` — used in Task 8 ✅
