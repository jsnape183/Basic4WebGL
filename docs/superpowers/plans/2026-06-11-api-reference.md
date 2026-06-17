# API Reference Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate the API Reference docs section with beginner-friendly documentation for all softGfx and softCore modules, grouped by package in the sidebar.

**Architecture:** Add `DocGroup` interface and `getSectionTopics` helper to the manifest, update DocsSidebar to render package headers above topic links when `groups` is present, update DocsContent to use the helper instead of `section.topics` directly, then write 13 markdown files (10 softGfx + 3 softCore).

**Tech Stack:** TypeScript, React, Tailwind CSS, Vite, react-markdown

---

## File Map

| File | Change |
|------|--------|
| `src/docs/manifest.ts` | Add `DocGroup` interface, `groups?` to `DocSection`, `getSectionTopics` helper, populate api-reference groups |
| `src/components/Docs/DocsSidebar.tsx` | Add grouped rendering for sections with `groups` |
| `src/components/Docs/DocsContent.tsx` | Replace `section.topics` with `getSectionTopics(section)` |
| `src/docs/api-reference/gfx.md` | New — keyboard/mouse/collision functions |
| `src/docs/api-reference/drawing.md` | New — drawLine, drawRect, drawCircle |
| `src/docs/api-reference/stage.md` | New — add/remove/clear/width/height/setBackground |
| `src/docs/api-reference/pen.md` | New — setFillColor, setLineColor, setLineWidth |
| `src/docs/api-reference/assetmanager.md` | New — loadImage |
| `src/docs/api-reference/objecttransform.md` | New — setPosition, x, y |
| `src/docs/api-reference/sprite.md` | New — full sprite class docs |
| `src/docs/api-reference/animatedsprite.md` | New — full animatedsprite class docs |
| `src/docs/api-reference/text.md` | New — full text class docs |
| `src/docs/api-reference/tilemap.md` | New — full tilemap class docs |
| `src/docs/api-reference/math.md` | New — all 39 math functions |
| `src/docs/api-reference/string.md` | New — all 14 string functions |
| `src/docs/api-reference/array.md` | New — all 8 array functions |

---

### Task 1: Update manifest.ts — DocGroup, getSectionTopics, api-reference groups

**Files:**
- Modify: `src/docs/manifest.ts`

- [ ] **Step 1: Replace src/docs/manifest.ts with the full updated version**

```typescript
export interface DocTopic {
  slug: string;
  title: string;
  file: string;
}

export interface DocGroup {
  label: string;
  topics: DocTopic[];
}

export interface DocSection {
  id: string;
  label: string;
  topics: DocTopic[];
  groups?: DocGroup[];
}

export function getSectionTopics(section: DocSection): DocTopic[] {
  if (section.groups) {
    return section.groups.flatMap(g => g.topics);
  }
  return section.topics;
}

export const docsManifest: DocSection[] = [
  {
    id: 'language-guide',
    label: 'Language Guide',
    topics: [
      { slug: 'modules',           title: 'Modules',             file: 'language-guide/modules.md' },
      { slug: 'classes',           title: 'Classes',             file: 'language-guide/classes.md' },
      { slug: 'self',              title: 'self.',               file: 'language-guide/self.md' },
      { slug: 'variable-scoping',  title: 'Variable Scoping',    file: 'language-guide/variable-scoping.md' },
      { slug: 'functions',         title: 'Functions',           file: 'language-guide/functions.md' },
      { slug: 'lifecycle',         title: 'Lifecycle Functions', file: 'language-guide/lifecycle.md' },
      { slug: 'constructors',      title: 'Constructors',        file: 'language-guide/constructors.md' },
      { slug: 'inheritance',       title: 'Inheritance',         file: 'language-guide/inheritance.md' },
      { slug: 'multi-file',        title: 'Multi-file Projects', file: 'language-guide/multi-file.md' },
      { slug: 'class-composition', title: 'Class Composition',   file: 'language-guide/class-composition.md' },
      { slug: 'control-flow',      title: 'Control Flow',        file: 'language-guide/control-flow.md' },
      { slug: 'operators',         title: 'Operators',           file: 'language-guide/operators.md' },
      { slug: 'arrays',            title: 'Arrays',              file: 'language-guide/arrays.md' },
      { slug: 'packages',          title: 'Packages',            file: 'language-guide/packages.md' },
    ],
  },
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
  },
  {
    id: 'tutorials',
    label: 'Tutorials',
    topics: [],
  },
];
```

