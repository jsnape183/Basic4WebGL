# Raycaster Game — Concept Brief

**Status:** concept only. Not a spec, not scheduled. A running record of the design
discussion so it isn't lost. The existing `raycaster` demo is the technical
starting point; this describes what a full game built on it could be.

---

## Pitch

You're locked inside a research facility overrun by a zombie outbreak. A military
"cleanup crew" has sealed the facility and is pushing in from the entrance to
contain it — killing anything that moves, infected or not. Escaping is easy. The
game is about surviving long enough, and pushing deep enough, to uncover why the
facility is being erased.

First-person grid raycaster. Connected areas, not linear levels. A moving front
line that turns the whole map into a clock.

---

## Core loop

**Gather → fortify or push → (die) → decide differently.**

You explore a connected facility, fighting through it, collecting **ammo** and
**scrap**. At fixed candidate locations you can spend scrap to activate a **safe
zone** — a save point and respawn point. Resting at a safe zone advances the
in-game day, which moves the **cleanup crew's front line** deeper into the
facility, changing what spawns in the areas behind you.

Every time you reach a new area the choice repeats: dig in here (safer future
runs, but the line advances while you work), or push deeper before it catches up.

Death sends you back to your last safe zone with the world clock advanced — the
front line moved while you were dead and redoing the run, so the world is worse
now. Death costs time, not progress.

---

## The front line (the spine)

One global value: how deep the cleanup crew has pushed, measured in areas from the
entrance. It advances on a slow real-time drip **plus a jump every time you rest**
at a safe zone (so resting has a cost).

Each area has a state derived from the front line's position and the area's
distance from the entrance. Four states are enough:

| State | Contents |
|---|---|
| `clear` | empty, or one straggler |
| `infested` | zombies |
| `contested` | zombies and cleanup crew, fighting each other |
| `controlled` | cleanup crew, dug in |

An area steps `clear → infested → contested → controlled` as the day counter
climbs. Authoring is one distance check and one lookup per area — no scripting.

"This room was zombies yesterday, now it's men with rifles" is the signature
feeling.

---

## Enemies — two factions

**Zombies** chase and melee. Punish standing still.
**Cleanup crew** shoot (hitscan, with a visible tracer/muzzle flash) and take
cover. Punish moving predictably in the open.

**The two factions also fight each other** — cleanup crew shoot zombies that
close on them; zombies swarm any cleanup squad. Cheap AI-wise (both already
target "nearest threat" — widen the threat list) and it's the concept's best
differentiator: baiting a horde into a firing line is a real tactic.

Variety over count. Dozens of active billboards, not hundreds. Each enemy is a
sprite swap + tuned numbers + a behaviour flag. Rough roster:

- **Shambler** — slow, tanky, melee. The crowd.
- **Runner** — fast, fragile, melee. The threat.
- **Spitter / bloater** — ranged glob or explodes on death. The zoner. Rare.
- **Cleanup trooper** — hitscan, takes cover. The tactical fight. (The demo's
  `Enemy` class is ~90% this already.)
- **Cleanup sealer** — armoured, slow miniboss. Possibly the enemy that welds
  doors shut behind you.

Travelling projectiles stay rare (one grenadier / spitter). Everyone else is
hitscan — cheap and reads fine at this fidelity.

---

## Safe zones, resources, death

**Two resources:**
- **Ammo** — found, scarce, spent fighting.
- **Scrap** — found in the environment, spent on safe zones. Kept separate so
  fortifying isn't literally "ammo I didn't keep."

**A safe zone** is a per-location progression tree:
1. Activate (X scrap) — save point + respawn point.
2. Heal on rest (advances the day).
3. Stash — leave surplus items; they survive death.
4. Workbench — convert scrap ↔ ammo.
5. Map terminal — reveals the current front line.

**Safe zones are not overrun.** Both factions ignore a barricaded room. Clean
rule, keeps them reliable, makes "run for the safe zone" always a valid panic
move.

**Death** reloads the last safe-zone save. The world clock is *not* reset (death
costs time). Everything else persists — spawn states, opened doors, taken items,
front-line position — via a larger `save` blob.

---

## Narrative

Non-linear, entirely in-world, no cutscenes. Delivery:
- **Wall terminals** you interact with — open a fullscreen text overlay that
  pauses the game. (The demo draws its exit billboard with zero art; same trick
  for a readable terminal.)
- **Audio logs** as a second channel.
- **Environmental** — a barricaded door with scratch marks, a body arrangement.

The deepest clues (the *why*) sit in the areas the front line reaches last, so
getting the truth means getting there before it's sealed. The explicit goal —
escape — is always available from any safe zone with a route out.

---

## Structure

Hub and spokes. The room you start locked in becomes your first safe-zone
candidate. Areas ~32–48 grid, connected by doors / keycards / elevators. Compact
by design — plays to the raycaster's strength (corridors, sightlines) and away
from its weakness (large open arenas).

Levels authored in the `.stm` tilemap editor with `TileMapSet` markers for spawn
points, pickups, terminals, doors, and safe-zone candidates — same workflow as
the other demos.

---

## Open design questions

1. **Front-line speed vs. player speed.** The hardest problem. There's a narrow
   band where fortify-vs-push is genuinely tense; outside it the choice is
   trivial in one direction. Only findable by playing — build the slice with
   front-line speed as a single tunable knob and iterate.
2. **Exact clock granularity** — real-time drip rate, per-rest jump size.
3. **How much the map terminal reveals** — just the front line, or full area
   layouts once visited?
4. **Whether keycards / progression gates are hard blocks or just danger tiers.**

---

## Engine asks

Everything game-specific — day clock, front-line state, safe-zone
activation/upgrades/stash, persistent world state across deaths, enemy roster,
weapons, resource pickups, clue content — is `.bas` logic on top of the `save`
module. No new primitives needed for that.

New engine primitives that would help (in priority order):

| Ask | Size | Why |
|---|---|---|
| **Minimap** (auto-revealing, per-area state colouring) | Medium | Navigation aid *and* front-line display. Prototype first — if it doesn't make the space legible, the concept doesn't hold. |
| **Interact action + paused text-overlay mode** | Small | Clue terminals. The action map already covers the input side. |
| **`raycast(x, y, dx, dy)` line-of-sight helper** | Medium | Cleanup-crew fire and cover checks. Every future raycaster game wants this rather than hand-rolling DDA. |
| Batched wall-strip draw | Medium | Performance headroom — one call for all ray columns instead of N. Not required, but the obvious optimisation. |

---

## Vertical slice

Prove the *loop*, not the renderer. Minimum:

- Hub + two connected areas.
- The front line visibly advancing over a couple of rests.
- Both factions present, fighting each other.
- One safe zone you activate with scrap.
- One death that sends you back to it with the world meaningfully worse.

If that's fun, the rest is content. If the minimap navigation or the faction war
doesn't land in the slice, it's a week spent, not a project.
