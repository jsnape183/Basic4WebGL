# Where softBASIC is heading

softBASIC is under active development. Here's the broad shape of where things are going — not a schedule, just a direction.

---

## What just shipped (v0.3.0)

The foundational layer of the platform is now complete. Scene management, camera/viewport control, and world/HUD layers all shipped in v0.3.0, alongside animated sprite improvements and an expanded tutorial series covering these features.

## Right now

The editor is the next focus. Full autocomplete for softBASIC functions and class members, hover documentation for every function, and inline parameter hints as you type. The goal is an editor that feels as capable as the tools experienced developers are used to, while still being approachable for beginners.

---

## Near term

After the editor, optional accounts arrive. Signing in unlocks cloud sync for your projects. Local storage stays — everything works without an account, and signing in is an opt-in upgrade, not a gate.

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

**Creation tools** — in-app editors for sprites, tilemaps, and basic music, so you can build more of your game without leaving softBASIC.

**Desktop app** — the IDE itself as a native installable, with offline support and local file access.

---

## How we ship

Most changes land continuously as patch releases. Larger milestones — new modules, major editor features, platform capabilities — ship as minor version bumps. You can follow along in the [Release Notes](release-notes).
