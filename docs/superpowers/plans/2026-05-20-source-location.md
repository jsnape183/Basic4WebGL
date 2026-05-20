# Source Location & Diagnostic Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add source location to every AST node and compiler error, expose a structured `CompileResult` from `compiler.transpile()`, and lay internal groundwork for V3 source maps — without ever changing `IGeneratable.generate()`.

**Architecture:** `SourceLocation` flows from `Token.loc()` → node constructor → error throw site → `parseFile` enrichment → `CompileResult.diagnostics`. The transpiler separately accumulates offset mappings for the future Tier C source map; that array is computed but not yet exposed. The React layer switches from `try/catch` on a string result to reading `CompileResult.diagnostics`.

**Tech Stack:** TypeScript, Vitest, React/Redux. All paths relative to repo root `src/lib/` or `tests/lib/`.

---

## File Structure

### New files
| Path | Responsibility |
|------|---------------|
| `tests/lib/CompilerLib/unit/types/sourceLocation.test.ts` | Shape tests for `SourceLocation`, `Diagnostic`, `CompileResult` |
| `tests/lib/CompilerLib/unit/lexer/token.test.ts` | `Token.loc()` returns correct shape |
| `tests/lib/CompilerLib/unit/tree/tree.test.ts` | `Tree.loc` populated by property assignment and `node()` factory |
| `tests/lib/CompilerLib/unit/errors/errors.test.ts` | All error classes store `loc` when provided |
| `tests/lib/Basic4WebGL/unit/nodes/nodeLoc.test.ts` | Node subclasses store `loc` in constructor |
| `tests/lib/Basic4WebGL/integration/transpiler/compileResult.test.ts` | `compiler.transpile()` returns `CompileResult`; diagnostic carries `loc` on failure |

### Modified files
| Path | Change |
|------|--------|
| `src/lib/CompilerLib/compiler/types.ts` | Add `SourceLocation`, `Diagnostic`, `CompileResult` |
| `src/lib/CompilerLib/lexer/tokens/Token.ts` | Add `loc(): SourceLocation` method |
| `src/lib/CompilerLib/tree/index.ts` | Add `loc?: SourceLocation` field; extend `node()` factory |
| `src/lib/CompilerLib/errors.ts` | Add `loc?: SourceLocation` to all error classes |
| `src/lib/Basic4WebGL/nodes/*.ts` (46 files) | Add `loc?: SourceLocation` parameter to each constructor |
| `src/lib/Basic4WebGL/validators/BaseArithmaticValidatorNode.ts` | Pass `this.loc` when throwing `SemanticTypeError` |
| `src/lib/Basic4WebGL/validators/BaseConditionalValidatorNode.ts` | Pass `this.loc` when throwing `SemanticTypeError` |
| `src/lib/Basic4WebGL/nodes/PrintNode.ts` | Pass `this.loc` when throwing `SemanticTypeError` |
| `src/lib/Basic4WebGL/parserRules/rules/**/*.ts` (~34 files) | Capture `loc` before each leading `matchAndMove`; pass to node constructor |
| `src/lib/CompilerLib/parser/index.ts` | Enrich caught errors with `stream.current()` loc when `loc` not already set |
| `src/lib/Basic4WebGL/index.ts` | Change `transpile()` to return `CompileResult` |
| `src/lib/CompilerLib/transpiler/index.ts` | Accumulate internal `mappings` array (Tier C runway) |
| `src/pages/EditPage.tsx` | Consume `CompileResult` instead of catching string |
| `tests/lib/Basic4WebGL/integration/transpiler/*.test.ts` (4 files) | `compiler.transpile(project)` → `compiler.transpile(project).code!` |

---

## Task 1: Core types

**Files:**
- Modify: `src/lib/CompilerLib/compiler/types.ts`
- Create: `tests/lib/CompilerLib/unit/types/sourceLocation.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/lib/CompilerLib/unit/types/sourceLocation.test.ts
import { describe, test, expect } from 'vitest';
import type { SourceLocation, Diagnostic, CompileResult } from '@CompilerLib/compiler/types';

describe('SourceLocation', () => {
  test('has line, col, and filename fields', () => {
    const loc: SourceLocation = { line: 3, col: 7, filename: 'Main.bas' };
    expect(loc.line).toBe(3);
    expect(loc.col).toBe(7);
    expect(loc.filename).toBe('Main.bas');
  });
});

describe('Diagnostic', () => {
  test('requires message and severity', () => {
    const d: Diagnostic = { message: 'oops', severity: 'error' };
    expect(d.message).toBe('oops');
    expect(d.severity).toBe('error');
    expect(d.loc).toBeUndefined();
  });

  test('accepts optional loc', () => {
    const d: Diagnostic = {
      message: 'bad',
      severity: 'warning',
      loc: { line: 1, col: 0, filename: 'f.bas' },
    };
    expect(d.loc?.line).toBe(1);
  });
});

describe('CompileResult', () => {
  test('success shape has code and empty diagnostics', () => {
    const r: CompileResult = { code: 'let x = 1;', diagnostics: [] };
    expect(r.code).toBe('let x = 1;');
    expect(r.diagnostics).toHaveLength(0);
    expect(r.sourceMap).toBeUndefined();
  });

  test('failure shape has diagnostics and no code', () => {
    const r: CompileResult = {
      diagnostics: [{ message: 'err', severity: 'error' }],
    };
    expect(r.code).toBeUndefined();
    expect(r.diagnostics[0].severity).toBe('error');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run tests/lib/CompilerLib/unit/types/sourceLocation.test.ts
```

Expected: FAIL — TypeScript import errors because types don't exist yet.

- [ ] **Step 3: Add types to `compiler/types.ts`**

Replace the entire file with:

```typescript
import Token from '../lexer/tokens/Token';
import { TokenMatch } from '../lexer/tokens/Token';

export type ProjectFile = {
  name: string;
  source: string;
};

export type CompilerProject = {
  lib: Array<ProjectFile>;
  files: Array<ProjectFile>;
};

export type SourceLocation = {
  line: number;
  col: number;
  filename: string;
};

export type Diagnostic = {
  message: string;
  severity: 'error' | 'warning';
  loc?: SourceLocation;
};

export type CompileResult = {
  code?: string;
  diagnostics: Diagnostic[];
  sourceMap?: string;
};
```

