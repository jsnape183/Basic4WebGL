# Documentation Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in-app documentation section to softBASIC, accessible from the header on both pages, that renders markdown content in a structured three-tab layout (Language Guide, API Reference, Tutorials).

**Architecture:** A new `/docs` route renders `DocsPage`, which owns layout, tab navigation, sidebar, and markdown content rendering. Navigation structure is driven by a manifest file (`src/docs/manifest.ts`). Content files live as individual markdown files under `src/docs/language-guide/`. Markdown is loaded at build time via Vite's `import.meta.glob`.

**Tech Stack:** React 19, React Router v7, react-markdown, remark-gfm, rehype-highlight, highlight.js, Tailwind CSS (ds-* design tokens), TypeScript

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `src/docs/manifest.ts` | Create | Navigation source of truth: sections, topics, slugs, file paths |
| `src/docs/language-guide/*.md` | Create (14 files) | Individual topic markdown files |
| `src/docs/api-reference/` | Create (empty dir) | Placeholder for Phase 2 |
| `src/docs/tutorials/` | Create (empty dir) | Placeholder for Phase 3 |
| `src/components/Docs/MarkdownContent.tsx` | Create | react-markdown wrapper with plugins and styled overrides |
| `src/components/Docs/DocsContent.tsx` | Create | Loads markdown via import.meta.glob, renders MarkdownContent + prev/next |
| `src/components/Docs/DocsSidebar.tsx` | Create | Topic list for active section, active item highlight |
| `src/components/Docs/DocsTabs.tsx` | Create | Three section tabs with active state |
| `src/components/Docs/DocsLayout.tsx` | Create | Header + tabs + sidebar + content shell |
| `src/pages/DocsPage.tsx` | Create | Route entry point, reads :section/:slug params |
| `src/components/Routes/index.tsx` | Modify | Add `/docs`, `/docs/:section`, `/docs/:section/:slug` routes |
| `src/pages/ProjectsPage.tsx` | Modify | Add Docs link to header (right side, before action buttons) |
| `src/pages/EditPage.tsx` | Modify | Add Docs link to header (right side, before Run/Stop button) |

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
npm install react-markdown remark-gfm rehype-highlight highlight.js
```

- [ ] **Step 2: Verify installation**

```bash
npm ls react-markdown remark-gfm rehype-highlight highlight.js
```

Expected: all four listed with no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-markdown, remark-gfm, rehype-highlight, highlight.js"
```

---

## Task 2: Create navigation manifest

**Files:**
- Create: `src/docs/manifest.ts`

- [ ] **Step 1: Create the manifest file**

```ts
// src/docs/manifest.ts

export interface DocTopic {
  slug: string;
  title: string;
  file: string;
}

export interface DocSection {
  id: string;
  label: string;
  topics: DocTopic[];
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
  },
  {
    id: 'tutorials',
    label: 'Tutorials',
    topics: [],
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/docs/manifest.ts
git commit -m "feat: add docs navigation manifest"
```

---

## Task 3: Split language guide into individual markdown files

The monolithic guide at `docs/language/softbasic-concepts.md` is split into 14 focused files under `src/docs/language-guide/`. These are served by the app at build time.

**Files:**
- Create: `src/docs/language-guide/modules.md`
- Create: `src/docs/language-guide/classes.md`
- Create: `src/docs/language-guide/self.md`
- Create: `src/docs/language-guide/variable-scoping.md`
- Create: `src/docs/language-guide/functions.md`
- Create: `src/docs/language-guide/lifecycle.md`
- Create: `src/docs/language-guide/constructors.md`
- Create: `src/docs/language-guide/inheritance.md`
- Create: `src/docs/language-guide/multi-file.md`
- Create: `src/docs/language-guide/class-composition.md`
- Create: `src/docs/language-guide/control-flow.md`
- Create: `src/docs/language-guide/operators.md`
- Create: `src/docs/language-guide/arrays.md`
- Create: `src/docs/language-guide/packages.md`
- Create: `src/docs/api-reference/.gitkeep`
- Create: `src/docs/tutorials/.gitkeep`

