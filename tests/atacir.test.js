/**
 * tests/atacir.test.js — Caelis Engine v3.0
 *
 * Cambios v3.0:
 *   - Mercurio en snapshots usa VSOP87B → RA/Dec ligeramente diferente (tolerancias OK)
 *   - moonPosition RA normalizado → NodoNorte.ra siempre positivo
 *   - Tests de NodoNorte añadidos
 *
 * Uso: node tests/atacir.test.js
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

const Atacir = require('../src/Atacir.js');
Object.assign(global, {
  calcAtacir:      Atacir.calcAtacir,
  calcSimetrias:   Atacir.calcSimetrias,
  calcCiclos:      Atacir.calcCiclos,
  calcResonancias: Atacir.calcResonancias,
  calcLunaAtacir:  Atacir.calcLunaAtacir,
  obliqAscension:  AstroCore.obliqAscension,
});

let passed = 0, failed = 0;
function test(name, actual, expected, tolerance) {
  const diff = Math.abs(actual - expected);
  const ok   = diff <= tolerance;
  console.log((ok ? '  ✓ ' : '  ✗ ') + name +
    (!ok ? ` → esp:${expected} obt:${typeof actual === 'number' ? actual.toFixed(4) : actual}` : ''));
  ok ? passed++ : failed++;
}

console.log('\n═══ Atacir v3.0 — Tests de verificación ═══\n');

// Snapshots de referencia
const jdRx = TimeEngine.dateToJD('1990-01-01', '12:00');
const jdTr = TimeEngine.dateToJD('2026-03-11', '12:00');
const rx   = TimeEngine.snapshotAt(jdRx, -33.45, -70.66);
const tr   = TimeEngine.snapshotAt(jdTr, -33.45, -70.66);

// ── Snapshot natal ────────────────────────────────────────────────
console.log('── Snapshot natal ──');
test('Snapshot natal válido',        rx.bodies ? 1:0, 1, 0);
test('Snapshot tránsito válido',     tr.bodies ? 1:0, 1, 0);
test('Sol en snapshot natal',        rx.bodies.Sol   ? 1:0, 1, 0);
test('Luna en snapshot natal',       rx.bodies.Luna  ? 1:0, 1, 0);
test('Mercurio en snapshot natal',   rx.bodies.Mercurio ? 1:0, 1, 0);
test('NodoNorte en snapshot natal',  rx.bodies.NodoNorte ? 1:0, 1, 0);

// v3.0: NodoNorte.ra debe ser siempre positivo (fix moonPosition normalización)
test('NodoNorte ra ≥ 0 (v3.0)',      rx.bodies.NodoNorte.ra >= 0 ? 1:0, 1, 0);
test('NodoNorte ra ≤ 360',           rx.bodies.NodoNorte.ra <= 360 ? 1:0, 1, 0);

// v3.0: Mercurio usa VSOP87B — lon_ecl diferente de v2.x pero dentro del rango
test('Mercurio lon_ecl en [0°,360°]', rx.bodies.Mercurio.lon_ecl >= 0 &&
  rx.bodies.Mercurio.lon_ecl <= 360 ? 1:0, 1, 0);

// ── calcAspectosNatales ───────────────────────────────────────────
console.log('── calcAspectosNatales ──');
const aspNatales = Atacir.calcAspectosNatales(rx);
test('Aspectos natales es array',    Array.isArray(aspNatales) ? 1:0, 1, 0);
test('Al menos 1 aspecto natal',     aspNatales.length > 0 ? 1:0, 1, 0);
test('Aspecto tiene tipo (asp)',     aspNatales[0]?.asp  ? 1:0, 1, 0);
test('Aspecto tiene orbe (orb)',     aspNatales[0]?.orb !== undefined ? 1:0, 1, 0);
test('Orbe en rango razonable',      Math.abs(aspNatales[0]?.orb) <= 10 ? 1:0, 1, 0);

// ── calcAspectosTransito ──────────────────────────────────────────
console.log('── calcAspectosTransito ──');
const aspTr = Atacir.calcAspectosTransito(rx, tr);
test('Aspectos tránsito es array',   Array.isArray(aspTr) ? 1:0, 1, 0);

// ── calcSimetrias ─────────────────────────────────────────────────
console.log('── calcSimetrias ──');
const sim = Atacir.calcSimetrias(rx);
test('Tiene antiscia',               Array.isArray(sim.antiscia) ? 1:0, 1, 0);
test('Tiene contrantiscia',          Array.isArray(sim.contrantiscia) ? 1:0, 1, 0);
test('Tiene ejeasc',                 Array.isArray(sim.ejeasc) ? 1:0, 1, 0);
test('Tiene ejemc',                  Array.isArray(sim.ejemc) ? 1:0, 1, 0);

// ── calcCiclos ────────────────────────────────────────────────────
console.log('── calcCiclos ──');
const ciclos = Atacir.calcCiclos(rx, tr);
test('Ciclos tiene array',           Array.isArray(ciclos.ciclos) ? 1:0, 1, 0);
test('Ciclos tiene ageNow',          typeof ciclos.ageNow === 'number' ? 1:0, 1, 0);
test('Edad 1990→2026 ~ 36 años',    ciclos.ageNow, 36.19, 0.5);
test('Al menos 7 cuerpos',          ciclos.ciclos.length >= 7 ? 1:0, 1, 0);

// ── calcResonancias ───────────────────────────────────────────────
console.log('── calcResonancias ──');
const reson = Atacir.calcResonancias(rx, tr);
test('Resonancias tiene array',      Array.isArray(reson.resonancias) ? 1:0, 1, 0);
test('Al menos 5 pares',            reson.resonancias.length >= 5 ? 1:0, 1, 0);
test('Par tiene Psyn',              typeof reson.resonancias[0]?.Psyn === 'number' ? 1:0, 1, 0);

// ── calcLunaAtacir ────────────────────────────────────────────────
console.log('── calcLunaAtacir ──');
const luna = Atacir.calcLunaAtacir(rx, tr);
test('Luna tiene fases',             Array.isArray(luna.fases) ? 1:0, 1, 0);
test('Luna tiene apsis',             Array.isArray(luna.apsis) ? 1:0, 1, 0);
test('Luna tiene elongNatal',        typeof luna.elongNatal === 'number' ? 1:0, 1, 0);
test('Luna tiene nLunaciones',       luna.nLunaciones > 0 ? 1:0, 1, 0);

// ── Módulo Atacir ─────────────────────────────────────────────────
console.log('── Módulo Atacir ──');
test('Atacir.HTML existe',           Atacir.HTML && Atacir.HTML.length > 100 ? 1:0, 1, 0);
test('Atacir.CSS existe',            Atacir.CSS  && Atacir.CSS.length  > 100 ? 1:0, 1, 0);
test('mount es función',             typeof Atacir.mount === 'function' ? 1:0, 1, 0);

// ── Resultado ─────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════');
console.log(`  Atacir v3.0 — ${passed} pasados, ${failed} fallidos`);
if (failed === 0) console.log('  ✅ Atacir verificado — listo para producción\n');
else { console.log(`  ⚠  ${failed} test(s) fallaron\n`); process.exit(1); }
