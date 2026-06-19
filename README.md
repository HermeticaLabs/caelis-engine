# Caelis Engine

**Stop calling astrology APIs.**

**Every number this engine produces can be traced back to a known astronomical model, with declared precision and zero hidden assumptions.**

Caelis Engine is a deterministic computation engine for celestial data. It replaces opaque APIs and black-box calculations with a fully auditable, reproducible, self-contained system — running entirely in the browser or Node.js, with no server, no API key, no ephemeris files, and no dependencies.

```json
{
  "schema_version": "3.1",
  "meta": {
    "jd_tt": 2461193.499437,
    "frame": {
      "planets":  "VSOP87B (Bretagnon & Francou 1987)",
      "moon":     "ELP/MPP02-LLR · 164L+105B+60R terms",
      "nutation": "IAU 2000B · 77 luni-solar terms"
    }
  },
  "bodies": {
    "Sol":     { "lon_ecl_geocentric_deg": 71.498, "alt_geometric_deg": -27.896, "above_horizon": false },
    "Luna":    { "lon_ecl_geocentric_deg": 269.330, "lon_ecl_topocentric_deg": 270.082, "dist_km": 388954 },
    "Jupiter": { "lon_ecl_geocentric_deg": 114.254, "alt_geometric_deg": 8.267, "above_horizon": true }
  }
}
```

---

## The problem

Most platforms working with celestial data rely on:

- Third-party APIs with opaque internal logic
- Results that cannot be audited or reproduced independently
- Infrastructure costs that scale with usage
- A dependency you don't control — and can't inspect

When something returns the wrong number, you have no way to know why.
When the API changes, your product breaks.
When the service goes down, so do you.

---

## The solution

Caelis Engine gives you full ownership of your celestial computation layer.

- **Deterministic** — same input, same output. Always. Provably.
- **Auditable** — every algorithm declared in `meta.frame`. Every number traceable to its source.
- **Self-contained** — runs in the browser, in Node.js, in edge functions, offline. No backend required.
- **Schema-stable** — versioned JSON outputs with long-term compatibility guarantees.
- **Zero dependencies** — one JavaScript file. No install, no build step, no network.

This is not an API. It is a protocol — with a contract, invariants, and verifiable guarantees.

It is what products are built on.

---

## Who builds with Caelis Engine

**For platforms that cannot afford external dependencies in celestial computation:**

**Astrology applications** — birth charts, transits, synastry, progressions.
Real planetary positions without subscription costs or rate limits. Runs 100% offline on the user's device. No data leaves the client.

**For teams building scientific or educational systems where reproducibility matters:**

**Astronomy and educational tools** — observational planning, sky simulators, interactive planetariums.
Deterministic output means reproducible results across every device, every run.

**For companies currently relying on APIs with opaque outputs or inconsistent schemas:**

**AI pipelines and data infrastructure** — any system where celestial data must be consistent, traceable, and unambiguous.
A disabled plugin does not exist in the JSON. No null fields, no implicit states.

**For teams building interactive systems that require lightweight and portable computation:**

**Games and interactive experiences** — procedural sky systems, lunar calendar logic, celestial mechanics.
Single-file distribution. Works offline. No build step required.

---

## Architecture

```
TimeEngine → AstroCore → [ A.T.A.C.I.R. (optional) ]
```

Three layers. One direction. Strict separation of concerns.

### TimeEngine
The only module that reads `Date.now()`. Computes JD, ΔT, GAST, LST, observer state. Every other module receives time as an explicit parameter.

### AstroCore
Receives time from TimeEngine. Computes the physical state of the solar system. Returns a pure astronomical snapshot — schema v3.1.

Zero interpretive concepts. No houses. No aspects. No symbolic content.
The engine does not interpret the sky. It measures it.

### A.T.A.C.I.R. — optional interpretive layer
**A**rc-based **T**ransformation of **A**stronomical **C**oordinates for **I**nterpretive **R**esolution.

Optional layer for astrology and derived interpretations.

Architecturally separate from the astronomical core by design. Receives the snapshot. Appends derived computations under `result.atacir.*`. 
Never modifies the astronomical data.
Fully isolated by design

Available plugins: `houses` · `aspects` · `symmetries` · `lunar` · `cycles` · `resonances` · `panchanga` · `synastry` · `eclipses` · `directions`

A disabled plugin does not exist in the JSON.

---

## What it computes

