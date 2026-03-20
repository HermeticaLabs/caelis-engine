# Caelis Engine

**Motor matemÃ¡tico de modelado astronÃ³mico para la observaciÃ³n celeste simbÃ³lica.**

Caelis Engine v2.1 computa posiciones planetarias reales con algoritmos de precisiÃ³n profesional (VSOP87, ELP/MPP02), las renderiza como un instrumento simbÃ³lico vivo, y expone un framework completo de anÃ¡lisis astronÃ³mico-astrolÃ³gico â€” en un Ãºnico archivo HTML sin dependencias.

[**â†’ Live Demo**](https://hermeticalabs.github.io/caelis-engine/) Â· [**Docs**](#documentation) Â· [**License**](#license) Â· [**Ko-fi**](https://ko-fi.com/hermeticalabs)

---

## What it does

```
Symbol â†’ Structure â†’ Simulation
```

- Computes Sun, Moon, and 5 planets using **VSOP87** (planets) and **ELP/MPP02** (Moon, LLR-calibrated 2002), verified against Meeus, JPL Horizons, and Swiss Ephemeris â€” **107/107 tests PASS**
- Renders a real-time **2D sky map** with horizon, ecliptic, Placidus house cusps, 600 background stars, and equinox/solstice markers
- Switches to **Oculus 3D** â€” a Three.js orbital sphere where planets move in true celestial coordinates
- Analyzes **planetary cycles, resonances, and periodicity** via the **Atacir** panel (with Synastry tab)
- **Eclipse calculator** â€” solar and lunar, georeferenced visibility (Meeus Cap.54, Premium)
- **Vedic Panchanga** â€” Tithi, Vara, Nakshatra, Yoga, Karana with Lahiri ayanamsa (Premium)
- **Equinox/solstice markers** â€” VSOP87 bisection, hemisphere-adaptive, < 1 min precision

---

## Why it's different

| Feature | Caelis Engine | Typical astro library | Typical sky app |
|---|---|---|---|
| VSOP87 + ELP/MPP02 (LLR calibrated) | âœ“ | sometimes | rarely |
| 107/107 tests vs JPL + Swiss Eph. | âœ“ | rarely | no |
| Zero dependencies | âœ“ | no | no |
| Symbolic + scientific layer | âœ“ | no | no |
| Clean pure-function API (no DOM) | âœ“ | varies | no |
| Eclipse calculator (georeferenced) | âœ“ | rarely | rarely |
| Vedic Panchanga (5 elements) | âœ“ | no | rarely |
| Synastry cross-aspects | âœ“ | no | no |
| Single file, runs offline | âœ“ | no | no |

---

## Architecture â€” v2.1 improvements

Caelis Engine v2.1 introduces clean separation between the mathematical core and the UI layer:

| Function | Status | Notes |
|---|---|---|
| `calcAtacirCore()` | âœ… Pure â€” no DOM | Direcciones primarias + aspectos + ciclos |
| `calcPanchangaCore()` | âœ… Pure â€” no DOM | 5 Panchanga elements + Lahiri ayanamsa |
| `calcEclipsesCore()` | âœ… Pure â€” no DOM | Eclipse detection + georef visibility |
| `calcSinastriaCore()` | âœ… Pure â€” no DOM | Cross-chart aspects + antiscias |
| `getSnapshotAt()` | âœ… try/finally | State always restored on exception |
| `_eclVisibleAt()` | âœ… try/finally | State always restored on exception |
| `nutation(T)` | âœ… Memoized | Cache key = T, invalidated on time change |
| `lunarNodes()` | âœ… Memoized | Cache key = T, invalidated on time change |

The `*Core()` functions take plain parameters (dates, coords) and return data objects â€” usable in Node.js, REST APIs, or npm packages without any DOM mocks.

---

## Core modules

```
caelis-engine/
â”œâ”€â”€ caelis_engine_2_1.html     â† Full instrument (single file) â€” 8,200 lines
â”œâ”€â”€ index.html                 â† GitHub Pages entry point (identical)
â”œâ”€â”€ validation.html            â† Precision test suite â€” 107/107 PASS
â””â”€â”€ src/
    â”œâ”€â”€ astro/AstroCore.js     â† VSOP87, ELP/MPP02, coordinate transforms
    â”œâ”€â”€ TimeEngine.js          â† Julian dates, sidereal time, time control
    â””â”€â”€ Atacir.js              â† Cycle analysis, aspects, resonances, synastry
```

---

## Mathematical foundations

### Algorithms

| Algorithm | Source | Terms | Applies to |
|---|---|---|---|
| **VSOP87** | Bretagnon & Francou 1987, Meeus App.II | Earth: 185 Â· Venus: 79 Â· Mars: 152 Â· Jupiter: 141 Â· Saturn: 167 | Venus, Mars, Jupiter, Saturn, Sun |
| **Mercury** | Meeus Cap.31 (equation of center) | 5 terms, e=0.206 | Mercury |
| **ELP/MPP02** | Chapront & Francou 2002, A&A 412 (LLR) | 164L + 105B + 29R | Moon |
| **IAU 1980 Nutation** | Meeus Cap.22 | 63 series (memoized) | Î”Î¨, Î”Îµ |
| **Placidus houses** | Meeus Cap.38 | Newton-Raphson < 1Ã—10â»â¹ rad | Cusps Iâ€“XII |
| **Eclipse detection** | Meeus Cap.54 | F-argument criterion | Solar Â· Lunar |
| **Equinoxes/Solstices** | VSOP87 bisection | < 1 min precision | 0Â°, 90Â°, 180Â°, 270Â° |
| **Lahiri ayanamsa** | IAU 1955 | 23.85282Â° + 0.013972Â°/yr | Vedic sidereal |

> **Note on Mercury:** `vsop87Mercurio()` uses Meeus Cap.31 equation of center (not VSOP87 series) due to Mercury's high eccentricity (e=0.206). The truncated VSOP87 series gives ~21Â° error for Mercury. The function name is preserved for interface compatibility. Verified error: < 0.116Â° vs JPL Horizons DE441.

### Precision â€” 107/107 tests PASS

| Component | Max error | Reference |
|---|---|---|
| **Moon Î» (ELP/MPP02)** | **0.0001Â° (0.45") â€” 63Ã— vs ELP2000** | JPL Horizons DE441 |
| Sun VSOP87 | 0.0003Â° | Meeus Cap.25 |
| Mercury (eq. of center) | < 0.116Â° | JPL Horizons DE441 |
| Venus / Mars / Jupiter / Saturn | < 0.131Â° | JPL Horizons DE441 |
| Mercury Î² orbital range | [-7Â°, +7Â°] âœ“ | Orbital theory |
| IAU 1980 Nutation Î”Î¨ | < 0.004 arcsec | Meeus Cap.22 |
| Placidus ASC | < 0.019Â° | Reference chart |
| Î”T at J2000 | < 0.1 s | IERS |
| Equinoxes/Solstices | < 1 min | JPL Horizons 2025 |

**Valid range:** 1800â€“2100 CE

---

## Public API

```javascript
// Astronomical snapshot for any date/location
const snap = getSnapshot();
const snap = getSnapshotAt(jde, latDeg, lonDeg);

// Pure calculation cores (no DOM â€” usable in Node.js)
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
# Open index.html in any modern browser â€” no install, no build, no server.
```

---

## Freemium model

Premium is a **one-time payment of $12 USD** â€” no subscription, no renewal.

| Feature | Free | Premium |
|---|---|---|
| Caelis 2D, Astrolabio, Oculus 3D | âœ“ | âœ“ |
| Full Atacir (transits, cycles, resonances) | 1 aspect (Naibod fixed) | âœ“ complete |
| Eclipse calculator | Next eclipse only | âœ“ full range |
| Panchanga â€” Tithi + Vara | âœ“ | âœ“ |
| Panchanga â€” Nakshatra + Yoga + Karana | â€” | âœ“ |
| Synastry â€” 3 most exact aspects | âœ“ | âœ“ |
| Synastry â€” full table + antiscia | â€” | âœ“ |
| JSON export | Natal only | âœ“ complete |

[**â†’ Get Premium â€” $12 USD one-time**](https://ko-fi.com/hermeticalabs)

---

## Roadmap

- [x] VSOP87 + ELP/MPP02 â€” 164L + 105B + 29R, LLR calibrated (63Ã— lunar precision)
- [x] Eclipse calculator â€” georeferenced, solar and lunar (Premium)
- [x] Equinox/solstice markers â€” VSOP87 bisection, hemisphere-adaptive
- [x] Vedic Panchanga â€” 5 elements + Lahiri ayanamsa (Premium)
- [x] Synastry â€” cross-chart aspects + antiscia
- [x] 107/107 tests vs JPL Horizons DE441 + Swiss Ephemeris
- [x] **v2.1 â€” Pure core functions (no DOM), try/finally state safety, nutation/nodes cache, Mercury Î² tests**
- [ ] AI hermetic interpretation â€” coming soon (experimental)
- [ ] Google Play Store
- [ ] ELP/MPP02 extended R-series â†’ dist < 10 km
- [ ] IAU 2000A nutation (1365 terms â†’ ~0.1 mas)
- [ ] npm package (caelis-js)

---


## Commercial License

Caelis Engine is dual-licensed:

- **AGPL-3.0** — free for open-source use
- **Commercial License** — required for closed-source or proprietary products

| Level | Price | Use |
|---|---|---|
| Premium Personal | $12 USD | End user, in-app features only |
| Indie License | $59 USD | 1 commercial product |
| Studio License | $199 USD | Unlimited products |

[Download License EN](legal/COMMERCIAL_LICENSE_EN.pdf) · [Licencia ES](legal/COMMERCIAL_LICENSE_ES.pdf)

Purchase: [ko-fi.com/hermeticalabs](https://ko-fi.com/hermeticalabs) · Contact: hermeticalabs.dev@proton.me

## License

**Open Source â€” AGPL-3.0** Â· Free to use, study, modify and share. Source disclosure required for products/services. Full text: [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html)

**Commercial License** Â· For proprietary use. Contact: [hermeticalabs.dev@proton.me](mailto:hermeticalabs.dev@proton.me)

---

## Author

**Cristian Valeria Bravo** Â· [Hermetica Labs](https://github.com/HermeticaLabs)

*Caelis Engine exists at the boundary between mathematical precision and symbolic observation â€” where the structure of time becomes navigable.*

Support: [ko-fi.com/hermeticalabs](https://ko-fi.com/hermeticalabs) Â· Â© 2024â€“2026 Cristian Valeria Bravo / Hermetica Labs


