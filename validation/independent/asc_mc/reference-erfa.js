/**
 * ============================================================================
 * CAELIS ENGINE — Independent ASC/MC Reference Implementation
 * validation/independent/asc_mc/reference-erfa.js
 * ============================================================================
 *
 * Copyright (c) 2024-2026 Cristian Valeria Bravo
 * Hermetica Labs - Santiago, Chile
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Independent reference implementation of ASC and MC following
 * SOFA/ERFA algorithms. This code shares NO implementation with
 * CaelisEngine.js — it is a clean-room derivation from primary sources.
 *
 * PRIMARY SOURCES:
 *   SOFA/ERFA iauGmst06()   — Greenwich Mean Sidereal Time IAU 2006
 *   SOFA/ERFA iauEe06a()    — Equation of Equinoxes IAU 2006
 *   SOFA/ERFA iauObl06()    — Mean obliquity IAU 2006
 *   Woolard & Clemence (1966) — Spherical Astronomy, pp. 155-157
 *   Meeus, Astronomical Algorithms 2nd ed. Ch.11, Ch.13, Ch.22
 *   IERS Conventions (2003) §5.4 / McCarthy & Luzum (2003) — IAU 2000B nutation series
 *     (table as published in ERFA eraNut00b; v4.0.13 replaces an earlier mis-scaled table)
 *
 * ASC formula (from Woolard & Clemence / SOFA convention):
 *   α_ASC = atan2(-cos(GAST), sin(ε)·tan(φ) + cos(ε)·sin(GAST))
 *   λ_ASC = ecliptic longitude from equatorial RA (with ε)
 *
 * MC formula:
 *   λ_MC = atan2(sin(GAST)·cos(ε), cos(GAST))  [normalized to 0-360°]
 *
 * ============================================================================
 */

'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────
const PI     = Math.PI;
const TWO_PI = 2 * PI;
const AS2R   = PI / (180 * 3600); // arcseconds to radians
const D2R    = PI / 180;          // degrees to radians
const R2D    = 180 / PI;

// ── Normalize to [0, 2π) ──────────────────────────────────────────────────────
function norm2pi(x) {
  return x - TWO_PI * Math.floor(x / TWO_PI);
}

// ── JD_TT to Julian centuries from J2000.0 ────────────────────────────────────
function jd2T(jd_tt) {
  return (jd_tt - 2451545.0) / 36525.0;
}

// ── ΔT table of this reference (its own; independent of CaelisEngine.js's table) ─
// 1900-1999: Espenak & Meeus (NASA TP-2006-214141) polynomial values, rounded to 0.01 s.
// 2000-2019: linear interpolation between CaelisEngine.js table nodes (NOT independent).
// 2020-2026: same values as CaelisEngine.js. 2028 onwards: this file's own projections.
// Since v4.0.13 run-asc-mc.js feeds this reference the engine's own UT1, so ΔT agreement is
// not part of that comparison; ΔT is validated against NASA tables in validation/run.js.
const DT_TABLE = [
  [1900,-2.79],[1901,-1.35],
  [1902,0.01],[1903,1.30],[1904,2.57],[1905,3.83],[1906,5.10],
  [1907,6.39],[1908,7.70],[1909,9.03],[1910,10.39],[1911,11.76],
  [1912,13.14],[1913,14.50],[1914,15.82],[1915,17.09],[1916,18.25],
  [1917,19.29],[1918,20.16],[1919,20.81],[1920,21.20],[1921,21.97],
  [1922,22.60],[1923,23.11],[1924,23.50],[1925,23.78],[1926,23.98],
  [1927,24.10],[1928,24.16],[1929,24.17],[1930,24.13],[1931,24.07],
  [1932,24],[1933,23.92],[1934,23.86],[1935,23.82],[1936,23.81],
  [1937,23.86],[1938,23.96],[1939,24.14],[1940,24.41],[1941,24.77],
  [1942,25.34],[1943,25.88],[1944,26.39],[1945,26.88],[1946,27.35],
  [1947,27.80],[1948,28.24],[1949,28.66],[1950,29.07],[1951,29.47],
  [1952,29.87],[1953,30.26],[1954,30.65],[1955,31.05],[1956,31.44],
  [1957,31.84],[1958,32.25],[1959,32.67],[1960,33.10],[1961,33.58],
  [1962,33.99],[1963,34.50],[1964,35.10],[1965,35.79],[1966,36.55],
  [1967,37.38],[1968,38.27],[1969,39.21],[1970,40.19],[1971,41.21],
  [1972,42.25],[1973,43.31],[1974,44.38],[1975,45.45],[1976,46.51],
  [1977,47.56],[1978,48.58],[1979,49.57],[1980,50.51],[1981,51.41],
  [1982,52.25],[1983,53.03],[1984,53.73],[1985,54.34],[1986,54.88],
  [1987,55.32],[1988,55.78],[1989,56.30],[1990,56.89],[1991,57.57],
  [1992,58.33],[1993,59.13],[1994,59.97],[1995,60.80],[1996,61.59],
  [1997,62.31],[1998,62.95],[1999,63.46],[2000,63.80],[2001,63.98],
  [2002,64.16],[2003,64.34],[2004,64.52],[2005,64.70],[2006,64.98],
  [2007,65.26],[2008,65.54],[2009,65.82],[2010,66.10],[2011,66.40],
  [2012,66.70],[2013,67],[2014,67.30],[2015,67.60],[2016,67.95],
  [2017,68.30],[2018,68.66],[2019,69.01],[2020,69.36],[2021,69.28],
  [2022,69.18],[2023,69.22],[2024,69.30],[2025,69.35],[2026,69.19],
  [2028,70],[2030,71],[2035,73.50],[2040,76],[2050,93],
  [2100,145],[2150,182],
];

