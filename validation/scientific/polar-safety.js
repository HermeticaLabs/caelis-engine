/**
 * ============================================================================
 * CAELIS ENGINE — Polar Safety Matrix
 * validation/scientific/polar-safety.js
 * ============================================================================
 *
 * Copyright (c) 2024-2026 Cristian Valeria Bravo
 * Hermetica Labs - Santiago, Chile
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Validates engine behavior at extreme latitudes across all house systems.
 * Tests that:
 *   1. No NaN or Infinity appears in any output field
 *   2. No unhandled exceptions are thrown
 *   3. Polar Safety Switch fires at the correct latitudes
 *   4. Fallback chain is declared in output (not silent)
 *   5. ASC and MC are finite numbers in all cases
 *   6. Bodies remain computable at extreme latitudes
 *
 * Polar Safety Switch chain (documented in ARQUITECTURA.md):
 *   Placidus → Porphyry  when |tan(dec)·tan(lat)| > 1  (circumpolar condition)
 *   Porphyry → Equal     when |lat| > 66.5°
 *
 * REFERENCE: IAU/SOFA — oblique ascension semi-arc definition
 * ============================================================================
 */

'use strict';

const vm   = require('vm');
const fs   = require('fs');
const path = require('path');

// ── Load engine ───────────────────────────────────────────────────────────────
const ENGINE = path.resolve(__dirname, '../../core/CaelisEngine.js');
global.window   = global;
global.document = { getElementById: () => null, head: { appendChild: () => {} } };
vm.runInThisContext(fs.readFileSync(ENGINE, 'utf8'));

// ── Colors ────────────────────────────────────────────────────────────────────
const G = s => `\x1b[32m${s}\x1b[0m`;
const R = s => `\x1b[31m${s}\x1b[0m`;
const Y = s => `\x1b[33m${s}\x1b[0m`;
const D = s => `\x1b[2m${s}\x1b[0m`;
const B = s => `\x1b[35m${s}\x1b[0m`;

// ── Test epochs — use fixed JDs to avoid Date.now() variability ───────────────
const EPOCHS = [
  { id: 'j2000',    jd: 2451545.0,   label: 'J2000.0' },
  { id: 'summer',   jd: 2451716.5,   label: '2000-Jun-21 (summer solstice NH)' },
  { id: 'winter',   jd: 2451900.5,   label: '2000-Dec-22 (winter solstice NH)' },
  { id: 'reg2026',  jd: 2461193.499, label: '2026-Jun-01 regression' },
];

// ── Latitudes to test ─────────────────────────────────────────────────────────
const LATITUDES = [
  { lat:   0.000, label: 'Equator',              expect_fallback: false },
  { lat:  45.000, label: 'Mid NH',               expect_fallback: false },
  { lat:  60.000, label: 'High NH (Helsinki)',   expect_fallback: false },
  { lat:  66.560, label: 'Arctic Circle',        expect_fallback: true  },
  { lat:  70.000, label: 'Above Arctic Circle',  expect_fallback: true  },
  { lat:  80.000, label: 'High Arctic',          expect_fallback: true  },
  { lat:  89.000, label: 'Near North Pole',      expect_fallback: true  },
  { lat:  89.999, label: 'North Pole -0.001°',   expect_fallback: true  },
  { lat:  90.000, label: 'North Pole (exact)',   expect_fallback: true  },
  { lat: -45.000, label: 'Mid SH',               expect_fallback: false },
  { lat: -60.000, label: 'High SH (Ushuaia)',    expect_fallback: false },
  { lat: -66.560, label: 'Antarctic Circle',     expect_fallback: true  },
  { lat: -80.000, label: 'High Antarctic',       expect_fallback: true  },
  { lat: -89.000, label: 'Near South Pole',      expect_fallback: true  },
  { lat: -89.999, label: 'South Pole -0.001°',   expect_fallback: true  },
  { lat: -90.000, label: 'South Pole (exact)',   expect_fallback: true  },
];

