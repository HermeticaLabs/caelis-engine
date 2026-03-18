# Caelis Engine

**Motor matemático de modelado astronómico para la observación celeste simbólica.**

Caelis Engine v2.1 computa posiciones planetarias reales con algoritmos de precisión profesional (VSOP87, ELP/MPP02), las renderiza como un instrumento simbólico vivo, y expone un framework completo de análisis astronómico-astrológico — en un único archivo HTML sin dependencias.

[**→ Live Demo**](https://hermeticalabs.github.io/caelis-engine/) · [**Docs**](#documentation) · [**License**](#license) · [**Ko-fi**](https://ko-fi.com/hermeticalabs)

---

## What it does

```
Symbol → Structure → Simulation
```

- Computes Sun, Moon, and 5 planets using **VSOP87** (planets) and **ELP/MPP02** (Moon, LLR-calibrated 2002), verified against Meeus, JPL Horizons, and Swiss Ephemeris — **107/107 tests PASS**
- Renders a real-time **2D sky map** with horizon, ecliptic, Placidus house cusps, 600 background stars, and equinox/solstice markers
- Switches to **Oculus 3D** — a Three.js orbital sphere where planets move in true celestial coordinates
- Analyzes **planetary cycles, resonances, and periodicity** via the **Atacir** panel (with Synastry tab)
- **Eclipse calculator** — solar and lunar, georeferenced visibility (Meeus Cap.54, Premium)
- **Vedic Panchanga** — Tithi, Vara, Nakshatra, Yoga, Karana with Lahiri ayanamsa (Premium)
- **Equinox/solstice markers** — VSOP87 bisection, hemisphere-adaptive, < 1 min precision

---

## Why it's different

| Feature | Caelis Engine | Typical astro library | Typical sky app |
|---|---|---|---|
| VSOP87 + ELP/MPP02 (LLR calibrated) | ✓ | sometimes | rarely |
| 107/107 tests vs JPL + Swiss Eph. | ✓ | rarely | no |
| Zero dependencies | ✓ | no | no |
| Symbolic + scientific layer | ✓ | no | no |
| Clean pure-function API (no DOM) | ✓ | varies | no |
| Eclipse calculator (georeferenced) | ✓ | rarely | rarely |
| Vedic Panchanga (5 elements) | ✓ | no | rarely |
| Synastry cross-aspects | ✓ | no | no |
| Single file, runs offline | ✓ | no | no |

---

## Architecture — v2.1 improvements

Caelis Engine v2.1 introduces clean separation between the mathematical core and the UI layer:

| Function | Status | Notes |
|---|---|---|
| `calcAtacirCore()` | ✅ Pure — no DOM | Direcciones primarias + aspectos + ciclos |
| `calcPanchangaCore()` | ✅ Pure — no DOM | 5 Panchanga elements + Lahiri ayanamsa |
| `calcEclipsesCore()` | ✅ Pure — no DOM | Eclipse detection + georef visibility |
| `calcSinastriaCore()` | ✅ Pure — no DOM | Cross-chart aspects + antiscias |
| `getSnapshotAt()` | ✅ try/finally | State always restored on exception |
| `_eclVisibleAt()` | ✅ try/finally | State always restored on exception |
| `nutation(T)` | ✅ Memoized | Cache key = T, invalidated on time change |
| `lunarNodes()` | ✅ Memoized | Cache key = T, invalidated on time change |

The `*Core()` functions take plain parameters (dates, coords) and return data objects — usable in Node.js, REST APIs, or npm packages without any DOM mocks.

---

## Core modules

```
caelis-engine/
├── caelis_engine_2_1.html     ← Full instrument (single file) — 8,200 lines
├── index.html                 ← GitHub Pages entry point (identical)
├── validation.html            ← Precision test suite — 107/107 PASS
└── src/
    ├── astro/AstroCore.js     ← VSOP87, ELP/MPP02, coordinate transforms
    ├── TimeEngine.js          ← Julian dates, sidereal time, time control
    └── Atacir.js              ← Cycle analysis, aspects, resonances, synastry
```

---

## Mathematical foundations

### Algorithms

| Algorithm | Source | Terms | Applies to |
|---|---|---|---|
| **VSOP87** | Bretagnon & Francou 1987, Meeus App.II | Earth: 185 · Venus: 79 · Mars: 152 · Jupiter: 141 · Saturn: 167 | Venus, Mars, Jupiter, Saturn, Sun |
| **Mercury** | Meeus Cap.31 (equation of center) | 5 terms, e=0.206 | Mercury |
| **ELP/MPP02** | Chapront & Francou 2002, A&A 412 (LLR) | 164L + 105B + 29R | Moon |
| **IAU 1980 Nutation** | Meeus Cap.22 | 63 series (memoized) | ΔΨ, Δε |
| **Placidus houses** | Meeus Cap.38 | Newton-Raphson < 1×10⁻⁹ rad | Cusps I–XII |
| **Eclipse detection** | Meeus Cap.54 | F-argument criterion | Solar · Lunar |
| **Equinoxes/Solstices** | VSOP87 bisection | < 1 min precision | 0°, 90°, 180°, 270° |
| **Lahiri ayanamsa** | IAU 1955 | 23.85282° + 0.013972°/yr | Vedic sidereal |

> **Note on Mercury:** `vsop87Mercurio()` uses Meeus Cap.31 equation of center (not VSOP87 series) due to Mercury's high eccentricity (e=0.206). The truncated VSOP87 series gives ~21° error for Mercury. The function name is preserved for interface compatibility. Verified error: < 0.116° vs JPL Horizons DE441.

### Precision — 107/107 tests PASS

| Component | Max error | Reference |
|---|---|---|
| **Moon λ (ELP/MPP02)** | **0.0001° (0.45") — 63× vs ELP2000** | JPL Horizons DE441 |
| Sun VSOP87 | 0.0003° | Meeus Cap.25 |
| Mercury (eq. of center) | < 0.116° | JPL Horizons DE441 |
| Venus / Mars / Jupiter / Saturn | < 0.131° | JPL Horizons DE441 |
| Mercury β orbital range | [-7°, +7°] ✓ | Orbital theory |
| IAU 1980 Nutation ΔΨ | < 0.004 arcsec | Meeus Cap.22 |
| Placidus ASC | < 0.019° | Reference chart |
| ΔT at J2000 | < 0.1 s | IERS |
| Equinoxes/Solstices | < 1 min | JPL Horizons 2025 |

**Valid range:** 1800–2100 CE

---

## Public API

```javascript
// Astronomical snapshot for any date/location
const snap = getSnapshot();
const snap = getSnapshotAt(jde, latDeg, lonDeg);

// Pure calculation cores (no DOM — usable in Node.js)
const result  = calcAtacirCore(rxDate, rxTime, rxLat, rxLon, trDate, trTime, trLat, trLon, key);
const panch   = calcPanchangaCore(dateStr, timeStr);
const ecl     = calcEclipsesCore(latDeg, lonDeg, rangeYears, doSolar, doLunar, jdCenter);
const sin     = calcSinastriaCore(dateA, timeA, latA, lonA, dateB, timeB, latB, lonB);

// Aspects
const aspects = calcAspectosTransito(snapNatal, snapTransit);

// Individual positions
const lonSol  = sunLonEcl();          // degrees
const lonLuna = moonLonEcl();         // degrees
const lonPl   = planetLonEcl(name);   // degrees
const dist    = lunarDistELP(jde);    // km

// Time utilities
const dT      = deltaT(jde);          // seconds
const jdeEq   = nextSolEquinox(0, jdStart);  // vernal equinox JDE
```

---

## Quickstart

```bash
git clone https://github.com/HermeticaLabs/caelis-engine
# Open index.html in any modern browser — no install, no build, no server.
```

---

## Freemium model

Premium is a **one-time payment of $12 USD** — no subscription, no renewal.

| Feature | Free | Premium |
|---|---|---|
| Caelis 2D, Astrolabio, Oculus 3D | ✓ | ✓ |
| Full Atacir (transits, cycles, resonances) | 1 aspect (Naibod fixed) | ✓ complete |
| Eclipse calculator | Next eclipse only | ✓ full range |
| Panchanga — Tithi + Vara | ✓ | ✓ |
| Panchanga — Nakshatra + Yoga + Karana | — | ✓ |
| Synastry — 3 most exact aspects | ✓ | ✓ |
| Synastry — full table + antiscia | — | ✓ |
| JSON export | Natal only | ✓ complete |

[**→ Get Premium — $12 USD one-time**](https://ko-fi.com/hermeticalabs)

---

## Roadmap

- [x] VSOP87 + ELP/MPP02 — 164L + 105B + 29R, LLR calibrated (63× lunar precision)
- [x] Eclipse calculator — georeferenced, solar and lunar (Premium)
- [x] Equinox/solstice markers — VSOP87 bisection, hemisphere-adaptive
- [x] Vedic Panchanga — 5 elements + Lahiri ayanamsa (Premium)
- [x] Synastry — cross-chart aspects + antiscia
- [x] 107/107 tests vs JPL Horizons DE441 + Swiss Ephemeris
- [x] **v2.1 — Pure core functions (no DOM), try/finally state safety, nutation/nodes cache, Mercury β tests**
- [ ] AI hermetic interpretation — coming soon (experimental)
- [ ] Google Play Store
- [ ] ELP/MPP02 extended R-series → dist < 10 km
- [ ] IAU 2000A nutation (1365 terms → ~0.1 mas)
- [ ] npm package (caelis-js)

---

## License

**Open Source — AGPL-3.0** · Free to use, study, modify and share. Source disclosure required for products/services. Full text: [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html)

**Commercial License** · For proprietary use. Contact: [hermeticalabs.dev@proton.me](mailto:hermeticalabs.dev@proton.me)

---

## Author

**Cristian Valeria Bravo** · [Hermetica Labs](https://github.com/HermeticaLabs)

*Caelis Engine exists at the boundary between mathematical precision and symbolic observation — where the structure of time becomes navigable.*

Support: [ko-fi.com/hermeticalabs](https://ko-fi.com/hermeticalabs) · © 2024–2026 Cristian Valeria Bravo / Hermetica Labs
