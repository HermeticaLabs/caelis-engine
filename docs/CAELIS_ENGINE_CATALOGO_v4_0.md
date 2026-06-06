# Caelis Engine — Function Catalog
## Version 4.0 — Canonical Reference

```
Author:       Cristian Valeria Bravo
Organization: Hermetica Labs
Status:       Canonical — supersedes v3.0.1
Date:         2026-06
```

**Notation**

| Symbol | Meaning |
|---|---|
| φ | Observer latitude (radians, internal) |
| λ | Observer longitude (radians, internal) |
| T | Julian centuries from J2000.0 |
| ° | Degrees (external API) |
| ″ | Arcseconds |
| → | Return type |

---

# Module 1 — TimeEngine

**The only module that reads `Date.now()`.**
All other modules receive time as an explicit parameter.

---

## `setObserver(latDeg, lonDeg, label?)`

Sets the observer's geodetic coordinates.

| Parameter | Range | Description |
|---|---|---|
| `latDeg` | [−90, +90] | Geodetic latitude, degrees (+N) |
| `lonDeg` | [−180, +180] | Geodetic longitude, degrees (+E) |
| `label` | string? | Optional display label (UI only) |

**Side effects:** updates `lat` (radians), `lon` (radians), `R_TIERRA` (WGS-84 geocentric radius). Atomic — all three updated together.

---

## `setOffset(seconds)`

Sets a time displacement applied to all subsequent `getSnapshot()` calls.

| Value | Effect |
|---|---|
| > 0 | Future |
| < 0 | Past |
| 0 | Real time |

**Side effects:** calls `_invalidateAstroCache()` to clear nutation and node caches.

---

## `getSnapshot(config?)` → `snapshot v3.1`

Primary output function. Computes the complete astronomical snapshot for the current time + observer state.

**Parameters:**

```javascript
config = {
  houseSystem: 'placidus' | 'porfirio' | 'alcabitius' | 'equal' | 'wholesign'
}
```

**Pipeline executed (in this order, always):**

1. `currentTime()` → unix seconds (the only `Date.now()` call in the pipeline)
2. `julianDateUTC()` → JD_UTC
3. `deltaT(jd)` → ΔT; `julianDate()` → JD_TT
4. `T = (JD_TT − 2451545.0) / 36525`
5. `nutation(T)` → ΔΨ, Δε (IAU 2000B, 77 terms)
6. `trueObliquity(T)` → ε_true = ε_mean + Δε
7. `gast(jd)` → GAST; `getLST()` → LST
8. ASC, MC computed from LST + ε_true + φ → `_houseConfig` (internal)
9. For each planet: VSOP87B → geocentric → light-time → aberration → ΔΨ → equatorial → horizontal → refraction
10. Moon: ELP/MPP02-LLR → ΔΨ → equatorial → topocentric parallax → horizontal → refraction
11. `lunarNodes()` → NodoNorte, NodoSur in bodies
12. Lunar phase, illumination, distance
13. `quality_flags`

**Key properties:**
- Pure function — same inputs always produce same outputs
- No side effects — does not modify any global state
- Internal fields (`_houseConfig`, `_nodes`) filtered from public JSON

**Returns:** `snapshot` schema v3.1 (see SPEC §4)

---

## `getSnapshotAt(jd_tt, observer)` → `snapshot v3.1`

Computes a snapshot for any arbitrary epoch without affecting the engine's current time state. Atomic — state fully restored even on exception.

| Parameter | Type | Description |
|---|---|---|
| `jd_tt` | number | Target Julian Date Terrestrial Time |
| `observer` | `{lat_deg, lon_deg}` or `(lat, lon)` | Observer coordinates |

**Implementation:** reads `Date.now()` once atomically, sets `timeOffset = jd_utc_target - Date.now_snapshot`, calls `getSnapshot()`, restores state in `finally`. Meta fields (`jd_tt`, `jd_utc`, `delta_t_sec`) patched to exact target values post-computation.

**Used by:** Atacir internally for eclipse prediction, synastry, `_eclVerSnapshot`.

