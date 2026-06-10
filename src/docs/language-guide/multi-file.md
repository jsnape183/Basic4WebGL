# Multi-file Projects

A softBASIC project can contain multiple `.bas` files. Each file is either a module or a class, and they can reference each other.

## Calling Between Files

Use the filename (lowercase, no extension) as the identifier to call functions on another module or create instances of a class.

**main.bas calling scoreboard.bas:**
```bas
scoreboard.addPoints(10)
scoreboard.reset()
```

**Instantiating a class from another file:**
```bas
' Enemy.bas defines the enemy class
dim e as enemy(100, 50)
```

## Load Order

All files in a project are compiled together. There is no explicit import — every file is available to every other file by its filename identifier.

## Naming

The identifier for a file is always the filename lowercased with no extension:
- `Player.bas` → `player`
- `EnemySpawner.bas` → `enemyspawner`
- `Main.bas` → `main`

## Related Topics

- [Modules](modules)
- [Classes](classes)
- [Class Composition](class-composition)
