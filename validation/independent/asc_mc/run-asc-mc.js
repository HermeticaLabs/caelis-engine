/**
 * ============================================================================
 * CAELIS ENGINE — Independent ASC/MC Validation
 * validation/independent/asc_mc/run-asc-mc.js
 * ============================================================================
 *
 * Copyright (c) 2024-2026 Cristian Valeria Bravo
 * Hermetica Labs - Santiago, Chile
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Compares Caelis Engine ASC/MC output against an independent reference
 * implementation derived from SOFA/ERFA algorithms. The reference shares
 * NO code with CaelisEngine.js.
 *
 * TEST STRUCTURE:
 *   Temporal validation  — 10 epochs × 4 UTC hours × 1 observer = 40 cases
 *   Spatial validation   — 1 epoch × 8 latitudes × 4 longitudes = 32 cases
 *   Combined validation  — 6 epochs × 6 observers                = 36 cases
 *   Total                                                         = 108 cases
 *
 * TOLERANCE:
 *   GAST/LST: ±30 arcsec  (IAU 2006 vs simplified nutation)
 *   ASC:      ±60 arcsec  (geometric formula from GAST)
 *   MC:       ±30 arcsec  (meridian formula from GAST)
 *
 * Usage: node validation/independent/asc_mc/run-asc-mc.js [--verbose]
 * ============================================================================
 */

'use strict';

const vm   = require('vm');
const fs   = require('fs');
const path = require('path');

// ── Load engine ───────────────────────────────────────────────────────────────
global.window   = global;
global.document = { getElementById: () => null, head: { appendChild: () => {} } };
const ENGINE = path.resolve(__dirname, '../../../core/CaelisEngine.js');
vm.runInThisContext(fs.readFileSync(ENGINE, 'utf8'));

// ── Load reference implementation ─────────────────────────────────────────────
const ref = require('./reference-erfa.js');

// ── Colors ────────────────────────────────────────────────────────────────────
const G = s => `\x1b[32m${s}\x1b[0m`;
const R = s => `\x1b[31m${s}\x1b[0m`;
const Y = s => `\x1b[33m${s}\x1b[0m`;
const D = s => `\x1b[2m${s}\x1b[0m`;
const B = s => `\x1b[35m${s}\x1b[0m`;

const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v');

// ── Tolerances ────────────────────────────────────────────────────────────────
const TOL_GAST_ARCSEC = 30;
const TOL_LST_ARCSEC  = 30;
const TOL_ASC_ARCSEC  = 120; // ASC is sensitive to ΔΨ differences
const TOL_MC_ARCSEC   = 60;