| Computation | Algorithm | Declared precision |
|---|---|---|
| Planets Mercury–Neptune | VSOP87B (Bretagnon & Francou 1987) | < 1′ |
| Moon position | ELP/MPP02-LLR · 164L+105B+60R terms | < 10″ |
| Nutation | IAU 2000B · 77 luni-solar terms | < 1 mas |
| Obliquity | IAU 2006 (Capitaine et al.) | < 0.001° |
| Light-time correction | Iterative · C = 173.14 AU/day | — |
| Annual aberration | κ = 9.9365×10⁻⁵ rad | — |
| Lunar parallax | Full topocentric · WGS-84 | max ~57′ |
| Atmospheric refraction | Bennett (1982) · ISA atmosphere | ±0.1′ > 15° |
| ΔT | IERS table 500–2150 AD + Morrison-Stephenson | — |
| Sidereal time | GAST IAU 2006 | < 0.1″ |
| Lunar nodes | Meeus Ch.47 | — |

Every snapshot contains both geometric and apparent altitude.
Every field names its own coordinate frame.
Every algorithm is declared in `meta.frame`.

---

## Quick start

### Option A — Single file (recommended)

Download `dist/caelis-minimal.html`. Open with a local server:

```bash
python -m http.server 8080
# open http://localhost:8080/caelis-minimal.html
```
Open in browser. Done.
No installation. No dependencies. No build step.

### Option B — Node.js or bundler

```javascript
import { getSnapshot, getSnapshotAt, setObserver }
  from 'caelis-engine';

// Set observer — Santiago, Chile
setObserver(-33.45, -70.66);

// Current celestial state
const snapshot = getSnapshot();

console.log(snapshot.bodies.Sol.lon_ecl_geocentric_deg);  // ecliptic longitude
console.log(snapshot.bodies.Sol.alt_geometric_deg);       // geometric altitude
console.log(snapshot.bodies.Luna.dist_km);                // lunar distance
console.log(snapshot.meta.obliquity.true_deg);            // true obliquity
console.log(snapshot.meta.frame.planets);                 // algorithm declaration
```

### Option C — Any epoch, any location

```javascript
// J2000.0 from London — fully deterministic
const j2000 = getSnapshotAt(2451545.0, { lat_deg: 51.5, lon_deg: -0.1 });

// 1987-Apr-10 from Paris — Meeus Ch.25 reference epoch
const meeus = getSnapshotAt(2446895.5, { lat_deg: 48.8, lon_deg: 2.3 });
```

### Option D — A.T.A.C.I.R. Cloud

```javascript
import AtacirClient from 'caelis-engine/client';

const client   = new AtacirClient({ apiKey: 'your-key' });
const snapshot = getSnapshot();
const result   = await client.compute(snapshot, {
  plugins: ['houses', 'aspects', 'panchanga']
});

console.log(result.atacir.houses.asc);          // Ascendant
console.log(result.atacir.aspects.natales[0]);  // strongest natal aspect
console.log(result.atacir.panchanga.tithiName); // Vedic almanac
// result.atacir.signature — R1-R5 integrity certification
```

---

## Output schema v3.1

The schema is the contract. Stable, versioned, and guaranteed not to break between minor releases.

```json
{
  "schema_version": "3.1",
  "meta": {
    "jd_tt":       2461193.499437,
    "jd_utc":      2461193.498611,
    "utc":         "2026-06-01T23:58:00Z",
    "delta_t_sec": 71.35,
    "observer":    { "lat_deg": -33.45, "lon_deg": -70.66 },
    "frame": {
      "nutation":                "IAU 2000B (77 luni-solar terms, Mathews et al. 2002)",
      "obliquity":               "IAU 2006 (Capitaine et al. 2006)",
      "planets":                 "VSOP87B (Bretagnon & Francou 1987) + Meeus App.II",
      "moon":                    "ELP/MPP02-LLR (Chapront & Francou 2002) 164L+105B+60R",
      "above_horizon_criterion": "geometric (unrefracted)"
    },
    "sidereal":  { "gast_deg": 250.278, "lst_deg": 179.618 },
    "obliquity": { "mean_deg": 23.4358, "true_deg": 23.4383 },
    "nutation":  { "delta_psi_arcsec": 8.271, "delta_eps_arcsec": 8.816 }
  },
  "bodies": {
    "Sol": {
      "ra_deg":                 69.958,
      "dec_deg":                22.160,
      "lon_ecl_geocentric_deg": 71.498,
      "lat_ecl_geocentric_deg": -0.00011,
      "alt_geometric_deg":      -27.896,
      "alt_apparent_deg":       -27.896,
      "az_deg":                 279.309,
      "above_horizon":          false,
      "dist_au":                1.01404
    },
    "Luna": {
      "lon_ecl_geocentric_deg":  269.330,
      "lon_ecl_topocentric_deg": 270.082,
      "alt_geometric_deg":       14.381,
      "alt_apparent_deg":        18.212,
      "dist_km":                 388954
    }
  },
  "luna": {
    "phase_ratio":  0.894,
    "phase_deg":    160.98,
    "illumination": 0.972
  }
}
```

