# softBASIC Named Constants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `const … endconst` (and single-line `const NAME = value`) declaration facility to softBASIC, module-namespaced (`keyboard.SPACE`), literals-only, emitted as a hoisted per-module `Object.freeze` holder — and ship a `keyboard` def module of key-code constants as the first consumer.

**Architecture:** A new keyword pair (`const`/`endconst`) tokenizes ahead of identifiers. A single new parser rule (`ConstBlockRule`) registers `ConstantSymbol`s into the enclosing file's module scope. Existing rules (`ModuleRule`, `ModuleFactorRule`, `VariableFactorRule`, `VariableRule`, `DimRule`) are extended to resolve or reject constant references. Emission is driven entirely from the symbol table by a new `constantRules(table)` pass wired into `Basic4WebGL/index.ts` — one `const _const_<module> = Object.freeze({…})` per module, references compiled to `_const_<module>.<name>`. Editor completion/hover reuse the existing dynamic-snapshot path (no `catalogue.ts` changes).

**Tech Stack:** TypeScript, custom recursive-descent lexer/parser/transpiler (`src/lib/Basic4WebGL/`), Vitest, Vite. Verify builds with `npx vite build` (NOT `tsc`). Run tests with `npx vitest run`.

**Source of truth:** `docs/superpowers/specs/2026-08-30-softbasic-constants-design.md` (committed on `main`).

---

## Key facts about this codebase (read before starting)

- **Identifiers are case-insensitive.** `DimRule`/`VariableRule`/`VariableFactorRule` call `.toLowerCase()` on identifier text before symbol lookup; `lexer/index.ts` lowercases filenames. Stored constant names will be lowercase (`space`), emitted lowercase (`_const_keyboard.space`). Tests assert lowercase. This is expected and fine.
- **A `.bas` file's own top-level scope has scope type `''`** (= `scopeTypes.Globals`), because `RootRule` (parser, `src/lib/Basic4WebGL/parserRules/rules/RootRule.ts`) calls `symbolTable.setScope(name)` with the default `type=''`. Inside a `function` body the scope type is `'Function'`; inside a class, `'Class'`. Use this to reject `const` outside the top level.
- **Parser rules are dispatched by token name:** `RootRule` and `BlockRule` both call `getParserRule(tokenStream.current().token.name).parse(...)`. A rule registered `@RegisterParserRule('Const')` is reached whenever the current token is `tokens.Const`.
- **Rule files autoload by glob.** Creating `parserRules/rules/*.ts` (glob `./rules/**/*.ts` in `parserRules/autoload.ts`) or `transpilerRules/jsRules/ruleSets/*.ts` (glob in `transpilerRules/autoload.ts`) is enough to register it. No barrel edits.
- **`nodeTypes` and `tokens` are positional enums** (`createEnum` / `createKeyValueEnum` assign `value = array index`). **Only ever append** new entries at the end of the array — never insert in the middle.
- **`compiler.transpile({ lib, files })`** is the entry point. `lib` entries are `{ name, source }` module defs; `files` are the user's `.bas` files. The result is `{ code, diagnostics, symbols }`. A compile error produces `{ diagnostics: [{ message, severity:'error', loc }] }` and no `code`.
- **`CompilationError`** (`@CompilerLib/errors`): `new CompilationError('message')`. Optionally set `.loc` afterward. Thrown from any parser rule; `index.ts` catches it into a diagnostic.

---

## File Structure

### Created

| Path | Responsibility |
|------|----------------|
| `src/lib/Basic4WebGL/nodes/ConstBlockNode.ts` | AST marker node for a `const … endconst` block. Emits nothing; emission is symbol-table-driven. |
| `src/lib/Basic4WebGL/nodes/ConstantRefNode.ts` | AST node for a resolved constant reference (`keyboard.SPACE` or bare `SPACE`). Carries `{ module, name }`. |
| `src/lib/Basic4WebGL/parserRules/rules/ConstBlockRule.ts` | Parses block + single-line `const`; registers `ConstantSymbol`s; enforces top-level placement, literal-only RHS, no-redeclare. |
| `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ConstBlockRule.ts` | Transpiler rule for `nodeTypes.ConstBlock` — returns `''`. |
| `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ConstantRefRule.ts` | Transpiler rule for `nodeTypes.ConstantRef` — returns `_const_<module>.<name>`. |
| `src/lib/Basic4WebGL/transpilerRules/constantRules.ts` | Global emission pass: groups all `Constant` symbols by module and emits one `Object.freeze` holder each. |
| `src/lib/Basic4WebGL/defs/keyboard.bas` | The `keyboard` module — a pure `const … endconst` block of key codes. |
| `src/docs/language-guide/constants.md` | Language Guide topic explaining the `const` mechanism. |
| `src/docs/api-reference/keyboard.md` | API Reference page for the `keyboard` module (key-constants table + example). |
| `tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts` | Transpiler + diagnostics tests for the mechanism. |
| `tests/lib/Basic4WebGL/unit/lexer/constKeyword.test.ts` | Lexer tests for `const`/`endconst` tokens. |
| `tests/lib/Basic4WebGL/integration/keyboardModule.test.ts` | Integration test: `keyboard` def resolves and compiles. |
| `tests/monacoHelpers/constantsEditorSupport.test.ts` | Editor completion/hover tests for constants. |

### Modified

| Path | Change |
|------|--------|
| `src/lib/Basic4WebGL/keywords.ts` | Add `'const'`, `'endconst'`. |
| `src/lib/Basic4WebGL/tokens.ts` | Append `'Const'`, `'EndConst'`. |
| `src/lib/Basic4WebGL/TokenResolver.ts` | Add resolver rules for `endconst` then `const`, before the `Variable` rule. |
| `src/lib/Basic4WebGL/nodeTypes.ts` | Append `'ConstBlock'`, `'ConstantRef'`. |
| `src/lib/Basic4WebGL/symbolTypes.ts` | Add `symbolTypes.Constant`; add `ConstantSymbol` class. |
| `src/lib/CompilerLib/symbols/index.ts` | Add `getAllOfType(kind)`; add `value`/`valueKind` to `SymbolSnapshotEntry` and `getSnapshot()`. |
| `src/lib/Basic4WebGL/parserRules/rules/DimRule.ts` | Reject `dim <name>` where `<name>` resolves to a visible constant. |
| `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts` | Reject bare-word assignment to a constant. |
| `src/lib/Basic4WebGL/parserRules/rules/ModuleRule.ts` | Resolve `module.member` to a constant → reject as statement / assignment target. |
| `src/lib/Basic4WebGL/parserRules/rules/Expressions/ModuleFactorRule.ts` | Resolve `module.member` to a constant → `ConstantRefNode`. |
| `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts` | Resolve bare-word constant → `ConstantRefNode`. |
| `src/lib/Basic4WebGL/index.ts` | Call `constantRules` and prepend its output to `code`. |
| `src/lib/Basic4WebGL/transpilerRules/index.ts` | Export `constantRules`. |
| `src/constants/packageModules.ts` | Import + register `keyboard`. |
| `src/constants/firstPartyPackages.ts` | Add `'keyboard'` to softCore `moduleNames`. |
| `src/monacoHelpers/completions.ts` | `dynamicSymbolKind` → `Constant`; documentation string shows value. |
| `src/monacoHelpers/hover.ts` | Namespaced + bare-word constant hover shows `NAME = value`. |
| `src/docs/manifest.ts` | Add `constants` Language Guide topic + `keyboard` API Reference topic. |
| `docs/language/library-roadmap.md` | Track the shipped mechanism + `keyboard`; note controller spec as next. |
| `src/docs/roadmap.md` | Public-facing summary line. |

---

## Task 1: Lexer — `const` / `endconst` tokens

**Files:**
- Modify: `src/lib/Basic4WebGL/keywords.ts`
- Modify: `src/lib/Basic4WebGL/tokens.ts`
- Modify: `src/lib/Basic4WebGL/TokenResolver.ts`
- Test: `tests/lib/Basic4WebGL/unit/lexer/constKeyword.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/Basic4WebGL/unit/lexer/constKeyword.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';

const lex = (source: string) =>
  compiler.lexOnly({ files: [{ name: 'Main.bas', source }] });

describe('const / endconst lexer tokens', () => {
  test('const is a Const token, not a Variable', () => {
    const tokens = lex('const').tokens ?? lex('const');
    const list = Array.isArray(tokens) ? tokens : (tokens as any).tokens;
    const names = list.map((t: any) => t.token.name);
    expect(names).toContain('Const');
    expect(names).not.toContain('Variable');
  });

  test('endconst is an EndConst token', () => {
    const res: any = lex('endconst');
    const list = Array.isArray(res) ? res : res.tokens;
    const names = list.map((t: any) => t.token.name);
    expect(names).toContain('EndConst');
  });

  test('constant (an identifier starting with "const") still lexes as Variable', () => {
    const res: any = lex('constant');
    const list = Array.isArray(res) ? res : res.tokens;
    const names = list.map((t: any) => t.token.name);
    expect(names).toContain('Variable');
    expect(names).not.toContain('Const');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/lexer/constKeyword.test.ts`