---

## `_getSnapshotFromJD(jd_tt_explicit)` → `snapshot v3.1`

Internal deterministic computation from explicit JD_TT. Uses `Date.now()` exactly once to avoid race conditions. Not part of the public API — called by `getSnapshotAt`.

---

## Internal TimeEngine functions

### `currentTime()` → `number` (Unix seconds)
```
currentTime() = Date.now() / 1000 + timeOffset
```
**The only place in the entire engine where `Date.now()` is called.**

### `julianDateUTC()` → `number` (JD_UTC)
```
JD_UTC = currentTime() / 86400 + 2440587.5
```

### `julianDate()` → `number` (JD_TT)
```
JD_TT = JD_UTC + deltaT(JD_UTC) / 86400
```

### `deltaT(jd)` → `number` (seconds)
Source: IERS table [500–2150 AD] with linear interpolation.  
Outside range: Morrison-Stephenson (2004) parabolic extrapolation.  
Sets `quality_flags.delta_t_extrapolated = true` when outside range.

### `gast(jd)` → `number` (degrees)
Greenwich Apparent Sidereal Time. Follows IAU 2006 four-step procedure: ERA → precession polynomial → equation of equinoxes → GAST.

### `getLST()` → `number` (radians)
```
LST_rad = ((gast(JD_TT) + lon_observer_deg) mod 360) * deg2rad
```

### `geocentricRadius()` → `number` (km)
WGS-84 geocentric radius at current observer latitude. Used for lunar topocentric parallax.

---

# Module 2 — AstroCore

**Pure computational core.** Never calls `Date.now()`. Receives time as parameter. Returns physical state of the solar system. Zero interpretive concepts.

---

## `nutation(T)` → `{ deltaPsi, deltaEps }` (radians)

IAU 2000B — 77 luni-solar terms.

```
ΔΨ = Σᵢ (S_i + S'_i·T) · sin(Σ n_ij·f_j)
Δε = Σᵢ (C_i + C'_i·T) · cos(Σ n_ij·f_j)
```

**Cache:** invalidated when |ΔT| > 1×10⁻⁹ centuries.  
**Precision:** < 1 mas vs. IAU 2000A (1365 terms).  
**Source:** Mathews, Herring & Buffett (2002).

---

## `meanObliquity(T)` → `number` (radians)

IAU 2006 fifth-degree polynomial (Capitaine et al. 2006):
```
ε_mean = 84381.406″ − 46.836769″·T − 0.0001831″·T² + ...
```

## `trueObliquity(T)` → `number` (radians)
```
ε_true = meanObliquity(T) + nutation(T).deltaEps
```

---

## `sunPosition()` → `{ ra, dec }` (radians)

Geocentric apparent equatorial coordinates of the Sun.

**Pipeline:** VSOP87B Earth heliocentric → negated geocentric → light-time → aberration → ΔΨ → equatorial.

---

## `moonPosition()` → `{ ra, dec, lon_ecl_geo, lat_ecl_geo }`

Returns topocentric RA/Dec (radians) plus geocentric ecliptic longitude and latitude (degrees) directly from ELP series.

**RA/Dec:** topocentric (parallax applied for observer position).  
**lon_ecl_geo / lat_ecl_geo:** geocentric (direct from ELP, before parallax).

This dual return is the source of the schema's `lon_ecl_geocentric_deg` / `lon_ecl_topocentric_deg` separation for the Moon.

---

## `planetPosition(name)` → `{ ra, dec }` (radians)

Geocentric apparent equatorial coordinates.

**Pipeline:** VSOP87B heliocentric → geocentric → light-time (1 iteration) → annual aberration → ΔΨ → ecliptic-to-equatorial.

**Valid names:** `'Mercurio'`, `'Venus'`, `'Marte'`, `'Júpiter'`, `'Saturno'`, `'Urano'`, `'Neptuno'`

---

## `lunarNodes()` → `{ omega, north, south }`

Ascending node Ω (Meeus Ch.47):
```
Ω = 125.04452° − 1934.136261°·T + ...
```

