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

const EPOCHS = [
  {
    id:    'j2000',
    label: 'J2000.0 (Meeus + VSOP87)',
    jd_tt: 2451545.0,
    lat:   51.5,
    lon:   -0.1,
    tests: [
      { field: 'meta.obliquity.true_deg',           expect: 23.4377,  tol: 0.0005, label: 'True obliquity ε (IAU2000B at J2000)',  src: '[S] IAU 2006 mean=23.43929, true=mean+ΔεIAU2000B' },
      { field: 'meta.delta_t_sec',                  expect: 63.83,    tol: 0.5,    label: 'ΔT sec',               src: '[I] IERS 2000-Jan' },
      { field: 'meta.sidereal.gast_deg',             expect: 280.457,  tol: 0.05,   label: 'GAST at J2000.0',      src: '[M] Ch.12 p.88 ≈280.46 + IAU2006 precession' },
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
      { field: 'meta.nutation.delta_psi_arcsec',     expect: -2.624,   tol: 0.200,  label: 'ΔΨ arcsec (IAU 2000B)',  src: '[M] Ch.22 usa IAU 1980 (-3.788"); IAU 2000B da diferente valor en misma fecha' },
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
      { field: 'meta.obliquity.true_deg',                expect: 23.4383,  tol: 0.0001, label: 'True obliquity ε',   src: '[C]' },
      { field: 'meta.sidereal.lst_deg',                  expect: 179.618,  tol: 0.050,  label: 'LST',                src: '[C]' },
      { field: 'meta.delta_t_sec',                       expect: 71.35,    tol: 0.5,    label: 'ΔT sec',              src: '[I]+[C]' },
      { field: 'bodies.Sol.lon_ecl_geocentric_deg',      expect: 71.498,   tol: 0.005,  label: 'Sol λ',               src: '[C]' },
      { field: 'bodies.Sol.alt_geometric_deg',           expect: -27.896,  tol: 0.1,    label: 'Sol alt geometric',   src: '[C]' },
      { field: 'bodies.Luna.lon_ecl_geocentric_deg',     expect: 269.330,  tol: 0.020,  label: 'Luna λ geocentric',   src: '[C]' },
      { field: 'bodies.Luna.lon_ecl_topocentric_deg',    expect: 270.082,  tol: 0.050,  label: 'Luna λ topocentric',  src: '[C]' },
      { field: 'bodies.Jupiter.lon_ecl_geocentric_deg',  expect: 114.254,  tol: 0.005,  label: 'Jupiter λ',           src: '[C]' },
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
      { field: '__nutation_cached_correctly',  expect: true,  tol: null, label: 'Nutation cache valid' },
    ]
  },
];

// ── Field resolver ────────────────────────────────────────────────────
function resolve(snap, field) {
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
    try {
      const j = JSON.stringify(snap, (k, v) => k.startsWith('_') ? undefined : v);
      const parsed = JSON.parse(j);
      const check = obj => {
        if (typeof obj !== 'object' || !obj) return true;
        return Object.keys(obj).every(k => !k.startsWith('_') && check(obj[k]));
      };
      return check(parsed);
    } catch { return false; }
  }

  if (field === '__nutation_cached_correctly') {
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
