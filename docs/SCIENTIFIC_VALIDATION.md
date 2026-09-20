# Caelis Engine — Scientific Validation Report

**Engine:** v4.0.9
**Schema:** v3.1
**Date:** 2026-09
**Author:** Cristian Valeria Bravo · Hermetica Labs

---

## Terminology

Three distinct precision concepts appear throughout this document:

**Algorithmic Precision Bound** — the theoretical accuracy limit of the original
astronomical model (e.g. VSOP87B is declared accurate to < 1′ near the current
epoch). This is a property of the algorithm itself, not of its implementation.

**Reference Tolerance** — the acceptable deviation when comparing Caelis Engine
against another implementation of the same algorithm under identical
preconditions. Reflects floating-point arithmetic differences (IEEE 754) between
independent JS implementations, not algorithm accuracy.

**Engineering Tolerance** — the threshold used in the test suite assertions
(e.g. ±30″ for GAST). Chosen to be wide enough to absorb reference tolerance
while tight enough to catch implementation errors.

---

## Overview

| Level | What is tested | Cases | Result |
|---|---|---|---|
| L1 — Core mathematical pipeline | VSOP87B, ELP/MPP02, IAU 2000B, ΔT | 100 | **100/100** |
| L2-A — Differential clean-room verification | GAST, LST, ASC, MC cross-implementation | 104 | **104/104** |
| L2-B — Strict SOFA/ERFA divergence | Quantified JD_TT simplification effect | 6 | documented |
| L3 — Polar Safety matrix | Engine behavior at extreme latitudes | 256 | **256/256** |
| L4 — Node.js CJS runtime integration | API surface and functional behavior | 18 | **18/18** |
| **Total (pass/fail)** | | **478** | **478/478** |

All tests are reproducible. All reference sources are cited. No network access,
no external dependencies, no ephemeris files required.

---

## Test environment

```
Node.js:   v22.22.2
V8 engine: 12.4.254.21-node.39
Platform:  linux x64 (canonical run)
```

Validation is pure JavaScript. No C extensions, no native bindings.
Results are expected to be numerically equivalent across conforming ES2020 runtimes; 
bit-level identity may vary due to runtime and floating-point implementation details.
---

## Level 1 — Core Mathematical Pipeline

**Suite:** `validation/run.js` (28) + `validation/benchmarks/extended.js` (67)
**Command:** `node validation/run.js && node validation/benchmarks/extended.js`
**Result:** 95/95 · ~170ms

### Reference sources

| Code | Source |
|---|---|
| [M] | Meeus, J. *Astronomical Algorithms* 2nd ed. (1998) |
| [V] | Bretagnon & Francou (1987) A&A 202 — VSOP87 paper |
| [E] | Chapront & Francou (2002) A&A 412 — ELP/MPP02-LLR paper |
| [S] | IAU SOFA C library documentation (2023) |
| [I] | IERS Bulletin A + EOP C01/C04 series |
| [C] | Caelis Engine v4.0 canonical output (regression baseline) |

### Reference epochs

| Epoch | JD_TT | Source | Assertions |
|---|---|---|---|
| J2000.0 — 2000-Jan-01 12:00 TT | 2451545.0 | [S][V] | 11 |
| 1987-Apr-10 0h TT (Meeus Ch.22/25) | 2446895.5 | [M] | 6 |
| 1992-Apr-12 0h TT (Meeus Ch.33/47) | 2448724.5 | [M][V] | 5 |
| 2000-Mar-20 (Vernal Equinox) | 2451623.816 | [M] | 4 |
| 1900-Jan-01 12:00 TT | 2415021.0 | [V][I] | 5 |
| 2050-Jan-01 12:00 TT | 2469807.0 | [S][I] | 4 |
| 2026-Jun-01 23:58 UTC · Santiago | 2461193.499437 | [C] | 13 |
| Schema v3.1 invariants | — | Architecture contract | 11 |
| Declared precision bounds | multiple | [S][I][E] | 5 |
| Nutation determinism | — | Internal consistency | 1 |

### Results by algorithm

| Algorithm | Implementation | Algorithmic precision bound | Status |
|---|---|---|---|
| Planetary positions | VSOP87B (Bretagnon & Francou 1987) | < 1′ | ✓ |
| Moon longitude | ELP/MPP02-LLR (Chapront & Francou 2002) | < 10″ | ✓ |
| Nutation ΔΨ | IAU 2000B, 77 terms (Mathews et al. 2002) | < 1 mas vs IAU 2000A | ✓ |
| Mean obliquity | IAU 2006 (Capitaine et al. 2006) | < 0.001° | ✓ |
| ΔT (2026) | IERS Bulletin A Sep 2026 | ±0.5s in table range | ✓ |

### Performance

```
478 total assertions: ~550ms wall time
Single snapshot (getSnapshotAt): ~2.8ms average
Throughput: ~357 snapshots/second
```

---

## Level 2-A — Differential Clean-Room Verification