- [ ] **Step 2: Verify build passes**

Run: `npx vite build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/docs/manifest.ts
git commit -m "feat: add DocGroup interface and getSectionTopics helper to manifest"
```

---

### Task 2: Update DocsSidebar.tsx — grouped rendering

**Files:**
- Modify: `src/components/Docs/DocsSidebar.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { docsManifest, getSectionTopics } from '../../docs/manifest';

interface DocsSidebarProps {
  sectionId: string;
  slug: string;
}

const DocsSidebar: React.FC<DocsSidebarProps> = ({ sectionId, slug }) => {
  const section = docsManifest.find(s => s.id === sectionId);

  const renderTopic = (topic: { slug: string; title: string }) => (
    <Link
      key={topic.slug}
      to={`/docs/${sectionId}/${topic.slug}`}
      className={[
        'block px-4 py-1.5 text-sm transition-colors',
        topic.slug === slug
          ? 'border-l-2 border-ds-accent text-ds-text bg-ds-bg font-medium'
          : 'border-l-2 border-transparent text-ds-text-muted hover:text-ds-text',
      ].join(' ')}
    >
      {topic.title}
    </Link>
  );

  const hasTopics = section && getSectionTopics(section).length > 0;

  return (
    <aside className="w-52 flex-shrink-0 border-r border-ds-border bg-ds-surface overflow-y-auto">
      <div className="py-4">
        {!hasTopics ? (
          <p className="px-4 py-2 text-xs text-ds-text-dim">Coming soon.</p>
        ) : section.groups ? (
          section.groups.map(group => (
            <div key={group.label}>
              <p className="text-xs text-ds-text-dim uppercase tracking-wider px-4 pt-4 pb-1">
                {group.label}
              </p>
              {group.topics.map(renderTopic)}
            </div>
          ))
        ) : (
          section.topics.map(renderTopic)
        )}
      </div>
    </aside>
  );
};

export default DocsSidebar;
```

- [ ] **Step 2: Verify build passes**

Run: `npx vite build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Docs/DocsSidebar.tsx
git commit -m "feat: add grouped sidebar rendering for package/module sections"
```

---

### Task 3: Update DocsContent.tsx — use getSectionTopics

**Files:**
- Modify: `src/components/Docs/DocsContent.tsx`

The current file uses `section.topics` directly in three places:
1. Empty check on line 28: `if (section.topics.length === 0)`
2. Slug lookup on line 36: `section.topics.findIndex(...)`
3. Topic array on line 37: `section.topics[topicIndex]`
4. Prev/next bounds on line 51: `section.topics.length - 1`
5. The `section.topics[topicIndex - 1]` and `section.topics[topicIndex + 1]` on lines 50-51

All five must be replaced with `getSectionTopics(section)`.

- [ ] **Step 1: Update the import line and replace all section.topics usages**

Replace the import on line 3:
```tsx
import { docsManifest, getSectionTopics, type DocTopic } from '../../docs/manifest';
```

Replace the empty check (line 28):
```tsx
  if (getSectionTopics(section).length === 0) {
```

Replace the topic lookup block (lines 36-51). The entire section from `const topicIndex` through `const nextTopic` becomes:
```tsx
  const topics = getSectionTopics(section);
  const topicIndex = topics.findIndex(t => t.slug === slug);
  const topic: DocTopic | undefined = topics[topicIndex];

  if (!topic) {
    return (
      <div className="flex-1 p-8 text-ds-text-dim text-sm">
        Topic not found.
      </div>
    );
  }

  const fileKey = `../../docs/${topic.file}`;
  const content = allFiles[fileKey];

  const prevTopic = topicIndex > 0 ? topics[topicIndex - 1] : undefined;
  const nextTopic = topicIndex < topics.length - 1 ? topics[topicIndex + 1] : undefined;
```