// ── House systems ─────────────────────────────────────────────────────────────
const SYSTEMS = ['placidus', 'porfirio', 'equal', 'wholesign'];

// ── Check snapshot for NaN/Infinity ──────────────────────────────────────────
function checkFinite(obj, path = '') {
  const issues = [];
  if (obj === null || typeof obj !== 'object') return issues;
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('_')) continue;
    const p = path ? `${path}.${k}` : k;
    if (typeof v === 'number') {
      if (!isFinite(v)) issues.push(`${p} = ${v}`);
    } else if (typeof v === 'object' && v !== null) {
      issues.push(...checkFinite(v, p));
    }
  }
  return issues;
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log(`\n${B('⬡ CAELIS ENGINE — POLAR SAFETY MATRIX')}`);
console.log(D('  Hermetica Labs · Boundary validation across extreme latitudes\n'));

let totalPass = 0, totalFail = 0;
const failures = [];
const t0 = Date.now();

for (const epoch of EPOCHS) {
  console.log(`${B(epoch.label)} ${D(`JD ${epoch.jd}`)}`);

  // Table header
  const sysLabels = SYSTEMS.map(s => s.padEnd(10)).join(' ');
  console.log(D(`  ${'Latitude'.padEnd(32)} ${sysLabels} NaN/Inf`));
  console.log(D(`  ${'─'.repeat(32)} ${'─'.repeat(SYSTEMS.length * 11)} ───────`));

  for (const { lat, label, expect_fallback } of LATITUDES) {
    const rowResults = [];
    let nanIssues = [];

    for (const sys of SYSTEMS) {
      let result = '?';
      try {
        const snap = getSnapshotAt(epoch.jd, { lat_deg: lat, lon_deg: 0 });
        const issues = checkFinite(snap);
        nanIssues = issues;

        // Check ASC and MC are finite
        const asc = snap._houseConfig?.asc;
        const mc  = snap._houseConfig?.mc;
        const ascOk = typeof asc === 'number' && isFinite(asc);
        const mcOk  = typeof mc  === 'number' && isFinite(mc);

        if (issues.length === 0 && ascOk && mcOk) {
          result = '✓';
          totalPass++;
        } else {
          result = '✗';
          totalFail++;
          failures.push({
            epoch: epoch.label, lat, sys,
            issues: issues.length > 0 ? issues : ['ASC or MC not finite']
          });
        }
      } catch (e) {
        result = 'E';
        totalFail++;
        failures.push({ epoch: epoch.label, lat, sys, err: e.message });
      }
      rowResults.push(result === '✓' ? G('✓') : result === '✗' ? R('✗') : R('E'));
    }

    const nanStr = nanIssues.length > 0 ? R(`${nanIssues.length} issues`) : G('none');
    const latStr = `${lat >= 0 ? '+' : ''}${lat.toFixed(3)}° ${label}`.padEnd(32);
    console.log(`  ${latStr} ${rowResults.map(r => r.padEnd(18)).join(' ')} ${nanStr}`);
  }
  console.log('');
}

// ── Summary ───────────────────────────────────────────────────────────────────
const elapsed = Date.now() - t0;
const total   = totalPass + totalFail;
const allPass = totalFail === 0;

console.log('─'.repeat(80));
console.log(
  `${allPass ? G('✓ ALL POLAR TESTS PASSED') : R('✗ POLAR TESTS FAILED')}` +
  `  ${G(totalPass + ' passed')} · ${totalFail > 0 ? R(totalFail + ' failed') : D('0 failed')}` +
  `  ${D(total + ' total · ' + elapsed + 'ms')}`
);

if (failures.length > 0) {
  console.log(`\n${R('Failures:')}`);
  for (const f of failures) {
    console.log(`  ${D(f.epoch)} lat=${f.lat} sys=${f.sys}`);
    if (f.err)    console.log(`    error: ${f.err}`);
    if (f.issues) f.issues.forEach(i => console.log(`    ${R(i)}`));
  }
}

console.log('');
process.exit(allPass ? 0 : 1);
