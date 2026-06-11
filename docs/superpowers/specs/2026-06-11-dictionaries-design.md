# Dictionaries Design Spec

## Goal

Add a first-class dictionary type to softBASIC — a key/value store where keys are strings or numbers and values are variants. Dictionaries use square bracket syntax (`[]`) to visually distinguish them from arrays, which use parentheses.

## Syntax

### Declaration

```basic
dim scores[]
```

Empty `[]` is the only valid form. No size, no initial value. Dictionaries are always empty at creation. Initialisers on declaration are a compile error.

### Assignment

```basic
scores["Alice"] = 100
scores[42] = "forty-two"
```

String and number keys are both valid in the same dictionary.

### Access

```basic
print scores["Alice"]
dim name as scores["Alice"]
```

If the key does not exist, a runtime error is thrown:
`Dictionary key not found: "Alice"`

### Scope rules

Same as arrays: `dim` inside a function is local; at program level is global; inside a class body is an instance property.

### Invalid forms

```basic
dim scores[] = something   ' compile error — no initialisers on dict declaration
dim scores["Alice"]        ' compile error — brackets in dim only valid when empty
```

---

## Compiler Architecture

### 1. Lexer — new tokens

Add `OpenBracket` (`[`) and `CloseBracket` (`]`) to `tokens.ts` and the lexer keyword/punctuation map. These tokens are only meaningful in the three contexts below; anywhere else they produce a parse error.

### 2. Symbol table — new type

Add `DictionarySymbol` to `symbolTypes.ts`, parallel to `ArraySymbol`. No `dimensions` field needed.

### 3. New parse nodes

| Node | Produced by | When |
|---|---|---|
| `DictionaryDimNode` | `DimRule` | `dim name[]` |
| `DictionaryLookupNode` | `VariableFactorRule` | `name[expr]` in expression context, symbol is `DictionarySymbol` |
| `DictionaryAssignNode` | `VariableRule` | `name[expr] = value`, symbol is `DictionarySymbol` |

### 4. Parser changes

- **`DimRule`** — after reading the variable name, peeks for `[`. If found, expects `]` immediately (non-empty brackets at dim time are a compile error). Returns `DictionaryDimNode` and registers a `DictionarySymbol`.
- **`VariableFactorRule`** — after resolving the symbol, if the next token is `[` and the symbol is a `DictionarySymbol`, parses a single key expression, consumes `]`, returns `DictionaryLookupNode`.
- **`VariableRule`** — same detection for `name[expr] = value`, returns `DictionaryAssignNode`.

### 5. New transpiler rules

| Rule | softBASIC | JavaScript |
|---|---|---|
| `DictionaryDimRule` | `dim scores[]` | `let scores = _createDict();` (scope-aware) |
| `DictionaryLookupRule` | `scores["Alice"]` | `_sbDictGet(scores, "Alice")` |
| `DictionaryAssignRule` | `scores["Alice"] = 100` | `scores.set("Alice", 100);` |

Scope handling in `DictionaryDimRule` follows the same pattern as `DimRule`: `let` in function scope, `ClassName.prototype.name` in class scope, bare assignment at global scope.

---

## Runtime

Two additions to `bootstrapper.html` (inline script, alongside `_createArray`):

```javascript
const _createDict = () => new Map();

const _sbDictGet = (map, key) => {
  if (!map.has(key)) throw new Error(`Dictionary key not found: ${JSON.stringify(key)}`);
  return map.get(key);
};
```

Using `Map` ensures number key `42` and string key `"42"` are genuinely distinct — no silent type coercion.

Unified collection helpers (also in `bootstrapper.html`) — these allow the shared API functions to work for both arrays and dictionaries:

```javascript
const _sbLength   = x          => x instanceof Map ? x.size : x.length;
const _sbRemove   = (col, k)   => col instanceof Map ? col.delete(k) : col.splice(k, 1);
const _sbContains = (col, item)=> col instanceof Map ? col.has(item) : col.includes(item);
const _sbClear    = col        => col instanceof Map ? col.clear() : col.splice(0);
const _sbJoin     = (col, sep) => col instanceof Map
  ? Array.from(col.values()).join(sep)
  : col.join(sep);
```

---

## API Functions

### `array.bas` — updated

The shared functions are updated to call the unified helpers. All existing array call sites continue to work unchanged.

```basic
function length(col): return call("_sbLength(length_col)"):endfunction
function remove(col, key): call("_sbRemove(remove_col, remove_key)"):endfunction
function contains(col, item): return call("_sbContains(contains_col, contains_item)"):endfunction
function clear(col): call("_sbClear(clear_col)"):endfunction
function join(col, sep): return call("_sbJoin(join_col, join_sep)"):endfunction
```

`arrLength`, `push`, `pop`, `indexOf` are unchanged.

### `dict.bas` — new file

Dictionary-specific functions:

```basic
function keys(dic): return call("Array.from(keys_dic.keys())"):endfunction
function values(dic): return call("Array.from(values_dic.values())"):endfunction
function joinKeys(dic, sep): return call("Array.from(joinkeys_dic.keys()).join(joinkeys_sep)"):endfunction
```

### Full API reference

| Function | Arrays | Dictionaries |
|---|---|---|
| `length(col)` | count of elements | count of keys |
| `contains(col, x)` | is value present | does key exist |
| `remove(col, x)` | remove at index | remove by key |
| `clear(col)` | empty the array | empty the dict |
| `join(col, sep)` | join values | join values |
| `joinKeys(dic, sep)` | — | join keys as string |
| `keys(dic)` | — | array of all keys |
| `values(dic)` | — | array of all values |

---

## Documentation

A new `src/docs/api-reference/dict.md` page is added. It is registered in `src/docs/manifest.ts` under the **softCore** group alongside `math`, `string`, and `array`.

Doc page covers: declaration, assignment and access, runtime key-not-found error, all API functions with parameter tables and `.bas` code examples.

---

## Out of scope

- `for each` iteration — next feature; `keys()` provides a bridge until then
- Nested dictionaries — work naturally via variant values, no special handling needed
- Typed dictionaries — no type annotation on keys or values; all values are variant
- Dictionary literals — no `{ "a": 1, "b": 2 }` initialiser syntax