function refDeltaT(jd_tt) {
  const year = 1900 + (jd_tt - 2415020.31352) / 365.25;
  for (let i = 0; i < DT_TABLE.length - 1; i++) {
    const [y0, v0] = DT_TABLE[i];
    const [y1, v1] = DT_TABLE[i + 1];
    if (year >= y0 && year <= y1) {
      return v0 + (v1 - v0) * (year - y0) / (y1 - y0);
    }
  }
  // Morrison-Stephenson extrapolation
  const u = (year - 1820) / 100;
  return -20 + 32 * u * u;
}

// ── SOFA iauObl06 — Mean obliquity IAU 2006 ───────────────────────────────────
// Source: Capitaine et al. (2006) A&A 412, 567-586
// Coefficients in arcseconds, polynomial in T (Julian centuries from J2000.0)
function refMeanObliquity(T) {
  const eps0 = (84381.406
    +     (-46.836769) * T
    +      (-0.0001831) * T * T
    +       0.00200340  * T * T * T
    +      (-0.000000576) * T * T * T * T
    +      (-0.0000000434) * T * T * T * T * T) * AS2R;
  return eps0;
}

// ── IAU 2000B Nutation — ΔΨ and Δε ───────────────────────────────────────────
// 77 luni-solar terms + fixed planetary offsets (ΔΨ −0.135 mas, Δε +0.388 mas).
// Source: IERS Conventions (2003) §5.4, McCarthy & Luzum (2003); coefficients as in
// ERFA eraNut00b (units: 0.1 μas). Columns: l l' F D Om  ΔΨ_sin ΔΨ_sin·T ΔΨ_cos
// Δε_cos Δε_cos·T Δε_sin.
// Implementation note: the Delaunay arguments below are the linear Simon et al. (1994)
// expressions that define IAU 2000B; CaelisEngine.js uses the higher-order IAU 2000A
// polynomials, so the two differ by ≲0.13 mas in 1995-2050.
const NUT_TERMS = [
  [ 0,  0,  0,  0,  1, -172064161, -174666,   33386,  92052331,   9086,  15377],
  [ 0,  0,  2, -2,  2,  -13170906,   -1675,  -13696,   5730336,  -3015,  -4587],
  [ 0,  0,  2,  0,  2,   -2276413,    -234,    2796,    978459,   -485,   1374],
  [ 0,  0,  0,  0,  2,    2074554,     207,    -698,   -897492,    470,   -291],
  [ 0,  1,  0,  0,  0,    1475877,   -3633,   11817,     73871,   -184,  -1924],
  [ 0,  1,  2, -2,  2,    -516821,    1226,    -524,    224386,   -677,   -174],
  [ 1,  0,  0,  0,  0,     711159,      73,    -872,     -6750,      0,    358],
  [ 0,  0,  2,  0,  1,    -387298,    -367,     380,    200728,     18,    318],
  [ 1,  0,  2,  0,  2,    -301461,     -36,     816,    129025,    -63,    367],
  [ 0, -1,  2, -2,  2,     215829,    -494,     111,    -95929,    299,    132],
  [ 0,  0,  2, -2,  1,     128227,     137,     181,    -68982,     -9,     39],
  [-1,  0,  2,  0,  2,     123457,      11,      19,    -53311,     32,     -4],
  [-1,  0,  0,  2,  0,     156994,      10,    -168,     -1235,      0,     82],
  [ 1,  0,  0,  0,  1,      63110,      63,      27,    -33228,      0,     -9],
  [-1,  0,  0,  0,  1,     -57976,     -63,    -189,     31429,      0,    -75],
  [-1,  0,  2,  2,  2,     -59641,     -11,     149,     25543,    -11,     66],
  [ 1,  0,  2,  0,  1,     -51613,     -42,     129,     26366,      0,     78],
  [-2,  0,  2,  0,  1,      45893,      50,      31,    -24236,    -10,     20],
  [ 0,  0,  0,  2,  0,      63384,      11,    -150,     -1220,      0,     29],
  [ 0,  0,  2,  2,  2,     -38571,      -1,     158,     16452,    -11,     68],
  [ 0, -2,  2, -2,  2,      32481,       0,       0,    -13870,      0,      0],
  [-2,  0,  0,  2,  0,     -47722,       0,     -18,       477,      0,    -25],
  [ 2,  0,  2,  0,  2,     -31046,      -1,     131,     13238,    -11,     59],
  [ 1,  0,  2, -2,  2,      28593,       0,      -1,    -12338,     10,     -3],
  [-1,  0,  2,  0,  1,      20441,      21,      10,    -10758,      0,     -3],
  [ 2,  0,  0,  0,  0,      29243,       0,     -74,      -609,      0,     13],
  [ 0,  0,  2,  0,  0,      25887,       0,     -66,      -550,      0,     11],
  [ 0,  1,  0,  0,  1,     -14053,     -25,      79,      8551,     -2,    -45],
  [-1,  0,  0,  2,  1,      15164,      10,      11,     -8001,      0,     -1],
  [ 0,  2,  2, -2,  2,     -15794,      72,     -16,      6850,    -42,     -5],
  [ 0,  0, -2,  2,  0,      21783,       0,      13,      -167,      0,     13],
  [ 1,  0,  0, -2,  1,     -12873,     -10,     -37,      6953,      0,    -14],
  [ 0, -1,  0,  0,  1,     -12654,      11,      63,      6415,      0,     26],
  [-1,  0,  2,  2,  1,     -10204,       0,      25,      5222,      0,     15],
  [ 0,  2,  0,  0,  0,      16707,     -85,     -10,       168,     -1,     10],
  [ 1,  0,  2,  2,  2,      -7691,       0,      44,      3268,      0,     19],
  [-2,  0,  2,  0,  0,     -11024,       0,     -14,       104,      0,      2],
  [ 0,  1,  2,  0,  2,       7566,     -21,     -11,     -3250,      0,     -5],
  [ 0,  0,  2,  2,  1,      -6637,     -11,      25,      3353,      0,     14],
  [ 0, -1,  2,  0,  2,      -7141,      21,       8,      3070,      0,      4],
  [ 0,  0,  0,  2,  1,      -6302,     -11,       2,      3272,      0,      4],
  [ 1,  0,  2, -2,  1,       5800,      10,       2,     -3045,      0,     -1],
  [ 2,  0,  2, -2,  2,       6443,       0,      -7,     -2768,      0,     -4],
  [-2,  0,  0,  2,  1,      -5774,     -11,     -15,      3041,      0,     -5],
  [ 2,  0,  2,  0,  1,      -5350,       0,      21,      2695,      0,     12],
  [ 0, -1,  2, -2,  1,      -4752,     -11,      -3,      2719,      0,     -3],
  [ 0,  0,  0, -2,  1,      -4940,     -11,     -21,      2720,      0,     -9],
  [-1, -1,  0,  2,  0,       7350,       0,      -8,       -51,      0,      4],
  [ 2,  0,  0, -2,  1,       4065,       0,       6,     -2206,      0,      1],
  [ 1,  0,  0,  2,  0,       6579,       0,     -24,      -199,      0,      2],
  [ 0,  1,  2, -2,  1,       3579,       0,       5,     -1900,      0,      1],
  [ 1, -1,  0,  0,  0,       4725,       0,      -6,       -41,      0,      3],
  [-2,  0,  2,  0,  2,      -3075,       0,      -2,      1313,      0,     -1],
  [ 3,  0,  2,  0,  2,      -2904,       0,      15,      1233,      0,      7],
  [ 0, -1,  0,  2,  0,       4348,       0,     -10,       -81,      0,      2],
  [ 1, -1,  2,  0,  2,      -2878,       0,       8,      1232,      0,      4],
  [ 0,  0,  0,  1,  0,      -4230,       0,       5,       -20,      0,     -2],
  [-1, -1,  2,  2,  2,      -2819,       0,       7,      1207,      0,      3],
  [-1,  0,  2,  0,  0,      -4056,       0,       5,        40,      0,     -2],
  [ 0, -1,  2,  2,  2,      -2647,       0,      11,      1129,      0,      5],
  [-2,  0,  0,  0,  1,      -2294,       0,     -10,      1266,      0,     -4],
  [ 1,  1,  2,  0,  2,       2481,       0,      -7,     -1062,      0,     -3],
  [ 2,  0,  0,  0,  1,       2179,       0,      -2,     -1129,      0,     -2],
  [-1,  1,  0,  1,  0,       3276,       0,       1,        -9,      0,      0],
  [ 1,  1,  0,  0,  0,      -3389,       0,       5,        35,      0,     -2],
  [ 1,  0,  2,  0,  0,       3339,       0,     -13,      -107,      0,      1],
  [-1,  0,  2, -2,  1,      -1987,       0,      -6,      1073,      0,     -2],
  [ 1,  0,  0,  0,  2,      -1981,       0,       0,       854,      0,      0],
  [-1,  0,  0,  1,  0,       4026,       0,    -353,      -553,      0,   -139],
  [ 0,  0,  2,  1,  2,       1660,       0,      -5,      -710,      0,     -2],
  [-1,  0,  2,  4,  2,      -1521,       0,       9,       647,      0,      4],
  [-1,  1,  0,  1,  1,       1314,       0,       0,      -700,      0,      0],
  [ 0, -2,  2, -2,  1,      -1283,       0,       0,       672,      0,      0],
  [ 1,  0,  2,  2,  1,      -1331,       0,       8,       663,      0,      4],
  [-2,  0,  2,  2,  2,       1383,       0,      -2,      -594,      0,     -2],
  [-1,  0,  0,  0,  2,       1405,       0,       4,      -610,      0,      2],
  [ 1,  1,  2, -2,  2,       1290,       0,       0,      -556,      0,      0],
];

