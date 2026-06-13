# Tutorial 1: Hello World

Welcome to Basic4WebGL! In this tutorial you'll write your first program and get comfortable with the editor.

## What you'll build

A program that prints messages to the console and does some maths. Nothing on screen yet — just getting familiar with the tools.

## Step 1: Create a new project

On the Projects page, click **New Project** and give it a name like `Hello World`. This opens the editor with a single file, `Main.bas`.

## Step 2: Print a message

Type the following in `Main.bas`:

```bas
print "Hello, world!"
```

Click **Run**. The console panel at the bottom shows:

```
Hello, world!
```

`print` outputs any value — text, numbers, or expressions.

## Step 3: Print some numbers

Add a few more lines:

```bas
print "Hello, world!"
print 42
print 3.14
```

Run it again. Each `print` appears on its own line.

## Step 4: Do some maths

You can print the result of any calculation:

```bas
print 10 + 5
print 100 - 25
print 6 * 7
print 20 / 4
```

This prints `15`, `75`, `42`, `5`.

## Step 5: Store a value in a variable

Variables let you name a value and use it later:

```bas
dim score
score = 0
score = score + 10
print score
```

`dim` declares the variable. The next lines set and update its value. This prints `10`.

## Step 6: Combine text and numbers

Use `string.str()` to convert a number to text so you can join it with a string:

```bas
dim lives
lives = 3
print "Lives remaining: " + string.str(lives)
```

This prints `Lives remaining: 3`.

## Complete code

```bas
print "Hello, world!"

dim score
score = 0
score = score + 10
print "Score: " + string.str(score)

dim lives
lives = 3
print "Lives remaining: " + string.str(lives)
```

## What you've learned

- How to create a project and run code
- `print` outputs values to the console
- `dim` declares a variable
- `string.str()` converts a number to text for joining with strings

## Next up

[Tutorial 2: Drawing on Screen →](tutorial-02-drawing)
