# Caelis Engine

**A mathematical astronomical modeling engine for symbolic celestial observation.**

Caelis Engine computes real planetary positions using professional-grade algorithms (VSOP87, ELP2000), renders them as a living symbolic instrument, and exposes a cycle and resonance analysis framework — all in a single HTML file with zero dependencies.

[**→ Live Demo**](https://hermeticalabs.github.io/caelis-engine) · [**Docs**](#documentation) · [**License**](#license)

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

- Computes Sun, Moon, and 5 planets using **VSOP87** (planets) and **ELP2000 Cap.47** (Moon), verified against Jean Meeus' *Astronomical Algorithms*
- Renders a real-time **2D sky map** with horizon, ecliptic, house cusps (Placidus), and 600 background stars
- Switches to **Oculus 3D** — a Three.js orbital sphere where planets move in true celestial coordinates
- Analyzes **planetary cycles, resonances, and periodicity** — conjunction timings, synodic periods, aspect patterns
- Houses, aspects, transits and progressions via the **Atacir** analysis panel

---

## Why it's different

| Feature | Caelis Engine | Typical astro library | Typical sky app |
|---|---|---|---| 
| VSOP87 + ELP2000 | ✓ | sometimes | rarely |
| Verified against Meeus | ✓ | rarely | no |
| Zero dependencies | ✓ | no | no |
| Symbolic + scientific layer | ✓ | no | no |
| Cycle & resonance analysis | ✓ | no | no |
| Single file, runs in browser | ✓ | no | no |
| Modular architecture | ✓ | varies | no |

---

## Core modules

```
caelis-engine/
├── caelis_engine_1_5.html     ← Full instrument (single file, runs standalone)
└── src/
    ├── AstroCore.js           ← VSOP87, ELP2000, coordinate transforms
    ├── TimeEngine.js          ← Julian dates, sidereal time, time control
    └── Atacir.js              ← Cycle analysis, aspects, resonances, progressions
```

**AstroCore** — the mathematical kernel. Planetary position algorithms, coordinate system transforms (ecliptic → equatorial → horizontal), lunar phase computation, fixed star data.

**TimeEngine** — time as a first-class variable. Julian date conversion, sidereal time, time offset control, speed multiplier (from 1 second/frame to 1 year/frame).

**Atacir** — the analytical layer. Natal and transit aspects, planetary cycles, synodic periods, resonance detection, Placidus house progression.

---

## Precision

Moon position verified at JDE 2448724.5 (Meeus Example 47.a):
- Computed: λ = 133.1628°, β = −3.2291°, Δ = 368409.7 km
- Meeus reference: λ = 133.1627°, β = −3.2291°, Δ = 368409.7 km
- **Error: < 0.001°**

Planetary positions verified against JPL Horizons for 2026-03-08 12:00 UTC. All bodies within 0.1° of reference.

---

## Quickstart

```bash
git clone https://github.com/HermeticaLabs/caelis-engine
# Open caelis_engine_1_5.html in any modern browser
# No install. No build. No server required.
```

Or run the modules in Node.js:

```javascript
import { sunPosition, moonPosition, planetPosition } from './src/AstroCore.js';

const jd = 2451545.0; // J2000.0
const sun  = sunPosition(jd);
const moon = moonPosition(jd);
const mars = planetPosition(jd, 'Marte');

console.log(sun.lon, moon.lon, mars.lon); // ecliptic longitudes in degrees
```

---

## Roadmap

- [ ] Plugin architecture — extend with custom bodies, coordinate systems, renderers
- [ ] REST-style API layer for embedding in external apps
- [ ] Export: ephemeris tables, aspect timelines, cycle reports
- [ ] WebAssembly kernel for high-performance batch computation
- [ ] Dark sky mode / observational overlays

---

## Documentation

- [AstroCore API](docs/astrocore.md) *(coming soon)*
- [TimeEngine API](docs/timeengine.md) *(coming soon)*
- [Atacir — Cycle Analysis](docs/atacir.md) *(coming soon)*
- [Mathematical references](docs/references.md) *(coming soon)*

---

## Mathematical foundations

- Jean Meeus — *Astronomical Algorithms*, 2nd ed.
- VSOP87 — Bretagnon & Francou, 1987
- ELP2000-82B — Chapront-Touzé & Chapront, 1988
- IAU nutation series, FK5 corrections, aberration

---

## License

Caelis Engine is dual-licensed:

**Open Source — AGPL-3.0**
Free to use, study, modify and share. If you use Caelis Engine in a product or service, you must publish your source code under the same terms.

**Commercial License — Hermetica Labs**
For use in proprietary products or services without the AGPL source disclosure requirement. Contact: [hermeticalabs@proton.me](mailto:hermeticalabs@proton.me)

---

## Author

**Cristian Valeria Bravo** · [Hermetica Labs](https://github.com/HermeticaLabs)

*Caelis Engine exists at the boundary between mathematical precision and symbolic observation — where the structure of time becomes navigable.*

© 2024–2026 Cristian Valeria Bravo / Hermetica Labs
