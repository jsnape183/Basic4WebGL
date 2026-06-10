# Classes

A file is declared as a **class** by placing the `Class` keyword alone on line 1. Classes support multiple instances, each with their own state.

## Declaration

```bas
Class
dim health
dim x
dim y
```

The class name is derived from the filename (lowercase, no extension). A file named `Enemy.bas` produces a class named `enemy`.

## Instance Variables

Variables declared with `dim` inside a class body (outside any function or constructor) are prototype properties — they exist on every instance. Access them inside methods using `self.`:

```bas
Class
dim health

function takeDamage(amount)
  self.health = self.health - amount
endfunction
```

## Creating Instances

```bas
dim e1 as enemy()
dim e2 as enemy()
```

Each instance has its own copy of `health`.

## EndClass

An optional `EndClass` keyword can close the class body. It is not required.

## Related Topics

- [self.](self) — required prefix for instance variable access inside methods
- [Constructors](constructors) — initialise instance state at creation time
- [Inheritance](inheritance) — extend one class from another
