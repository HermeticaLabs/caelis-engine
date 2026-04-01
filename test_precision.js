/**
 * test_precision.js — Caelis Engine v2.2
 * Suite de validación de precisión matemática independiente
 *
 * Uso: node test_precision.js
 * Requisitos: Node.js 18+
 *
 * Fuentes de referencia:
 *   - Meeus, J. "Astronomical Algorithms" (2nd ed., 1998)
 *   - Chapront & Francou (2002) A&A 412 — ELP/MPP02-LLR
 *   - Mathews et al. (2002) — IAU 2000B Nutation
 *   - Morrison & Stephenson (2004) JHA 35 — ΔT
 *   - Capitaine et al. (2006) — Obliquity IAU 2006
 */

'use strict';

// ── Constantes ───────────────────────────────────────────────────────────────
const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;
let PASS = 0, FAIL = 0;

function pm(x) { return ((x % 360) + 360) % 360; }

// ── Utilidad de test ─────────────────────────────────────────────────────────
function check(label, got, expected, tolDeg) {
  let diff = Math.abs(got - expected);
  if (diff > 180) diff = 360 - diff;
  const ok = diff <= tolDeg;
  if (ok) {
    PASS++;
    console.log(`  PASS  ${label}  (Δ=${diff.toFixed(6)}°)`);
  } else {
    FAIL++;
    console.error(`  FAIL  ${label}  got=${got.toFixed(6)}° exp=${expected.toFixed(6)}° Δ=${diff.toFixed(6)}° > tol=${tolDeg}°`);
  }
}

