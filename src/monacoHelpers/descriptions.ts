// src/monacoHelpers/descriptions.ts
//
// IDE documentation strings for every first-party library symbol.
// Keyed by [moduleName][methodName]. Use 'constructor' for class constructors.
// These strings appear in completions, hover tooltips, and signature help.

export const DESCRIPTIONS: Record<string, Record<string, string>> = {
  sprite: {
    constructor: 'Creates a sprite from a named image asset in the project.',
    setAngle: 'Rotates the sprite to the given angle in degrees.',
    setAlpha: 'Sets the sprite opacity. 0.0 = invisible, 1.0 = fully opaque.',
  },
  text: {
    constructor: 'Creates a text display object with the given content at position (x, y).',
    setText: 'Updates the displayed text string.',
    setPosition: 'Moves the text object to coordinates (x, y).',
    setAlpha: 'Sets the text opacity. 0.0 = invisible, 1.0 = fully opaque.',
  },
  gfx: {
    boxCollide: "Returns true if two display objects' bounding boxes overlap.",
    getKeyDown: 'Returns true if the specified key is currently held down. Use key codes such as "ArrowUp", "Space", "KeyA".',
  },
  drawing: {
    drawLine: 'Draws a line from (x, y) to (x2, y2) using the current pen style.',
    drawRect: 'Draws a filled rectangle at (x, y) with the given width and height.',
    drawCircle: 'Draws a filled circle centred at (x, y) with the given radius.',
  },
  stage: {
    add: 'Adds a display object (Sprite or Text) to the visible stage.',
    remove: 'Removes a display object from the stage.',
    clear: 'Removes all display objects from the stage.',
  },
  pen: {
    setFillColor: 'Sets the fill colour for drawing operations. RGB values are 0–255.',
    setLineColor: 'Sets the stroke colour for drawing operations. RGB values are 0–255.',
  },
  assetmanager: {
    loadImage: 'Loads an image asset by filename and returns a reference to it.',
  },
  math: {
    abs: 'Returns the absolute value of n.',
    acos: 'Returns the arccosine of n in radians.',
    acosh: 'Returns the hyperbolic arccosine of n.',
    asin: 'Returns the arcsine of n in radians.',
    asinh: 'Returns the hyperbolic arcsine of n.',
    atan: 'Returns the arctangent of n in radians.',
    atan2: 'Returns the angle in radians between the positive x-axis and the point (n2, n1).',
    atanh: 'Returns the hyperbolic arctangent of n.',
    cbrt: 'Returns the cube root of n.',
    ceil: 'Returns n rounded up to the nearest integer.',
    cos: 'Returns the cosine of n (n in radians).',
    cosh: 'Returns the hyperbolic cosine of n.',
    euler: "Returns Euler's number e ≈ 2.718.",
    exp: 'Returns e raised to the power n.',
    floor: 'Returns n rounded down to the nearest integer.',
    log: 'Returns the natural logarithm of n.',
    log2: 'Returns the base-2 logarithm of n.',
    log10: 'Returns the base-10 logarithm of n.',
    pi: 'Returns π ≈ 3.14159.',
    pow: 'Returns x raised to the power y.',
    random: 'Returns a random number between 0 (inclusive) and max (exclusive).',
    round: 'Returns n rounded to the nearest integer.',
    sign: 'Returns 1 if n > 0, −1 if n < 0, or 0 if n = 0.',
    sin: 'Returns the sine of n (n in radians).',
    sinh: 'Returns the hyperbolic sine of n.',
    sqrt: 'Returns the square root of n.',
    tan: 'Returns the tangent of n (n in radians).',
    tanh: 'Returns the hyperbolic tangent of n.',
    trunc: 'Returns n with the fractional part removed (rounds toward zero).',
    val: 'Converts a string to a number.',
  },
  string: {
    len: 'Returns the number of characters in string s.',
    lcase: 'Returns s converted to lowercase.',
    ucase: 'Returns s converted to uppercase.',
    str: 'Converts a number n to its string representation.',
    substr: 'Returns the substring of s from index start to end (exclusive).',
    split: 'Splits string s by delimiter c and returns an array of substrings.',
    trim: 'Returns s with leading and trailing whitespace removed.',
    padstart: 'Pads the beginning of s with character p until the string reaches length n.',
    padend: 'Pads the end of s with character p until the string reaches length n.',
  },
  array: {
    arrLength: 'Returns the number of elements in array a.',
    join: 'Joins all elements of array a into a string, separated by s.',
  },
  objecttransform: {
    setPosition: 'Move object to absolute position',
    x: 'Get current X coordinate',
    y: 'Get current Y coordinate',
  },
};