- [ ] **Step 1: Create `modules.md`**

```markdown
# Modules

Every `.bas` file is a **module** by default. A module is a static class — all variables and functions belong to the type itself, not to instances.

## Declaration

No declaration keyword is needed. A file with no `Class` keyword on line 1 is automatically a module.

```bas
dim score
dim lives

function onenter()
  score = 0
  lives = 3
endfunction

function onupdate(delta)
  ' game logic here
endfunction
```

## Variable Scope

Variables declared with `dim` at the top level of a module belong to the module itself. They persist for the lifetime of the scene.

## Lifecycle Functions

Modules participate in the engine lifecycle: `onenter`, `onupdate`, `onkeydown`, `onkeyup`. See [Lifecycle Functions](lifecycle) for details.

## Using Modules from Other Files

In a multi-file project, one module can call functions on another using the filename (lowercase, no extension) as the identifier.

```bas
' In Main.bas — calls a function in scoreboard.bas
scoreboard.addPoints(10)
```

See [Multi-file Projects](multi-file) for details.
```

- [ ] **Step 2: Create `classes.md`**

```markdown
# Classes

A file is declared as a **class** by placing the `Class` keyword alone on line 1. Classes support multiple instances, each with their own state.

## Declaration

```bas
Class
dim health
dim x
dim y
```

The class name is derived from the filename (lowercase, no extension). A file named `Enemy.bas` produces a class named `enemy`.

## Instance Variables

Variables declared with `dim` inside a class body (outside any function or constructor) are prototype properties — they exist on every instance. Access them inside methods using `self.`:

```bas
Class
dim health

function takeDamage(amount)
  self.health = self.health - amount
endfunction
```

## Creating Instances

```bas
dim e1 as enemy()
dim e2 as enemy()
```

Each instance has its own copy of `health`.

## EndClass

An optional `EndClass` keyword can close the class body. It is not required.

## Related Topics

- [self.](self) — required prefix for instance variable access inside methods
- [Constructors](constructors) — initialise instance state at creation time
- [Inheritance](inheritance) — extend one class from another
```

- [ ] **Step 3: Create `self.md`**

```markdown
# self.

Inside class methods and constructors, instance variables **must** be accessed with the `self.` prefix. Bare access to a class variable without `self.` is a compile error.

## Usage

```bas
Class
dim score

function addPoints(amount)
  self.score = self.score + amount   ' correct
  ' score = score + amount           ' compile error — bare access
endfunction
```

`self.` compiles to `this.` in the generated JavaScript.

## In Constructors

```bas
Constructor(startScore)
  self.score = startScore
EndConstructor
```

## Why Required

Because softBASIC modules are also static classes and use bare variable names at the top level, requiring `self.` inside instance classes makes the distinction explicit and prevents accidental reference to module-level scope.

## Related Topics

- [Classes](classes)
- [Constructors](constructors)
```

- [ ] **Step 4: Create `variable-scoping.md`**

```markdown
# Variable Scoping

softBASIC has three variable scopes: module-level, class-level, and function-local.

## Module-Level Variables

Declared with `dim` at the top of a module (non-class file). Accessible anywhere in the module without a prefix.

```bas
dim score

function addPoints(n)
  score = score + n
endfunction
```

## Class-Level Variables (Instance Properties)

Declared with `dim` inside a class body (outside functions/constructors). Must be accessed with `self.` inside methods.

```bas
Class
dim health

function heal(amount)
  self.health = self.health + amount
endfunction
```

## Function-Local Variables

Declared with `dim` inside a function body. Scoped to that function call only.

```bas
function calculate(x)
  dim result
  result = x * 2
  return result
endfunction
```

## Object Variables in Constructors

A `dim` statement using `as ClassName()` inside a constructor body creates an instance property (stored as `this.propertyName`):

```bas
Constructor()
  dim self.transform as ObjectTransform()
EndConstructor
```

## Related Topics

- [self.](self)
- [Functions](functions)
```

- [ ] **Step 5: Create `functions.md`**

```markdown
# Functions

Functions are declared with the `function` / `endfunction` keywords. They may take parameters and return a value.

## Syntax

```bas
function add(a, b)
  return a + b
