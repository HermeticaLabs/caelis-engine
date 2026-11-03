/**
 * ============================================================================
 * CAELIS ENGINE v4.0 - Validation Suite
 * Mathematical Pipeline Verification (Node.js runner)
 * ============================================================================
 *
 * Copyright (c) 2024-2026 Cristian Valeria Bravo
 * Hermetica Labs - Santiago, Chile
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Reference sources:
 *   [M] Meeus, J. "Astronomical Algorithms" 2nd ed. (1998)
 *   [V] Bretagnon & Francou (1987) - VSOP87 verification table
 *   [E] Chapront & Francou (2002) - ELP/MPP02-LLR paper
 *   [S] IAU SOFA C library documentation
 *   [I] IERS Bulletin C / Conventions 2003
 *   [C] Caelis Engine v4.0 canonical output (regression baseline)
 *   [R] ERFA/SOFA (pyerfa 2.0.1.5): official IAU implementation; see
 *       validation/independent/erfa_golden_vectors.json
 *   [P] NASA, Espenak & Meeus (eclipse.gsfc.nasa.gov/SEcat5): ΔT polynomials, Tables 1-3,
 *       "Uncertainty in ΔT"
 *   [U] USNO Earth Orientation (maia.usno.navy.mil/ser7): observed and predicted ΔT;
 *       validation/independent/usno_deltat.json
 * ============================================================================
 */

