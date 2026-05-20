# Source Location & Diagnostic Pipeline Design

**Date:** 2026-05-20  
**Status:** Approved  
**Scope:** Tier A (accurate error locations) + Tier B (structured diagnostic API) with Tier C (source maps) runway

---

## Problem

The compiler discards source location the moment tokens are parsed into AST nodes. Error messages report the token stream cursor position at catch time, not the position of the problematic node. Semantic errors from post-parse validators have no location at all. The React IDE layer catches raw exceptions and displays `.message` strings — there is no structured error API.

---

## Goals

- Every compiler error reports the correct BASIC source line and column
- The compiler returns structured `CompileResult` data instead of throwing to callers
- The React layer can render error diagnostics with location info
- Tier C (V3 source maps for browser devtools) requires no changes to `IGeneratable.generate()` or any transpiler rule

---

## Core Types

All types live in `CompilerLib/compiler/types.ts`:

```typescript
export type SourceLocation = {
  line: number;
  col: number;
  filename: string;
};

export type Diagnostic = {
  message: string;
  severity: 'error' | 'warning';
  loc?: SourceLocation;   // optional — startup/internal errors have no source position
};

export type CompileResult = {
  code?: string;          // absent on failure
  diagnostics: Diagnostic[];
  sourceMap?: string;     // undefined until Tier C
};
```

---

## Layer-by-layer changes

### 1. Token — convenience accessor

`Token` gets a `loc()` method returning `SourceLocation` from its existing `.line`, `.col`, `.filename` fields. No new data stored; purely a convenience shape.

### 2. Tree node

`Tree` gains `loc?: SourceLocation`. The `node()` factory accepts an optional fourth argument to populate it. Location is optional everywhere — no breaking changes to existing call sites or tests.

### 3. Node subclasses

Each node subclass constructor gains an optional `loc?: SourceLocation` parameter, passed to `super()`. Parser rules capture `tokenStream.current().loc()` before consuming the leading token and pass it to the node they construct.

### 4. Error classes

`CompilationError`, `SemanticError`, `SemanticTypeError`, and `SymbolError` each gain an optional `loc?: SourceLocation` constructor parameter stored as a public field.

The `parseFile` catch block in `CompilerLib/parser/index.ts` enriches any caught error that lacks a `loc` using `stream.current()`. Validator nodes that have `this.loc` attach it when they throw.

### 5. Compiler public API

`Basic4WebGL/index.ts`:

- `transpile(project): CompileResult` — wraps the full pipeline; catches all compiler errors and converts them to diagnostics. Success: `{ code, diagnostics: [] }`. Failure: `{ diagnostics: [{ message, severity: 'error', loc }] }`.
- `parse(project)` — signature unchanged (used by tests; still throws).
- `lexOnly(project)` — unchanged.

### 6. Transpiler offset tracking (Tier C runway)

`CompilerLib/transpiler/index.ts` maintains an internal `mappings: Array<{ src: SourceLocation, genStart: number, genLength: number }>` as it concatenates each `generate()` result. Nodes without `loc` produce no mapping entry. The array is computed but not yet exposed — `CompileResult.sourceMap` is always `undefined` in Tier A/B.

**`IGeneratable.generate()` signature is never changed.** When Tier C is implemented, the transpiler converts its `mappings` array to a V3 source map JSON string and populates `CompileResult.sourceMap`.

### 7. React layer

`EditorPage` replaces its `try/catch` with:

```typescript
const result = compiler.transpile(project);
if (result.diagnostics.length > 0) {
  showErrors(result.diagnostics); // loc available for highlighting
} else {
  execute(result.code!);
}
```

Full editor line-highlighting is wired separately using the `loc` data already present on each diagnostic.

---

## What does NOT change

- `IGeneratable.generate(node, symbols): string` — never changes
- All transpiler rule files — no changes required for Tier C
- `compiler.parse()` and `compiler.lexOnly()` — signatures unchanged
- Existing unit tests for transpiler rules, lexer, and parser constructs — no changes

---

## Tier C path (future, no current action)

1. Add `sourceMap?: string` consumption to `CompileResult` in the React runtime
2. In `CompilerLib/transpiler/index.ts`, convert the already-built `mappings` array to V3 source map JSON
3. Populate `CompileResult.sourceMap`

That is the complete Tier C implementation. No other files change.

---

## Testing strategy

- **Unit:** `SourceLocation` shape tests; `Tree.loc` populated correctly by `node()` factory
- **Unit:** Error classes carry `loc` when provided
- **Unit:** `token.loc()` returns correct shape
- **Integration:** `compiler.transpile()` returns `CompileResult` with correct `code` on success
- **Integration:** `compiler.transpile()` returns `CompileResult` with populated `diagnostic.loc` on failure — verifying the location points to the correct line in the BASIC source
- **Regression:** All 155 existing tests continue to pass
