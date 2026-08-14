# Editor Preview fullscreen — design

## Problem

The Editor's Preview pane is a fixed `2/5`-width sidebar (`src/components/ProjectShell/index.tsx`). That's fine for quickly checking a change compiles and runs, but too small for actually playing through a game — especially one meant to be played with the mouse (e.g. bullet-hell-shooter's aim-with-mouse controls), where screen real estate directly affects playability.

## Scope

**In scope:** a fullscreen toggle for the Editor's Preview pane (`EditPage.tsx` / `ProjectShell`).

**Out of scope:** the homepage's embedded demo (`LandingHero.tsx`'s `Runner` instance) — a small marketing teaser, not meant for full playthroughs.

## Key technical fact this design relies on

`src/components/Runner/bootstrapper.html` already initializes PIXI with `resizeTo: window` (line ~130) — the game canvas resizes itself to fill whatever box the `<iframe>` occupies, driven by the iframe's own internal `window`'s resize events. This means making the iframe visually bigger is sufficient to make the game bigger; no engine/rendering change is needed.

The browser's native Fullscreen API, called on the `<iframe>` element itself from the **parent** page (not from inside the iframe's own sandboxed content), needs no change to the iframe's `sandbox` attribute — `allow-fullscreen`/`allowfullscreen` restrictions only govern a sandboxed frame's *own content* requesting fullscreen for itself. The parent document requesting fullscreen for an element it owns (treating the iframe like any other DOM node, e.g. a `<video>`) is unrestricted by the child's sandbox.

## Design

**Behavior:** a single toggle button in the Preview panel's existing header bar (next to the "PREVIEW" label). Click to enter fullscreen — the iframe becomes the fullscreen element, filling the entire monitor, and the game canvas inside it resizes to match automatically (via the existing `resizeTo: window` behavior). Click again (or press Esc, standard browser behavior, no code needed) to exit. The button's icon/label swaps between "enter fullscreen" and "exit fullscreen" based on actual fullscreen state, tracked via the browser's `fullscreenchange` event — not just click state — so it stays correct if the user exits via Esc instead of the button.

The button only exists while a game is running, matching the existing pattern where the whole Preview `<aside>` (header + content) is conditionally rendered only when `isRunning` is true.

**Component changes:**

1. **`src/components/Runner/index.tsx`** — wrap the component in `React.forwardRef<HTMLIFrameElement, RunnerProps>`, attaching the forwarded ref to the `<iframe>` element. No other change to `Runner`'s behavior.

2. **`src/components/Preview/index.tsx`** — likewise wrap in `React.forwardRef`, passing its ref straight through to the underlying `Runner`. `Preview` stays a thin pass-through component.

3. **`src/components/ProjectShell/index.tsx`** — add a new optional prop, `previewHeaderActions?: React.ReactNode`, rendered inside the existing Preview header `<div>` (the one currently showing only the "Preview" text), positioned at the row's trailing edge. This is additive — existing callers that don't pass it see no change.

4. **`src/pages/EditPage.tsx`** — the integration point:
   - Holds `const previewIframeRef = useRef<HTMLIFrameElement>(null)`.
   - Holds `const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false)`, updated by a `fullscreenchange` listener on `document` (checking `document.fullscreenElement === previewIframeRef.current`) registered in a `useEffect`.
   - Defines a small handler: if not fullscreen, call `previewIframeRef.current?.requestFullscreen()`; if fullscreen, call `document.exitFullscreen()`.
   - Renders a small icon button (expand/compress icon, matching the existing inline-SVG icon style already used elsewhere in this file/`ProjectShell`) wired to that handler, passed to `ProjectShell` via the new `previewHeaderActions` prop — but only when `isRunning` (mirrors the existing condition that already gates whether `<Preview>` itself renders).
   - Passes `ref={previewIframeRef}` to the `<Preview>` element.

**Error handling:** `requestFullscreen()`/`exitFullscreen()` return promises that can reject (e.g. a browser blocking fullscreen outside a user gesture, or an unsupported browser). Since the handler is always called synchronously from a click (a valid user gesture), rejection here is an edge case, not a normal path — `.catch(() => {})` is sufficient; no UI-facing error state is needed for what should be a rare, non-actionable failure (the button visually not doing anything is enough feedback).

**Testing:** no automated test — this is a real browser Fullscreen API interaction that Vitest's jsdom environment doesn't support meaningfully, and this project's Cypress suite doesn't test UI chrome interactions like this elsewhere (its existing specs assert on runtime *game* behavior, not editor-shell buttons). Verify manually in a real browser: click to enter fullscreen, confirm the game fills the screen and is still playable (keyboard/mouse input keeps working), press Esc to exit, confirm the button's icon reflects both states correctly including the Esc-exit path (not just click-driven exit).

## Out of scope (explicitly)

- Homepage `LandingHero` embed.
- Any change to the game engine, PIXI setup, or `resizeTo` behavior (already correct).
- A custom in-page "exit fullscreen" overlay — the browser's native Esc-to-exit (with its own on-screen hint) is sufficient.
- Any change to the iframe's `sandbox` attribute.