| Field | Type | Description |
|---|---|---|
| `omega` | number° | Ascending node ecliptic longitude |
| `north.ra`, `north.dec` | radians | North node equatorial |
| `south.lon_ecl` | degrees | South node ecliptic longitude |
| `south.ra`, `south.dec` | radians | South node equatorial |

**Cache:** invalidated when |ΔT| > 1×10⁻⁸ centuries.

---

## `applyRefraction(alt_rad)` → `number` (radians)

Bennett (1982) formula. No correction when alt < −1° (returns input unchanged).

```
R = 1.02 / tan((a + 10.3/(a + 5.11)) · deg2rad)   [arcminutes]
a_apparent = a + R/60   [degrees]
```

---

## `eclipticToEquatorialWithEps(lambda, beta, eps)` → `{ ra, dec }` (radians)

Standard ecliptic-to-equatorial transformation using true obliquity.

---

## `geocentricEclipticWithLightTime(name, T, jd)` → `{ lambda, beta, dist }`

Geocentric ecliptic coordinates (radians) and distance (AU) with one iteration of light-time correction. Used internally by the planet pipeline.

---

## `heliocentricCoords(name, T)` → `{ x, y, z }` (AU)

VSOP87B heliocentric rectangular coordinates. Reference frame: mean ecliptic J2000.0. `T` in Julian centuries.

---

## `annualAberration(lambda, beta, T)` → `{ lambda, beta }` (radians)

Annual aberration applied to ecliptic coordinates. Uses numerical velocity vector from VSOP87B Earth position. κ = 9.9365×10⁻⁵ rad.

---

## `_bodyData(ra, dec)` → bodyEntry

Internal function. Computes all output fields for a single body given equatorial coordinates (radians).

**Executes:**
1. Hour angle: H = LST − RA
2. Geometric altitude (arcsin formula)
3. Apparent altitude (Bennett refraction)
4. Azimuth (atan2, N=0 clockwise)

**Returns:**
```javascript
{
  ra_deg, dec_deg,
  lon_ecl_geocentric_deg, lat_ecl_geocentric_deg,
  alt_geometric_deg, alt_apparent_deg, az_deg,
  above_horizon  // alt_geometric > 0 (geometric, unrefracted)
  // NO house field — interpretive concept removed in v4.0
}
```

---

## `_attachHousesProxy(snap)` → snap

Attaches a virtual `snap.houses` property (non-enumerable getter) that resolves from `snap.atacir.houses` or `snap._houseConfig` at access time. Ensures internal Atacir code that references `rx.houses` continues to work without pollution of the public JSON schema.

**Properties:**
- `enumerable: false` — invisible to `JSON.stringify`
- `configurable: true` — can be removed
- Idempotent — safe to call multiple times

---

## `_getHouses(snap)` → houseConfig | null

Resolves house configuration from any snapshot:
1. `snap.atacir.houses` (if Atacir has run)
2. `snap._houseConfig` (internal pre-Atacir)
3. `getHouseCusps(...)` as fallback

---

## Global state variables (AstroCore)

| Variable | Default | Set by | Used by |
|---|---|---|---|
| `lat` | −33.45·deg2rad | `setObserver()` | all horizontal calculations, parallax |
| `lon` | −70.66·deg2rad | `setObserver()` | LST computation |
| `timeOffset` | 0 | `setOffset()`, UI | `currentTime()` |
| `timeSpeed` | 0 | UI | `getSnapshotAt()` guard |
| `houseSystem` | `'placidus'` | `_syncHouseSystem()` | `_houseConfig` resolution |
| `R_TIERRA` | geocentricRadius() | `setObserver()` | Moon topocentric parallax |

**Invariant:** `setObserver()` updates `lat`, `lon`, and `R_TIERRA` atomically.

---

## Constants

| Constant | Value | Description |
|---|---|---|
| `deg2rad` | π / 180 | Degrees to radians |
| `rad2deg` | 180 / π | Radians to degrees |
| `C_LIGHT` | 173.1446326 | Speed of light (AU/day) |
| `J2000` | 2451545.0 | JD of J2000.0 epoch |
| `UNIX_EPOCH_JD` | 2440587.5 | JD of Unix epoch |