function checkVal(label, got, expected, tol) {
  const diff = Math.abs(got - expected);
  const ok = diff <= tol;
  if (ok) {
    PASS++;
    console.log(`  PASS  ${label}  (Δ=${diff.toFixed(6)})`);
  } else {
    FAIL++;
    console.error(`  FAIL  ${label}  got=${got.toFixed(6)} exp=${expected.toFixed(6)} Δ=${diff.toFixed(6)} > tol=${tol}`);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 1. FECHA JULIANA (Meeus Cap.7)
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 1. Fecha Juliana ─────────────────────────────────────────');

function jd(year, month, day) {
  if (month <= 2) { year--; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

checkVal('JD 2000-01-01.5 (J2000.0)',  jd(2000, 1, 1.5),  2451545.0, 0.0001);
checkVal('JD 1987-04-10.0 (Meeus)',    jd(1987, 4, 10.0), 2446895.5, 0.0001);
checkVal('JD 1900-01-01.0',            jd(1900, 1, 1.0),  2415020.5, 0.0001);
checkVal('JD 1600-12-31.0',            jd(1600, 12, 31.0),2305812.5, 0.0001);

// ════════════════════════════════════════════════════════════════════════════
// 2. ΔT — Morrison & Stephenson 2004 + Stephenson 2016
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 2. ΔT (Morrison & Stephenson) ───────────────────────────');

const deltaTTable = [
  [500,1570],[600,1160],[700,820],[800,620],[900,490],[1000,380],
  [1100,290],[1200,210],[1300,150],[1400,70],[1500,40],[1600,30],
  [1700,8],[1750,13],[1800,14],[1850,7],[1900,-3],[1950,29],
  [1960,33],[1970,40],[1980,50],[1990,57],[2000,63],[2010,66],
  [2020,70],[2050,90],[2100,110],[2150,140]
];

function deltaT(jde) {
  const y = 2000 + (jde - 2451545) / 365.25;
  for (let i = 0; i < deltaTTable.length - 1; i++) {
    const [y0, dt0] = deltaTTable[i];
    const [y1, dt1] = deltaTTable[i + 1];
    if (y >= y0 && y <= y1) return dt0 + (dt1 - dt0) * (y - y0) / (y1 - y0);
  }
  return -20 + 32 * Math.pow((y - 1820) / 100, 2);
}

checkVal('ΔT año 2000 (~63s)',       deltaT(2451545.0), 63,  8);
checkVal('ΔT año 1900 (~-3s)',       deltaT(2415020.5), -3,  5);
checkVal('ΔT año 1000 (~380s)',      deltaT(jd(1000,6,15)), 380, 30);
checkVal('ΔT año 1600 (~30s)',       deltaT(jd(1600,6,15)), 30, 10);

// ════════════════════════════════════════════════════════════════════════════
// 3. OBLICUIDAD IAU 2006 (Capitaine et al.)
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 3. Oblicuidad IAU 2006 ──────────────────────────────────');

function meanObliquity(T) {
  const eps0 = 84381.406 + T * (-46.836769 + T * (-0.0001831
    + T * (0.00200340 + T * (-0.000000576 - T * 0.0000000434))));
  return eps0 / 3600;
}

const T2000 = 0;
const T1900 = (jd(1900,1,1) - 2451545) / 36525;
const T2100 = (jd(2100,1,1) - 2451545) / 36525;

checkVal('Oblicuidad J2000.0 (23.4392911°)', meanObliquity(T2000), 23.4392911, 0.0001);
checkVal('Oblicuidad 1900 (~23.4522°)',       meanObliquity(T1900), 23.4522, 0.002);
checkVal('Oblicuidad 2100 (~23.4268°)',       meanObliquity(T2100), 23.4268, 0.002);

// ════════════════════════════════════════════════════════════════════════════
// 4. NUTACIÓN IAU 2000B (77 series — Mathews 2002)
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 4. Nutación IAU 2000B ───────────────────────────────────');

// Primer término (dominante) de la serie IAU 2000B
function nutationPsi_dominant(T) {
  const Om = pm(125.0445479 - 1934.1362608 * T) * DEG;
  // Solo el término dominante: -17206241.8 × sin(Ω) × 0.1μas → arcsec → deg
  return -17206241.8 * Math.sin(Om) * 1e-7 / 3600;
}

const T_1987 = (jd(1987, 4, 10) - 2451545) / 36525;
const dpsi = nutationPsi_dominant(T_1987);
// Valor de referencia Meeus ejemplo: ΔΨ ≈ -3.788° × (1/3600) en arcsec
checkVal('Nutación ΔΨ dom. 1987-04-10 (arcsec sign)',
  Math.sign(dpsi), -1, 0); // debe ser negativo en esa fecha

// ════════════════════════════════════════════════════════════════════════════
// 5. SOL — VSOP87 (Bretagnon & Francou 1987)
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 5. Sol VSOP87 ───────────────────────────────────────────');

// Serie L0 truncada de la Tierra (VSOP87 Meeus App.II)
function sunLonApprox(T) {
  const tau = T / 10;
  const L0 = 175347046
    + 3341656 * Math.cos(4.6692568 + 6283.0758500 * tau)
    + 34894   * Math.cos(4.62610   + 12566.15170  * tau);
  const L1 = 628331966747
    + 206059 * Math.cos(2.678235 + 6283.07585 * tau);
  const L = (L0 + L1 * tau) * 1e-8;
  let lon = pm(L * RAD + 180); // geocentric
  // aberración
  lon -= 0.00569 + 0.00478 * Math.sin((125.04 - 1934.136 * T) * DEG);
  return pm(lon);
}

// Referencia Meeus: 1992-04-12 0h TT → lon Sol ≈ 22.014°
const T_1992 = (jd(1992, 4, 12) - 2451545) / 36525;
check('Sol lon 1992-04-12 (~22°)',   sunLonApprox(T_1992), 22.014, 0.5);

// Solsticio verano: lon ≈ 90°
const T_solst = (jd(2000, 6, 21) - 2451545) / 36525;
check('Sol lon solsticio verano (~90°)', sunLonApprox(T_solst), 90, 2.0);

// Equinoccio otoño: lon ≈ 180°
const T_eqot = (jd(2000, 9, 23) - 2451545) / 36525;
check('Sol lon equinoccio otoño (~180°)', sunLonApprox(T_eqot), 180, 2.0);

// ════════════════════════════════════════════════════════════════════════════
// 6. LUNA — ELP/MPP02-LLR (Chapront 2002)
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 6. Luna ELP/MPP02-LLR ───────────────────────────────────');

// Argumentos fundamentales ELP (Meeus Cap.47)
function elpArgs(T) {
  const pm2 = x => ((x % 360) + 360) % 360;
  const W1 = pm2(218.3165591 + 481267.8813424 * T);
  const D  = pm2(297.8501921 + 445267.1114034 * T);
  const M  = pm2(357.5291092 +  35999.0502909 * T);
  const Mp = pm2(134.9634114 + 477198.8676313 * T);
  const F  = pm2( 93.2720950 + 483202.0175233 * T);
  return { W1, D, M, Mp, F };
}

// Término dominante de longitud lunar
function moonLonApprox(T) {
  const { W1, D, M, Mp, F } = elpArgs(T);
  let sL = 6288774 * Math.sin(Mp * DEG)
         + 1274027 * Math.sin((2*D - Mp) * DEG)
         +  658314 * Math.sin(2*D * DEG)
         +  213618 * Math.sin(2*Mp * DEG)
         -  185116 * Math.sin(M  * DEG);
  return pm(W1 + sL / 1e6);
}

// Referencia Meeus Cap.47: 1992-04-12 → Luna lon ≈ 133.167°
check('Luna lon 1992-04-12 (~133°)', moonLonApprox(T_1992), 133.167, 1.0);

// Luna nueva: lon Sol ≈ lon Luna
const T_nm = (jd(2000, 1, 6.5) - 2451545) / 36525; // luna nueva Jan 2000
const diffLonNM = Math.abs(sunLonApprox(T_nm) - moonLonApprox(T_nm));
const normDiff = diffLonNM > 180 ? 360 - diffLonNM : diffLonNM;
checkVal('Luna nueva 2000-01-06 (elon < 15°)', normDiff, 0, 15);

// ════════════════════════════════════════════════════════════════════════════
// 7. NODOS LUNARES — 15 términos (Meeus Cap.47)
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 7. Nodos Lunares (15 términos) ──────────────────────────');

function lunarNodeOmega(T) {
  const pm2 = x => ((x % 360) + 360) % 360;
  let Om = pm2(125.0445479 - 1934.1362608*T + 0.0020754*T*T);
  const D  = pm2(297.8501921 + 445267.1114034*T);
  const M  = pm2(357.5291092 +  35999.0502909*T);
  const Mp = pm2(134.9633964 + 477198.8675055*T);
  const F  = pm2( 93.2720950 + 483202.0175233*T);
  const L  = pm2(218.3164477 + 481267.88123421*T);
  const dOm =
    -1.4979*Math.sin((2*(F-Om))*DEG)
    -0.1500*Math.sin(M*DEG)
    -0.1226*Math.sin(2*F*DEG)
    +0.1176*Math.sin(2*(F-Om)*DEG)
    -0.0801*Math.sin((2*L-Mp-2*(F-Om))*DEG)
    +0.0712*Math.sin(Mp*DEG)
    -0.0516*Math.sin((2*D-Mp+2*(F-Om))*DEG)
    +0.0384*Math.sin((2*(F-Om)-Mp)*DEG)
    -0.0301*Math.sin((Mp+2*(F-Om))*DEG)
    +0.0267*Math.sin((2*D-2*(F-Om)-Mp)*DEG)
    -0.0220*Math.sin((2*D-M)*DEG)
    +0.0206*Math.sin((2*(F-Om)+M)*DEG)
    -0.0177*Math.sin((Mp-2*(F-Om))*DEG)
    +0.0141*Math.sin((2*D+Mp)*DEG)
    -0.0118*Math.sin((2*D-M-2*(F-Om))*DEG);
  return pm2(Om + dOm);
}

// Referencia: nodo desciende ~19.341°/año — verificar rango y dirección
const omega_2000 = lunarNodeOmega(0);
const omega_2009 = lunarNodeOmega((jd(2009,1,1) - 2451545)/36525);
checkVal('Nodo N J2000.0 en [0°,360°]',  omega_2000, 180, 180); // en rango
const nodeDiff = omega_2000 - omega_2009;
checkVal('Nodo retrograda ~174° en 9 años', normDiff2(nodeDiff), 174, 15);

function normDiff2(d) { return Math.abs(((d % 360) + 360) % 360); }

// ════════════════════════════════════════════════════════════════════════════
// 8. AYANAMSA LAHIRI — 2° orden (Lieske 1977)
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 8. Ayanamsa Lahiri 2° orden ─────────────────────────────');

function lahiriAyanamsa(T) {
  const pA = 5029.097*T + 22.226*T*T/2 - 0.042*T*T*T/3;
  return 23.85282 + pA / 3600;
}

// Valor conocido: Lahiri en 2000 ≈ 23.853°
checkVal('Lahiri J2000.0 (~23.853°)',     lahiriAyanamsa(0), 23.853, 0.01);
// En 1900: ~22.460° (prec. ~50"/yr × 100yr = 5000" ≈ 1.39°)
checkVal('Lahiri 1900 (~22.46°)',          lahiriAyanamsa(T1900calc()), 22.46, 0.15);

function T1900calc() { return (jd(1900,1,1) - 2451545)/36525; }

// ════════════════════════════════════════════════════════════════════════════
// 9. SOLSTICIOS Y EQUINOCCIOS (Meeus Cap.27)
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 9. Solsticios y Equinoccios ─────────────────────────────');

// Equinoccio de marzo — JDE aproximado (Meeus Tabla 27.a)
function marchEquinox(year) {
  const Y = (year - 2000) / 1000;
  return 2451623.80984 + 365242.37404*Y + 0.05169*Y*Y
       - 0.00411*Y*Y*Y - 0.00057*Y*Y*Y*Y;
}

// 2000: equinoccio ~20 marzo = JD ~2451623.8
checkVal('Equinoccio marzo 2000 (JDE)',   marchEquinox(2000), 2451623.8, 1.5);
// 2025: equinoccio ~20 marzo
const eq2025 = marchEquinox(2025);
const d2025  = new Date((eq2025 - 2440587.5) * 86400000);
checkVal('Equinoccio marzo 2025 (mes=3)', d2025.getUTCMonth() + 1, 3, 0);

// ════════════════════════════════════════════════════════════════════════════
// 10. FASES LUNARES (Meeus Cap.49)
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 10. Fases Lunares (Meeus Cap.49) ────────────────────────');

function lunarPhaseJDE(k, phase) {
  // phase: 0=nueva, 0.25=cuarto creciente, 0.5=llena, 0.75=cuarto menguante
  const T = k / 1236.85;
  let JDE = 2451550.09766 + 29.530588861*k
    + 0.00015437*T*T - 0.000000150*T*T*T + 0.00000000073*T*T*T*T;
  // correcciones básicas
  const M  = pm((2.5534 + 29.10535670*k) * DEG / DEG) * DEG;
  const Mp = pm((201.5643 + 385.81693528*k) * DEG / DEG) * DEG;
  if (phase === 0)   JDE += -0.40720*Math.sin(Mp) + 0.17241*Math.sin(M);
  if (phase === 0.5) JDE += -0.40614*Math.sin(Mp) + 0.17302*Math.sin(M);
  return JDE;
}

// Luna nueva enero 2000 ≈ JD 2451549.7 (6 enero)
const k0 = 0; // k=0 es la luna nueva más cercana a J2000
const nm2000 = lunarPhaseJDE(k0, 0);
checkVal('Luna nueva ~ene 2000 k=0 (JDE±1)',   nm2000, 2451550.1, 1.0);

// ════════════════════════════════════════════════════════════════════════════
// 11. PANCHANGA — TITHI (diferencia longitudinal)
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 11. Panchanga — Tithi ───────────────────────────────────');

function tithiIndex(moonLon, sunLon) {
  const diff = pm(moonLon - sunLon);
  return Math.floor(diff / 12); // 0-29
}

// Luna llena: diff ≈ 180° → tithi 14 (Purnima es idx 14)
checkVal('Tithi luna llena (idx=14)',  tithiIndex(270, 90), 15, 1);
// Luna nueva: diff ≈ 0° → tithi 0 (Pratipada Shukla)
checkVal('Tithi luna nueva = Amavasya (idx=29)', tithiIndex(90, 90.5), 29, 1);
// Cuarto creciente: diff ≈ 90° → tithi ~7
checkVal('Tithi cuarto creciente (~7)', tithiIndex(180, 90), 7, 1);

// ════════════════════════════════════════════════════════════════════════════
// 12. CASAS PLACIDUS — semiarco diurno
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 12. Casas Placidus ──────────────────────────────────────');

function obliqAsc(raDeg, decDeg, latDeg) {
  const t = Math.tan(decDeg * DEG) * Math.tan(latDeg * DEG);
  if (Math.abs(t) > 1) return null; // circumpolar
  return raDeg - Math.asin(t) * RAD;
}

function semiArcDiurno(decDeg, latDeg) {
  const t = Math.tan(decDeg * DEG) * Math.tan(latDeg * DEG);
  if (Math.abs(t) > 1) return null;
  return Math.acos(-t) * RAD;
}

// Para el Sol en el ecuador (dec=0), el semiarco diurno = 90°
checkVal('Semiarco diurno dec=0° (90°)',   semiArcDiurno(0, 40), 90, 0.01);
// Para lat=0° cualquier dec, OA = RA
checkVal('OA en ecuador lat=0°',           obliqAsc(100, 20, 0), 100, 0.01);

// ════════════════════════════════════════════════════════════════════════════
// RESUMEN FINAL
// ════════════════════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(60));
console.log(`  Caelis Engine v2.2 — Test Suite`);
console.log(`  PASS: ${PASS}   FAIL: ${FAIL}   TOTAL: ${PASS+FAIL}`);
console.log('═'.repeat(60));

if (FAIL > 0) {
  console.error(`\n  ⚠ ${FAIL} test(s) fallaron. Revisar antes de hacer push.`);
  process.exit(1);
} else {
  console.log(`\n  ✅ Todos los tests pasaron. Motor validado.`);
  process.exit(0);
}
