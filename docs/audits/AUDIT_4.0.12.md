# Audit - Caelis Engine v4.0.12

Hermetica Labs . 2026-09
SPDX-License-Identifier: AGPL-3.0-or-later

Evidence log for the changes in CHANGELOG.md [4.0.12].
Every command below is reproducible against the tagged v4.0.12 commit.

---

## 1. _sunLonAtJDE() wall-clock dependency - confirmed and fixed

### 1.1 Root-cause confirmation (internal contradiction, no external source needed)

_sunLonAtJDE() read Date.now() directly instead of using the shared
frozen-clock mechanism (_frozenClockSec) introduced in 4.0.10 for
getSnapshot()/getSnapshotAt().

### 1.2 Measurement before the fix

Comparing _sunLonAtJDE(2451545.0) against a frozen-clock reference value,
under an advancing fake clock:

paso         1 ms  diferencia vs referencia: 1.139e-8 deg
paso      1000 ms  diferencia vs referencia: 1.180e-5 deg
paso      5000 ms  diferencia vs referencia: 5.899e-5 deg
paso  86400000 ms  diferencia vs referencia: 1.019e+0 deg

Difference grows proportionally with the clock step, confirming a genuine
wall-clock dependency (not floating-point noise).

### 1.3 Measurement after the fix

Same test, same script, after applying the shared-freeze mechanism:

paso         1 ms  diferencia vs referencia: 0.000e+0 deg
paso      1000 ms  diferencia vs referencia: 0.000e+0 deg
paso      5000 ms  diferencia vs referencia: 0.000e+0 deg
paso  86400000 ms  diferencia vs referencia: 0.000e+0 deg

### 1.4 Reproduce this yourself

    node validation/scientific/clock-stress.js

Result at v4.0.12: 18,000/18,000 consistent (0 mismatches) across
getSnapshot(), getSnapshotAt(), and _sunLonAtJDE(), under frozen,
ticking (1ms/read), and jumping (5000ms/read) clock conditions.

### 1.5 No change to astronomical output

    node validation/run.js
    node validation/benchmarks/extended.js

Both suites pass with identical values to pre-4.0.12, confirming the fix
changed only the clock-reading mechanism, not any solar longitude value.

---

## 2. Documentation corrections applied

| # | File | Before | After |
|---|---|---|---|
| A | MATEMATICA | Delta-T = TT - UTC | Delta-T = TT - UT1 |
| B | ARQUITECTURA | TT - UTC in seconds | TT - UT1 in seconds |
| C | MATEMATICA | 60 distance (R) | 29 distance (R) |
| D | SCIENTIFIC_VALIDATION | 164+105+60 terms | 164+105+29 terms |
| E | SPEC | delta_t_sec: 71.35 | delta_t_sec: 69.19 |
| F | ARQUITECTURA I-2 | pure functions, do not modify global state | deterministic; temporarily modifies and always restores shared state |
| G | CATALOGO | Pure function | Deterministic |
| H | CATALOGO | described pre-4.0.10 timeOffset mechanism | describes 4.0.10+ _frozenClockSec mechanism |
| I | ARQUITECTURA I-1 | AstroCore never calls Date.now() | precise description of where Date.now() is called and why no path re-reads it |

Delta-T = TT - UT1 matches the engines own code comments (core/CaelisEngine.js
lines 73, 99: Delta-T = TT - UT1 = (TAI + 32.184s) - (UTC + DUT1)).

69.19 matches the value already used as the regression baseline in
validation/run.js and stated in README.md; 71.35 was a stale value
that predated the 4.0.10 GAST/Delta-T documentation pass.

---

## 3. Findings confirmed, intentionally deferred

These were identified during this audit (partly from two independent
third-party reviews) and confirmed against the actual code, but are NOT
fixed in 4.0.12. Each requires either an external primary source or a
schema-level decision, and none affects any already-published assertion in
validation/run.js or validation/benchmarks/extended.js.

### 3.1 Historical Delta-T table (pre-1900) - needs external verification

deltaTTable in core/CaelisEngine.js has an internal inconsistency: its
own declared extrapolation formula (Delta-T = -20 + 32*((year-1820)/100)^2,
Morrison and Stephenson 2004), evaluated at year 500 (the tables own lower
bound), gives ~5557s, while the table itself declares 1570s for year 500 -
a ~3.5x discrepancy at the boundary where both should roughly agree.

    u = (500 - 1820) / 100 = -13.2
    Delta-T = -20 + 32 * 13.2^2 = 5556.8 s   (formula)
    Delta-T = 1570 s                          (table, same year)

This is a self-contradiction, verifiable without any external source. It
does NOT by itself confirm which value (if either) is astronomically
correct - that requires comparing the table against a primary source
(Morrison and Stephenson 2004, Stephenson et al. 1997, or Espenak/NASA polynomials).
No test in validation/ currently covers Delta-T before 1987. Scheduled for a
dedicated release once the reference comparison is done.

### 3.2 delta_t_sec precision mismatch between APIs

getSnapshot() (core/CaelisEngine.js, meta.delta_t_sec: +dT_sec.toFixed(2))
rounds to 2 decimals; _getSnapshotFromJD() (used by getSnapshotAt())
assigns the raw float. Same physical quantity, different serialized
precision depending on which API produced the snapshot. Does not affect any
calculation; affects byte-for-byte JSON comparability between the two APIs.
Fix requires deciding which precision is canonical for the schema v3.1
contract, deferred to avoid a mid-cycle contract change.

### 3.3 GAST validation tolerance wider than declared precision

validation/run.js validates meta.sidereal.gast_deg at J2000.0 against an
external reference (Meeus Ch.12) with a tolerance of +-0.05 degrees (180 arcsec),
while the engines own declared GAST precision (per
docs/SCIENTIFIC_VALIDATION.md) is ~15 arcsec RMS. The tolerance does not
currently demonstrate the precision the project claims elsewhere. Tightening
it is deferred pending a review of the full L2-A/L2-B independent
validation tolerances together, rather than adjusting GAST in isolation.

---

## 4. Full reproduction checklist

    git checkout v4.0.12
    node validation/run.js                              # 38/38
    node validation/benchmarks/extended.js              # 67/67
    node validation/scientific/polar-safety.js          # 256/256
    node validation/independent/asc_mc/run-asc-mc.js    # 104/104
    node validation/interop/test-cjs.js                 # 18/18
    node validation/scientific/clock-stress.js          # 18,000/18,000 consistent

Total: 483/483 assertions passing, plus 18,000/18,000 clock-stress
consistency checks.
