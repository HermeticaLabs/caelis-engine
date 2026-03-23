# Caelis Engine

**Mathematical astronomical modeling engine for symbolic celestial observation.**

Caelis Engine v2.1 computes real planetary positions with professional-precision algorithms (VSOP87, ELP/MPP02, IAU 2000B), renders them as a living symbolic instrument, and exposes a complete astronomical-astrological analysis framework — in a single HTML file with zero dependencies.

[**→ Live Demo**](https://hermeticalabs.github.io/caelis-engine/) · [**Docs**](#documentation) · [**License**](#license) · [**Ko-fi**](https://ko-fi.com/hermeticalabs)

---

## What it does

```
Symbol → Structure → Simulation
```

- Computes Sun, Moon, and 5 planets using **VSOP87** (planets) and **ELP/MPP02** (Moon, LLR-calibrated 2002), verified against Meeus, JPL Horizons DE441, and Swiss Ephemeris — **145/145 tests PASS**
- Renders a real-time **2D sky map** with horizon, ecliptic, Placidus house cusps, 600 background stars, and equinox/solstice markers
- Switches to **Oculus 3D** — a Three.js orbital sphere where planets move in true celestial coordinates
- Analyzes **planetary cycles, resonances, and periodicity** via the **Atacir** panel (with Synastry tab)
- **Eclipse calculator** — solar and lunar, georeferenced visibility (Meeus Cap.54, Premium)
- **Vedic Panchanga** — Tithi, Vara, Nakshatra, Yoga, Karana with Lahiri ayanamsa 2nd order (Premium)
- **Equinox/solstice markers** — VSOP87 bisection, hemisphere-adaptive, < 1 min precision

---

## Why it's different

| Feature | Caelis Engine | Typical astro library | Typical sky app |
|---|---|---|---|
| VSOP87 + ELP/MPP02 (LLR calibrated) | ✓ | sometimes | rarely |
| IAU 2000B nutation (77 series) | ✓ | rarely | no |
| 145/145 tests vs JPL Horizons + Meeus + IERS | ✓ | rarely | no |
| Valid range 500–2150 CE (ΔT table) | ✓ | varies | no |
| Zero dependencies | ✓ | no | no |
| Symbolic + scientific layer | ✓ | no | no |
| Clean pure-function API (no DOM) | ✓ | varies | no |
| Eclipse calculator (georeferenced) | ✓ | rarely | rarely |
| Vedic Panchanga (5 elements) | ✓ | no | rarely |
| Synastry cross-aspects + house overlay | ✓ | no | no |
| Single file, runs offline | ✓ | no | no |

---

## Architecture — v2.1

Caelis Engine v2.1 maintains clean separation between the mathematical core and the UI layer:

| Function | Status | Notes |
|---|---|---|
| `calcAtacirCore()` | ✅ Pure — no DOM | Primary directions + aspects + cycles |
| `calcPanchangaCore()` | ✅ Pure — no DOM | 5 Panchanga elements + Lahiri ayanamsa |
| `calcEclipsesCore()` | ✅ Pure — no DOM | Eclipse detection + georef visibility |
| `calcSinastriaCore()` | ✅ Pure — no DOM | Cross-chart aspects + antiscias + house overlay |
| `getSnapshotAt()` | ✅ try/finally | State always restored on exception |
| `nutation(T)` | ✅ Memoized | IAU 2000B, cache key = T |
| `lunarNodes()` | ✅ Memoized | 15-term series, cache key = T |

The `*Core()` functions take plain parameters (dates, coords) and return data objects — usable in Node.js, REST APIs, or npm packages without any DOM mocks.

---

## Mathematical foundations

### Algorithms

| Algorithm | Source | Terms | Applies to |
|---|---|---|---|
| **VSOP87** | Bretagnon & Francou 1987, Meeus App.II | Earth: 185 · Venus: 79 · Mars: 152 · Jupiter: 141 · Saturn: 167 | Venus, Mars, Jupiter, Saturn, Sun |
| **Mercury** | Meeus Cap.31 (equation of center) | 5 terms, e=0.206 | Mercury |
| **ELP/MPP02** | Chapront & Francou 2002, A&A 412 (LLR) | 164L + 105B + 29R | Moon |
| **IAU 2000B Nutation** | Mathews, Herring & Buffett 2002 / IERS Conv. 2003 | 77 lunisolars + Capitaine 2003 args | ΔΨ, Δε |
| **Obliquity** | IAU 2006 (Capitaine et al. 2006) | Degree-5 polynomial | ε₀ |
| **Placidus houses** | Meeus Cap.37 | Newton-Raphson < 1×10⁻⁹ rad | Cusps I–XII |
| **ΔT** | Morrison & Stephenson 2004 + IERS + USNO | 74-point table, 500–2150 CE | TT−UT |
| **Lunar nodes** | Meeus Cap.47 | 15 periodic corrections | ☊ ☋ |
| **Eclipse detection** | Meeus Cap.54 | F-argument criterion | Solar · Lunar |
| **Equinoxes/Solstices** | VSOP87 bisection | < 1 min precision | 0°, 90°, 180°, 270° |
| **Lahiri ayanamsa** | IAU 1955 + Lieske 1977 (2nd order) | 23.85282° + precession integral | Vedic sidereal |

> **Note on Mercury:** `vsop87Mercurio()` uses Meeus Cap.31 equation of center (not VSOP87 series) due to Mercury's high eccentricity (e=0.206). The truncated VSOP87 series gives ~21° error for Mercury. The function name is preserved for interface compatibility. Verified error: < 0.116° vs JPL Horizons DE441.

### Precision — 145/145 tests PASS

| Component | Max error | Reference |
|---|---|---|
| **Moon λ (ELP/MPP02)** | **0.0067° (24") — 63× vs ELP2000** | Meeus AA Ex.47.a |
| Sun VSOP87 | 0.0011° | Meeus AA Ex.25.a |
| Mercury (eq. of center) | < 0.116° | JPL Horizons DE441 |
| Venus / Mars / Jupiter / Saturn | < 0.131° | JPL Horizons DE441 |
| Mercury β orbital range | [-7°, +7°] ✓ | Orbital theory |
| IAU 2000B Nutation ΔΨ | < 1 mas | IERS Conventions 2003 |
| ΔΨ physical range | \|ΔΨ\| < 20" in 10 dates 1900–2025 | IAU 2000B |
| Obliquity ε₀ at J2000 | < 0.001° | IAU 2006 |
| Placidus ASC | < 0.105° | Newton-Raphson |
| ΔT at J2000 | 63.8 s | IERS Bulletin |
| Equinoxes/Solstices 2025 | < 0.5° | JPL Horizons DE441 |
| Lunar nodes Ω at J2000 | < 1.32° | Meeus Cap.47 |

**Valid range: 500–2150 CE** (ΔT table) · Numerically stable 500–3000 CE

---

## Recent upgrades — v2.1.1

| Upgrade | Details | Gain |
|---|---|---|
| **IAU 2000B Nutation** | 77 lunisolars (Mathews 2002) + Capitaine 2003 args | ΔΨ precision: 10 mas → 1 mas (10×) |
| **Obliquity IAU 2006** | Capitaine et al. 2006, degree-5 polynomial | ε₀ accurate to 0.002" at J2000 |
| **ΔT table extended** | Morrison & Stephenson 2004 + Stephenson 2016, 500–2150 CE | Valid range: 1620–2100 → 500–2150 |
| **Lahiri 2nd order** | Lieske 1977 precession integral | Up to 3' improvement at 1600 CE |
| **Lunar nodes 15 terms** | Full Meeus Cap.47 series | Error: ~1.24° → ~0.25° (5×) |

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
const dT      = deltaT(jde);          // seconds (ΔT table 500–2150 CE)
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
| Synastry — full table + antiscia + house overlay | — | ✓ |
| JSON export | Natal only | ✓ complete |

[**→ Get Premium — $12 USD one-time**](https://ko-fi.com/hermeticalabs)

---

## Roadmap

- [x] VSOP87 + ELP/MPP02 — 164L + 105B + 29R, LLR calibrated (63× lunar precision)
- [x] Eclipse calculator — georeferenced, solar and lunar (Premium)
- [x] Equinox/solstice markers — VSOP87 bisection, hemisphere-adaptive
- [x] Vedic Panchanga — 5 elements + Lahiri ayanamsa (Premium)
- [x] Synastry — cross-chart aspects + antiscias + house overlay
- [x] 145/145 tests vs JPL Horizons DE441 + Meeus AA + IERS
- [x] **v2.1 — Pure core functions (no DOM), try/finally state safety, nutation/nodes cache**
- [x] **IAU 2000B nutation (77 series) — 10× precision improvement over IAU 1980**
- [x] **ΔT table extended to 500–2150 CE (Morrison & Stephenson 2004)**
- [x] **Lahiri ayanamsa 2nd order (Lieske 1977) — improved historical Panchanga**
- [x] **Lunar nodes full series — 15 terms (Meeus Cap.47) — 5× precision improvement**
- [ ] AI hermetic interpretation — coming soon (experimental)
- [ ] Google Play Store
- [ ] ELP/MPP02 extended R-series → dist < 10 km
- [ ] IAU 2000A nutation (1365 terms → ~0.1 mas)
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

**Open Source — AGPL-3.0** · Free to use, study, modify and share. Source disclosure required for products/services. Full text: [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html)

**Commercial License** · For proprietary use. Contact: [hermeticalabs.dev@proton.me](mailto:hermeticalabs.dev@proton.me)

---

## Author

**Cristian Valeria Bravo** · [Hermetica Labs](https://github.com/HermeticaLabs)

*Caelis Engine exists at the boundary between mathematical precision and symbolic observation — where the structure of time becomes navigable.*

Support: [ko-fi.com/hermeticalabs](https://ko-fi.com/hermeticalabs) · © 2024–2026 Cristian Valeria Bravo / Hermetica Labs
