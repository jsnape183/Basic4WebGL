# Dictionaries

A dictionary stores values under named keys. Each key maps to one value, and you can look up, add, or replace values at any time using square bracket syntax.

## Declaring a dictionary

Use `dim` with empty square brackets:

```bas
dim scores[]
dim inventory[]
```

Dictionaries are always empty at creation — you cannot set values in the declaration line.

## Setting values

Assign to any key using square brackets. Keys can be strings or numbers:

```bas
scores["Alice"] = 100
scores["Bob"] = 80
scores[1] = 999
```

If the key already exists, its value is replaced.

## Reading values

Read a value using the same square bracket syntax:

```bas
print scores["Alice"]   ' 100

dim x
x = scores["Bob"]
```

If the key does not exist, the game stops with the error: `Dictionary key not found: "Alice"`. Use `array.contains(d, key)` to check before reading if the key might be missing.

## Checking and removing keys

The shared collection functions work with dictionaries as well as arrays:

```bas
' Check if a key exists
if array.contains(scores, "Alice") = true
  print scores["Alice"]
endif

' Remove a key
array.remove(scores, "Bob")

' Count the number of keys
print array.length(scores)

' Empty the dictionary
array.clear(scores)
```

## Getting all keys or values

Use `dict.keys` and `dict.values` to get arrays you can work with:

```bas
dim inventory[]
inventory["sword"] = 1
inventory["potion"] = 5
inventory["shield"] = 1

dim k
k = dict.keys(inventory)
print array.length(k)   ' 3
print array.join(k, ", ")  ' sword, potion, shield

dim v
v = dict.values(inventory)
print array.join(v, ", ")  ' 1, 5, 1
```

## String vs number keys

String key `"5"` and number key `5` are different keys — they do not collide:

```bas
dim d[]
d["5"] = "five as string"
d[5]   = "five as number"

print d["5"]   ' five as string
print d[5]     ' five as number
```

## Iterating over a dictionary

To loop over all keys, get them as an array first and use a `for` loop:

```bas
dim scores[]
scores["Alice"] = 100
scores["Bob"] = 80

dim k
k = dict.keys(scores)

dim i
for i = 0 to array.length(k) - 1
  print k(i)
  print scores[k(i)]
next i
```