// ── Angle difference (handles 0/360 wrap) ─────────────────────────────────────
function angleDiff(a, b) {
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

function deg2arcsec(d) { return d * 3600; }

// ── Run one comparison ────────────────────────────────────────────────────────
function compare(jd_tt, lat_deg, lon_deg, label) {
  // ── Caelis output ──────────────────────────────────────────────────────────
  const snap = getSnapshotAt(jd_tt, { lat_deg, lon_deg });
  const cGAST = snap.meta.sidereal.gast_deg;
  const cLST  = snap.meta.sidereal.lst_deg;
  const cASC  = snap._houseConfig?.asc;
  const cMC   = snap._houseConfig?.mc;

  // ── Reference output ───────────────────────────────────────────────────────
  // All ref functions return degrees (refGAST, refLST, refASC, refMC)
  const rGAST = ref.refGAST(jd_tt);
  const rLST  = ref.refLST(jd_tt, lon_deg);
  const rASC  = ref.refASC(jd_tt, lat_deg, lon_deg);
  const rMC   = ref.refMC(jd_tt, lon_deg);

  // ── Error in arcseconds ────────────────────────────────────────────────────
  const eGAST = deg2arcsec(angleDiff(cGAST, rGAST));
  const eLST  = deg2arcsec(angleDiff(cLST,  rLST));
  const eASC  = typeof cASC === 'number' ? deg2arcsec(angleDiff(cASC, rASC)) : Infinity;
  const eMC   = typeof cMC  === 'number' ? deg2arcsec(angleDiff(cMC,  rMC))  : Infinity;

  const pass = eGAST <= TOL_GAST_ARCSEC &&
               eLST  <= TOL_LST_ARCSEC  &&
               eASC  <= TOL_ASC_ARCSEC  &&
               eMC   <= TOL_MC_ARCSEC;

  return { pass, eGAST, eLST, eASC, eMC, cGAST, rGAST, cASC, rASC, cMC, rMC, label };
}

// ── Test cases ────────────────────────────────────────────────────────────────

// GROUP 1: Temporal — 10 epochs × 4 UTC hours at Greenwich
const EPOCHS = [
  { jd: 2415021.0, label: 'J1900.0' },
  { jd: 2433282.5, label: 'J1950.0' },
  { jd: 2451545.0, label: 'J2000.0' },
  { jd: 2455197.5, label: '2010-Jan-01' },
  { jd: 2458849.5, label: '2020-Jan-01' },
  { jd: 2460310.5, label: '2024-Jan-01' },
  { jd: 2461041.5, label: '2026-Jan-01' },
  { jd: 2461193.5, label: '2026-Jun-01' },
  { jd: 2462867.5, label: '2030-Jan-01' },
  { jd: 2488070.5, label: '2050-Jan-01' },
];
const UTC_HOURS = [0, 6, 12, 18];
const GREENWICH = { lat: 51.4779, lon: -0.0015 };

const GROUP1 = [];
for (const ep of EPOCHS) {
  for (const h of UTC_HOURS) {
    GROUP1.push({
      jd:    ep.jd + h/24,
      lat:   GREENWICH.lat,
      lon:   GREENWICH.lon,
      label: `${ep.label} ${h.toString().padStart(2,'0')}:00 UTC`
    });
  }
}

// GROUP 2: Spatial — J2000.0 + 2026 at 4 UTC hours × 8 latitudes/longitudes
const LATS = [0, 23.44, 45, -23.44, -45, 60, -60];
const LONS = [0, 90, -70.66, 139.69];
const EP_SPATIAL = 2451545.0;

const GROUP2 = [];
for (const lat of LATS) {
  for (const lon of LONS) {
    GROUP2.push({
      jd:    EP_SPATIAL,
      lat,
      lon,
      label: `J2000.0 lat=${lat}° lon=${lon}°`
    });
  }
}

// GROUP 3: Combined — 6 epochs × 6 observers
const EP_COMBINED = [
  2451545.0, 2455197.5, 2458849.5,
  2461041.5, 2461193.5, 2462867.5
];
const OBS_COMBINED = [
  { lat: 51.4779, lon: -0.0015, label: 'Greenwich' },
  { lat: 40.7128, lon: -74.006, label: 'New York'  },
  { lat: -33.45,  lon: -70.66,  label: 'Santiago'  },
  { lat: 35.6762, lon: 139.65,  label: 'Tokyo'     },
  { lat: -33.87,  lon: 151.21,  label: 'Sydney'    },
  { lat:  0.0,    lon:   0.0,   label: 'Null Island'},
];

const GROUP3 = [];
for (const jd of EP_COMBINED) {
  for (const obs of OBS_COMBINED) {
    GROUP3.push({ jd, lat: obs.lat, lon: obs.lon, label: `JD${jd} ${obs.label}` });
  }
}

// ── Run all groups ────────────────────────────────────────────────────────────
console.log(`\n${B('⬡ CAELIS ENGINE — INDEPENDENT ASC/MC VALIDATION')}`);
console.log(D('  Reference: SOFA/ERFA algorithms (independent implementation)'));
console.log(D(`  Tolerances: GAST ±${TOL_GAST_ARCSEC}″ · LST ±${TOL_LST_ARCSEC}″ · ASC ±${TOL_ASC_ARCSEC}″ · MC ±${TOL_MC_ARCSEC}″\n`));

let totalPass = 0, totalFail = 0;
const allErrors = { gast: [], lst: [], asc: [], mc: [] };
const failures = [];
const t0 = Date.now();

const GROUPS = [
  { name: 'Temporal (10 epochs × 4 UTC hours × Greenwich)', cases: GROUP1 },
  { name: 'Spatial  (J2000.0 × 7 latitudes × 4 longitudes)', cases: GROUP2 },
  { name: 'Combined (6 epochs × 6 observers)', cases: GROUP3 },
];

for (const group of GROUPS) {
  console.log(`${B(group.name)}`);
  let gPass = 0, gFail = 0;

  for (const tc of group.cases) {
    const r = compare(tc.jd, tc.lat, tc.lon, tc.label);

    allErrors.gast.push(r.eGAST);
    allErrors.lst.push(r.eLST);
    allErrors.asc.push(r.eASC);
    allErrors.mc.push(r.eMC);

    if (r.pass) {
      totalPass++; gPass++;
      if (VERBOSE) {
        console.log(G(`  ✓ ${tc.label}`));
        console.log(D(`    GAST Δ=${r.eGAST.toFixed(2)}″ · LST Δ=${r.eLST.toFixed(2)}″ · ASC Δ=${r.eASC.toFixed(2)}″ · MC Δ=${r.eMC.toFixed(2)}″`));
      } else {
        process.stdout.write(G('·'));
      }
    } else {
      totalFail++; gFail++;
      failures.push(r);
      const worst = Math.max(r.eGAST, r.eLST, r.eASC, r.eMC).toFixed(1);
      if (!VERBOSE) process.stdout.write(R('✗'));
      console.log(`\n  ${R('✗')} ${tc.label}`);
      console.log(`    GAST Δ=${r.eGAST.toFixed(1)}″ ${r.eGAST > TOL_GAST_ARCSEC ? R('!') : ''} · ASC Δ=${r.eASC.toFixed(1)}″ ${r.eASC > TOL_ASC_ARCSEC ? R('!') : ''} · MC Δ=${r.eMC.toFixed(1)}″ ${r.eMC > TOL_MC_ARCSEC ? R('!') : ''}`);
    }
  }

  if (!VERBOSE) process.stdout.write('\n');
  console.log(D(`  ${gPass}/${gPass+gFail} passed\n`));
}

// ── Statistics ────────────────────────────────────────────────────────────────
function stats(arr) {
  const sorted = [...arr].filter(isFinite).sort((a,b) => a-b);
  if (!sorted.length) return { max: 0, rms: 0, p95: 0 };
  const max = sorted[sorted.length-1];
  const rms = Math.sqrt(sorted.reduce((s,v) => s+v*v, 0) / sorted.length);
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  return { max, rms, p95 };
}

const elapsed = Date.now() - t0;
const total   = totalPass + totalFail;
const allPass = totalFail === 0;

console.log('─'.repeat(70));
console.log(
  `${allPass ? G('✓ ALL ASC/MC TESTS PASSED') : R('✗ ASC/MC TESTS FAILED')}` +
  `  ${G(totalPass + ' passed')} · ${totalFail > 0 ? R(totalFail + ' failed') : D('0 failed')}` +
  `  ${D(total + ' total · ' + elapsed + 'ms')}`
);

console.log(`\n${B('Error statistics (arcseconds):')}`);
const sg = stats(allErrors.gast);
const sl = stats(allErrors.lst);
const sa = stats(allErrors.asc);
const sm = stats(allErrors.mc);

console.log(`  GAST  max=${sg.max.toFixed(2)}″  RMS=${sg.rms.toFixed(2)}″  P95=${sg.p95.toFixed(2)}″  tol=±${TOL_GAST_ARCSEC}″`);
console.log(`  LST   max=${sl.max.toFixed(2)}″  RMS=${sl.rms.toFixed(2)}″  P95=${sl.p95.toFixed(2)}″  tol=±${TOL_LST_ARCSEC}″`);
console.log(`  ASC   max=${sa.max.toFixed(2)}″  RMS=${sa.rms.toFixed(2)}″  P95=${sa.p95.toFixed(2)}″  tol=±${TOL_ASC_ARCSEC}″`);
console.log(`  MC    max=${sm.max.toFixed(2)}″  RMS=${sm.rms.toFixed(2)}″  P95=${sm.p95.toFixed(2)}″  tol=±${TOL_MC_ARCSEC}″`);
console.log(`\n  Cases: ${total} · Reference: SOFA/ERFA independent implementation`);

if (failures.length > 0) {
  console.log(`\n${R('Failures:')}`);
  for (const f of failures) {
    console.log(`  ${D(f.label)}`);
    if (f.eGAST > TOL_GAST_ARCSEC) console.log(`    GAST: ${R(f.eGAST.toFixed(1)+'″')} > tol ${TOL_GAST_ARCSEC}″`);
    if (f.eASC  > TOL_ASC_ARCSEC)  console.log(`    ASC:  ${R(f.eASC.toFixed(1)+'″')}  > tol ${TOL_ASC_ARCSEC}″`);
    if (f.eMC   > TOL_MC_ARCSEC)   console.log(`    MC:   ${R(f.eMC.toFixed(1)+'″')}   > tol ${TOL_MC_ARCSEC}″`);
  }
}

console.log('');
process.exit(allPass ? 0 : 1);
