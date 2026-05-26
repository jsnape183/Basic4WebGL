# Array Utility Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add six utility functions to the `array` module (push, pop, contains, indexOf, remove, clear) and write the complete Arrays section of the language guide.

**Architecture:** All six functions are added to `src/lib/Basic4WebGL/defs/array.bas` using the existing `call()` escape hatch pattern, identical to `arrLength` and `join`. No compiler changes needed — Plan 1 (Array Compiler Fixes) makes array arguments work, so these functions become available automatically.

**Depends on:** Plan 1 (Array Compiler Fixes) must be complete first.

**Tech Stack:** TypeScript, Vitest, softBASIC `call()` pattern

---

## File Map

| Action | Path |
|---|---|
| Modify | `src/lib/Basic4WebGL/defs/array.bas` |
| Modify | `docs/language/softbasic-concepts.md` |
| Modify | `tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts` |

---

### Task 1: Add utility functions to array.bas

**Files:**
- Modify: `src/lib/Basic4WebGL/defs/array.bas`
- Modify: `tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts`

- [ ] **Step 1: Write failing integration tests for each new function**

Open `tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts`. Add:

```ts
describe('Array utility functions — compile without error', () => {
  const withArray = (body: string) =>
    transpile(['dim arr(0)', body].join('\n'));

  test('array.push compiles', () => {
    const result = withArray('array.push(arr, 42)');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.pop compiles', () => {
    const result = withArray('function test()\n  dim x\n  x = array.pop(arr)\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.contains compiles', () => {
    const result = withArray('function test()\n  dim x\n  x = array.contains(arr, 42)\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.indexOf compiles', () => {
    const result = withArray('function test()\n  dim x\n  x = array.indexOf(arr, 42)\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.remove compiles', () => {
    const result = withArray('array.remove(arr, 0)');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.clear compiles', () => {
    const result = withArray('array.clear(arr)');
    expect(result.diagnostics).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts
```

Expected: FAIL — `Function push has not been declared yet` (or similar for each)

- [ ] **Step 3: Add the six functions to array.bas**

Open `src/lib/Basic4WebGL/defs/array.bas`. Replace the full content:

```basic
' Start of Array functions
function arrLength(a): return call("arrlength_a.length"):endfunction
function join(a, s): return call("join_a.join(join_s)"):endfunction
function push(arr, item): call("push_arr.push(push_item)"):endfunction
function pop(arr): return call("pop_arr.pop()"):endfunction
function contains(arr, item): return call("contains_arr.includes(contains_item)"):endfunction
function indexOf(arr, item): return call("indexof_arr.indexOf(indexof_item)"):endfunction
function remove(arr, index): call("remove_arr.splice(remove_index, 1)"):endfunction
function clear(arr): call("clear_arr.splice(0)"):endfunction
' End of Array functions
```

- [ ] **Step 4: Run the tests to verify they pass**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts
```

Expected: PASS

- [ ] **Step 5: Run full suite**

```
npx vitest run
```

Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/lib/Basic4WebGL/defs/array.bas \
        tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts
git commit -m "feat: add push/pop/contains/indexOf/remove/clear to array module"
```

---

### Task 2: Write the complete Arrays section of the language guide

**Files:**
- Modify: `docs/language/softbasic-concepts.md`

- [ ] **Step 1: Add the full Arrays section**

Open `docs/language/softbasic-concepts.md`. Find the **Known Gaps / To Document** section at the bottom. Remove this bullet:

```
- Array declarations: `dim arr(10)` syntax and transpiled form
```

Then add a new `## Arrays` section before `## Known Gaps / To Document`:

```markdown
## Arrays

### Declaring arrays

**Fixed-size** — elements pre-filled with `false`:

```basic
dim scores(10)          ' 10 elements
dim grid(5, 3)          ' 5×3 two-dimensional array
```

**Dynamic (growable)** — start empty, grow with `push`:

```basic
dim enemies(0)
array.push(enemies, newEnemy)
```

**Typed** — every element is a constructed instance (see Typed Array Declarations):

```basic
dim sprites(10) as Sprite("bunny.png")
dim grid(5, 3) as Tile()
```

### Accessing elements

Array index uses parentheses — `arr(i)`, not `arr[i]`:

```basic
scores(0) = 100
print scores(0)

grid(2, 1) = true
print grid(2, 1)
```

### Arrays are passed by reference

Modifications inside a function are visible to the caller:

```basic
dim enemies(5)
enemies(0) = 10
resetFirst(enemies)
print enemies(0)    ' prints 0

function resetFirst(arr)
    arr(0) = 0
endfunction
```

### Array module

| Function | Returns | Description |
|---|---|---|
| `array.arrLength(arr)` | number | Number of elements |
| `array.push(arr, item)` | nothing | Add item to end |
| `array.pop(arr)` | removed value | Remove and return last item |
| `array.contains(arr, item)` | boolean | True if item is in array |
| `array.indexOf(arr, item)` | number | Index of item, or -1 if not found |
| `array.remove(arr, index)` | nothing | Remove element at index |
| `array.clear(arr)` | nothing | Empty the array |
| `array.join(arr, separator)` | string | Join elements into a string |

### Typical usage — dynamic enemy list

```basic
dim enemies(0)

function onenter()
    for i = 0 to 9
        dim e as Enemy()
        array.push(enemies, e)
    next
endfunction

function onupdate()
    for i = 0 to array.arrLength(enemies) - 1
        enemies(i).update()
    next
endfunction
```
```

- [ ] **Step 2: Run the full suite**

```
npx vitest run
```

Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add docs/language/softbasic-concepts.md
git commit -m "docs: complete Arrays section in language guide; remove from Known Gaps"
```