endfunction
```

## Parameters

Parameters are comma-separated identifiers. No type annotations.

```bas
function greet(name, times)
  dim i
  for i = 1 to times
    print "Hello, " + name
  next i
endfunction
```

## Return Values

Use `return` followed by an expression. A function without a `return` statement returns `undefined`.

```bas
function square(n)
  return n * n
endfunction
```

## Calling Functions

```bas
dim result
result = square(5)   ' 25
```

## Functions Inside Classes

Functions inside a class body are instance methods. They must use `self.` to access instance variables.

```bas
Class
dim x

function getX()
  return self.x
endfunction
```

## Related Topics

- [Variable Scoping](variable-scoping)
- [self.](self)
- [Lifecycle Functions](lifecycle)
```

- [ ] **Step 6: Create `lifecycle.md`**

```markdown
# Lifecycle Functions

The softBASIC engine calls specific functions on every active module and class instance during each frame. These are the lifecycle hooks available to your code.

## onenter()

Called once when the scene starts. Use it to initialise state.

```bas
function onenter()
  score = 0
  lives = 3
endfunction
```

## onupdate(delta)

Called every frame. `delta` is the elapsed time in milliseconds since the last frame.

```bas
function onupdate(delta)
  x = x + speed * delta
endfunction
```

## onkeydown(key) — optional

Called when a key is pressed. `key` is the key identifier string (e.g. `"ArrowLeft"`, `"Space"`). If this function is not defined, the engine skips it for that module/class.

```bas
function onkeydown(key)
  if key = "Space" then
    fireProjectile()
  endif
endfunction
```

## onkeyup(key) — optional

Called when a key is released. Same `key` values as `onkeydown`. Optional.

```bas
function onkeyup(key)
  if key = "ArrowLeft" then
    stopMoving()
  endif
endfunction
```

## Class Instances

Lifecycle functions work the same way inside classes. Instance methods with these names will be called by the engine on every active instance.

```bas
Class
dim x

function onupdate(delta)
  self.x = self.x + 100 * delta
endfunction
```

## Related Topics

- [Modules](modules)
- [Classes](classes)
```

- [ ] **Step 7: Create `constructors.md`**

```markdown
# Constructors

A constructor initialises a class instance when it is created. It runs once per instance, immediately after `dim … as ClassName(…)`.

## Syntax

```bas
Constructor(param1, param2)
  self.param1 = param1
  self.param2 = param2
EndConstructor
```

Constructor parameters are passed as arguments to `dim … as ClassName(…)`:

```bas
dim player as Player(100, 200)   ' calls Constructor(100, 200)
```

## Setting Instance Properties

Use `self.` to assign constructor arguments to instance variables:

```bas
Class
dim health
dim name

Constructor(startHealth, playerName)
  self.health = startHealth
  self.name = playerName
EndConstructor
```

## Creating Object Properties

A `dim … as ClassName()` statement inside a constructor body creates an instance property that holds another object:

```bas
Constructor()
  dim self.transform as ObjectTransform()
EndConstructor
```

This stores the ObjectTransform instance as `this.transform` on the class instance.

## Inheritance

If a class extends another, call `super()` first in the constructor:

```bas
Constructor(x, y)
  super(x, y)
  self.type = "boss"
EndConstructor
```

See [Inheritance](inheritance) for details.

## Related Topics

- [Classes](classes)
- [self.](self)
- [Inheritance](inheritance)
```

- [ ] **Step 8: Create `inheritance.md`**

```markdown
# Inheritance

A class can extend another class using the `Extends` keyword. The child class inherits all methods and properties from the parent.

## Syntax

```bas
Class
Extends ParentClassName
```

`ParentClassName` is the lowercase name of the parent class (the filename without `.bas`).

## Example

**Enemy.bas:**
```bas
Class
dim health
dim x

Constructor(startHealth, startX)
  self.health = startHealth
  self.x = startX
EndConstructor

function takeDamage(amount)
  self.health = self.health - amount
endfunction
```

**Boss.bas:**
```bas
Class
Extends enemy

