# Caelis Engine — Architecture Document
## Version 4.0

```
Author:       Cristian Valeria Bravo
Organization: Hermetica Labs
Status:       Canonical
Date:         2026-06
```

---

## 1. Design Philosophy

Caelis Engine is a **pure astronomical computation instrument**.

Its core does one thing: given a time and an observer location, return the
physical state of the solar system with full mathematical traceability.
Every output field names its own coordinate frame. Every algorithm is declared
in the output metadata. Every number is reproducible from the documented pipeline.

The engine does not interpret the sky. It measures it.

---

## 2. Module Architecture

```
┌─────────────────────────────────────────────────────────┐
│  TimeEngine                                             │
│  ─ Only module that reads Date.now()                   │
│  ─ Computes: JD_UTC, JD_TT, ΔT, GAST, LST             │
│  ─ Manages: observer state (lat, lon, R_TIERRA)        │
└────────────────────────┬────────────────────────────────┘
                         │ timeObj → (jd_tt, T, gast, lst, delta_t)
                         ▼
┌─────────────────────────────────────────────────────────┐
│  AstroCore                                              │
│  ─ Never calls Date.now()                              │
│  ─ Receives time as explicit parameter                 │
│  ─ Computes: planets, Moon, nodes, equinoxes           │
│  ─ Returns: snapshot v3.1 (pure astronomical JSON)     │
│  ─ Zero interpretive concepts                          │
└────────────────────────┬────────────────────────────────┘
                         │ snapshot v3.1
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Atacir  (completely optional)                          │
│  Arc-based Transformation of Astronomical Coordinates  │
│  for Interpretive Resolution                           │
│                                                         │
│  ─ Receives snapshot. Never modifies it.               │
│  ─ Executes only active plugins.                       │
│  ─ Appends results under result.atacir.*               │
│  ─ Deterministic: same inputs → same output always.    │
│  ─ A disabled plugin does not exist in the JSON.       │
└─────────────────────────────────────────────────────────┘
```

**No module knows about the one after it.**
TimeEngine does not know AstroCore exists.
AstroCore does not know Atacir exists.
Atacir can be removed entirely without affecting the other two.

---

## 3. Invariants

These are non-negotiable. Any modification that violates them is a regression.

### 3.1 AstroCore invariants

**I-1. No Date.now() in AstroCore.**
AstroCore never calls `Date.now()`, `currentTime()`, or any function that
reads the system clock. Time enters AstroCore only as a parameter.

**I-2. No mutable global state in AstroCore computations.**
`getSnapshot()` and `getSnapshotAt()` are pure functions: same inputs produce
identical outputs. They do not modify `timeOffset`, `lat`, `lon`, or any
other global state.

**I-3. The snapshot contains no interpretive concepts.**
`houses`, `house` (per body), aspects, antiscia, ayanamsa, or any
astrological assignment do not belong in the `bodies`, `meta`, or `luna`
objects. The schema defines the physical state of the solar system.

**I-4. Every field names its coordinate frame.**
`lon_ecl_geocentric_deg` is unambiguous. `lon_ecl_deg` is ambiguous and
must not be used as the primary field for a new body type.

**I-5. Both geometric and apparent altitudes are always present.**
The display layer chooses which to show. The data layer contains both.
`above_horizon` uses geometric altitude as criterion (declared in `meta.frame`).

**I-6. Lunar parallax is always topocentric.**
The Moon is the only body with full topocentric correction (WGS-84 geocentric
radius at observer latitude). This asymmetry is explicit in the schema via
`lon_ecl_geocentric_deg` / `lon_ecl_topocentric_deg` separation.

### 3.2 Atacir invariants

**I-7. Atacir never mutates the snapshot.**
```
Atacir NEVER:  mutates · overrides · deletes
Atacir ONLY:   reads · computes · appends
```

**I-8. Plugin output lives in its own namespace.**
`result.atacir.houses`, `result.atacir.aspects` — never `result.houses`.
A plugin cannot write outside its namespace.

**I-9. Plugin determinism.**
A plugin is a pure function: `(snapshot, config?) → data`.
No plugin calls `Date.now()`, reads `timeOffset`, writes to `lat` or `lon`,
or depends on external state. Rule R2 and R3 of the Plugin Contract.

