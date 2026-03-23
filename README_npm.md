# caelis-engine

**Professional astronomical calculation engine** — VSOP87, ELP/MPP02 (LLR calibrated), IAU 2000B nutation, Placidus houses, eclipse calculator, Vedic Panchanga.

**145/145 tests PASS** vs JPL Horizons DE441 (NASA), Meeus AA 2nd ed., IERS Conventions.

```bash
npm install caelis-engine
```

## Quick start

```js
import {
  getSnapshotAt,
  calcAtacirCore,
  calcPanchangaCore,
  calcEclipsesCore,
  calcSinastriaCore,
  calcAspectosTransito,
  sunLonEcl,
  moonLonEcl,
  deltaT,
  nextSolEquinox,
} from 'caelis-engine';

// Astronomical snapshot for any date and location
const snap = getSnapshotAt(
  2460742.5,   // Julian Date (TT)
  -33.45,      // latitude degrees
  -70.66       // longitude degrees
);
console.log(snap.bodies.Sol.lon_ecl);   // Sun ecliptic longitude
console.log(snap.bodies.Luna.lon_ecl);  // Moon ecliptic longitude
console.log(snap.houses.asc);           // Ascendant (Placidus)

// Pure calculation cores — no DOM required
const panchanga = calcPanchangaCore('2025-03-20', '09:00');
console.log(panchanga.tithiName);     // e.g. 'Chaturthi'
console.log(panchanga.naks.name);     // e.g. 'Uttara Bhadrapada'

const eclipses = calcEclipsesCore(-33.45, -70.66, 1, true, true);
console.log(eclipses[0]);  // { jde, tipo, subtipo, magnitud, dist, visible }

const atacir = calcAtacirCore(
  '1990-03-15', '12:00', -33.45, -70.66,   // natal: date, time, lat, lon
  '2025-01-01', '12:00', -33.45, -70.66,   // transit: date, time, lat, lon
  1.0  // Naibod key
);
console.log(atacir.aspNatales);   // natal aspects
console.log(atacir.aspTransito);  // transit aspects
```

## Algorithms

| Algorithm | Source | Terms |
|---|---|---|
| VSOP87 | Bretagnon & Francou 1987 | Earth: 185 · Venus: 79 · Mars: 152 · Jupiter: 141 · Saturn: 167 |
| Mercury | Meeus Cap.31 equation of center | 5 terms, e=0.206 |
| ELP/MPP02 | Chapront & Francou 2002, LLR-calibrated | 164L + 105B + 29R |
| IAU 2000B nutation | Mathews, Herring & Buffett 2002 | 77 lunisolars + Capitaine 2003 args |
| Obliquity IAU 2006 | Capitaine et al. 2006 | Degree-5 polynomial |
| ΔT | Morrison & Stephenson 2004 + IERS | 74-point table, 500–2150 CE |
| Lunar nodes | Meeus Cap.47 | 15 periodic corrections |
| Lahiri ayanamsa | IAU 1955 + Lieske 1977 2nd order | Precession integral |

## Precision

| Component | Max error | Reference |
|---|---|---|
| Moon λ (ELP/MPP02 LLR) | **0.0067° (24")** | Meeus AA Ex.47.a |
| Sun VSOP87 | 0.0011° | Meeus AA Ex.25.a |
| Venus / Mars / Jupiter / Saturn | < 0.131° | JPL Horizons DE441 (NASA) |
| Mercury (eq. of center) | < 0.116° | JPL Horizons DE441 (NASA) |
| IAU 2000B nutation ΔΨ | < 1 mas | IERS Conventions 2003 |
| Obliquity ε₀ at J2000 | < 0.001° | IAU 2006 |
| Placidus ASC | < 0.105° | Newton-Raphson |
| ΔT at J2000 | 63.8 s | IERS Bulletin |
| Lunar nodes Ω at J2000 | < 1.32° | Meeus Cap.47 |

**Valid range: 500–2150 CE** (ΔT table) · Numerically stable to 3000 CE

## Recent upgrades

| Upgrade | Gain |
|---|---|
| IAU 2000B nutation (77 series) | ΔΨ: 10 mas → 1 mas (10×) |
| Obliquity IAU 2006 | ε₀ accurate to 0.002" at J2000 |
| ΔT table 500–2150 CE | Extended from 1620–2100 |
| Lahiri ayanamsa 2nd order | Up to 3' improvement at 1600 CE |
| Lunar nodes 15 terms | Error: ~1.24° → ~0.25° (5×) |

## API reference

See full TypeScript declarations in `dist/index.d.ts` or the [GitHub repository](https://github.com/HermeticaLabs/caelis-engine).

## License

**AGPL-3.0** (open source) · **Commercial License** available for proprietary use ($59–$199 USD).

Contact: [hermeticalabs.dev@proton.me](mailto:hermeticalabs.dev@proton.me)
