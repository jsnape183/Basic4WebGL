# hud

The `hud` module adds, removes, and clears objects on the HUD layer — a fixed overlay that does not move when the camera scrolls. Use it for score text, health bars, timers, and other screen-fixed elements. Objects added with `world.add` scroll with the camera; objects added with `hud.add` stay in place. Include the **softGfx** package to use it.

---

## hud.add(obj)

Adds an object to the HUD layer so it stays fixed on screen regardless of camera position.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| obj       | object | A sprite, animatedsprite, or text instance |

```bas
function onenter()
  dim scoreLabel = new text()
  scoreLabel.setText("Score: 0")
  scoreLabel.setPosition(20, 20)
  hud.add(scoreLabel)
endfunction
```

---

## hud.remove(obj)

Removes an object from the HUD layer so it is no longer visible.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| obj       | object | The object to remove |

```bas
hud.remove(self.scoreLabel)
```

---

## hud.clear()

Removes all HUD objects at once.

```bas
hud.clear()
```
