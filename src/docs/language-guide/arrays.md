# Arrays

Arrays store ordered collections of values.

## Declaration

```bas
dim scores(10)   ' array of 10 elements, indices 0–9
```

## Access

```bas
scores(0) = 100
scores(1) = 200
print scores(0)   ' 100
```

## Iteration

```bas
dim i
for i = 0 to 9
  print scores(i)
next i
```

## Related Topics

- [Variable Scoping](variable-scoping)
- [Control Flow](control-flow)
