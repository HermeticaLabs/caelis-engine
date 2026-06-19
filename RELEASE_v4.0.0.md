# Caelis Engine v4.0.0

**Complete architectural rewrite. Pure astronomical output. Plugin system. 28/28 validation.**

---

## What's new in v4.0

### The schema is now astronomically pure

The snapshot produced by `getSnapshot()` no longer contains interpretive concepts.
Houses, house assignments per body, and astrological symbology have been removed from the core schema.

The astronomical output is now exactly what it should be: physical state, coordinate frames, declared algorithms, declared precision. Nothing else.

```json
{
  "schema_version": "3.1",
  "meta": { "frame": { "planets": "VSOP87B", "moon": "ELP/MPP02-LLR", ... } },
  "bodies": { "Sol": { "lon_ecl_geocentric_deg": 71.498, "above_horizon": false } },
  "luna":   { "phase_ratio": 0.894, "illumination": 0.972 }
}
```

### A.T.A.C.I.R. plugin system

The interpretive layer is now a formal plugin system with a declared contract.

Every plugin is a pure function:
- Does not modify the snapshot
- Does not call `Date.now()`
- Does not access global state
- Same snapshot + same config = same output. Always.

A disabled plugin does not exist in the JSON.

Available plugins: `houses` · `aspects` · `symmetries` · `lunar` · `cycles` · `resonances` · `panchanga` · `synastry` · `eclipses` · `directions`

### AtacirClient.js — open source API client

The A.T.A.C.I.R. Cloud API client is now published as open source.
The computation logic remains proprietary and server-side.

### Validation suite — 28/28

Mathematical pipeline validated against canonical sources at five reference epochs:

```
✓ ALL TESTS PASSED  28 passed · 0 failed · 5 epochs · 595ms
```

| Epoch | Source |
|---|---|
| J2000.0 | IAU SOFA + VSOP87 verification table |
| 1987-Apr-10 | Meeus *Astronomical Algorithms* Ch.25 |
| 1992-Apr-12 | Meeus Ch.33 (Venus, VSOP87) |
| 2026-Jun-01 | Caelis v4.0 canonical baseline |
| Schema v3.1 | Architecture contract invariants |

---

## Breaking changes from v2.x / v3.x

| What changed | Before | After |
|---|---|---|
| `snapshot.houses` | at root level | `result.atacir.houses` (plugin) |
| `snapshot.bodies[*].house` | present on every body | removed |
| `calcPanchangaCore` signature | `(dateStr, timeStr)` | `(jde)` — explicit Julian Date |
| House functions location | AstroCore scope | Atacir scope |
| `_lonAtJDE()` | mutated global `timeOffset` | pure function, no side effects |
| `_eclVisibleAt()` | mutated `lat`, `lon`, `timeOffset` | pure function, no side effects |

---

## Fixed

- `getSnapshotAt()` race condition — `Date.now()` now read exactly once, atomically
- Lunar nodes `lon_ecl_geocentric_deg` field — was using non-standard `lon_ecl`
- `speedIndex` undefined variable removed from `getSnapshotAt()`
- `_prefsSave()` undefined reference removed
- `_nextChange()` dead `Date.now()` call removed

---

## Installation

```bash
npm install caelis-engine
```

```javascript
import { getSnapshot, setObserver } from 'caelis-engine';

setObserver(-33.45, -70.66);
const snapshot = getSnapshot();

console.log(snapshot.bodies.Sol.lon_ecl_geocentric_deg);
console.log(snapshot.meta.frame.planets); // "VSOP87B (Bretagnon & Francou 1987)"
```

**Single file (no install):** download `dist/caelis-minimal.html` and open with any local server.

---

## License

AGPL-3.0 for open source use.
Commercial license required for proprietary products — `hermeticalabs.dev@proton.me`

---

*Caelis Engine v4.0.0 · Hermetica Labs · © 2024–2026 Cristian Valeria Bravo*
