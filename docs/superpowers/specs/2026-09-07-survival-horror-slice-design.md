# Survival Horror Raycaster — Vertical Slice Design

**Status:** design approved, ready for implementation plan.
**Scope:** vertical slice only. Proves the core loop; does not design the full game.
**Builds on:** the `raycaster` demo engine (walk, billboards, `Enemy` class, `.stm`
tilemaps, lighting, floor field). See `docs/raycaster-game-concept.md` for the
broader unshipped concept this slice is a first test of.

---

## 1. Concept

First-person grid raycaster survival horror.

You wake on a **disused underground platform** of a transit interchange — a
mundane public station that was unknowingly plumbed into a secret weapons
facility decades ago, via old rail lines everyone believed were bricked up. This
is **site 2**. A prologue-era outbreak here (a separate game idea, out of scope)
was declared "contained." It wasn't.

The military has the station **surrounded and is collapsing inward from every
street exit**, killing everything it finds — infected or not. You start at the
bottom. The only goal is **up and out**. Every exit ends in a confrontation. The
question the game asks is *when* you break for it.

### Pillars

1. **Gather** — scavenge ammo and scrap from a hostile, shrinking space.
2. **Fortify** — spend scrap to make one platform a safe zone (save + respawn +
   workbench).
3. **Decide when to run** — every rest tightens the circle and seals your exit a
   little more. The dread lives in the choice to rest, which is irreversible.

### Tone principle

**Designed to be felt, not shown.** The closing circle is communicated
diegetically — sound, and what spawns where — not with a timer or a gauge. An
optional **map terminal** is an easy-difficulty assist for players who want the
god's-eye read.

---

## 2. Geography — three areas

