# Inheritance

A class can extend another class using the `Extends` keyword. The child class inherits all methods and properties from the parent.

## Syntax

```bas
Class
Extends ParentClassName
```

`ParentClassName` is the lowercase name of the parent class (the filename without `.bas`).

## Example

**Enemy.bas:**
```bas
Class
dim health
dim x

Constructor(startHealth, startX)
  self.health = startHealth
  self.x = startX
EndConstructor

function takeDamage(amount)
  self.health = self.health - amount
endfunction
```

**Boss.bas:**
```bas
Class
Extends enemy

Constructor(startHealth, startX)
  super(startHealth, startX)
  self.phase = 1
EndConstructor

function onupdate(delta)
  ' boss-specific behaviour
endfunction
```

## super()

Call `super(…)` in the child constructor to run the parent constructor. This should be done first, before assigning child-specific properties.

## super.method()

Call a parent method that has been overridden in the child:

```bas
function takeDamage(amount)
  super.takeDamage(amount)
  ' additional boss-specific logic
endfunction
```

## Constraints

- Single-level inheritance only — a class can extend one parent, but that parent cannot itself extend another class.
- The parent class file must be included in the project.

## Related Topics

- [Classes](classes)
- [Constructors](constructors)
