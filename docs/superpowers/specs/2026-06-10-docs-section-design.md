# Documentation Section Design

## Summary

Add a documentation section to softBASIC, accessible from the main header on all pages. The docs open in a new browser tab at `/docs`. The page has three sections — Language Guide, API Reference, Tutorials — navigated via tabs, with a per-section left sidebar. Content is authored as markdown files. Implementation is phased: the infrastructure and Language Guide ship first; API Reference and Tutorials follow as separate tasks.

---

## Entry Point

A plain text "Docs" link is added to the right side of the header on both pages, immediately before any right-aligned action buttons:

- **ProjectsPage** header: `softBASIC … [Docs] [Import] [+ New Project]`
- **EditPage** header (via ProjectShell): `‹ softBASIC / project / file … [Docs] [▶ Run]`

The link uses `target="_blank" rel="noopener noreferrer"` to open `/docs` in a new tab. Styled as a muted text link (`text-ds-text-muted hover:text-ds-text`), no button chrome.

---

## Route

A new route `/docs` is added to `src/components/Routes/index.tsx`. It renders `DocsPage`. Deep-link routes `/docs/:section` and `/docs/:section/:slug` are also registered so individual pages can be bookmarked and shared.

`/docs` with no path redirects to `/docs/language-guide/modules` (the first Language Guide topic).

---

## Page Layout

```
┌─────────────────────────────────────────────────────┐
│  softBASIC Docs                      (minimal header)│
├─────────────────────────────────────────────────────┤
│  [Language Guide]  [API Reference]  [Tutorials]      │ ← section tabs
├────────────────┬────────────────────────────────────┤
│                │  breadcrumb                         │
│  topic list    │  ──────────────────────────────    │
│  for active    │  Page Title                        │
│  section       │                                    │
│                │  Content (rendered markdown)        │
│                │                                    │
│                │  ← Prev topic   Next topic →       │
└────────────────┴────────────────────────────────────┘
```

