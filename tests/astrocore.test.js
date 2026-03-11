/**
 * tests/astrocore.test.js
 * Verificación del AstroCore contra valores de referencia Meeus
 * Ejecutar: node tests/astrocore.test.js
 */
eval(require('fs').readFileSync('./src/astro/AstroCore.js', 'utf8'));

let passed = 0, failed = 0;
function test(name, actual, expected, tolerance) {
  const diff = Math.abs(actual - expected);
  const ok = diff <= tolerance;
  if (ok) { console.log('  ✓ '+name); passed++; }
  else {
    console.log('  ✗ '+name);
    console.log('    Esperado: '+expected+' ± '+tolerance);
    console.log('    Obtenido: '+actual+' (diff: '+diff.toFixed(4)+')');
    failed++;
  }
}

console.log('\n═══ AstroCore — Tests de verificación ═══\n');

console.log('── deltaT ──');
test('deltaT J2000 ~ 63.8s', deltaT(2451545.0), 63.8, 2.0);

console.log('── Nutación (Meeus Cap.22) ──');
const nut = nutation((2446895.5 - 2451545) / 36525);
test('deltaPsi ~ -3.788 arcsec', nut.deltaPsi * rad2deg * 3600, -3.788, 0.5);
test('deltaEps ~ +9.443 arcsec', nut.deltaEps * rad2deg * 3600,  9.443, 0.5);

console.log('── Oblicuidad ──');
test('Oblicuidad J2000 ~ 23.4393°', trueObliquity(0) * rad2deg, 23.4393, 0.01);

console.log('── Luna ELP2000 (Meeus Cap.47) ──');
test('Distancia lunar 1992-04-12 ~ 368409 km', lunarDistELP(2448724.5), 368409.7, 100);

console.log('── Fases lunares (Meeus Cap.49) ──');
// k=1: primera luna nueva después de J2000
const jde_nueva = lunarPhaseJDE(1, 0);
test('Luna nueva k=1 es JDE válido', jde_nueva > 2451545 && jde_nueva < 2452000 ? 1 : 0, 1, 0);

console.log('── Apsis lunares (Meeus Cap.50) ──');
// k=0: perigeo cercano a J2000
const jde_perigeo = lunarApsisJDE(0, false);
test('Perigeo k=0 es JDE válido', jde_perigeo > 2451400 && jde_perigeo < 2451700 ? 1 : 0, 1, 0);

console.log('── VSOP87 Venus ──');
const venus = vsop87Venus(0);
test('Venus R ~ 0.72 UA en J2000', venus.R, 0.72, 0.05);
test('Venus datos válidos', isNaN(venus.L) ? 0 : 1, 1, 0);

console.log('── Placidus ──');
const cusps = placidusHouseCusps(0, 0, 23.4393 * deg2rad);
test('Placidus: 12 cúspides', cusps.length, 12, 0);

console.log('\n═══════════════════════════════════════');
console.log('Resultado: '+passed+' pasados, '+failed+' fallidos');
if(failed === 0) console.log('✓ AstroCore verificado — listo para producción\n');
else console.log('⚠ Revisar los tests fallidos\n');