- [ ] **Step 4: Run tests to confirm they pass**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run tests/lib/CompilerLib/unit/types/sourceLocation.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Run full suite to confirm no regressions**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run
```

Expected: All existing tests pass.

- [ ] **Step 6: Commit**

```
git add src/lib/CompilerLib/compiler/types.ts tests/lib/CompilerLib/unit/types/sourceLocation.test.ts
git commit -m "feat: add SourceLocation, Diagnostic, CompileResult types"
```

---

## Task 2: Token.loc() method

**Files:**
- Modify: `src/lib/CompilerLib/lexer/tokens/Token.ts`
- Create: `tests/lib/CompilerLib/unit/lexer/token.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/lib/CompilerLib/unit/lexer/token.test.ts
import { describe, test, expect } from 'vitest';
import Token, { TokenMatch } from '@CompilerLib/lexer/tokens/Token';

describe('Token.loc()', () => {
  test('returns SourceLocation with matching line, col, and filename', () => {
    const match = new TokenMatch(1, 'Number');
    const token = new Token(match, '42', 5, 12, 'Main.bas');
    const loc = token.loc();
    expect(loc.line).toBe(5);
    expect(loc.col).toBe(12);
    expect(loc.filename).toBe('Main.bas');
  });

  test('returns a plain object (not the token itself)', () => {
    const match = new TokenMatch(1, 'Number');
    const token = new Token(match, '1', 1, 0, 'A.bas');
    const loc = token.loc();
    expect(loc).not.toBe(token);
    expect(Object.keys(loc)).toEqual(['line', 'col', 'filename']);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run tests/lib/CompilerLib/unit/lexer/token.test.ts
```

Expected: FAIL — `token.loc is not a function`.

- [ ] **Step 3: Add `loc()` method to `Token`**

```typescript
// src/lib/CompilerLib/lexer/tokens/Token.ts
import { SourceLocation } from '../compiler/types';  // NEW import at top

// ... existing class body, then add method inside Token class:
  loc(): SourceLocation {
    return { line: this.line, col: this.col, filename: this.filename };
  }
```

Full file after edit:

```typescript
import { SourceLocation } from '../../compiler/types';

export class TokenMatch {
  public value: Number;
  public name: string;
  public stripped: Boolean;

  constructor(value: Number, name: string, stripped: Boolean = false) {
    this.value = value;
    this.name = name;
    this.stripped = stripped;
  }
}

class Token {
  public token: TokenMatch;
  public text: string;
  public line: number;
  public col: number;
  public filename: string;

  constructor(
    token: TokenMatch,
    text: string,
    line: number,
    col: number,
    filename: string
  ) {
    this.token = token;
    this.text = text;
    this.line = line;
    this.col = col;
    this.filename = filename;
  }

  loc(): SourceLocation {
    return { line: this.line, col: this.col, filename: this.filename };
  }
}

export default Token;
```

- [ ] **Step 4: Run tests to confirm they pass**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run tests/lib/CompilerLib/unit/lexer/token.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 5: Run full suite**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run
```

Expected: All pass.

- [ ] **Step 6: Commit**

```
git add src/lib/CompilerLib/lexer/tokens/Token.ts tests/lib/CompilerLib/unit/lexer/token.test.ts
git commit -m "feat: add Token.loc() convenience accessor"
```

---

## Task 3: Tree.loc field + node() factory

**Files:**
- Modify: `src/lib/CompilerLib/tree/index.ts`
- Create: `tests/lib/CompilerLib/unit/tree/tree.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/lib/CompilerLib/unit/tree/tree.test.ts
import { describe, test, expect } from 'vitest';
import { Tree, node } from '@CompilerLib/tree';
import type { SourceLocation } from '@CompilerLib/compiler/types';

const loc: SourceLocation = { line: 2, col: 5, filename: 'test.bas' };

describe('Tree.loc', () => {
  test('is undefined by default', () => {
    const t = new Tree(1, null, []);
    expect(t.loc).toBeUndefined();
  });

  test('can be assigned directly', () => {
    const t = new Tree(1, null, []);
    t.loc = loc;
    expect(t.loc).toEqual(loc);
  });
});

describe('node() factory', () => {
  test('sets loc when provided as fourth argument', () => {
    const t = node(1, 'data', [], loc);
    expect(t.loc).toEqual(loc);
  });

  test('loc is undefined when not provided', () => {
    const t = node(1, 'data', []);
    expect(t.loc).toBeUndefined();
  });

  test('loc does not affect type, data, or children', () => {
    const t = node(7, 'hello', [], loc);
    expect(t.type).toBe(7);
    expect(t.data).toBe('hello');
    expect(t.children).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run tests/lib/CompilerLib/unit/tree/tree.test.ts
```

Expected: FAIL — `Tree` has no `loc` field; `node()` doesn't accept a 4th argument.

- [ ] **Step 3: Update `tree/index.ts`**

```typescript
// src/lib/CompilerLib/tree/index.ts
import BuiltInType from '../builtInTypes';
import { SourceLocation } from '../compiler/types';

export class Tree {
  public type: number;
  public data: string | Symbol | any;
  public children: Array<Tree>;
  public dataType: BuiltInType;
  public loc?: SourceLocation;

  constructor(
    type: number,
    data: string | Symbol | any | undefined,
    children: Array<Tree> | Tree = new Array<Tree>(),
    dataType: BuiltInType = new BuiltInType('Unknown')
  ) {
    this.type = type;
    this.data = data;
    this.children = Array.isArray(children) ? children : [children];
    this.dataType = dataType;
  }
}

export const node = (
  type: number,
  data: any = null,
  children: Array<Tree> | Tree = new Array<Tree>(),
  loc?: SourceLocation
) => {
  const t = new Tree(
    type,
    data,
    Array.isArray(children) ? children : new Array<Tree>(children)
  );
  t.loc = loc;
  return t;
};

export default node;
```

- [ ] **Step 4: Run tests to confirm they pass**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run tests/lib/CompilerLib/unit/tree/tree.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 5: Run full suite**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run
```

Expected: All pass.

- [ ] **Step 6: Commit**

```
git add src/lib/CompilerLib/tree/index.ts tests/lib/CompilerLib/unit/tree/tree.test.ts
git commit -m "feat: add loc field to Tree and optional fourth arg to node() factory"
```

---

## Task 4: Error classes get loc

**Files:**
- Modify: `src/lib/CompilerLib/errors.ts`
- Create: `tests/lib/CompilerLib/unit/errors/errors.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/lib/CompilerLib/unit/errors/errors.test.ts
import { describe, test, expect } from 'vitest';
import {
  CompilationError,
  SymbolError,
  SemanticError,
  SemanticTypeError,
} from '@CompilerLib/errors';
import BuiltInType from '@CompilerLib/builtInTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

const loc: SourceLocation = { line: 4, col: 2, filename: 'Foo.bas' };

describe('CompilationError', () => {
  test('stores loc when provided', () => {
    const e = new CompilationError('bad token', loc);
    expect(e.loc).toEqual(loc);
  });
  test('loc is undefined when not provided', () => {
    const e = new CompilationError('bad token');
    expect(e.loc).toBeUndefined();
  });
});

describe('SymbolError', () => {
  test('stores loc when provided', () => {
    const e = new SymbolError('undeclared', loc);
    expect(e.loc).toEqual(loc);
  });
  test('loc is undefined when not provided', () => {
    expect(new SymbolError('x').loc).toBeUndefined();
  });
});

describe('SemanticError', () => {
  test('stores loc when provided', () => {
    const e = new SemanticError('type mismatch', loc);
    expect(e.loc).toEqual(loc);
  });
  test('loc is undefined when not provided', () => {
    expect(new SemanticError('x').loc).toBeUndefined();
  });
});

describe('SemanticTypeError', () => {
  test('stores loc when provided', () => {
    const e = new SemanticTypeError(['Integer'], new BuiltInType('String'), loc);
    expect(e.loc).toEqual(loc);
  });
  test('loc is undefined when not provided', () => {
    const e = new SemanticTypeError(['Integer'], new BuiltInType('String'));
    expect(e.loc).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run tests/lib/CompilerLib/unit/errors/errors.test.ts
```

Expected: FAIL — error constructors don't accept `loc`.

- [ ] **Step 3: Update `errors.ts`**

```typescript
// src/lib/CompilerLib/errors.ts
import BuiltInType from './builtInTypes';
import { SourceLocation } from './compiler/types';

export class CompilationError extends Error {
  public loc?: SourceLocation;
  constructor(message: string, loc?: SourceLocation) {
    super(message);
    this.name = 'CompilatonError';
    this.loc = loc;
  }
}

export class SymbolError extends Error {
  public loc?: SourceLocation;
  constructor(message: string, loc?: SourceLocation) {
    super(message);
    this.name = 'SymbolError';
    this.loc = loc;
  }
}

export class UnexpectedError extends Error {
  public innerError: Error;
  constructor(error: Error) {
    super(`An unexpected error occured with the message ${error.name} "${error.message}"
      Stack Trace ${error?.stack}}`);
    this.name = 'UnexpectedError';
    this.innerError = error;
  }
}

export class SemanticTypeError extends Error {
  public loc?: SourceLocation;
  constructor(expectedTypes: string[], actualType: BuiltInType, loc?: SourceLocation) {
    super(
      `Semantic Error: Expected type(s) ${expectedTypes
        .map((t) => t)
        .join(', ')} but got ${actualType.name}`
    );
    this.name = 'SemanticTypeError';
    this.loc = loc;
  }
}

export class SemanticError extends Error {
  public loc?: SourceLocation;
  constructor(message: string, loc?: SourceLocation) {
    super(message);
    this.name = 'SemanticError';
    this.loc = loc;
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run tests/lib/CompilerLib/unit/errors/errors.test.ts
```

Expected: PASS (8 tests).

- [ ] **Step 5: Run full suite**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run
```

Expected: All pass.

- [ ] **Step 6: Commit**

```
git add src/lib/CompilerLib/errors.ts tests/lib/CompilerLib/unit/errors/errors.test.ts
git commit -m "feat: add optional loc field to all compiler error classes"
```

---

## Task 5: Node subclasses get loc parameter

Each of the 46 node classes in `src/lib/Basic4WebGL/nodes/` gains an optional `loc?: SourceLocation` last constructor parameter which assigns `this.loc = loc`. The tests cover the three structural patterns: direct `Tree` subclass, `BaseArithmaticValidatorNode` subclass, `BaseConditionalValidatorNode` subclass.

**Files:**
- Create: `tests/lib/Basic4WebGL/unit/nodes/nodeLoc.test.ts`
- Modify: all 46 files in `src/lib/Basic4WebGL/nodes/`

- [ ] **Step 1: Write failing tests covering all three node patterns**

```typescript
// tests/lib/Basic4WebGL/unit/nodes/nodeLoc.test.ts
import { describe, test, expect } from 'vitest';
import type { SourceLocation } from '@CompilerLib/compiler/types';
import BuiltInType from '@CompilerLib/builtInTypes';
import { Tree } from '@CompilerLib/tree';
import PrintNode from '@Basic4WebGL/nodes/PrintNode';
import AddNode from '@Basic4WebGL/nodes/AddNode';
import IfNode from '@Basic4WebGL/nodes/IfNode';
import NumberNode from '@Basic4WebGL/nodes/NumberNode';
import StringNode from '@Basic4WebGL/nodes/StringNode';
import EmptyNode from '@Basic4WebGL/nodes/EmptyNode';

const loc: SourceLocation = { line: 10, col: 3, filename: 'test.bas' };

// Helper: a minimal Tree child
const makeChild = () => {
  const t = new Tree(0, null, []);
  t.dataType = new BuiltInType('Variant');
  return t;
};

describe('Direct Tree subclasses store loc', () => {
  test('PrintNode stores loc', () => {
    const n = new PrintNode(null, makeChild(), loc);
    expect(n.loc).toEqual(loc);
  });

  test('PrintNode loc is undefined when omitted', () => {
    const n = new PrintNode(null, makeChild());
    expect(n.loc).toBeUndefined();
  });

  test('EmptyNode stores loc', () => {
    const n = new EmptyNode(loc);
    expect(n.loc).toEqual(loc);
  });

  test('StringNode stores loc', () => {
    const n = new StringNode('hello', loc);
    expect(n.loc).toEqual(loc);
  });

  test('NumberNode stores loc', () => {
    const n = new NumberNode('42', loc);
    expect(n.loc).toEqual(loc);
  });
});

describe('BaseArithmaticValidatorNode subclasses store loc', () => {
  test('AddNode stores loc', () => {
    const child = makeChild();
    const n = new AddNode(null, [child, child], loc);
    expect(n.loc).toEqual(loc);
  });

  test('AddNode loc is undefined when omitted', () => {
    const child = makeChild();
    const n = new AddNode(null, [child, child]);
    expect(n.loc).toBeUndefined();
  });
});

describe('BaseConditionalValidatorNode subclasses store loc', () => {
  test('IfNode stores loc', () => {
    const child = makeChild();
    const n = new IfNode(null, [child, child], loc);
    expect(n.loc).toEqual(loc);
  });

  test('IfNode loc is undefined when omitted', () => {
    const child = makeChild();
    const n = new IfNode(null, [child, child]);
    expect(n.loc).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run tests/lib/Basic4WebGL/unit/nodes/nodeLoc.test.ts
```

Expected: FAIL — node constructors don't accept a `loc` argument.

- [ ] **Step 3: Update all 46 node files**

**Pattern for direct `Tree` subclasses** (PrintNode, EmptyNode, BlockNode, RootNode, etc.):

```typescript
// BEFORE (PrintNode example)
class PrintNode extends Tree implements IValidatable {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.Print, data, children);
  }
}

// AFTER
import type { SourceLocation } from '@CompilerLib/compiler/types';

class PrintNode extends Tree implements IValidatable {
  constructor(data: any | undefined, children: Tree, loc?: SourceLocation) {
    super(nodeTypes.Print, data, children);
    this.loc = loc;
  }
}
```

**Pattern for `BaseArithmaticValidatorNode` subclasses** (AddNode, SubtractNode, MultiplyNode, DivideNode, UMinusNode):

```typescript
// BEFORE (AddNode)
class AddNode extends BaseArithmaticValidatorNode {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.Add, data, children);
    this.dataType = children[0].dataType;
  }
}

// AFTER
import type { SourceLocation } from '@CompilerLib/compiler/types';

class AddNode extends BaseArithmaticValidatorNode {
  constructor(data: any | undefined, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.Add, data, children);
    this.dataType = children[0].dataType;
    this.loc = loc;
  }
}
```

**Pattern for `BaseConditionalValidatorNode` subclasses** (IfNode, WhileNode):

```typescript
// BEFORE (IfNode)
class IfNode extends BaseConditionalValidatorNode {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.If, data, children);
  }
}

// AFTER
import type { SourceLocation } from '@CompilerLib/compiler/types';

class IfNode extends BaseConditionalValidatorNode {
  constructor(data: any | undefined, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.If, data, children);
    this.loc = loc;
  }
}
```

Apply these patterns to ALL 46 files:

```
AddNode, AndNode, ArrayAssignNode, ArrayListNode, ArrayLookupNode,
AssignNode, BlockNode, BoolEqualNode, BoolGreaterThanEqualToNode,
BoolGreaterThanNode, BoolLessThanEqualToNode, BoolLessThanNode,
BoolNode, BoolNotEqualNode, CallNode, CallTermNode, CloneNode,
DimNode, DivideNode, EmptyNode, ExpressionListNode, ExpressionNode,
ForNode, FunctionCallNode, FunctionDeclNode, FunctionReturnNode,
FunctionTermNode, IfNode, InNode, ModuleTerm, MultiplyNode, NotNode,
NumberNode, OrNode, ParenNode, PrintNode, RelationNode, RootNode,
StringNode, SubtractNode, TermNode, ToNode, UMinusNode,
VariableDimNode, VariableListNode, VariableNode, WhileNode
```

Each node needs:
1. `import type { SourceLocation } from '@CompilerLib/compiler/types';` (if not already imported via `@CompilerLib/tree`)
2. `loc?: SourceLocation` as last constructor parameter
3. `this.loc = loc;` in the constructor body

> **Note:** `SourceLocation` is already available on `Tree` (added in Task 3), so `this.loc = loc` compiles without further changes to the base class.

- [ ] **Step 4: Run tests to confirm they pass**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run tests/lib/Basic4WebGL/unit/nodes/nodeLoc.test.ts
```

Expected: PASS (9 tests).

- [ ] **Step 5: Run full suite**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run
```

Expected: All pass.

- [ ] **Step 6: Commit**

```
git add src/lib/Basic4WebGL/nodes/ tests/lib/Basic4WebGL/unit/nodes/nodeLoc.test.ts
git commit -m "feat: add optional loc parameter to all node subclass constructors"
```

---

## Task 6: Validator base classes use this.loc when throwing

**Files:**
- Modify: `src/lib/Basic4WebGL/validators/BaseArithmaticValidatorNode.ts`
- Modify: `src/lib/Basic4WebGL/validators/BaseConditionalValidatorNode.ts`
- Modify: `src/lib/Basic4WebGL/nodes/PrintNode.ts`

No new test file needed — the existing `nodeLoc.test.ts` from Task 5 plus integration tests in Task 9 cover this. However, we write a focused unit test inline here to drive the change.

- [ ] **Step 1: Add targeted tests to `nodeLoc.test.ts`**

Append to `tests/lib/Basic4WebGL/unit/nodes/nodeLoc.test.ts`:

```typescript
import BuiltInType from '@CompilerLib/builtInTypes';
import { SemanticTypeError } from '@CompilerLib/errors';

describe('Validator nodes attach loc to thrown SemanticTypeError', () => {
  test('AddNode.validate() throws SemanticTypeError with this.loc', () => {
    const wrongChild = new Tree(0, null, []);
    wrongChild.dataType = new BuiltInType('String'); // won't match Integer

    const intType = new BuiltInType('Integer');
    intType.acceptsTypes = ['Integer'];
    intType.canAccept = (t: BuiltInType) => t.name === 'Integer';

    const n = new AddNode(null, [wrongChild, wrongChild], loc);
    n.dataType = intType as any;

    let caught: SemanticTypeError | undefined;
    try { n.validate(); } catch (e) { caught = e as SemanticTypeError; }
    expect(caught).toBeInstanceOf(SemanticTypeError);
    expect(caught?.loc).toEqual(loc);
  });

  test('AddNode.validate() SemanticTypeError has no loc when node has no loc', () => {
    const wrongChild = new Tree(0, null, []);
    wrongChild.dataType = new BuiltInType('String');

    const intType = new BuiltInType('Integer');
    intType.acceptsTypes = ['Integer'];
    intType.canAccept = (t: BuiltInType) => t.name === 'Integer';

    const n = new AddNode(null, [wrongChild, wrongChild]); // no loc
    n.dataType = intType as any;

    let caught: SemanticTypeError | undefined;
    try { n.validate(); } catch (e) { caught = e as SemanticTypeError; }
    expect(caught?.loc).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to confirm the new ones fail**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run tests/lib/Basic4WebGL/unit/nodes/nodeLoc.test.ts
```

Expected: FAIL on the two new validator tests.

- [ ] **Step 3: Update `BaseArithmaticValidatorNode.ts`**

```typescript
// src/lib/Basic4WebGL/validators/BaseArithmaticValidatorNode.ts
import { SemanticTypeError } from '@CompilerLib/errors';
import { Tree } from '@CompilerLib/tree';
import IValidatable from '@CompilerLib/tree/IValidatable';

class BaseArithmaticValidatorNode extends Tree implements IValidatable {
  validate(): void {
    if (!this.dataType?.canAccept(this.children[0].dataType)) {
      throw new SemanticTypeError(
        this.dataType.acceptsTypes,
        this.children[0].dataType,
        this.loc
      );
    }

    if (!this.dataType?.canAccept(this.children[1].dataType)) {
      throw new SemanticTypeError(
        this.dataType.acceptsTypes,
        this.children[1].dataType,
        this.loc
      );
    }
  }
}

export default BaseArithmaticValidatorNode;
```

- [ ] **Step 4: Update `BaseConditionalValidatorNode.ts`**

```typescript
// src/lib/Basic4WebGL/validators/BaseConditionalValidatorNode.ts
import { SemanticTypeError } from '@CompilerLib/errors';
import { Tree } from '@CompilerLib/tree';
import IValidatable from '@CompilerLib/tree/IValidatable';
import builtInTypes from '../builtInTypes';
import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';

class BaseConditionalValidatorNode extends Tree implements IValidatable {
  validate(): void {
    if (
      !getBuiltInType(builtInTypes.Boolean).canAccept(this.children[0].dataType)
    ) {
      throw new SemanticTypeError(
        getBuiltInType(builtInTypes.Boolean).acceptsTypes,
        this.children[0].dataType,
        this.loc
      );
    }
  }
}

export default BaseConditionalValidatorNode;
```

- [ ] **Step 5: Update `PrintNode.ts`**

```typescript
// src/lib/Basic4WebGL/nodes/PrintNode.ts
import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { SemanticTypeError } from '@CompilerLib/errors';
import { Tree } from '@CompilerLib/tree';
import IValidatable from '@CompilerLib/tree/IValidatable';
import type { SourceLocation } from '@CompilerLib/compiler/types';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';

class PrintNode extends Tree implements IValidatable {
  constructor(data: any | undefined, children: Tree, loc?: SourceLocation) {
    super(nodeTypes.Print, data, children);
    this.loc = loc;
  }
  validate(): void {
    if (
      getBuiltInType(builtInTypes.Variant).canAccept(
        this.children[0].dataType
      ) === false
    ) {
      throw new SemanticTypeError(
        [builtInTypes.String],
        this.children[0].dataType,
        this.loc
      );
    }
  }
}

export default PrintNode;
```

- [ ] **Step 6: Run tests to confirm they pass**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run tests/lib/Basic4WebGL/unit/nodes/nodeLoc.test.ts
```

Expected: PASS (all 11 tests).

- [ ] **Step 7: Run full suite**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run
```

Expected: All pass.

- [ ] **Step 8: Commit**

```
git add src/lib/Basic4WebGL/validators/ src/lib/Basic4WebGL/nodes/PrintNode.ts tests/lib/Basic4WebGL/unit/nodes/nodeLoc.test.ts
git commit -m "feat: validator nodes pass this.loc to SemanticTypeError"
```

---

## Task 7: Parser rules capture and pass loc

Every parser rule that creates a node captures `const loc = tokenStream.current().loc()` **before** its first `matchAndMove` and passes `loc` as the last argument to the node constructor.

**Files:**
- Modify: all ~34 rule files in `src/lib/Basic4WebGL/parserRules/rules/` and subdirectories
- No new test file — the integration test in Task 9 verifies this end-to-end

- [ ] **Step 1: Update all parser rules**

**Pattern A — rule starts with matchAndMove on a keyword:**

```typescript
// BEFORE (PrintRule)
parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
  matchAndMove(tokens.Print, tokenStream);
  const printNode = new PrintNode(
    null,
    getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined)
  );
  matchAndMove(newLines, tokenStream);
  return printNode;
}

// AFTER
parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
  const loc = tokenStream.current().loc();
  matchAndMove(tokens.Print, tokenStream);
  const printNode = new PrintNode(
    null,
    getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined),
    loc
  );
  matchAndMove(newLines, tokenStream);
  return printNode;
}
```

**Pattern B — rule receives a pre-parsed `data` arg (Add, Subtract, Multiply, Divide):**

```typescript
// BEFORE (AddRule)
parse(tokenStream: TokenStream, symbolTable: Symbols, data: any): Tree {
  const term = data?.term;
  matchAndMove(tokens.Add, tokenStream);
  const secondary = getParserRule('Term').parse(tokenStream, symbolTable, undefined);
  return new AddNode(null, [term, secondary]);
}

// AFTER
parse(tokenStream: TokenStream, symbolTable: Symbols, data: any): Tree {
  const loc = tokenStream.current().loc();
  const term = data?.term;
  matchAndMove(tokens.Add, tokenStream);
  const secondary = getParserRule('Term').parse(tokenStream, symbolTable, undefined);
  return new AddNode(null, [term, secondary], loc);
}
```

**Pattern C — rule creates multiple node types conditionally (FactorRule, VariableFactorRule):**

Capture `loc` at the very top, pass to each node constructor:

```typescript
// AFTER (FactorRule excerpt)
parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
  const loc = tokenStream.current().loc();
  if (check([tokens.Add, tokens.Subtract], tokenStream.current())) {
    matchAndMove([tokens.Add, tokens.Subtract], tokenStream);
    return new UMinusNode(
      null,
      getParserRule('Factor').parse(tokenStream, symbolTable, undefined),
      loc
    );
  }
  // ... other branches similarly pass loc
}
```

Apply Pattern A/B/C to these files:

```
rules/PrintRule.ts          → PrintNode
rules/IfRule.ts             → IfNode
rules/WhileRule.ts          → WhileNode
rules/ForRule.ts            → ForNode
rules/DimRule.ts            → DimNode
rules/VariableRule.ts       → VariableNode / AssignNode / ArrayAssignNode
rules/FunctionRule.ts       → FunctionDeclNode
rules/FunctionCallRule.ts   → FunctionCallNode
rules/ReturnRule.ts         → FunctionReturnNode
rules/CallRule.ts           → CallNode
rules/BlockRule.ts          → BlockNode
rules/ClassRule.ts          → CloneNode
rules/ForExpressionRule.ts  → ForNode / ToNode
rules/VariableListRule.ts   → VariableListNode / VariableDimNode
rules/NewLineRule.ts        → EmptyNode
rules/SoftNewLineRule.ts    → EmptyNode
rules/Expressions/AddRule.ts          → AddNode
rules/Expressions/SubtractRule.ts     → SubtractNode
rules/Expressions/MultiplyRule.ts     → MultiplyNode
rules/Expressions/DivideRule.ts       → DivideNode
rules/Expressions/AndRule.ts          → AndNode
rules/Expressions/OrRule.ts           → OrNode
rules/Expressions/NotRule.ts          → NotNode
rules/Expressions/RelationRule.ts     → RelationNode
rules/Expressions/BoolExpressionRule.ts → BoolEqualNode / BoolNotEqualNode etc.
rules/Expressions/BoolFactorRule.ts   → (delegates, no direct node)
rules/Expressions/BoolTermRule.ts     → (delegates, no direct node)
rules/Expressions/ExpressionRule.ts   → (delegates, no direct node)
rules/Expressions/FactorRule.ts       → UMinusNode, ParenNode, TermNode, StringNode, NumberNode
rules/Expressions/TermRule.ts         → ExpressionNode
rules/Expressions/VariableFactorRule.ts → TermNode, ArrayLookupNode
rules/Expressions/FunctionFactorRule.ts → FunctionTermNode
rules/Expressions/ModuleFactorRule.ts   → ModuleTerm
rules/Expressions/CallFactorRule.ts     → CallTermNode
rules/Expressions/ExpressionListRule.ts → ExpressionListNode
rules/Expressions/ArrayListRule.ts      → ArrayListNode / InNode
```

- [ ] **Step 2: Run full suite**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run
```

Expected: All pass. (loc data flows through the tree but no test yet asserts on it — that's Task 9.)

- [ ] **Step 3: Commit**

```
git add src/lib/Basic4WebGL/parserRules/
git commit -m "feat: capture source location in all parser rules and attach to nodes"
```

---

## Task 8: parseFile enriches caught errors with stream location

**Files:**
- Modify: `src/lib/CompilerLib/parser/index.ts`

No new test file — the integration test in Task 9 proves this works end-to-end.

- [ ] **Step 1: Update `parseFile` catch block**

Current catch block (lines 28–44 in `CompilerLib/parser/index.ts`):

```typescript
} catch (e: unknown) {
  if (e instanceof UnexpectedError) {
    throw new UnexpectedError(e as Error);
  }
  if (
    e instanceof CompilationError ||
    e instanceof SemanticError ||
    e instanceof SemanticTypeError
  ) {
    throw new CompilationError(
      `Compilation Error - ${(e as Error).message} occurred at ${
        stream.current().line
      }:${stream.current().col} in ${filename}`
    );
  }
  throw e;
}
```

Replace with:

```typescript
} catch (e: unknown) {
  if (e instanceof UnexpectedError) {
    throw e;
  }
  if (
    e instanceof CompilationError ||
    e instanceof SemanticError ||
    e instanceof SemanticTypeError ||
    e instanceof SymbolError
  ) {
    const err = e as CompilationError | SemanticError | SemanticTypeError | SymbolError;
    if (!err.loc) {
      err.loc = stream.current().loc();
    }
    throw err;
  }
  throw e;
}
```

Also add `SymbolError` to the import at the top of the file:

```typescript
import {
  CompilationError,
  SemanticError,
  SemanticTypeError,
  SymbolError,
  UnexpectedError,
} from '../errors';
```

Full updated `parseFile` function:

```typescript
const parseFile = (
  filename: string,
  tokens: Array<Token>,
  symbolTable: Symbols
): ParseFileResult => {
  const stream = new TokenStream(tokens);
  try {
    const parseResult = getParserRule('Root').parse(stream, symbolTable, {
      name: filename,
    }) as Tree;
    validateTree(parseResult);
    return new ParseFileResult(filename, parseResult, symbolTable);
  } catch (e: unknown) {
    if (e instanceof UnexpectedError) {
      throw e;
    }
    if (
      e instanceof CompilationError ||
      e instanceof SemanticError ||
      e instanceof SemanticTypeError ||
      e instanceof SymbolError
    ) {
      const err = e as CompilationError | SemanticError | SemanticTypeError | SymbolError;
      if (!err.loc) {
        err.loc = stream.current().loc();
      }
      throw err;
    }
    throw e;
  }
};
```

- [ ] **Step 2: Run full suite**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run
```

Expected: All pass. (The catch now re-throws enriched errors rather than wrapping them in a new `CompilationError` string — `compiler.transpile()` will surface these in Task 9.)

- [ ] **Step 3: Commit**

```
git add src/lib/CompilerLib/parser/index.ts
git commit -m "feat: enrich compiler errors with source location in parseFile catch block"
```

---

## Task 9: compiler.transpile() returns CompileResult + update integration tests

This is the public API change. Existing integration tests use `compiler.transpile(project)` as a `string` — they must be updated to `.code!` at the same time.

**Files:**
- Modify: `src/lib/Basic4WebGL/index.ts`
- Create: `tests/lib/Basic4WebGL/integration/transpiler/compileResult.test.ts`
- Modify: `tests/lib/Basic4WebGL/integration/transpiler/arithmatic.test.ts`
- Modify: `tests/lib/Basic4WebGL/integration/transpiler/booleans.test.ts`
- Modify: `tests/lib/Basic4WebGL/integration/transpiler/conditionals.test.ts`
- Modify: `tests/lib/Basic4WebGL/integration/transpiler/coreConstructs.test.ts`

- [ ] **Step 1: Write the new integration tests**

```typescript
// tests/lib/Basic4WebGL/integration/transpiler/compileResult.test.ts
import { describe, test, expect, beforeEach } from 'vitest';
import compiler from '@Basic4WebGL/index';
import type { CompilerProject } from '@CompilerLib/compiler/types';

const project: CompilerProject = { lib: [], files: [] };
beforeEach(() => { project.files = []; });

describe('compiler.transpile() returns CompileResult', () => {
  test('successful compile has code and empty diagnostics', () => {
    project.files.push({ name: 'Main.bas', source: 'print 1' });
    const result = compiler.transpile(project);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toBeDefined();
    expect(result.code).toContain('_print(1)');
  });

  test('code is undefined on failure', () => {
    project.files.push({ name: 'Main.bas', source: 'dim' }); // incomplete statement
    const result = compiler.transpile(project);
    expect(result.code).toBeUndefined();
  });

  test('failure produces exactly one error diagnostic', () => {
    project.files.push({ name: 'Main.bas', source: 'dim' });
    const result = compiler.transpile(project);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].severity).toBe('error');
  });

  test('diagnostic carries loc with filename on failure', () => {
    project.files.push({ name: 'Main.bas', source: 'dim' });
    const result = compiler.transpile(project);
    expect(result.diagnostics[0].loc).toBeDefined();
    expect(result.diagnostics[0].loc?.filename).toBe('Main.bas');
  });

  test('diagnostic loc line is greater than zero', () => {
    project.files.push({ name: 'Main.bas', source: 'print 1\ndim' });
    const result = compiler.transpile(project);
    expect(result.diagnostics[0].loc?.line).toBeGreaterThan(0);
  });

  test('sourceMap is undefined (Tier C not yet implemented)', () => {
    project.files.push({ name: 'Main.bas', source: 'print 1' });
    const result = compiler.transpile(project);
    expect(result.sourceMap).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run new tests to confirm they fail**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run tests/lib/Basic4WebGL/integration/transpiler/compileResult.test.ts
```

Expected: FAIL — `compiler.transpile()` currently returns `string`, not `CompileResult`.

- [ ] **Step 3: Update `src/lib/Basic4WebGL/index.ts`**

```typescript
import TokenResolver from './TokenResolver';
import { CompilerProject, CompileResult, Diagnostic } from '@CompilerLib/compiler/types';
import parser from '@CompilerLib/parser';
import lexer from '@CompilerLib/lexer';
import transpilerRules from './transpilerRules';
import Transpiler from '@CompilerLib/transpiler';
import Symbols, { SymbolScope } from '@CompilerLib/symbols';
import './parserRules';
import './builtInTypes';
import { isMatchingType } from './transpilerRules/symbolRules';
import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import builtInTypes from './builtInTypes';

const lexOnly = (project: CompilerProject) => lexer.lex(project, TokenResolver);

const parse = (project: CompilerProject) => {
  const result = parser(
    lexOnly(project),
    new Symbols(getBuiltInType(builtInTypes.Variant), isMatchingType)
  );
  return result;
};

const transpile = (project: CompilerProject): CompileResult => {
  try {
    const transpilerInstance = new Transpiler();
    const parseResult = parse(project);
    const globals = transpilerRules.symbolRules(
      parseResult.symbolTable,
      new SymbolScope('', '')
    );
    const code =
      globals +
      transpilerInstance.transpile(parseResult, parseResult.symbolTable, transpilerRules);
    return { code, diagnostics: [] };
  } catch (e: unknown) {
    const err = e as Error & { loc?: import('@CompilerLib/compiler/types').SourceLocation };
    const diagnostic: Diagnostic = {
      message: err.message,
      severity: 'error',
      loc: err.loc,
    };
    return { diagnostics: [diagnostic] };
  }
};

export default {
  lexOnly,
  parse,
  transpile,
};
```

- [ ] **Step 4: Update the 4 existing integration test files**

In each file, change every occurrence of:
```typescript
compiler.transpile(project)
```
to:
```typescript
compiler.transpile(project).code!
```

Files to update and the replacement pattern:

**arithmatic.test.ts** — change line 23:
```typescript
// BEFORE
expect(cleanWhitespace(compiler.transpile(project))).toContain(expected);
// AFTER
expect(cleanWhitespace(compiler.transpile(project).code!)).toContain(expected);
```

**booleans.test.ts** — same pattern, update all `compiler.transpile(project)` occurrences.

**conditionals.test.ts** — same pattern.

**coreConstructs.test.ts** — all occurrences use `.toMatchSnapshot()`:
```typescript
// BEFORE
expect(cleanWhitespace(compiler.transpile(project))).toMatchSnapshot();
// AFTER
expect(cleanWhitespace(compiler.transpile(project).code!)).toMatchSnapshot();
```

- [ ] **Step 5: Run full suite**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run
```

Expected: All pass, including the 6 new `compileResult` tests and all 155 original tests.

- [ ] **Step 6: Commit**

```
git add src/lib/Basic4WebGL/index.ts \
  tests/lib/Basic4WebGL/integration/transpiler/compileResult.test.ts \
  tests/lib/Basic4WebGL/integration/transpiler/arithmatic.test.ts \
  tests/lib/Basic4WebGL/integration/transpiler/booleans.test.ts \
  tests/lib/Basic4WebGL/integration/transpiler/conditionals.test.ts \
  tests/lib/Basic4WebGL/integration/transpiler/coreConstructs.test.ts
git commit -m "feat: compiler.transpile() returns CompileResult; update integration tests"
```

---

## Task 10: Transpiler offset tracking (Tier C runway)

The transpiler accumulates an internal `mappings` array as it concatenates each `generate()` result. **`IGeneratable.generate()` is never changed.** `CompileResult.sourceMap` stays `undefined`.

**Files:**
- Modify: `src/lib/CompilerLib/transpiler/index.ts`

No new test file — the `compileResult.test.ts` from Task 9 already asserts `sourceMap` is `undefined`.

- [ ] **Step 1: Update `CompilerLib/transpiler/index.ts`**

```typescript
import ParserResults from '../parser/ParserResults';
import Symbols, { SymbolScope } from '../symbols';
import { getTranspilerRule } from './transpilerRuleFactory';
import { TranspilerConfig } from './types';
import { SourceLocation } from '../compiler/types';

type OffsetMapping = {
  src: SourceLocation;
  genStart: number;
  genLength: number;
};

class Transpiler {
  transpile(
    parseResult: ParserResults,
    symbols: Symbols,
    config: TranspilerConfig
  ) {
    let output = ``;
    const mappings: OffsetMapping[] = [];

    output += parseResult.results
      .map((result) => {
        const symbolPart = config.symbolRules(
          symbols,
          new SymbolScope(result.name, '')
        );
        const genStart = output.length + symbolPart.length;
        const generated = getTranspilerRule(result.tree.type).generate(
          result.tree,
          symbols
        );
        if (result.tree.loc) {
          mappings.push({
            src: result.tree.loc,
            genStart,
            genLength: generated.length,
          });
        }
        return `${symbolPart}${generated}`;
      })
      .join('\n');

    output += ';\n' + config.terminationRules(symbols);

    // mappings is available here for Tier C — convert to V3 source map JSON
    // and return via CompileResult.sourceMap when Tier C is implemented.

    return output;
  }
}

export default Transpiler;
```

- [ ] **Step 2: Run full suite**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run
```

Expected: All pass. No behaviour change — `mappings` is computed but unused.

- [ ] **Step 3: Commit**

```
git add src/lib/CompilerLib/transpiler/index.ts
git commit -m "feat: accumulate internal source mappings in transpiler (Tier C runway)"
```

---

## Task 11: React layer consumes CompileResult

**Files:**
- Modify: `src/pages/EditPage.tsx`

- [ ] **Step 1: Update `handleRun` in `EditPage.tsx`**

Replace the current `handleRun` function body:

```typescript
// BEFORE
const handleRun = () => {
  let transpiledCode = '';
  dispatch(clearLogs());
  dispatch(addLog({ type: LogItemType.Notice, text: 'Compiling project...' } as LogItem));
  try {
    transpiledCode = Basic4WebGL.transpile(buildProject);
    dispatch(addLog({ type: LogItemType.Notice, text: 'Project compiled successfully...' } as LogItem));
    dispatch(setTranspiled(transpiledCode));
    setIsRunning(true);
  } catch (e: any) {
    dispatch(addLog({ type: LogItemType.Error, text: e.message } as LogItem));
    dispatch(setTranspiled(''));
    setIsRunning(true);
    console.log(e);
  }
};
```

```typescript
// AFTER
const handleRun = () => {
  dispatch(clearLogs());
  dispatch(addLog({ type: LogItemType.Notice, text: 'Compiling project...' } as LogItem));

  const result = Basic4WebGL.transpile(buildProject);

  if (result.diagnostics.length > 0) {
    result.diagnostics.forEach((d) => {
      const locStr = d.loc
        ? ` (${d.loc.filename}:${d.loc.line}:${d.loc.col})`
        : '';
      dispatch(
        addLog({ type: LogItemType.Error, text: d.message + locStr } as LogItem)
      );
    });
    dispatch(setTranspiled(''));
    setIsRunning(true);
  } else {
    dispatch(
      addLog({ type: LogItemType.Notice, text: 'Project compiled successfully...' } as LogItem)
    );
    dispatch(setTranspiled(result.code!));
    setIsRunning(true);
  }
};
```

- [ ] **Step 2: Run full suite**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx vitest run
```

Expected: All pass.

- [ ] **Step 3: Build the project to confirm TypeScript compiles cleanly**

```
cd C:\Users\jsnap\source\repos\Basic4WebGL && npx tsc --noEmit
```

Expected: Zero errors.

- [ ] **Step 4: Commit**

```
git add src/pages/EditPage.tsx
git commit -m "feat: EditPage consumes CompileResult diagnostics with source location"
```

---

## Self-Review

### Spec coverage

| Spec requirement | Task |
|---|---|
| Every compiler error reports BASIC source line and column | Tasks 6, 7, 8 |
| `Token.loc()` returns `SourceLocation` | Task 2 |
| `Tree.loc?: SourceLocation` | Task 3 |
| Node subclasses gain `loc` parameter | Task 5 |
| Error classes gain `loc` | Task 4 |
| `parseFile` catch enriches errors without loc | Task 8 |
| `transpile(project): CompileResult` | Task 9 |
| `parse()` signature unchanged | ✅ not changed |
| `IGeneratable.generate()` signature unchanged | ✅ not changed |
| Transpiler offset tracking (Tier C runway) | Task 10 |
| React layer uses `CompileResult` | Task 11 |
| All 155 existing tests still pass | Verified in each task's step 5 |

### Placeholder scan

No TBD/TODO items — all steps contain exact code.

### Type consistency

- `SourceLocation` defined in Task 1, imported in Tasks 2–9.
- `Diagnostic` defined in Task 1, used in Task 9.
- `CompileResult` defined in Task 1, returned in Task 9.
- `err.loc` accessed as `SourceLocation | undefined` — matches the `loc?` fields on error classes from Task 4.
- `Tree.loc` assigned in Task 3, read in Tasks 6 and 10 — consistent field name throughout.
