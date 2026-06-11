# pen

The `pen` module controls the colours and line thickness used by the [drawing](drawing) module. Call these functions before calling `drawLine`, `drawRect`, or `drawCircle` to set the style.

## setFillColor(r, g, b)

Sets the colour used to fill shapes drawn after this call.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| r         | number | Red component, 0–255 |
| g         | number | Green component, 0–255 |
| b         | number | Blue component, 0–255 |

```bas
setFillColor(255, 0, 0)
drawCircle(100, 100, 30)
```

## setLineColor(r, g, b)

Sets the colour of lines and shape outlines drawn after this call.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| r         | number | Red component, 0–255 |
| g         | number | Green component, 0–255 |
| b         | number | Blue component, 0–255 |

```bas
setLineColor(255, 255, 255)
drawLine(0, 0, 200, 200)
```

## setLineWidth(n)

Sets the thickness of lines drawn after this call.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Line thickness in pixels |

```bas
setLineWidth(3)
drawRect(10, 10, 80, 40)
```