Constructor(startHealth, startX)
  super(startHealth, startX)
  self.phase = 1
EndConstructor

function onupdate(delta)
  ' boss-specific behaviour
endfunction
```

## super()

Call `super(…)` in the child constructor to run the parent constructor. This should be done first, before assigning child-specific properties.

## super.method()

Call a parent method that has been overridden in the child:

```bas
function takeDamage(amount)
  super.takeDamage(amount)
  ' additional boss-specific logic
endfunction
```

## Constraints

- Single-level inheritance only — a class can extend one parent, but that parent cannot itself extend another class.
- The parent class file must be included in the project.

## Related Topics

- [Classes](classes)
- [Constructors](constructors)
```

- [ ] **Step 9: Create `multi-file.md`**

```markdown
# Multi-file Projects

A softBASIC project can contain multiple `.bas` files. Each file is either a module or a class, and they can reference each other.

## Calling Between Files

Use the filename (lowercase, no extension) as the identifier to call functions on another module or create instances of a class.

**main.bas calling scoreboard.bas:**
```bas
scoreboard.addPoints(10)
scoreboard.reset()
```

**Instantiating a class from another file:**
```bas
' Enemy.bas defines the enemy class
dim e as enemy(100, 50)
```

## Load Order

All files in a project are compiled together. There is no explicit import — every file is available to every other file by its filename identifier.

## Naming

The identifier for a file is always the filename lowercased with no extension:
- `Player.bas` → `player`
- `EnemySpawner.bas` → `enemyspawner`
- `Main.bas` → `main`

## Related Topics

- [Modules](modules)
- [Classes](classes)
- [Class Composition](class-composition)
```

- [ ] **Step 10: Create `class-composition.md`**

```markdown
# Class Composition

Classes can hold instances of other classes as properties, set up inside the constructor.

## Pattern

```bas
Class
Extends sprite

Constructor(imagePath)
  super(imagePath)
  dim self.weapon as Weapon()
EndConstructor

function onupdate(delta)
  self.weapon.update(delta)
endfunction
```

Here, each instance of this class owns its own `Weapon` instance stored at `self.weapon`.

## Why Composition

softBASIC supports single-level inheritance only. For more complex object relationships, compose objects by nesting instances.

## softGfx Example

The built-in softGfx classes use this pattern: `Sprite`, `AnimatedSprite`, and `TileMap` each hold an `ObjectTransform` instance at `self.transform`:

```bas
Class
Extends sprite

Constructor()
  super("player.png")
EndConstructor

function onenter()
  self.transform.setPosition(100, 200)
endfunction
```

## Related Topics

- [Classes](classes)
- [Constructors](constructors)
- [Inheritance](inheritance)
- [Packages](packages)
```

- [ ] **Step 11: Create `control-flow.md`**

```markdown
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
```

- [ ] **Step 12: Create `operators.md`**

```markdown
# Operators

## Arithmetic

| Operator | Description | Example |
|----------|-------------|---------|
| `+` | Addition | `x + 1` |
| `-` | Subtraction | `x - 1` |
| `*` | Multiplication | `x * 2` |
| `/` | Division | `x / 2` |
| `mod` | Modulo | `x mod 3` |

## Comparison

| Operator | Description |
|----------|-------------|
| `=` | Equal |
| `<>` | Not equal |
| `<` | Less than |
| `>` | Greater than |
| `<=` | Less than or equal |
| `>=` | Greater than or equal |

## Boolean

| Operator | Description |
|----------|-------------|
| `and` | Logical AND |
| `or` | Logical OR |
| `not` | Logical NOT |

Example:

```bas
if x > 0 and y > 0 then
  print "first quadrant"
endif
```

## String Concatenation

Use `+` to concatenate strings:

```bas
dim greeting
greeting = "Hello, " + name + "!"
```

## Assignment

`=` is used for both assignment and equality comparison. Context determines which.

## Related Topics

- [Control Flow](control-flow)
- [Variable Scoping](variable-scoping)
```

- [ ] **Step 13: Create `arrays.md`**