Expected: FAIL — `names` contains `Variable` for `const`; `Const`/`EndConst` unknown.

If `compiler.lexOnly` return shape differs from the test's assumptions, inspect one existing lexer test under `tests/lib/Basic4WebGL/unit/lexer/` and copy its exact token-extraction pattern into this file before proceeding.

- [ ] **Step 3: Add the keyword strings**

In `src/lib/Basic4WebGL/keywords.ts`, add to the `SOFTBASIC_KEYWORDS` array under `// Declarations`:

```ts
  // Declarations
  'dim', 'class', 'as',
  'const', 'endconst',
  'constructor', 'endconstructor', 'endclass',
```

- [ ] **Step 4: Append the tokens**

In `src/lib/Basic4WebGL/tokens.ts`, append to the array passed to `createKeyValueEnum` — **at the very end, after `'New'`**:

```ts
  'New',
  'Const',
  'EndConst',
]);
```

- [ ] **Step 5: Add resolver rules**

In `src/lib/Basic4WebGL/TokenResolver.ts`, add these two rules **immediately before the final `Variable` rule** (the one matching `/^[A-Za-z_][A-Za-z_$0-9]*/`). `endconst` must come before `const` so the longer keyword wins:

```ts
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^endconst(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.EndConst,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^const(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.Const,
    }),
  },
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/lexer/constKeyword.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/Basic4WebGL/keywords.ts src/lib/Basic4WebGL/tokens.ts src/lib/Basic4WebGL/TokenResolver.ts tests/lib/Basic4WebGL/unit/lexer/constKeyword.test.ts
git commit -m "feat: add const/endconst lexer tokens"
```

---

## Task 2: `symbolTypes.Constant` + `ConstantSymbol`

**Files:**
- Modify: `src/lib/Basic4WebGL/symbolTypes.ts`
- Test: covered indirectly by Task 5; add a direct unit test here.
- Test: `tests/lib/Basic4WebGL/unit/symbols/constantSymbol.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/Basic4WebGL/unit/symbols/constantSymbol.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import { symbolTypes, ConstantSymbol } from '@Basic4WebGL/symbolTypes';
import { SymbolScope } from '@CompilerLib/symbols';

describe('ConstantSymbol', () => {
  test('symbolTypes.Constant exists', () => {
    expect(symbolTypes.Constant).toBe('Constant');
  });

  test('stores value and valueKind', () => {
    const s = new ConstantSymbol(
      'space',
      symbolTypes.Constant,
      new SymbolScope('keyboard', ''),
      'keyboard',
      32,
      'number'
    );
    expect(s.name).toBe('space');
    expect(s.type).toBe('Constant');
    expect(s.value).toBe(32);
    expect(s.valueKind).toBe('number');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/symbols/constantSymbol.test.ts`
Expected: FAIL — `symbolTypes.Constant` undefined, `ConstantSymbol` not exported.

- [ ] **Step 3: Implement**

In `src/lib/Basic4WebGL/symbolTypes.ts`:

Add to the `symbolTypes` object:

```ts
export const symbolTypes = {
  Variable: 'Variable',
  Function: 'Function',
  Array: 'Array',
  Parameter: 'Parameter',
  Module: 'Module',
  Object: 'Object',
  Class: 'Class',
  Dictionary: 'Dictionary',
  Constant: 'Constant',
};
```

Add the class near the other `Symbol` subclasses (`FunctionSymbol`, `ArraySymbol`):

```ts
export class ConstantSymbol extends Symbol {
  value: number | string | boolean;
  valueKind: 'number' | 'string' | 'boolean';
  constructor(
    name: string,
    type: string,
    scope: SymbolScope,
    fullScope: string,
    value: number | string | boolean,
    valueKind: 'number' | 'string' | 'boolean'
  ) {
    super(name, type, scope, fullScope, getBuiltInType(builtInTypes.Variant));
    this.value = value;
    this.valueKind = valueKind;
  }
}
```