---

## Body name registry

| Key | Body | Coordinate frame |
|---|---|---|
| `Sol` | Sun | Geocentric apparent |
| `Luna` | Moon | Topocentric apparent (+ geocentric ecliptic) |
| `Mercurio` | Mercury | Geocentric apparent |
| `Venus` | Venus | Geocentric apparent |
| `Marte` | Mars | Geocentric apparent |
| `Jupiter` | Jupiter | Geocentric apparent |
| `Saturno` | Saturn | Geocentric apparent |
| `Urano` | Uranus | Geocentric apparent |
| `Neptuno` | Neptune | Geocentric apparent |
| `NodoNorte` | North Node | Geocentric (Meeus Ch.47) |
| `NodoSur` | South Node | Geocentric (Meeus Ch.47, Ω+180°) |

---

# Module 3 — House Calculation Engine (Atacir zone)

**v4.0 note:** House functions reside in the Atacir zone (migrated from AstroCore in v4.0). They compute geometric values from astronomical state but are interpretively dispensable. In the monolith they share scope with AstroCore for compatibility.

---

## `getHouseCusps(forLatDeg?, systemOverride?)` → `{ cusps, asc, mc, eps, system }`

Computes house cusps for the given system and observer latitude.

| System | Method |
|---|---|
| `'placidus'` | Newton-Raphson on oblique ascension semi-arc |
| `'porfirio'` | Ecliptic trisection of quadrant arcs |
| `'alcabitius'` | Diurnal semi-arc trisection |
| `'equal'` | ASC + 30° increments |
| `'wholesign'` | Whole sign from ASC |

**Polar Safety Switch™:** Placidus → Porphyry when `|tan(δ)·tan(φ)| > 1`. Porphyry → Equal when `|φ| > 66.5°`. Fallback declared in `system` field (e.g. `"porfirio (fallback)"`).

## `semiArcDiurno(decDeg, latDeg)` → `number | null`
Diurnal semi-arc. Returns `null` when circumpolar condition detected.

## `placidusHouseCusps(asc, mc, eps, latDeg)` → `number[12] | null`
Newton-Raphson iteration on oblique ascension. Returns `null` on polar failure.

## `porfirioHouseCusps(asc, mc)` → `number[12]`
Ecliptic trisection. Always succeeds.

## `alcabitiusHouseCusps(asc, mc, eps, latDeg)` → `number[12] | null`
Diurnal semi-arc trisection. Returns `null` on polar failure.

## `wholeSignHouseCusps(asc)` → `number[12]`
Whole sign houses. Always succeeds.

---

# Module 4 — Atacir

**A**rc-based **T**ransformation of **A**stronomical **C**oordinates for **I**nterpretive **R**esolution.

Optional. Receives snapshot. Appends derived computations under `result.atacir.*`. Never modifies snapshot.

---

## `Atacir.compute(snapshot, config?)` → atacirResult

Master function. Executes only plugins declared active in `config` and the global toggle state.

```javascript
config = {
  plugins:  { houses: true, aspects: true, ... },  // per-call override
  synastry: { dateB, timeB, latB, lonB },
  eclipses: { range, solar, lunar },
  transit:  snapshot_v3.1
}
```

**Returns:**
```javascript
{
  ...snapshot,       // immutable
  atacir: {
    engine:         'Atacir v4.0 · Hermetica Labs',
    plugins_active: ['houses', 'aspects', ...],
    errors:         { pluginKey: 'message' },
    [pluginKey]:    { ... }  // one entry per active plugin
  }
}
```

---

## `Atacir.setToggle(key, value)` → void

Sets a plugin's global toggle state. Changes take effect on the next `Atacir.compute()` call.

## `Atacir.getToggles()` → `{ [key]: boolean }`

Returns a copy of all plugin toggle states.

## `Atacir.exportJSON(result)` → string