Full schema: [`docs/CAELIS_ENGINE_SPEC_v4_0.md`](docs/CAELIS_ENGINE_SPEC_v4_0.md)

---

## Why not a third-party API or Swiss Ephemeris?

|  | Third-party APIs | Swiss Ephemeris | **Caelis Engine** |
|---|:---:|:---:|:---:|
| Runs in browser | ✗ | ✗ | **✓** |
| No server required | ✗ | ✗ | **✓** |
| No API key or cost | ✗ | ✓ | **✓** |
| Declared precision per field | ✗ | partial | **✓** |
| Algorithm named in every output | ✗ | ✗ | **✓** |
| Single JS file · no install | ✗ | ✗ | **✓** |
| Offline capable | ✗ | ✓ | **✓** |
| Schema-stable versioned output | ✗ | ✗ | **✓** |
| Interpretive layer optional | N/A | N/A | **✓** |

Third-party APIs add latency, cost, and a dependency you don't control.
Swiss Ephemeris is the precision standard — but it requires a server, a C wrapper, and ephemeris files.

If you need deterministic, portable, auditable computation --> Caelis Engine it's for you.

Caelis Engine runs where neither can: directly in the browser, in edge functions, in React Native, in any JavaScript environment. Offline. Deterministically.

---

## Validation

```bash
node validation/run.js
# 28 assertions · 5 epochs · 0 failures
```

| Epoch | Source | Assertions |
|---|---|---|
| J2000.0 — 2000-Jan-01 12:00 TT | IAU SOFA + VSOP87 paper | 6 |
| 1987-Apr-10 (Meeus Ch.25) | Meeus *Astronomical Algorithms* 2nd ed. | 4 |
| 1992-Apr-12 (Meeus Ch.33 Venus) | VSOP87 verification table | 1 |
| 2026-Jun-01 regression baseline | Caelis v4.0 canonical output | 8 |
| Schema v3.1 invariants | Architecture contract | 9 |

---

## Precision and limitations

Designed for portability, determinism and auditability — not sub-arcsecond astrometry.

| Source | Declared max error |
|---|---|
| VSOP87B (Uranus, Neptune) | < 1′ |
| ELP/MPP02 (Moon) | < 10″ |
| IAU 2000B nutation | < 1 mas |
| Refraction near horizon | 1–5′ |
| ΔT outside 500–2150 AD | variable |

For everything that needs to run in a browser, offline, and deterministically — this is it.

---

## A.T.A.C.I.R. Cloud

The interpretive optional layer managed API for interpretive computations.

Adds:
house systems · natal and transit aspects · ecliptic symmetries · primary directions · lunar apsides and cycles · orbital resonances · Vedic Panchanga · synastry · eclipse prediction · **Includes R1–R5 digital signature for output integrity.**

The R1-R5 Digital Signature is a cryptographic certification that the output was produced under the full Plugin Contract and has not been modified. Every result is auditable, traceable, and independently verifiable.

The computation logic is proprietary and server-side.
The client is open source: [`client/AtacirClient.js`](client/AtacirClient.js)

If this aligns with how you think infrastructure should behave, we should talk.

**Early access:** `hermeticalabs.dev@proton.me`

---

## License

Caelis Engine is released under **AGPL-3.0**.

Free to use in open source software under AGPL-3.0 terms.
**If you are building a commercial or proprietary product, you need a commercial license.**

Commercial licensing: `hermeticalabs.dev@proton.me`
Details: [`COMMERCIAL_LICENSE.md`](COMMERCIAL_LICENSE.md)

---

[![Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://hermeticalabs.github.io/caelis-engine/)
[![Caelis Engine — Validation Suite](https://github.com/HermeticaLabs/caelis-engine/actions/workflows/validate.yml/badge.svg)](https://github.com/HermeticaLabs/caelis-engine/actions/workflows/validate.yml)

---

## About

Caelis Engine was built by **Cristian Valeria Bravo** under **Hermetica Labs**.

Two principles guided every decision:

**Compute the sky, not interpret it.**
AstroCore measures physical state. A.T.A.C.I.R. derives geometric meaning — only when asked, only in its own namespace, never modifying the astronomical truth.

**Zero hidden assumptions.**
Every number is traceable. Every algorithm is declared. Every output is reproducible.

---

*Caelis Engine is not the product. It is what products are built on.*

---

*Caelis Engine v4.0 · Hermetica Labs · © 2024–2026 Cristian Valeria Bravo*
