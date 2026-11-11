'use strict';
/**
 * CAELIS ENGINE - Core purity suite
 * validation/core-purity.js
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The astronomical core must not depend on a host environment (DOM, browser).
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const code = fs.readFileSync(path.resolve(__dirname, '../core/CaelisEngine.js'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, name) => { if (c) pass++; else { fail++; console.log('  FAIL: ' + name); } };
const start = Date.now();
console.log('\nCAELIS ENGINE - CORE PURITY\n');

// 1) no host-environment references in code (comments stripped)
const stripped = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
for (const w of ['document', 'navigator', 'window', 'localStorage', 'sessionStorage'])
  ok(!new RegExp('\\b' + w + '\\b').test(stripped), 'no reference to ' + w);

// 2) the engine runs in a bare context (no DOM, no browser globals)
const ctx = vm.createContext({});
vm.runInContext(code, ctx);
const utc = vm.runInContext("getSnapshotAt(2461193.499437, { lat_deg: -33.45, lon_deg: -70.66 }).meta.utc", ctx);
ok(typeof utc === 'string' && utc.startsWith('2026-06-01T23:58'), 'snapshot computed in a bare context (' + utc + ')');

// 3) removed UI functions are gone; setObserver has no label parameter
for (const n of ['applyManualLocation', 'initLocation'])
  ok(vm.runInContext('typeof ' + n, ctx) === 'undefined', n + ' is not defined');
ok(vm.runInContext('setObserver.length', ctx) === 2, 'setObserver takes (lat, lon) only');
const latBack = vm.runInContext("setObserver(10, 20); getSnapshot().meta.observer.lat_deg", ctx);
ok(Math.abs(latBack - 10) < 1e-9, 'setObserver works without DOM (lat ' + latBack + ')');

// 4) public API surface of the CommonJS export
const E = require('../core/CaelisEngine.js');
const expected = ['deg2rad', 'deltaT', 'gast', 'getSnapshot', 'getSnapshotAt', 'julianDate', 'julianDateUTC', 'rad2deg', 'setObserver'];
ok(JSON.stringify(Object.keys(E).sort()) === JSON.stringify(expected), 'public API surface: ' + Object.keys(E).sort().join(', '));

const total = pass + fail;
console.log((fail === 0 ? 'ALL CORE-PURITY TESTS PASSED  ' : 'CORE-PURITY FAILURES  ') + pass + ' passed - ' + fail + ' failed  ' + total + ' total - ' + (Date.now() - start) + 'ms');
process.exit(fail === 0 ? 0 : 1);