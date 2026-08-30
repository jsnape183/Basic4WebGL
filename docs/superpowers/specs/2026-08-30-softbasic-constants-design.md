# softBASIC Named Constants — Design

**Date:** 2026-08-30
**Status:** Design approved, not yet implemented
**Scope:** The constant-declaration mechanism only. The controller/gamepad
input module that motivates it is a **separate spec** — this spec adds one
small illustrative constant set as a worked example, not the full `PAD_*` API.

---

## 1. Motivation

softBASIC has no named-constant facility. `math.pi()` is a function call.
An upcoming controller-input module needs named gamepad button and axis
values (`PAD_A`, `PAD_DPAD_UP`, `PAD_LEFT_X`, …) and today's only options are
raw integers scattered through game code or ~20 zero-argument accessor
functions. Neither is acceptable. This spec designs a real constant facility
that serves both library-provided constant sets and user game code through
one mechanism.

Existing accessor functions (`math.pi()`, `math.euler()`, etc.) are **not**
migrated. `const` is for new APIs only.

---

## 2. Syntax

### 2.1 Block form (primary)

```basic
const
    PAD_A = 0
    PAD_B = 1
    PAD_DPAD_UP = 12
    GAME_TITLE = "Space Blaster"
    DEBUG_MODE = false
endconst
```

- Opened by `const` on its own line, closed by `endconst`.
- One `NAME = <literal>` per entry. Entries are newline-separated; the
  colon statement separator also works (consistent with the rest of the
  language, e.g. `PAD_A = 0 : PAD_B = 1`).
- The block is an **anonymous grouping construct**. It creates no nested
  namespace — every name lands flat in the enclosing file's module scope.
  `PAD_DPAD_UP` is reached as `input.PAD_DPAD_UP`, never `input.PAD.DPAD_UP`.
- Multiple `const … endconst` blocks per file are allowed.

### 2.2 Single-line form (secondary)

```basic
const MAX_HEALTH = 100
```

Exactly equivalent to a one-entry block. Falls out of the same parser rule
naturally; supported for convenience.

### 2.3 Placement

`const` declarations (block or single-line) are **top-level only** — a file's
module scope, the same placement as module `function` declarations. Not
permitted inside a function body, class body, constructor, `if`, `while`,
`for`, or `do` block. Attempting it is a `CompilationError`.

### 2.4 Right-hand side grammar

The RHS is a **single literal token**, one of:

| Kind    | Examples                        |
|---------|---------------------------------|
| number  | `0`, `12`, `3.14`, `-9` (leading unary minus permitted) |
| string  | `"Space Blaster"`               |
| boolean | `true`, `false`                 |

No identifiers, no operators, no function calls, no references to other
constants. There is **no compile-time expression evaluator** — the parser
rule accepts exactly one literal (optionally minus-prefixed for numbers) and
errors on anything else (`const TAU = PI * 2` → `CompilationError`).

### 2.5 Naming convention

`UPPER_SNAKE_CASE` is **recommended in docs, not enforced**. softBASIC
identifiers are case-insensitive (the lexer and the `Dim`/`Variable` parser
rules lowercase identifier text before symbol lookup), so `input.PAD_A` and
`input.pad_a` resolve to the same symbol. Compiler enforcement of casing
would therefore be half-meaningless and is deliberately omitted. The
Language Guide topic states the convention and explains why it is only a
convention.

---

## 3. Tokens and keywords

Add to `src/lib/Basic4WebGL/keywords.ts`:

```
'const', 'endconst'
```

Add to `src/lib/Basic4WebGL/tokens.ts`:

```
'Const', 'EndConst'
```

Wire the keyword→token mapping in `TokenResolver.ts` following the existing
pattern for `Dim` / `Function` / `EndFunction`.

---

## 4. Parser

### 4.1 New rule: `ConstBlockRule`

Registered for the `Const` token (`@RegisterParserRule('Const')`), modelled
on `DimRule`.

Parsing:

1. `matchAndMove(tokens.Const)`.
2. If the next token is a `Variable` (single-line form): parse one
   declarator, consume the newline, return.
3. Otherwise (block form): consume the newline, then loop parsing one
   declarator per line until `EndConst`; `matchAndMove(tokens.EndConst)`;
   consume the trailing newline.
4. Each declarator:
   - `matchAndMove(tokens.Variable)` → name (lowercased, as elsewhere).
   - `matchAndMove(tokens.Equals)`.
   - Read exactly one literal token (`Number` with optional preceding
     `Subtract` for negatives, `String`, `BoolTrue`, `BoolFalse`). Anything
     else → `CompilationError` with a message naming the offending token.
   - Register a `ConstantSymbol` (see §5) in the current scope.
   - Emit a declarator sub-node carrying `{ symbol }`.
5. Return a `ConstBlockNode` wrapping the declarator sub-nodes (a single-line
   `const` still returns a `ConstBlockNode` with one child, for uniformity).

### 4.2 `ModuleRule` extension — resolve non-function members

`ModuleRule` today assumes the token after `module.` is a function name and
calls `getInScope(name, symbolTypes.Function, module)`. Extend it:

```
matchAndMove(tokens.Dot)
matchAndMove(tokens.Variable)  → memberName
if getInScope(memberName, Constant, module) exists:
    return new ConstantRefNode({ module, name: memberName })
else:
    (existing function-call path unchanged)
```

This is the only reason the parser needs touching outside the new rule.

### 4.3 `VariableRule` — reject assignment to a constant

- Bare word: if `name` resolves to a `Constant` symbol and the next token is
  `Equals` → `CompilationError("'PAD_A' is a constant and cannot be
  assigned")`.
- `module.member =`: the `ModuleRule` path already returns a
  `ConstantRefNode`; if it is followed by `Equals`, raise the same error.
  (Cleanest place: detect in `ModuleRule` / the object-property assignment
  path and throw there.)

### 4.4 `DimRule` — no shadowing

If a `dim` declarator name resolves to a **visible constant** (same scope or
an enclosing module/global scope) → `CompilationError("'PAD_A' is a constant;
choose a different name")`. This delivers "a local `dim` may not shadow a
constant."

### 4.5 Redeclaration

A second `const` (or any other declaration) of an already-declared constant
name in the same scope → `CompilationError`. Reuse the existing
`findCrossKindCollision` hook plus a same-kind check inside `ConstBlockRule`.

### 4.6 User code cannot override a library constant

There is no syntax to inject a name into another file's module scope, and a
user's own `const` block lands in the user file's own module namespace. So
`input.PAD_A` has exactly one definition site and no override path — no extra
guard is required. The doc states this explicitly.

---

## 5. Symbols

- New `symbolTypes.Constant = 'Constant'`.
- New class `ConstantSymbol extends Symbol` in `symbolTypes.ts`:
  - `value: number | string | boolean` — the resolved literal.
  - `valueKind: 'number' | 'string' | 'boolean'`.
  - Type is `Variant` (like every other symbol here) — the `valueKind` field
    is what hover/tests read.
- Registered into the enclosing file's module scope, i.e. the same scope
  `function` declarations in that file use. Within the defining file the
  bare name is visible; from other files it is reached as `module.NAME`,
  exactly mirroring module functions.
- Included in `Symbols.getSnapshot()` output so the editor layer sees it.

---

## 6. Transpiler emission

### 6.1 Frozen holder object per file

For each compiled root (`.bas` file) that declares at least one constant,
emit one frozen object in the file's **inert-declaration phase** (constants
are pure data — no engine calls, no ordering hazard, safe to hoist ahead of
asset preload alongside `const m = {}` and the `let x = null` globals from
`symbolRules`):

```js
const _const_input = Object.freeze({
  PAD_A: 0,
  PAD_B: 1,
  GAME_TITLE: "Space Blaster",
  DEBUG_MODE: false
});
```

- Holder name: `_const_` + the file's module scope name.
- String values emitted via `JSON.stringify` for correct escaping.
- The holder is **separate from the runtime module object** (`input`).
  The module object receives function properties across the two-phase
  RootRule init split and must not be frozen; the constant holder has no
  such constraint and gains real runtime immutability from `Object.freeze`.

### 6.2 Reference sites

New node `ConstantRefNode` (data: `{ module, name }`). Its JS rule emits:

```js
_const_<module>.<NAME>
```

Both reference forms compile to this:
- bare `PAD_A` inside `input.bas` → `_const_input.PAD_A`
- `input.PAD_A` from any other file → `_const_input.PAD_A`

`ConstBlockNode` itself emits **nothing** at its source position — all output
is the hoisted holder in §6.1.

---

## 7. Editor support

`src/monacoHelpers/symbolCatalogue.ts` and the completion/hover providers:

- **Completion**
  - Bare-word: constants declared in the active file appear in bare-word
    completion (same visibility logic as the file's own functions).
  - Dot: after `input.`, the module's constants appear alongside its
    functions.
  - Monaco `CompletionItemKind.Constant`.
- **Hover** over a constant reference shows: the name, `= <value>`, a
  "constant" kind label, and the leading doc-comment if the `.bas`/user
  source has one (reuse the existing doc-comment extraction used for
  functions).
- **Diagnostics** — reassignment, shadowing, redeclaration, non-literal RHS,
  and misplacement all surface through the standard
  `CompilationError → Diagnostic` path in `index.ts`. No new diagnostic
  plumbing.
- **Signature help** — N/A (constants are not callable).

---

## 8. Interaction with the six-step "adding a language feature" process

This feature is a **language construct**, not a library module, so several of
the six steps are N/A and that is called out rather than skipped silently:

| Step | Applies? | Notes |
|------|----------|-------|
| 1. `.bas` def file | Partial | Library constant sets are authored directly in **hand-written** `defs/*.bas` files as `const … endconst` blocks. No new def file for the mechanism itself. |
| 2. Engine JS file | **No** | Constants are compile-time only. They never call `_sb.*` and never touch the runtime engine. |
| 3. Bootstrapper wiring | **No** | Nothing to register. |
| 4. Tests | Yes | See §9. |
| 5. Docs | Yes | New **Language Guide** topic `Constants` (`src/docs/language-guide/constants.md` + `src/docs/manifest.ts` entry, placed after `Operators`). Not an API Reference page — the mechanism is language-level. |
| 6. Roadmap | Yes | Add a tracked item to `docs/language/library-roadmap.md`: constant mechanism shipped; the controller/gamepad module (first real consumer) is a separate spec still open. Update the `src/docs/roadmap.md` public summary to match. |

### Descriptor-generated `.bas` files

`input.bas` — where the worked example lands (§10) — is **hand-written**, not
in `src/lib/Basic4WebGL/library/registry.ts`, so it is edited directly.

If a *future* descriptor-generated module (`sprite`, `stage`, `gfx`, …) ever
needs a constant set, its `.descriptor.ts` and the generator would need a
`constants` field. That is **out of scope here** and noted as a follow-up in
the roadmap item — the generator changes only when a generated module
actually needs constants.

---

## 9. Tests

`tests/lib/Basic4WebGL/unit/transpiler/constants.test.ts`:

- Block form parses; each name registered in module scope.
- Single-line form parses and is equivalent to a one-entry block.
- Multiple blocks per file merge into one holder.
- Emission: one `const _const_<module> = Object.freeze({ … })`, correct
  key/value pairs, strings JSON-escaped, negative numbers, booleans.
- Reference rewrite: bare name inside the defining file → `_const_<module>.X`;
  `module.NAME` from another file → same.
- `ConstBlockNode` emits nothing at its source position.
- Errors (each asserts a `CompilationError` with a helpful message):
  - assigning to a constant (bare and `module.NAME`)
  - `dim` shadowing a visible constant
  - redeclaring a constant
  - non-literal RHS (`const X = Y`, `const X = 1 + 2`, `const X = foo()`)
  - `const` inside a function / class / `if` body

`tests/monacoHelpers/symbolCatalogue` (or the nearest existing catalogue
test file): a `Constant` symbol appears in bare-word completion in its file,
in dot-completion after `module.`, and hover returns name + value.

No Cypress e2e change is required for the mechanism itself. When the
controller module ships (separate spec) it brings its own `demos.cy.ts` /
tutorial coverage.

---

## 10. Worked example in this spec's scope

Add a **small, real** constant set to the hand-written `input.bas` — three
keyboard key codes, genuinely useful today and in the same module the future
gamepad constants will join:

```basic
const
    KEY_SPACE = 32
    KEY_LEFT = 37
    KEY_RIGHT = 39
endconst
```

Used as `input.KEY_SPACE` with `input.getKeyDown(input.KEY_SPACE)`.

This exercises the entire path for real: a hand-written def change, the
frozen-holder emission, namespaced resolution, a docs line in the new
Constants topic, and the roadmap update. The full `PAD_*` / axis set is
**explicitly not authored here** — it belongs to the controller module spec.

> Open confirmation needed from the coordinator: adding `KEY_*` to `input.bas`
> is a (minor) shipped-API addition and needs a one-line entry in the
> `input` module's docs. If the coordinator prefers zero shipped-API change
> in this spec, the alternative is to keep the worked example purely in
> tests and the Constants doc topic (using a fictional `input.KEY_SPACE`
> illustratively) and touch no def file. Recommendation: ship the real
> `KEY_*` block — it is small, correct, and immediately useful.

---

## 11. Out of scope

- The controller/gamepad input module and its constant set (`PAD_*`,
  `PAD_LEFT_X`, …) — separate spec.
- Migrating `math.pi()` / `math.euler()` or any existing accessor to `const`.
- Compile-time constant expressions (`const TAU = PI * 2`).
- Constants inside class or function scope (local `const`).
- A `constants` field on library descriptors / the `.bas` generator.
- Enum-style types (a constant that is also a distinct type for checking).

---

## 12. Summary of key decisions

| Decision | Choice |
|----------|--------|
| Namespacing | Module-qualified (`input.PAD_A`); `ModuleRule` extended to resolve non-function members |
| Primary syntax | `const … endconst` block; single-line `const NAME = value` also supported |
| Block semantics | Anonymous grouping; names land flat in the file's module scope |
| Placement | Top-level only |
| RHS | One literal only — number / string / `true` / `false`; leading `-` allowed on numbers; no evaluator |
| User + library | One mechanism; library sets authored in hand-written `defs/*.bas` |
| Existing accessors | Untouched — `const` for new APIs only |
| Emission | Per-file `const _const_<module> = Object.freeze({ … })`, hoisted into the inert-declaration phase; references compile to `_const_<module>.NAME` |
| Naming | `UPPER_SNAKE` recommended in docs, not enforced (identifiers are case-insensitive) |
| Reassign / redeclare | Compile error |
| Shadowing | A local `dim` may not shadow a constant — compile error |
| Override | No syntax path for user code to override a library constant |
| Editor | Completion (bare + dot), hover (name + value), diagnostics via standard path |
| Engine / bootstrapper | No change — constants are compile-time only |
| Worked example | 3-value `KEY_*` block added to `input.bas` (pending coordinator confirmation) |
