# array

The `array` module provides functions for working with arrays. It is part of the **softCore** package.

Arrays in softBASIC are declared with a size: `dim scores(10)` creates an array of 10 elements. The functions below let you work with them dynamically.

## arrLength(a)

Returns the number of elements in an array.

| Parameter | Type  | Description |
|-----------|-------|-------------|
| a         | array | The array to measure |

**Returns:** number

```bas
dim items(5)
dim n
n = arrLength(items)   ' n is 5
```

## push(arr, item)

Adds an item to the end of an array.

| Parameter | Type  | Description |
|-----------|-------|-------------|
| arr       | array | The array to add to |
| item      | any   | The value to add |

```bas
dim scores(0)
push(scores, 100)
push(scores, 200)
```

## pop(arr)

Removes and returns the last item in an array.

| Parameter | Type  | Description |
|-----------|-------|-------------|
| arr       | array | The array to remove from |

**Returns:** the removed item.

```bas
dim scores(0)
push(scores, 100)
push(scores, 200)
dim last
last = pop(scores)   ' last is 200, scores now has one item
```

## contains(arr, item)

Checks whether an array contains a specific value.

| Parameter | Type  | Description |
|-----------|-------|-------------|
| arr       | array | The array to search |
| item      | any   | The value to look for |

**Returns:** `true` if found, `false` if not.

```bas
if contains(inventory, "sword") then
  print "You have a sword"
endif
```

## indexOf(arr, item)

Returns the position of a value in an array. Returns -1 if not found. Positions start at 0.

| Parameter | Type  | Description |
|-----------|-------|-------------|
| arr       | array | The array to search |
| item      | any   | The value to find |

**Returns:** number

```bas
dim pos
pos = indexOf(inventory, "potion")
```

## remove(arr, index)

Removes the item at a specific position and shifts the remaining items down.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| arr       | array  | The array to modify |
| index     | number | Position to remove (0 = first item) |

```bas
remove(inventory, 0)   ' removes the first item
```

## join(a, s)

Joins all items in an array into a single string, separated by `s`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | array  | The array to join |
| s         | string | Separator between items |

**Returns:** string

```bas
dim items(3)
items(0) = "sword"
items(1) = "shield"
items(2) = "potion"
dim result
result = join(items, ", ")   ' result is "sword, shield, potion"
```

## clear(arr)

Removes all items from an array.

| Parameter | Type  | Description |
|-----------|-------|-------------|
| arr       | array | The array to clear |

```bas
clear(inventory)
```