Serializes `atacirResult` to JSON string. Filters internal `_*` fields. Pretty-printed (2-space indent).

---

## Plugin catalog

### `houses` plugin

Computes house cusps and assigns each body to a house.

**Reads:** `snap._houseConfig` (ASC, MC, system)  
**Returns:**
```javascript
{
  system:      'placidus',
  asc:         104.395,
  mc:          179.584,
  cusps:       [104.4, 134.0, ...],   // 12 values
  body_houses: { Sol: 4, Luna: 3, ... },
  nodes:       { north: { lon_ecl_deg, ra_deg, dec_deg }, south: { ... } }
}
```

### `directions` plugin

Primary directions by oblique ascension.

```javascript
// Oblique ascension of a body at latitude φ:
OA = ra − arcsin(tan(dec)·tan(φ))
// Arc of direction:
arc = |OA_promissor − OA_significator|
// Age of event (Naibod key):
age_years = arc / 0.9856°
```

**Returns:** `direction[]` — `{ body, angle_target, arc_deg, arc_years }`

### `aspects` plugin

Five major aspects with configurable orbs. Luminaries (Sol, Luna) receive +2° bonus.

| Aspect | Angle | Default orb |
|---|---|---|
| Conjunción | 0° | 8° (+2° luminaries) |
| Oposición | 180° | 8° (+2°) |
| Trígono | 120° | 6° (+2°) |
| Cuadratura | 90° | 6° (+2°) |
| Sextil | 60° | 4° (+2°) |

**Returns:** `aspect[]` sorted by precision descending.

### `symmetries` plugin

Ecliptic symmetries within a snapshot.

```
antiscion(λ)      = 180° − λ  (mod 360°)
contrantiscion(λ) = 360° − λ  (mod 360°)
```

**Returns:** `{ antiscia: sym[], contrantiscia: sym[], ejeasc: sym[], ejemc: sym[] }`

### `lunar` plugin

Lunar phases, apsides, and cycles.

**Returns:** phase data, next new/full moon JDE, perigee/apogee JDE, and cycles.

### `cycles` plugin

Synodic periods and estimated days to next return.

**Returns:** `cycle[]` — `{ body, period_days, period_years, next_days }`

### `resonances` plugin

Detects orbital resonance pairs using rational approximation p/q ≤ 16.

**Returns:** `resonance[]` — `{ bodyA, bodyB, p, q, quality }`

### `panchanga` plugin

Vedic almanac (Lahiri ayanamsa). Receives `jde` explicitly.

| Element | Formula |
|---|---|
| Tithi | floor(λ_moon_sid / 12°) |
| Vara | Weekday from JD |
| Nakshatra | floor(λ_moon_sid / 13.333°) mod 27 |
| Yoga | floor((λ_sun_sid + λ_moon_sid) / 13.333°) mod 27 |
| Karana | Half-tithi |

### `synastry` plugin

Cross-aspects between two complete snapshots. Runs as independent flow — does not modify global `_snap`.

**Signature:** `calcSinastriaCore(dateA, timeA, latA, lonA, dateB, timeB, latB, lonB)` → `{ aspectos: aspect[] }`

### `eclipses` plugin

Eclipse prediction using Meeus Ch.54 Saros method.

**Condition:**  
Solar: `|sin(F)| < 0.36`  
Lunar: `|sin(F)| < 0.40`

**Returns:** `eclipse[]` — `{ jde, tipo, subtipo, magnitud, dist?, visible }`

---

## Error codes and quality flags

| Flag | Condition | Impact |
|---|---|---|
| `delta_t_extrapolated: true` | Date outside [500, 2150 AD] | ΔT error up to ±20s |
| `low_altitude_refraction_risk: [...]` | Body alt_geometric < 5° | ±5′ refraction error |
| `atacir.errors.{plugin}` | Plugin threw exception | Plugin absent from output |
| `houses.system: "porfirio (fallback)"` | Polar Safety Switch™ triggered | System substituted |

---

*Caelis Engine v4.0 · Hermetica Labs · © 2024–2026 Cristian Valeria Bravo*
