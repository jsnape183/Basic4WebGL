# Landing Page Design Spec

## Overview

Add a landing page at `/` that explains what softBASIC is, why it exists, and encourages visitors to try it. The current projects screen moves to `/projects`. The page targets complete beginners as the primary audience, with developers and educators as secondary.

---

## Design decisions (locked)

| Decision | Choice |
|---|---|
| Layout | Split hero — copy left, demo panel right |
| Tone | Dark + vibrant (deep purple/indigo background, gradient pink/purple accents) |
| Sections | Hero → What you can build → Closing CTA |
| Headline | "Make 2D games. No experience needed." |
| Code panel | 4 tabbed snippets: load sprite / movement / shoot / complete code |
| Code style | Single-file, no classes — all in Main.bas |

---

## Routing changes

- `/` → new `LandingPage` component
- `/projects` → existing `ProjectsPage` component (was at `/`)
- All existing routes (`/projects/:id/edit`, `/docs/*`) unchanged

---

## Colours and typography

Use existing design tokens exclusively — no raw colours:

- Page background: `ds-bg`
- Section surfaces: `ds-surface`
- Text: `ds-text`, `ds-text-muted`, `ds-text-dim`
- Accent: `ds-accent`
- Borders: `ds-border`

The deep purple hero gradient and pink/purple button gradient are landing-page-specific and defined inline (not design tokens — they don't exist in the token set). Use:
- Hero gradient: `linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #1a0533 100%)`
- CTA button gradient: `linear-gradient(90deg, #f5576c, #f093fb)`
- Logo/eyebrow gradient: `linear-gradient(90deg, #f093fb, #f5576c)`

---

## Component structure

### `src/pages/LandingPage.tsx`

Top-level page component. Renders in order:
1. `<LandingNav />`
2. `<LandingHero />`
3. `<LandingWhatYouCanMake />`
4. `<LandingCta />`
5. `<LandingFooter />`

All sub-components live in `src/components/Landing/` alongside their CSS modules.

### Sub-components

**`LandingNav`** — Sticky top nav. Left: softBASIC logo (gradient text). Right: Docs link, Tutorial link, "Try it free →" CTA button linking to `/projects`.

**`LandingHero`** — Split layout, full-viewport-height. Left column: eyebrow label, headline, subheadline, primary CTA button (`/projects`), beginner tutorial secondary link (`/docs`). Right column: game preview placeholder (black canvas area), `<CodePanel />`.

**`CodePanel`** — Tabbed code display. Four tabs: `load sprite` / `movement` / `shoot` / `complete code`. Active tab highlighted with accent underline. All tabs use a fixed height (180px) with scroll. Font: monospace. Syntax highlighting via inline `<span>` elements with classes: `.kw` (keywords), `.fn` (functions/methods), `.str` (strings), `.num` (numbers), `.cm` (comments).

Code snippets are static JSX — no runtime syntax highlighter dependency.

Tab content (exact softBASIC code):

*load sprite:*
```
' module-level variable — persists across frames
dim ship

function onenter()
  stage.setBackground(10, 10, 30)
  ship = new sprite("ship.png")
  stage.add(ship)
  ship.transform.setPosition(320, 300)
endfunction
```

*movement:*
```
' called every frame
function onupdate(delta)
  dim x
  dim y
  x = ship.transform.x()
  y = ship.transform.y()

  if input.getKeyDown(38) then
    y = y - 5
  endif
  if input.getKeyDown(40) then
    y = y + 5
  endif
  if input.getKeyDown(37) then
    x = x - 5
  endif
  if input.getKeyDown(39) then
    x = x + 5
  endif

  ship.transform.setPosition(x, y)
endfunction
```

*shoot:*
```
' called when a key is pressed (32 = space)
function onkeydown(key)
  if key = 32 then
    dim bullet = new sprite("bullet.png")
    stage.add(bullet)
    bullet.transform.setPosition(
      ship.transform.x(),
      ship.transform.y() - 20)
  endif
endfunction
```

*complete code:* all three snippets combined, showing the full Main.bas.

**`LandingWhatYouCanMake`** — Section with 4-column grid. Each card: emoji icon, genre name, one-line description. Cards: Shoot 'em ups 🚀, Platformers 🏃, Puzzle games 🧩, Arcade classics 🎯.

**`LandingCta`** — Centred banner section. Headline: "No signup. No download. Just open and code." Subtext: "Your projects save automatically in the browser. Pick up where you left off, any time." CTA button to `/projects`. Footer note: "Free to use · Works in any modern browser".

**`LandingFooter`** — Simple one-line footer. Left: copyright. Right: Docs, Tutorial links.

---

## Routing change

`src/components/Routes/index.tsx` — two changes:
1. Add `<Route path="/" element={<LandingPage />} />`
2. Change existing `<Route path="/" element={<ProjectsPage />} />` to `<Route path="/projects" element={<ProjectsPage />} />`

`ProjectsPage` internal links (e.g. "back" buttons, nav items) must be audited and updated to `/projects` where they currently link to `/`.

---

## Navigation links from existing pages

- `EditPage` header: existing "Projects" nav link currently links to `/` — update to `/projects`
- `DocsPage` header: same audit — update any `/` links to `/projects`

---

## No animations or transitions

Static layout only. No CSS transitions, entrance animations, or scroll effects. These can be added later.

---

## No tests required

The landing page is pure presentational UI with no logic, Redux state, or side effects. No test file needed.
