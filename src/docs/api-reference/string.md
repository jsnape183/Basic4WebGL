# string

The `string` module provides functions for working with text. It is part of the **softCore** package.

## len(s)

Returns the number of characters in a string.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to measure |

**Returns:** number

```bas
dim n
n = string.len("hello")   ' n is 5
```

## lcase(s)

Converts all letters in a string to lowercase.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to convert |

**Returns:** string

```bas
dim result
result = string.lcase("HELLO")   ' result is "hello"
```

## ucase(s)

Converts all letters in a string to uppercase.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to convert |

**Returns:** string

```bas
dim result
result = string.ucase("hello")   ' result is "HELLO"
```

## trim(s)

Removes spaces from the start and end of a string.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to trim |

**Returns:** string

```bas
dim result
result = string.trim("  hello  ")   ' result is "hello"
```

## str(n)

Converts a number to a string. Useful for displaying scores or other values in text objects.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | The number to convert |

**Returns:** string

```bas
dim display
display = "Score: " + string.str(score)
```

## substr(s, start, end)

Returns a section of a string, from position `start` up to (but not including) position `end`. Positions start at 0.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The source string |
| start     | number | Position to start from (0 = first character) |
| end       | number | Position to stop at (not included in result) |

**Returns:** string

```bas
dim result
result = string.substr("hello world", 0, 5)   ' result is "hello"
```

## replace(s, a, b)

Replaces every occurrence of `a` in `s` with `b`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The source string |
| a         | string | The text to find |
| b         | string | The text to replace it with |

**Returns:** string

```bas
dim result
result = string.replace("hello world", "world", "there")   ' result is "hello there"
```

## split(s, c)

Splits a string into an array using a separator character.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to split |
| c         | string | The separator character |

**Returns:** array of strings

```bas
dim parts
parts = string.split("a,b,c", ",")   ' parts is ["a", "b", "c"]
```

## contains(s, sub)

Checks whether a string contains a given piece of text.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to search |
| sub       | string | The text to look for |

**Returns:** `true` if found, `false` if not.

```bas
if string.contains(name, "boss") then
  print "it's a boss!"
endif
```

## indexof(s, sub)

Returns the position of the first occurrence of `sub` in `s`. Returns -1 if not found. Positions start at 0.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to search |
| sub       | string | The text to find |

**Returns:** number

```bas
dim pos
pos = string.indexof("hello", "ll")   ' pos is 2
```

## padstart(s, n, p)

Pads the start of a string with a character until it reaches the desired length.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to pad |
| n         | number | The target length |
| p         | string | The padding character |

**Returns:** string

```bas
dim result
result = string.padstart("7", 3, "0")   ' result is "007"
```

## padend(s, n, p)

Pads the end of a string with a character until it reaches the desired length.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to pad |
| n         | number | The target length |
| p         | string | The padding character |

**Returns:** string

```bas
dim result
result = string.padend("hi", 5, ".")   ' result is "hi..."
```

## char(n)

Returns the character for a given character code.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Character code (e.g. 65 = "A") |

**Returns:** string (single character)

```bas
dim result
result = string.char(65)   ' result is "A"
```

## asc(s)

Returns the character code of the first character in a string.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | A string (uses the first character) |

**Returns:** number

```bas
dim code
code = string.asc("A")   ' code is 65
```
