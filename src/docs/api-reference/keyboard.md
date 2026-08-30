# keyboard

The `keyboard` module is a set of named **key codes** — nothing else, no
functions. Pass them to `input.getKeyDown`, `input.keyPressed`, or
`input.keyReleased` instead of remembering raw numbers.

```basic
function onupdate(delta)
    if input.getKeyDown(keyboard.LEFT) then
        player.transform.x = player.transform.x - 100 * delta / 1000
    endif
    if input.keyPressed(keyboard.SPACE) then
        fireBullet()
    endif
endfunction
```

These are constants, so you cannot change them, and you write them in capitals
by convention.

## Key constants

| Name | Key |
|------|-----|
| `keyboard.LEFT` `keyboard.UP` `keyboard.RIGHT` `keyboard.DOWN` | Arrow keys |
| `keyboard.SPACE` | Spacebar |
| `keyboard.ENTER` | Enter / Return |
| `keyboard.ESCAPE` | Esc |
| `keyboard.TAB` | Tab |
| `keyboard.BACKSPACE` | Backspace |
| `keyboard.DELETE` | Delete |
| `keyboard.HOME` `keyboard.END` | Home / End |
| `keyboard.SHIFT` `keyboard.CTRL` `keyboard.ALT` | Modifier keys |
| `keyboard.A` … `keyboard.Z` | Letter keys |
| `keyboard.DIGIT_0` … `keyboard.DIGIT_9` | Number-row digit keys |

Function keys and the numeric keypad are not included yet.