The slice is a hub and two spokes. The raycaster has no meaningful verticality,
so the three areas are **not one contiguous map** — each is its own raycaster
**scene** (`.stm` + scene module, using the engine's existing scene management),
joined by **transition triggers**. A transition is a doorway / stairwell mouth
tile that, on **Interact**, fades out and loads the target scene, placing the
player at that scene's matching **entry point**. Backtracking still works — it is
a scene load with whatever spawn set the area's current state dictates.

| Area | Direction | Role | State behaviour |
|---|---|---|---|
| **Old Platform** | start / centre | Safe-zone hub. Activated with scrap. **Never overrun** by either faction. | always `safe` |
| **Disused Tunnel** | down | Breathing room + the slice's one story beat (wall terminal, optional audio log). Shamblers only; **crew never enter**. | always `infested` |
| **Concourse Stairwell** | up | The escape route. Contains zombies **and** a crew fireteam, fighting each other. | `contested` → `controlled` after the 2nd rest |

### The vertical axis

```
STREET LEVEL        <- military perimeter; collapses inward and downward
   |
CONCOURSE STAIRWELL <- the escape spoke (up)
   |
OLD PLATFORM        <- start; safe-zone hub
   |
DISUSED TUNNEL      <- story spoke (down); toward the facility, not an exit
   |
[FACILITY]          <- out of scope
```

"Down" is temporary safety and story. It is **not** an exit, so time spent there
is time the circle tightens above you. "Up" is the only way out and the only way
the circle can hurt you.

### The loop this geography produces

1. Start on the Old Platform.
2. Scavenge the Tunnel and the Stairwell for **scrap** and **ammo**.
3. Spend scrap to **activate** the Old Platform as a safe zone.
4. **Rest** — full heal, saves the game, advances the circle one step.
5. Optionally use the **workbench** to convert scrap → ammo.
6. Decide: push the Stairwell now while it is `contested` (chaotic, slippable),
   or rest again for more healing/ammo and face it `controlled` (dug-in troopers
   in prepared positions).
7. Die → reload the last activated safe zone. The world is exactly as your last
   rest left it (the circle does not rewind, because it was saved at that rest).

---

## 3. Systems

### 3.1 Movement & interaction

- Reuse the demo raycaster's movement: forward / back, strafe left / right, turn
  left / right, plus pitch (Y-look) on arrows Up/Down and the right analogue
  stick. Mouse-look is out of scope.
- **Lighting/surfaces (added in phase 1):** each scene binds an `RcLights` rig
  (uniform ambient only so far — point lights come with the lighting/enemy
  phases) and runs the per-pixel textured floor+ceiling field
  (`RcRender.setFloorField`). Per-area ambient is the first atmosphere lever
  (tunnel dim, platform bright).
- **Interact** action (new engine primitive — see §5): a single button that,
  when aimed at an interactable, triggers it. Used for:
  - Picking up scrap / ammo (or pickups auto-collect on walk-over — decide in
    phase 2; auto-collect is simpler and fine for the slice).
  - Wall terminals (opens a paused fullscreen text overlay).
  - Safe-zone nodes (activate / rest / workbench prompts).
  - **Scene transitions** — a doorway / stairwell tile shows a prompt
    ("▲ Ascend", "Enter tunnel"); Interact fades out and loads the target
    scene at its matching entry point.

### 3.2 Combat

- **One firearm.** Hitscan (instant hit along aim ray). No projectile travel.
- **Ammo-limited.** Out of ammo = you cannot fight; you run. There is **no
  melee** in the slice. A no-damage desperation shove (shove a shambler back a
  tile to break a grab) is optional in phase 2 — include only if it falls out
  cheaply.
- Feedback: reticle, muzzle flash, and a visible tracer for trooper fire so the
  player can locate a shooter by its tracer origin.
- Player health is a simple hit-point pool. Shambler melee chips it; trooper
  hitscan takes larger bites. Full heal only at rest. No regen.

### 3.3 Resources

Two floor-pickup resources. Kept separate so fortifying never feels like "ammo I
threw away."

| Resource | Found | Spent on |
|---|---|---|
| **Scrap** | environment pickups in Tunnel + Stairwell | safe-zone *activation*; workbench input |
| **Ammo** | environment pickups in Tunnel + Stairwell | the firearm |

Scrap stays meaningful after activation because it is the workbench input — your
ammo reserve-in-waiting.

### 3.4 Safe zone — three nodes

The Old Platform is the only safe zone in the slice. Interacting with it presents
three actions:

| Node | Cost | Effect |
|---|---|---|
| **Activate** | fixed scrap cost | One-time. Marks the platform as the respawn point and unlocks Rest + Workbench. Until activated, the platform is just a room. |
| **Rest** | none (but advances the circle) | Full heal. **Saves the game.** Advances the circle one collapse step. Irreversible. |
| **Workbench** | fixed scrap amount per use | Converts scrap → ammo at one fixed exchange rate. Repeatable while you have scrap. |

**Safe zones are never overrun.** Both factions ignore the activated platform.
This is a hard rule — it makes "run for the safe zone" always a valid panic move.

### 3.5 Area state machine

Every area holds exactly one state:

`safe` → `clear` → `infested` → `contested` → `controlled`

- `safe` — activated safe zone; nothing hostile, ever.
- `clear` — empty or one straggler.
- `infested` — zombies only.
- `contested` — zombies **and** crew, fighting each other.
- `controlled` — crew only, dug in behind cover in prepared positions.

Each area's spawn table keys off its current state. In the slice:

- **Old Platform** is hard-coded `safe` once activated (`clear` before).
- **Disused Tunnel** is hard-coded `infested`, permanently.
- **Concourse Stairwell** starts `contested` and flips to `controlled` when the
  circle passes its threshold (in practice: after the player's 2nd rest).

The state machine is **stubbed in phase 4** (a per-area variable, manually set)
and **driven by the circle in phase 6**. Building the hook early avoids a
retrofit.

### 3.6 The closing circle (phase 6)

One global value: **collapse depth** — how far the military perimeter has pushed
in from the street, measured along the vertical axis.

Advances by two mechanisms:

1. **Real-time drip** — a slow constant increase while the game runs.
2. **Per-rest jump** — a discrete step every time the player Rests at the safe
   zone. This is the bigger contributor and the source of the "should I rest
   again" tension.

Each area computes its state from `collapse depth` vs. `area distance from
street`. One distance check + one threshold lookup per area. No scripting, no
per-area timers.

**Diegetic communication — the only channels:**

- **Audio.** Distant gunfire, muffled shouting, breaching charges. Gets closer
  and louder as collapse depth increases. Between one rest and the next the
  player should *hear* the difference.
- **Spawn swap.** When the Stairwell flips `contested` → `controlled`, the
  fireteam-in-the-open spawn set is replaced by a dug-in-troopers-behind-cover
  set. The player who backtracks up the stairs finds men with rifles where
  yesterday there was a running firefight.

**One tuning knob:** a single `circleSpeed` multiplier scaling both the drip and
the per-rest jump. The entire phase-6 playtest is finding whether a value exists
where "rest again vs. push now" is a real dilemma. If no such band exists, the
concept has failed — cheaply, on purpose.

### 3.7 Death

- Respawn at the **last activated safe zone**. If none has been activated,
  respawn at **game start** (the platform, pre-activation).
- Reload restores the last save — which was written at the last Rest. Health,
  ammo, scrap, opened doors, pickups taken, **and collapse depth** all return to
  their last-rest values.
- **No separate death penalty.** Because saving only happens at Rest, "reload
  last save" and "the circle persisted" are the same state. Attempting the exit
  and dying is a clean retry; the only irreversible cost in the game is choosing
  to Rest.

### 3.8 Narrative surface (slice)

Non-linear, in-world, no cutscenes.

- **1 wall terminal** in the Disused Tunnel. Interact → paused fullscreen text
  overlay. Content establishes, briefly:
  - This is **site 2**, a public transit station.
  - The disused lines physically connect it to a facility that everyone was told
    were sealed.
  - The prologue outbreak was declared "contained." The reader can infer it
    wasn't.
- **Optionally 1 audio log** (plays on pickup, non-blocking) as a second channel
  if audio playback is cheap to wire.
- The deep *why* — what the facility is, why it is being erased — is **not** in
  the slice. It lives in areas out of scope.

---

## 4. Build phases

Each phase is independently runnable and playtestable, mirroring the raycaster
engine's own p1–p10 build. Ship each as its own `.stm` + `.bas` demo project (or
successive commits on one), following the six-step module process in `CLAUDE.md`.

### Phase 1 — Map + controls + scene transitions

- Three scenes authored in `.stm` (Platform, Tunnel, Stairwell), each a stub
  layout with an entry point and the doorway/stairwell transition tiles.
- Raycaster walk / strafe / turn — tunable.
- **Interact** action wired, with its first real use: scene transitions
  (doorway prompt → fade → load target scene at matching entry point).
- Static world, no entities, no pickups.
- **Test:** the space is navigable, the three scenes read as distinct connected
  areas, transitions feel right, and the controls feel good.

### Phase 2 — Weapons + pickups

- Firearm: aim, fire, hitscan, ammo count, muzzle flash. (No targets yet — fire
  into walls.)
- Ammo + scrap pickups placed in Tunnel and Stairwell; HUD counters.
- Safe-zone **Activate** node (scrap cost) + **Workbench** node (scrap → ammo).
- Wall terminal + paused text-overlay mode.
- **Test:** the gather → activate → craft loop is satisfying *with no enemies*.

### Phase 3 — Safe zone complete

- **Rest** node: full heal, save, respawn point set.
- Death → reload last save. Respawn at safe zone, or game start if unactivated.
- **Test:** the full survival-collection loop (gather, activate, rest, die,
  reload) works end to end, still with no enemies.

### Phase 4 — Zombies

- **Shambler**: port the demo `Enemy` class → slow, melee, tanky, chases,
  punishes standing still.
- Placement in Tunnel (permanent `infested`) and Stairwell.
- **Area-state stub**: per-area state variable, manually set, read by spawn
  placement. No circle yet.
- **Test:** the gather loop under melee pressure. Is ammo scarcity real? Is
  retreating to the safe zone a meaningful relief?

### Phase 5 — Military

- **Trooper**: hitscan fire, uses cover, takes cover when shot at. ~90% of the
  demo `Enemy` already.
- **`raycast()` line-of-sight helper** (new engine primitive — see §5) for
  trooper fire and cover checks.
- **Faction targeting**: both factions target *nearest threat*, and the threat
  list includes the other faction. Troopers shoot approaching shamblers;
  shamblers swarm troopers. Player is a threat to both.
- Stairwell now spawns a `contested` mix — a live firefight.
- **Test:** ranged combat works; the faction war reads and is exploitable (lead
  a horde up the stairs into the fireteam).

### Phase 6 — Close the circle

- Global collapse-depth value: real-time drip + per-rest jump.
- Area states derived from collapse depth (replaces the phase-4 manual stub).
- Diegetic audio bed that intensifies with collapse depth.
- Stairwell `contested` → `controlled` spawn swap at the threshold.
- Single `circleSpeed` tuning knob.
- **Optional:** minimap assist (easy mode only) — may slip or be cut.
- **Test:** is there a `circleSpeed` band where "rest again vs. push now" is a
  genuine dilemma? This is the whole slice.

---

## 5. Engine primitives needed

From `docs/raycaster-game-concept.md`'s "Engine asks", the slice needs:

| Primitive | Size | Phase | Notes |
|---|---|---|---|
| ~~Interact action~~ | — | 1 | **Not an engine primitive.** `input.bind`/`input.pressed` already exist; the "aim and press" logic is game `.bas`. |
| ~~Scene transition trigger + entry points~~ | — | 1 | **Not an engine primitive.** `scenemanager.switch` + `tilemapset.markersByTag` + `RcMover.warpTo` already exist; the doorway/entry logic is game `.bas` (`AreaHelpers.bas`). Confirmed during phase-1 planning. |
| **Paused text-overlay mode** | Small | 2 | Overlay pauses the sim and draws a fullscreen text panel (the demo's zero-art billboard trick works for this). |
| **`raycast(x, y, dx, dy)` line-of-sight helper** | Medium | 5 | Returns first wall hit / distance along a ray in grid space. Trooper fire, cover checks. Every future raycaster game wants this rather than hand-rolled DDA. |
| **Minimap** (auto-revealing, per-area state colour) | Medium | 6 (optional) | Easy-mode assist only. Not core to the slice; cut if it costs too much. |

**Not in the slice:** batched wall-strip draw (perf headroom, unnecessary at
three small areas), any new lighting/rendering work, projectile travel, throwables.

Everything else — day clock, circle logic, safe-zone nodes, resources, enemy
roster, weapon, terminal content — is `.bas` logic on top of existing modules
(`save`, `tilemap`, the raycaster lib, `Enemy`). No further primitives.

---

## 6. Success criteria

The slice passes if, in playtest:

1. **End of phase 3:** the gather → activate → rest loop is engaging on its own,
   before any enemy exists.
2. **End of phase 5:** the faction war in the Stairwell is legible and
   exploitable — the player can *see* it happening and can use it.
3. **End of phase 6:** there is a findable `circleSpeed` value where "rest again
   or push now" is a genuine dilemma — neither choice is obviously correct.

If phase 6 yields no tense knob-band, the concept has failed at low cost, which
is the explicit purpose of building the circle last and in isolation.

### What a passing slice unlocks (not this spec)

Level design across the full station, asset generation (enemy sprites, weapon
art, environment textures, audio), combat depth (melee, throwables, the full
enemy roster), the full safe-zone tree, multiple safe zones, keycard/elevator
gating, and the facility act with the deep narrative payload.

---

## 7. Open questions carried into implementation

1. **Pickup collection** — auto-collect on walk-over vs. interact-to-collect.
   Lean auto-collect for the slice; revisit only if it feels bad.
2. **Desperation shove** — include in phase 2 only if it's near-free; otherwise
   drop it.
3. **Circle drip vs. per-rest jump ratio** — pure phase-6 tuning. Start with the
   jump dominant and the drip barely perceptible.
4. **Stairwell depth** — one area deep for the slice. If the "push vs. rest"
   gate feels too binary in playtest, the step-up adds Stairwell → Concourse →
   Street as separate gates.
5. **Audio-log channel** — include only if audio playback is already cheap in
   the engine at phase 2.
6. **Scene transition affordance** — how much fade/animation, whether the
   doorway needs art or a zero-art trick suffices, how player facing is set on
   arrival. Phase 1 tuning.
7. **Circle vs. discrete scenes** — collapse depth stays a single global; each
   scene reads it on load to pick its spawn set. Confirm this composes cleanly
   when phase 6 lands (expected fine — no per-scene timers).
