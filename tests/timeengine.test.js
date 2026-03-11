
const AstroCore = require('../src/astro/AstroCore.js');
Object.assign(global, AstroCore);

// Todos los globals del monolito que TimeEngine necesita
global.lat         = -33.45 * Math.PI/180;
global.lon         = -70.66 * Math.PI/180;
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

let passed=0, failed=0;
function test(name, actual, expected, tolerance){
  const diff = Math.abs(actual-expected);
  const ok = diff <= tolerance;
  console.log((ok?'  ✓ ':'  ✗ ')+name+(!ok?' → esp:'+expected+' obt:'+actual.toFixed(4):''));
  ok?passed++:failed++;
}

console.log('\n═══ TimeEngine — Tests de verificación ═══\n');

console.log('── julianDate ──');
const jd = TimeEngine.julianDate();
test('JD actual > J2000', jd > 2451545 ? 1 : 0, 1, 0);
test('JD actual < J2100', jd < 2488070 ? 1 : 0, 1, 0);

console.log('── dateToJD / jdToDate ──');
const jd2000 = TimeEngine.dateToJD('2000-01-01','12:00');
test('J2000.0 = JDE 2451545.0', jd2000, 2451545.0, 0.001);
const dateBack = TimeEngine.jdToDate(2451545.0);
test('JDE 2451545 → año 2000', dateBack.getFullYear(), 2000, 0);

console.log('── age ──');
const jdNac = TimeEngine.dateToJD('1990-01-01','12:00');
const jdHoy = TimeEngine.dateToJD('2026-01-01','12:00');
test('Edad 1990→2026 ~ 36 años', TimeEngine.age(jdNac, jdHoy), 36.0, 0.1);

console.log('── jdToString ──');
test('jdToString contiene 2000', TimeEngine.jdToString(2451545.0).includes('2000') ? 1 : 0, 1, 0);

console.log('── getLST ──');
const lst = TimeEngine.getLST();
test('LST es número válido (0-2π)', lst >= 0 && lst <= 2*Math.PI ? 1 : 0, 1, 0);

console.log('── snapshotAt ──');
const snap = TimeEngine.snapshotAt(2451545.0, -33.45, -70.66);
test('Snapshot tiene bodies',    snap.bodies       ? 1 : 0, 1, 0);
test('Snapshot tiene Sol',       snap.bodies.Sol   ? 1 : 0, 1, 0);
test('Snapshot tiene Luna',      snap.bodies.Luna  ? 1 : 0, 1, 0);
test('Snapshot tiene houses',    snap.houses       ? 1 : 0, 1, 0);
test('Snapshot JD correcto',     snap.meta.jd, 2451545.0, 1.0);
test('Sol lon_ecl J2000 ~ 280°', snap.bodies.Sol.lon_ecl, 280, 5);

console.log('\n═══════════════════════════════════════');
console.log('Resultado: '+passed+' pasados, '+failed+' fallidos');
console.log(failed===0?'✓ TimeEngine verificado — listo para producción\n':'⚠ Revisar fallidos\n');
