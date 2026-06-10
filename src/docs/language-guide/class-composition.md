# Class Composition

Classes can hold instances of other classes as properties, set up inside the constructor.

## Pattern

```bas
Class
Extends sprite

Constructor(imagePath)
  super(imagePath)
  dim self.weapon as Weapon()
EndConstructor

function onupdate(delta)
  self.weapon.update(delta)
endfunction
```

Here, each instance of this class owns its own `Weapon` instance stored at `self.weapon`.

## Why Composition

softBASIC supports single-level inheritance only. For more complex object relationships, compose objects by nesting instances.

## softGfx Example

The built-in softGfx classes use this pattern: `Sprite`, `AnimatedSprite`, and `TileMap` each hold an `ObjectTransform` instance at `self.transform`:

```bas
Class
Extends sprite

Constructor()
  super("player.png")
EndConstructor

function onenter()
  self.transform.setPosition(100, 200)
endfunction
```

## Related Topics

- [Classes](classes)
- [Constructors](constructors)
- [Inheritance](inheritance)
- [Packages](packages)
