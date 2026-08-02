# save

The `save` module stores your game's own values — scores, inventory, progress — without you having to convert them to text yourself. It's built on top of [file](file), and keeps everything for a project as one saved bundle.

## set(key, value)

Saves a single value under a name. `value` can be a number, a string, an array, or a dictionary.

| Parameter | Type                          | Description |
|-----------|-------------------------------|-------------|
| key       | string                        | A name for this value, e.g. `"highscore"` |
| value     | number, string, array, or object | The value to save |

```bas
save.set("highscore", 4200)
```

## get(key)

Loads a value previously saved under a name.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| key       | string | The name passed to `set` earlier |

**Returns:** whatever was saved — number, string, array, or object — or an empty string `""` if nothing has been saved under that name yet.

```bas
dim highscore
highscore = save.get("highscore")
print highscore
```

## exists(key)

Checks whether a value has been saved under a name yet.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| key       | string | The name to check |

**Returns:** true or false

```bas
if save.exists("highscore") == true
  print "You have a saved high score!"
endif
```

## delete(key)

Removes a single saved value. Does nothing if there was nothing saved under that name.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| key       | string | The name to remove |

```bas
save.delete("highscore")
```

## setAll(data)

Saves an entire dictionary of values at once, **replacing everything previously saved** — including any values saved individually with `set`. Use this when your game keeps all of its save data in one dictionary and saves it all together.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| data      | object | A dictionary of everything to save |

```bas
dim state[]
state["level"] = 3
state["score"] = 4200
save.setAll(state)
```

> **Note:** `data` must be a dictionary. Passing anything else (a number, a string, an array) will cause an error.

## getAll()

Loads everything previously saved, as a single dictionary.

**Returns:** object — a dictionary of everything saved. Empty if nothing has been saved yet.

```bas
dim state
state = save.getAll()
print state["level"]
```