**I-10. Disabled plugins are absent.**
`result.atacir.plugins_active` lists only the plugins that ran.
A plugin toggled off produces no key in the output.

---

## 4. Schema v3.1 — Structure

```
snapshot {
  schema_version: "3.1"

  meta {
    jd_tt            — Julian Date Terrestrial Time
    jd_utc           — Julian Date UTC
    utc              — ISO 8601 UTC string
    timestamp        — Unix seconds
    delta_t_sec      — TT − UTC in seconds
    observer {
      lat_deg        — Geodetic latitude (+N)
      lon_deg        — Geodetic longitude (+E)
    }
    frame {          — Declares all algorithms used
      nutation       — "IAU 2000B (77 luni-solar terms...)"
      obliquity      — "IAU 2006 (Capitaine et al. 2006)"
      planets        — "VSOP87B (Bretagnon & Francou 1987)..."
      moon           — "ELP/MPP02-LLR..."
      ...
    }
    sidereal {
      gast_deg       — Greenwich Apparent Sidereal Time
      lst_deg        — Local Sidereal Time
    }
    nutation {
      delta_psi_deg / delta_psi_arcsec
      delta_eps_deg / delta_eps_arcsec
    }
    obliquity {
      mean_deg       — ε₀ (IAU 2006)
      true_deg       — ε = ε₀ + Δε
    }
  }

  bodies {
    [BodyName] {
      ra_deg                    — Right Ascension (geocentric apparent)
      dec_deg                   — Declination (geocentric apparent)
      lon_ecl_geocentric_deg    — Ecliptic longitude (geocentric, apparent)
      lat_ecl_geocentric_deg    — Ecliptic latitude (geocentric)
      lon_ecl_topocentric_deg   — [Moon only] topocentric λ
      lat_ecl_topocentric_deg   — [Moon only] topocentric β
      alt_geometric_deg         — Altitude before refraction
      alt_apparent_deg          — Altitude after Saæmundsson refraction (arcmin converted to degrees)
      az_deg                    — Azimuth (N=0, clockwise)
      above_horizon             — alt_geometric_deg > 0
      dist_au                   — [planets] Distance from Earth
      dist_km                   — [Moon] Distance from observer
    }
  }

  luna {
    phase_ratio    — 0=new, 0.5=full, 1=new
    phase_deg      — Elongation [0–180°]
    illumination   — Fraction illuminated [0–1]
  }

  // Fields starting with _ are internal — filtered from all public output
  // _houseConfig, _nodes — never appear in JSON export
}
```

When Atacir is active, output extends to:

```
result {
  ...snapshot,           ← immutable
  atacir {
    engine:          "Atacir v4.0 · Hermetica Labs"
    plugins_active:  ["houses", "aspects", ...]
    errors:          { pluginKey: "message" }  ← only if plugin fails

    houses {         ← plugin: houses
      system, asc, mc, cusps[12], body_houses, nodes
    }
    aspects {        ← plugin: aspects
      natales: [{ nmA, asp, nmB, orb, exactitud, applying }]
    }
    ...              ← one key per active plugin
  }
}
```

---

## 5. Plugin Contract v1.0

Every Atacir plugin is a pure function conforming to:

```javascript
(snapshot, config?) → data | null
```

### Rules

| Rule | Constraint |
|---|---|
| R1 | Does NOT modify `snapshot` or any of its fields |
| R2 | Does NOT call `Date.now()` or `currentTime()` |
| R3 | Does NOT read or write global motor state (`lat`, `lon`, `timeOffset`) |
| R4 | Returns an object with declared namespace, or `null` to skip |
| R5 | Same snapshot + same config = same output. Always. |

### Plugin registry entry

```javascript
{
  key:      'aspects',          // namespace key in atacir output
  label:    'Aspects',          // display label
  describe: '5 major aspects…', // short description
  requires: [],                 // keys of plugins that must be active
  compute:  (snap, cfg) => …   // pure function
}
```

If a `requires` plugin is toggled off, the dependent plugin does not run —
silently, without error.

---

## 6. Data flow

