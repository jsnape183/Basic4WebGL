# dict

The `dict` module provides functions for working with dictionaries.

A dictionary stores values under named keys. Use `dim name[]` to declare one, square brackets to set and get values, and `dict.*` functions for common operations.

---

## keys

Returns an array containing all keys in the dictionary.

| Parameter | Type | Description |
|---|---|---|
| `dic` | object | The dictionary to read from |

**Returns:** array — the keys as a new array.

```bas
dim scores[]
scores["Alice"] = 100
scores["Bob"] = 80

dim k
k = dict.keys(scores)
print array.arrLength(k)   ' 2
```

---

## values

Returns an array containing all values in the dictionary.

| Parameter | Type | Description |
|---|---|---|
| `dic` | object | The dictionary to read from |

**Returns:** array — the values as a new array.

```bas
dim scores[]
scores["Alice"] = 100
scores["Bob"] = 80

dim v
v = dict.values(scores)
print array.join(v, ", ")   ' 100, 80
```

---

## joinKeys

Joins all keys in the dictionary into a single string, separated by a delimiter.

| Parameter | Type | Description |
|---|---|---|
| `dic` | object | The dictionary |
| `sep` | string | The separator string |

**Returns:** string — keys joined by the separator.

```bas
dim inventory[]
inventory["sword"] = 1
inventory["shield"] = 1

dim s
s = dict.joinKeys(inventory, ", ")
print s   ' sword, shield
```