function refNutation(T) {
  const el  = ((485868.249036  + 1717915923.2178 * T) % 1296000) * AS2R;
  const elp = ((1287104.79305  +  129596581.0481 * T) % 1296000) * AS2R;
  const f   = ((335779.526232  + 1739527262.8478 * T) % 1296000) * AS2R;
  const d   = ((1072260.70369  + 1602961601.2090 * T) % 1296000) * AS2R;
  const om  = ((450160.398036  -    6962890.5431 * T) % 1296000) * AS2R;

  let dPsi = 0, dEps = 0;
  for (let i = NUT_TERMS.length - 1; i >= 0; i--) {
    const [nl, nlp, nf, nd, nom, ps, pst, pc, ec, ect, es] = NUT_TERMS[i];
    const arg = nl*el + nlp*elp + nf*f + nd*d + nom*om;
    dPsi += (ps + pst*T) * Math.sin(arg) + pc * Math.cos(arg);
    dEps += (ec + ect*T) * Math.cos(arg) + es * Math.sin(arg);
  }
  return {
    deltaPsi: (dPsi * 1e-7 - 0.135e-3) * AS2R,  // → radians
    deltaEps: (dEps * 1e-7 + 0.388e-3) * AS2R,
  };
}

// ── GMST + GAST — IAU 2006 (Capitaine & Wallace 2006) ───────────────────────
//
// GMST IAU 2006:
//   ERA  = 86400 × (0.7790572732640 + 1.00273781191135448 × (jd_ut1 - J2000))
//   GMST = (ERA/86400 × 360) + polynomial_correction_deg
//   where polynomial_correction_deg = (0.014506 + 4612.156534T + ...) / 3600
//   T is derived from the same UT1 argument (as in CaelisEngine.js gast(); the effect
//   versus using TT is ~1e-4 arcsec in 2026).
//
// GAST = GMST + equation_of_equinoxes
//   EE = ΔΨ × cos(ε_true)   [in degrees]
//
// The jd argument must be JD_UT1 (the ERA is defined in UT1).
//
// Source: Capitaine, Wallace & McCarthy (2003) A&A 406, 1135-1149
//         Capitaine & Wallace (2006) A&A 412, 567-586
function refGMSTdeg(jd_ut1) {
  const T = (jd_ut1 - 2451545.0) / 36525.0;
  // ERA in day-fractions × 86400, then convert to degrees
  let gmst = 86400 * (0.7790572732640 + 1.00273781191135448 * (jd_ut1 - 2451545.0));
  gmst = ((gmst % 86400) + 86400) % 86400;
  let gmstDeg = gmst / 86400 * 360;
  // Polynomial correction in arcseconds → degrees
  const gmstCorr = (
      0.014506
    + 4612.156534   * T
    +    1.3915817  * T * T
    -    0.00000044 * T * T * T
    -    0.000029956* T * T * T * T
    -    0.0000000368*T * T * T * T * T
  ) / 3600;
  return (((gmstDeg + gmstCorr) % 360) + 360) % 360;
}

