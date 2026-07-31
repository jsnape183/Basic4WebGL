# text

The `text` class renders a string of text on the canvas. Extend it using `Extends text` in your class file.

Unlike [sprite](sprite) and [tilemap](tilemap), `text` does not have a `.transform` property. Use `setPosition(x, y)` directly to move it.

## Constructor

```bas
Class
Extends text

Constructor()
  super("Score: 0", 20, 20)
  world.add(self)
EndConstructor
```

| Parameter | Type   | Description |
|-----------|--------|-------------|
| content   | string | The text to display |
| x         | number | Horizontal position in pixels |
| y         | number | Vertical position in pixels |

## setText(content)

Changes the displayed text.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| content   | string | The new text to show |

```bas
self.setText("Score: " + str(score))
```

## setPosition(x, y)

Moves the text to a new position.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Horizontal position in pixels |
| y         | number | Vertical position in pixels |

```bas
self.setPosition(world.width() - 100, 20)
```

## setAlpha(a)

Sets the transparency of the text.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | number | Opacity from 0 (invisible) to 1 (fully visible) |

```bas
self.setAlpha(0.5)
```

## setStyle(size, r, g, b)

Sets the font size and colour.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| size      | number | Font size in points |
| r         | number | Red component of the colour, 0–255 |
| g         | number | Green component, 0–255 |
| b         | number | Blue component, 0–255 |

```bas
self.setStyle(24, 255, 255, 0)
```

## setFont(fontFamily)

Sets the font used to draw the text. Use a common web-safe font name such as `"Arial"`, `"Courier New"`, `"Georgia"`, or `"Verdana"`.

| Parameter  | Type   | Description |
|------------|--------|-------------|
| fontFamily | string | Name of the font to use |

```bas
self.setFont("Courier New")
```

## setAlign(align)

Sets how the text lines up when it wraps onto more than one line. Has no visible effect on a single line of text.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| align     | string | `"left"`, `"center"`, or `"right"` |

```bas
self.setAlign("center")
```
