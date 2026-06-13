# math

The `math` module provides mathematical functions. It is part of the **softCore** package.

## Basic Arithmetic

### abs(n)

Returns the absolute (positive) value of a number.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number — the positive version of `n`.

```bas
dim result
result = math.abs(-5)   ' result is 5
```

### pow(base, exponent)

Raises a number to a power.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| base      | number | The number to raise |
| exponent  | number | The power to raise it to |

**Returns:** number

```bas
dim result
result = math.pow(2, 8)   ' result is 256
```

### sqrt(n)

Returns the square root of a number.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | A non-negative number |

**Returns:** number

```bas
dim result
result = math.sqrt(16)   ' result is 4
```

### cbrt(n)

Returns the cube root of a number.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

```bas
dim result
result = math.cbrt(27)   ' result is 3
```

### sign(n)

Returns -1 if `n` is negative, 0 if `n` is zero, or 1 if `n` is positive.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

```bas
dim s
s = math.sign(-5)   ' s is -1
```

## Rounding

### floor(n)

Rounds a number down to the nearest whole number.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

```bas
dim result
result = math.floor(3.9)   ' result is 3
```

### ceil(n)

Rounds a number up to the nearest whole number.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

```bas
dim result
result = math.ceil(3.1)   ' result is 4
```

### round(n)

Rounds a number to the nearest whole number.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

```bas
dim result
result = math.round(3.5)   ' result is 4
```

### trunc(n)

Removes the decimal part of a number without rounding.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

```bas
dim result
result = math.trunc(3.9)   ' result is 3
```

## Random Numbers

### random(max)

Returns a random decimal number from 0 up to (but not including) `max`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| max       | number | The upper limit (not included in results) |

**Returns:** number

```bas
dim roll
roll = math.random(1.0)   ' a random float between 0 and 1
```

### randomint(max)

Returns a random whole number from 0 up to (but not including) `max`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| max       | number | The number of possible values (results range from 0 to max-1) |

**Returns:** number

```bas
dim side
side = math.randomint(4)   ' gives 0, 1, 2, or 3
```

## Comparison

### min(a, b)

Returns the smaller of two numbers.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | number | First number |
| b         | number | Second number |

**Returns:** number

```bas
health = math.min(health, 100)   ' caps health at 100
```

### max(a, b)

Returns the larger of two numbers.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | number | First number |
| b         | number | Second number |

**Returns:** number

```bas
health = math.max(health, 0)   ' prevents health going below 0
```

### clamp(value, min, max)

Keeps a number within a range. If `value` is less than `min`, returns `min`. If greater than `max`, returns `max`. Otherwise returns `value`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| value     | number | The number to clamp |
| min       | number | Lower bound |
| max       | number | Upper bound |

**Returns:** number

```bas
speed = math.clamp(speed, 0, 10)
```

## Distance and Interpolation

### distance(x1, y1, x2, y2)

Returns the straight-line distance between two points.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x1        | number | X coordinate of the first point |
| y1        | number | Y coordinate of the first point |
| x2        | number | X coordinate of the second point |
| y2        | number | Y coordinate of the second point |

**Returns:** number

```bas
dim dist
dist = math.distance(player.transform.x(), player.transform.y(), enemy.transform.x(), enemy.transform.y())
```

### lerp(a, b, t)

Smoothly blends between two values. When `t` is 0 the result is `a`; when `t` is 1 the result is `b`; values in between give a proportional blend.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | number | Start value |
| b         | number | End value |
| t         | number | Blend amount, 0–1 |

**Returns:** number

```bas
dim smoothX
smoothX = math.lerp(currentX, targetX, 0.1)   ' moves 10% closer each frame
```

## Trigonometry

### sin(angle)

Returns the sine of an angle in radians.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| angle     | number | Angle in radians |

**Returns:** number

```bas
dim y
y = math.sin(angle) * radius
```

### cos(angle)

Returns the cosine of an angle in radians.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| angle     | number | Angle in radians |

**Returns:** number

```bas
dim x
x = math.cos(angle) * radius
```

### tan(angle)

Returns the tangent of an angle in radians.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| angle     | number | Angle in radians |

**Returns:** number

```bas
dim slope
slope = math.tan(angle)
```

### asin(n)

Returns the arcsine (inverse sine) of `n` in radians.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | A value between -1 and 1 |

**Returns:** number

```bas
dim angle
angle = math.asin(0.5)   ' approximately 0.524 radians
```

### acos(n)

Returns the arccosine (inverse cosine) of `n` in radians.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | A value between -1 and 1 |

**Returns:** number

```bas
dim angle
angle = math.acos(0.5)   ' approximately 1.047 radians
```

### atan(n)

Returns the arctangent (inverse tangent) of `n` in radians.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

```bas
dim angle
angle = math.atan(1)   ' approximately 0.785 radians (45 degrees)
```

### atan2(y, x)

Returns the angle in radians between the positive x-axis and the point `(x, y)`. Useful for pointing a sprite towards a target.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| y         | number | Vertical distance to target |
| x         | number | Horizontal distance to target |

**Returns:** number — angle in radians.

```bas
dim angle
angle = math.atan2(targetY - selfY, targetX - selfX)
```

### sinh(n)

Returns the hyperbolic sine of `n`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

```bas
dim result
result = math.sinh(1)   ' approximately 1.175
```

### cosh(n)

Returns the hyperbolic cosine of `n`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

```bas
dim result
result = math.cosh(1)   ' approximately 1.543
```

### tanh(n)

Returns the hyperbolic tangent of `n`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

```bas
dim result
result = math.tanh(1)   ' approximately 0.762
```

### asinh(n)

Returns the inverse hyperbolic sine of `n`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

```bas
dim result
result = math.asinh(1)   ' approximately 0.881
```

### acosh(n)

Returns the inverse hyperbolic cosine of `n`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | A number ≥ 1 |

**Returns:** number

```bas
dim result
result = math.acosh(2)   ' approximately 1.317
```

### atanh(n)

Returns the inverse hyperbolic tangent of `n`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | A value between -1 and 1 |

**Returns:** number

```bas
dim result
result = math.atanh(0.5)   ' approximately 0.549
```

## Logarithms and Exponents

### exp(n)

Returns e raised to the power `n`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | The exponent |

**Returns:** number

```bas
dim result
result = math.exp(1)   ' result is approximately 2.718
```

### log(n)

Returns the natural logarithm of `n`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | A positive number |

**Returns:** number

```bas
dim result
result = math.log(math.euler())   ' result is 1
```

### log2(n)

Returns the base-2 logarithm of `n`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | A positive number |

**Returns:** number

```bas
dim result
result = math.log2(8)   ' result is 3
```

### log10(n)

Returns the base-10 logarithm of `n`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | A positive number |

**Returns:** number

```bas
dim result
result = math.log10(1000)   ' result is 3
```

## Constants

### pi()

Returns the mathematical constant π (approximately 3.14159).

**Returns:** number

```bas
dim circumference
circumference = 2 * math.pi() * radius
```

### euler()

Returns Euler's number e (approximately 2.71828).

**Returns:** number

```bas
dim result
result = math.euler()   ' result is approximately 2.718
```

## Conversion

### val(s)

Converts a string to a number.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | A string containing a number, e.g. `"42"` |

**Returns:** number

```bas
dim n
n = math.val("42")   ' n is 42
```