Full file after changes:
```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { docsManifest, getSectionTopics, type DocTopic } from '../../docs/manifest';
import MarkdownContent from './MarkdownContent';

const allFiles = import.meta.glob<string>('../../docs/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

interface DocsContentProps {
  sectionId: string;
  slug: string;
}

const DocsContent: React.FC<DocsContentProps> = ({ sectionId, slug }) => {
  const section = docsManifest.find(s => s.id === sectionId);

  if (!section) {
    return (
      <div className="flex-1 p-8 text-ds-text-dim text-sm">
        Section not found.
      </div>
    );
  }

  if (getSectionTopics(section).length === 0) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <p className="text-ds-text-dim text-sm">Coming soon.</p>
      </div>
    );
  }

  const topics = getSectionTopics(section);
  const topicIndex = topics.findIndex(t => t.slug === slug);
  const topic: DocTopic | undefined = topics[topicIndex];

  if (!topic) {
    return (
      <div className="flex-1 p-8 text-ds-text-dim text-sm">
        Topic not found.
      </div>
    );
  }

  const fileKey = `../../docs/${topic.file}`;
  const content = allFiles[fileKey];

  const prevTopic = topicIndex > 0 ? topics[topicIndex - 1] : undefined;
  const nextTopic = topicIndex < topics.length - 1 ? topics[topicIndex + 1] : undefined;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-6">
        <div className="text-xs text-ds-text-dim mb-6">
          {section.label} › {topic.title}
        </div>

        {content ? (
          <MarkdownContent content={content} />
        ) : (
          <p className="text-ds-text-dim text-sm">Content not available.</p>
        )}

        <div className="flex justify-between mt-12 pt-6 border-t border-ds-border">
          <div>
            {prevTopic && (
              <Link
                to={`/docs/${sectionId}/${prevTopic.slug}`}
                className="text-sm text-ds-text-muted hover:text-ds-text transition-colors"
              >
                ← {prevTopic.title}
              </Link>
            )}
          </div>
          <div>
            {nextTopic && (
              <Link
                to={`/docs/${sectionId}/${nextTopic.slug}`}
                className="text-sm text-ds-text-muted hover:text-ds-text transition-colors"
              >
                {nextTopic.title} →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocsContent;
```

- [ ] **Step 2: Verify build passes**

Run: `npx vite build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Docs/DocsContent.tsx
git commit -m "feat: use getSectionTopics in DocsContent for grouped section support"
```

---

### Task 4: Create softGfx API documentation (10 files)

**Files:**
- Create: `src/docs/api-reference/gfx.md`
- Create: `src/docs/api-reference/drawing.md`
- Create: `src/docs/api-reference/stage.md`
- Create: `src/docs/api-reference/pen.md`
- Create: `src/docs/api-reference/assetmanager.md`
- Create: `src/docs/api-reference/objecttransform.md`
- Create: `src/docs/api-reference/sprite.md`
- Create: `src/docs/api-reference/animatedsprite.md`
- Create: `src/docs/api-reference/text.md`
- Create: `src/docs/api-reference/tilemap.md`

- [ ] **Step 1: Create src/docs/api-reference/gfx.md**

````markdown
# gfx

The `gfx` module gives you access to keyboard input, mouse input, and collision detection. Include the **softGfx** package in your project to use it.

## getKeyDown(keycode)

Checks whether a specific key on the keyboard is currently held down.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| keycode   | string | The key to check, e.g. `"ArrowLeft"`, `"Space"`, `"KeyA"` |

**Returns:** `true` if the key is held down, `false` if it is not.

```bas
function onupdate(delta)
  if getKeyDown("ArrowLeft") then
    self.transform.setPosition(self.transform.x() - 5, self.transform.y())
  endif
endfunction
```

## mouseX()

Returns the current horizontal position of the mouse cursor on the canvas.

**Returns:** number — the x coordinate in pixels from the left edge.

```bas
dim cursorX
cursorX = mouseX()
```

## mouseY()

Returns the current vertical position of the mouse cursor on the canvas.

**Returns:** number — the y coordinate in pixels from the top edge.

```bas
dim cursorY
cursorY = mouseY()
```

## mouseDown()

Checks whether the primary mouse button is currently held down.

**Returns:** `true` if the mouse button is pressed, `false` if not.

```bas
function onupdate(delta)
  if mouseDown() then
    fireProjectile()
  endif
endfunction
```

## boxCollide(a, b)

Checks whether two sprites overlap. Uses a simple bounding-box test — if the rectangular areas of the two sprites touch or overlap, this returns `true`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | object | First sprite instance |
| b         | object | Second sprite instance |

**Returns:** `true` if the sprites overlap, `false` if they do not.

```bas
if boxCollide(player, enemy) then
  player.takeDamage(10)
endif
```
````

- [ ] **Step 2: Create src/docs/api-reference/drawing.md**

````markdown
# drawing

The `drawing` module lets you draw shapes directly onto the canvas. Shapes are drawn immediately when the function is called. Use the [pen](pen) module to set fill colour, line colour, and line width before drawing.

## drawLine(x, y, x2, y2)