/**
 * Caelis Engine — Validation Runner (Node.js)
 * Hermetica Labs · © 2024–2026 Cristian Valeria Bravo
 *
 * Runs the validation suite headlessly against CaelisEngine.js.
 * Usage:
 *   node validation/run.js
 *   node validation/run.js --verbose
 *   node validation/run.js --epoch j2000
 *
 * Exit codes:
 *   0 = all tests pass
 *   1 = one or more tests failed
 *   2 = engine load error
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── CLI args ──────────────────────────────────────────────────────────
const args    = process.argv.slice(2);
const VERBOSE = args.includes('--verbose') || args.includes('-v');
const ONLY    = (args.find(a => a.startsWith('--epoch=')) || '').replace('--epoch=', '') || null;

// ── Colors ────────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  pass:   '\x1b[32m',   // green
  fail:   '\x1b[31m',   // red
  warn:   '\x1b[33m',   // yellow
  dim:    '\x1b[2m',
  purple: '\x1b[35m',
  bold:   '\x1b[1m',
};
const p = (color, str) => `${color}${str}${C.reset}`;

// ── Load engine into Node scope ───────────────────────────────────────
const ENGINE_PATH = path.resolve(__dirname, '../core/CaelisEngine.js');

if (!fs.existsSync(ENGINE_PATH)) {
  console.error(p(C.fail, `Engine not found: ${ENGINE_PATH}`));
  console.error('Run from caelis-engine/ root or adjust ENGINE_PATH.');
  process.exit(2);
}

// Node.js doesn't have window/document — define minimal stubs
global.window    = global;
global.document  = { getElementById: () => null };

const vm = require('vm');

try {
  // Load engine into this context — declares globals (getSnapshot, setObserver, etc.)
  // vm.runInThisContext is required over eval() to properly expose function declarations
  const code = fs.readFileSync(ENGINE_PATH, 'utf8');
  vm.runInThisContext(code);
} catch (e) {
  console.error(p(C.fail, `Engine load error: ${e.message}`));
  if (VERBOSE) console.error(e.stack);
  process.exit(2);
}

// ── Reference data ────────────────────────────────────────────────────
// Sources:
//   [M] Meeus, J. "Astronomical Algorithms" 2nd ed. (1998)
//   [V] VSOP87 verification table (Bretagnon & Francou 1987)
//   [E] ELP/MPP02-LLR paper (Chapront & Francou 2002)
//   [S] IAU SOFA C library documentation
//   [I] IERS Bulletin C / Conventions 2003
//   [C] Caelis Engine v4.0 canonical output (regression baseline)
//   [R] ERFA/SOFA (pyerfa 2.0.1.5): official IAU implementation (golden vectors)
//   [P] NASA, Espenak & Meeus: ΔT polynomials, Tables 1-3 and "Uncertainty in ΔT"
//   [U] USNO Earth Orientation: observed and predicted ΔT (usno_deltat.json)

const EPOCHS = [
  {
    id:    'j2000',
    label: 'J2000.0 (Meeus + VSOP87)',
    jd_tt: 2451545.0,
    lat:   51.5,
    lon:   -0.1,
    tests: [
      { field: 'meta.obliquity.true_deg',           expect: 23.437677, tol: 0.00001, label: 'True obliquity ε (IAU 2006 mean + IAU 2000B Δε at J2000)', src: '[R] ERFA obl06 + nut00b: 23.4376768°' },
      { field: 'meta.delta_t_sec',                  expect: 63.83,    tol: 0.5,    label: 'ΔT sec',               src: '[I] IERS 2000-Jan' },
      { field: 'meta.sidereal.gast_deg',             expect: 280.19039, tol: 0.00002, label: 'GAST at J2000.0 (v4.0.13: gast(jd_ut1, jd_tt))', src: '[R] ERFA gst06a at the engine UT1 (J2000.0 - 63.83 s) = 280.1903859°; Meeus Ch.12 gives 280.4566° at UT1 = J2000.0, and the difference is dT x sidereal rate = 0.26669°' },
      { field: 'bodies.Sol.lon_ecl_geocentric_deg',  expect: 280.378,  tol: 0.010,  label: 'Sol λ (VSOP87+aberr+nut IAU2000B)',  src: '[V] VSOP87 L_earth=100.464°+180+aberr+ΔΨ' },
      { field: 'bodies.Luna.lon_ecl_geocentric_deg', expect: 223.315,  tol: 0.500,  label: 'Luna λ (ELP/MPP02-LLR apparent)',    src: '[E] W1+perturbations+nutation; W1 mean=218.316°' },
      { field: 'bodies.Jupiter.lon_ecl_geocentric_deg', expect: 25.258, tol: 0.020, label: 'Jupiter λ (VSOP87B full)', src: '[V] VSOP87B; Meeus App.II abridged≈34.3°, full series da 25.3°' },
    ]
  },
  {
    id:    'meeus_ch25',
    label: 'Meeus Ch.25 (1987-Apr-10)',
    jd_tt: 2446895.5,
    lat:   48.8,
    lon:   2.3,
    tests: [
      { field: 'meta.obliquity.true_deg',           expect: 23.4436,  tol: 0.001,  label: 'True obliquity ε',    src: '[M] Ch.22 p.148' },
      { field: 'bodies.Sol.lon_ecl_geocentric_deg',  expect: 19.606,   tol: 0.020,  label: 'Sol λ (VSOP87B+nutación)',    src: '[V] VSOP87B; Meeus Ch.25 usa serie simplificada (201.8° con método distinto)' },
      { field: 'bodies.Luna.lon_ecl_geocentric_deg', expect: 150.270,  tol: 0.100,  label: 'Luna λ (ELP/MPP02-LLR, 1987)',  src: '[E] ELP/MPP02-LLR full; Meeus Ch.47 ELP truncado≈133.2°' },
      { field: 'meta.nutation.delta_psi_arcsec',     expect: -3.7809,  tol: 0.001,  label: 'ΔΨ arcsec (IAU 2000B)',  src: '[R] ERFA nut00b = -3.78089"; Meeus Ch.22 (IAU 1980 theory) gives -3.788"' },
    ]
  },
  {
    id:    'meeus_ch33',
    label: 'Meeus Ch.33 Venus (1992-Apr-12)',
    jd_tt: 2448724.5,
    lat:   48.8,
    lon:   2.3,
    tests: [
      { field: 'bodies.Venus.lon_ecl_geocentric_deg', expect: 5.787, tol: 0.020, label: 'Venus λ (VSOP87B full)', src: '[V] VSOP87B full; Meeus Ch.33 usa VSOP87 truncado' },
    ]
  },
  {
    id:    'epoch_2026',
    label: '2026 Regression Baseline (Santiago)',
    jd_tt: 2461193.499437,
    lat:   -33.45,
    lon:   -70.66,
    tests: [
      { field: 'meta.obliquity.true_deg',                expect: 23.437975, tol: 0.00001, label: 'True obliquity ε',   src: '[R] ERFA obl06 + nut00b = 23.4379748°' },
      { field: 'meta.sidereal.lst_deg',                  expect: 179.32872, tol: 0.00002, label: 'LST (v4.0.13: ERFA gst06a at the engine UT1 + longitude)', src: '[R] ERFA gst06a = 249.9887198° + lon -70.66° = 179.3287198°' },
      { field: 'meta.delta_t_sec',                       expect: 69.19,    tol: 0.5,    label: 'ΔT (IERS Bulletin A Sep 2026)',  src: '[I] TAI-UTC=37s, UT1-UTC=-0.001527s → ΔT=69.186s' },
      { field: 'bodies.Sol.lon_ecl_geocentric_deg',      expect: 71.498,   tol: 0.005,  label: 'Sol λ',               src: '[C]' },
      { field: 'bodies.Sol.alt_geometric_deg',           expect: -27.65872, tol: 0.001,  label: 'Sol alt geometric (v4.0.13: derived from corrected LST and nutation)',   src: '[C] v4.0.13 regression baseline' },
      { field: 'bodies.Luna.lon_ecl_geocentric_deg',     expect: 269.330,  tol: 0.020,  label: 'Luna λ geocentric',   src: '[C]' },
      { field: 'bodies.Luna.lon_ecl_topocentric_deg',    expect: 270.082,  tol: 0.050,  label: 'Luna λ topocentric',  src: '[C]' },
      { field: 'bodies.Jupiter.lon_ecl_geocentric_deg',  expect: 114.254,  tol: 0.005,  label: 'Jupiter λ',           src: '[C]' },
    ]
  },
  {
    id:    'refraction',
    label: 'Atmospheric Refraction (v4.0.8 regression)',
    jd_tt: 2461193.499437,
    lat:   -33.45,
    lon:   -70.66,
    tests: [
      { field: '__refraction_39_88', expect: 39.90018, tol: 0.0001, label: 'Refraction 39.88 deg geometric -> apparent (R in arcmin, R/60)', src: 'Saemundsson (1986): R = 1.02 cot(h + 10.3/(h+5.11)) = 1.2109 arcmin' },
      { field: 'bodies.Luna.alt_apparent_deg', expect: 14.2241, tol: 0.002, label: 'Luna alt apparent (v4.0.13: derived from corrected LST)', src: '[C] v4.0.13 regression baseline (LST/nutation corrected; refraction model unchanged since v4.0.8)' },
      { field: '__refraction_bounded', expect: true, tol: null, label: 'Refraction bounded: <4 arcmin above 15 deg, <=40 arcmin above 0 deg', src: 'Saemundsson (1986)' },
    ]
  },
  {
    id:    'getsnapshot_consistency',
    label: 'getSnapshot() internal time consistency (v4.0.10 regression)',
    jd_tt: null,
    lat:   -33.45,
    lon:   -70.66,
    tests: [
      { field: '__getSnapshot_timestamp_matches_jdutc', expect: true, tol: null, label: 'timestamp and jd_utc agree even if the wall clock jumps between internal reads', src: 'Invariant: a single getSnapshot() call must represent one instant' },
      { field: '__getSnapshot_utc_matches_timestamp',   expect: true, tol: null, label: 'utc (ISO string) and timestamp agree even if the wall clock jumps between internal reads', src: 'Invariant: a single getSnapshot() call must represent one instant' },
    ]
  },
  {
    id:    'getsnapshotat_determinism',
    label: 'getSnapshotAt() wall-clock independence (v4.0.10 regression)',
    jd_tt: 2451545.0,
    lat:   51.5,
    lon:   -0.1,
    tests: [
      { field: '__snapshotAt_clock_ticking', expect: true, tol: null, label: 'getSnapshotAt: identical output while the wall clock ticks 1ms per read', src: 'Invariant: same jd_tt + same observer = same snapshot' },
      { field: '__snapshotAt_clock_jump',    expect: true, tol: null, label: 'getSnapshotAt: identical output when the wall clock jumps 1 day between calls', src: 'Invariant: same jd_tt + same observer = same snapshot' },
    ]
  },
  {
    id:    'getsnapshot_jdtt_consistency',
    label: 'getSnapshot() jd_tt consistency (v4.0.10 regression)',
    jd_tt: null,
    lat:   -33.45,
    lon:   -70.66,
    tests: [
      { field: '__getSnapshot_jdtt_matches_jdutc', expect: true, tol: null, label: 'jd_tt and jd_utc derive from the same instant even if the wall clock jumps between internal reads', src: 'Invariant: a single getSnapshot() call must represent one instant' },
    ]
  },
  {
    id:    'sunlonatjde_determinism',
    label: '_sunLonAtJDE wall-clock independence (v4.0.12 regression)',
    jd_tt: null,
    lat:   -33.45,
    lon:   -70.66,
    tests: [
      { field: '__sunlon_clock_ticking', expect: true, tol: null, label: '_sunLonAtJDE: identical output while the wall clock ticks 1ms per read', src: 'Invariant: same jde argument = same solar longitude, independent of wall clock' },
      { field: '__sunlon_clock_jump',    expect: true, tol: null, label: '_sunLonAtJDE: identical output when the wall clock jumps 1 day between calls', src: 'Invariant: same jde argument = same solar longitude, independent of wall clock' },
    ]
  },
  {
    id:    'deltat_historical',
    label: 'Historical Delta-T vs Espenak-Meeus (v4.0.13 regression)',
    jd_tt: null,
    lat:   -33.45,
    lon:   -70.66,
    tests: [
      { field: '__deltaT_year_500',  expect: 5710.13, tol: 0.1, label: 'deltaT(year 500) = Espenak-Meeus polynomial (500-1600 segment, u = -5)', src: '[P] NASA polynomial: eclipse.gsfc.nasa.gov/SEcat5/deltatpoly.html' },
      { field: '__deltaT_year_1000', expect: 1574.20, tol: 0.1, label: 'deltaT(year 1000): segment constant term only (u = 0)', src: '[P] NASA polynomial; coefficients are exercised by the mid-segment tests below' },
      { field: '__deltaT_year_1600', expect: 120.00,  tol: 0.1, label: 'deltaT(year 1600): segment constant term only (t = 0)', src: '[P] NASA polynomial; coefficients are exercised by the mid-segment tests below' },
      { field: '__deltaT_year_1700', expect: 8.83,    tol: 0.1, label: 'deltaT(year 1700): segment constant term only (t = 0)', src: '[P] NASA polynomial; coefficients are exercised by the mid-segment tests below' },
      { field: '__deltaT_year_1850', expect: 7.11,    tol: 0.5, label: 'deltaT(year 1850) = Espenak-Meeus polynomial (1800-1860 segment)', src: '[P] NASA polynomial; NASA Table 1 gives 7 ± 1 s' },
    ]
  },
  {
    id:    'deltat_uncertainty',
    label: 'Delta-T uncertainty model (v4.0.13)',
    jd_tt: null,
    lat:   -33.45,
    lon:   -70.66,
    tests: [
      { field: '__deltaT_sigma_year_0',    expect: 265.0,  tol: 1.0,  label: 'uncertainty at year 0 matches Morrison-Stephenson', src: 'NASA Table 1' },
      { field: '__deltaT_sigma_year_1800', expect: 1.0,    tol: 0.01, label: 'uncertainty at year 1800 matches Stephenson-Houlden', src: 'NASA Table 2' },
      { field: '__deltaT_sigma_year_m2000',expect: 3732.1, tol: 1.0,  label: 'uncertainty at year -2000 matches Huber (2000)', src: 'NASA Table 3' },
    ]
  },
  {
    id:    'deltat_nasa_table1',
    label: 'ΔT vs NASA Table 1 (Morrison & Stephenson 2004), tolerance = published standard error',
    jd_tt: null,
    lat:   -33.45,
    lon:   -70.66,
    tests: [
      { field: '__dt@-500',                       expect: 17190, tol: 430, label: 'ΔT at year -500 within the published standard error (±430 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 17190 s' },
      { field: '__dt@-400',                       expect: 15530, tol: 390, label: 'ΔT at year -400 within the published standard error (±390 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 15530 s' },
      { field: '__dt@-300',                       expect: 14080, tol: 360, label: 'ΔT at year -300 within the published standard error (±360 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 14080 s' },
      { field: '__dt@-200',                       expect: 12790, tol: 330, label: 'ΔT at year -200 within the published standard error (±330 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 12790 s' },
      { field: '__dt@-100',                       expect: 11640, tol: 290, label: 'ΔT at year -100 within the published standard error (±290 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 11640 s' },
      { field: '__dt@0',                          expect: 10580, tol: 260, label: 'ΔT at year 0 within the published standard error (±260 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 10580 s' },
      { field: '__dt@100',                        expect: 9600, tol: 240, label: 'ΔT at year 100 within the published standard error (±240 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 9600 s' },
      { field: '__dt@200',                        expect: 8640, tol: 210, label: 'ΔT at year 200 within the published standard error (±210 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 8640 s' },
      { field: '__dt@300',                        expect: 7680, tol: 180, label: 'ΔT at year 300 within the published standard error (±180 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 7680 s' },
      { field: '__dt@400',                        expect: 6700, tol: 160, label: 'ΔT at year 400 within the published standard error (±160 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 6700 s' },
      { field: '__dt@500',                        expect: 5710, tol: 140, label: 'ΔT at year 500 within the published standard error (±140 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 5710 s' },
      { field: '__dt@600',                        expect: 4740, tol: 120, label: 'ΔT at year 600 within the published standard error (±120 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 4740 s' },
      { field: '__dt@700',                        expect: 3810, tol: 100, label: 'ΔT at year 700 within the published standard error (±100 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 3810 s' },
      { field: '__dt@800',                        expect: 2960, tol: 80, label: 'ΔT at year 800 within the published standard error (±80 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 2960 s' },
      { field: '__dt@900',                        expect: 2200, tol: 70, label: 'ΔT at year 900 within the published standard error (±70 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 2200 s' },
      { field: '__dt@1000',                       expect: 1570, tol: 55, label: 'ΔT at year 1000 within the published standard error (±55 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 1570 s' },
      { field: '__dt@1100',                       expect: 1090, tol: 40, label: 'ΔT at year 1100 within the published standard error (±40 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 1090 s' },
      { field: '__dt@1200',                       expect: 740, tol: 30, label: 'ΔT at year 1200 within the published standard error (±30 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 740 s' },
      { field: '__dt@1300',                       expect: 490, tol: 20, label: 'ΔT at year 1300 within the published standard error (±20 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 490 s' },
      { field: '__dt@1400',                       expect: 320, tol: 20, label: 'ΔT at year 1400 within the published standard error (±20 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 320 s' },
      { field: '__dt@1500',                       expect: 200, tol: 20, label: 'ΔT at year 1500 within the published standard error (±20 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 200 s' },
      { field: '__dt@1600',                       expect: 120, tol: 20, label: 'ΔT at year 1600 within the published standard error (±20 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 120 s' },
      { field: '__dt@1700',                       expect: 9, tol: 5, label: 'ΔT at year 1700 within the published standard error (±5 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 9 s' },
      { field: '__dt@1750',                       expect: 13, tol: 2, label: 'ΔT at year 1750 within the published standard error (±2 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 13 s' },
      { field: '__dt@1800',                       expect: 14, tol: 1, label: 'ΔT at year 1800 within the published standard error (±1 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 14 s' },
      { field: '__dt@1850',                       expect: 7, tol: 1, label: 'ΔT at year 1850 within the published standard error (±1 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 7 s' },
      { field: '__dt@1900',                       expect: -3, tol: 1, label: 'ΔT at year 1900 within the published standard error (±1 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): -3 s' },
      { field: '__dt@1950',                       expect: 29, tol: 0.1, label: 'ΔT at year 1950 within the published standard error (±0.1 s)', src: '[P] NASA Table 1 (Morrison & Stephenson 2004): 29 s' },
    ]
  },
  {
    id:    'deltat_nasa_table2',
    label: 'ΔT vs NASA Table 2 (observed 1955-2005): Espenak-Meeus polynomial before 1973, USNO annual nodes after',
    jd_tt: null,
    lat:   -33.45,
    lon:   -70.66,
    tests: [
      { field: '__dt@1955',                       expect: 31.1, tol: 0.15, label: 'ΔT at year 1955 agrees with the observed value (E&M polynomial before 1973, USNO table after)', src: '[P] NASA Table 2 (Astronomical Almanac 2006, p. K9): 31.1 s; tolerance 0.15 (fit error of the polynomial) s' },
      { field: '__dt@1960',                       expect: 33.2, tol: 0.15, label: 'ΔT at year 1960 agrees with the observed value (E&M polynomial before 1973, USNO table after)', src: '[P] NASA Table 2 (Astronomical Almanac 2006, p. K9): 33.2 s; tolerance 0.15 (fit error of the polynomial) s' },
      { field: '__dt@1965',                       expect: 35.7, tol: 0.15, label: 'ΔT at year 1965 agrees with the observed value (E&M polynomial before 1973, USNO table after)', src: '[P] NASA Table 2 (Astronomical Almanac 2006, p. K9): 35.7 s; tolerance 0.15 (fit error of the polynomial) s' },
      { field: '__dt@1970',                       expect: 40.2, tol: 0.15, label: 'ΔT at year 1970 agrees with the observed value (E&M polynomial before 1973, USNO table after)', src: '[P] NASA Table 2 (Astronomical Almanac 2006, p. K9): 40.2 s; tolerance 0.15 (fit error of the polynomial) s' },
      { field: '__dt@1975',                       expect: 45.5, tol: 0.05, label: 'ΔT at year 1975 agrees with the observed value (E&M polynomial before 1973, USNO table after)', src: '[P] NASA Table 2 (Astronomical Almanac 2006, p. K9): 45.5 s; tolerance 0.05 s' },
      { field: '__dt@1980',                       expect: 50.5, tol: 0.05, label: 'ΔT at year 1980 agrees with the observed value (E&M polynomial before 1973, USNO table after)', src: '[P] NASA Table 2 (Astronomical Almanac 2006, p. K9): 50.5 s; tolerance 0.05 s' },
      { field: '__dt@1985',                       expect: 54.3, tol: 0.05, label: 'ΔT at year 1985 agrees with the observed value (E&M polynomial before 1973, USNO table after)', src: '[P] NASA Table 2 (Astronomical Almanac 2006, p. K9): 54.3 s; tolerance 0.05 s' },
      { field: '__dt@1990',                       expect: 56.9, tol: 0.05, label: 'ΔT at year 1990 agrees with the observed value (E&M polynomial before 1973, USNO table after)', src: '[P] NASA Table 2 (Astronomical Almanac 2006, p. K9): 56.9 s; tolerance 0.05 s' },
      { field: '__dt@1995',                       expect: 60.8, tol: 0.05, label: 'ΔT at year 1995 agrees with the observed value (E&M polynomial before 1973, USNO table after)', src: '[P] NASA Table 2 (Astronomical Almanac 2006, p. K9): 60.8 s; tolerance 0.05 s' },
      { field: '__dt@2000',                       expect: 63.8, tol: 0.05, label: 'ΔT at year 2000 agrees with the observed value (E&M polynomial before 1973, USNO table after)', src: '[P] NASA Table 2 (Astronomical Almanac 2006, p. K9): 63.8 s; tolerance 0.05 s' },
      { field: '__dt@2005',                       expect: 64.7, tol: 0.05, label: 'ΔT at year 2005 agrees with the observed value (E&M polynomial before 1973, USNO table after)', src: '[P] NASA Table 2 (Astronomical Almanac 2006, p. K9): 64.7 s; tolerance 0.05 s' },
    ]
  },
  {
    id:    'deltat_polynomials',
    label: 'ΔT: every Espenak-Meeus segment, mid-segment values (independent evaluation of the NASA formulas)',
    jd_tt: null,
    lat:   -33.45,
    lon:   -70.66,
    tests: [
      { field: '__dt@-1999',                      expect: 46651.2352, tol: 1e-05, label: 'ΔT at year -1999 = Espenak-Meeus polynomial (parabola (y < -500))', src: '[P] NASA polynomial, evaluated independently (v4.0.13 audit)' },
      { field: '__dt@-1000',                      expect: 25427.68, tol: 1e-05, label: 'ΔT at year -1000 = Espenak-Meeus polynomial (parabola (y < -500))', src: '[P] NASA polynomial, evaluated independently (v4.0.13 audit)' },
      { field: '__dt@-300',                       expect: 14078.211706, tol: 1e-05, label: 'ΔT at year -300 = Espenak-Meeus polynomial (-500..500, u = -3)', src: '[P] NASA polynomial, evaluated independently (v4.0.13 audit)' },
      { field: '__dt@250',                        expect: 8163.063848, tol: 1e-05, label: 'ΔT at year 250 = Espenak-Meeus polynomial (-500..500, u = 2.5)', src: '[P] NASA polynomial, evaluated independently (v4.0.13 audit)' },
      { field: '__dt@800',                        expect: 2955.691584, tol: 1e-05, label: 'ΔT at year 800 = Espenak-Meeus polynomial (500..1600, u = -2)', src: '[P] NASA polynomial, evaluated independently (v4.0.13 audit)' },
      { field: '__dt@1300',                       expect: 491.903528, tol: 1e-05, label: 'ΔT at year 1300 = Espenak-Meeus polynomial (500..1600, u = 3)', src: '[P] NASA polynomial, evaluated independently (v4.0.13 audit)' },
      { field: '__dt@1650',                       expect: 50.194016, tol: 1e-05, label: 'ΔT at year 1650 = Espenak-Meeus polynomial (1600..1700, t = 50)', src: '[P] NASA polynomial, evaluated independently (v4.0.13 audit)' },
      { field: '__dt@1750',                       expect: 13.37007, tol: 1e-05, label: 'ΔT at year 1750 = Espenak-Meeus polynomial (1700..1800, t = 50)', src: '[P] NASA polynomial, evaluated independently (v4.0.13 audit)' },
      { field: '__dt@1830',                       expect: 7.67338, tol: 1e-05, label: 'ΔT at year 1830 = Espenak-Meeus polynomial (1800..1860, t = 30)', src: '[P] NASA polynomial, evaluated independently (v4.0.13 audit)' },
      { field: '__dt@1880',                       expect: -5.008487, tol: 1e-05, label: 'ΔT at year 1880 = Espenak-Meeus polynomial (1860..1900, t = 20)', src: '[P] NASA polynomial, evaluated independently (v4.0.13 audit)' },
      { field: '__dt@1910',                       expect: 10.3884, tol: 1e-05, label: 'ΔT at year 1910 = Espenak-Meeus polynomial (1900..1920, t = 10)', src: '[P] NASA polynomial, evaluated independently (v4.0.13 audit)' },
      { field: '__dt@1930',                       expect: 24.1329, tol: 1e-05, label: 'ΔT at year 1930 = Espenak-Meeus polynomial (1920..1941, t = 10)', src: '[P] NASA polynomial, evaluated independently (v4.0.13 audit)' },
      { field: '__dt@1955',                       expect: 31.046781, tol: 1e-05, label: 'ΔT at year 1955 = Espenak-Meeus polynomial (1941..1961, t = 5)', src: '[P] NASA polynomial, evaluated independently (v4.0.13 audit)' },
      { field: '__dt@1968',                       expect: 38.270254, tol: 1e-05, label: 'ΔT at year 1968 = Espenak-Meeus polynomial (1961..1986, t = -7)', src: '[P] NASA polynomial, evaluated independently (v4.0.13 audit)' },
    ]
  },
  {
    id:    'deltat_joins',
    label: 'ΔT: discontinuities at the polynomial joins (declared) and continuity at 2150',
    jd_tt: null,
    lat:   -33.45,
    lon:   -70.66,
    tests: [
      { field: '__dtjump@-500',                   expect: 0, tol: 0.3, label: 'ΔT discontinuity at the join at year -500 is <= 0.30 s', src: '[C] declared in docs/audits/AUDIT_4.0.13.md (largest measured: 0.251 s at 1600)' },
      { field: '__dtjump@500',                    expect: 0, tol: 0.3, label: 'ΔT discontinuity at the join at year 500 is <= 0.30 s', src: '[C] declared in docs/audits/AUDIT_4.0.13.md (largest measured: 0.251 s at 1600)' },
      { field: '__dtjump@1600',                   expect: 0, tol: 0.3, label: 'ΔT discontinuity at the join at year 1600 is <= 0.30 s', src: '[C] declared in docs/audits/AUDIT_4.0.13.md (largest measured: 0.251 s at 1600)' },
      { field: '__dtjump@1700',                   expect: 0, tol: 0.3, label: 'ΔT discontinuity at the join at year 1700 is <= 0.30 s', src: '[C] declared in docs/audits/AUDIT_4.0.13.md (largest measured: 0.251 s at 1600)' },
      { field: '__dtjump@1800',                   expect: 0, tol: 0.3, label: 'ΔT discontinuity at the join at year 1800 is <= 0.30 s', src: '[C] declared in docs/audits/AUDIT_4.0.13.md (largest measured: 0.251 s at 1600)' },
      { field: '__dtjump@1860',                   expect: 0, tol: 0.3, label: 'ΔT discontinuity at the join at year 1860 is <= 0.30 s', src: '[C] declared in docs/audits/AUDIT_4.0.13.md (largest measured: 0.251 s at 1600)' },
      { field: '__dtjump@1900',                   expect: 0, tol: 0.3, label: 'ΔT discontinuity at the join at year 1900 is <= 0.30 s', src: '[C] declared in docs/audits/AUDIT_4.0.13.md (largest measured: 0.251 s at 1600)' },
      { field: '__dtjump@1920',                   expect: 0, tol: 0.3, label: 'ΔT discontinuity at the join at year 1920 is <= 0.30 s', src: '[C] declared in docs/audits/AUDIT_4.0.13.md (largest measured: 0.251 s at 1600)' },
      { field: '__dtjump@1941',                   expect: 0, tol: 0.3, label: 'ΔT discontinuity at the join at year 1941 is <= 0.30 s', src: '[C] declared in docs/audits/AUDIT_4.0.13.md (largest measured: 0.251 s at 1600)' },
      { field: '__dtjump@1961',                   expect: 0, tol: 0.3, label: 'ΔT discontinuity at the join at year 1961 is <= 0.30 s', src: '[C] declared in docs/audits/AUDIT_4.0.13.md (largest measured: 0.251 s at 1600)' },
      { field: '__dtjump@1973',                   expect: 0, tol: 0.3, label: 'ΔT discontinuity at the join at year 1973 is <= 0.30 s', src: '[C] declared in docs/audits/AUDIT_4.0.13.md (largest measured: 0.251 s at 1600)' },
      { field: '__dtjump@2150',                   expect: 0, tol: 0.01, label: 'ΔT is continuous at 2150: the parabola is anchored to the end of the table', src: '[C] v4.0.13 (_DT_TAIL_OFFSET); before, ΔT jumped 90.48 s here' },
    ]
  },
  {
    id:    'deltat_uncertainty_nasa',
    label: 'ΔT uncertainty model vs NASA "Uncertainty in ΔT" and declared behaviour',
    jd_tt: null,
    lat:   -33.45,
    lon:   -70.66,
    tests: [
      { field: '__sigma@-1000',                   expect: 636, tol: 1.0, label: 'σ(ΔT) at year -1000 matches Morrison-Stephenson', src: '[P] NASA "Uncertainty in ΔT", Table 1: 636 s' },
      { field: '__sigma@-500',                    expect: 431, tol: 1.0, label: 'σ(ΔT) at year -500 matches Morrison-Stephenson', src: '[P] NASA "Uncertainty in ΔT", Table 1: 431 s' },
      { field: '__sigma@0',                       expect: 265, tol: 1.0, label: 'σ(ΔT) at year 0 matches Morrison-Stephenson', src: '[P] NASA "Uncertainty in ΔT", Table 1: 265 s' },
      { field: '__sigma@500',                     expect: 139, tol: 1.0, label: 'σ(ΔT) at year 500 matches Morrison-Stephenson', src: '[P] NASA "Uncertainty in ΔT", Table 1: 139 s' },
      { field: '__sigma@1000',                    expect: 54, tol: 1.0, label: 'σ(ΔT) at year 1000 matches Morrison-Stephenson', src: '[P] NASA "Uncertainty in ΔT", Table 1: 54 s' },
      { field: '__sigma@1200',                    expect: 31, tol: 1.0, label: 'σ(ΔT) at year 1200 matches Morrison-Stephenson', src: '[P] NASA "Uncertainty in ΔT", Table 1: 31 s' },
      { field: '__sigma@1300',                    expect: 20, tol: 0.01, label: 'σ(ΔT) at year 1300 is ≈20 s (decadal fluctuation)', src: '[P] NASA "Uncertainty in ΔT"' },
      { field: '__sigma@1450',                    expect: 20, tol: 0.01, label: 'σ(ΔT) at year 1450 is ≈20 s (decadal fluctuation)', src: '[P] NASA "Uncertainty in ΔT"' },
      { field: '__sigma@1600',                    expect: 20, tol: 0.01, label: 'σ(ΔT) at year 1600 is ≈20 s (decadal fluctuation)', src: '[P] NASA "Uncertainty in ΔT"' },
      { field: '__sigma@1700',                    expect: 5, tol: 0.01, label: 'σ(ΔT) at year 1700 matches Stephenson-Houlden', src: '[P] NASA "Uncertainty in ΔT", Table 2: 5 s' },
      { field: '__sigma@1800',                    expect: 1, tol: 0.01, label: 'σ(ΔT) at year 1800 matches Stephenson-Houlden', src: '[P] NASA "Uncertainty in ΔT", Table 2: 1 s' },
      { field: '__sigma@1900',                    expect: 0.1, tol: 0.01, label: 'σ(ΔT) at year 1900 matches Stephenson-Houlden', src: '[P] NASA "Uncertainty in ΔT", Table 2: 0.1 s' },
      { field: '__sigma@-2000',                   expect: 3732, tol: 1.0, label: 'σ(ΔT) at year -2000 matches Huber (2000)', src: '[P] NASA "Uncertainty in ΔT", Table 3: 3732 s' },
      { field: '__sigma@-1500',                   expect: 1900, tol: 1.0, label: 'σ(ΔT) at year -1500 matches Huber (2000)', src: '[P] NASA "Uncertainty in ΔT", Table 3: 1900 s' },
      { field: '__sigma@2500',                    expect: 612, tol: 1.0, label: 'σ(ΔT) at year 2500 matches Huber (2000)', src: '[P] NASA "Uncertainty in ΔT", Table 3: 612 s' },
      { field: '__sigma@3000',                    expect: 1885, tol: 1.0, label: 'σ(ΔT) at year 3000 matches Huber (2000)', src: '[P] NASA "Uncertainty in ΔT", Table 3: 1885 s' },
      { field: '__sigma@2026',                    expect: 0.09, tol: 0.001, label: 'σ(ΔT) at 2026.0 is 0.09 s (measured max error of the table vs USNO monthly data)', src: '[C] measured 0.083 s over 645 months (validation/independent/usno_deltat.json); not a published sigma' },
      { field: '__sigma@2026.76',                 expect: 5.177, tol: 0.01, label: 'KNOWN (declared): σ(ΔT) steps to the Huber model right after the last observed date (2026.75)', src: '[C] declared discontinuity (docs/audits/AUDIT_4.0.13.md)' },
      { field: '__sigma@1950',                    expect: 0.1, tol: 0.001, label: 'σ(ΔT) at 1950 is 0.1 s (Stephenson-Houlden 1900 value held)', src: '[C] not a published sigma' },
      { field: '__sigma@2000',                    expect: 0.09, tol: 0.001, label: 'σ(ΔT) at 2000 is 0.09 s (USNO-observed range)', src: '[C] measured 0.083 s over 645 months' },
      { field: '__sigma@2026.75',                 expect: 0.09, tol: 0.001, label: 'σ(ΔT) at the last observed date (2026.75) is still 0.09 s', src: '[C] declared limit _DT_LAST_OBSERVED_YEAR = 2026.75' },
      { field: '__sigmamodel@-3000',              expect: 'huber-2000', tol: null, label: 'σ(ΔT) model at year -3000 is "huber-2000"', src: '[C] model structure documented in CaelisEngine.js (deltaTUncertainty)' },
      { field: '__sigmamodel@0',                  expect: 'morrison-stephenson-2004', tol: null, label: 'σ(ΔT) model at year 0 is "morrison-stephenson-2004"', src: '[C] model structure documented in CaelisEngine.js (deltaTUncertainty)' },
      { field: '__sigmamodel@1250',               expect: 'decade-fluctuation-bridge (approx.)', tol: null, label: 'σ(ΔT) model at year 1250 is "decade-fluctuation-bridge (approx.)"', src: '[C] model structure documented in CaelisEngine.js (deltaTUncertainty)' },
      { field: '__sigmamodel@1450',               expect: 'decade-fluctuation-estimate', tol: null, label: 'σ(ΔT) model at year 1450 is "decade-fluctuation-estimate"', src: '[C] model structure documented in CaelisEngine.js (deltaTUncertainty)' },
      { field: '__sigmamodel@1650',               expect: 'stephenson-houlden-bridge (approx.)', tol: null, label: 'σ(ΔT) model at year 1650 is "stephenson-houlden-bridge (approx.)"', src: '[C] model structure documented in CaelisEngine.js (deltaTUncertainty)' },
      { field: '__sigmamodel@1850',               expect: 'stephenson-houlden-1986', tol: null, label: 'σ(ΔT) model at year 1850 is "stephenson-houlden-1986"', src: '[C] model structure documented in CaelisEngine.js (deltaTUncertainty)' },
      { field: '__sigmamodel@1950',               expect: 'espenak-meeus-fit (Stephenson-Houlden 1900 value held; not a published sigma)', tol: null, label: 'σ(ΔT) model at year 1950 is "espenak-meeus-fit (Stephenson-Houlden 1900 value held; not a published sigma)"', src: '[C] model structure documented in CaelisEngine.js (deltaTUncertainty)' },
      { field: '__sigmamodel@2000',               expect: 'usno-observed (measured max error vs monthly data; not a published sigma)', tol: null, label: 'σ(ΔT) model at year 2000 is "usno-observed (measured max error vs monthly data; not a published sigma)"', src: '[C] model structure documented in CaelisEngine.js (deltaTUncertainty)' },
      { field: '__sigmamodel@2100',               expect: 'huber-2000', tol: null, label: 'σ(ΔT) model at year 2100 is "huber-2000"', src: '[C] model structure documented in CaelisEngine.js (deltaTUncertainty)' },
    ]
  },
  {
    id:    'time_scales_ut1',
    label: 'Time scales: jd_ut1, GAST and LST consistency (v4.0.13)',
    jd_tt: 2451545.0,
    lat:   -33.45,
    lon:   -70.66,
    tests: [
      { field: '__ts_ut1_equals_utc_days',        expect: 0, tol: 1e-9, label: 'meta.jd_ut1 equals meta.jd_utc (declared UT1≈UTC approximation), 10 epochs -400..2500', src: '[C] declared approximation; jd_ut1 carries no independent UT1 information' },
      { field: '__ts_ut1_from_tt_seconds',        expect: 0, tol: 0.001, label: 'meta.jd_ut1 = jd_tt - delta_t_sec/86400 (max error in seconds), 10 epochs', src: '[C] definition of UT1 in the engine' },
      { field: '__ts_gast_matches_ut1_arcsec',    expect: 0, tol: 0.01, label: 'meta.sidereal.gast_deg equals gast(meta.jd_ut1) (max error in arcsec), 10 epochs', src: '[C] limited by the 6-decimal rounding of the output' },
      { field: '__ts_lst_equals_gast_lon0_arcsec', expect: 0, tol: 0.01, label: 'LST = GAST at longitude 0 (max error in arcsec), epochs 1000..2500', src: '[C] ancient epochs differ by up to 0.12 arcsec (two ΔT evaluation instants); see AUDIT_4.0.13' },
      { field: '__ts_gast_bug_guard_deg',         expect: 0.266687, tol: 0.0001, label: 'gast(jd_tt) - gast(jd_ut1) at J2000.0 = ΔT x sidereal rate (guards against reintroducing the v4.0.12 defect)', src: '[A] analytic: 63.83 s x 360.98564736629 deg/day / 86400 = 0.266687 deg' },
    ]
  },
  {
    id:    'deltat_usno',
    label: 'ΔT vs USNO observed (1973-2026) and predicted (2027-2033.75) values',
    jd_tt: null,
    lat:   -33.45,
    lon:   -70.66,
    tests: [
      { field: '__usno_observed_count',           expect: 645, tol: 0, label: 'USNO monthly dataset loaded (1973-02 .. 2026-10)', src: 'validation/independent/usno_deltat.json' },
      { field: '__usno_observed_max_error_s',     expect: 0, tol: 0.09, label: 'ΔT vs USNO monthly observed values: max |error| in seconds (645 months)', src: '[U] USNO deltat.data; measured 0.083 s (in-sample at the January nodes: 0.006 s)' },
      { field: '__usno_observed_rms_error_s',     expect: 0, tol: 0.03, label: 'ΔT vs USNO monthly observed values: RMS error in seconds (645 months)', src: '[U] USNO deltat.data; measured 0.024 s' },
      { field: '__usno_nodes_max_error_s',        expect: 0, tol: 0.01, label: 'ΔT at the January nodes 1974-2026 equals the USNO value (transcription check)', src: '[U] USNO deltat.data; nodes are rounded to 0.01 s' },
      { field: '__usno_last_observation_error_s', expect: 0, tol: 0.01, label: 'ΔT at the last observation (2026-10-01) equals the USNO value', src: '[U] USNO deltat.data: 69.2065 s' },
      { field: '__usno_predictions_max_error_s',  expect: 0, tol: 0.05, label: 'ΔT vs USNO predictions 2027.00-2033.75 (28 quarterly values): max |error| in seconds', src: '[U] USNO deltat.preds; measured 0.040 s' },
    ]
  },
  {
    id:    'erfa_golden',
    label: 'Nutation, obliquity and GAST vs official ERFA/SOFA (golden vectors, v4.0.13)',
    jd_tt: 2451545.0,
    lat:   51.5,
    lon:   -0.1,
    tests: [
      { field: '__erfa_vectors_loaded',               expect: 50, tol: null, label: 'golden vectors loaded (50 epochs: -500..1500, 1700-2300, J2000, Meeus, SOFA)', src: 'validation/independent/erfa_golden_vectors.json' },
      { field: '__erfa_nut00b_dpsi_1950_2050_mas',    expect: 0, tol: 0.5, label: 'ΔΨ vs ERFA eraNut00b (IAU 2000B): max error in mas, 1950-2050', src: '[R] ERFA nut00b; engine uses IAU 2000A argument polynomials, measured 0.11 mas' },
      { field: '__erfa_nut00b_deps_1950_2050_mas',    expect: 0, tol: 0.5, label: 'Δε vs ERFA eraNut00b (IAU 2000B): max error in mas, 1950-2050', src: '[R] ERFA nut00b; measured 0.07 mas' },
      { field: '__erfa_nut00a_dpsi_1700_2300_mas',    expect: 0, tol: 3.0, label: 'ΔΨ vs ERFA eraNut00a (IAU 2000A): max error in mas, 1700-2300', src: '[R] ERFA nut00a; IAU 2000B truncation, measured 1.3 mas on these vectors (2.8 mas on a 1700-2500 grid)' },
      { field: '__erfa_nut00a_deps_1700_2300_mas',    expect: 0, tol: 1.5, label: 'Δε vs ERFA eraNut00a (IAU 2000A): max error in mas, 1700-2300', src: '[R] ERFA nut00a; measured 1.1 mas on these vectors (1.4 mas on a 1700-2500 grid)' },
      { field: '__erfa_meanobliquity_mas',            expect: 0, tol: 0.01, label: 'mean obliquity vs ERFA eraObl06 (IAU 2006): max error in mas, -500..2300', src: '[R] ERFA obl06' },
      { field: '__erfa_gast_1700_2300_mas',           expect: 0, tol: 10, label: 'gast(jd_ut1, jd_tt) vs ERFA eraGst06a: max error in mas, 1700-2300', src: '[R] ERFA gst06a; measured 3.5 mas' },
      { field: '__erfa_gast_ancient_mas',             expect: 0, tol: 6000, label: 'gast(jd_ut1, jd_tt) vs ERFA eraGst06a, -500..1500 (declared accuracy bound of the IAU 2006 GMST polynomial)', src: '[R] ERFA gst06a; measured 5.34 arcsec at -500, 1.09 at 0, 0.14 at 500, 0.009 at 1000; far below sigma(dT) there' },
      { field: '__erfa_gast_twoarg_gain_m500_mas',    expect: 44.6, tol: 5, label: 'Passing jd_tt to gast() reduces the error at -500 by about 45 mas (UT1/TT separation)', src: '[R] ERFA gst06a; error 5383 mas with one argument, 5339 mas with two' },
      { field: '__erfa_sofa_nut00b_dpsi_arcsec',      expect: -1.9868565, tol: 0.0005, label: 'ΔΨ at JD_TT 2453736.5 equals the SOFA t_nut00b test value (arcsec)', src: '[R] ERFA/SOFA t_erfa_c.c t_nut00b: -9.632552291148362783e-6 rad' },
      { field: '__erfa_sofa_nut00b_deps_arcsec',      expect: 8.3809456, tol: 0.0005, label: 'Δε at JD_TT 2453736.5 equals the SOFA t_nut00b test value (arcsec)', src: '[R] ERFA/SOFA t_erfa_c.c t_nut00b: 4.063197106621159367e-5 rad' },
    ]
  },
  {
    id:    'schema',
    label: 'Schema v3.1 Invariants',
    jd_tt: null, // current time
    lat:   -33.45,
    lon:   -70.66,
    tests: [
      { field: '__schema_version',             expect: '3.1', tol: null, label: 'schema_version === "3.1"' },
      { field: '__bodies_count',               expect: 11,    tol: null, label: '11 bodies in snapshot' },
      { field: '__no_house_on_bodies',         expect: true,  tol: null, label: 'No .house on any body (I-3)' },
      { field: '__no_root_houses',             expect: true,  tol: null, label: 'No .houses at root (I-3)' },
      { field: '__luna_topocentric',           expect: true,  tol: null, label: 'Luna has topocentric λ (I-6)' },
      { field: '__both_altitudes',             expect: true,  tol: null, label: 'All bodies: geometric+apparent (I-5)' },
      { field: '__frame_declared',             expect: true,  tol: null, label: 'meta.frame declares algorithms (I-4)' },
      { field: '__no_internal_in_json',        expect: true,  tol: null, label: 'No _ fields in JSON output' },
      { field: '__nutation_deterministic',  expect: true,  tol: null, label: 'Nutation determinism: identical output on repeat call' },
    ]
  },
];

// ── Field resolver ────────────────────────────────────────────────────
// ── ERFA golden vectors (v4.0.13) ──────────────────────────────────────
// validation/independent/erfa_golden_vectors.json holds values computed with the official
// ERFA/SOFA implementation (pyerfa) by validation/independent/generate_erfa_vectors.py.
// Each resolver returns the maximum absolute error of the engine over the selected vectors.
// dt_s (TT-UT1) of every vector is the Espenak & Meeus polynomial value (independent Python
// implementation), so the GAST vectors exercise a realistic separation of UT1 and TT.
const ERFA_FILE = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'independent/erfa_golden_vectors.json'), 'utf8'));
const ERFA_V    = ERFA_FILE.epochs;
const AS_PER_RAD = 180 / Math.PI * 3600;
function erfaGolden(field) {
  const JD_1700 = 2451545 + (1700 - 2000) * 365.25, JD_2300 = 2451545 + (2300 - 2000) * 365.25;
  const JD_1950 = 2433282.5, JD_2050 = 2469807.5;
  const sel = (a, b) => ERFA_V.filter(v => v.jd_tt >= a && v.jd_tt <= b);
  const T = v => (v.jd_tt - 2451545) / 36525;
  const maxAbs = (arr, f) => arr.reduce((m, v) => Math.max(m, Math.abs(f(v))), 0);
  const gastErr = (v, twoArg) => ((((twoArg ? gast(v.jd_ut1, v.jd_tt) : gast(v.jd_ut1)) - v.gst06a_deg + 540) % 360) - 180) * 3600 * 1000;
  switch (field) {
    case '__erfa_vectors_loaded':
      return ERFA_V.length;
    case '__erfa_nut00b_dpsi_1950_2050_mas':
      return maxAbs(sel(JD_1950, JD_2050), v => (nutation(T(v)).deltaPsi * AS_PER_RAD - v.nut00b_dpsi_arcsec) * 1000);
    case '__erfa_nut00b_deps_1950_2050_mas':
      return maxAbs(sel(JD_1950, JD_2050), v => (nutation(T(v)).deltaEps * AS_PER_RAD - v.nut00b_deps_arcsec) * 1000);
    case '__erfa_nut00a_dpsi_1700_2300_mas':
      return maxAbs(sel(JD_1700, JD_2300), v => (nutation(T(v)).deltaPsi * AS_PER_RAD - v.nut00a_dpsi_arcsec) * 1000);
    case '__erfa_nut00a_deps_1700_2300_mas':
      return maxAbs(sel(JD_1700, JD_2300), v => (nutation(T(v)).deltaEps * AS_PER_RAD - v.nut00a_deps_arcsec) * 1000);
    case '__erfa_meanobliquity_mas':
      return maxAbs(ERFA_V, v => (meanObliquity(T(v)) * 180 / Math.PI - v.obl06_deg) * 3600 * 1000);
    case '__erfa_gast_1700_2300_mas':
      return maxAbs(sel(JD_1700, JD_2300), v => gastErr(v, true));
    case '__erfa_gast_ancient_mas':
      return maxAbs(sel(-Infinity, JD_1700 - 1), v => gastErr(v, true));
    case '__erfa_gast_twoarg_gain_m500_mas': {
      const v = ERFA_V.find(x => x.label === 'y-500.00');
      return Math.abs(gastErr(v, false)) - Math.abs(gastErr(v, true));
    }
    case '__erfa_sofa_nut00b_dpsi_arcsec':
      return nutation((ERFA_FILE.sofa_t_nut00b.jd_tt - 2451545) / 36525).deltaPsi * AS_PER_RAD;
    case '__erfa_sofa_nut00b_deps_arcsec':
      return nutation((ERFA_FILE.sofa_t_nut00b.jd_tt - 2451545) / 36525).deltaEps * AS_PER_RAD;
  }
  return undefined;
}

// ── USNO observed and predicted ΔT (v4.0.13) ───────────────────────────
// validation/independent/usno_deltat.json: monthly TT-UT1 from maia.usno.navy.mil/ser7/deltat.data
// (1973-02 .. 2026-10, 645 rows [year, month, day, seconds]) and the USNO predictions
// (deltat.preds). Each resolver returns the engine error in seconds.
const USNO_FILE = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'independent/usno_deltat.json'), 'utf8'));
function usnoProbe(field) {
  const jdUT = (y, m, d) => 2440587.5 + (Date.UTC(y, m - 1, d) - Date.UTC(1970, 0, 1)) / 86400000;
  const obs = USNO_FILE.observed;
  const err = r => deltaT(jdUT(r[0], r[1], r[2])) - r[3];
  const maxAbs = arr => arr.reduce((m, r) => Math.max(m, Math.abs(err(r))), 0);
  switch (field) {
    case '__usno_observed_count':          return obs.length;
    case '__usno_observed_max_error_s':    return maxAbs(obs);
    case '__usno_observed_rms_error_s':    return Math.sqrt(obs.reduce((s, r) => s + err(r) * err(r), 0) / obs.length);
    case '__usno_nodes_max_error_s':       return maxAbs(obs.filter(r => r[1] === 1 && r[0] >= 1974 && r[0] <= 2026));
    case '__usno_last_observation_error_s': return Math.abs(err(obs[obs.length - 1]));
    case '__usno_predictions_max_error_s': {
      const rows = USNO_FILE.predictions.filter(r => r[0] >= 2027 && r[0] <= 2033.75);
      return rows.reduce((m, r) => Math.max(m, Math.abs(deltaT(2451545 + (r[0] - 2000) * 365.25) - r[1])), 0);
    }
  }
  return undefined;
}

// ── Time-scale invariants over several epochs (v4.0.13) ──────────────────
// Epochs avoid the first ΔT seconds after every ΔT discontinuity (segment joins and 2150),
// where getSnapshotAt() may legitimately differ (see the comment in getSnapshotAt()).
const TS_YEARS = [-400.3, 250.7, 1000.2, 1750.4, 1850.6, 1950.3, 2000.1, 2026.5, 2100.4, 2500.2];
function timeScaleInvariants(field) {
  const jdOf = y => 2451545 + (y - 2000) * 365.25;
  if (field === '__ts_gast_bug_guard_deg') {
    const jd = 2451545.0;
    const s = getSnapshotAt(jd, { lat_deg: 0, lon_deg: 0 });
    return ((gast(jd) - gast(s.meta.jd_ut1) + 540) % 360) - 180;
  }
  let max = 0;
  const upd = e => { if (Math.abs(e) > max) max = Math.abs(e); };
  for (const y of TS_YEARS) {
    const m = getSnapshotAt(jdOf(y), { lat_deg: 0, lon_deg: 0 }).meta;
    switch (field) {
      case '__ts_ut1_equals_utc_days':         upd(m.jd_ut1 - m.jd_utc); break;
      case '__ts_ut1_from_tt_seconds':         upd((m.jd_ut1 - (m.jd_tt - m.delta_t_sec / 86400)) * 86400); break;
      case '__ts_gast_matches_ut1_arcsec':     upd((((gast(m.jd_ut1) - m.sidereal.gast_deg + 540) % 360) - 180) * 3600); break;
      case '__ts_lst_equals_gast_lon0_arcsec': if (y >= 1000) upd((((m.sidereal.lst_deg - m.sidereal.gast_deg + 540) % 360) - 180) * 3600); break;
    }
  }
  return max;
}

function resolve(snap, field) {
  if (field.startsWith('__erfa_')) return erfaGolden(field);
  if (field.startsWith('__usno_')) return usnoProbe(field);
  // -- Historical Delta-T regression (v4.0.13) ----------------------------
  if (field === '__deltaT_year_500')  return deltaT(2451545 + (500  - 2000)*365.25);
  if (field === '__deltaT_year_1000') return deltaT(2451545 + (1000 - 2000)*365.25);
  if (field === '__deltaT_year_1600') return deltaT(2451545 + (1600 - 2000)*365.25);
  if (field === '__deltaT_year_1700') return deltaT(2451545 + (1700 - 2000)*365.25);
  if (field === '__deltaT_year_1850') return deltaT(2451545 + (1850 - 2000)*365.25);
  if (field === '__deltaT_sigma_year_0')     return deltaTUncertainty(0).sigma;
  if (field === '__deltaT_sigma_year_1800')  return deltaTUncertainty(1800).sigma;
  if (field === '__deltaT_sigma_year_m2000') return deltaTUncertainty(-2000).sigma;

  // -- Delta-T generic probes (v4.0.13): __dt@<year>, __sigma@<year>, __sigmamodel@<year>, __dtjump@<year>
  {
    const m = /^__(dt|sigma|sigmamodel|dtjump)@(-?\d+(?:\.\d+)?)$/.exec(field);
    if (m) {
      const y = parseFloat(m[2]), jd = 2451545 + (y - 2000) * 365.25;
      if (m[1] === 'dt')         return deltaT(jd);
      if (m[1] === 'sigma')      return deltaTUncertainty(y).sigma;
      if (m[1] === 'sigmamodel') return deltaTUncertainty(y).model;
      return Math.abs(deltaT(jd) - deltaT(jd - 1e-9 * 365.25));   // dtjump
    }
  }
  if (field.startsWith('__ts_')) return timeScaleInvariants(field);

  // -- _sunLonAtJDE determinism regression (v4.0.12) ----------------------
  if (field === '__sunlon_clock_ticking' || field === '__sunlon_clock_jump') {
    const step = field === '__sunlon_clock_ticking' ? 1 : 86400000;
    const realNow = Date.now; let t = 1.78e12;
    try {
      Date.now = () => t;
      const ref = _sunLonAtJDE(2451545.0);
      Date.now = () => (t += step);
      const probe = _sunLonAtJDE(2451545.0);
      return ref === probe;
    } finally { Date.now = realNow; }
  }

  if (field === '__getSnapshot_jdtt_matches_jdutc') {
    const realNow = Date.now; let t = 1.78e12;
    try {
      Date.now = () => (t += 5000);
      setObserver(-33.45, -70.66);
      const s = getSnapshot();
      const dT = deltaT(s.meta.jd_tt);
      const derivedJdUtc = s.meta.jd_tt - dT/86400;
      return Math.abs(derivedJdUtc - s.meta.jd_utc) < 1e-9;
    } finally { Date.now = realNow; }
  }

  // -- getSnapshotAt determinism regression (v4.0.10) --------------------
  if (field === '__snapshotAt_clock_ticking' || field === '__snapshotAt_clock_jump') {
    const step = field === '__snapshotAt_clock_ticking' ? 1 : 86400000;
    const realNow = Date.now; let t = 1.78e12;
    try {
      Date.now = () => (t += step);
      const obs = { lat_deg: 51.5, lon_deg: -0.1 };
      const a = JSON.stringify(getSnapshotAt(2451545.0, obs));
      const b = JSON.stringify(getSnapshotAt(2451545.0, obs));
      return a === b;
    } finally { Date.now = realNow; }
  }

  // -- getSnapshot() internal consistency regression (v4.0.10) ------------
  if (field === '__getSnapshot_timestamp_matches_jdutc' || field === '__getSnapshot_utc_matches_timestamp') {
    const realNow = Date.now; let t = 1.78e12;
    try {
      Date.now = () => (t += 5000);   // jump 5 real seconds on every internal read
      setObserver(-33.45, -70.66);
      const s = getSnapshot();
      if (field === '__getSnapshot_timestamp_matches_jdutc') {
        const derivedJdUtc = s.meta.timestamp / 86400 + 2440587.5;
        return Math.abs(s.meta.jd_utc - derivedJdUtc) < 1e-9;
      } else {
        const derivedFromUtcString = Date.parse(s.meta.utc) / 1000;
        return Math.abs(derivedFromUtcString - s.meta.timestamp) < 0.001;
      }
    } finally { Date.now = realNow; }
  }

  // -- Refraction regression (v4.0.8) --------------------------------
  // applyRefraction is a global declared by CaelisEngine.js (vm.runInThisContext)
  if (field === '__refraction_39_88')
    return applyRefraction(39.88 * Math.PI / 180) * 180 / Math.PI;

  if (field === '__refraction_bounded') {
    const D2R = Math.PI / 180, R2D = 180 / Math.PI;
    const corr = h => (applyRefraction(h * D2R) * R2D - h) * 60;   // arcmin
    for (let h = 0; h <= 89; h++) {
      const c = corr(h);
      if (!(c >= 0 && c <= 40)) return false;
      if (h >= 15 && !(c < 4)) return false;
    }
    // below -1 deg the altitude must be returned unchanged
    if (Math.abs(applyRefraction(-5 * D2R) * R2D + 5) > 1e-9) return false;
    for (const [k, b] of Object.entries(snap.bodies || {})) {
      if (k.startsWith('_') || !b || typeof b.alt_geometric_deg !== 'number') continue;
      if (b.alt_geometric_deg < -1) continue;
      const c = (b.alt_apparent_deg - b.alt_geometric_deg) * 60;
      if (!(c >= 0 && c <= 40)) return false;
      if (b.alt_geometric_deg >= 15 && !(c < 4)) return false;
    }
    return true;
  }

  if (field === '__schema_version')
    return snap.schema_version;

  if (field === '__bodies_count')
    return Object.keys(snap.bodies || {}).filter(k => !k.startsWith('_')).length;

  if (field === '__no_house_on_bodies')
    return !Object.values(snap.bodies || {}).some(b => b && 'house' in b);

  if (field === '__no_root_houses')
    return !Object.prototype.hasOwnProperty.call(snap, 'houses') ||
           typeof Object.getOwnPropertyDescriptor(snap, 'houses')?.get === 'function';

  if (field === '__luna_topocentric')
    return 'lon_ecl_topocentric_deg' in (snap.bodies?.Luna || {});

  if (field === '__both_altitudes')
    return Object.entries(snap.bodies || {})
      .filter(([k]) => !k.startsWith('_'))
      .every(([, b]) => b && 'alt_geometric_deg' in b && 'alt_apparent_deg' in b);

  if (field === '__frame_declared') {
    const f = snap.meta?.frame || {};
    return ['nutation','obliquity','planets','moon'].every(k => k in f);
  }

  if (field === '__no_internal_in_json') {
    // Test A: internal fields CAN exist as own properties on the snapshot object
    // (they are valid internal state — _houseConfig, _nodes are expected)
    // Test B: raw JSON.stringify (no replacer) must NOT expose _ fields
    // This verifies the public contract independently of the replacer
    try {
      const rawJson = JSON.stringify(snap);
      const hasInternalLeak = /"_[a-zA-Z]/.test(rawJson);
      return !hasInternalLeak;
    } catch { return false; }
  }

  if (field === '__nutation_deterministic') {
    // Call getSnapshot twice — nutation result should be identical
    try {
      const s1 = getSnapshot();
      const s2 = getSnapshot();
      return Math.abs(s1.meta.nutation.delta_psi_arcsec - s2.meta.nutation.delta_psi_arcsec) < 0.001;
    } catch { return false; }
  }

  // Normal dot-path
  const parts = field.split('.');
  let val = snap;
  for (const p of parts) {
    if (val == null) return undefined;
    val = val[p];
  }
  return val;
}

// ── Run snapshot for epoch ─────────────────────────────────────────────
// Uses getSnapshotAt for historical epochs — avoids timeOffset race condition
// getSnapshotAt internally saves/restores state atomically
function runEpoch(epoch) {
  const obs = { lat_deg: epoch.lat, lon_deg: epoch.lon };
  if (epoch.jd_tt !== null) {
    return getSnapshotAt(epoch.jd_tt, obs);
  }
  setObserver(epoch.lat, epoch.lon);
  return getSnapshot();
}

// ── Compare ────────────────────────────────────────────────────────────
function compare(got, expect, tol) {
  if (tol === null)
    return { pass: String(got) === String(expect), delta: null };
  if (typeof got !== 'number')
    return { pass: false, delta: null, err: `got ${typeof got}` };
  const delta = Math.abs(got - expect);
  return { pass: delta <= tol, delta, pct: (delta / tol * 100).toFixed(1) };
}

// ── Main ────────────────────────────────────────────────────────────────
console.log(`\n${p(C.purple + C.bold, '⬡ CAELIS ENGINE — VALIDATION SUITE v4.0')}`);
console.log(p(C.dim, '  Hermetica Labs · Mathematical pipeline verification\n'));

let totalPass = 0, totalFail = 0;
const failures = [];
const t0 = Date.now();

const epochs = ONLY ? EPOCHS.filter(e => e.id === ONLY) : EPOCHS;
if (ONLY && epochs.length === 0) {
  console.error(p(C.fail, `Epoch '${ONLY}' not found. Available: ${EPOCHS.map(e=>e.id).join(', ')}`));
  process.exit(1);
}

for (const epoch of epochs) {
  console.log(`${p(C.bold, epoch.label)} ${p(C.dim, epoch.jd_tt ? `JD_TT ${epoch.jd_tt}` : 'current time')}`);

  let snap;
  try {
    snap = runEpoch(epoch);
  } catch (e) {
    console.log(`  ${p(C.fail, '✗ ENGINE ERROR:')} ${e.message}`);
    totalFail += epoch.tests.length;
    failures.push({ epoch: epoch.label, test: 'snapshot', err: e.message });
    continue;
  }

  for (const test of epoch.tests) {
    const got    = resolve(snap, test.field);
    const result = compare(got, test.expect, test.tol);

    totalPass += result.pass ? 1 : 0;
    totalFail += result.pass ? 0 : 1;

    if (result.pass) {
      if (VERBOSE) {
        const delta = result.delta !== null ? ` Δ=${result.delta.toFixed(5)}° (${result.pct}% of tol)` : '';
        console.log(`  ${p(C.pass, '✓')} ${p(C.dim, test.label)}${p(C.dim, delta)}`);
      } else {
        process.stdout.write(p(C.pass, '·'));
      }
    } else {
      const gotStr    = typeof got === 'number' ? got.toFixed(6) : String(got);
      const deltaStr  = result.delta !== null ? ` Δ=${result.delta.toFixed(5)}°` : '';
      const failMsg   = `${test.label}: got=${gotStr} expected=${test.expect}±${test.tol}${deltaStr}`;
      console.log(`\n  ${p(C.fail, '✗')} ${failMsg}`);
      if (test.src) console.log(`    ${p(C.dim, 'src: ' + test.src)}`);
      failures.push({ epoch: epoch.label, test: test.label, got: gotStr, expected: test.expect, tol: test.tol });
    }
  }

  if (!VERBOSE) process.stdout.write('\n');
  console.log('');
}

// ── Summary ────────────────────────────────────────────────────────────
const elapsed = Date.now() - t0;
const total   = totalPass + totalFail;
const allPass = totalFail === 0;

console.log('─'.repeat(60));
console.log(
  `${allPass ? p(C.pass + C.bold, '✓ ALL TESTS PASSED') : p(C.fail + C.bold, '✗ TESTS FAILED')}` +
  `  ${p(C.pass, totalPass + ' passed')} · ${totalFail > 0 ? p(C.fail, totalFail + ' failed') : p(C.dim, '0 failed')}` +
  `  ${p(C.dim, total + ' total · ' + elapsed + 'ms')}`
);

if (failures.length > 0) {
  console.log(`\n${p(C.fail, 'Failures:')}`);
  for (const f of failures) {
    console.log(`  ${p(C.dim, f.epoch)} › ${p(C.fail, f.test)}`);
    if (f.got)    console.log(`    got      ${f.got}`);
    if (f.expected !== undefined) console.log(`    expected ${f.expected} ± ${f.tol}`);
    if (f.err)    console.log(`    error    ${f.err}`);
  }
}

console.log('');
process.exit(allPass ? 0 : 1);
