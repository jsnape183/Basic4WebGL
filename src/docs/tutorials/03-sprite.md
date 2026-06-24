# Tutorial 3: Your First Sprite

In this tutorial you'll load an image onto the canvas as a sprite and position it precisely on screen.

## What you'll build

A spaceship image placed in the centre of the canvas, ready to be moved in the next tutorial.

## What you'll need

A small image for your spaceship — anything works, even a 32×32 pixel PNG you draw yourself. Name it `ship.png`.

You can use this one:

![ship.png](/ship.png)

## Step 1: Upload your image

In the editor, click the **Assets** tab in the file panel and upload your image. Give it the name `ship.png`.

## Step 2: Understand how sprites work

Unlike shapes from the drawing module, sprites are game objects. Every sprite in softBASIC needs its own **class file**. Don't worry about what that means yet — we'll explain classes properly in Tutorial 10. For now, just follow the pattern.

## Step 3: Create the Player class file

Click **+** in the file panel and create a new file called `Player`. Type this exactly:

```bas
Class
Extends sprite

Constructor()
  super("ship.png")
  self.transform.setPosition(320, 180)
  world.add(self)
EndConstructor
```

This file describes your player ship. Line by line:
- `Class` — this file defines a class (a type of game object)
- `Extends sprite` — this class is a sprite (an image on screen)
- `Constructor()` — this code runs when a Player is created
- `super("ship.png")` — loads the image
- `self.transform.setPosition(320, 180)` — places it at the centre of the 640×360 canvas
- `world.add(self)` — makes it visible

## Step 4: Create the Player in Main

Open `Main.bas` and add an `onenter` function that creates a Player:

```bas
function onenter()
  stage.setBackground(10, 10, 30)
  dim player = new Player()
endfunction
```

`dim player = new Player()` creates a Player object. Its constructor runs immediately, loading the image and adding it to the stage.

## Step 5: Run it

Click **Run**. Your ship image should appear in the centre of a dark canvas.

If you see a white square instead of your image, check that the filename in `super(...)` exactly matches the name you gave the asset.

## Step 6: Change the position

Try different positions by changing the numbers in `setPosition(x, y)`:

```bas
self.transform.setPosition(100, 100)   ' near top-left
self.transform.setPosition(320, 180)   ' centre
self.transform.setPosition(540, 300)   ' near bottom-right
```

## Complete code

**Player.bas**

```bas
Class
Extends sprite

Constructor()
  super("ship.png")
  self.transform.setPosition(320, 180)
  world.add(self)
EndConstructor
```

**Main.bas**

```bas
function onenter()
  stage.setBackground(10, 10, 30)
  dim player = new Player()
endfunction
```

## What you've learned

- Sprites need a class file that `Extends sprite`
- `Constructor()` runs when the object is created
- `super("image.png")` loads the image
- `self.transform.setPosition(x, y)` places the sprite on screen
- `world.add(self)` makes it visible
- `dim name = new ClassName()` creates an object in Main

## Next up

[Tutorial 4: Making Things Move →](tutorial-04-motion)
