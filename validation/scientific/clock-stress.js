/**
 * ============================================================================
 * CAELIS ENGINE — Wall-Clock Determinism Stress Test
 * validation/scientific/clock-stress.js
 * ============================================================================
 *
 * Copyright (c) 2024-2026 Cristian Valeria Bravo
 * Hermetica Labs - Santiago, Chile
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Reproduces, with a configurable repeat count, the wall-clock independence
 * measurements cited in CHANGELOG.md [4.0.10]/[4.0.12] and in
 * docs/CAELIS_ENGINE_ARQUITECTURA_v4_0.md (invariant I-1): repeated calls to
 * getSnapshot(), getSnapshotAt() and _sunLonAtJDE() must be bit-identical
 * regardless of how the real wall clock behaves between internal reads.
 *
 * Method: Date.now() is monkey-patched to a controllable fake clock. Each
 * function is called once with the clock frozen (the reference value), then
 * repeatedly under three clock conditions and compared against that
 * reference:
 *   - frozen   — Date.now() never advances
 *   - ticking  — Date.now() advances 1 ms on every internal read
 *   - jumping  — Date.now() advances 5000 ms (5 s) on every internal read
 *
 * Usage:
 *   node validation/scientific/clock-stress.js
 *   node validation/scientific/clock-stress.js --n=5000
 *
 * Exit codes: 0 = all pass, 1 = one or more mismatches, 2 = engine load error
 * ============================================================================
 */

'use strict';

const vm   = require('vm');
const fs   = require('fs');
const path = require('path');

// -- CLI args --------------------------------------------------------------
const args = process.argv.slice(2);
const N    = parseInt((args.find(a => a.startsWith('--n=')) || '--n=2000').split('=')[1], 10);

// -- Colors ------------------------------------------------------------------
const G = s => `\x1b[32m${s}\x1b[0m`;
const R = s => `\x1b[31m${s}\x1b[0m`;
const D = s => `\x1b[2m${s}\x1b[0m`;
const B = s => `\x1b[35m${s}\x1b[0m`;

// -- Load engine ---------------------------------------------------------------
const ENGINE = path.resolve(__dirname, '../../core/CaelisEngine.js');
global.window   = global;
global.document = { getElementById: () => null, head: { appendChild: () => {} } };

let realDateNow;
let t0;
try {
  realDateNow = Date.now;
  t0 = realDateNow();
  vm.runInThisContext(fs.readFileSync(ENGINE, 'utf8'));
} catch (e) {
  console.error(R('Engine load error: ' + e.message));
  process.exit(2);
}

// -- Fake clock control ------------------------------------------------------
let fakeMs = 1.78e12;
let stepMs = 0;
Date.now = () => (fakeMs += stepMs);

function withClock(step, fn) {
  stepMs = step;
  return fn();
}

// -- Scenarios -----------------------------------------------------------------
const SCENARIOS = [
  { id: 'frozen',  label: 'frozen clock (0 ms/read)',      step: 0 },
  { id: 'ticking', label: 'ticking clock (1 ms/read)',     step: 1 },
  { id: 'jumping', label: 'jumping clock (5000 ms/read)',  step: 5000 },
];

// -- Subjects under test -----------------------------------------------------------
setObserver(-33.45, -70.66);
const OBS = { lat_deg: -33.45, lon_deg: -70.66 };

const SUBJECTS = [
  {
    id: 'getSnapshot',
    label: 'getSnapshot() - internal jd_tt/jd_utc/timestamp/utc agreement',
    check: () => {
      const s = getSnapshot();
      const dT = deltaT(s.meta.jd_tt);
      const derivedJdUtc = s.meta.jd_tt - dT / 86400;
      const okJdUtc = Math.abs(s.meta.jd_utc - derivedJdUtc) < 1e-9;
      const okUtcString = Math.abs(Date.parse(s.meta.utc) / 1000 - s.meta.timestamp) < 1e-3;
      return okJdUtc && okUtcString ? 'ok' : 'mismatch';
    },
  },
  {
    id: 'getSnapshotAt',
    label: 'getSnapshotAt(J2000.0) - bit-identical output vs. frozen reference',
    reference: null,
    check(ref) {
      const s = JSON.stringify(getSnapshotAt(2451545.0, OBS));
      return s === ref ? 'ok' : 'mismatch';
    },
  },
  {
    id: '_sunLonAtJDE',
    label: '_sunLonAtJDE(J2000.0) - identical solar longitude vs. frozen reference',
    reference: null,
    check(ref) {
      return _sunLonAtJDE(2451545.0) === ref ? 'ok' : 'mismatch';
    },
  },
];

// -- Main ------------------------------------------------------------------------
console.log(`\n${B('CAELIS ENGINE - WALL-CLOCK DETERMINISM STRESS TEST')}`);
console.log(D(`  Hermetica Labs . ${N} repeats x ${SUBJECTS.length} subjects x ${SCENARIOS.length} clock scenarios\n`));

let totalPass = 0, totalFail = 0;
const failures = [];

for (const subject of SUBJECTS) {
  console.log(B(subject.label));

  // Establish the reference value with the clock frozen at scenario entry.
  const ref = withClock(0, () => {
    if (subject.id === 'getSnapshot') return null; // self-consistency check, no external reference needed
    if (subject.id === 'getSnapshotAt') return JSON.stringify(getSnapshotAt(2451545.0, OBS));
    if (subject.id === '_sunLonAtJDE') return _sunLonAtJDE(2451545.0);
  });

  for (const scenario of SCENARIOS) {
    let bad = 0;
    withClock(scenario.step, () => {
      for (let i = 0; i < N; i++) {
        const result = subject.check(ref);
        if (result !== 'ok') bad++;
      }
    });

    totalPass += (N - bad);
    totalFail += bad;

    if (bad === 0) {
      console.log(`  ${G('OK')} ${D(scenario.label)}  ${D('0 / ' + N + ' mismatches')}`);
    } else {
      console.log(`  ${R('FAIL')} ${scenario.label}  ${R(bad + ' / ' + N + ' mismatches')}`);
      failures.push({ subject: subject.id, scenario: scenario.id, bad, N });
    }
  }
  console.log('');
}

Date.now = realDateNow;

// -- Summary -----------------------------------------------------------------------
const elapsed = realDateNow() - t0;
const allPass = totalFail === 0;

console.log('-'.repeat(80));
console.log(
  `${allPass ? G('ALL CLOCK-STRESS TESTS PASSED') : R('CLOCK-STRESS TESTS FAILED')}` +
  `  ${G(totalPass + ' consistent')} . ${totalFail > 0 ? R(totalFail + ' inconsistent') : D('0 inconsistent')}` +
  `  ${D((totalPass + totalFail) + ' total . ' + elapsed + 'ms')}`
);

if (failures.length > 0) {
  console.log(`\n${R('Failures:')}`);
  for (const f of failures) {
    console.log(`  ${D(f.subject)} > ${R(f.scenario)}: ${f.bad} / ${f.N}`);
  }
}

console.log('');
process.exit(allPass ? 0 : 1);