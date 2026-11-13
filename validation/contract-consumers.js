'use strict';
/**
 * CAELIS ENGINE - Consumer contract suite
 * validation/contract-consumers.js
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Paths and types that dependent projects read from a snapshot. A schema change
 * that breaks one of them must fail here before it is published.
 * Consumer: Caeliscope (positional call getSnapshotAt(jd_tt, lat, lon)).
 * Rule: schema minor versions only ADD fields; consumers ignore unknown fields.
 */
const E = require('../core/CaelisEngine.js');
let pass = 0, fail = 0;
const ok = (c, name) => { if (c) pass++; else { fail++; console.log('  FAIL: ' + name); } };
const start = Date.now();
console.log('\nCAELIS ENGINE - CONSUMER CONTRACT\n');

const JD = 2461193.499437, LAT = -33.45, LON = -70.66;
const BODIES = ['Sol', 'Luna', 'Mercurio', 'Venus', 'Marte', 'Jupiter', 'Saturno', 'Urano', 'Neptuno'];
const FIELDS = ['ra_deg', 'dec_deg', 'az_deg', 'alt_apparent_deg', 'dist_au', 'lon_ecl_deg', 'lat_ecl_deg', 'lon_ecl_geocentric_deg', 'lat_ecl_geocentric_deg'];
const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
const s = E.getSnapshotAt(JD, LAT, LON);
const chk = (p, t) => { const v = get(s, p); ok(typeof v === t && (t !== 'number' || Number.isFinite(v)), p + ' is a ' + (t === 'number' ? 'finite number' : t) + ' (got ' + typeof v + ')'); };

chk('schema_version', 'string');
chk('meta.utc', 'string'); chk('meta.jd_tt', 'number'); chk('meta.delta_t_sec', 'number'); chk('meta.sidereal.lst_deg', 'number');
for (const b of BODIES) for (const f of FIELDS) chk('bodies.' + b + '.' + f, 'number');
chk('bodies.Luna.dist_km', 'number');
chk('luna.illumination', 'number'); chk('luna.phase_deg', 'number'); chk('luna.phase_ratio', 'number');
ok(typeof E.deltaT(2461193.5) === 'number', 'deltaT(jdUtc) returns a number');
ok(JSON.stringify(E.getSnapshotAt(JD, { lat_deg: LAT, lon_deg: LON })) === JSON.stringify(s), 'positional and object observer forms give the same snapshot');
ok(BODIES.every(b => Object.prototype.hasOwnProperty.call(s.bodies, b)), 'the nine consumer body keys are present');
ok(JSON.stringify(E.getSnapshotAt(JD, LAT, LON)) === JSON.stringify(s), 'same instant and observer give the same snapshot (determinism)');

const total = pass + fail;
console.log((fail === 0 ? 'ALL CONTRACT TESTS PASSED  ' : 'CONTRACT FAILURES  ') + pass + ' passed - ' + fail + ' failed  ' + total + ' total - ' + (Date.now() - start) + 'ms');
process.exit(fail === 0 ? 0 : 1);