# caelis-engine

**Professional astronomical calculation engine** — VSOP87, ELP/MPP02 (LLR calibrated), Placidus houses, eclipse calculator, Vedic Panchanga.

**107/107 tests PASS** vs JPL Horizons DE441, Swiss Ephemeris, Meeus AA 2nd ed.

```bash
npm install caelis-engine
```

---

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

---

## Precision

| Component | Max error | Reference |
|---|---|---|
| Moon λ (ELP/MPP02 LLR) | **0.0001° (0.45")** | JPL Horizons DE441 |
| Sun VSOP87 | 0.0003° | Meeus Cap.25 |
| Venus / Mars / Jupiter / Saturn | < 0.131° | JPL Horizons DE441 |
| Mercury (eq. of center) | < 0.116° | JPL Horizons DE441 |
| Mercury β orbital range | [-7°, +7°] ✓ | Orbital theory |
| IAU 1980 Nutation ΔΨ | < 0.004 arcsec | Meeus Cap.22 |
| Placidus ASC | < 0.019° | Reference chart |
| ΔT at J2000 | < 0.1 s | IERS |
| Equinoxes / Solstices | < 1 min | JPL Horizons 2025 |

**Valid range: 1800–2100 CE**

---

## API reference

Full TypeScript declarations in `dist/index.d.ts`.  
Complete documentation: [github.com/HermeticaLabs/caelis-engine](https://github.com/HermeticaLabs/caelis-engine)

---

## License

Caelis Engine is **dual-licensed**:

### Open Source — AGPL-3.0
Free to use, study, modify and share.  
If you use this package in a product or service, you must publish your source code under the same terms.  
Full text: [gnu.org/licenses/agpl-3.0.html](https://www.gnu.org/licenses/agpl-3.0.html)

### Commercial License
Required if you want to use this package in **closed-source or proprietary software** without the AGPL source-disclosure obligation.

| Level | Price | Use |
|---|---|---|
| Indie License | $59 USD one-time | 1 proprietary product |
| Studio License | $199 USD one-time | Unlimited proprietary products |

> **Note:** The $12 USD Premium in-app payment (available at the [live instrument](https://hermeticalabs.github.io/caelis-engine/)) unlocks features for **personal end-user use only** and does **not** grant commercial rights over the engine.

Purchase & inquiries: [ko-fi.com/hermeticalabs](https://ko-fi.com/hermeticalabs)  
Contact: [hermeticalabs.dev@proton.me](mailto:hermeticalabs.dev@proton.me)

---

© 2024–2026 Cristian Valeria Bravo / Hermetica Labs