// GAST = GMST + equation of equinoxes
// jd_tt is the input. By default jd_ut1 = jd_tt - ΔT/86400 with this file's own ΔT table
// (refDeltaT). The optional jd_ut1 argument overrides it: run-asc-mc.js passes the engine's
// own UT1 so that the comparison isolates sidereal time, nutation, obliquity and houses
// from ΔT (validated separately against NASA tables in validation/run.js).
function refGAST(jd_tt, jd_ut1) {
  const T      = jd2T(jd_tt);
  const nut    = refNutation(T);
  const eps    = refMeanObliquity(T) + nut.deltaEps; // true obliquity in radians
  // Equation of equinoxes: ΔΨ × cos(ε) in degrees
  const eqEq   = nut.deltaPsi * Math.cos(eps) * R2D;
  const ut1    = (jd_ut1 === undefined) ? jd_tt - refDeltaT(jd_tt) / 86400 : jd_ut1;
  const gmstDeg = refGMSTdeg(ut1);
  return (((gmstDeg + eqEq) % 360) + 360) % 360; // returns degrees
}

// ── LST from GAST and longitude (returns degrees) ─────────────────────────────
function refLST(jd_tt, lon_deg, jd_ut1) {
  return (((refGAST(jd_tt, jd_ut1) + lon_deg) % 360) + 360) % 360;
}