Draws a straight line between two points.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Horizontal start position in pixels |
| y         | number | Vertical start position in pixels |
| x2        | number | Horizontal end position in pixels |
| y2        | number | Vertical end position in pixels |

```bas
setLineColor(255, 0, 0)
setLineWidth(2)
drawLine(0, 0, 100, 100)
```

## drawRect(x, y, width, height)

Draws a filled rectangle.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Horizontal position of the top-left corner |
| y         | number | Vertical position of the top-left corner |
| width     | number | Width of the rectangle in pixels |
| height    | number | Height of the rectangle in pixels |

```bas
setFillColor(0, 128, 255)
drawRect(50, 50, 200, 100)
```

## drawCircle(x, y, radius)

Draws a filled circle.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Horizontal position of the centre |
| y         | number | Vertical position of the centre |
| radius    | number | Radius of the circle in pixels |

```bas
setFillColor(255, 200, 0)
drawCircle(stage.width() / 2, stage.height() / 2, 40)
```
````

- [ ] **Step 3: Create src/docs/api-reference/stage.md**

````markdown
# stage

The `stage` module controls which objects are visible on screen and provides information about the canvas size. Any sprite, text, or tilemap must be added to the stage before it will appear.

## add(obj)

Adds an object to the stage so it becomes visible.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| obj       | object | A sprite, animatedsprite, text, or tilemap instance |

```bas
function onenter()
  stage.add(self)
endfunction
```

## remove(obj)

Removes an object from the stage so it is no longer visible.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| obj       | object | The object to remove |

```bas
stage.remove(enemy)
```

## clear()

Removes all objects from the stage at once.

```bas
function onenter()
  stage.clear()
endfunction
```

## width()

Returns the width of the canvas in pixels.

**Returns:** number

```bas
dim centreX
centreX = stage.width() / 2
```

## height()

Returns the height of the canvas in pixels.

**Returns:** number

```bas
dim centreY
centreY = stage.height() / 2
```

## setBackground(r, g, b)

Sets the background colour of the canvas using red, green, and blue values (0–255 each).

| Parameter | Type   | Description |
|-----------|--------|-------------|
| r         | number | Red component, 0–255 |
| g         | number | Green component, 0–255 |
| b         | number | Blue component, 0–255 |

```bas
function onenter()
  stage.setBackground(30, 30, 50)
endfunction
```
````

- [ ] **Step 4: Create src/docs/api-reference/pen.md**

````markdown
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
````

- [ ] **Step 5: Create src/docs/api-reference/assetmanager.md**

````markdown
# assetmanager

The `assetmanager` module handles loading images so they can be used by sprites and tilemaps. Load your images in `onenter` before creating objects that use them.

## loadImage(name)

