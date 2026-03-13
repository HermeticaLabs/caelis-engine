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
| Verified against JPL Horizons | ✓ | rarely | no |
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
├── validation.html            ← Precision test suite — 30/30 PASS
└── src/
    ├── astro/
    │   └── AstroCore.js       ← VSOP87, ELP2000, coordinate transforms
    ├── TimeEngine.js          ← Julian dates, sidereal time, time control
    └── Atacir.js              ← Cycle analysis, aspects, resonances, progressions
```

**AstroCore** — the mathematical kernel. Planetary position algorithms, coordinate system transforms (ecliptic → equatorial → horizontal), lunar phase computation, fixed star data.

**TimeEngine** — time as a first-class variable. Julian date conversion, sidereal time, time offset control, speed multiplier (from 1 second/frame to 1 year/frame).

**Atacir** — the analytical layer. Natal and transit aspects, planetary cycles, synodic periods, resonance detection, Placidus house progression.

---

## Precision

All results verified by `validation.html` — **30/30 tests PASS**.

### Moon · ELP2000 (Meeus Example 47.a · JDE 2448724.5)

| Quantity | Computed | Meeus reference | Error |
|---|---|---|---|
| λ Ecliptic longitude | 133.1782° | 133.1627° | **0.016°** |
| β Ecliptic latitude | −3.2286° | −3.2291° | **0.001°** |
| Δ Geocentric distance | 368,436 km | 368,409.7 km | **27 km** |

### Sun · VSOP87 (Meeus Cap.25)

| Date | Computed | Reference | Error |
|---|---|---|---|
| 1992-10-13 (Libra) | 199.9068° | 199.906° | **< 0.001°** |
| 1992-04-12 (Taurus) | 22.3402° | 22.340° | **< 0.001°** |

### Planets · JPL Horizons (2026-03-08 12:00 UTC)

| Planet | Computed | JPL Horizons | Error |
|---|---|---|---|
| Venus | 2.5469° | 2.5500° | **0.003°** |
| Mars | 334.6487° | 334.6500° | **0.001°** |
| Jupiter | 105.0983° | 105.1000° | **0.002°** |
| Saturn | 2.6230° | 2.6200° | **0.003°** |

### Other components

| Component | Result |
|---|---|
| IAU 1980 Nutation ΔΨ | error < 0.004 arcsec vs Meeus |
| IAU 1980 Nutation Δε | error < 0.002 arcsec vs Meeus |
| Obliquity ε₀ at J2000 | error < 0.002° vs Meeus |
| Lunar phases (JDE) | error < 0.17 days vs Meeus Cap.49 |
| Placidus house cusps | 12/12 computed correctly |
| Lunar nodes | Nodo Sur = Nodo Norte + 180° ✓ |

**Valid range:** VSOP87 truncated series (Meeus App.II) — reliable precision within 1800–2100 CE.

---

## Quickstart

```bash
git clone https://github.com/HermeticaLabs/caelis-engine
# Open caelis_engine_1_5.html in any modern browser
# No install. No build. No server required.
```

Or run the modules in Node.js:

```javascript
import { sunPosition, moonPosition, planetPosition } from './src/astro/AstroCore.js';

const jd  = 2451545.0; // J2000.0
const sun  = sunPosition(jd);
const moon = moonPosition(jd);
const mars = planetPosition(jd, 'Marte');

console.log(sun.lon, moon.lon, mars.lon); // ecliptic longitudes in degrees
```

Run the precision test suite:

```bash
# Open in browser via local server
node -e "const h=require('http'),f=require('fs'),p=require('path');h.createServer((req,res)=>{let fp='.'+req.url;if(fp==='./') fp='./index.html';f.readFile(fp,(e,d)=>{if(e){res.writeHead(404);res.end()}else{const ext=p.extname(fp);const m={'html':'text/html','js':'application/javascript','css':'text/css'};res.writeHead(200,{'Content-Type':m[ext.slice(1)]||'text/plain'});res.end(d)}})}).listen(8080,()=>console.log('http://localhost:8080'))"
# Then open http://localhost:8080/validation.html
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
- IAU 1980 nutation series, FK5 corrections, annual aberration

---

## License

Caelis Engine is dual-licensed:

**Open Source — AGPL-3.0**
Free to use, study, modify and share. If you use Caelis Engine in a product or service, you must publish your source code under the same terms.

**Commercial License — Hermetica Labs**
For use in proprietary products or services without the AGPL source disclosure requirement. Contact: [hermeticalabs.dev@proton.me](mailto:hermeticalabs.dev@proton.me)

---

## Author

**Cristian Valeria Bravo** · [Hermetica Labs](https://github.com/HermeticaLabs)

*Caelis Engine exists at the boundary between mathematical precision and symbolic observation — where the structure of time becomes navigable.*

© 2024–2026 Cristian Valeria Bravo / Hermetica Labs
