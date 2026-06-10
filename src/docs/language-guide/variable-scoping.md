# Variable Scoping

softBASIC has three variable scopes: module-level, class-level, and function-local.

## Module-Level Variables

Declared with `dim` at the top of a module (non-class file). Accessible anywhere in the module without a prefix.

```bas
dim score

function addPoints(n)
  score = score + n
endfunction
```

## Class-Level Variables (Instance Properties)

Declared with `dim` inside a class body (outside functions/constructors). Must be accessed with `self.` inside methods.

```bas
Class
dim health

function heal(amount)
  self.health = self.health + amount
endfunction
```

## Function-Local Variables

Declared with `dim` inside a function body. Scoped to that function call only.

```bas
function calculate(x)
  dim result
  result = x * 2
  return result
endfunction
```

## Object Variables in Constructors

A `dim` statement using `as ClassName()` inside a constructor body creates an instance property (stored as `this.propertyName`):

```bas
Constructor()
  dim self.transform as ObjectTransform()
EndConstructor
```

## Related Topics

- [self.](self)
- [Functions](functions)
