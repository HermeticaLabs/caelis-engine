/**
 * ============================================================================
 * CAELIS ENGINE — CommonJS Interoperability Test
 * validation/interop/test-cjs.js
 * ============================================================================
 *
 * Copyright (c) 2024-2026 Cristian Valeria Bravo
 * Hermetica Labs - Santiago, Chile
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Verifies that CaelisEngine.js can be loaded and used in a Node.js
 * CommonJS environment via vm.runInThisContext (the documented loading
 * method for CJS environments without a bundler).
 *
 * Usage: node validation/interop/test-cjs.js
 */
'use strict';

const vm   = require('vm');
const fs   = require('fs');
const path = require('path');

console.log('Testing CommonJS (Node.js vm.runInThisContext)...\n');

// ── Load engine ───────────────────────────────────────────────────────────────
global.window   = global;
global.document = { getElementById: () => null, head: { appendChild: () => {} } };

try {
  const enginePath = path.resolve(__dirname, '../../core/CaelisEngine.js');
  vm.runInThisContext(fs.readFileSync(enginePath, 'utf8'));
} catch(e) {
  console.error(`✗ Engine load failed: ${e.message}`);
  process.exit(1);
}

let pass = 0, fail = 0;

function check(label, fn) {
  try {
    const result = fn();
    if (result === false) throw new Error('assertion failed');
    console.log(`  ✓ ${label}`);
    pass++;
  } catch(e) {
    console.error(`  ✗ ${label}: ${e.message}`);
    fail++;
  }
}

// ── API surface checks ────────────────────────────────────────────────────────
console.log('API surface:');
check('getSnapshot is a function',    () => typeof getSnapshot === 'function');
check('getSnapshotAt is a function',  () => typeof getSnapshotAt === 'function');
check('setObserver is a function',    () => typeof setObserver === 'function');
check('julianDate is a function',     () => typeof julianDate === 'function');
check('deltaT is a function',         () => typeof deltaT === 'function');
check('deg2rad is a number',          () => typeof deg2rad === 'number' && Math.abs(deg2rad - Math.PI/180) < 1e-10);
check('rad2deg is a number',          () => typeof rad2deg === 'number' && Math.abs(rad2deg - 180/Math.PI) < 1e-10);
check('module.exports present',       () => typeof module !== 'undefined' && !!module.exports);

// ── Functional checks ─────────────────────────────────────────────────────────
console.log('\nFunctional:');

check('setObserver(lat, lon) does not throw', () => {
  setObserver(-33.45, -70.66);
  return true;
});

check('getSnapshot() returns schema v3.1', () => {
  const snap = getSnapshot();
  return snap.schema_version === '3.1';
});

check('getSnapshot() has 11 bodies', () => {
  const snap = getSnapshot();
  return Object.keys(snap.bodies).filter(k => !k.startsWith('_')).length === 11;
});

check('getSnapshot() Sol has lon_ecl_geocentric_deg', () => {
  const snap = getSnapshot();
  return typeof snap.bodies.Sol.lon_ecl_geocentric_deg === 'number' &&
         isFinite(snap.bodies.Sol.lon_ecl_geocentric_deg);
});

check('getSnapshot() Luna has dist_km', () => {
  const snap = getSnapshot();
  return typeof snap.bodies.Luna.dist_km === 'number' &&
         snap.bodies.Luna.dist_km > 300000 &&
         snap.bodies.Luna.dist_km < 410000;
});

check('getSnapshot() Luna has dist_au', () => {
  const snap = getSnapshot();
  return typeof snap.bodies.Luna.dist_au === 'number' &&
         isFinite(snap.bodies.Luna.dist_au);
});

check('getSnapshotAt(jd, observer) is deterministic', () => {
  const obs = { lat_deg: 51.5, lon_deg: -0.1 };
  const a = getSnapshotAt(2451545.0, obs);
  const b = getSnapshotAt(2451545.0, obs);
  return Math.abs(
    a.bodies.Sol.lon_ecl_geocentric_deg -
    b.bodies.Sol.lon_ecl_geocentric_deg
  ) < 1e-10;
});

check('deltaT(jd) returns a number', () => {
  const dt = deltaT(2451545.0);
  return typeof dt === 'number' && isFinite(dt) && dt > 60 && dt < 70;
});

check('getSnapshot() meta.frame declares algorithms', () => {
  const snap = getSnapshot();
  const f = snap.meta.frame;
  return f && f.planets && f.moon && f.nutation && f.obliquity;
});

check('_houseConfig and _nodes non-enumerable in JSON', () => {
  const snap = getSnapshot();
  const raw  = JSON.stringify(snap);
  return !/"_[a-zA-Z]/.test(raw);
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(
  `${fail === 0 ? '✓ ALL INTEROP TESTS PASSED' : '✗ INTEROP TESTS FAILED'}` +
  `  ${pass} passed · ${fail} failed`
);
process.exit(fail > 0 ? 1 : 0);
