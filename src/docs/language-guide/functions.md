# Functions

Functions are declared with the `function` / `endfunction` keywords. They may take parameters and return a value.

## Syntax

```bas
function add(a, b)
  return a + b
endfunction
```

## Parameters

Parameters are comma-separated identifiers. No type annotations.

```bas
function greet(name, times)
  dim i
  for i = 1 to times
    print "Hello, " + name
  next i
endfunction
```

## Return Values

Use `return` followed by an expression. A function without a `return` statement returns `undefined`.

```bas
function square(n)
  return n * n
endfunction
```

## Calling Functions

```bas
dim result
result = square(5)   ' 25
```

## Functions Inside Classes

Functions inside a class body are instance methods. They must use `self.` to access instance variables.

```bas
Class
dim x

function getX()
  return self.x
endfunction
```

## Related Topics

- [Variable Scoping](variable-scoping)
- [self.](self)
- [Lifecycle Functions](lifecycle)