```markdown
# Arrays

Arrays store ordered collections of values.

## Declaration

```bas
dim scores(10)   ' array of 10 elements, indices 0–9
```

## Access

```bas
scores(0) = 100
scores(1) = 200
print scores(0)   ' 100
```

## Iteration

```bas
dim i
for i = 0 to 9
  print scores(i)
next i
```

## Related Topics

- [Variable Scoping](variable-scoping)
- [Control Flow](control-flow)
```

- [ ] **Step 14: Create `packages.md`**

```markdown
# Packages

Packages are pre-built libraries included in your project to provide additional functionality.

## Adding a Package

Packages are added via the project settings in the softBASIC IDE. Once added, their modules are available by name.

## softGfx

The main first-party package. Provides graphics, animation, and asset management.

**Modules:**

| Module | Description |
|--------|-------------|
| `gfx` | Canvas setup and frame management |
| `drawing` | Primitive drawing (lines, rectangles, circles) |
| `stage` | Scene/entity management |
| `pen` | Drawing state (colour, line width) |
| `assetmanager` | Asset loading and management |
| `ObjectTransform` | Position, scale, rotation for sprites |
| `sprite` | Static image sprites |
| `animatedsprite` | Frame-animated sprites |
| `text` | Text rendering |
| `tilemap` | Tile-based map rendering |

## Sprite

Renders a static image. Position, scale and rotation are managed via `self.transform`.

```bas
Class
Extends sprite

Constructor()
  super("bunny.png")
EndConstructor

function onenter()
  self.transform.setPosition(100, 200)
endfunction
```

## AnimatedSprite

Like `Sprite` but plays through animation frames.

```bas
Class
Extends animatedsprite

Constructor()
  super("walk.png", frameWidth, frameHeight, frameCount, fps)
EndConstructor

function onenter()
  self.transform.setPosition(50, 50)
  self.play()
endfunction
```

## ObjectTransform

Holds position, scale, and rotation. Accessed via `.transform` on sprite/animatedsprite/tilemap instances.

```bas
self.transform.setPosition(x, y)
self.transform.x()      ' get x position
self.transform.y()      ' get y position
```

## TileMap

Renders a tile-based map.

```bas
Class
Extends tilemap

Constructor()
  super("tileset.png", tileWidth, tileHeight)
EndConstructor
```

## assetmanager

Loads and caches assets.

```bas
assetmanager.load("player.png")
```

## Related Topics

- [Classes](classes)
- [Constructors](constructors)
- [Class Composition](class-composition)
```

- [ ] **Step 15: Create placeholder directories**

Create `src/docs/api-reference/.gitkeep` and `src/docs/tutorials/.gitkeep` (empty files so directories exist in git).

- [ ] **Step 16: Commit**

```bash
git add src/docs/
git commit -m "feat: add language guide markdown files"
```

---

## Task 4: MarkdownContent component

