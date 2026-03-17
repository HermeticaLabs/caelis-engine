# Caelis Engine

**A mathematical astronomical modeling engine for symbolic celestial observation.**

Caelis Engine computes real planetary positions using professional-grade algorithms (VSOP87, ELP/MPP02), renders them as a living symbolic instrument, and exposes a cycle, resonance, eclipse, and Vedic calendar analysis framework — all in a single HTML file with zero dependencies.

[**→ Live Demo**](https://hermeticalabs.github.io/caelis-engine/caelis_engine_1_5.html) · [**Docs**](#documentation) · [**License**](#license) · [**Ko-fi**](https://ko-fi.com/hermeticalabs)

---

## What problem does it solve?

Most astronomical software is either:
- **Too scientific** — raw data with no symbolic or contemplative layer
- **Too decorative** — beautiful visuals with imprecise or opaque math
- **Too heavy** — frameworks, build steps, backends, APIs

Caelis Engine sits at the intersection: **mathematically rigorous, symbolically expressive, and radically simple to run.**

No npm install. No build step. No server. Open the file. It works.

---

## What it does

```
Symbol → Structure → Simulation
```

- Computes Sun, Moon, and 5 planets using **VSOP87** (planets) and **ELP/MPP02** (Moon, LLR-calibrated 2002), verified against Meeus, JPL Horizons, and Swiss Ephemeris
- Renders a real-time **2D sky map** with horizon, ecliptic, house cusps (Placidus), 600 background stars, and equinox/solstice markers
- Switches to **Oculus 3D** — a Three.js orbital sphere where planets move in true celestial coordinates
- Analyzes **planetary cycles, resonances, and periodicity** — conjunction timings, synodic periods, aspect patterns
- Houses, aspects, transits and progressions via the **Atacir** analysis panel (with **Synastry** tab)
- Calculates **solar and lunar eclipses** with georeferenced visibility (Meeus Cap.54, Premium)
- Displays **Vedic Panchanga** — Tithi, Vara, Nakshatra, Yoga, Karana with Lahiri ayanamsa

---

## Why it's different

| Feature | Caelis Engine | Typical astro library | Typical sky app |
|---|---|---|---|
| VSOP87 + ELP/MPP02 | ✓ | sometimes | rarely |
| Verified against Meeus | ✓ | rarely | no |
| Verified against JPL Horizons | ✓ | rarely | no |
| Verified against Swiss Ephemeris | ✓ | rarely | no |
| Zero dependencies | ✓ | no | no |
| Symbolic + scientific layer | ✓ | no | no |
| Cycle & resonance analysis | ✓ | no | no |
| Eclipse calculator (georeferenced) | ✓ | rarely | rarely |
| Vedic Panchanga (5 elements) | ✓ | no | rarely |
| Synastry cross-aspects | ✓ | no | no |
| Equinox/solstice markers + modal | ✓ | no | no |
| Single file, runs in browser | ✓ | no | no |
| Modular architecture | ✓ | varies | no |

---

## Core modules

```
caelis-engine/
├── caelis_engine_1_5.html     ← Full instrument (single file, runs standalone) — 7,875 lines
├── validation.html            ← Precision test suite — 56/56 PASS
└── src/
    ├── astro/
    │   └── AstroCore.js       ← VSOP87, ELP/MPP02, coordinate transforms, eclipse detection
    ├── TimeEngine.js          ← Julian dates, sidereal time, time control
    └── Atacir.js              ← Cycle analysis, aspects, resonances, progressions, synastry
```

**AstroCore** — the mathematical kernel. Planetary position algorithms (VSOP87, ELP/MPP02), coordinate transforms (ecliptic → equatorial → horizontal), lunar phase computation, eclipse detection (Meeus Cap.54), equinox/solstice bisection, Lahiri ayanamsa, fixed star data.

**TimeEngine** — time as a first-class variable. Julian date conversion, sidereal time, time offset control, speed multiplier (from 1 second/frame to 1 year/frame).

**Atacir** — the analytical layer. Natal and transit aspects, planetary cycles, synodic periods, resonance detection, Placidus house progression, primary directions (Al-Biruni / Ptolemy), synastry, Vedic Panchanga.

---

## Mathematical foundations

### Algorithms implemented

| Algorithm | Source | Terms / Method | Applies to |
|---|---|---|---|
| **VSOP87** | Bretagnon & Francou 1987, Meeus App.II | Venus: 79 · Earth: 185 · Mars: 152 · Jupiter: 141 · Saturn: 167 | Venus, Mars, Jupiter, Saturn, Sun (geocentric) |
| **Mercury** | Meeus Cap.31 | Equation of center, 5 terms, e=0.206 | Mercury |
| **ELP/MPP02** | Chapront & Francou 2002, A&A 412 (LLR calibrated) | 164L + 105B + 29R terms | Moon longitude, latitude, distance |
| **IAU 1980 Nutation** | Seidelmann 1992, Meeus Cap.22 | 63 periodic series | ΔΨ and Δε |
| **Obliquity** | IAU 1980, Meeus Cap.22 | Cubic polynomial | ε₀ and ε (true) |
| **Placidus houses** | Meeus Cap.38 | Newton-Raphson < 1×10⁻⁹ rad | House cusps I–XII |
| **Lunar phases** | Meeus Cap.49 | Full series + W correction | New, quarter, full, last quarter JDE |
| **Lunar apsis** | Meeus Cap.50 | Periodic series | Perigee and apogee JDE |
| **Eclipse detection** | Meeus Cap.54 | F-argument criterion | Solar (total/annular/partial) · Lunar (total/partial) |
| **Equinoxes/Solstices** | VSOP87 bisection over sunLonEcl() | < 1 min precision | Solar longitude crossings at 0°, 90°, 180°, 270° |
| **Lahiri ayanamsa** | IAU 1955, Lahiri | 23.85282° + 0.013972°/yr from J2000 | Vedic sidereal base |
| **Annual aberration** | Numerical differential | Δτ = 0.001 centuries | All bodies |
| **Light-time correction** | Iterative | c = 173.1446326 AU/day | All planets |
| **Topocentric parallax** | Meeus Cap.40 | WGS84 geocentric radius | Moon RA/Dec |
| **Atmospheric refraction** | Bennett 1982 | Alt > −1° | All bodies |
| **GAST / Sidereal time** | IAU 2000A, Meeus Cap.12 | Equation of equinoxes | LST |
| **ΔT** | IERS table 1620–2100 | Linear interpolation + polynomial | All JDE |
| **Primary directions (Atacir)** | Ptolemy / Al-Biruni | Oblique ascension method | Natal chart |

### Why Mercury uses a different algorithm

Mercury's orbital eccentricity is e = 0.206 — the highest of the classical planets. The VSOP87 truncated series from Meeus Appendix II accumulates significant errors for Mercury because truncation removes terms that are non-negligible at high eccentricity. The equation of center (Meeus Cap.31, 5 terms) is more stable and produces lower errors. Measured error: Δ < 0.12° vs JPL Horizons DE441.

### Note on VSOP87 error pattern

The ~0.11° systematic offset observed in Venus, Mars, Jupiter, and Saturn reflects the genuine precision floor of the **truncated VSOP87 series from Meeus Appendix II** — not a defect of the engine. The full VSOP87 achieves < 1 arcsecond; the Meeus truncated series achieves < 8 arcminutes (0.13°). All measurements are within stated tolerances. Valid range: 1800–2100 CE.

---

## Precision

All results verified — **56/56 tests PASS** — against JPL Horizons (DE441), Swiss Ephemeris (DE441), and Meeus Astronomical Algorithms 2nd ed.

### Sun · VSOP87 (Meeus Cap.25)

| Date | Computed | Reference | Δ | Source |
|---|---|---|---|---|
| 1992-10-13 00:00 TT | 199.9066° | 199.906° | **0.0006°** | Meeus Cap.25 Ex.25.a |
| 1992-04-12 00:00 TT | 22.3399° | 22.340° | **0.0001°** | Meeus Cap.25 |

### Moon · ELP/MPP02 (Chapront & Francou 2002, A&A 412)

*Upgraded March 2026: 63× improvement in longitude vs previous ELP2000/Meeus Cap.47 implementation.*

| Quantity | Computed | Reference | Δ | Source |
|---|---|---|---|---|
| λ Ecliptic longitude | 133.1671° | 133.167° | **0.0001° (0.45")** | JPL Horizons DE441 |
| β Ecliptic latitude | −3.2292° | −3.2291° | **0.0001°** | Meeus Ex.47.a |
| Δ Geocentric distance | 368,437 km | 368,409.7 km | **27 km (0.007%)** | Meeus Ex.47.a |

### Planets · JPL Horizons (DE441) — extended validation, 4 dates per planet (2025–2026)

| Planet | Algorithm | Max Δ vs JPL | Max Δ vs Swiss Eph. |
|---|---|---|---|
| Mercury | Meeus Cap.31 (eq. of center) | < 0.116° | < 0.116° |
| Venus | VSOP87, 79 terms | < 0.107° | < 0.107° |
| Mars | VSOP87, 152 terms | < 0.113° | < 0.113° |
| Jupiter | VSOP87, 141 terms | < 0.131° | < 0.131° |
| Saturn | VSOP87, 167 terms | < 0.126° | < 0.126° |

### Other components

| Component | Result | Source |
|---|---|---|
| IAU 1980 Nutation ΔΨ | error < 0.004 arcsec | Meeus Cap.22 |
| IAU 1980 Nutation Δε | error < 0.002 arcsec | Meeus Cap.22 |
| Obliquity ε₀ at J2000 | error < 0.002° | Meeus Cap.22 |
| Lunar phases (JDE) | error < 0.17 days | Meeus Cap.49 |
| Placidus house cusps | 12/12, error < 0.009° | Reference chart |
| Lunar nodes | South = North + 180° exact | Theory |
| ΔT at J2000.0 | error < 0.1 s | IERS |

**Valid range:** 1800–2100 CE (VSOP87 truncated series, Meeus App.II).

---

## Quickstart

```bash
git clone https://github.com/HermeticaLabs/caelis-engine
# Open caelis_engine_1_5.html in any modern browser
# No install. No build. No server required.
```

Or use the modules in Node.js:

```javascript
const AstroCore = require('./src/astro/AstroCore.js');
Object.assign(global, AstroCore);

// Set observer globals
global.lat = -33.45 * Math.PI/180;
global.lon = -70.66 * Math.PI/180;
global.R_TIERRA = 6371.0;

// Inject a Julian Date for computation
const jde = 2451545.0; // J2000.0
const nowJD = Date.now()/86400000 + 2440587.5;
global.timeOffset = (jde - nowJD) * 86400;

const sunLon  = AstroCore.sunLonEcl();       // ecliptic longitude in degrees
const moonLon = AstroCore.moonLonEcl();
const marsLon = AstroCore.planetLonEcl('Marte');

console.log(sunLon, moonLon, marsLon);
```

Run the precision test suite:

```bash
# Open in browser via local server
node -e "const h=require('http'),f=require('fs'),p=require('path');h.createServer((req,res)=>{let fp='.'+req.url;if(fp==='./') fp='./index.html';f.readFile(fp,(e,d)=>{if(e){res.writeHead(404);res.end()}else{const ext=p.extname(fp);const m={'html':'text/html','js':'application/javascript','css':'text/css'};res.writeHead(200,{'Content-Type':m[ext.slice(1)]||'text/plain'});res.end(d)}})}).listen(8080,()=>console.log('http://localhost:8080'))"
# Then open http://localhost:8080/validation.html
```

---

## Freemium model

Caelis Engine uses a freemium model. Premium is a **one-time payment of $12 USD** via Ko-fi — no subscription, no annual renewal. The license key activates in-browser and works offline indefinitely.

| Feature | Free | Premium |
|---|---|---|
| Caelis 2D, Astrolabio, Oculus 3D | ✓ | ✓ |
| 7 planets + lunar nodes (Oculus) | Sol, Luna, Saturno | ✓ all |
| Color palettes | 2 | 6 |
| Full Atacir (transits, cycles, resonances, lunar) | 1 aspect (Naibod fixed) | ✓ complete |
| Eclipse calculator | Next eclipse only | ✓ full range + georef. |
| Equinox/solstice markers + modal | ✓ | ✓ |
| Panchanga — Tithi + Vara | ✓ | ✓ |
| Panchanga — Nakshatra + Yoga + Karana | — | ✓ with countdown |
| Synastry — 3 most exact aspects | ✓ | ✓ |
| Synastry — full table + antiscia | — | ✓ |
| JSON export | Natal only | ✓ complete |

[**→ Get Premium — $12 USD one-time**](https://ko-fi.com/hermeticalabs)

---

## Roadmap

- [x] VSOP87 + ELP/MPP02 — planets and Moon (164L + 105B + 29R, LLR calibrated)
- [x] Eclipse calculator — solar and lunar, georeferenced visibility (Premium)
- [x] Equinox/solstice markers — VSOP87 bisection, hemisphere-adaptive, visual markers
- [x] Vedic Panchanga — 5 elements (Tithi, Vara, Nakshatra, Yoga, Karana) + Lahiri ayanamsa
- [x] Synastry — cross-chart aspects + antiscia, tab in Atacir panel
- [x] Extended validation — 56/56 tests vs JPL Horizons DE441 + Swiss Ephemeris DE441
- [ ] ELP/MPP02 extended R-series (Chapront & Francou 2002 coefficients → dist < 10 km)
- [ ] IAU 2000A nutation (1365 terms → ~0.1 mas)
- [ ] REST API layer for embedding in external apps
- [ ] WebAssembly kernel for high-performance batch computation
- [ ] IAU 2006 precession

---

## Documentation

- [AstroCore API](docs/astrocore.md) — Mathematical kernel: VSOP87, ELP/MPP02, coordinate transforms, Placidus houses, lunar nodes, phases, eclipse detection, ayanamsa
- [TimeEngine API](docs/timeengine.md) — Time control, Julian dates, sidereal time, full astronomical snapshots
- [Atacir — Cycle Analysis](docs/atacir.md) — Primary directions, natal and transit aspects, cycles, resonances, synastry, Panchanga
- [Mathematical references](docs/references.md) — Source algorithms, formulas, and full 56-test precision verification table

---

## Mathematical references

- Jean Meeus — *Astronomical Algorithms*, 2nd ed. (Willmann-Bell, 1998)
- VSOP87 — Bretagnon & Francou, A&A 202, 309 (1988)
- ELP/MPP02 — Chapront & Francou, A&A 412, 567 (2002)
- IAU 1980 nutation series — Seidelmann (ed.), *Explanatory Supplement*, 1992
- JPL Horizons System — https://ssd.jpl.nasa.gov/horizons/ (DE441 ephemeris)
- Swiss Ephemeris — Astrodienst AG, DE441 ephemeris

---

## License

Caelis Engine is dual-licensed:

**Open Source — AGPL-3.0**
Free to use, study, modify and share. If you use Caelis Engine in a product or service, you must publish your source code under the same terms. Full text: [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html)

**Commercial License — Hermetica Labs**
For use in proprietary products or services without the AGPL source disclosure requirement. Contact: [hermeticalabs.dev@proton.me](mailto:hermeticalabs.dev@proton.me)

---

## Author

**Cristian Valeria Bravo** · [Hermetica Labs](https://github.com/HermeticaLabs)

*Caelis Engine exists at the boundary between mathematical precision and symbolic observation — where the structure of time becomes navigable.*

Support the project: [ko-fi.com/hermeticalabs](https://ko-fi.com/hermeticalabs)

© 2024–2026 Cristian Valeria Bravo / Hermetica Labs