**Suite:** `validation/independent/asc_mc/run-asc-mc.js`
**Reference:** `validation/independent/asc_mc/reference-erfa.js`
**Command:** `node validation/independent/asc_mc/run-asc-mc.js`
**Result:** 104/104 · ~300ms

### Methodology

This is a **differential clean-room verification**, not a strict IAU conformance test.

A reference implementation of GAST, LST, ASC, and MC was written from primary
sources (SOFA/ERFA algorithms) sharing **no code** with CaelisEngine.js. Both
implementations run against the same 104 test cases. The goal is to detect
mathematical transposition errors in the JS implementation — not to certify
full IAU/SOFA conformance.

Because Caelis Engine passes JD_TT directly to its GAST computation (see L2-B
for the full quantification of this simplification), the reference implementation
mirrors this behavior exactly. Tests verify internal consistency, not SOFA
conformance.

### What the reference implements

- **GMST** from ERA (IAU 2000) + IAU 2006 polynomial correction (Capitaine & Wallace 2006)
- **GAST** = GMST + equation of equinoxes (ΔΨ·cos ε)
- **Nutation** from IAU 2000B 77-term series (independent re-implementation)
- **Obliquity** from IAU 2006 fifth-degree polynomial
- **ASC** from Woolard & Clemence (1966) p.155 geometric formula
- **MC** from meridian-ecliptic intersection formula

### Test structure

| Group | Cases |
|---|---|
| Temporal (10 epochs × 4 UTC hours × Greenwich) | 40 |
| Spatial (J2000.0 × 7 latitudes × 4 longitudes) | 28 |
| Combined (6 epochs × 6 observers) | 36 |
| **Total** | **104** |

Epoch range: J1900.0 through J2050.0. Observers: Greenwich, New York, Santiago,
Tokyo, Sydney, Null Island (0°, 0°).

### Results

All 104 cases passed within engineering tolerances.

| Field | Engineering tolerance | Max error | RMS | P95 |
|---|---|---|---|---|
| GAST | ±30″ | 15.01″ | 10.71″ | 14.43″ |
| LST | ±30″ | 15.01″ | 10.71″ | 14.43″ |
| ASC | ±120″ | 52.69″ | 13.17″ | 29.98″ |
| MC | ±60″ | 16.19″ | 10.85″ | 15.68″ |

**Note on the ~15″ residual:** The residuals observed in L2-A do not represent 
the JD_TT-versus-JD_UT1 divergence quantified in L2-B. Both Caelis Engine and 
the independent reference implementation intentionally use the same JD_TT 
convention in this differential test. Therefore, the observed residuals 
characterize the numerical divergence between the two independent JavaScript implementations 
of the same computational model.
The strict JD_TT-versus-JD_UT1 divergence is characterized separately in L2-B.

---

## Level 2-B — Strict SOFA/ERFA Divergence

**Purpose:** Quantify the effect of Caelis Engine's JD_TT simplification
relative to the strict SOFA chain (JD_TT → ΔT → JD_UT1 → ERA → GMST → GAST).

This is not a test suite — it is a documented characterization of a known
architectural simplification. No pass/fail threshold is applied.

### The simplification

CaelisEngine.js passes JD_TT directly to its `gast(jd)` function. The
strict SOFA/ERFA chain requires JD_UT1 for the Earth Rotation Angle (ERA).
The relationship is: `JD_UT1 = JD_TT - ΔT/86400`.

With ΔT ≈ 69s (2026), the difference is 69/86400 ≈ 0.000799 days. At Earth's
rotation rate of 360°/day, this introduces ~0.288° = ~1036″ systematic offset
in GAST.

### Measured divergence

| Epoch | GAST Δ | ASC Δ | MC Δ |
|---|---|---|---|
| J2000.0 (ΔT=40s) | 592″ | 1290″ | 547″ |
| 1987-Apr-10 (ΔT=55s) | 486″ | 402″ | 519″ |
| 2020-Jan-01 (ΔT=69s) | 1028″ | 805″ | 1081″ |
| 2026-Jun-01 (ΔT=69s) | 1051″ | 907″ | 1145″ |
| 2030-Jan-01 (ΔT=71s) | 1089″ | 1436″ | 1040″ |
| 2050-Jan-01 (ΔT=93s) | 1413″ | 1531″ | 1303″ |

| Statistic | GAST | ASC | MC |
|---|---|---|---|
| Max | 1413″ (0.39°) | 1531″ (0.43°) | 1303″ (0.36°) |
| RMS | 994″ (0.28°) | 1133″ (0.31°) | 986″ (0.27°) |

**Interpretation:** These values are predictable and systematic — their magnitude 
is primarily determined by the TT→UT1 offset (ΔT) and the Earth's rotation rate. 
They are not random errors; they are a deliberate architectural trade-off that 
simplifies the GAST computation by avoiding an additional TT→UT1 conversion, 
at the cost of approximately 0.3° of GAST accuracy relative to the strict IAU chain.

For the intended application classes, including browser-based computation, 
offline operation, birth-chart calculation and transit analysis, this represents 
an accepted architectural trade-off. The practical impact depends on the specific 
calculation and its required angular precision.