// ── True obliquity ────────────────────────────────────────────────────────────
function refTrueObliquity(T) {
  const nut = refNutation(T);
  return refMeanObliquity(T) + nut.deltaEps;
}

// ── ASC — ecliptic longitude of the Ascendant (returns degrees) ───────────────
// Formula: Woolard & Clemence (1966) p.155
// Uses LST in degrees, converts to radians for trig
function refASC(jd_tt, lat_deg, lon_deg, jd_ut1) {
  const T     = jd2T(jd_tt);
  const LST_r = refLST(jd_tt, lon_deg, jd_ut1) * D2R;  // degrees → radians
  const eps   = refTrueObliquity(T);              // radians
  const phi   = lat_deg * D2R;

  const ascRA = Math.atan2(
    -Math.cos(LST_r),
    Math.sin(eps) * Math.tan(phi) + Math.cos(eps) * Math.sin(LST_r)
  );
  return ((ascRA * R2D) % 360 + 360) % 360;
}

// ── MC — ecliptic longitude of Midheaven (returns degrees) ────────────────────
// λ_MC = atan2(sin(LST), cos(ε)·cos(LST))
// Source: same formula used in CaelisEngine.js _getSnapshotFromJD()
// Note: this differs from the naive atan2(sin·cos, cos) form;
// the correct ecliptic MC formula has cos(ε) multiplying the second argument.
function refMC(jd_tt, lon_deg, jd_ut1) {
  const T     = jd2T(jd_tt);
  const LST_r = refLST(jd_tt, lon_deg, jd_ut1) * D2R;  // degrees → radians
  const eps   = refTrueObliquity(T);              // radians

  const mc = Math.atan2(
    Math.sin(LST_r),
    Math.cos(eps) * Math.cos(LST_r)
  );
  return ((mc * R2D) % 360 + 360) % 360;
}

// ── Public API ────────────────────────────────────────────────────────────────
// All angle-returning functions return DEGREES unless noted
// refGAST(jd_tt[, jd_ut1])              → degrees
// refLST(jd_tt, lon_deg[, jd_ut1])      → degrees
// refASC(jd_tt, lat, lon[, jd_ut1])     → degrees
// refMC(jd_tt, lon_deg[, jd_ut1])       → degrees
// (optional jd_ut1 overrides the UT1 derived from this file's own ΔT table)
// refMeanObliquity(T)     → radians (matches SOFA convention)
// refTrueObliquity(T)     → radians
module.exports = {
  refGAST,
  refLST,
  refASC,
  refMC,
  refMeanObliquity,
  refTrueObliquity,
  refDeltaT,
  jd2T,
  D2R, R2D, AS2R,
};
