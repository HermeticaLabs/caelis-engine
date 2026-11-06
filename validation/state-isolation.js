'use strict';
/**
 * CAELIS ENGINE - State isolation suite (H-02, phase 1)
 * validation/state-isolation.js
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Measures that getSnapshotAt() leaves module-level state untouched and that
 * its output matches engine v4.0.13 byte for byte on a wide grid.
 */
const path = require('path'), fs = require('fs'), os = require('os');
const { execSync } = require('child_process');
const E = require('../core/CaelisEngine.js');
let pass = 0, fail = 0, skipped = 0;
const ok = (c, name) => { if (c) pass++; else { fail++; console.log('  FAIL: ' + name); } };
const start = Date.now();
console.log('\nCAELIS ENGINE - STATE ISOLATION (H-02 phase 1)\n');

const withClock = (t0, step, fn) => {
  const real = Date.now; let t = t0;
  try { Date.now = () => (t += step); return fn(); } finally { Date.now = real; }
};
const obs = () => { const o = E.getSnapshot().meta.observer; return o.lat_deg + ',' + o.lon_deg; };
const AT = (jd, la, lo) => JSON.stringify(E.getSnapshotAt(jd, { lat_deg: la, lon_deg: lo }));

E.setObserver(-33.45, -70.66);
const base = obs();

// 1) observer state intact after valid, invalid and throwing calls
E.getSnapshotAt(2461193.499437, { lat_deg: 51.5, lon_deg: -0.1 });
ok(obs() === base, 'observer intact after valid call');
for (const [jd, o] of [[2461193.5, { lat_deg: 95, lon_deg: 0 }], [NaN, { lat_deg: 0, lon_deg: 0 }], [1e300, { lat_deg: 0, lon_deg: 0 }], [2451545, null]]) {
  try { E.getSnapshotAt(jd, o); } catch (e) { /* expected */ }
  ok(obs() === base, 'observer intact after rejected call jd=' + jd);
}

// 2) clock not left frozen after a throwing call
withClock(1.78e12, 5000, () => {
  try { E.getSnapshotAt(1e300, { lat_deg: 0, lon_deg: 0 }); } catch (e) { /* expected */ }
  const a = E.getSnapshot().meta.jd_utc, b = E.getSnapshot().meta.jd_utc;
  ok(a !== b, 'clock not frozen after out-of-range call');
});
withClock(1.78e12, 5000, () => {
  E.getSnapshotAt(2461193.499437, { lat_deg: 10, lon_deg: 10 });
  const a = E.getSnapshot().meta.jd_utc, b = E.getSnapshot().meta.jd_utc;
  ok(a !== b, 'clock not frozen after valid call');
});

// 3) wall clock does not affect getSnapshotAt
const r1 = withClock(1.7e12, 1, () => AT(2451545.0, 40, 10));
const r2 = withClock(1.9e12, 86400000, () => AT(2451545.0, 40, 10));
ok(r1 === r2, 'getSnapshotAt independent of wall clock');

// 4) order independence
const solo = AT(2446895.5, 48.8, 2.3);
AT(2451545.0, -60, 100); AT(2461193.499437, 70, -150); E.setObserver(20, 30); AT(2400000.5, 0, 0);
E.setObserver(-33.45, -70.66);
ok(AT(2446895.5, 48.8, 2.3) === solo, 'same snapshot after interleaved calls');
ok(obs() === base, 'observer intact after interleaving');

// 5) grid vs v4.0.13
let old = null;
try {
  const src = execSync('git show v4.0.13:core/CaelisEngine.js', { maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  const f = path.join(os.tmpdir(), 'caelis_v4.0.13_grid_baseline.js'); fs.writeFileSync(f, src); old = require(f);
} catch (e) { skipped++; console.log('  SKIP: baseline v4.0.13 not available (git/tag)'); }
if (old) {
  const jds = []; for (let i = 0; i < 24; i++) jds.push(2268932.5 + i * (2488069.5 - 2268932.5) / 23); // ~ -500 to 2100
  const lats = [-90, -89.999, -80, -66.56, -45, -33.45, -10, 0, 10, 33.45, 45, 66.56, 80, 89.999, 90];
  const lons = [-170, 0, 123.4];
  let n = 0, bad = 0;
  for (const jd of jds) for (const la of lats) for (const lo of lons) {
    n++;
    if (JSON.stringify(old.getSnapshotAt(jd, { lat_deg: la, lon_deg: lo })) !== AT(jd, la, lo)) { bad++; if (bad <= 5) console.log('  DIFF at jd ' + jd + ' lat ' + la + ' lon ' + lo); }
  }
  ok(bad === 0, 'grid ' + n + ' snapshots identical to v4.0.13 (' + bad + ' differ)');
}

const total = pass + fail;
console.log((fail === 0 ? 'ALL STATE-ISOLATION TESTS PASSED  ' : 'STATE-ISOLATION FAILURES  ') + pass + ' passed - ' + fail + ' failed  ' + total + ' total - ' + skipped + ' skipped - ' + (Date.now() - start) + 'ms');
process.exit(fail === 0 ? 0 : 1);