# Caelis Engine — Technical Specification
## Version 4.0 — Schema v3.1

```
Author:       Cristian Valeria Bravo
Organization: Hermetica Labs
Status:       Canonical — do not modify without running validation suite
Date:         2026-06
```

---

## 1. Purpose

This document defines the canonical behavior of Caelis Engine v4.0.
Every number the engine produces must be traceable to a specific algorithm,
source, and step in the mathematical pipeline defined in §3.

The reference implementation is `caelis-minimal.html` — a single HTML file
with no external dependencies. Any deviation from the schema in §4 or the
pipeline in §3 must be documented and validated against the regression suite (§6).

---

## 2. Architecture Summary

```
TimeEngine
  → AstroCore.getSnapshot() → snapshot v3.1
  → Atacir.compute(snapshot, config) → { ...snapshot, atacir: { ... } }
```

Full architecture contract: `ARQUITECTURA.md`

---

## 3. Canonical Mathematical Pipeline

Executed in this exact order for every snapshot. Order is invariant.

```
UTC timestamp (currentTime())
  │
  ▼
JD_UTC = unix_sec / 86400 + 2440587.5
  │
  ▼
ΔT [Morrison-Stephenson + IERS table 500–2150 AD]
  │   JD_TT = JD_UTC + ΔT / 86400
  ▼
T = (JD_TT − 2451545.0) / 36525
  │
  ├──────────────────────────────────────────────────┐
  ▼                                                   │
Nutation [IAU 2000B, 77 terms]                       │
  │  ΔΨ, Δε → cached                                │
  ▼                                                   │
True Obliquity [IAU 2006]                             │
  │  ε_true = ε_mean + Δε                            │
  │                                                   │
  ├── GAST [ERA + precession + EE]                   │
  │   LST = GAST + λ_observer                        │
  │                                                   │
  ▼                                                   ▼
VSOP87B (planets Mercury–Neptune)        ELP/MPP02-LLR (Moon)
  → heliocentric                           164L + 105B + 60R
  → geocentric                           → geocentric ecliptic
  → light-time (1 iteration)             → ΔΨ applied
  → annual aberration                    → ecliptic → equatorial
  → ΔΨ applied                           → topocentric parallax (WGS-84)
  → ecliptic → equatorial (ε_true)       → horizontal + refraction
  → horizontal + refraction
  │
  ├── Lunar nodes Ω [Meeus Ch.47]
  ├── Lunar phase, illumination, distance
  └── quality_flags
  │
  ▼
snapshot v3.1
```

Mathematical details: `MATEMATICA.md`

---

## 4. Output Schema v3.1

### 4.1 Design principles

1. **Every field is self-describing.** Field names include coordinate frame and unit.
2. **No interpretive concepts in the astronomical layer.** Houses, aspects, ayanamsa, and any symbolic assignment belong in `atacir.*`.
3. **Both geometric and apparent altitudes are always present.** Display layers choose; data layer contains both.
4. **`above_horizon` uses geometric altitude** (unrefracted). Declared in `meta.frame.above_horizon_criterion`.
5. **Geocentric and topocentric separated for the Moon.** Explicit in field names.
6. **Fields starting with `_` are internal.** Never appear in public JSON output.

### 4.2 Complete schema

