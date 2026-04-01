# caelis-engine

**Mathematical astronomical engine + symbolic interpretation system** — VSOP87, ELP/MPP02-LLR, IAU 2000B nutation, Placidus houses, eclipse calculator, Vedic Panchanga, secure AI interpretation layer.

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
  sunLonEcl,
  moonLonEcl,
  deltaT,
  nextSolEquinox,
} from 'caelis-engine';

// Full astronomical snapshot for any date and location
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

const eclipses = calcEclipsesCore(-33.45, -70.66, 2, true, true);
console.log(eclipses[0]);  // { jde, tipo, subtipo, magnitud, dist, visible }

const atacir = calcAtacirCore(
  '1990-03-15', '12:00', -33.45, -70.66,   // natal: date, time, lat, lon
  '2025-01-01', '12:00', -33.45, -70.66,   // transit: date, time, lat, lon
  1.0  // Naibod key
);
console.log(atacir.aspNatales);    // natal aspects
console.log(atacir.aspTransito);   // transit aspects

const synastry = calcSinastriaCore(
  '1990-03-15', '12:00', -33.45, -70.66,
  '1995-07-22', '08:30', -33.45, -70.66
);
console.log(synastry.aspectos);    // cross-chart aspects with symbolic weights
```

## Algorithms

| Algorithm | Source | Terms |
|---|---|---|
| VSOP87 | Bretagnon & Francou 1987 | Earth: 185 · Venus: 79 · Mars: 152 · Jupiter: 141 · Saturn: 167 |
| Mercury | Meeus Ch.31 equation of center | 5 terms, e=0.206 |
| ELP/MPP02-LLR | Chapront & Francou 2002, LLR-calibrated | 164L + 105B + 29R |
| IAU 2000B nutation | Mathews, Herring & Buffett 2002 | 77 lunisolars + Capitaine 2003 args |
| Obliquity IAU 2006 | Capitaine et al. 2006 | Degree-5 polynomial |
| ΔT | Morrison & Stephenson 2004 + IERS | 74-point table, 500–2150 CE |
| Lunar nodes | Meeus Ch.47 | 15 periodic corrections |
| Lahiri ayanamsa | IAU 1955 + Lieske 1977 2nd order | Precession integral |
| Eclipse detection | Meeus Ch.54 | F-argument criterion + magnitude |

## Precision

| Component | Max error | Reference |
|---|---|---|
| Moon λ (ELP/MPP02-LLR) | **0.0067° (24")** | Meeus AA Ex.47.a |
| Sun VSOP87 | 0.0011° | Meeus AA Ex.25.a |
| Venus / Mars / Jupiter / Saturn | < 0.131° | JPL Horizons DE441 |
| Mercury (eq. of center) | < 0.116° | JPL Horizons DE441 |
| IAU 2000B nutation ΔΨ | < 1 mas | IERS Conventions 2003 |
| Obliquity ε₀ at J2000 | < 0.001° | IAU 2006 |
| Placidus ASC | < 0.105° | Newton-Raphson |
| ΔT at J2000 | 63.8 s | IERS Bulletin |
| Lunar nodes Ω at J2000 | < 1.32° | Meeus Ch.47 |

**Valid range: 500–2150 CE** (ΔT table) · Numerically stable to 3000 CE

## AI Interpretation Layer

The engine exposes structured astronomical data to a secure AI backend:

- **Structured payload only** — planets, aspects, houses, cycles
- **No API keys in client** — Cloudflare Worker with server-side secrets
- **Origin validation** — unauthorized domains rejected (403)
- **License-gated** — Premium access via `X-Caelis-License` header
- **4 reading types** — current sky · natal chart · Atacir · synastry · Panchanga

The AI interprets the computed structure — it does not replace the mathematical model.

## v2.2 Changes

| Change | Description |
|---|---|
| **Settings panel** | Language selector, AI voice, compact dropdown in toolbar |
| **i18n ES/EN** | Full system with `_t()`, `_applyLang()`, `data-i18n` attributes |
| **Worker URL hardcoded** | No manual configuration — URL and security managed internally |
| **Eclipse → jump to moment** | Click any eclipse row → instrument jumps to that exact instant |
| **Eclipse table scroll** | Sticky headers, vertical scroll, range up to ±10 years |
| **Panchanga AI button** | Hermetic reading available directly from Vedic panel |
| **Aspect table fix** | Natal and transit tables were missing `<table>` tag — fixed |
| **Eclipse in Astrolabe mode** | Corona, rays, Baily's bead and darkening in both render modes |

## API reference

See full TypeScript declarations in `dist/index.d.ts` or the [GitHub repository](https://github.com/HermeticaLabs/caelis-engine).

## Running tests

```bash
node suite_v2_final.js      # 145/145 precision tests vs JPL Horizons
node test_precision.js      # 29/29 algorithm unit tests
python audit_prod.py index.html  # 51/51 production readiness checks
```

## License

**AGPL-3.0** (open source, modifications must be published) · **Commercial License** available for proprietary/closed-source use.

| Tier | Price | Use |
|---|---|---|
| Personal | $19 USD one-time | Full instrument + AI readings |
| Developer | $49 USD one-time | Personal + commercial + npm |
| Studio | $199 USD one-time | Developer + white-label + support |

Contact: [hermeticalabs.dev@proton.me](mailto:hermeticalabs.dev@proton.me)