```
User action: GetSnapshot
      │
      ▼
applyObs()   → reads DOM lat/lon → setObserver(lat, lon)
applyTime()  → reads DOM date/time/timezone → converts local→UTC → timeOffset
      │
      ▼
getSnapshot({ houseSystem }) → AstroCore pipeline (§3 of SPEC)
      │
      ▼
_attachHousesProxy(snap)  → adds snap.houses virtual getter (internal compat)
      │
      ▼
Atacir.compute(snap, config)
  ├─ _attachHousesProxy(snapshot)    ← ensure proxy attached
  ├─ resolve active plugins (toggles + requires chain)
  ├─ for each active plugin:
  │    result[plugin.key] = plugin.compute(snapshot, config)
  └─ return { ...snapshot, atacir: { plugins_active, ...results } }
      │
      ▼
renderSnap / renderBodies / renderAtacir / renderJSON
      │
      ▼
JSON output (public)
  → JSON.stringify(result, (k,v) => k.startsWith('_') ? undefined : v)
  → _houseConfig, _nodes invisible in all public output
```

---

## 7. Houses — architectural position

House systems (Placidus, Porphyry, Alcabitius, Equal, Whole Sign) are
**geometrically derived from the astronomical state** (ASC/MC from GAST + observer
latitude), but they are **interpretively dispensable** — they do not affect any
planetary position, any coordinate transformation, or any physical output.

### Current state (v4.0 monolith)
House calculation functions (`getHouseCusps`, `placidusHouseCusps`,
`porfirioHouseCusps`, `alcabitiusHouseCusps`, `wholeSignHouseCusps`) reside
in the AstroCore zone for historical compatibility. They are called during
`getSnapshot()` to populate `_houseConfig` (internal, not exported).

The plugin `atacir.houses` reads `_houseConfig` and produces the public
house output — correctly isolated from the astronomical schema.

### Target state (v4.1+)
House functions migrate to `atacir/plugins/houses.js`.
`getSnapshot()` stops computing `_houseConfig` entirely.
ASC and MC remain computable from TimeEngine data (GAST + observer latitude)
as pure geometric values if needed for Atacir.

---

## 8. Timezone handling

Local time is converted to UTC at the UI boundary — not inside the engine.

```
User input: local date + local time + UTC offset
      │
      ▼
_localToUTC(dateStr, timeStr, tzOffset)
  → { date: UTC_date, time: UTC_time }
      │
      ▼
applyTime() → timeOffset = UTC_unix - Date.now()/1000
      │
      ▼
Engine receives UTC implicitly via timeOffset — no timezone logic inside motor
```

`setNow()` detects the browser's timezone via `Date.getTimezoneOffset()`
and pre-selects the correct UTC offset in the UI selector.

---

## 9. Synastry — parallel flow

Synastry is the **only plugin** that initiates its own snapshot computation.
It does not use the global snapshot. It produces a self-contained JSON result
that does not modify `_snap`.

```
atacirGetSnapshotSynastry()
  ├─ _localToUTC(dateA, timeA, tzA) → UTC_A
  ├─ _localToUTC(dateB, timeB, tzB) → UTC_B
  ├─ calcSinastriaCore(UTC_A, obs_A, UTC_B, obs_B)
  │    ├─ getSnapshotAt(jd_A, obs_A) → snapA
  │    └─ getSnapshotAt(jd_B, obs_B) → snapB
  │         → cross-aspects (snapA × snapB)
  └─ _synResult = { aspectos: [...] }
       → exported as caelis_synastry.json (independent of _snap)
```

---

## 10. Known architectural debts

| Item | Status | Target |
|---|---|---|
| House fns in AstroCore zone | ⚠ compatibility hold | Migrate to Atacir.houses plugin in v4.1 |
| `drawEcliptic`, `drawNodes` in motor zone | ⚠ SVG render in wrong zone | Move to UI Controller in v4.1 |
| `toggleHouseSystem` in motor zone | ⚠ UI function in wrong zone | Move to UI Controller in v4.1 |
| `_bodyModalOpenSolsticio` in motor zone | ⚠ UI function in wrong zone | Move to UI Controller in v4.1 |
| NPM package | 🔲 planned | CaelisEngine.js + Atacir as ESM exports |
| Validation suite vs JPL Horizons | 🔲 in progress | Full regression at 5 reference epochs |

---

*Caelis Engine v4.0 · Hermetica Labs · © 2024–2026 Cristian Valeria Bravo*