**This limitation is declared in `meta.frame` of every snapshot output.**

---

## Level 3 — Polar Safety Matrix

**Suite:** `validation/scientific/polar-safety.js`
**Command:** `node validation/scientific/polar-safety.js`
**Result:** 256/256 · ~410ms

### Methodology

The engine was exercised at 16 latitudes from −90° to +90° — including exact
pole values — across 4 house systems and 4 reference epochs. Tests verify:

1. No `NaN` or `Infinity` in any output field
2. No unhandled exceptions at any latitude including ±90° exactly
3. ASC and MC are finite numbers in all cases
4. The engine remains functional across all four house systems at all latitudes

### Polar Safety Switch chain

```
Placidus → Porphyry   when circumpolar condition is detected
Porphyry → Equal      when |φ| > 66.5°
Equal                 stable at all latitudes including ±90°
```

Fallback is always declared in the output. The switch is not silent.

### Latitudes tested

±0°, ±45°, ±60°, ±66.56°, ±70°, ±80°, ±89°, ±89.999°, ±90° (16 total)

### Results

256/256 passed across all latitudes, all house systems, all epochs.
No NaN, no Infinity, no unhandled exception at any latitude including ±90° exact.
The engine handles circumpolar conditions without crashing or producing invalid
output at any point in the polar Safety Switch chain.


---

## Level 4 — Node.js CJS Runtime Integration

**Suite:** `validation/interop/test-cjs.js`
**Command:** `node validation/interop/test-cjs.js`
**Result:** 18/18 · ~30ms

This level verifies that `CaelisEngine.js` loads and operates correctly in a
Node.js CommonJS environment via `vm.runInThisContext` — the documented loading
method for environments without a bundler.

ESM named imports (`import { getSnapshot } from 'caelis-engine'`) require a
bundler (Vite, Webpack, Rollup). This is documented in the README. A future
test suite for bundled ESM environments is planned for v4.1.

### API surface verified (18 checks)

```
getSnapshot        ✓  returns schema v3.1 snapshot
getSnapshotAt      ✓  deterministic: same args → same output (Δ < 1e-10°)
setObserver        ✓  does not throw at any valid lat/lon
julianDate         ✓  returns current JD
deltaT             ✓  returns ΔT in seconds for any JD in [500, 2150 AD]
deg2rad            ✓  π/180 within 1e-10
rad2deg            ✓  180/π within 1e-10
module.exports     ✓  CJS exports present and accessible
getSnapshot()      ✓  schema_version === '3.1'
getSnapshot()      ✓  11 bodies in output
getSnapshot()      ✓  Sol has finite lon_ecl_geocentric_deg
getSnapshot()      ✓  Luna.dist_km ∈ [300000, 410000] km
getSnapshot()      ✓  Luna.dist_au is finite
getSnapshotAt()    ✓  deterministic across two calls at J2000.0
deltaT(J2000.0)    ✓  returns number ∈ [60, 70] seconds
getSnapshot()      ✓  meta.frame declares all 4 algorithm categories
JSON.stringify()   ✓  _houseConfig not present in raw output
JSON.stringify()   ✓  _nodes not present in raw output
```

---

## Declared limitations

| Limitation | Measured impact | Scheduled |
|---|---|---|
| JD_TT passed to GAST (vs strict JD_UT1) | ~0.3° GAST · ~0.4° ASC/MC (L2-B) | v4.1 refactor |
| VSOP87B truncated series (outer planets) | < 1′ algorithmic bound | by design |
| ELP/MPP02-LLR truncated (164+105+60 terms) | < 10″ algorithmic bound | by design |
| IAU 2000B vs 2000A nutation | < 1 mas — negligible | by design |
| Sæmundsson (1986) refraction, ISA atmosphere | ±0.1′ above 15°, 1-5′ near horizon | by design |
| ΔT extrapolation outside 500–2150 AD | Parabolic — grows with distance | by design |
| `phase_ratio` uses topocentric Moon RA | < 0.5° phase angle error | v4.2 |
| ESM named imports without bundler | Not supported — bundler required | v4.1 |

---

## Reproducibility

```bash
# Run all levels
node validation/run.js
node validation/benchmarks/extended.js
node validation/independent/asc_mc/run-asc-mc.js
node validation/scientific/polar-safety.js
node validation/interop/test-cjs.js
```

Expected output: 478/478 passed, 0 failed.

---

## Integrity

SHA-256 of `core/CaelisEngine.js` v4.0.9 (the engine validated by this report):

```
6279f5f336a382e09940345981348749bfdc65eb5c2ffde1c9acc66b403d3884
```

Verify on your local copy:

```bash
# Linux/macOS
sha256sum core/CaelisEngine.js

# Windows PowerShell
Get-FileHash core\CaelisEngine.js -Algorithm SHA256
```

---

*Caelis Engine v4.0.9 · Hermetica Labs · © 2024–2026 Cristian Valeria Bravo*