```json
{
  "schema_version": "3.1",

  "meta": {
    "jd_tt":       "<number> Julian Date Terrestrial Time",
    "jd_utc":      "<number> Julian Date UTC",
    "utc":         "<string> ISO 8601 UTC timestamp",
    "timestamp":   "<number> Unix timestamp (seconds)",
    "delta_t_sec": "<number> ΔT = TT − UTC in seconds",

    "observer": {
      "lat_deg": "<number> Geodetic latitude, degrees (+N)",
      "lon_deg": "<number> Geodetic longitude, degrees (+E)"
    },

    "frame": {
      "nutation":                  "IAU 2000B (77 luni-solar terms, Mathews et al. 2002)",
      "obliquity":                 "IAU 2006 (Capitaine et al. 2006)",
      "planets":                   "VSOP87B (Bretagnon & Francou 1987) + Meeus App.II",
      "moon":                      "ELP/MPP02-LLR (Chapront & Francou 2002) 164L+105B+60R",
      "delta_t":                   "Morrison & Stephenson (2004) + IERS table 500-2150 AD",
      "aberration":                "Annual (κ=9.9365e-5, Meeus Ch.23)",
      "refraction":                "Bennett (1982), ISA standard atmosphere",
      "above_horizon_criterion":   "geometric (unrefracted)"
    },

    "sidereal": {
      "gast_deg": "<number> Greenwich Apparent Sidereal Time (degrees)",
      "lst_deg":  "<number> Local Sidereal Time (degrees)"
    },

    "nutation": {
      "delta_psi_deg":    "<number>",
      "delta_eps_deg":    "<number>",
      "delta_psi_arcsec": "<number>",
      "delta_eps_arcsec": "<number>"
    },

    "obliquity": {
      "mean_deg": "<number> Mean obliquity ε₀ (IAU 2006)",
      "true_deg": "<number> True obliquity ε = ε₀ + Δε"
    }
  },

  "bodies": {
    "<BodyName>": {
      "ra_deg":                   "<number> Right Ascension, geocentric apparent [0–360°)",
      "dec_deg":                  "<number> Declination, geocentric apparent [−90°,+90°]",
      "lon_ecl_geocentric_deg":   "<number> Ecliptic longitude, geocentric apparent",
      "lat_ecl_geocentric_deg":   "<number> Ecliptic latitude, geocentric",
      "lon_ecl_topocentric_deg":  "<number> [Moon only] Ecliptic longitude, topocentric",
      "lat_ecl_topocentric_deg":  "<number> [Moon only] Ecliptic latitude, topocentric",
      "alt_geometric_deg":        "<number> Altitude before refraction",
      "alt_apparent_deg":         "<number> Altitude after Bennett refraction",
      "az_deg":                   "<number> Azimuth, N=0 clockwise",
      "above_horizon":            "<boolean> alt_geometric_deg > 0",
      "dist_au":                  "<number> [planets] Distance from Earth in AU",
      "dist_km":                  "<number> [Moon] Distance from observer in km"
    }
  },

  "luna": {
    "phase_ratio":  "<number> 0=new, 0.5=full, 1=new (elongation/π)",
    "phase_deg":    "<number> Elongation angle [0°,180°]",
    "illumination": "<number> Fraction of disc illuminated [0,1]"
  }
}
```

### 4.3 Body name registry

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
| `NodoNorte` | North Node Ω | Geocentric (Meeus Ch.47) |
| `NodoSur` | South Node | Geocentric (Meeus Ch.47, Ω+180°) |

**Note on Moon:** The Moon is the only body with full topocentric correction
(max ~57′ at horizon). All other bodies use geocentric coordinates.
Planetary parallax is < 9″ (Mars at closest approach) — within VSOP87B
truncation error. The schema makes this asymmetry explicit.

### 4.4 Atacir namespace (when active)

```json
{
  "atacir": {
    "engine":         "Atacir v4.0 · Hermetica Labs",
    "plugins_active": ["houses", "aspects", "..."],
    "errors":         { "pluginKey": "error message" },

    "houses": {
      "system":       "placidus | porfirio | alcabitius | equal | wholesign",
      "asc":          "<number> Ascendant ecliptic longitude (degrees)",
      "mc":           "<number> Midheaven ecliptic longitude (degrees)",
      "cusps":        "<number[12]> Cusp longitudes [I–XII] (degrees)",
      "body_houses":  { "Sol": 4, "Luna": 3, "...": "..." },
      "nodes": {
        "north": { "lon_ecl_deg": "<number>", "ra_deg": "<number>", "dec_deg": "<number>" },
        "south": { "lon_ecl_deg": "<number>", "ra_deg": "<number>", "dec_deg": "<number>" }
      }
    },

    "aspects": {
      "natales": [{
        "nmA":       "<string> Body A",
        "nmB":       "<string> Body B",
        "asp":       "<string> aspect name",
        "orb":       "<number> orb in degrees",
        "exactitud": "<number> precision [0,1]",
        "applying":  "<boolean>"
      }]
    },

    "panchanga": {
      "jde":        "<number>",
      "ayanDeg":    "<number> Lahiri ayanamsa",
      "sunSid":     "<number> Sun sidereal longitude",
      "moonSid":    "<number> Moon sidereal longitude",
      "tithiName":  "<string>",
      "paksha":     "<string>",
      "vara":       { "name": "<string>", "glyph": "<string>", "planet": "<string>" },
      "naks":       { "name": "<string>", "ruler": "<string>" },
      "yogaName":   "<string>",
      "karanaName": "<string>"
    },

    "eclipses": [{
      "jde":       "<number>",
      "tipo":      "Total | Parcial | Anular",
      "subtipo":   "solar | lunar",
      "magnitud":  "<number> [0,1]",
      "dist":      "<number | null> lunar distance at eclipse (solar only)",
      "visible":   "<boolean>"
    }]
  }
}
```

---

## 5. Quality Flags

