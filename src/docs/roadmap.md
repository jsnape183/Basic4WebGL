# Where softBASIC is heading

softBASIC is under active development. Here's the broad shape of where things are going — not a schedule, just a direction.

---

## What just shipped

The editor now feels like a real IDE. Autocomplete for softBASIC functions and class members, hover documentation, and inline parameter hints — all backed by live analysis of your own code, not just the built-in library, so your own functions, classes, and variables show up too. Errors underline live as you type, and console error entries jump straight to the file and line. This builds on the foundational layer that shipped in v0.3.0: scene management, camera/viewport control, and world/HUD layers.

Since then, your games can now save and load progress. Whether it's a high-score table, an in-progress level, or a whole inventory, your game can save it and have it still be there the next time someone plays — no account or backend needed. This was the last missing piece for shipping a genuinely complete game.

Most recently, a visual tilemap editor landed: load a tileset image, paint and erase tiles onto a grid, and manage multiple named layers — all without hand-editing JSON.

## Right now

Optional accounts are next. Signing in will unlock cloud sync for your projects. Local storage stays — everything works without an account, and signing in is an opt-in upgrade, not a gate.

---

## Further out

With accounts in place, sharing becomes possible: a link to your finished game that anyone can play in a browser, no account required on their end. A public gallery of published games will follow — a place to discover what people are making with softBASIC.

Alongside sharing, a package ecosystem opens the platform to first-party extension modules that go beyond the built-in library.

That's the milestone we're calling v1.0 — a complete, open platform.

---

## Beyond v1.0

After 1.0, the direction opens up. A few things we know are on the horizon:

**AI assistance** — Claude built directly into the editor to help explain errors, suggest code, and assist with edits. The goal is making softBASIC genuinely useful for learners, not just a novelty feature.

**Paid tier** — expanded limits and capabilities for users who want more.

**Game export** — the ability to bundle a finished game into a standalone desktop executable that anyone can download and run. This is significant infrastructure work and will ship as a paid-tier feature when it's ready.

**Mobile** — touch input support and an editor experience that works on tablet.

**Creation tools** — in-app editors for sprites and basic music, so you can build more of your game without leaving softBASIC.

**Desktop app** — the IDE itself as a native installable, with offline support and local file access.

---

## How we ship

Most changes land continuously as patch releases. Larger milestones — new modules, major editor features, platform capabilities — ship as minor version bumps. You can follow along in the [Release Notes](release-notes).
