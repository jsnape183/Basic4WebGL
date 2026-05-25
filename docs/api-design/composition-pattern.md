# Composition Pattern: API Design Guideline

## Purpose & Motivation

Composition provides a practical alternative to inheritance for sharing functionality across multiple classes. In softBASIC, this pattern is essential for avoiding code duplication and maintaining shallow, flexible class hierarchies. It mirrors established patterns in game engines like Godot and Unity, where display objects compose reusable components (e.g., Transform) rather than inheriting from a deep hierarchy. Composition allows shared behaviour without coupling implementations.

## The Pattern

When reusable behaviour emerges across multiple classes—such as position, rotation, scale, and visibility—extract that behaviour into its own dedicated class. The host object (e.g., `Sprite`, `Text`, `Shape`) retains a named property (typically `transform`) that holds an instance of this class. The host is responsible only for behaviour specific to itself.

### Structure

```basic
' Host class (Sprite) contains a Transform instance
Sub Sprite_Initialize(x As Float, y As Float, ...)
    ' dim the composed object in the constructor
    dim transform as ObjectTransform
    ...
End Sub
```

### User-Facing API

Callers access shared functionality through the composition:

```basic
' Accessing transform through composition
bunny.transform.setPosition(100, 50)
newX = bunny.transform.x()
newY = bunny.transform.y()
bunny.transform.setRotation(45)
bunny.transform.setScale(2.0, 2.0)

' Host-specific methods remain on the host
bunny.setAlpha(0.5)           ' Sprite-specific
bunny.setAngle(30)            ' Sprite-specific
label.setText("Hello")        ' Text-specific
```

## The Three Principles

1. **Reusable functionality becomes a class property**
   - Extract common behaviour (position, rotation, scale) into a dedicated class.
   - Host objects hold a named instance of this class as a property (e.g., `dim transform as ObjectTransform`).
   - Methods are not duplicated; they live in the reusable class.

2. **Shared without inheritance**
   - Multiple display objects (Sprite, Text, Shape, Tile) can all compose the same Transform class.
   - No need for a common ancestor; composition is more flexible than inheritance.
   - Reduces coupling and avoids brittle hierarchies.

3. **Specific implementations stay on the main class**
   - Behaviour unique to a class (e.g., `setAlpha` for Sprite, `setText` for Text) remains as methods on that class.
   - Composition does not replace the host class; it enhances it with shared functionality.

## When to Use This Pattern

Use composition for reusable state or behaviour that is **genuinely shared** across multiple display objects:
- Transform properties (position, rotation, scale) that many objects need.
- Common visual state that multiple classes would otherwise duplicate.

**Do not** use composition for behaviour that belongs to a single class only, even if it could be extracted. Composition is for genuine sharing, not arbitrary modularity.

## Implementation Notes

- The composed object is `dim`'d in the host's constructor.
- All access flows through the named property: `host.propertyName.method()`.
- Two-level chaining is required by the current implementation; Monaco completion for `transform.*` is a future enhancement pending completion provider extensions.

## Reference

See `ObjectTransform` in the display object source code for a concrete example of this pattern.