**Files:**
- Create: `src/components/Docs/MarkdownContent.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/Docs/MarkdownContent.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';
import type { Components } from 'react-markdown';
import { useNavigate, useParams } from 'react-router-dom';

const components: Components = {
  a: ({ href, children }) => {
    const navigate = useNavigate();
    const { section } = useParams<{ section: string }>();

    const handleClick = (e: React.MouseEvent) => {
      if (!href) return;
      if (href.startsWith('http://') || href.startsWith('https://')) return;
      e.preventDefault();
      navigate(`/docs/${section ?? 'language-guide'}/${href}`);
    };

    if (href?.startsWith('http://') || href?.startsWith('https://')) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-ds-accent hover:underline">
          {children}
        </a>
      );
    }

    return (
      <a href={href} onClick={handleClick} className="text-ds-accent hover:underline cursor-pointer">
        {children}
      </a>
    );
  },
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="bg-ds-surface text-ds-accent px-1 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    }
    return <code className={className} {...props}>{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="bg-ds-surface rounded-md p-4 overflow-x-auto my-4 text-sm border border-ds-border">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="text-left px-3 py-2 border border-ds-border bg-ds-surface text-ds-text font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 border border-ds-border text-ds-text-muted">{children}</td>
  ),
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-ds-text mb-4 mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-semibold text-ds-text mt-8 mb-3 border-b border-ds-border pb-2">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-ds-text mt-6 mb-2">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-ds-text-muted leading-relaxed mb-4">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside text-ds-text-muted mb-4 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside text-ds-text-muted mb-4 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="text-ds-text-muted">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-ds-accent pl-4 my-4 text-ds-text-dim italic">
      {children}
    </blockquote>
  ),
};

interface MarkdownContentProps {
  content: string;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeHighlight]}
    components={components}
  >
    {content}
  </ReactMarkdown>
);

export default MarkdownContent;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors in the new file.

- [ ] **Step 3: Commit**

```bash
git add src/components/Docs/MarkdownContent.tsx
git commit -m "feat: add MarkdownContent component with react-markdown"
```

---

## Task 5: DocsContent component

**Files:**
- Create: `src/components/Docs/DocsContent.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/Docs/DocsContent.tsx
import { Link } from 'react-router-dom';
import { docsManifest, type DocTopic } from '../../docs/manifest';
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
      <div className="flex-1 p-8 text-ds-text-muted text-sm">
        Section not found.
      </div>
    );
  }

  if (section.topics.length === 0) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <p className="text-ds-text-dim text-sm">Coming soon.</p>
      </div>
    );
  }

  const topicIndex = section.topics.findIndex(t => t.slug === slug);
  const topic: DocTopic | undefined = section.topics[topicIndex];

  if (!topic) {
    return (
      <div className="flex-1 p-8 text-ds-text-muted text-sm">
        Topic not found.
      </div>
    );
  }

  const fileKey = `../../docs/${topic.file}`;
  const content = allFiles[fileKey];

  const prevTopic = topicIndex > 0 ? section.topics[topicIndex - 1] : undefined;
  const nextTopic = topicIndex < section.topics.length - 1 ? section.topics[topicIndex + 1] : undefined;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl px-8 py-6">
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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Docs/DocsContent.tsx
git commit -m "feat: add DocsContent component"
```

---

## Task 6: DocsSidebar component

**Files:**
- Create: `src/components/Docs/DocsSidebar.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/Docs/DocsSidebar.tsx
import { Link } from 'react-router-dom';
import { docsManifest } from '../../docs/manifest';

interface DocsSidebarProps {
  sectionId: string;
  slug: string;
}

const DocsSidebar: React.FC<DocsSidebarProps> = ({ sectionId, slug }) => {
  const section = docsManifest.find(s => s.id === sectionId);

  return (
    <aside className="w-52 flex-shrink-0 border-r border-ds-border bg-ds-surface overflow-y-auto">
      <div className="py-4">
        {section && section.topics.length > 0 ? (
          section.topics.map(topic => (
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
          ))
        ) : (
          <p className="px-4 py-2 text-xs text-ds-text-dim">Coming soon.</p>
        )}
      </div>
    </aside>
  );
};

export default DocsSidebar;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Docs/DocsSidebar.tsx
git commit -m "feat: add DocsSidebar component"
```

---

## Task 7: DocsTabs component

**Files:**
- Create: `src/components/Docs/DocsTabs.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/Docs/DocsTabs.tsx
import { Link } from 'react-router-dom';
import { docsManifest } from '../../docs/manifest';

interface DocsTabsProps {
  sectionId: string;
}

const DocsTabs: React.FC<DocsTabsProps> = ({ sectionId }) => (
  <div className="flex border-b border-ds-border bg-ds-surface px-4">
    {docsManifest.map(section => {
      const isActive = section.id === sectionId;
      const firstSlug = section.topics[0]?.slug;
      const href = firstSlug
        ? `/docs/${section.id}/${firstSlug}`
        : `/docs/${section.id}`;

      return (
        <Link
          key={section.id}
          to={href}
          className={[
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
            isActive
              ? 'border-ds-accent text-ds-accent'
              : 'border-transparent text-ds-text-muted hover:text-ds-text',
          ].join(' ')}
        >
          {section.label}
        </Link>
      );
    })}
  </div>
);

