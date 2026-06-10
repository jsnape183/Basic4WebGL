# self.

Inside class methods and constructors, instance variables **must** be accessed with the `self.` prefix. Bare access to a class variable without `self.` is a compile error.

## Usage

```bas
Class
dim score

function addPoints(amount)
  self.score = self.score + amount   ' correct
  ' score = score + amount           ' compile error — bare access
endfunction
```

`self.` compiles to `this.` in the generated JavaScript.

## In Constructors

```bas
Constructor(startScore)
  self.score = startScore
EndConstructor
```

## Why Required

Because softBASIC modules are also static classes and use bare variable names at the top level, requiring `self.` inside instance classes makes the distinction explicit and prevents accidental reference to module-level scope.

## Related Topics

- [Classes](classes)
- [Constructors](constructors)
