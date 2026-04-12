# caelis-engine

**Precision astronomical engine with hermetic AI interpretation layer**

[![npm version](https://img.shields.io/npm/v/caelis-engine)](https://www.npmjs.com/package/caelis-engine)
[![Live Demo](https://img.shields.io/badge/demo-live-8b5cf6)](https://hermeticalabs.github.io/caelis-engine/)

Single-file astronomical instrument implementing VSOP87, ELP/MPP02-LLR (164 longitude + 105 latitude + 29 radius terms), IAU 2000B nutation (77 series), IAU 2006 obliquity, ΔT MS2004, Lahiri ayanamsa 2nd order, Placidus houses via Newton-Raphson, and lunar nodes (15 terms). Validated against JPL Horizons DE441 across 500–2150 CE.

## Installation

```bash
npm install caelis-engine
```

## Quick Start

```javascript
import CaelisEngine from 'caelis-engine';

const engine = new CaelisEngine();

// Real-time planetary snapshot
const snap = engine.getSnapshot();
console.log(snap.bodies);        // all planet positions
console.log(snap.moon.phase);    // 0=new, 0.5=full, 1=new
console.log(snap.houses.asc);    // ascendant in degrees
console.log(snap.eclipse);       // null or { type, mag, contacts }

// Snapshot at specific Julian Date
const jd = 2451545.0; // J2000.0
const snapAt = engine.getSnapshotAt(jd);

// Individual functions
const sunLon  = engine.sunLonEcl();         // ecliptic longitude degrees
const moonLon = engine.moonLonEcl();        // ecliptic longitude degrees
const moonDist= engine.lunarDistELP(jd);    // distance in km
const deltaT  = engine.deltaT(jd);          // ΔT in seconds
const nut     = engine.nutation(T);         // { deltaPsi, deltaEps } radians
const houses  = engine.getHouseCusps();     // { asc, mc, cusps[12] }
```

## AstroSync API

```javascript
// Full snapshot object
{
  jd: 2451545.0,
  bodies: {
    Sol:      { ra, dec, lon_ecl, lat_ecl, dist_au },
    Luna:     { ra, dec, lon_ecl, lat_ecl, dist_km, phase, illumination },
    Mercurio: { ra, dec, lon_ecl },
    Venus:    { ra, dec, lon_ecl },
    Marte:    { ra, dec, lon_ecl },
    Júpiter:  { ra, dec, lon_ecl },
    Saturno:  { ra, dec, lon_ecl },
  },
  houses:  { asc, mc, cusps },   // Placidus or Equal
  eclipse: null | { type:'solar'|'lunar', mag, contacts },
  nutation:{ deltaPsi, deltaEps },
  obliquity: 23.439,
  lst:     6.123,                // Local Sidereal Time (hours)
  lat:    -33.45,                // observer latitude (degrees)
  lon:    -70.66,                // observer longitude (degrees)
}
```

## Synastry Example

```javascript
const chart1 = engine.getSnapshotAt(jd1);
const chart2 = engine.getSnapshotAt(jd2);
const aspects = engine.calcAspectosTransito(chart1, chart2);
// [ { a: {key,lon}, b: {key,lon}, asp: {nombre,angulo,orbe}, exactitud } ]
```

## Precision

| Body | Tolerance | Source |
|---|---|---|
| Sun | < 0.015° | JPL DE441 |
| Moon longitude | < 0.030° | JPL DE441 / Chapront 2002 |
| Moon distance | < 25,000 km | JPL DE441 |
| Planets | < 0.12° | JPL DE441 |
| Nutation ΔΨ | < 0.05″ | Meeus Ch.22 |
| Equinoxes/solstices | < 1h (0.042d) | JPL Horizons 2025 |

## Credit System

The AI interpretation layer uses a renewable credit system:

| Tier | Credits/day | Rollover cap | Price |
|---|---|---|---|
| Free | 3 | none | — |
| Personal | 15 | 45 | $19 |
| Developer | 40 | 120 | $49 |
| Studio | unlimited | — | $199 |

Credits renew automatically at midnight UTC. Rollover accumulates unused credits up to the cap (Personal/Developer only).

## Links

- **Live Demo:** [hermeticalabs.github.io/caelis-engine](https://hermeticalabs.github.io/caelis-engine/)
- **Repository:** [github.com/HermeticaLabs/caelis-engine](https://github.com/HermeticaLabs/caelis-engine)
- **Author:** Cristian Valeria Bravo / Hermetica Labs

## License

AGPL-3.0 © 2024–2026 Cristian Valeria Bravo / Hermetica Labs