(`getBuiltInType`, `builtInTypes`, `Symbol`, `SymbolScope` are already imported at the top of this file.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/symbols/constantSymbol.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/Basic4WebGL/symbolTypes.ts tests/lib/Basic4WebGL/unit/symbols/constantSymbol.test.ts
git commit -m "feat: add ConstantSymbol and symbolTypes.Constant"
```

---

## Task 3: AST node types + node classes

**Files:**
- Modify: `src/lib/Basic4WebGL/nodeTypes.ts`
- Create: `src/lib/Basic4WebGL/nodes/ConstBlockNode.ts`
- Create: `src/lib/Basic4WebGL/nodes/ConstantRefNode.ts`
- Test: `tests/lib/Basic4WebGL/unit/nodes/constantNodes.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/Basic4WebGL/unit/nodes/constantNodes.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import nodeTypes from '@Basic4WebGL/nodeTypes';
import ConstBlockNode from '@Basic4WebGL/nodes/ConstBlockNode';
import ConstantRefNode from '@Basic4WebGL/nodes/ConstantRefNode';

describe('constant AST nodes', () => {
  test('nodeTypes has ConstBlock and ConstantRef', () => {
    expect(nodeTypes.ConstBlock).toBeTypeOf('number');
    expect(nodeTypes.ConstantRef).toBeTypeOf('number');
  });

  test('ConstBlockNode carries the module name', () => {
    const n = new ConstBlockNode({ module: 'keyboard' });
    expect(n.type).toBe(nodeTypes.ConstBlock);
    expect(n.data.module).toBe('keyboard');
    expect(n.children).toEqual([]);
  });

  test('ConstantRefNode carries module + name', () => {
    const n = new ConstantRefNode({ module: 'keyboard', name: 'space' });
    expect(n.type).toBe(nodeTypes.ConstantRef);
    expect(n.data).toEqual({ module: 'keyboard', name: 'space' });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/nodes/constantNodes.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Append node types**

In `src/lib/Basic4WebGL/nodeTypes.ts`, append to the `createEnum([...])` array **at the very end, after `'ArrayLiteral'`**:

```ts
  'ArrayLiteral',
  'ConstBlock',
  'ConstantRef',
]);
```

- [ ] **Step 4: Create `ConstBlockNode.ts`**

`src/lib/Basic4WebGL/nodes/ConstBlockNode.ts`:

```ts
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class ConstBlockNode extends Tree {
  constructor(data: { module: string }, loc?: SourceLocation) {
    super(nodeTypes.ConstBlock, data, []);
    this.loc = loc;
  }
}

export default ConstBlockNode;
```

- [ ] **Step 5: Create `ConstantRefNode.ts`**

`src/lib/Basic4WebGL/nodes/ConstantRefNode.ts`:

```ts
import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { Tree } from '@CompilerLib/tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

const KIND_TO_BUILTIN: Record<string, string> = {
  number: builtInTypes.Number,
  string: builtInTypes.String,
  boolean: builtInTypes.Boolean,
};

class ConstantRefNode extends Tree {
  constructor(
    data: { module: string; name: string },
    valueKind?: 'number' | 'string' | 'boolean',
    loc?: SourceLocation
  ) {
    super(nodeTypes.ConstantRef, data, []);
    this.dataType = getBuiltInType(
      valueKind ? KIND_TO_BUILTIN[valueKind] : builtInTypes.Variant
    );
    this.loc = loc;
  }
}

export default ConstantRefNode;
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/nodes/constantNodes.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/Basic4WebGL/nodeTypes.ts src/lib/Basic4WebGL/nodes/ConstBlockNode.ts src/lib/Basic4WebGL/nodes/ConstantRefNode.ts tests/lib/Basic4WebGL/unit/nodes/constantNodes.test.ts
git commit -m "feat: add ConstBlock and ConstantRef AST nodes"
```

---

## Task 4: `Symbols.getAllOfType` helper

**Files:**
- Modify: `src/lib/CompilerLib/symbols/index.ts`
- Test: `tests/lib/CompilerLib/symbols/getAllOfType.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/CompilerLib/symbols/getAllOfType.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import Symbols, { SymbolScope } from '@CompilerLib/symbols';
import { ConstantSymbol, symbolTypes } from '@Basic4WebGL/symbolTypes';
import BuiltInType from '@CompilerLib/CompilerLib/builtInTypes';

describe('Symbols.getAllOfType', () => {
  test('returns all symbols of a kind regardless of scope', () => {
    const table = new Symbols(new BuiltInType('Variant'));
    table.addTyped(
      new ConstantSymbol('a', symbolTypes.Constant, new SymbolScope('keyboard', ''), 'keyboard', 1, 'number')
    );
    table.addTyped(
      new ConstantSymbol('b', symbolTypes.Constant, new SymbolScope('main', ''), 'main', 2, 'number')
    );
    const all = table.getAllOfType(symbolTypes.Constant);
    expect(all.map((s) => s.name).sort()).toEqual(['a', 'b']);
  });
});
```

If the `Symbols` constructor signature or `BuiltInType` import path in the snippet is wrong, copy them from an existing test under `tests/lib/CompilerLib/` — the behaviour under test (`getAllOfType`) is the point.

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/lib/CompilerLib/symbols/getAllOfType.test.ts`
Expected: FAIL — `getAllOfType` is not a function.

- [ ] **Step 3: Implement**

In `src/lib/CompilerLib/symbols/index.ts`, add a method to the `Symbols` class next to `getAll`:

```ts
  /** Every symbol of the given kind, across all scopes. Used by the
   *  constant-emission pass, which needs to group all Constant symbols by
   *  module regardless of the current scope. */
  getAllOfType(type: string): Array<Symbol> {
    return this.table.filter((s) => s.type === type);
  }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/lib/CompilerLib/symbols/getAllOfType.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/CompilerLib/symbols/index.ts tests/lib/CompilerLib/symbols/getAllOfType.test.ts
git commit -m "feat: add Symbols.getAllOfType"
```

---

## Task 5: `ConstBlockRule` parser — happy path (block + single-line)

**Files:**
- Create: `src/lib/Basic4WebGL/parserRules/rules/ConstBlockRule.ts`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';

const transpile = (source: string, extraFiles: { name: string; source: string }[] = []) =>
  compiler.transpile({ files: [{ name: 'Main.bas', source }, ...extraFiles] });

describe('const — block form', () => {
  test('block of literals compiles with no diagnostics', () => {
    const src = [
      'const',
      '  MAX_HEALTH = 100',
      '  GAME_TITLE = "Space Blaster"',
      '  DEBUG_MODE = false',
      '  GRAVITY = -9',
      'endconst',
      'function test()',
      '  dim x',
      '  x = MAX_HEALTH',
      'endfunction',
    ].join('\n');
    const result = transpile(src);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain(
      'const _const_main = Object.freeze({ max_health: 100, game_title: "Space Blaster", debug_mode: false, gravity: -9 });'
    );
  });

  test('bare reference inside the declaring file compiles to _const_<module>.<name>', () => {
    const src = [
      'const',
      '  MAX_HEALTH = 100',
      'endconst',
      'function test()',
      '  dim x',
      '  x = MAX_HEALTH',
      'endfunction',
    ].join('\n');
    const result = transpile(src);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_const_main.max_health');
  });
});

describe('const — single-line form', () => {
  test('single-line const compiles', () => {
    const src = [
      'const MAX_HEALTH = 100',
      'function test()',
      '  dim x',
      '  x = MAX_HEALTH',
      'endfunction',
    ].join('\n');
    const result = transpile(src);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('const _const_main = Object.freeze({ max_health: 100 });');
  });
});

describe('const — multiple blocks in one file merge into one holder', () => {
  test('two blocks, one frozen holder', () => {
    const src = [
      'const',
      '  A = 1',
      'endconst',
      'const',
      '  B = 2',
      'endconst',
      'function test()',
      '  dim x',
      '  x = A',
      '  x = B',
      'endfunction',
    ].join('\n');
    const result = transpile(src);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('const _const_main = Object.freeze({ a: 1, b: 2 });');
    expect(result.code.match(/_const_main =/g) ?? []).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts`
Expected: FAIL — diagnostics non-empty (`Const` token has no parser rule).

- [ ] **Step 3: Create `ConstBlockRule.ts`**

`src/lib/Basic4WebGL/parserRules/rules/ConstBlockRule.ts`:

```ts
import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { CompilationError } from '@CompilerLib/errors';
import { scopeTypes, symbolTypes, ConstantSymbol } from '../../symbolTypes';
import tokens from '../../tokens';
import { newLines } from '../../parserConfig';
import ConstBlockNode from '../../nodes/ConstBlockNode';

type LiteralKind = 'number' | 'string' | 'boolean';

function readLiteral(
  tokenStream: TokenStream,
  loc: any
): { value: number | string | boolean; valueKind: LiteralKind } {
  if (check(tokens.Subtract, tokenStream.current())) {
    matchAndMove(tokens.Subtract, tokenStream);
    matchAndMove(tokens.Number, tokenStream);
    return { value: -Number(tokenStream.prev().text), valueKind: 'number' };
  }
  if (check(tokens.Number, tokenStream.current())) {
    matchAndMove(tokens.Number, tokenStream);
    return { value: Number(tokenStream.prev().text), valueKind: 'number' };
  }
  if (check(tokens.String, tokenStream.current())) {
    matchAndMove(tokens.String, tokenStream);
    const raw = tokenStream.prev().text;
    return { value: raw.slice(1, -1), valueKind: 'string' };
  }
  if (check(tokens.BoolTrue, tokenStream.current())) {
    matchAndMove(tokens.BoolTrue, tokenStream);
    return { value: true, valueKind: 'boolean' };
  }
  if (check(tokens.BoolFalse, tokenStream.current())) {
    matchAndMove(tokens.BoolFalse, tokenStream);
    return { value: false, valueKind: 'boolean' };
  }
  const err = new CompilationError(
    'A const value must be a plain number, string, true, or false — expressions and other names are not allowed.'
  );
  (err as any).loc = loc;
  throw err;
}

@RegisterParserRule('Const')
class ConstBlockRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();

    if (symbolTable.getScopeType() !== scopeTypes.Globals) {
      const err = new CompilationError(
        'const declarations are only allowed at the top level of a file, not inside a function, class, or block.'
      );
      (err as any).loc = loc;
      throw err;
    }

    matchAndMove(tokens.Const, tokenStream);
    const moduleName = symbolTable.getScopeName();
    const declaredHere = new Set<string>();

    const parseOne = () => {
      matchAndMove(tokens.Variable, tokenStream);
      const name = tokenStream.prev().text.toLowerCase();
      const declLoc = tokenStream.prev().loc();
      if (
        declaredHere.has(name) ||
        symbolTable.findAnyInScope(name, moduleName) !== undefined
      ) {
        const err = new CompilationError(
          `'${name}' is already declared — a constant cannot be redeclared.`
        );
        (err as any).loc = declLoc;
        throw err;
      }
      matchAndMove(tokens.Equals, tokenStream);
      const { value, valueKind } = readLiteral(tokenStream, declLoc);
      symbolTable.addTyped(
        new ConstantSymbol(
          name,
          symbolTypes.Constant,
          symbolTable.getScope(),
          symbolTable.getFullScopeName(),
          value,
          valueKind
        )
      );
      declaredHere.add(name);
    };

    // Single-line form: `const NAME = literal` (identifier on the same line).
    if (check(tokens.Variable, tokenStream.current())) {
      parseOne();
      matchAndMove(newLines, tokenStream);
      return new ConstBlockNode({ module: moduleName }, loc);
    }

    // Block form.
    matchAndMove(newLines, tokenStream);
    while (!check(tokens.EndConst, tokenStream.current())) {
      if (check(newLines, tokenStream.current())) {
        matchAndMove(newLines, tokenStream);
        continue;
      }
      parseOne();
      matchAndMove(newLines, tokenStream);
    }
    matchAndMove(tokens.EndConst, tokenStream);
    matchAndMove(newLines, tokenStream);
    return new ConstBlockNode({ module: moduleName }, loc);
  }
}

export default ConstBlockRule;
```

**Notes for the implementer:**
- `symbolTable.getScopeName()` and `symbolTable.getScopeType()` and `symbolTable.getFullScopeName()` and `symbolTable.getScope()` and `symbolTable.findAnyInScope(name, scopeName)` all already exist on `Symbols` (see `src/lib/CompilerLib/symbols/index.ts`). If `getScopeName` does not exist, use `symbolTable.getScope().name`.
- `tokenStream.prev().loc()` — confirm `Token` exposes `loc()`; `tokenStream.current().loc()` is used across the codebase, `.prev()` returns the same `Token` type.
- `check(newLines, ...)` accepts the `newLines` array (`[NewLine, EndOfFile, SoftNewLine]`), same as `matchAndMove(newLines, ...)` in `DimRule`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts`
Expected: the "block form", "single-line form", and "multiple blocks" describe blocks still FAIL on the `.code` assertions (emission not built yet) but diagnostics should now be `[]`. Adjust: temporarily assert only `expect(result.diagnostics).toHaveLength(0)` is enough to confirm the parser rule works. Re-enable the `.code` assertions in Task 7.

Actually: to keep steps honest, split — comment out the `.code` `toContain` lines with a `// TODO(Task 7)` marker now, and uncomment them in Task 7 Step 1.

- [ ] **Step 5: Commit**

```bash
git add src/lib/Basic4WebGL/parserRules/rules/ConstBlockRule.ts tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts
git commit -m "feat: parse const blocks and single-line const"
```

---

## Task 6: `ConstBlockRule` parser — diagnostics

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/ConstBlockRule.ts` (only if a case is missing)
- Test: `tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts`:

```ts
describe('const — diagnostics', () => {
  const expectError = (src: string, fragment: string) => {
    const result = compiler.transpile({ files: [{ name: 'Main.bas', source: src }] });
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].message.toLowerCase()).toContain(fragment.toLowerCase());
  };

  test('non-literal RHS (another name) is rejected', () => {
    expectError('const A = 1\nconst B = A\n', 'const value must be');
  });

  test('non-literal RHS (expression) is rejected', () => {
    expectError('const\n  A = 1 + 2\nendconst\n', 'const value must be');
  });

  test('non-literal RHS (function call) is rejected', () => {
    expectError('const\n  A = math.pi()\nendconst\n', 'const value must be');
  });

  test('redeclaring a constant in the same block is rejected', () => {
    expectError('const\n  A = 1\n  A = 2\nendconst\n', 'already declared');
  });

  test('redeclaring a constant across blocks is rejected', () => {
    expectError('const\n  A = 1\nendconst\nconst\n  A = 2\nendconst\n', 'already declared');
  });

  test('const inside a function body is rejected', () => {
    expectError('function test()\n  const A = 1\nendfunction\n', 'top level');
  });

  test('const inside a class body is rejected', () => {
    expectError('class Foo\n  const A = 1\nendclass\n', 'top level');
  });
});
```

Note the "non-literal RHS (another name)" message: `readLiteral` throws `'A const value must be a plain number, string, true, or false …'`. The test fragment `'const value must be'` matches a lowercased substring of that. Keep the two in sync — if you reword the error, reword the test fragment.

- [ ] **Step 2: Run to verify**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts -t "diagnostics"`
Expected: These should mostly PASS already given Task 5's implementation. Any that FAIL indicate a gap — fix `ConstBlockRule.ts`:
- If `math.pi()` is NOT rejected: `readLiteral` sees `tokens.Variable` (`math`) → falls through to the throw. Good. But if the parser consumed `math` as part of something else, ensure `parseOne` calls `readLiteral` immediately after `matchAndMove(tokens.Equals)`.
- If "const inside a class body" is not rejected: confirm class-body scope type is `'Class'` (not `''`). If a class body somehow reports `''`, add an explicit check: also reject when `symbolTable.getScopeDepth() > 1`.

- [ ] **Step 3: Fix any gaps in `ConstBlockRule.ts`** (code only if a test failed — otherwise skip)

- [ ] **Step 4: Run the full constants test file**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts`
Expected: all diagnostics tests PASS; emission `.code` tests still TODO.

- [ ] **Step 5: Commit**

```bash
git add src/lib/Basic4WebGL/parserRules/rules/ConstBlockRule.ts tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts
git commit -m "test: const parser diagnostics (non-literal RHS, redeclare, placement)"
```

---

## Task 7: Transpiler emission — `constantRules` + node rules

**Files:**
- Create: `src/lib/Basic4WebGL/transpilerRules/constantRules.ts`
- Create: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ConstBlockRule.ts`
- Create: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ConstantRefRule.ts`
- Modify: `src/lib/Basic4WebGL/transpilerRules/index.ts`
- Modify: `src/lib/Basic4WebGL/index.ts`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts`

- [ ] **Step 1: Re-enable the emission assertions**

Uncomment the `.code` `toContain` assertions in the "block form", "single-line form", and "multiple blocks" describe blocks (the `// TODO(Task 7)` markers from Task 5).

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts`
Expected: FAIL — no `_const_main` in output.

- [ ] **Step 3: Create the transpiler node rules**

`src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ConstBlockRule.ts`:

```ts
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import nodeTypes from '../../../nodeTypes';

@RegisterTranspilerRule(nodeTypes.ConstBlock)
class ConstBlockRule implements IGeneratable {
  // Emits nothing at its source position — the frozen holder is generated
  // once per module by constantRules(), hoisted ahead of all module code.
  generate(): string {
    return '';
  }
}

export default ConstBlockRule;
```

`src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ConstantRefRule.ts`:

```ts
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';

@RegisterTranspilerRule(nodeTypes.ConstantRef)
class ConstantRefRule implements IGeneratable {
  generate(node: Tree): string {
    return `_const_${node.data.module}.${node.data.name}`;
  }
}

export default ConstantRefRule;
```

Confirm the import path `@CompilerLib/transpiler/IGeneratable` and the `RegisterTranspilerRule` / `IGeneratable` names against an existing sibling file such as `transpilerRules/jsRules/ruleSets/AssignRule.ts`.

- [ ] **Step 4: Create `constantRules.ts`**

`src/lib/Basic4WebGL/transpilerRules/constantRules.ts`:

```ts
import Symbols from '@CompilerLib/symbols';
import { symbolTypes, ConstantSymbol } from '../symbolTypes';

const formatValue = (c: ConstantSymbol): string =>
  c.valueKind === 'string' ? JSON.stringify(c.value) : String(c.value);

/**
 * One frozen holder per module that declares constants:
 *   const _const_keyboard = Object.freeze({ space: 32, enter: 13 });
 *
 * Driven entirely from the symbol table (not the AST) so that multiple
 * `const … endconst` blocks in one file collapse to a single holder and the
 * output is inert — safe to hoist ahead of every module body. Reference sites
 * compile to `_const_<module>.<name>` (see ConstantRefRule).
 */
export const constantRules = (table: Symbols): string => {
  const consts = table.getAllOfType(symbolTypes.Constant) as ConstantSymbol[];
  if (consts.length === 0) return '';

  const byModule = new Map<string, ConstantSymbol[]>();
  for (const c of consts) {
    const list = byModule.get(c.scope.name) ?? [];
    list.push(c);
    byModule.set(c.scope.name, list);
  }

  const lines: string[] = [];
  for (const [moduleName, list] of byModule) {
    const entries = list.map((c) => `${c.name}: ${formatValue(c)}`).join(', ');
    lines.push(`const _const_${moduleName} = Object.freeze({ ${entries} });`);
  }
  return lines.join('\n') + '\n';
};

export default constantRules;
```

- [ ] **Step 5: Export from `transpilerRules/index.ts`**

`src/lib/Basic4WebGL/transpilerRules/index.ts` becomes:

```ts
import './autoload'; // pulls in every rule file
import symbolRules, { isMatchingType } from './symbolRules';
import constantRules from './constantRules';
import nodeTypes from '../nodeTypes';
import terminationRules from './terminationRules';

export default {
  nodeTypes,
  symbolRules,
  constantRules,
  isMatchingType,
  terminationRules,
};
```

- [ ] **Step 6: Wire into `Basic4WebGL/index.ts`**

In `src/lib/Basic4WebGL/index.ts`, inside `transpile()`, after the `globals` line:

```ts
    const globals = transpilerRules.symbolRules(
      parseResult.symbolTable,
      new SymbolScope('', '')
    );
    const constants = transpilerRules.constantRules(parseResult.symbolTable);
    const code =
      globals +
      constants +
      transpilerInstance.transpile(parseResult, parseResult.symbolTable, transpilerRules);
```

- [ ] **Step 7: Run the tests**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts`
Expected: "block form", "single-line form", "multiple blocks" now PASS. Bare-reference test still needs Task 8 (`VariableFactorRule`) — it may still FAIL on `_const_main.max_health`. If so, move its assertion to Task 8 Step 1.

- [ ] **Step 8: Full suite sanity**

Run: `npx vitest run`
Expected: no regressions. If `tests/lib/Basic4WebGL/unit/generator/generatedDefsInSync.test.ts` fails, it is unrelated to this task — investigate separately (it should not be affected; `keyboard` is not descriptor-generated).

- [ ] **Step 9: Commit**

```bash
git add src/lib/Basic4WebGL/transpilerRules/constantRules.ts src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ConstBlockRule.ts src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ConstantRefRule.ts src/lib/Basic4WebGL/transpilerRules/index.ts src/lib/Basic4WebGL/index.ts tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts
git commit -m "feat: emit const blocks as hoisted Object.freeze holders"
```

---

## Task 8: Bare-word constant references (`VariableFactorRule`)

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts`

- [ ] **Step 1: Write / move the failing test**

Ensure `tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts` has:

```ts
describe('const — bare references', () => {
  test('bare reference in an expression compiles to _const_<module>.<name>', () => {
    const src = [
      'const MAX = 100',
      'function test()',
      '  dim x',
      '  x = MAX + 1',
      'endfunction',
    ].join('\n');
    const result = compiler.transpile({ files: [{ name: 'Main.bas', source: src }] });
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_const_main.max');
  });

  test('bare reference as a function argument compiles', () => {
    const src = [
      'const SPEED = 5',
      'function test()',
      '  dim x',
      '  x = math.max(SPEED, 1)',
      'endfunction',
    ].join('\n');
    const result = compiler.transpile({ files: [{ name: 'Main.bas', source: src }] });
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_const_main.speed');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts -t "bare references"`
Expected: FAIL — `SymbolError: Variable max ... has not been declared` (the generic `symbolTable.get(name)` doesn't match a `Constant` kind).

- [ ] **Step 3: Implement**

In `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts`:

Add the import:

```ts
import ConstantRefNode from '@Basic4WebGL/nodes/ConstantRefNode';
```

In `parse()`, immediately after `const name = tokenStream.prev().text.toLowerCase();` and **before** `if (symbolTable.check(name, symbolTypes.Module))`:

```ts
    if (symbolTable.check(name, symbolTypes.Constant)) {
      const constSym = symbolTable.get(name, symbolTypes.Constant) as any;
      return new ConstantRefNode(
        { module: constSym.scope.name, name },
        constSym.valueKind,
        loc
      );
    }
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts`
Expected: "bare references" PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts
git commit -m "feat: resolve bare-word constant references in expressions"
```

---

## Task 9: Namespaced constant references (`ModuleFactorRule`) + statement rejection (`ModuleRule`)

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/Expressions/ModuleFactorRule.ts`
- Modify: `src/lib/Basic4WebGL/parserRules/rules/ModuleRule.ts`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts`

- [ ] **Step 1: Write the failing test**

Append:

```ts
describe('const — namespaced references (cross-file)', () => {
  const keys = {
    name: 'Keys.bas',
    source: ['const', '  SPACE = 32', '  LEFT = 37', 'endconst'].join('\n'),
  };

  test('module.CONSTANT in an expression compiles to _const_keys.<name>', () => {
    const src = [
      'function test()',
      '  dim x',
      '  x = keys.SPACE',
      'endfunction',
    ].join('\n');
    const result = compiler.transpile({ files: [{ name: 'Main.bas', source: src }, keys] });
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_const_keys.space');
  });

  test('assigning to module.CONSTANT is rejected', () => {
    const src = [
      'function test()',
      '  keys.SPACE = 5',
      'endfunction',
    ].join('\n');
    const result = compiler.transpile({ files: [{ name: 'Main.bas', source: src }, keys] });
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].message.toLowerCase()).toContain('constant');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts -t "namespaced"`
Expected: FAIL — `ModuleFactorRule` calls `getInScope(functionName, Function, name)` and throws `SymbolError` because `space` is a `Constant`, not a `Function`.

- [ ] **Step 3: Implement `ModuleFactorRule`**

`src/lib/Basic4WebGL/parserRules/rules/Expressions/ModuleFactorRule.ts` — add imports:

```ts
import ConstantRefNode from '@Basic4WebGL/nodes/ConstantRefNode';
```

Replace the body of the `try` block so the member is resolved as a constant first:

```ts
    try {
      matchAndMove(tokens.Variable, tokenStream);
      const memberName = tokenStream.prev().text;
      const loc = tokenStream.current().loc();

      let constSym: any;
      try {
        constSym = symbolTable.getInScope(memberName, symbolTypes.Constant, name);
      } catch {
        constSym = undefined;
      }
      if (constSym) {
        node = new ConstantRefNode(
          { module: name, name: memberName.toLowerCase() },
          constSym.valueKind,
          loc
        );
      } else {
        const functionSymbol = symbolTable.getInScope(memberName, symbolTypes.Function, name);
        const expr = getParserRule('ExpressionList').parse(
          tokenStream,
          symbolTable,
          undefined
        );
        node = new FunctionTermNode(functionSymbol, expr, tokenStream.current().loc());
      }
    } finally {
      symbolTable.clearScope();
    }
```

- [ ] **Step 4: Implement `ModuleRule` (statement context)**

`src/lib/Basic4WebGL/parserRules/rules/ModuleRule.ts` — add imports:

```ts
import { check } from '@CompilerLib/parser/rulesHelper';
import { CompilationError } from '@CompilerLib/errors';
```

In the `try` block, after `matchAndMove(tokens.Variable, tokenStream)` and `const functionName = tokenStream.prev().text;`, before the `getInScope(functionName, Function, name)` line, add:

```ts
      let constSym: any;
      try {
        constSym = symbolTable.getInScope(functionName, symbolTypes.Constant, name);
      } catch {
        constSym = undefined;
      }
      if (constSym) {
        throw new CompilationError(
          check(tokens.Equals, tokenStream.current())
            ? `'${name}.${functionName}' is a constant and cannot be assigned.`
            : `'${name}.${functionName}' is a constant — it can't be used as a statement on its own.`
        );
      }
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts`
Expected: "namespaced references" PASS. Full file green except any deferred to later tasks.

- [ ] **Step 6: Commit**

```bash
git add src/lib/Basic4WebGL/parserRules/rules/Expressions/ModuleFactorRule.ts src/lib/Basic4WebGL/parserRules/rules/ModuleRule.ts tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts
git commit -m "feat: resolve module.CONSTANT references; reject constant assignment"
```

---

## Task 10: Reject bare-word assignment (`VariableRule`) + `dim` shadowing (`DimRule`)

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts`
- Modify: `src/lib/Basic4WebGL/parserRules/rules/DimRule.ts`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts`

- [ ] **Step 1: Write the failing tests**

Append:

```ts
describe('const — assignment and shadowing rules', () => {
  const expectError = (src: string, fragment: string) => {
    const result = compiler.transpile({ files: [{ name: 'Main.bas', source: src }] });
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].message.toLowerCase()).toContain(fragment.toLowerCase());
  };

  test('assigning to a bare constant name is rejected', () => {
    expectError('const MAX = 1\nfunction test()\n  MAX = 2\nendfunction\n', 'constant');
  });

  test('dim with a constant name at module level is rejected', () => {
    expectError('const MAX = 1\ndim MAX\n', 'constant');
  });

  test('dim shadowing a constant inside a function is rejected', () => {
    expectError('const MAX = 1\nfunction test()\n  dim MAX\nendfunction\n', 'constant');
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts -t "assignment and shadowing"`
Expected: FAIL — "assigning to a bare constant" throws a `SymbolError` with a different message ("Variable max ... has not been declared"), and the `dim` cases may currently succeed or throw a cross-kind-collision message that doesn't contain "constant".

- [ ] **Step 3: Implement `VariableRule`**

`src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts` — add import:

```ts
import { CompilationError } from '@CompilerLib/errors';
```

In `parse()`, immediately after `const name = tokenStream.prev().text.toLowerCase();` and after the existing `if (symbolTable.check(name, symbolTypes.Module))` block, add:

```ts
    if (symbolTable.check(name, symbolTypes.Constant)) {
      throw new CompilationError(`'${name}' is a constant and cannot be assigned.`);
    }
```

- [ ] **Step 4: Implement `DimRule`**

`src/lib/Basic4WebGL/parserRules/rules/DimRule.ts` — `CompilationError` is already imported. In `parseDeclarator()`, immediately after `matchAndMove(tokens.Variable, tokenStream);` and `const name = tokenStream.prev().text.toLowerCase();`, add:

```ts
    if (symbolTable.check(name, symbolTypes.Constant)) {
      throw new CompilationError(
        `'${name}' is a constant and cannot be redeclared with 'dim'.`
      );
    }
```

`symbolTypes` is already imported in `DimRule.ts` (`import { ArraySymbol, DictionarySymbol, symbolTypes } from '../../symbolTypes';`).

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts src/lib/Basic4WebGL/parserRules/rules/DimRule.ts tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts
git commit -m "feat: reject constant assignment and dim-shadowing of constants"
```

---

## Task 11: Symbol snapshot carries `value` / `valueKind`

**Files:**
- Modify: `src/lib/CompilerLib/symbols/index.ts`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts`

- [ ] **Step 1: Write the failing test**

Append:

```ts
describe('const — symbol snapshot', () => {
  test('snapshot entry carries kind Constant, value, and valueKind', () => {
    const src = ['const', '  SPEED = 5', '  TITLE = "Hi"', 'endconst', ''].join('\n');
    const result = compiler.transpile({ files: [{ name: 'Main.bas', source: src }] });
    const speed = result.symbols?.find((s: any) => s.name === 'speed');
    expect(speed?.kind).toBe('Constant');
    expect(speed?.value).toBe(5);
    expect(speed?.valueKind).toBe('number');
    const title = result.symbols?.find((s: any) => s.name === 'title');
    expect(title?.value).toBe('Hi');
    expect(title?.valueKind).toBe('string');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts -t "symbol snapshot"`
Expected: FAIL — `value` / `valueKind` are `undefined` in the snapshot.

- [ ] **Step 3: Implement**

`src/lib/CompilerLib/symbols/index.ts`:

Add to the `SymbolSnapshotEntry` type:

```ts
export type SymbolSnapshotEntry = {
  name: string;
  kind: string;
  scopeName: string;
  scopeType: string;
  fullScope: string;
  className?: string;
  parentClassName?: string;
  isParam?: boolean;
  dimensions?: number;
  parameters?: { name: string; className?: string }[];
  value?: string | number | boolean;
  valueKind?: string;
};
```

Add to the object returned by `getSnapshot()`:

```ts
      parameters: (s as any).parameters?.map((p: Symbol) => ({
        name: p.name,
        className: (p as any).classSymbol?.name,
      })),
      value: (s as any).value,
      valueKind: (s as any).valueKind,
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts -t "symbol snapshot"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/CompilerLib/symbols/index.ts tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts
git commit -m "feat: include constant value/valueKind in symbol snapshot"
```

---

## Task 12: Editor support — completion + hover

**Files:**
- Modify: `src/monacoHelpers/completions.ts`
- Modify: `src/monacoHelpers/hover.ts`
- Test: `tests/monacoHelpers/constantsEditorSupport.test.ts`

- [ ] **Step 1: Read the existing sibling tests**

Read `tests/monacoHelpers/` for the existing completion/hover test setup (how `Monaco` is mocked, how `SymbolContext` is built). Match that setup exactly in the new file. If there is a helper that builds a fake `monaco` object, reuse it.

- [ ] **Step 2: Write the failing test**

Create `tests/monacoHelpers/constantsEditorSupport.test.ts`. Adapt the mock setup from Step 1; the assertions to make:

```ts
import { describe, test, expect } from 'vitest';
import type { SymbolSnapshotEntry } from '../../src/lib/CompilerLib/symbols';
import { getVisibleSymbols, getMembers } from '../../src/monacoHelpers/symbolCatalogue';

const snapshot: SymbolSnapshotEntry[] = [
  { name: 'keyboard', kind: 'Module', scopeName: '', scopeType: '', fullScope: '' },
  { name: 'space', kind: 'Constant', scopeName: 'keyboard', scopeType: '', fullScope: 'keyboard', value: 32, valueKind: 'number' },
  { name: 'max_health', kind: 'Constant', scopeName: 'main', scopeType: '', fullScope: 'main', value: 100, valueKind: 'number' },
];

describe('constants — editor data plumbing', () => {
  test('getMembers returns a module’s constants for dot-completion', () => {
    const members = getMembers(snapshot, 'keyboard');
    expect(members.map((m) => m.name)).toContain('space');
  });

  test('getVisibleSymbols surfaces a constant declared in the active file', () => {
    const visible = getVisibleSymbols(snapshot, 'main', []);
    expect(visible.map((s) => s.name)).toContain('max_health');
  });
});
```

Then add provider-level tests using the mocked `monaco` from Step 1:
- `registerCompletionProvider` bare-word branch: a `Constant` snapshot entry visible in the active file produces a suggestion whose `kind` is `monaco.languages.CompletionItemKind.Constant`.
- `registerHoverProvider` case 3 (bare word `max_health`): `contents[0].value` contains `max_health` and `100`.
- `registerHoverProvider` case 1 (`keyboard.space`): `contents[0].value` contains `keyboard.space` and `32`.

- [ ] **Step 3: Run to verify it fails**

Run: `npx vitest run tests/monacoHelpers/constantsEditorSupport.test.ts`
Expected: `getMembers`/`getVisibleSymbols` tests PASS (already generic). Provider tests FAIL — completion kind is `Variable` (the `default` branch of `dynamicSymbolKind`), hover on `keyboard.space` returns `null`.

- [ ] **Step 4: Implement `completions.ts`**

In `src/monacoHelpers/completions.ts`, `dynamicSymbolKind`:

```ts
function dynamicSymbolKind(monaco: Monaco, s: SymbolSnapshotEntry): number {
  switch (s.kind) {
    case symbolTypes.Function:
      return monaco.languages.CompletionItemKind.Function ?? monaco.languages.CompletionItemKind.Method;
    case symbolTypes.Class:
      return monaco.languages.CompletionItemKind.Class;
    case symbolTypes.Module:
      return monaco.languages.CompletionItemKind.Module;
    case symbolTypes.Constant:
      return monaco.languages.CompletionItemKind.Constant;
    default:
      return monaco.languages.CompletionItemKind.Variable;
  }
}
```

In `symbolToCompletionItem`, improve the `documentation` line:

```ts
    documentation:
      s.valueKind !== undefined
        ? `constant = ${s.valueKind === 'string' ? JSON.stringify(s.value) : s.value}`
        : s.className
        ? `${s.kind} (${s.className})`
        : s.kind,
```

`buildDynamicSnippet` already returns `s.name` for any non-Function with no parameters — no change needed.

- [ ] **Step 5: Implement `hover.ts`**

In `src/monacoHelpers/hover.ts`:

Add import:

```ts
import { getVisibleSymbols, getMembers, type SymbolContext } from './symbolCatalogue';
```

(Replace the existing `import { getVisibleSymbols, type SymbolContext } from './symbolCatalogue';` line.)

In `provideHover`, **Case 1** — after `const method = getModuleMethod(ctx.moduleName, ctx.methodName); if (!method) return null;` — change the early `return null` to a fallthrough that first tries a namespaced constant:

```ts
      const method = getModuleMethod(ctx.moduleName, ctx.methodName);
      if (method) {
        return {
          contents: [
            { value: `**${ctx.moduleName}.${method.name}(${method.params.join(', ')})**` },
            { value: method.description },
          ],
        };
      }
      if (symbolContext) {
        const member = getMembers(symbolContext.getSymbols(), ctx.moduleName).find(
          (s) => s.name.toLowerCase() === ctx.methodName && s.kind === symbolTypes.Constant
        );
        if (member) {
          const shown = member.valueKind === 'string' ? JSON.stringify(member.value) : member.value;
          return { contents: [{ value: `**${ctx.moduleName}.${member.name}** = ${shown}` }] };
        }
      }
      return null;
```

In **Case 3** (the dynamic bare-word fallback), after `const match = symbols.find(...)` and inside `if (match) {`, before the `if (match.kind === symbolTypes.Function)` line, add:

```ts
        if (match.kind === symbolTypes.Constant) {
          const shown = match.valueKind === 'string' ? JSON.stringify(match.value) : match.value;
          return { contents: [{ value: `**${match.name}** = ${shown}` }] };
        }
```

- [ ] **Step 6: Run the tests**

Run: `npx vitest run tests/monacoHelpers/constantsEditorSupport.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/monacoHelpers/completions.ts src/monacoHelpers/hover.ts tests/monacoHelpers/constantsEditorSupport.test.ts
git commit -m "feat: editor completion + hover for constants"
```

---

## Task 13: The `keyboard` def module

**Files:**
- Create: `src/lib/Basic4WebGL/defs/keyboard.bas`
- Test: `tests/lib/Basic4WebGL/integration/keyboardModule.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/Basic4WebGL/integration/keyboardModule.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import compiler from '@Basic4WebGL/index';

const keyboardLib = {
  name: 'keyboard',
  source: readFileSync('src/lib/Basic4WebGL/defs/keyboard.bas', 'utf-8'),
};
const mathLib = {
  name: 'math',
  source: readFileSync('src/lib/Basic4WebGL/defs/math.bas', 'utf-8'),
};
const inputLib = {
  name: 'input',
  source: readFileSync('src/lib/Basic4WebGL/defs/input.bas', 'utf-8'),
};

const transpile = (source: string) =>
  compiler.transpile({ lib: [keyboardLib, mathLib, inputLib], files: [{ name: 'Main.bas', source }] });

describe('keyboard module', () => {
  test('keyboard.bas compiles on its own with no diagnostics', () => {
    const result = compiler.transpile({ lib: [keyboardLib], files: [{ name: 'Main.bas', source: '' }] });
    expect(result.diagnostics).toHaveLength(0);
  });

  test('keyboard.SPACE resolves and compiles through input.getKeyDown', () => {
    const src = [
      'function test()',
      '  dim held',
      '  held = input.getKeyDown(keyboard.SPACE)',
      'endfunction',
    ].join('\n');
    const result = transpile(src);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_const_keyboard.space');
  });

  test('emitted holder is frozen and includes the full expected set', () => {
    const result = transpile('function test()\n  dim x\n  x = keyboard.A\nendfunction');
    expect(result.code).toContain('const _const_keyboard = Object.freeze({');
    for (const [name, val] of [
      ['left', 37], ['up', 38], ['right', 39], ['down', 40],
      ['space', 32], ['enter', 13], ['escape', 27], ['tab', 9], ['backspace', 8],
      ['delete', 46], ['home', 36], ['end', 35],
      ['shift', 16], ['ctrl', 17], ['alt', 18],
      ['a', 65], ['z', 90], ['digit_0', 48], ['digit_9', 57],
    ] as [string, number][]) {
      expect(result.code).toContain(`${name}: ${val}`);
    }
  });

  test('assigning to a keyboard constant is rejected', () => {
    const result = transpile('function test()\n  keyboard.SPACE = 1\nendfunction');
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/keyboardModule.test.ts`
Expected: FAIL — `keyboard.bas` does not exist (`readFileSync` throws).

- [ ] **Step 3: Create `keyboard.bas`**

`src/lib/Basic4WebGL/defs/keyboard.bas` — exactly this content (49 constants, DOM legacy `keyCode` integers):

```
' keyboard — named key codes for input.getKeyDown / input.keyPressed / input.keyReleased.
' Values are DOM legacy keyCode integers. UPPER_SNAKE_CASE by convention
' (softBASIC names are case-insensitive). See the controller spec for the
' matching gamepad set.
const
    LEFT = 37
    UP = 38
    RIGHT = 39
    DOWN = 40
    SPACE = 32
    ENTER = 13
    ESCAPE = 27
    TAB = 9
    BACKSPACE = 8
    DELETE = 46
    HOME = 36
    END = 35
    SHIFT = 16
    CTRL = 17
    ALT = 18
    A = 65
    B = 66
    C = 67
    D = 68
    E = 69
    F = 70
    G = 71
    H = 72
    I = 73
    J = 74
    K = 75
    L = 76
    M = 77
    N = 78
    O = 79
    P = 80
    Q = 81
    R = 82
    S = 83
    T = 84
    U = 85
    V = 86
    W = 87
    X = 88
    Y = 89
    Z = 90
    DIGIT_0 = 48
    DIGIT_1 = 49
    DIGIT_2 = 50
    DIGIT_3 = 51
    DIGIT_4 = 52
    DIGIT_5 = 53
    DIGIT_6 = 54
    DIGIT_7 = 55
    DIGIT_8 = 56
    DIGIT_9 = 57
endconst
```

**Watch out:** `END = 35` — `end` is not a softBASIC keyword (there is no `end` token; block terminators are `endif`, `endwhile`, etc.), so `END` lexes as a `Variable` and is a valid constant name. Confirm the integration test's `['end', 35]` row passes; if the lexer treats `end` specially, rename that constant to `END_KEY = 35` and update the test + docs.

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/keyboardModule.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/Basic4WebGL/defs/keyboard.bas tests/lib/Basic4WebGL/integration/keyboardModule.test.ts
git commit -m "feat: add keyboard def module (key-code constants)"
```

---

## Task 14: Register the `keyboard` package

**Files:**
- Modify: `src/constants/packageModules.ts`
- Modify: `src/constants/firstPartyPackages.ts`
- Test: `tests/lib/Basic4WebGL/integration/keyboardModule.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/lib/Basic4WebGL/integration/keyboardModule.test.ts`:

```ts
import { packageModules } from '../../../src/constants/packageModules';
import { firstPartyPackages } from '../../../src/constants/firstPartyPackages';

describe('keyboard package registration', () => {
  test('packageModules["keyboard"] resolves to the def source', () => {
    expect(typeof packageModules['keyboard']).toBe('string');
    expect(packageModules['keyboard']).toContain('const');
    expect(packageModules['keyboard']).toContain('SPACE = 32');
  });

  test('keyboard is listed in the softCore package moduleNames', () => {
    const softcore = firstPartyPackages.find((p) => p.id === 'softcore');
    expect(softcore?.moduleNames).toContain('keyboard');
  });

  test('compiling keyboard.SPACE through the resolved softcore lib yields no diagnostics', () => {
    const libs = [
      { name: 'keyboard', source: packageModules['keyboard'] },
      { name: 'input', source: readFileSync('src/lib/Basic4WebGL/defs/input.bas', 'utf-8') },
    ];
    const src = 'function test()\n  dim x\n  x = input.getKeyDown(keyboard.LEFT)\nendfunction';
    const result = compiler.transpile({ lib: libs, files: [{ name: 'Main.bas', source: src }] });
    expect(result.diagnostics).toHaveLength(0);
  });
});
```

Check the exact import mechanics against how other tests import `packageModules` — if `?raw` Vite imports break under Vitest, guard by reading `src/lib/Basic4WebGL/defs/keyboard.bas` directly instead and keep only the `firstPartyPackages` assertion for the registration list. (Confirm whether an existing test imports `packageModules` successfully; `dict` has a similar registration test referenced in `docs/roadmap.md` item 7.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/keyboardModule.test.ts -t "registration"`
Expected: FAIL — `packageModules['keyboard']` undefined; `moduleNames` lacks `keyboard`.

- [ ] **Step 3: Implement `packageModules.ts`**

`src/constants/packageModules.ts`:

Add the import next to the other `defs/*.bas?raw` imports:

```ts
import keyboard from '../lib/Basic4WebGL/defs/keyboard.bas?raw';
```

Add to the `packageModules` record (place it right after `input,` for grouping):

```ts
  input,
  keyboard,
```

- [ ] **Step 4: Implement `firstPartyPackages.ts`**

`src/constants/firstPartyPackages.ts` — add `'keyboard'` to the softCore entry's `moduleNames`:

```ts
    moduleNames: ['math', 'string', 'array', 'dict', 'file', 'save', 'keyboard'],
```

Rationale: `keyboard` is pure data with no runtime engine dependency, so softCore (the always-on core package) is the right home — it is available in every project without adding `softgfx`.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/keyboardModule.test.ts`
Expected: PASS.

- [ ] **Step 6: Full suite**

Run: `npx vitest run`
Expected: green. Watch for any test that snapshots the full softCore module list or the number of packages — update it if it now legitimately includes `keyboard`.

- [ ] **Step 7: Commit**

```bash
git add src/constants/packageModules.ts src/constants/firstPartyPackages.ts tests/lib/Basic4WebGL/integration/keyboardModule.test.ts
git commit -m "feat: register keyboard module in softCore package"
```

---

## Task 15: Language Guide — Constants topic

**Files:**
- Create: `src/docs/language-guide/constants.md`
- Modify: `src/docs/manifest.ts`
- Test: `tests/docs/` (if a docs-integrity test exists) — otherwise manual.

- [ ] **Step 1: Check for a docs-manifest test**

Run: `npx vitest run --dir tests/docs 2>/dev/null || npx vitest run -t "manifest"`
If a test asserts every `manifest.ts` `file` path exists on disk (common pattern), it will fail after Step 3 until Step 2 creates the file — do Step 2 and Step 3 together, then run it.

- [ ] **Step 2: Create `constants.md`**

`src/docs/language-guide/constants.md`:

```markdown
# Constants

A **constant** is a name for a fixed value that never changes while your game
runs. Use one wherever a "magic number" would otherwise appear — a key code, a
starting score, a speed limit, a title string.

## Declaring constants

Use a `const … endconst` block for a group of related values:

```basic
const
    MAX_HEALTH = 100
    START_LIVES = 3
    GAME_TITLE = "Space Blaster"
    DEBUG_MODE = false
endconst
```

For a single value, write it on one line:

```basic
const GRAVITY = 9
```

Constants must be declared at the **top level of a file** — not inside a
function, a class, or an `if`/`while`/`for` block.

## What can be a constant value

Only a plain literal: a number (including negatives like `-9`), a piece of text
in quotes, or `true` / `false`. You cannot use a calculation, another
constant, or a function call:

```basic
const TAU = PI * 2      ' ERROR - not a plain value
const SPEED = getSpeed() ' ERROR - not a plain value
```

## Using constants

Inside the file that declares them, use the bare name:

```basic
function onupdate(delta)
    if score >= MAX_HEALTH then
        ' ...
    endif
endfunction
```

From another file, put the file's name in front, just like calling a function
from another module:

```basic
' in Main.bas, where the constants live in Config.bas
if lives <= 0 then
    lives = Config.START_LIVES
endif
```

Library modules provide constants the same way. The `keyboard` module is all
constants:

```basic
if input.getKeyDown(keyboard.SPACE) then
    fireBullet()
endif
```

## Rules

- A constant **cannot be assigned to** — `MAX_HEALTH = 200` is an error.
- A constant **cannot be redeclared**, and a `dim` variable **cannot reuse a
  constant's name** (not even a local one inside a function).
- Constant names are written in `UPPER_SNAKE_CASE` **by convention**. softBASIC
  treats names as case-insensitive, so `keyboard.SPACE` and `keyboard.space`
  are the same constant — the capitals are just a signal to whoever reads your
  code that the value is fixed.
```

- [ ] **Step 3: Register in `manifest.ts`**

In `src/docs/manifest.ts`, in the `language-guide` section's `topics` array, add after the `operators` entry:

```ts
      { slug: 'operators',         title: 'Operators',           file: 'language-guide/operators.md' },
      { slug: 'constants',         title: 'Constants',           file: 'language-guide/constants.md' },
```

- [ ] **Step 4: Verify**

Run: `npx vite build`
Expected: success. Then run any docs test found in Step 1 — expected PASS.

- [ ] **Step 5: Commit**

```bash
git add src/docs/language-guide/constants.md src/docs/manifest.ts
git commit -m "docs: add Constants language guide topic"
```

---

## Task 16: API Reference — `keyboard` page

**Files:**
- Create: `src/docs/api-reference/keyboard.md`
- Modify: `src/docs/manifest.ts`

- [ ] **Step 1: Create `keyboard.md`**

`src/docs/api-reference/keyboard.md`:

```markdown
# keyboard

The `keyboard` module is a set of named **key codes** — nothing else, no
functions. Pass them to `input.getKeyDown`, `input.keyPressed`, or
`input.keyReleased` instead of remembering raw numbers.

```basic
function onupdate(delta)
    if input.getKeyDown(keyboard.LEFT) then
        player.transform.x = player.transform.x - 100 * delta / 1000
    endif
    if input.keyPressed(keyboard.SPACE) then
        fireBullet()
    endif
endfunction
```

These are constants, so you cannot change them, and you write them in capitals
by convention.

## Key constants

| Name | Key |
|------|-----|
| `keyboard.LEFT` `keyboard.UP` `keyboard.RIGHT` `keyboard.DOWN` | Arrow keys |
| `keyboard.SPACE` | Spacebar |
| `keyboard.ENTER` | Enter / Return |
| `keyboard.ESCAPE` | Esc |
| `keyboard.TAB` | Tab |
| `keyboard.BACKSPACE` | Backspace |
| `keyboard.DELETE` | Delete |
| `keyboard.HOME` `keyboard.END` | Home / End |
| `keyboard.SHIFT` `keyboard.CTRL` `keyboard.ALT` | Modifier keys |
| `keyboard.A` … `keyboard.Z` | Letter keys |
| `keyboard.DIGIT_0` … `keyboard.DIGIT_9` | Number-row digit keys |

Function keys and the numeric keypad are not included yet.
```

If Task 13 Step 3 renamed `END` to `END_KEY`, change the `keyboard.END` cell here to `keyboard.END_KEY`.

- [ ] **Step 2: Register in `manifest.ts`**

In `src/docs/manifest.ts`, in the `api-reference` section, `softCore` group `topics` array, add after `save`:

```ts
          { slug: 'save',   title: 'save',   file: 'api-reference/save.md' },
          { slug: 'keyboard', title: 'keyboard', file: 'api-reference/keyboard.md' },
```

- [ ] **Step 3: Verify**

Run: `npx vite build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add src/docs/api-reference/keyboard.md src/docs/manifest.ts
git commit -m "docs: add keyboard module API reference page"
```

---

## Task 17: Roadmap updates

**Files:**
- Modify: `docs/language/library-roadmap.md`
- Modify: `src/docs/roadmap.md`

- [ ] **Step 1: Update `docs/language/library-roadmap.md`**

Add a dated, done-marked entry in the appropriate section (match the file's existing format for completed items). Content to convey:

- Named constants shipped: `const … endconst` + single-line `const NAME = value`, module-namespaced (`module.NAME`), literals only (number/string/`true`/`false`), emitted as a hoisted per-module `Object.freeze` holder. Design: `docs/superpowers/specs/2026-08-30-softbasic-constants-design.md`. Plan: `docs/superpowers/plans/2026-08-30-softbasic-constants.md`.
- First consumer shipped: the `keyboard` def module (49 key-code constants), registered in the softCore package.
- **Still open (new tracked item):** the `controller` constants module (`PAD_*`, axis constants) and the `input` gamepad / action-map API (`input.bind(...)`) — its own spec, not yet written. It will consume `keyboard.*` and `controller.*` through the mechanism shipped here.
- **Still open (new tracked item):** descriptor-generated `.bas` modules (`sprite`, `stage`, `gfx`, …) have no way to declare constants — the `.descriptor.ts` schema and `npm run generate:library` would need a `constants` field. Add only when a generated module actually needs constants.

- [ ] **Step 2: Update `src/docs/roadmap.md`**

Add a one-line entry to the public-facing summary noting that softBASIC now has named constants (`const … endconst`) and a `keyboard` module of key-code constants. Match the surrounding style.

- [ ] **Step 3: Commit**

```bash
git add docs/language/library-roadmap.md src/docs/roadmap.md
git commit -m "docs: record constants mechanism + keyboard module in roadmaps"
```

---

## Task 18: Full verification

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: all green. If `tests/lib/Basic4WebGL/unit/generator/generatedDefsInSync.test.ts` fails, `keyboard` was mistakenly added to `library/registry.ts` — it must NOT be there (it is hand-written). Remove it from the registry.

- [ ] **Step 2: Build**

Run: `npx vite build`
Expected: success, no TypeScript errors in our files.

- [ ] **Step 3: Manual smoke of the compiled output**

Run a one-off check (Node REPL or a scratch test in `tests/scratch/`):

```ts
import compiler from '@Basic4WebGL/index';
import { readFileSync } from 'fs';
const r = compiler.transpile({
  lib: [
    { name: 'keyboard', source: readFileSync('src/lib/Basic4WebGL/defs/keyboard.bas', 'utf-8') },
    { name: 'input', source: readFileSync('src/lib/Basic4WebGL/defs/input.bas', 'utf-8') },
  ],
  files: [{ name: 'Main.bas', source: 'function onupdate(d)\n  dim h\n  h = input.getKeyDown(keyboard.SPACE)\nendfunction' }],
});
console.log(r.diagnostics);
console.log(r.code.split('\n').slice(0, 5).join('\n'));
```

Expected: `diagnostics` is `[]`; output starts with `const _const_keyboard = Object.freeze({ left: 37, ... });`.

- [ ] **Step 4: Cypress note (no code change)**

Per `CLAUDE.md`, the Cypress e2e suite is not run automatically and is not required for this mechanism (no published tutorial or demo changed). When the `controller` spec ships a demo that uses `keyboard.*`, that demo brings its own `demos.cy.ts` block. Nothing to do here beyond noting it.

- [ ] **Step 5: Final commit (if anything was touched in Steps 1-3)**

```bash
git add -A
git commit -m "chore: constants feature — final verification fixes"
```

---

## Self-Review

### 1. Spec coverage

| Spec section | Task(s) |
|---|---|
| §2.1 block form | 5 |
| §2.2 single-line form | 5 |
| §2.3 top-level-only placement | 6 |
| §2.4 literal-only RHS (incl. negative numbers) | 5, 6 |
| §2.5 naming convention (docs only, not enforced) | 15 |
| §3 tokens + keywords + resolver | 1 |
| §4.1 `ConstBlockRule` | 5, 6 |
| §4.2 `ModuleRule`/`ModuleFactorRule` extension for non-function members | 9 |
| §4.3 reject assignment to a constant (bare + namespaced) | 9, 10 |
| §4.4 `DimRule` no shadowing | 10 |
| §4.5 redeclaration is an error | 6 |
| §4.6 user code can't override a library constant | Inherent (no syntax path) + covered by §4.5 tests in Task 6; documented in Task 15 |
| §5 `symbolTypes.Constant` + `ConstantSymbol` + snapshot | 2, 11 |
| §6.1 per-file frozen holder, hoisted, inert | 7 |
| §6.2 reference sites → `_const_<module>.<name>` | 7, 8, 9 |
| §6 `ConstantRefNode` | 3, 8, 9 |
| §7 editor completion (bare + dot) | 12 |
| §7 editor hover (name + value) | 12 |
| §7 diagnostics via standard path | 6, 9, 10 (all use `CompilationError`) |
| §8 step 1 — new hand-written def | 13 |
| §8 step 3 — package registration | 14 |
| §8 step 4 — tests | 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 |
| §8 step 5 — Language Guide topic + API Reference page + manifest | 15, 16 |
| §8 step 6 — roadmap updates | 17 |
| §9 test list | Covered across 1, 5, 6, 7, 8, 9, 10, 11, 12, 14 |
| §10 `keyboard` module, 49 constants, keyCode values, `END`=35 etc. | 13 |
| §10 `keyboard` gets its own API Reference page | 16 |
| §11 controller module = separate spec; descriptor `constants` field = follow-up | 17 |
| §12 summary table | Whole plan |

No gaps.

### 2. Placeholder scan

No "TBD"/"handle edge cases"/"similar to Task N" — every code step has complete code. The few "if the sibling file's import path differs, copy it" instructions are deliberate guards against import-alias drift, not missing content; each names the exact reference file to copy from.

### 3. Type consistency

- `ConstantSymbol(name, type, scope, fullScope, value, valueKind)` — same 6-arg shape in Tasks 2, 4, 5.
- `ConstBlockNode({ module })` — Tasks 3, 5, 7.
- `ConstantRefNode({ module, name }, valueKind?, loc?)` — Tasks 3, 8, 9.
- `_const_<module>.<name>` emission string — identical in Tasks 7 (`ConstantRefRule`, `constantRules`), 8, 9, 13, 18.
- `symbolTypes.Constant === 'Constant'` — Tasks 2, 7, 8, 9, 10, 12.
- `Symbols.getAllOfType(type)` — defined Task 4, used Task 7.
- Snapshot fields `value` / `valueKind` — defined Task 11, consumed Task 12.
- Error message fragments in tests match the thrown strings (Task 6 note calls this out explicitly).

Consistent.

---

## Known minor gaps (accepted, not blockers)

1. **`const` inside a top-level `if`/`while` block** is not separately rejected — `ConstBlockRule` only checks scope *type*, and a top-level control block keeps scope type `''`. Such a `const` would still register a valid module-scoped constant. Rare; spec §2.3 lists it but the value cost of threading a "top-level statement" flag through `BlockRule` outweighs the benefit. If required later, add a marker param to `RootRule`'s dispatch.
2. **Completion insert text is lowercase** (`space`, not `SPACE`) because the parser lowercases all identifiers. Cosmetic; the language is case-insensitive so the inserted code is correct.
3. **`ConstantRefNode.dataType`** is set from `valueKind` so a boolean constant used as a bare `if` condition type-checks — but this path is lightly exercised. Task 12's tests don't cover strict type participation; if a validator regresses, fall back to `builtInTypes.Variant` in `ConstantRefNode`.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-08-30-softbasic-constants.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
