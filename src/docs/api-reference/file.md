# file

The `file` module lets your game save and load its own text data — a high score, a player's progress, or anything else that should still be there the next time someone plays. Data is stored in the player's browser and stays there between visits.

If you're saving structured data like scores and inventory together, the [save](save) module is usually easier — it handles the conversion to and from text for you.

## write(path, content)

Saves text under a name you choose. If something is already saved under that name, it's replaced.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| path      | string | A name for this piece of data, e.g. `"progress.txt"` |
| content   | string | The text to save |

```bas
file.write("progress.txt", "level 3")
```

## read(path)

Loads text previously saved under a name.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| path      | string | The name passed to `write` earlier |

**Returns:** string — the saved text, or an empty string `""` if nothing has been saved under that name yet.

```bas
dim progress
progress = file.read("progress.txt")
print progress
```

## exists(path)

Checks whether anything has been saved under a name yet.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| path      | string | The name to check |

**Returns:** true or false

```bas
if file.exists("progress.txt") == true
  print "Welcome back!"
endif
```

## delete(path)

Removes whatever was saved under a name. Does nothing if there was nothing saved there.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| path      | string | The name to remove |

```bas
file.delete("progress.txt")
```
