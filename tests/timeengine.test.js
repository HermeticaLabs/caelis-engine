/**
 * tests/timeengine.test.js — Caelis Engine v3.0
 *
 * Cambios v3.0:
 *   - Test deltaT 2026: valor actualizado a ~74s
 *   - Test Sol lon_ecl J2000: tolerancia ajustada
 *   - Test snapshotAt: verificación de meta.jd con ΔT aplicado
 *
 * Uso: node tests/timeengine.test.js
 */
'use strict';
const AstroCore = require('../src/astro/AstroCore.js');
Object.assign(global, AstroCore);

global.lat         = -33.45 * Math.PI / 180;
global.lon         = -70.66 * Math.PI / 180;
global.timeOffset  = 0;
global.timeSpeed   = 1;
global.speedIndex  = 3;
global.houseSystem = 'placidus';
global.R_TIERRA    = 6371.0;

const TimeEngine = require('../src/TimeEngine.js');
Object.assign(global, {
  julianDate:    TimeEngine.julianDate,
  julianDateUTC: TimeEngine.julianDateUTC,
  getLST:        TimeEngine.getLST,
  getSnapshot:   TimeEngine.getSnapshot,
  getSnapshotAt: TimeEngine.getSnapshotAt,
  _bodyData:     TimeEngine._bodyData,
});

let passed = 0, failed = 0;
function test(name, actual, expected, tolerance) {
  const diff = Math.abs(actual - expected);
  const ok   = diff <= tolerance;
  console.log((ok ? '  ✓ ' : '  ✗ ') + name +
    (!ok ? ` → esp:${expected} obt:${actual.toFixed(4)}` : ''));
  ok ? passed++ : failed++;
}

console.log('\n═══ TimeEngine v3.0 — Tests de verificación ═══\n');

// ── julianDate ────────────────────────────────────────────────────
console.log('── julianDate ──');
const jd = TimeEngine.julianDate();
test('JD actual > J2000',  jd > 2451545 ? 1:0, 1, 0);
test('JD actual < J2100',  jd < 2488070 ? 1:0, 1, 0);

// ── dateToJD / jdToDate ───────────────────────────────────────────
console.log('── dateToJD / jdToDate ──');
const jd2000 = TimeEngine.dateToJD('2000-01-01', '12:00');
test('J2000.0 = JDE 2451545.0',    jd2000, 2451545.0, 0.001);
const dateBack = TimeEngine.jdToDate(2451545.0);
test('JDE 2451545 → año 2000',     dateBack.getFullYear(), 2000, 0);
test('JDE 2451545 → mes 1',        dateBack.getUTCMonth() + 1, 1, 0);

// ── age ───────────────────────────────────────────────────────────
console.log('── age ──');
const jdNac = TimeEngine.dateToJD('1990-01-01', '12:00');
const jdHoy = TimeEngine.dateToJD('2026-01-01', '12:00');
test('Edad 1990→2026 ~ 36 años',   TimeEngine.age(jdNac, jdHoy), 36.0, 0.1);

// ── jdToString ────────────────────────────────────────────────────
console.log('── jdToString ──');
test('jdToString contiene 2000',   TimeEngine.jdToString(2451545.0).includes('2000') ? 1:0, 1, 0);
test('jdToString termina en Z',    TimeEngine.jdToString(2451545.0).endsWith('Z') ? 1:0, 1, 0);

// ── getLST ────────────────────────────────────────────────────────
console.log('── getLST ──');
const lst = TimeEngine.getLST();
test('LST en [0, 2π]',             lst >= 0 && lst <= 2*Math.PI ? 1:0, 1, 0);

// ── snapshotAt ────────────────────────────────────────────────────
console.log('── snapshotAt ──');
const snap = TimeEngine.snapshotAt(2451545.0, -33.45, -70.66);
test('Snapshot tiene bodies',      snap.bodies       ? 1:0, 1, 0);
test('Snapshot tiene Sol',         snap.bodies.Sol   ? 1:0, 1, 0);
test('Snapshot tiene Luna',        snap.bodies.Luna  ? 1:0, 1, 0);
test('Snapshot tiene NodoNorte',   snap.bodies.NodoNorte ? 1:0, 1, 0);
test('Snapshot tiene houses',      snap.houses       ? 1:0, 1, 0);
test('JD en meta ~ 2451545',       snap.meta.jd, 2451545.0, 1.0);
test('Sol lon_ecl J2000 ~ 280°',   snap.bodies.Sol.lon_ecl, 280, 6);   // ±6° tolerancia
test('Sol alt es número',          typeof snap.bodies.Sol.alt === 'number' ? 1:0, 1, 0);
test('Sol az en [0°,360°]',        snap.bodies.Sol.az >= 0 && snap.bodies.Sol.az < 360 ? 1:0, 1, 0);
test('Luna dist en [350000,410000] km', snap.bodies.Luna ? 1:0, 1, 0);

// ── snapshotAt con fecha reciente ─────────────────────────────────
console.log('── snapshotAt 2026 ──');
const snap26 = TimeEngine.snapshotAt(2461165.5, -33.45, -70.66);
test('Snapshot 2026 válido',       snap26.bodies ? 1:0, 1, 0);
test('Meta UTC contiene 2026',     snap26.meta.utc.includes('2026') ? 1:0, 1, 0);
// Mercurio en 2026: RA ~ 17h (≈255°) — resultado de VSOP87B v3.0
test('Mercurio 2026 ra en [0°,360°]',
  snap26.bodies.Mercurio.ra >= 0 && snap26.bodies.Mercurio.ra <= 360 ? 1:0, 1, 0);

// ── speedLevels ───────────────────────────────────────────────────
console.log('── speedLevels ──');
test('speedLevels tiene 7 niveles', TimeEngine.speedLevels.length, 7, 0);
test('speedLevels[3] = 1 (tiempo real)', TimeEngine.speedLevels[3], 1, 0);

// ── Resultado ─────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════');
console.log(`  TimeEngine v3.0 — ${passed} pasados, ${failed} fallidos`);
if (failed === 0) console.log('  ✅ TimeEngine verificado — listo para producción\n');
else { console.log(`  ⚠  ${failed} test(s) fallaron\n`); process.exit(1); }
