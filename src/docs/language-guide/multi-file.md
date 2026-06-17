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

The compiler resolves file dependencies automatically. You do not need to arrange your files in any particular order — the compiler analyses what each file references and ensures dependencies are compiled first.

For example, if `Main.bas` creates a `new Enemy()` and `Enemy.bas` is defined elsewhere in the project, `Enemy.bas` will always be compiled before `Main.bas` regardless of where it appears in the file panel.

Circular dependencies — where file A depends on file B and file B depends on file A — are not allowed. If a circular dependency is detected, a clear error appears in the console panel when you run the project.

## Naming

The identifier for a file is always the filename lowercased with no extension:
- `Player.bas` → `player`
- `EnemySpawner.bas` → `enemyspawner`
- `Main.bas` → `main`

## Related Topics

- [Modules](modules)
- [Classes](classes)
- [Class Composition](class-composition)
