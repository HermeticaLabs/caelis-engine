# Changelog — Caelis Engine

All notable changes to Caelis Engine are documented in this file.

Format: [Semantic Versioning](https://semver.org) — `MAJOR.MINOR.PATCH`

---

## [4.0.3] — 2026-08

### Fixed — Critical correctness and robustness fixes

**Lunar nodes incorrect in `getSnapshotAt()` (regression)**
`lunarNodes()` was called after `finally { timeOffset = savedOffset }`,
meaning nodes were computed for the current time instead of the target JD.
Fixed by moving `lunarNodes()` inside the `try` block, before state restoration.

**`setOffset` exported but not defined**
`module.exports` referenced `setOffset` which does not exist in the motor.
Removed from exports.

**DOM references without guards in Node.js scope**
`setObserver()`, `applyManualLocation()`, `initLocation()` accessed
`document` and `navigator` without checking if they exist.
Added `typeof document !== 'undefined'` and `typeof navigator === 'undefined'`
guards — motor now runs cleanly in any JavaScript environment.

**`getSnapshotAt()` input validation**
Passing `NaN` or `undefined` as `jdTarget` or observer coordinates
produced silent NaN cascade. Now throws `RangeError` with a clear message.

**`AtacirClient` X-Client header inconsistency**
`_post()` sent `caelis-engine/4.0`, `_get()` sent `caelis-engine/4.0.2`.
Unified via `CLIENT_VERSION = '4.0.2'` constant.

### Validation
- Core suite: 28/28 passing
- Extended benchmarks: 67/67 passing
- Total: 95/95 assertions · 0 failures

---

## [4.0.2] — 2026-06

### Fixed — Final pre-release cleanup

**Lunar node latitude floating-point underflow (Issue #1)**
`bodies.NodoNorte.lat_ecl_deg` and `bodies.NodoSur.lat_ecl_deg` returned
floating-point residuals (~1e-15) from the equatorial-to-ecliptic transformation.
Lunar nodes are geometric intersections with the ecliptic — their ecliptic
latitude is exactly 0 by definition. Fixed in both `getSnapshot()` and
`getSnapshotAt()` by explicitly setting `lat_ecl_deg: 0` after `_bodyData()`.

**Audited and confirmed resolved (no code change needed):**
- `_sunLonAtJDE` — R3 compliant, `timeOffset` correctly restored
- `setObserver` — zero DOM refs in motor scope (stubs are comments only)
- `_isPremium` — removed from motor in v4.0, confirmed absent
- `applyManualLocation` / `initLocation` — migrated to UI Controller in v4.0

### Validation
- Core suite: 28/28 passing
- Extended benchmarks: 67/67 passing (10 epochs · 5 canonical sources)
- Total: 95/95 assertions · 0 failures

---

## [4.0.1] — 2026-06

### Fixed — Defensive validation

Three guard clauses added to prevent cascading failures when the snapshot
structure is invalid or corrupted. These do not affect any valid usage —
they only intercept malformed data before it reaches the render layer.

**`Atacir.compute(snapshot)`** — now validates that `snapshot` is a non-null
object with `meta.jd_tt` and `bodies` before executing any plugin. Returns
the input unchanged if invalid, with a `console.error` message. Previously,
a corrupted snapshot would cause cryptic errors deep in the plugin pipeline.

**`renderSnap(s)`** — now checks for `s.meta.jd_tt` and `s.meta.sidereal`
before accessing nested fields. Uses optional chaining (`?.`) throughout.
Previously, a missing `meta.sidereal` caused `TypeError: Cannot read
properties of undefined (reading 'lst_deg')`.

**`computeAll()`** — now validates the result of `Atacir.compute()` before
assigning it to `_snap` and calling the render chain. Displays a clear
status message if the result is invalid.

### Notes

These fixes address the UI rendering layer only. The mathematical pipeline
(TimeEngine, AstroCore, VSOP87B, ELP/MPP02-LLR) is unchanged.
The validation suite remains 28/28 passing.

---

## [4.0.0] — 2026-06

### Architecture

**BREAKING: Pure astronomical output schema.**
The snapshot produced by `getSnapshot()` and `getSnapshotAt()` no longer contains interpretive concepts. The following fields have been removed from the public schema:

- `snapshot.houses` — moved to `result.atacir.houses` (plugin)
- `snapshot.bodies[*].house` — removed entirely from body entries
- `NodoNorte` and `NodoSur` remain in `snapshot.bodies` with correct `lon_ecl_geocentric_deg` field (previously used non-standard `lon_ecl`)

**NEW: Atacir plugin system.**
`Atacir.compute(snapshot, config)` is now the formal entry point for all interpretive computations. Output is appended under `result.atacir.*` — the snapshot is never modified.

**NEW: Plugin Contract R1-R5.**
Every Atacir plugin is a pure function conforming to five invariants: no snapshot mutation, no `Date.now()`, no global state access, declared namespace, full determinism.

**NEW: A.T.A.C.I.R. Cloud API client.**
`AtacirClient.js` provides a typed client for the Hermetica Labs API. The computation logic remains server-side and proprietary.

### Mathematical pipeline

**FIXED: `getSnapshotAt()` race condition.**
Previous implementation used `Date.now()` twice (once to set offset, once inside `currentTime()`). Now reads `Date.now()` exactly once, eliminating drift at historical epochs.

**FIXED: `_lonAtJDE()` — no longer mutates global state.**
Previous implementation saved and restored `timeOffset`, `lat`, `lon`. Now calculates directly from JDE using `_elp_args()` and `vsop87Tierra()` without touching global state. Complies with R2 and R3.

**FIXED: `_eclVisibleAt()` — no longer mutates global state.**
Previous implementation mutated `timeOffset`, `lat`, `lon`, `R_TIERRA`, `timeSpeed`. Now calculates from JDE using `_lonAtJDE()` and `gast()` directly.

**FIXED: `_nextChange()` — removed dead `Date.now()` call.**
Variable `nowJD` was declared but never used.

**FIXED: Lunar nodes `lon_ecl_geocentric_deg`.**
Nodes were added to `bodies` with non-standard field `lon_ecl` in `getSnapshotAt()`. Now use standard `lon_ecl_geocentric_deg` + `lat_ecl_geocentric_deg: 0` in both `getSnapshot()` and `getSnapshotAt()`.

**FIXED: `getHouseCusps()` — accepts explicit `systemOverride` parameter.**
No longer reads `houseSystem` global directly. Explicit parameter with fallback to global for monolith compatibility.

**CHANGED: `calcPanchangaCore(dateStr, timeStr)` → `calcPanchangaCore(jde)`.**
Receives Julian Date explicitly. String-to-JD conversion is the caller's responsibility. Complies with R2.

### Separation of concerns

**MIGRATED: House calculation functions out of AstroCore zone.**
`semiArcDiurno`, `placidusIterateCusp`, `placidusHouseCusps`, `porfirioHouseCusps`, `alcabitiusHouseCusps`, `wholeSignHouseCusps`, `getHouseCusps` moved to the Atacir zone. AstroCore now computes ASC/MC as pure geometric values without calling the house system functions.

**MIGRATED: UI functions out of motor zone.**
`toggleHouseSystem`, `_bodyModalOpenSolsticio`, `drawEcliptic`, `drawNodes` moved to UI Controller. `CaelisEngine.js` no longer references `document`, `canvas`, or any browser API.

**NEW: `_attachHousesProxy(snap)`.**
Attaches a non-enumerable virtual `snap.houses` getter for internal Atacir compatibility. Invisible in `JSON.stringify` output.

### UI reference implementation

**NEW: A.T.A.C.I.R. plugin toggle panel.**
Collapsible sidebar panel with per-plugin ON/OFF pills (violet = active, grey = inactive). Changes take effect on next GetSnapshot.

**NEW: Plugin modals.**
Each plugin accessible via a dedicated modal: Houses, Aspects, Symmetries, Panchanga, Synastry, Eclipses. Each modal has its own GetSnapshot and JSON export.

**NEW: Houses modal with Safety Polar Switch™ toggle.**
Visual control for the automatic polar fallback chain: Placidus → Porphyry → Equal.

**NEW: Timezone handling without friction.**
Sidebar inputs now accept local time + UTC offset selector. `setNow()` auto-detects browser timezone. `_localToUTC()` converts to UTC at the UI boundary — the engine receives UTC internally, no changes to the mathematical pipeline.

**NEW: Bodies tab — pure astronomical JSON viewer.**
Tab now shows the pure astronomical output (`meta + bodies + luna`) without interpretive fields. Dedicated GetSnapshot and export buttons.

**NEW: Eclipse "Ver ↗" button.**
Each eclipse result has a button that loads the snapshot for that exact celestial moment, applies active Atacir plugins, and navigates to the Snapshot tab.

**NEW: Synastry as independent flow.**
Synastry has its own modal, its own GetSnapshot, and produces its own JSON. Does not modify the global `_snap`.

**CHANGED: Tab structure.**
Tabs: `Snapshot · Bodies · A.T.A.C.I.R. · JSON · Engine`
Removed tabs: Houses (→ modal), Panchanga (→ modal), Eclipses (→ modal).

**REMOVED: `_prefsSave()` dead call.**
Function was referenced but never defined. Removed from `setObserver()` and `toggleHouseSystem()`.

**REMOVED: `speedIndex` undefined variable.**
Referenced in `getSnapshotAt()` but never declared. Removed.

### Validation

**NEW: Validation suite — 28/28 passing.**

Five epochs, three canonical sources:

| Epoch | Source | Tests |
|---|---|---|
| J2000.0 | IAU SOFA + VSOP87 | 6 |
| Meeus Ch.25 (1987-Apr-10) | Meeus AA 2nd ed. | 4 |
| Meeus Ch.33 Venus (1992-Apr-12) | VSOP87 verification | 1 |
| 2026-Jun-01 regression | Caelis v4.0 canonical | 8 |
| Schema v3.1 invariants | Architecture contract | 9 |

**NEW: GitHub Actions workflow.**
CI runs validation on every push to `main` or PR touching engine files.

### Documentation

Five new documents:
- `MATEMATICA.md` — complete mathematical pipeline (houses removed from AstroCore section)
- `ARQUITECTURA.md` — formal architecture contract with 10 invariants
- `SPEC.md` — schema v3.1 specification and validation protocol
- `CATALOGO.md` — function-by-function API reference
- `ROADMAP.md` — technical roadmap toward NPM and module separation

---

## [3.0.1] — 2026-05

### Fixed

- Added missing planets Uranus and Neptune (VSOP87B series)
- Corrected `algorithms.sectors` metadata hardcoded as "Placidus" — now reads active system at runtime
- Moon topocentric parallax documented explicitly in schema
- Added Polar Safety Switch fallback chain: Placidus → Porphyry → Equal

---

## [3.0.0] — 2026-04

### Architecture

- Three-module architecture established: TimeEngine → AstroCore → Atacir
- Canonical separation of concerns formalized
- JSON schema v3.1 introduced with self-describing field names
- All astrological/interpretive language replaced with neutral astronomical terminology
- Schema fields renamed: `glifo` → `ecl_lon_label`, `orbe` → `orb_deg`, etc.

### Computation

- IAU 2000B nutation (77 luni-solar terms)
- ELP/MPP02-LLR Moon (164L + 105B + 60R terms)
- VSOP87B planetary series (Mercury–Neptune)
- IAU 2006 obliquity
- Bennett (1982) atmospheric refraction
- ΔT: IERS table 500–2150 AD + Morrison-Stephenson parabola

### Features

- Eclipse detection with Meeus Ch.54 Saros method
- Atacir panel with primary directions
- Multiple house systems: Placidus, Porphyry, Alcabitius, Equal
- Vedic Panchanga with Lahiri ayanamsa
- Synastry cross-aspects
- JSON export schema v3.1

### Removed

- All AI interpretation elements (~226 lines)
- All interpretive/astrological language from field names
- Interpretive text generation

---

## [2.x] — 2025

Internal development. Not publicly released.

---

## [1.x] — 2024

Initial prototype. Not publicly released.

---

*Caelis Engine · Hermetica Labs · © 2024–2026 Cristian Valeria Bravo*
