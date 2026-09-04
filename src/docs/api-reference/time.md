# time

The `time` module gives you the real (wall-clock) clock. Use it to measure how long something actually takes, or to run a timer that keeps counting even while the game is paused. It is part of the **softCore** package, so it is always available.

This is different from the `delta` value your `onupdate` function receives. That `delta` is the game's *fixed simulation step* — it is always the same size, no matter how fast or slow the machine is really running. `time.now()` follows real time instead.

---

## time.now()

Returns the current time in milliseconds, measured from an arbitrary starting point. The number only ever goes up. On its own the value means nothing — subtract one reading from a later one to get how many milliseconds passed in between.

**Returns:** number

```bas
' Measure how long the enemy update takes this frame.
function onupdate(delta)
  dim start
  dim elapsed
  start = time.now()
  self.updateAllEnemies()
  elapsed = time.now() - start
  self.debugText.setText(string.str(math.floor(elapsed)) + " ms")
endfunction
```

```bas
' A real-time cooldown: the dash recharges over 3 real seconds even if the
' game slows down or the player opens a pause menu.
function onenter()
  self.dashReadyAt = time.now()
endfunction

function tryDash()
  if time.now() >= self.dashReadyAt then
    self.doDash()
    self.dashReadyAt = time.now() + 3000
  endif
endfunction
```
