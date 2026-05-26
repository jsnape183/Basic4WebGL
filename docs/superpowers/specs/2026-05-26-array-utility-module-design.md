# Array Utility Module Design

**Date:** 2026-05-26
**Spec:** 3 of 3 — Array Support
**Depends on:** Spec 1 (Array Compiler Fixes)

## Goal

Add six utility functions to the `array` module for dynamic array management. Document the full array surface in the language guide, resolving all Known Gaps related to arrays.

---

## New Functions

Added to `array.bas` using the existing `call()` pattern, consistent with `arrLength` and `join`:

```basic
function push(arr, item): call("push_arr.push(push_item)"):endfunction
function pop(arr): return call("pop_arr.pop()"):endfunction
function contains(arr, item): return call("contains_arr.includes(contains_item)"):endfunction
function indexOf(arr, item): return call("indexof_arr.indexOf(indexof_item)"):endfunction
function remove(arr, index): call("remove_arr.splice(remove_index, 1)"):endfunction
function clear(arr): call("clear_arr.splice(0)"):endfunction
```

### Function contracts

| Function | Returns | Notes |
|---|---|---|
| `push(arr, item)` | nothing | Adds item to end. Length increases by 1. |
| `pop(arr)` | removed value | Removes and returns last element. |
| `contains(arr, item)` | boolean | `true` if item is in array. |
| `indexOf(arr, item)` | number | Index of item, or `-1` if not found. |
| `remove(arr, index)` | nothing | Removes element at index. Length decreases by 1. |
| `clear(arr)` | nothing | Empties the array. Length becomes 0. |

`push` intentionally returns nothing — use `array.arrLength` separately if the new length is needed.

These functions are designed for 1D dynamic arrays. Using `push` on a multi-dimensional array pushes to the outer dimension; the caller is responsible for ensuring the value is the correct shape.

---

## Dynamic Array Pattern

The idiomatic way to declare a dynamic (growable) array is `dim arr(0)` — a zero-element fixed-size array that JavaScript treats as an empty array, which can be grown with `push`.

```basic
dim bullets(0)

function spawnBullet(x, y)
    dim b as Bullet(x, y)
    array.push(bullets, b)
endfunction

function onupdate()
    for i = 0 to array.arrLength(bullets) - 1
        bullets(i).update()
    next
endfunction
```

---

## Tests

- `push` adds element, `arrLength` increases by 1
- `pop` removes and returns the last element, `arrLength` decreases by 1
- `contains` returns `true` when item is present, `false` when absent
- `indexOf` returns correct index, returns `-1` for missing item
- `remove` at index splices correctly, `arrLength` decreases by 1
- `clear` empties the array, `arrLength` returns 0
- All six functions compile when passed a module-level array variable (confirms Spec 1 prerequisite)

---

## Language Guide Updates

This spec owns the full **Arrays** section of `docs/language/softbasic-concepts.md`. The complete section replaces the current stub in Known Gaps.

### Full Arrays section

```markdown
## Arrays

### Declaring arrays

Fixed-size array — elements pre-filled with `false`:
```basic
dim scores(10)          ' 10 elements
dim grid(5, 3)          ' 5×3 two-dimensional array
```

Dynamic (growable) array — start empty, grow with `push`:
```basic
dim enemies(0)
```

Typed array — every element is a constructed instance:
```basic
dim sprites(10) as Sprite("bunny.png")
dim enemies(20) as Enemy
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

### Passing arrays to functions

Arrays are passed by reference. Modifications inside a function are visible to the caller:
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

| Function | Description |
|---|---|
| `array.arrLength(arr)` | Number of elements |
| `array.push(arr, item)` | Add item to end |
| `array.pop(arr)` | Remove and return last item |
| `array.contains(arr, item)` | True if item is present |
| `array.indexOf(arr, item)` | Index of item, or -1 |
| `array.remove(arr, index)` | Remove element at index |
| `array.clear(arr)` | Empty the array |
| `array.join(arr, separator)` | Join elements into a string |

### Typical usage — enemy list

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
