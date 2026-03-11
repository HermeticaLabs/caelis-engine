
const AstroCore  = require('../src/astro/AstroCore.js');
Object.assign(global, AstroCore);

global.lat        = -33.45 * Math.PI/180;
global.lon        = -70.66 * Math.PI/180;
global.timeOffset = 0;
global.timeSpeed  = 1;
global.speedIndex = 3;
global.houseSystem = 'placidus';
global.R_TIERRA   = 6371.0;

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
  calcAtacir:         Atacir.calcAtacir,
  calcSimetrias:      Atacir.calcSimetrias,
  calcCiclos:         Atacir.calcCiclos,
  calcResonancias:    Atacir.calcResonancias,
  calcLunaAtacir:     Atacir.calcLunaAtacir,
  obliqAscension:     AstroCore.obliqAscension,
});

let passed=0, failed=0;
function test(name, actual, expected, tolerance){
  const diff = Math.abs(actual-expected);
  const ok = diff <= tolerance;
  console.log((ok?'  ✓ ':'  ✗ ')+name+(!ok?' → esp:'+expected+' obt:'+actual.toFixed(4):''));
  ok?passed++:failed++;
}

console.log('\n═══ Atacir — Tests de verificación ═══\n');

// Snapshot de referencia: Santiago, 1990-01-01
const jdRx = TimeEngine.dateToJD('1990-01-01','12:00');
const jdTr = TimeEngine.dateToJD('2026-03-11','12:00');
const rx   = TimeEngine.snapshotAt(jdRx, -33.45, -70.66);
const tr   = TimeEngine.snapshotAt(jdTr, -33.45, -70.66);

console.log('── Snapshot natal ──');
test('Snapshot natal válido',  rx.bodies ? 1 : 0, 1, 0);
test('Snapshot tránsito válido', tr.bodies ? 1 : 0, 1, 0);
test('Sol en snapshot natal',  rx.bodies.Sol ? 1 : 0, 1, 0);
test('Luna en snapshot natal', rx.bodies.Luna ? 1 : 0, 1, 0);

console.log('── calcAspectosNatales ──');
const aspNatales = Atacir.calcAspectosNatales(rx);
test('Aspectos natales es array',  Array.isArray(aspNatales) ? 1 : 0, 1, 0);
test('Al menos 1 aspecto natal',   aspNatales.length > 0 ? 1 : 0, 1, 0);
test('Aspecto tiene asp(tipo)',     aspNatales[0]?.asp  ? 1 : 0, 1, 0);
test('Aspecto tiene orb(orbe)',     aspNatales[0]?.orb !== undefined ? 1 : 0, 1, 0);

console.log('── calcAspectosTransito ──');
const aspTransito = Atacir.calcAspectosTransito(rx, tr);
test('Aspectos tránsito es array', Array.isArray(aspTransito) ? 1 : 0, 1, 0);

console.log('── calcSimetrias ──');
const sim = Atacir.calcSimetrias(rx);
test('Simetrías tiene antiscia',      Array.isArray(sim.antiscia) ? 1 : 0, 1, 0);
test('Simetrías tiene contrantiscia', Array.isArray(sim.contrantiscia) ? 1 : 0, 1, 0);
test('Simetrías tiene ejeasc',        Array.isArray(sim.ejeasc) ? 1 : 0, 1, 0);
test('Simetrías tiene ejemc',         Array.isArray(sim.ejemc) ? 1 : 0, 1, 0);

console.log('── calcCiclos ──');
const ciclos = Atacir.calcCiclos(rx, tr);
test('Ciclos tiene array',       Array.isArray(ciclos.ciclos) ? 1 : 0, 1, 0);
test('Ciclos tiene ageNow',      typeof ciclos.ageNow === 'number' ? 1 : 0, 1, 0);
test('Edad ~36 años',            ciclos.ageNow, 36.19, 0.5);
test('Al menos 7 cuerpos',       ciclos.ciclos.length >= 7 ? 1 : 0, 1, 0);

console.log('── calcResonancias ──');
const reson = Atacir.calcResonancias(rx, tr);
test('Resonancias tiene array',  Array.isArray(reson.resonancias) ? 1 : 0, 1, 0);
test('Al menos 5 pares',         reson.resonancias.length >= 5 ? 1 : 0, 1, 0);
test('Par tiene Psyn',           typeof reson.resonancias[0]?.Psyn === 'number' ? 1 : 0, 1, 0);

console.log('── calcLunaAtacir ──');
const luna = Atacir.calcLunaAtacir(rx, tr);
test('Luna tiene fases',         Array.isArray(luna.fases) ? 1 : 0, 1, 0);
test('Luna tiene apsis',         Array.isArray(luna.apsis) ? 1 : 0, 1, 0);
test('Luna tiene elongNatal',    typeof luna.elongNatal === 'number' ? 1 : 0, 1, 0);
test('Luna tiene nLunaciones',   luna.nLunaciones > 0 ? 1 : 0, 1, 0);

console.log('── Módulo Atacir ──');
test('Atacir.HTML existe',       Atacir.HTML && Atacir.HTML.length > 100 ? 1 : 0, 1, 0);
test('Atacir.CSS existe',        Atacir.CSS  && Atacir.CSS.length  > 100 ? 1 : 0, 1, 0);
test('mount es función',         typeof Atacir.mount === 'function' ? 1 : 0, 1, 0);

console.log('\n═══════════════════════════════════════');
console.log('Resultado: '+passed+' pasados, '+failed+' fallidos');
console.log(failed===0?'✓ Atacir verificado — listo para producción\n':'⚠ Revisar fallidos\n');
