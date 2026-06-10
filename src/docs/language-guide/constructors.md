# Constructors

A constructor initialises a class instance when it is created. It runs once per instance, immediately after `dim … as ClassName(…)`.

## Syntax

```bas
Constructor(param1, param2)
  self.param1 = param1
  self.param2 = param2
EndConstructor
```

Constructor parameters are passed as arguments to `dim … as ClassName(…)`:

```bas
dim player as Player(100, 200)   ' calls Constructor(100, 200)
```

## Setting Instance Properties

Use `self.` to assign constructor arguments to instance variables:

```bas
Class
dim health
dim name

Constructor(startHealth, playerName)
  self.health = startHealth
  self.name = playerName
EndConstructor
```

## Creating Object Properties

A `dim … as ClassName()` statement inside a constructor body creates an instance property that holds another object:

```bas
Constructor()
  dim self.transform as ObjectTransform()
EndConstructor
```

This stores the ObjectTransform instance as `this.transform` on the class instance.

## Inheritance

If a class extends another, call `super()` first in the constructor:

```bas
Constructor(x, y)
  super(x, y)
  self.type = "boss"
EndConstructor
```

See [Inheritance](inheritance) for details.

## Related Topics

- [Classes](classes)
- [self.](self)
- [Inheritance](inheritance)