- **Header**: minimal — `softBASIC Docs` branding only (no back link; it's a new tab)
- **Section tabs**: three tabs immediately below the header; active tab has accent underline
- **Sidebar**: left-side topic list for the active section; active item has accent left border; width ~200px
- **Content area**: fills remaining width; markdown rendered with consistent heading/code/table styles
- **Breadcrumb**: `Section › Topic` in muted text above the page title
- **Prev/Next**: bottom of content area; shows adjacent topics within the same section
- **No right-side TOC**: two-column only
- **No search**: not in scope for this phase

---

## Navigation Manifest

A single TypeScript file `src/docs/manifest.ts` defines the ordered structure of all sections and topics. This is the source of truth for sidebar rendering, tab routing, and prev/next calculation.

```ts
export interface DocTopic {
  slug: string;       // URL segment, e.g. "classes"
  title: string;      // Sidebar and breadcrumb label
  file: string;       // Path to markdown file, relative to src/docs/
}

export interface DocSection {
  id: string;         // URL segment, e.g. "language-guide"
  label: string;      // Tab label
  topics: DocTopic[];
}

export const docsManifest: DocSection[] = [
  {
    id: 'language-guide',
    label: 'Language Guide',
    topics: [
      { slug: 'modules',           title: 'Modules',            file: 'language-guide/modules.md' },
      { slug: 'classes',           title: 'Classes',            file: 'language-guide/classes.md' },
      { slug: 'self',              title: 'self.',               file: 'language-guide/self.md' },
      { slug: 'variable-scoping',  title: 'Variable Scoping',   file: 'language-guide/variable-scoping.md' },
      { slug: 'functions',         title: 'Functions',          file: 'language-guide/functions.md' },
      { slug: 'lifecycle',         title: 'Lifecycle Functions', file: 'language-guide/lifecycle.md' },
      { slug: 'constructors',      title: 'Constructors',       file: 'language-guide/constructors.md' },
      { slug: 'inheritance',       title: 'Inheritance',        file: 'language-guide/inheritance.md' },
      { slug: 'multi-file',        title: 'Multi-file Projects', file: 'language-guide/multi-file.md' },
      { slug: 'class-composition', title: 'Class Composition',  file: 'language-guide/class-composition.md' },
      { slug: 'control-flow',      title: 'Control Flow',       file: 'language-guide/control-flow.md' },
      { slug: 'operators',         title: 'Operators',          file: 'language-guide/operators.md' },
      { slug: 'arrays',            title: 'Arrays',             file: 'language-guide/arrays.md' },
      { slug: 'packages',          title: 'Packages',           file: 'language-guide/packages.md' },
    ],
  },
  {
    id: 'api-reference',
    label: 'API Reference',
    topics: [], // Phase 2
  },
  {
    id: 'tutorials',
    label: 'Tutorials',
    topics: [], // Phase 3
  },
];
```

---

## Content Files

Language Guide markdown files live at `src/docs/language-guide/*.md`. Each file is a focused single-topic page (not the current monolithic `softbasic-concepts.md`). The monolithic file is split into 14 individual files as part of implementation.

Vite's `import.meta.glob` is used to eagerly import all markdown files at build time, then looked up by slug at runtime:

```ts
// In DocsContent.tsx
const files = import.meta.glob('../docs/**/*.md', { query: '?raw', import: 'default', eager: true });
// e.g. files['../docs/language-guide/classes.md'] → string content
```

API Reference and Tutorials directories are created empty during Phase 1; their sections render an "Coming soon" empty state in the sidebar.

---

## Markdown Rendering

**Dependencies added:**
- `react-markdown` — core renderer
- `remark-gfm` — tables, strikethrough, task lists
- `rehype-highlight` — fenced code block syntax highlighting (uses highlight.js)
- `highlight.js` — syntax definitions

A `<MarkdownContent>` component wraps `react-markdown` with:
- `remark-gfm` plugin enabled
- `rehype-highlight` plugin enabled
- Custom component overrides for `code`, `pre`, `table`, `a` using the app's `ds-*` design tokens
- Code blocks styled with the app's dark background (`bg-ds-surface`, `text-ds-accent`)

---

## Component Structure

```
src/
  pages/
    DocsPage.tsx              ← route entry; reads :section/:slug params
  components/
    Docs/
      DocsLayout.tsx          ← header + tabs + sidebar + content area shell
      DocsTabs.tsx            ← three section tabs
      DocsSidebar.tsx         ← topic list for active section
      DocsContent.tsx         ← markdown loader + MarkdownContent renderer
      MarkdownContent.tsx     ← react-markdown with plugins and styled overrides
  docs/
    manifest.ts               ← navigation manifest (source of truth)
    language-guide/
      modules.md
      classes.md
      self.md
      variable-scoping.md
      functions.md
      lifecycle.md
      constructors.md
      inheritance.md
      multi-file.md
      class-composition.md
      control-flow.md
      operators.md
      arrays.md
      packages.md
    api-reference/            ← empty, Phase 2
    tutorials/                ← empty, Phase 3
```

---

## Header Changes

**`src/pages/ProjectsPage.tsx`** — add Docs link to the header:

```tsx
<header className="h-11 px-6 flex items-center justify-between border-b border-ds-border bg-ds-surface">
  <span className="font-bold text-base tracking-wide text-ds-accent-btn-text">softBASIC</span>
  <div className="flex items-center gap-4">
    <a href="/docs" target="_blank" rel="noopener noreferrer"
       className="text-sm text-ds-text-muted hover:text-ds-text transition-colors">
      Docs
    </a>
    {/* existing Import / New Project buttons */}
  </div>
</header>
```

**`src/components/ProjectShell/index.tsx`** — the `header` prop passed in from `EditPage` includes a Docs link in the right cluster, before the Run/Stop buttons.

---

## Empty States

When a section has no topics (`topics.length === 0`), the sidebar shows a muted "Coming soon" message and the content area shows a centred placeholder. This covers API Reference and Tutorials in Phase 1.

---

## Out of Scope (this phase)

- Search
- API Reference content
- Tutorial content
- Syntax highlighting theme customisation
- Anchor links within a page (heading IDs)
- Mobile/responsive layout
