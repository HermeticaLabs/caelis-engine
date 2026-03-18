# Caelis Engine

**Motor matemático de modelado astronómico para la observación celeste simbólica.**

Caelis Engine v2.0 calcula posiciones planetarias reales con algoritmos de precisión profesional (VSOP87, ELP/MPP02), las renderiza como un instrumento simbólico vivo, y expone un framework completo de análisis astronómico-astrológico — en un único archivo HTML sin dependencias.

[**→ Live Demo**](https://hermeticalabs.github.io/caelis-engine/) · [**Docs**](#documentation) · [**License**](#license) · [**Ko-fi**](https://ko-fi.com/hermeticalabs)

---

## What it does

```
Symbol → Structure → Simulation
```

- Computes Sun, Moon, and 5 planets using **VSOP87** (planets) and **ELP/MPP02** (Moon, LLR-calibrated 2002), verified against Meeus, JPL Horizons, and Swiss Ephemeris — **56/56 tests PASS**
- Renders a real-time **2D sky map** with horizon, ecliptic, Placidus house cusps, 600 background stars, and equinox/solstice markers
- Switches to **Oculus 3D** — a Three.js orbital sphere where planets move in true celestial coordinates
- Analyzes **planetary cycles, resonances, and periodicity** — conjunction timings, synodic periods, aspect patterns
- **Atacir** analysis panel — natal and transit aspects, primary directions, cycles, resonances, lunar analysis, **Synastry** tab
- **Eclipse calculator** — solar and lunar, georeferenced visibility (Meeus Cap.54, Premium)
- **Vedic Panchanga** — Tithi, Vara, Nakshatra, Yoga, Karana with Lahiri ayanamsa (Premium)
- **Equinox/solstice markers** — VSOP87 bisection, hemisphere-adaptive, visual markers on the ecliptic

---

## Why it's different

| Feature | Caelis Engine | Typical astro library | Typical sky app |
|---|---|---|---|
| VSOP87 + ELP/MPP02 (LLR calibrated) | ✓ | sometimes | rarely |
| 56/56 tests vs JPL Horizons + Swiss Eph. | ✓ | rarely | no |
| Zero dependencies | ✓ | no | no |
| Symbolic + scientific layer | ✓ | no | no |
| Eclipse calculator (georeferenced) | ✓ | rarely | rarely |
| Vedic Panchanga (5 elements) | ✓ | no | rarely |
| Synastry cross-aspects | ✓ | no | no |
| Equinox/solstice markers + modal | ✓ | no | no |
| Single file, runs offline | ✓ | no | no |

---

## Core modules

```
caelis-engine/
├── caelis_engine_2_0.html     ← Full instrument (single file, standalone) — 8,157 lines
├── index.html                 ← GitHub Pages entry point (identical)
├── validation.html            ← Precision test suite — 56/56 PASS
└── src/
    ├── astro/AstroCore.js     ← VSOP87, ELP/MPP02, coordinate transforms, eclipse detection
    ├── TimeEngine.js          ← Julian dates, sidereal time, time control
    └── Atacir.js              ← Cycle analysis, aspects, resonances, synastry, Panchanga
```

---

## Mathematical foundations

### Algorithms

| Algorithm | Source | Terms | Applies to |
|---|---|---|---|
| **VSOP87** | Bretagnon & Francou 1987, Meeus App.II | Earth: 185 · Venus: 79 · Mars: 152 · Jupiter: 141 · Saturn: 167 | Venus, Mars, Jupiter, Saturn, Sun |
| **Mercury** | Meeus Cap.31 | 5 terms, e=0.206 | Mercury |
| **ELP/MPP02** | Chapront & Francou 2002, A&A 412 (LLR) | 164L + 105B + 29R | Moon |
| **IAU 1980 Nutation** | Meeus Cap.22 | 63 series | ΔΨ, Δε |
| **Placidus houses** | Meeus Cap.38 | Newton-Raphson < 1×10⁻⁹ rad | Cusps I–XII |
| **Eclipse detection** | Meeus Cap.54 | F-argument criterion | Solar · Lunar |
| **Equinoxes/Solstices** | VSOP87 bisection | < 1 min precision | 0°, 90°, 180°, 270° |
| **Lahiri ayanamsa** | IAU 1955 | 23.85282° + 0.013972°/yr | Vedic sidereal |
| **ΔT** | IERS table 1620–2100 | Linear interpolation | All JDE |
| **Primary directions** | Ptolemy / Al-Biruni | Oblique ascension | Natal chart |

### Precision — 56/56 tests PASS

| Component | Max error | Source |
|---|---|---|
| **Moon λ (ELP/MPP02)** | **0.0001° (0.45") — 63× vs ELP2000** | JPL Horizons DE441 |
| Sun VSOP87 | 0.001° | Meeus Cap.25 |
| Mercury | < 0.116° | JPL Horizons DE441 |
| Venus / Mars / Jupiter / Saturn | < 0.131° | JPL Horizons DE441 |
| IAU 1980 Nutation ΔΨ | < 0.004 arcsec | Meeus Cap.22 |
| Placidus ASC | < 0.009° | Reference chart |
| ΔT at J2000 | < 0.1 s | IERS |

**Valid range:** 1800–2100 CE

---

## Quickstart

```bash
git clone https://github.com/HermeticaLabs/caelis-engine
# Open index.html in any modern browser — no install, no build, no server.
```

Node.js:

```javascript
const AstroCore = require('./src/astro/AstroCore.js');
Object.assign(global, AstroCore);
global.lat = -33.45 * Math.PI/180;
global.lon = -70.66 * Math.PI/180;
global.R_TIERRA = 6371.0;
const nowJD = Date.now()/86400000 + 2440587.5;
global.timeOffset = (2451545.0 - nowJD) * 86400;
console.log(AstroCore.sunLonEcl(), AstroCore.moonLonEcl());
```

---

## Freemium model

Premium is a **one-time payment of $12 USD** — no subscription, no renewal.

| Feature | Free | Premium |
|---|---|---|
| Caelis 2D, Astrolabio, Oculus 3D | ✓ | ✓ |
| 7 planets + lunar nodes (Oculus) | Sol, Luna, Saturno | ✓ all |
| Color palettes | 2 | 6 |
| Full Atacir (transits, cycles, resonances) | 1 aspect (Naibod fixed) | ✓ complete |
| Eclipse calculator | Next eclipse only | ✓ full range |
| Equinox/solstice markers | ✓ | ✓ |
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
- [x] Extended validation — 56/56 tests vs JPL Horizons DE441 + Swiss Ephemeris
- [ ] AI hermetic interpretation — coming soon (experimental)
- [ ] Google Play Store
- [ ] ELP/MPP02 extended R-series → dist < 10 km
- [ ] IAU 2000A nutation (1365 terms → ~0.1 mas)
- [ ] REST API layer

---

## Documentation

- [AstroCore API](docs/astrocore.md) — VSOP87, ELP/MPP02, coordinate transforms, eclipse detection, ayanamsa
- [TimeEngine API](docs/timeengine.md) — Time control, Julian dates, sidereal time, snapshots
- [Atacir — Cycle Analysis](docs/atacir.md) — Primary directions, aspects, cycles, resonances, synastry, Panchanga
- [Mathematical references](docs/references.md) — Source algorithms and 56-test precision table

---

## References

- Jean Meeus — *Astronomical Algorithms*, 2nd ed. (Willmann-Bell, 1998)
- VSOP87 — Bretagnon & Francou, A&A 202, 309 (1988)
- ELP/MPP02 — Chapront & Francou, A&A 412, 567 (2002)
- IAU 1980 nutation — Seidelmann (ed.), *Explanatory Supplement*, 1992
- JPL Horizons — https://ssd.jpl.nasa.gov/horizons/ (DE441)
- Swiss Ephemeris — Astrodienst AG, DE441

---

## License

**Open Source — AGPL-3.0** · Free to use, study, modify and share. Source disclosure required for products/services. Full text: [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html)

**Commercial License — Hermetica Labs** · For proprietary use. Contact: [hermeticalabs.dev@proton.me](mailto:hermeticalabs.dev@proton.me)

---

## Author

**Cristian Valeria Bravo** · [Hermetica Labs](https://github.com/HermeticaLabs)

*Caelis Engine exists at the boundary between mathematical precision and symbolic observation — where the structure of time becomes navigable.*

Support: [ko-fi.com/hermeticalabs](https://ko-fi.com/hermeticalabs) · © 2024–2026 Cristian Valeria Bravo / Hermetica Labs
