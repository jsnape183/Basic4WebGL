# Operators

## Arithmetic

| Operator | Description | Example |
|----------|-------------|---------|
| `+` | Addition | `x + 1` |
| `-` | Subtraction | `x - 1` |
| `*` | Multiplication | `x * 2` |
| `/` | Division | `x / 2` |
| `mod` | Modulo | `x mod 3` |

## Comparison

| Operator | Description |
|----------|-------------|
| `=` | Equal |
| `<>` | Not equal |
| `<` | Less than |
| `>` | Greater than |
| `<=` | Less than or equal |
| `>=` | Greater than or equal |

## Boolean

| Operator | Description |
|----------|-------------|
| `and` | Logical AND |
| `or` | Logical OR |
| `not` | Logical NOT |

Example:

```bas
if x > 0 and y > 0 then
  print "first quadrant"
endif
```

## String Concatenation

Use `+` to concatenate strings:

```bas
dim greeting
greeting = "Hello, " + name + "!"
```

## Assignment

`=` is used for both assignment and equality comparison. Context determines which.

## Related Topics

- [Control Flow](control-flow)
- [Variable Scoping](variable-scoping)
