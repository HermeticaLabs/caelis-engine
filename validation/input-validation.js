'use strict';
/**
 * CAELIS ENGINE - Input validation suite (v4.0.14, H-03)
 * validation/input-validation.js
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
const path = require('path'), fs = require('fs'), os = require('os');
const { execSync } = require('child_process');
const E = require('../core/CaelisEngine.js');
let pass = 0, fail = 0, skipped = 0;
const ok = (c, name) => { if (c) pass++; else { fail++; console.log('  FAIL: ' + name); } };
const throwsRange = (fn, name, msg) => {
  try { fn(); ok(false, name + ' (no error)'); }
  catch (e) { ok(e instanceof RangeError && (!msg || e.message.includes(msg)), name + ' (' + e.constructor.name + ': ' + e.message + ')'); }
};
const obsNow = () => { const o = E.getSnapshot().meta.observer; return o.lat_deg + ',' + o.lon_deg; };
const JD = 2461193.499437;
const BAD = [Infinity, -Infinity, NaN, null, undefined, '10', {}];
const label = v => (typeof v === 'string' ? '"' + v + '"' : v === null ? 'null' : typeof v === 'object' ? '{}' : String(v));
const start = Date.now();

console.log('\nCAELIS ENGINE - INPUT VALIDATION (v4.0.14)\n');
E.setObserver(-33.45, -70.66);
const base = obsNow();

// 1) latitude bounds
for (const l of [90, -90, 0, 89.9999]) { try { E.getSnapshotAt(JD, { lat_deg: l, lon_deg: 0 }); ok(true, ''); } catch (e) { ok(false, 'lat ' + l + ' must be accepted: ' + e.message); } }
for (const l of [90.0001, -90.0001, 95, -120, 1e9]) throwsRange(() => E.getSnapshotAt(JD, { lat_deg: l, lon_deg: 0 }), 'getSnapshotAt lat ' + l, 'latitude');
for (const l of [90.0001, -90.0001, 95]) throwsRange(() => E.setObserver(l, 0), 'setObserver lat ' + l, 'latitude');

// 2) non-finite / non-number input
for (const v of BAD) {
  throwsRange(() => E.getSnapshotAt(JD, { lat_deg: v, lon_deg: 0 }), 'getSnapshotAt lat=' + label(v));
  throwsRange(() => E.getSnapshotAt(JD, { lat_deg: 0, lon_deg: v }), 'getSnapshotAt lon=' + label(v));
  throwsRange(() => E.setObserver(v, 0), 'setObserver lat=' + label(v));
  throwsRange(() => E.setObserver(0, v), 'setObserver lon=' + label(v));
}
for (const v of [Infinity, -Infinity, NaN, null, undefined, '2461193.5'])
  throwsRange(() => E.getSnapshotAt(v, { lat_deg: 0, lon_deg: 0 }), 'getSnapshotAt jd=' + label(v), 'jdTarget');
throwsRange(() => E.getSnapshotAt(JD, null), 'getSnapshotAt observer=null');
throwsRange(() => E.getSnapshotAt(JD), 'getSnapshotAt observer missing');
throwsRange(() => E.getSnapshotAt(JD, 10, Infinity), 'getSnapshotAt positional lon=Infinity');

// 3) global state untouched after every rejected call
ok(obsNow() === base, 'observer state unchanged after rejected calls (' + base + ' vs ' + obsNow() + ')');

// 4) longitude normalization
const a = JSON.stringify(E.getSnapshotAt(JD, { lat_deg: 10, lon_deg: 190 }));
const b = JSON.stringify(E.getSnapshotAt(JD, { lat_deg: 10, lon_deg: -170 }));
ok(a === b, 'lon 190 === lon -170');
ok(JSON.stringify(E.getSnapshotAt(JD, { lat_deg: 10, lon_deg: 400 })) === JSON.stringify(E.getSnapshotAt(JD, { lat_deg: 10, lon_deg: 40 })), 'lon 400 === lon 40');
ok(JSON.stringify(E.getSnapshotAt(JD, { lat_deg: 10, lon_deg: -540 })) === JSON.stringify(E.getSnapshotAt(JD, { lat_deg: 10, lon_deg: -180 })), 'lon -540 === lon -180');
ok(Math.abs(E.getSnapshotAt(JD, { lat_deg: 10, lon_deg: 190 }).meta.observer.lon_deg + 170) < 1e-9, 'meta.observer reports normalized lon -170');
for (const l of [180, -180]) ok(Math.abs(Math.abs(E.getSnapshotAt(JD, { lat_deg: 10, lon_deg: l }).meta.observer.lon_deg) - 180) < 1e-9, 'lon ' + l + ' kept');
E.setObserver(10, 190);
ok(Math.abs(E.getSnapshot().meta.observer.lon_deg + 170) < 1e-9, 'setObserver normalizes lon 190 -> -170');
E.setObserver(-33.45, -70.66);

// 5) date range (limit comes from the JS Date range on the derived UTC)
for (const jd of [1.05e8, -1e8, 1e9, 1e300])
  throwsRange(() => E.getSnapshotAt(jd, { lat_deg: 0, lon_deg: 0 }), 'getSnapshotAt jd=' + jd + ' out of range', 'outside the supported range');
ok(obsNow() === base, 'observer state unchanged after out-of-range jd');
ok(Number.isFinite(E.getSnapshotAt(1e8, { lat_deg: 0, lon_deg: 0 }).meta.jd_tt), 'jd 1e8 still computable');

// 6) valid output identical to engine v4.0.13
let old = null;
try {
  const src = execSync('git show v4.0.13:core/CaelisEngine.js', { maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  const f = path.join(os.tmpdir(), 'caelis_v4.0.13_baseline.js'); fs.writeFileSync(f, src); old = require(f);
} catch (e) { skipped++; console.log('  SKIP: baseline v4.0.13 not available (git/tag)'); }
if (old) {
  for (const [jd, la, lo] of [[2451545.0, 51.5, -0.1], [2446895.5, 48.8, 2.3], [JD, -33.45, -70.66], [2488069.5, -89.999, 0], [2451545.0, 90, 0], [2451545.0, -90, 180]])
    ok(JSON.stringify(old.getSnapshotAt(jd, { lat_deg: la, lon_deg: lo })) === JSON.stringify(E.getSnapshotAt(jd, { lat_deg: la, lon_deg: lo })), 'valid input unchanged vs v4.0.13 at jd ' + jd + ' lat ' + la);
}

const total = pass + fail;
console.log((fail === 0 ? 'ALL INPUT-VALIDATION TESTS PASSED  ' : 'INPUT-VALIDATION FAILURES  ') + pass + ' passed - ' + fail + ' failed  ' + total + ' total - ' + skipped + ' skipped - ' + (Date.now() - start) + 'ms');
process.exit(fail === 0 ? 0 : 1);