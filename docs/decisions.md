# Architectural Decisions

Key decisions made during development, with rationale and trade-offs.

---

## 1. Packages slice blacklisted from redux-persist (2026-06-09)

**Decision:** `packages` is excluded from redux-persist via the `blacklist` in `store.ts`.

**Rationale:** Package definitions (`firstPartyPackages.ts`) are derived entirely from code, not from user data. There is no user-owned state in the packages slice. Persisting it created a version-drift hazard: if the slice was persisted at version 2.1.0 and the code shipped 2.2.0 with new `moduleNames`, the upgrade only applied on a full cold load. A Vite HMR reload — the most common development workflow — would not re-run the `useEffect` seeding, leaving stale module lists in the store.

**Trade-offs considered:**
- *Could breaking API changes silently break user projects?* Yes — if a method is renamed or removed, existing projects that used the old API will get a compile error on next load. This is intentional: a clear compiler error is better than silent wrong behaviour, and it signals a change that needs a changelog note. The alternative (version-gating packages in localStorage) only deferred the same impact, it didn't prevent it.
- *Could this destabilise users post go-live?* The risk is low and bounded. The realistic change profile for first-party packages is almost entirely additive (new classes, new methods). Additive changes never break existing code regardless of persistence strategy. Destructive changes (renames, removals) are deliberate decisions that should be communicated anyway.
- *What's the right approach when breaking changes become a real concern?* Semantic versioning at the language level (softBASIC 2.x vs 3.x) with a migration guide — not localStorage version drift. localStorage was never a correct solution to that problem.

**Verdict:** Blacklisting is correct for where the platform is now and for the foreseeable future. Revisit if a third-party package ecosystem is added where package contents are genuinely outside developer control.
