# world

The `world` module adds, removes, and clears objects in the game world — the scrollable space that the camera moves through. Objects added with `world.add` move with the camera. Use `hud.add` for score displays and other screen-fixed elements. Include the **softGfx** package to use it.

---

## world.add(obj)

Adds an object to the world so it becomes visible and moves with the camera.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| obj       | object | A sprite, animatedsprite, text, or tilemap instance |

```bas
function onenter()
  dim enemy = new sprite("enemy.png")
  enemy.setPosition(800, 300)
  world.add(enemy)
endfunction
```

---

## world.remove(obj)

Removes an object from the world so it is no longer visible.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| obj       | object | The object to remove |

```bas
world.remove(self.enemy)
```

---

## world.clear()

Removes all world objects at once.

```bas
function onenter()
  world.clear()
endfunction
```
