# API Reference Documentation Design

## Summary

Populate the API Reference section of the softBASIC docs with function and method documentation for all modules in the softGfx and softCore packages. The sidebar groups modules by package name. Each module page documents every function and method with parameter descriptions, types, a plain-English explanation, and a code example. The audience is beginners — no JavaScript internals are referenced anywhere.

---

## Manifest Changes

### New interface

```ts
export interface DocGroup {
  label: string;       // Package name: "softGfx", "softCore"
  topics: DocTopic[];  // Module pages in this package
}
```

### Updated DocSection

```ts
export interface DocSection {
  id: string;
  label: string;
  topics: DocTopic[];       // Flat list — used by Language Guide (unchanged)
  groups?: DocGroup[];      // Package groups — used by API Reference
}
```

### New helper

```ts
export function getSectionTopics(section: DocSection): DocTopic[] {
  if (section.groups) {
    return section.groups.flatMap(g => g.topics);
  }
  return section.topics;
}
```

Used by `DocsContent` (slug lookup, prev/next) and `DocsSidebar` (active state). Language Guide behaviour is unchanged.

### api-reference entry in docsManifest

```ts
{
  id: 'api-reference',
  label: 'API Reference',
  topics: [],
  groups: [
    {
      label: 'softGfx',
      topics: [
        { slug: 'gfx',             title: 'gfx',             file: 'api-reference/gfx.md' },
        { slug: 'drawing',         title: 'drawing',         file: 'api-reference/drawing.md' },
        { slug: 'stage',           title: 'stage',           file: 'api-reference/stage.md' },
        { slug: 'pen',             title: 'pen',             file: 'api-reference/pen.md' },
        { slug: 'assetmanager',    title: 'assetmanager',    file: 'api-reference/assetmanager.md' },
        { slug: 'objecttransform', title: 'ObjectTransform', file: 'api-reference/objecttransform.md' },
        { slug: 'sprite',          title: 'sprite',          file: 'api-reference/sprite.md' },
        { slug: 'animatedsprite',  title: 'animatedsprite',  file: 'api-reference/animatedsprite.md' },
        { slug: 'text',            title: 'text',            file: 'api-reference/text.md' },
        { slug: 'tilemap',         title: 'tilemap',         file: 'api-reference/tilemap.md' },
      ],
    },
    {
      label: 'softCore',
      topics: [
        { slug: 'math',   title: 'math',   file: 'api-reference/math.md' },
        { slug: 'string', title: 'string', file: 'api-reference/string.md' },
        { slug: 'array',  title: 'array',  file: 'api-reference/array.md' },
      ],
    },
  ],
}
```

---

## Sidebar Changes

`DocsSidebar` is updated to handle grouped sections. When `section.groups` exists, each group renders as:

1. A non-clickable package label above its topics
2. Module links indented beneath the label

```
softGfx                   ← non-clickable, text-xs uppercase muted label
  gfx
  drawing
  stage
  pen
  assetmanager
  ObjectTransform
  sprite
  animatedsprite
  text
  tilemap
softCore
  math
  string
  array
```

Package label styling: `text-xs text-ds-text-dim uppercase tracking-wider px-4 pt-4 pb-1`
Topic links: same active/inactive styling as Language Guide (`border-l-2 border-ds-accent` when active)

---

## DocsContent Changes

Replace direct `section.topics` usage with `getSectionTopics(section)`:

- Slug lookup: `getSectionTopics(section).findIndex(t => t.slug === slug)`
- Prev/next: derived from the same flat array
- Breadcrumb: `{section.label} › {topic.title}` — unchanged format

No other changes to DocsContent, DocsLayout, DocsTabs, or DocsPage.

---

## Content Files

13 markdown files in `src/docs/api-reference/`.

### Page format

Each page opens with a one-sentence description of what the module is for. Functions and methods follow this template:

```markdown
## functionName(param1, param2)

Plain-English description of what this does.

| Parameter | Type    | Description              |
|-----------|---------|--------------------------|
| param1    | number  | What this value controls |
| param2    | string  | What this value controls |

**Returns:** type — what comes back (omit for void functions).

```bas
' example showing real usage
```
```

Classes (sprite, animatedsprite, text, tilemap, ObjectTransform) open with a `## Constructor` section before listing methods.

### softGfx modules

| File | What it documents |
|------|------------------|
| `gfx.md` | `getKeyDown`, `mouseX`, `mouseY`, `mouseDown`, `boxCollide` |
| `drawing.md` | `drawLine`, `drawRect`, `drawCircle` |
| `stage.md` | `add`, `remove`, `clear`, `width`, `height`, `setBackground` |
| `pen.md` | `setFillColor`, `setLineColor`, `setLineWidth` |
| `assetmanager.md` | `loadImage` |
| `objecttransform.md` | Constructor, `setPosition`, `x`, `y` |
| `sprite.md` | Constructor, `setAngle`, `setAlpha`, `setScale`, `setFlip`, `setVisible`, `setTexture`, `width`, `height` — with note that position uses `self.transform` |
| `animatedsprite.md` | Constructor, `addAnim`, `play`, `isPlaying`, `setAngle`, `setAlpha`, `setScale`, `setFlip`, `setVisible`, `width`, `height` |
| `text.md` | Constructor, `setText`, `setPosition`, `setAlpha`, `setStyle` |
| `tilemap.md` | Constructor, `load`, `tileAt`, `widthPx`, `heightPx` — with note that position uses `self.transform` |

### softCore modules

| File | What it documents |
|------|------------------|
| `math.md` | All 39 math functions grouped by category (basic arithmetic, trigonometry, rounding, utility) |
| `string.md` | All 14 string functions |
| `array.md` | All 8 array functions |

### Writing style rules

- Written for beginners — no prior programming experience assumed beyond reading the Language Guide
- No references to JavaScript, `this`, PIXI, handles, or engine internals
- Parameter types use softBASIC vocabulary: `number`, `string`, `boolean` (described as true/false), `object` (for sprite/text/tilemap instances)
- Examples use realistic game-like scenarios (scores, enemies, players) not abstract `foo`/`bar`
- Cross-references: sprite and tilemap pages link to ObjectTransform for position control

---

## File Map

| File | Change |
|------|--------|
| `src/docs/manifest.ts` | Add `DocGroup` interface, `groups?` to `DocSection`, `getSectionTopics` helper, populate api-reference groups |
| `src/components/Docs/DocsSidebar.tsx` | Add grouped rendering for sections with `groups` |
| `src/components/Docs/DocsContent.tsx` | Replace `section.topics` with `getSectionTopics(section)` |
| `src/docs/api-reference/gfx.md` | New |
| `src/docs/api-reference/drawing.md` | New |
| `src/docs/api-reference/stage.md` | New |
| `src/docs/api-reference/pen.md` | New |
| `src/docs/api-reference/assetmanager.md` | New |
| `src/docs/api-reference/objecttransform.md` | New |
| `src/docs/api-reference/sprite.md` | New |
| `src/docs/api-reference/animatedsprite.md` | New |
| `src/docs/api-reference/text.md` | New |
| `src/docs/api-reference/tilemap.md` | New |
| `src/docs/api-reference/math.md` | New |
| `src/docs/api-reference/string.md` | New |
| `src/docs/api-reference/array.md` | New |

---

## Out of Scope

- Search within API Reference
- Version history or changelogs
- "Try it" interactive examples
- Mobile layout