| Flag | Condition | Impact |
|---|---|---|
| `delta_t_extrapolated: true` | Date outside [500 AD, 2150 AD] | ΔT error up to ±20s |
| `low_altitude_refraction_risk: [...]` | Body alt_geometric < 5° | Bennett error up to ±5′ |

---

## 6. Validation Protocol

### 6.1 Schema completeness

Every snapshot must contain:
- `schema_version === "3.1"`
- `meta.jd_tt`, `meta.jd_utc`, `meta.delta_t_sec`
- `meta.sidereal.gast_deg`, `meta.sidereal.lst_deg`
- `meta.obliquity.mean_deg`, `meta.obliquity.true_deg`
- `meta.nutation.delta_psi_arcsec`, `meta.nutation.delta_eps_arcsec`
- All 11 bodies present (9 planets + 2 nodes)
- Each body: `lon_ecl_geocentric_deg`, `alt_geometric_deg`, `alt_apparent_deg`, `above_horizon`
- Luna additionally: `lon_ecl_topocentric_deg`
- No `house` field on any body
- No `houses` object at root level

### 6.2 Numerical regression — Reference epoch A

**2026-06-01 23:58:00 UTC · Santiago (−33.45°, −70.66°)**

| Field | Expected | Tolerance |
|---|---|---|
| `meta.obliquity.true_deg` | 23.4383 | ± 0.0001° |
| `meta.sidereal.lst_deg` | 179.618 | ± 0.05° |
| `meta.delta_t_sec` | 71.35 | ± 0.5s |
| `Sol.lon_ecl_geocentric_deg` | 71.498 | ± 0.005° |
| `Sol.alt_geometric_deg` | −27.896 | ± 0.1° |
| `Luna.lon_ecl_geocentric_deg` | 269.330 | ± 0.02° |
| `Luna.lon_ecl_topocentric_deg` | 270.082 | ± 0.05° |
| `Jupiter.lon_ecl_geocentric_deg` | 114.254 | ± 0.005° |
| `above_horizon` count | 4 bodies | exact |

### 6.3 Reference epoch B — J2000.0

**2000-01-01 12:00:00 TT · London (51.5°, −0.1°)**

| Field | Expected | Source |
|---|---|---|
| `Sol.lon_ecl_geocentric_deg` | 280.458 | JPL Horizons |
| `Luna.lon_ecl_geocentric_deg` | 218.320 | JPL Horizons |
| `meta.obliquity.true_deg` | 23.4393 | IAU |

### 6.4 Atacir validation

```javascript
const snap   = getSnapshot();
const result = Atacir.compute(snap, {
  plugins: { houses: true, aspects: true, eclipses: true }
});

console.assert(result.atacir.houses.cusps.length === 12,     'houses: 12 cusps');
console.assert(result.atacir.aspects.natales.length > 0,     'aspects: > 0');
console.assert(result.atacir.eclipses.length > 0,            'eclipses: > 0');
console.assert(!result.bodies.Sol.house,                     'no house on bodies');
console.assert(!result.houses,                               'no root houses');
```

---

## 7. Internal fields

Fields starting with `_` are computed internally and filtered from all public output:

| Field | Location | Purpose |
|---|---|---|
| `_houseConfig` | snapshot root | Houses config for Atacir.houses plugin |
| `_nodes` | snapshot root | Node data for Atacir.houses plugin |

These fields are excluded via:
```javascript
JSON.stringify(result, (k, v) => k.startsWith('_') ? undefined : v)
```

Applied in: `renderJSON`, `doExport`, `bodiesExportJSON`, all plugin JSON exports.

---

## 8. Timezone handling

The engine operates in UTC internally. Local time conversion occurs at the UI boundary:

```
_localToUTC(dateStr, timeStr, tzOffsetHours)
  → { date: string, time: string }   // UTC date and time
```

Applied in: `applyTime()`, `atacirGetSnapshotSynastry()`, `atacirGetSnapshotPanchanga()`.

`setNow()` detects browser timezone via `Date.prototype.getTimezoneOffset()` and
pre-selects the corresponding UTC offset in the UI selector.

---

## 9. Limitations

Caelis Engine is designed for portability and auditability, not sub-arcsecond astrometry.

**Accepted limitations in exchange for full JS portability:**
- No ephemeris files
- No server required
- No network access
- Runs in browser, Node.js, edge functions, React Native

For sub-arcsecond precision, use JPL Horizons or Swiss Ephemeris with VSOP87 full series.

---

*Caelis Engine v4.0 · Hermetica Labs · © 2024–2026 Cristian Valeria Bravo*  
*This document defines canonical engine behavior. Any deviation must be documented and validated.*
