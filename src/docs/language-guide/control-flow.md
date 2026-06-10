# Control Flow

## if / endif

```bas
if score > 100 then
  print "High score!"
endif
```

## if / else / endif

```bas
if lives > 0 then
  respawn()
else
  gameOver()
endif
```

## while / wend

```bas
while lives > 0
  playRound()
wend
```

## for / next

```bas
dim i
for i = 1 to 10
  print i
next i
```

Step value:

```bas
for i = 10 to 1 step -1
  print i
next i
```

## Related Topics

- [Operators](operators)
- [Functions](functions)
