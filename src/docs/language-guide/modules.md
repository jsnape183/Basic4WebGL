# Modules

Every `.bas` file is a **module** by default. A module is a static class — all variables and functions belong to the type itself, not to instances.

## Declaration

No declaration keyword is needed. A file with no `Class` keyword on line 1 is automatically a module.

```bas
dim score
dim lives

function onenter()
  score = 0
  lives = 3
endfunction

function onupdate(delta)
  ' game logic here
endfunction
```

## Variable Scope

Variables declared with `dim` at the top level of a module belong to the module itself. They persist for the lifetime of the scene.

## Lifecycle Functions

Modules participate in the engine lifecycle: `onenter`, `onupdate`, `onkeydown`, `onkeyup`. See [Lifecycle Functions](lifecycle) for details.

## Using Modules from Other Files

In a multi-file project, one module can call functions on another using the filename (lowercase, no extension) as the identifier.

```bas
' In Main.bas — calls a function in scoreboard.bas
scoreboard.addPoints(10)
```

See [Multi-file Projects](multi-file) for details.