export default DocsTabs;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Docs/DocsTabs.tsx
git commit -m "feat: add DocsTabs component"
```

---

## Task 8: DocsLayout component

**Files:**
- Create: `src/components/Docs/DocsLayout.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/Docs/DocsLayout.tsx
import DocsTabs from './DocsTabs';
import DocsSidebar from './DocsSidebar';
import DocsContent from './DocsContent';

interface DocsLayoutProps {
  sectionId: string;
  slug: string;
}

const DocsLayout: React.FC<DocsLayoutProps> = ({ sectionId, slug }) => (
  <div className="min-h-screen flex flex-col bg-ds-bg text-ds-text">
    <header className="h-11 flex-shrink-0 flex items-center px-6 bg-ds-surface border-b border-ds-border">
      <span className="font-bold text-base tracking-wide text-ds-accent-btn-text">
        softBASIC Docs
      </span>
    </header>

    <DocsTabs sectionId={sectionId} />

    <div className="flex flex-1 overflow-hidden">
      <DocsSidebar sectionId={sectionId} slug={slug} />
      <DocsContent sectionId={sectionId} slug={slug} />
    </div>
  </div>
);

export default DocsLayout;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Docs/DocsLayout.tsx
git commit -m "feat: add DocsLayout component"
```

---

## Task 9: DocsPage and routes

**Files:**
- Create: `src/pages/DocsPage.tsx`
- Modify: `src/components/Routes/index.tsx`

- [ ] **Step 1: Create DocsPage**

```tsx
// src/pages/DocsPage.tsx
import { useParams, Navigate } from 'react-router-dom';
import DocsLayout from '../components/Docs/DocsLayout';
import { docsManifest } from '../docs/manifest';

const DEFAULT_SECTION = 'language-guide';
const DEFAULT_SLUG = docsManifest.find(s => s.id === DEFAULT_SECTION)?.topics[0]?.slug ?? 'modules';

const DocsPage: React.FC = () => {
  const { section, slug } = useParams<{ section?: string; slug?: string }>();

  const resolvedSection = section ?? DEFAULT_SECTION;
  const resolvedSlug = slug ?? DEFAULT_SLUG;

  if (!section || !slug) {
    return <Navigate to={`/docs/${resolvedSection}/${resolvedSlug}`} replace />;
  }

  return <DocsLayout sectionId={resolvedSection} slug={resolvedSlug} />;
};

export default DocsPage;
```

- [ ] **Step 2: Add routes**

Current `src/components/Routes/index.tsx`:
```tsx
import { Routes, Route } from 'react-router-dom';
import ProjectsPage from '../../pages/ProjectsPage';
import EditPage from '../../pages/EditPage';

const GlobalRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<ProjectsPage />} />
    <Route path="/projects/:id/edit" element={<EditPage />} />
  </Routes>
);

export default GlobalRoutes;
```

Update to:
```tsx
import { Routes, Route } from 'react-router-dom';
import ProjectsPage from '../../pages/ProjectsPage';
import EditPage from '../../pages/EditPage';
import DocsPage from '../../pages/DocsPage';

const GlobalRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<ProjectsPage />} />
    <Route path="/projects/:id/edit" element={<EditPage />} />
    <Route path="/docs" element={<DocsPage />} />
    <Route path="/docs/:section" element={<DocsPage />} />
    <Route path="/docs/:section/:slug" element={<DocsPage />} />
  </Routes>
);

export default GlobalRoutes;
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/DocsPage.tsx src/components/Routes/index.tsx
git commit -m "feat: add DocsPage and /docs routes"
```

---

## Task 10: Add Docs link to ProjectsPage header

**Files:**
- Modify: `src/pages/ProjectsPage.tsx`

- [ ] **Step 1: Read current header**

Current header in `src/pages/ProjectsPage.tsx` (approximately lines 6-12):
```tsx
<header className="h-11 px-6 flex items-center border-b border-ds-border bg-ds-surface">
  <span className="font-bold text-base tracking-wide text-ds-accent-btn-text">
    softBASIC
  </span>