Loads an image asset by its filename (as it appears in your project's Assets panel).

| Parameter | Type   | Description |
|-----------|--------|-------------|
| name      | string | The filename of the image, e.g. `"player.png"` |

```bas
function onenter()
  assetmanager.loadImage("player.png")
  assetmanager.loadImage("background.png")
endfunction
```
````

- [ ] **Step 6: Create src/docs/api-reference/objecttransform.md**

````markdown
# ObjectTransform

`ObjectTransform` controls the position of a sprite, animated sprite, or tilemap on the canvas. You do not create an `ObjectTransform` yourself — it is always accessed through the `.transform` property on an object that has one.

```bas
self.transform.setPosition(100, 200)
```

See [sprite](sprite), [animatedsprite](animatedsprite), and [tilemap](tilemap) for examples of how `.transform` is used.

## setPosition(x, y)

Moves the object to an exact position on the canvas.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Horizontal position in pixels from the left edge |
| y         | number | Vertical position in pixels from the top edge |

```bas
function onenter()
  self.transform.setPosition(100, 200)
endfunction
```

## x()

Returns the current horizontal position of the object.

**Returns:** number — x coordinate in pixels.

```bas
dim currentX
currentX = self.transform.x()
```

## y()

Returns the current vertical position of the object.

**Returns:** number — y coordinate in pixels.

```bas
dim currentY
currentY = self.transform.y()
```
````

- [ ] **Step 7: Create src/docs/api-reference/sprite.md**

````markdown
# sprite

A `sprite` displays a single image on the canvas. Extend it using `Extends sprite` in your class file, then call `super("image.png")` in your constructor.

Position is controlled through `self.transform` — see [ObjectTransform](objecttransform).

## Constructor

```bas
Class
Extends sprite

Constructor()
  super("player.png")
  stage.add(self)
EndConstructor
```

| Parameter | Type   | Description |
|-----------|--------|-------------|
| imagePath | string | Filename of the image to display, e.g. `"player.png"` |

## setAngle(angle)

Rotates the sprite.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| angle     | number | Rotation in degrees. 0 is no rotation, 90 is a quarter turn clockwise. |

```bas
self.setAngle(45)
```

## setAlpha(a)

Sets how transparent the sprite is.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | number | Opacity from 0 (fully invisible) to 1 (fully visible) |

```bas
self.setAlpha(0.5)
```

## setScale(sx, sy)

Resizes the sprite by a multiplier.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| sx        | number | Horizontal scale. 1 is normal size, 2 is double width, 0.5 is half width. |
| sy        | number | Vertical scale. 1 is normal size, 2 is double height. |

```bas
self.setScale(2, 2)
```

## setFlip(h, v)

Mirrors the sprite horizontally or vertically.

| Parameter | Type            | Description |
|-----------|-----------------|-------------|
| h         | `true` or `false` | Pass `true` to mirror left-to-right |
| v         | `true` or `false` | Pass `true` to flip upside-down |

```bas
self.setFlip(true, false)
```

## setVisible(v)

Shows or hides the sprite without removing it from the stage.

| Parameter | Type            | Description |
|-----------|-----------------|-------------|
| v         | `true` or `false` | `true` to show, `false` to hide |

```bas
self.setVisible(false)
```

## setTexture(path)

Swaps the image displayed by the sprite.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| path      | string | Filename of the new image |

```bas
self.setTexture("player_hurt.png")
```

## width()

Returns the width of the sprite in pixels.

**Returns:** number

```bas
dim w
w = self.width()
```

## height()

Returns the height of the sprite in pixels.

**Returns:** number

```bas
dim h
h = self.height()
```
````

- [ ] **Step 8: Create src/docs/api-reference/animatedsprite.md**

````markdown
# animatedsprite

An `animatedsprite` plays frame-by-frame animations from a sprite sheet. The sprite sheet must be a grid of equal-sized frames. Extend it using `Extends animatedsprite` in your class file.

Position is controlled through `self.transform` — see [ObjectTransform](objecttransform).

## Constructor

```bas
Class
Extends animatedsprite

Constructor()
  super("character.png", 32, 32)
  stage.add(self)
EndConstructor
```

| Parameter | Type   | Description |
|-----------|--------|-------------|
| imagePath | string | Filename of the sprite sheet |
| frameW    | number | Width of each frame in pixels |
| frameH    | number | Height of each frame in pixels |

## addAnim(name, startFrame, endFrame, fps, loop)

Defines a named animation from a range of frames on the sprite sheet. Frames are numbered from 0 starting at the top-left, going left to right.

| Parameter  | Type            | Description |
|------------|-----------------|-------------|
| name       | string          | A name for this animation, e.g. `"walk"`, `"jump"` |
| startFrame | number          | Index of the first frame (0 = top-left frame) |
| endFrame   | number          | Index of the last frame (inclusive) |
| fps        | number          | How many frames to show per second |
| loop       | `true` or `false` | `true` to repeat the animation, `false` to play once |

```bas
function onenter()
  self.addAnim("walk", 0, 7, 12, true)
  self.addAnim("jump", 8, 11, 10, false)
endfunction
```

## play(name)

Starts playing a named animation.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| name      | string | The animation to play, as defined with `addAnim` |

```bas
self.play("walk")
```

## isPlaying(name)

Checks whether a specific animation is currently playing.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| name      | string | The animation name to check |

**Returns:** `true` if the named animation is playing, `false` if not.

```bas
if not isPlaying("jump") then
  self.play("walk")
endif
```

## setAngle(angle)

Rotates the sprite.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| angle     | number | Rotation in degrees |

```bas
self.setAngle(90)
```

## setAlpha(a)

Sets the transparency of the sprite.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | number | Opacity from 0 (invisible) to 1 (fully visible) |

```bas
self.setAlpha(0.8)
```

## setScale(sx, sy)

Resizes the sprite.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| sx        | number | Horizontal scale multiplier |
| sy        | number | Vertical scale multiplier |

```bas
self.setScale(2, 2)
```

## setFlip(h, v)

Mirrors the sprite.

| Parameter | Type            | Description |
|-----------|-----------------|-------------|
| h         | `true` or `false` | `true` to mirror left-to-right |
| v         | `true` or `false` | `true` to flip upside-down |

```bas
self.setFlip(true, false)
```

## setVisible(v)

Shows or hides the sprite.

| Parameter | Type            | Description |
|-----------|-----------------|-------------|
| v         | `true` or `false` | `true` to show, `false` to hide |

```bas
self.setVisible(false)
```

## width()

Returns the frame width in pixels.

**Returns:** number

```bas
dim w
w = self.width()
```

## height()

Returns the frame height in pixels.

**Returns:** number

```bas
dim h
h = self.height()
```
````

- [ ] **Step 9: Create src/docs/api-reference/text.md**

````markdown
# text

The `text` class renders a string of text on the canvas. Extend it using `Extends text` in your class file.

## Constructor

```bas
Class
Extends text

Constructor()
  super("Score: 0", 20, 20)
  stage.add(self)
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
self.setPosition(stage.width() - 100, 20)
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
````

- [ ] **Step 10: Create src/docs/api-reference/tilemap.md**

````markdown
# tilemap

A `tilemap` renders a tile-based level on the canvas. It takes a tile sheet (a grid of equally-sized tiles) and a JSON file describing where each tile goes. Extend it using `Extends tilemap` in your class file.

Position is controlled through `self.transform` — see [ObjectTransform](objecttransform).

## Constructor

```bas
Class
Extends tilemap

Constructor()
  super("tiles.png", 32, 32)
  stage.add(self)
EndConstructor
```

| Parameter   | Type   | Description |
|-------------|--------|-------------|
| tilesetPath | string | Filename of the tile sheet image |
| tileW       | number | Width of each tile in pixels |
| tileH       | number | Height of each tile in pixels |

## load(jsonPath)

Loads a tilemap layout from a JSON file in your project assets.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| jsonPath  | string | Filename of the JSON layout file |

```bas
function onenter()
  self.load("level1.json")
endfunction
```

## tileAt(x, y)

Returns the tile ID at a given world position. Useful for checking what the player is standing on.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Horizontal world position in pixels |
| y         | number | Vertical world position in pixels |

**Returns:** number — the tile ID at that position, or 0 if the position is empty.

```bas
dim tile
tile = self.tileAt(player.transform.x(), player.transform.y())
if tile = 1 then
  print "standing on grass"
endif
```

## widthPx()

Returns the total width of the tilemap in pixels.

**Returns:** number

```bas
dim mapW
mapW = self.widthPx()
```

## heightPx()

Returns the total height of the tilemap in pixels.

**Returns:** number

```bas
dim mapH
mapH = self.heightPx()
```
````

- [ ] **Step 11: Verify build passes**

Run: `npx vite build`
Expected: Build succeeds with no errors.

- [ ] **Step 12: Commit**

```bash
git add src/docs/api-reference/
git commit -m "docs: add softGfx API reference (10 modules)"
```

---

### Task 5: Create softCore API documentation (3 files)

**Files:**
- Create: `src/docs/api-reference/math.md`
- Create: `src/docs/api-reference/string.md`
- Create: `src/docs/api-reference/array.md`

- [ ] **Step 1: Create src/docs/api-reference/math.md**

````markdown
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
result = abs(-5)   ' result is 5
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
result = pow(2, 8)   ' result is 256
```

### sqrt(n)

Returns the square root of a number.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | A non-negative number |

**Returns:** number

```bas
dim result
result = sqrt(16)   ' result is 4
```

### cbrt(n)

Returns the cube root of a number.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

```bas
dim result
result = cbrt(27)   ' result is 3
```

### sign(n)

Returns -1 if `n` is negative, 0 if `n` is zero, or 1 if `n` is positive.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

```bas
dim s
s = sign(-5)   ' s is -1
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
result = floor(3.9)   ' result is 3
```

### ceil(n)

Rounds a number up to the nearest whole number.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

```bas
dim result
result = ceil(3.1)   ' result is 4
```

### round(n)

Rounds a number to the nearest whole number.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

```bas
dim result
result = round(3.5)   ' result is 4
```

### trunc(n)

Removes the decimal part of a number without rounding.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

```bas
dim result
result = trunc(3.9)   ' result is 3
```

## Random Numbers

### random()

Returns a random decimal number between 0 and 1.

**Returns:** number

```bas
dim roll
roll = random()   ' e.g. 0.7342
```

### randomint(min, max)

Returns a random whole number between `min` and `max` (inclusive).

| Parameter | Type   | Description |
|-----------|--------|-------------|
| min       | number | Smallest possible value |
| max       | number | Largest possible value |

**Returns:** number

```bas
dim roll
roll = randomint(1, 6)   ' rolls a six-sided die
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
health = min(health, 100)   ' caps health at 100
```

### max(a, b)

Returns the larger of two numbers.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | number | First number |
| b         | number | Second number |

**Returns:** number

```bas
health = max(health, 0)   ' prevents health going below 0
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
speed = clamp(speed, 0, 10)
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
dist = distance(player.transform.x(), player.transform.y(), enemy.transform.x(), enemy.transform.y())
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
smoothX = lerp(currentX, targetX, 0.1)   ' moves 10% closer each frame
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
y = sin(angle) * radius
```

### cos(angle)

Returns the cosine of an angle in radians.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| angle     | number | Angle in radians |

**Returns:** number

```bas
dim x
x = cos(angle) * radius
```

### tan(angle)

Returns the tangent of an angle in radians.

**Returns:** number

### asin(n)

Returns the arcsine (inverse sine) of `n` in radians.

**Returns:** number

### acos(n)

Returns the arccosine (inverse cosine) of `n` in radians.

**Returns:** number

### atan(n)

Returns the arctangent (inverse tangent) of `n` in radians.

**Returns:** number

### atan2(y, x)

Returns the angle in radians between the positive x-axis and the point `(x, y)`. Useful for pointing a sprite towards a target.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| y         | number | Vertical distance to target |
| x         | number | Horizontal distance to target |

**Returns:** number — angle in radians.

```bas
dim angle
angle = atan2(targetY - selfY, targetX - selfX)
```

### sinh(n), cosh(n), tanh(n), asinh(n), acosh(n), atanh(n)

Hyperbolic variants of the trigonometric functions.

## Logarithms and Exponents

### exp(n)

Returns e raised to the power `n`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | The exponent |

**Returns:** number

### log(n)

Returns the natural logarithm of `n`.

**Returns:** number

### log2(n)

Returns the base-2 logarithm of `n`.

**Returns:** number

### log10(n)

Returns the base-10 logarithm of `n`.

**Returns:** number

## Constants

### pi()

Returns the mathematical constant π (approximately 3.14159).

**Returns:** number

```bas
dim circumference
circumference = 2 * pi() * radius
```

### euler()

Returns Euler's number e (approximately 2.71828).

**Returns:** number

## Conversion

### val(s)

Converts a string to a number.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | A string containing a number, e.g. `"42"` |

**Returns:** number

```bas
dim n
n = val("42")   ' n is 42
```
````

- [ ] **Step 2: Create src/docs/api-reference/string.md**

````markdown
# string

The `string` module provides functions for working with text. It is part of the **softCore** package.

## len(s)

Returns the number of characters in a string.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to measure |

**Returns:** number

```bas
dim n
n = len("hello")   ' n is 5
```

## lcase(s)

Converts all letters in a string to lowercase.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to convert |

**Returns:** string

```bas
dim result
result = lcase("HELLO")   ' result is "hello"
```

## ucase(s)

Converts all letters in a string to uppercase.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to convert |

**Returns:** string

```bas
dim result
result = ucase("hello")   ' result is "HELLO"
```

## trim(s)

Removes spaces from the start and end of a string.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to trim |

**Returns:** string

```bas
dim result
result = trim("  hello  ")   ' result is "hello"
```

## str(n)

Converts a number to a string. Useful for displaying scores or other values in text objects.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | The number to convert |

**Returns:** string

```bas
dim display
display = "Score: " + str(score)
```

## substr(s, start, end)

Returns a section of a string, from position `start` up to (but not including) position `end`. Positions start at 0.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The source string |
| start     | number | Position to start from (0 = first character) |
| end       | number | Position to stop at (not included in result) |

**Returns:** string

```bas
dim result
result = substr("hello world", 0, 5)   ' result is "hello"
```

## replace(s, a, b)

Replaces every occurrence of `a` in `s` with `b`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The source string |
| a         | string | The text to find |
| b         | string | The text to replace it with |

**Returns:** string

```bas
dim result
result = replace("hello world", "world", "there")   ' result is "hello there"
```

## split(s, c)

Splits a string into an array using a separator character.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to split |
| c         | string | The separator character |

**Returns:** array of strings

```bas
dim parts
parts = split("a,b,c", ",")   ' parts is ["a", "b", "c"]
```

## contains(s, sub)

Checks whether a string contains a given piece of text.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to search |
| sub       | string | The text to look for |

**Returns:** `true` if found, `false` if not.

```bas
if contains(name, "boss") then
  print "it's a boss!"
endif
```

## indexof(s, sub)

Returns the position of the first occurrence of `sub` in `s`. Returns -1 if not found. Positions start at 0.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to search |
| sub       | string | The text to find |

**Returns:** number

```bas
dim pos
pos = indexof("hello", "ll")   ' pos is 2
```

## padstart(s, n, p)

Pads the start of a string with a character until it reaches the desired length.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to pad |
| n         | number | The target length |
| p         | string | The padding character |

**Returns:** string

```bas
dim result
result = padstart("7", 3, "0")   ' result is "007"
```

## padend(s, n, p)

Pads the end of a string with a character until it reaches the desired length.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to pad |
| n         | number | The target length |
| p         | string | The padding character |

**Returns:** string

```bas
dim result
result = padend("hi", 5, ".")   ' result is "hi..."
```

## char(n)

Returns the character for a given character code.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Character code (e.g. 65 = "A") |

**Returns:** string (single character)

```bas
dim result
result = char(65)   ' result is "A"
```

## asc(s)

Returns the character code of the first character in a string.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | A string (uses the first character) |

**Returns:** number

```bas
dim code
code = asc("A")   ' code is 65
```
````

- [ ] **Step 3: Create src/docs/api-reference/array.md**

````markdown
# array

The `array` module provides functions for working with arrays. It is part of the **softCore** package.

Arrays in softBASIC are declared with a size: `dim scores(10)` creates an array of 10 elements. The functions below let you work with them dynamically.

## arrLength(a)

Returns the number of elements in an array.

| Parameter | Type  | Description |
|-----------|-------|-------------|
| a         | array | The array to measure |

**Returns:** number

```bas
dim items(5)
dim n
n = arrLength(items)   ' n is 5
```

## push(arr, item)

Adds an item to the end of an array.

| Parameter | Type  | Description |
|-----------|-------|-------------|
| arr       | array | The array to add to |
| item      | any   | The value to add |

```bas
dim scores(0)
push(scores, 100)
push(scores, 200)
```

## pop(arr)

Removes and returns the last item in an array.

| Parameter | Type  | Description |
|-----------|-------|-------------|
| arr       | array | The array to remove from |

**Returns:** the removed item.

```bas
dim last
last = pop(scores)
```

## contains(arr, item)

Checks whether an array contains a specific value.

| Parameter | Type  | Description |
|-----------|-------|-------------|
| arr       | array | The array to search |
| item      | any   | The value to look for |

**Returns:** `true` if found, `false` if not.

```bas
if contains(inventory, "sword") then
  print "You have a sword"
endif
```

## indexOf(arr, item)

Returns the position of a value in an array. Returns -1 if not found. Positions start at 0.

| Parameter | Type  | Description |
|-----------|-------|-------------|
| arr       | array | The array to search |
| item      | any   | The value to find |

**Returns:** number

```bas
dim pos
pos = indexOf(inventory, "potion")
```

## remove(arr, index)

Removes the item at a specific position and shifts the remaining items down.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| arr       | array  | The array to modify |
| index     | number | Position to remove (0 = first item) |

```bas
remove(inventory, 0)   ' removes the first item
```

## join(a, s)

Joins all items in an array into a single string, separated by `s`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | array  | The array to join |
| s         | string | Separator between items |

**Returns:** string

```bas
dim items(3)
items(0) = "sword"
items(1) = "shield"
items(2) = "potion"
dim result
result = join(items, ", ")   ' result is "sword, shield, potion"
```

## clear(arr)

Removes all items from an array.

| Parameter | Type  | Description |
|-----------|-------|-------------|
| arr       | array | The array to clear |

```bas
clear(inventory)
```
````

- [ ] **Step 4: Verify build passes**

Run: `npx vite build`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/docs/api-reference/math.md src/docs/api-reference/string.md src/docs/api-reference/array.md
git commit -m "docs: add softCore API reference (math, string, array)"
```

---

## Verification

After all 5 tasks are complete, navigate to `/docs/api-reference` in the running app and confirm:

1. The sidebar shows two package headers: **softGfx** and **softCore** (in muted uppercase)
2. Each package lists its module topics beneath the header
3. Clicking a topic loads its page with the correct content
4. Prev/next navigation at the bottom of each page links to adjacent topics (even across packages — gfx → drawing → stage etc., then tilemap → math → string → array)
5. The Language Guide still renders exactly as before (flat list, no package headers)
