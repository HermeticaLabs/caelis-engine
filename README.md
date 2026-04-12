# Caelis Engine 2.2

**Precision astronomical instrument with hermetic AI interpretation**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-hermeticalabs.github.io-8b5cf6)](https://hermeticalabs.github.io/caelis-engine/)
[![npm](https://img.shields.io/npm/v/caelis-engine)](https://www.npmjs.com/package/caelis-engine)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue)](LICENSE)

Caelis Engine is a professional astronomical instrument that runs entirely in the browser as a single HTML monolith. It combines precision mathematical algorithms (VSOP87, ELP/MPP02-LLR, IAU 2000B) with an AI interpretation layer, all without external dependencies for the core engine.

---

## Live Demo

**[hermeticalabs.github.io/caelis-engine](https://hermeticalabs.github.io/caelis-engine/)**

---

## What's New in v2.2

- **Perimeter glow system** — real-time visual feedback for active aspects, natal transits (purple halo) and eclipses (gold/silver)
- **Astrolabe aspect panel** — compact overlay showing active aspects in astrolabe mode
- **Renewable credit system** — 3 free credits/day with automatic midnight UTC renewal; Personal (15/day, 45 rollover), Developer (40/day, 120 rollover), Studio (unlimited)
- **Dark moon during solar eclipse** — astronomically correct: lunar disk goes dark when occulting the sun
- **Oculus speed refactor** — 10x–963x range, ±10 step, hard 963x barrier
- **Clean IA voice** — markdown stripped before speech synthesis
- **5-button audio bar** — play · pause · repeat · copy · share
- **Settings layer toggles** — constellations, houses, Milky Way, aspects as ON/OFF switches
- **localStorage persistence** — observer location, house system, layers, natal chart, language all saved across sessions
- **Capacitor detector** — `body.capacitor` class for Android app feature gating

---

## Mathematical Engine

| Algorithm | Source | Verified |
|---|---|---|
| VSOP87 | Bretagnon & Francou 1987 | ✅ Sun + 5 planets |
| ELP/MPP02-LLR | Chapront 2002 — 164L+105B+29R | ✅ Moon |
| IAU 2000B nutation | Mathews 2002 — 77 series | ✅ |
| Obliquity IAU 2006 | Capitaine — degree 5 polynomial | ✅ |
| ΔT MS2004 + Stephenson 2016 | 74 points 500–2150 CE | ✅ |
| Lahiri ayanamsa 2nd order | IAU 1955 + Lieske 1977 | ✅ |
| Lunar nodes 15 terms | Meeus Ch.47 | ✅ |
| Placidus houses | Newton-Raphson | ✅ |
| Mercury Meeus Ch.31 | Equation of centre | ✅ |

**Validated range:** 500–2150 CE  
**Test suite:** 145/145 JPL precision tests · 29/29 algorithm unit tests · 51/51 production audit checks

---

## Features

- Stereographic polar projection (Caelis mode)
- Astrolabe mode (rete + tympanum)
- Oculus 3D mode (Three.js)
- Primary directions / Atacir (Al-Biruni, Ptolemy, Naibod)
- Full synastry (cross-aspects, antiscia, biwheel SVG export)
- Eclipse calculator (±10 years, click-to-jump)
- Vedic Panchanga (5 elements + Lahiri ayanamsa)
- Hermetic AI reading (4 types + voice + audio bar)
- Solar corona rendering during total eclipse
- Full ES/EN i18n with `_t()` system
- PWA (installable, offline-capable)
- Android app via Capacitor

---

## Pricing

| Tier | Price | Credits | Rollover |
|---|---|---|---|
| Free | — | 3/day | none |
| Personal | $19 | 15/day | up to 45 |
| Developer | $49 | 40/day | up to 120 |
| Studio | $199 | unlimited | — |

---

## AstroSync API

```javascript
import CaelisEngine from 'caelis-engine';

const engine = new CaelisEngine();
const snap = engine.getSnapshot();

console.log(snap.bodies.Sol.lon_ecl);  // ecliptic longitude
console.log(snap.moon.phase);          // 0–1
console.log(snap.houses.asc);          // ascendant degree
```

---

## Validation

```bash
node suite_v2_final.js    # 145/145 JPL precision tests
node test_precision.js    # 29/29 algorithm unit tests
python audit_prod.py index.html  # 51/51 production checks
```

---

## Repository Structure

```
caelis-engine/
├── index.html              ← Production monolith (PROD)
├── caelis_engine_2_2.html  ← Versioned copy
├── manifest.json           ← PWA manifest
├── sw.js                   ← Service worker
├── suite_v2_final.js       ← JPL precision test suite
├── test_precision.js       ← Algorithm unit tests
├── audit_prod.py           ← Production audit (51 checks)
├── sync_caelis_v22.ps1     ← Full sync script (engine→web→app)
├── docs/
│   ├── astrocore.md
│   ├── atacir.md
│   ├── references.md
│   └── timeengine.md
└── assets/icons/
```

---

## License

AGPL-3.0 © 2024–2026 Cristian Valeria Bravo / Hermetica Labs  
[hermeticalabs.github.io/caelis-engine](https://hermeticalabs.github.io/caelis-engine/)