```

The existing Import and New Project buttons are rendered inside `<ProjectList />` (or adjacent to it — read the actual file to confirm the exact layout before editing).

- [ ] **Step 2: Update the header**

Change the header to:
```tsx
<header className="h-11 px-6 flex items-center justify-between border-b border-ds-border bg-ds-surface">
  <span className="font-bold text-base tracking-wide text-ds-accent-btn-text">
    softBASIC
  </span>
  <div className="flex items-center gap-4">
    <a
      href="/docs"
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-ds-text-muted hover:text-ds-text transition-colors"
    >
      Docs
    </a>
  </div>
</header>
```

Note: If the existing Import/New Project buttons are in the header (not in ProjectList), they stay inside the same `<div className="flex items-center gap-4">` after the Docs link. Read `src/pages/ProjectsPage.tsx` fully before editing to confirm where those buttons live.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/ProjectsPage.tsx
git commit -m "feat: add Docs link to ProjectsPage header"
```

---

## Task 11: Add Docs link to EditPage header

**Files:**
- Modify: `src/pages/EditPage.tsx`

- [ ] **Step 1: Locate the insertion point**

In `src/pages/EditPage.tsx`, the header JSX is (lines ~142-183):
```tsx
header={
  <>
    <Link to="/" ...>‹</Link>
    <span ...>softBASIC</span>
    <span ...>{project.name}</span>
    {selectedFile && (...)}
    <div className="flex-1" />
    {!isRunning ? (
      <button ...>▶ Run</button>
    ) : (
      <button ...>■ Stop</button>
    )}
  </>
}
```

The Docs link is inserted immediately after `<div className="flex-1" />` and before the Run/Stop button.

- [ ] **Step 2: Add the import**

Add `Link` is already imported from `react-router-dom`. No new import needed — use an `<a>` tag with `target="_blank"` since it opens an external tab:

```tsx
// No additional import needed
```

- [ ] **Step 3: Insert Docs link**

Find:
```tsx
          <div className="flex-1" />
          {!isRunning ? (
```

Replace with:
```tsx
          <div className="flex-1" />
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ds-text-muted hover:text-ds-text transition-colors mr-2"
          >
            Docs
          </a>
          {!isRunning ? (
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/EditPage.tsx
git commit -m "feat: add Docs link to EditPage header"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Covered by task |
|---|---|
| `/docs` route with redirect to first topic | Task 9 (DocsPage Navigate) |
| `/docs/:section` and `/docs/:section/:slug` routes | Task 9 (Routes) |
| Minimal header "softBASIC Docs" | Task 8 (DocsLayout) |
| Three section tabs | Task 7 (DocsTabs) |
| Left sidebar ~200px, active item accent border | Task 6 (DocsSidebar) |
| Content area with markdown rendering | Tasks 4 + 5 |
| Breadcrumb above content | Task 5 (DocsContent) |
| Prev/next navigation | Task 5 (DocsContent) |
| No right-side TOC | Omitted by design |
| No search | Omitted by design |
| Docs link in ProjectsPage header | Task 10 |
| Docs link in EditPage header | Task 11 |
| Manifest file `src/docs/manifest.ts` | Task 2 |
| 14 language guide markdown files | Task 3 |
| react-markdown + remark-gfm + rehype-highlight + highlight.js | Task 1 |
| `import.meta.glob` for file loading | Task 5 |
| Empty state for sections with no topics | Task 5 + Task 6 |
| api-reference and tutorials dirs created empty | Task 3 |

### Placeholder scan

No TBD, TODO, or incomplete steps found. All code blocks are complete.

### Type consistency

- `DocTopic` and `DocSection` defined in Task 2 (`manifest.ts`), imported in Tasks 5, 6, 7, 9
- `sectionId: string` and `slug: string` props used consistently across DocsLayout, DocsSidebar, DocsContent
- `allFiles` key pattern `../../docs/${topic.file}` matches glob pattern `../../docs/**/*.md`

### Note on ProjectsPage buttons

Task 10 includes a note to read `src/pages/ProjectsPage.tsx` fully before editing because the existing Import/New Project buttons may be inside or outside the header element. The implementer must check and keep them in the right place.
