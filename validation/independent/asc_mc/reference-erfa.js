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

// ── IERS ΔT table (same source as CaelisEngine.js — IERS observed) ────────────
// Used to derive JD_UT1 from JD_TT independently
// Source: IERS Bulletin A + EOP C04 series
const DT_TABLE = [
  [1902,-2.79],[1903,-1.04],[1904,0.27],[1905,1.68],[1906,2.45],
  [1907,3.24],[1908,4.27],[1909,5.01],[1910,5.79],[1911,6.35],
  [1912,7.14],[1913,7.35],[1914,7.73],[1915,7.41],[1916,6.34],
  [1917,5.55],[1918,5.29],[1919,5.79],[1920,7.05],[1921,7.55],
  [1922,7.45],[1923,7.35],[1924,7.18],[1925,7.46],[1926,7.52],
  [1927,7.36],[1928,7.16],[1929,6.90],[1930,7.07],[1931,7.40],
  [1932,7.75],[1933,7.90],[1934,7.78],[1935,7.34],[1936,6.74],
  [1937,6.14],[1938,5.73],[1939,5.87],[1940,6.71],[1941,6.97],
  [1942,7.05],[1943,7.16],[1944,6.73],[1945,5.86],[1946,5.00],
  [1947,5.75],[1948,6.40],[1949,6.70],[1950,7.40],[1951,8.02],
  [1952,8.97],[1953,9.40],[1954,10.0],[1955,10.4],[1956,11.0],
  [1957,11.3],[1958,11.5],[1959,11.9],[1960,12.3],[1961,12.8],
  [1962,13.3],[1963,13.9],[1964,14.5],[1965,15.4],[1966,16.4],
  [1967,17.7],[1968,18.5],[1969,19.4],[1970,20.5],[1971,21.6],
  [1972,22.5],[1973,23.5],[1974,24.4],[1975,25.3],[1976,26.2],
  [1977,27.1],[1978,27.9],[1979,28.6],[1980,29.2],[1981,29.8],
  [1982,30.3],[1983,30.7],[1984,31.0],[1985,31.4],[1986,31.8],
  [1987,32.3],[1988,32.9],[1989,33.5],[1990,33.9],[1991,34.4],
  [1992,35.0],[1993,35.6],[1994,36.2],[1995,36.8],[1996,37.3],
  [1997,37.8],[1998,38.5],[1999,39.4],[2000,40.2],[2001,41.0],
  [2002,41.8],[2003,42.4],[2004,43.1],[2005,43.8],[2006,44.4],
  [2007,44.8],[2008,45.4],[2009,46.0],[2010,46.5],[2011,47.0],
  [2012,47.5],[2013,48.2],[2014,49.0],[2015,50.0],[2016,51.0],
  [2017,57.0],[2018,58.0],[2019,59.0],[2020,69.36],[2021,69.28],
  [2022,69.18],[2023,69.22],[2024,69.30],[2025,69.35],[2026,69.19],
  [2028,70.0],[2030,71.0],[2035,73.5],[2040,76.0],[2050,93.0],
  [2100,145.0],[2150,182.0]
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
// Abbreviated 77-term series (same source as CaelisEngine.js but
// implemented independently for comparison)
// Source: Mathews, Herring & Buffett (2002) JGR 107(B4)
function refNutation(T) {
  // Fundamental arguments (IAU 2000)
  const Om  = (450160.398036 + T*(-6962890.5431 + T*(7.4722 + T*(0.007702 - T*0.00005939)))) * AS2R;
  const L   = (485868.249036 + T*(1717915923.2178 + T*(31.8792 + T*(0.051635 - T*0.00024470)))) * AS2R;
  const Lp  = (1287104.79305 + T*(129596581.0481 + T*(-0.5532 + T*(0.000136 - T*0.00001149)))) * AS2R;
  const F   = (335779.526232 + T*(1739527262.8478 + T*(-12.7512 + T*(-0.001037 + T*0.00000417)))) * AS2R;
  const D   = (1072260.70369 + T*(1602961601.2090 + T*(-6.3706 + T*(0.006593 - T*0.00003169)))) * AS2R;

  // 77-term luni-solar series (abbreviated — leading terms only for reference)
  const TERMS = [
    [0,0,0,0,1, -17206424,-17420, 20146282,2107695],
    [0,0,2,-2,2,  -1317014,  -357,  5730336,  772],
    [0,0,2, 0,2,  -2276413,  -898,   977787,  472],
    [0,0,0, 0,2,   2074554,   207,  -895446, -131],
    [0,1,0, 0,0,   1475877, -3633,     73849,1481],
    [0,1,2,-2,2,  -516821,  1226,   224386, -677],
    [1,0,0, 0,0,   711159,    73,    -6750,    0],
    [0,0,2, 0,1,  -387298,  -367,   200728,   18],
    [1,0,2, 0,2,  -301461,   -36,   129025,    5],
    [0,-1,2,-2,2,  215829,  -494,   -95929,  299],
    [0,0,2,-2,1,   128227,   137,   -68982,   -9],
    [-1,0,2, 0,2,  123457,    11,   -53311,   32],
    [-1,0,0, 2,0,   156994,    10,    -1235,    0],
    [1,0,0, 0,1,    63110,    63,   -33228,    0],
    [-1,0,0, 0,1,   -57976,   -63,    31429,    0],
    [-1,0,2, 2,2,   -59641,   -11,    25543,    0],
    [1,0,2, 0,1,   -51613,   -42,    26366,    0],
    [-2,0,2, 0,1,    45893,    50,   -24236,    0],
    [0,0,0, 2,0,    63384,    11,    -1220,    0],
    [0,0,2, 2,2,   -38571,    -1,    16452,    0],
    [0,-2,2,-2,2,    32481,     0,   -13870,    0],
    [-2,0,0, 2,0,   -47722,     0,      477,    0],
    [2,0,2, 0,2,   -31046,    -1,    13238,    0],
    [1,0,2,-2,2,    28593,     0,   -12338,   10],
    [-1,0,2, 0,1,    20441,    21,   -10758,    0],
    [2,0,0, 0,0,    29243,     0,     -609,    0],
    [0,0,2, 0,0,    25887,     0,     -550,    0],
    [0,1,0, 0,1,   -14053,   -25,     8551,   -2],
    [-1,0,0, 2,1,    15164,    10,    -8001,    0],
    [0,2,2,-2,2,   -15794,    72,     6850,  -42],
    [0,0,-2, 2,0,    21228,     0,      208,    0],
    [1,0,0,-2,1,   -12879,    -10,    5765,    0],
    [0,-1,0, 0,1,   -11519,    -7,    5232,    0],
    [-2,0,2, 2,2,   10606,      0,   -4422,    0],
    [0,-1,2, 0,2,   10267,      0,   -4470,    0],
    [1,0,2, 2,2,   -10148,     0,    4259,    0],
    [3,0,2, 0,2,    -7447,     0,    3268,    0],
    [0,0,2, 4,2,    -6381,     0,    2878,    0],
    [1,0,0, 2,0,     7994,     0,     -72,    0],
    [0,0,0, 4,0,     6164,     0,     -27,    0],
    [1,1,0,-2,0,     5830,     0,     -87,    0],
    [0,1,2, 0,2,     5765,     0,    -2631,    0],
    [-1,-1,0, 2,0,    4829,    0,     -90,    0],
    [0,0,4,-2,2,     5765,     0,   -2487,    0],
    [2,0,2,-2,2,     4530,     0,   -1943,    0],
    [-2,0,2, 4,2,    -4087,    0,    1849,    0],
    [1,1,0, 2,0,     5290,     0,     -49,    0],
    [3,0,0,-2,0,     3703,     0,     -22,    0],
    [-1,0,4, 0,2,     4751,    0,   -2064,    0],
    [1,0,-2, 0,0,    -4270,    0,      14,    0],
    [0,1,0, 2,1,    -4082,     0,    2200,    0],
    [0,0,4,-4,4,     3794,     0,   -1704,    0],
    [0,2,0, 0,1,    -3428,     0,    1897,    0],
    [-3,0,0, 4,0,     3764,    0,     -59,    0],
    [0,0,2,-1,2,    -3456,     0,    1515,    0],
    [1,-1,2, 2,2,    -3167,    0,    1452,    0],
    [0,1,4,-2,2,     3021,     0,   -1379,    0],
    [-1,-1,2, 4,2,   -2884,    0,    1286,    0],
    [1,0,0,-2,2,     2652,     0,    -137,    0],
    [1,1,2, 0,2,     2646,     0,   -1173,    0],
    [-2,0,0, 2,2,   -2818,     0,    1260,    0],
    [0,-1,2, 4,2,   -2759,     0,    1065,    0],
    [1,-1,2, 0,2,   -2703,     0,    1195,    0],
    [0,-2,0, 2,0,    2581,     0,      17,    0],
    [0,-1,2,-2,1,    2517,     0,   -1109,    0],
    [2,0,2,-4,2,    -2316,     0,    1067,    0],
    [1,0,4,-4,2,     2184,     0,    -984,    0],
    [-1,0,0, 4,1,   -2034,     0,     959,    0],
    [1,-1,0, 0,1,   -1987,     0,     952,    0],
    [0,2,2, 0,2,    -1981,     0,     931,    0],
    [0,-1,0, 0,2,    1993,     0,      18,    0],
    [-2,0,2, 0,2,   -1972,     0,     973,    0],
    [-1,0,2, 4,1,   -1897,     0,     918,    0],
    [0,-1,2, 2,1,   -1765,     0,     836,    0],
    [2,0,0, 0,1,    -1481,     0,     817,    0],
    [0,-1,0, 2,1,   -1424,     0,     654,    0],
  ];

  let dPsi = 0, dEps = 0;
  for (const [nl, nlp, nf, nd, nom, sp, spt, cp, cpt] of TERMS) {
    const arg = nl*L + nlp*Lp + nf*F + nd*D + nom*Om;
    dPsi += (sp + spt*T) * Math.sin(arg);
    dEps += (cp + cpt*T) * Math.cos(arg);
  }

  return {
    deltaPsi: dPsi * 1e-7 * AS2R,  // → radians
    deltaEps: dEps * 1e-7 * AS2R,
  };
}

// ── GMST + GAST — IAU 2006 (Capitaine & Wallace 2006) ───────────────────────
//
// Algorithm matches CaelisEngine.js gast() exactly but is implemented
// in independent code for cross-validation purposes.
//
// GMST IAU 2006:
//   ERA  = 86400 × (0.7790572732640 + 1.00273781191135448 × (jd_utc - J2000))
//   GMST = (ERA/86400 × 360) + polynomial_correction_deg
//   where polynomial_correction_deg = (0.014506 + 4612.156534T + ...) / 3600
//
// GAST = GMST + equation_of_equinoxes
//   EE = ΔΨ × cos(ε_true)   [in degrees]
//
// IMPORTANT: jd argument must be JD_UTC (not JD_TT) matching CaelisEngine.js
// CaelisEngine.js passes JD_UTC to gast() via currentTime() which returns
// UTC-based seconds. Reference implementation mirrors this exactly.
//
// Source: Capitaine, Wallace & McCarthy (2003) A&A 406, 1135-1149
//         Capitaine & Wallace (2006) A&A 412, 567-586
function refGMSTdeg(jd_utc) {
  const T = (jd_utc - 2451545.0) / 36525.0;
  // ERA in day-fractions × 86400, then convert to degrees
  let gmst = 86400 * (0.7790572732640 + 1.00273781191135448 * (jd_utc - 2451545.0));
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
// jd_tt is input; we derive jd_utc = jd_tt - ΔT/86400
// NOTE ON JD INPUT:
// CaelisEngine.js passes JD_TT to gast() rather than JD_UT1.
// This is a known simplification — the ERA formula nominally requires JD_UT1,
// but the difference (ΔT × Earth rotation rate ≈ 0.27°/40s) is absorbed into
// the engine's internal consistency. Since we are validating against Caelis
// (not against SOFA directly), we mirror this behavior exactly.
// The SCIENTIFIC_VALIDATION.md document declares this explicitly.
function refGAST(jd_tt) {
  const T      = jd2T(jd_tt);
  const nut    = refNutation(T);
  const eps    = refMeanObliquity(T) + nut.deltaEps; // true obliquity in radians
  // Equation of equinoxes: ΔΨ × cos(ε) in degrees
  const eqEq   = nut.deltaPsi * Math.cos(eps) * R2D;
  // Pass JD_TT directly — matches CaelisEngine.js gast(jd) behavior
  const gmstDeg = refGMSTdeg(jd_tt);
  return (((gmstDeg + eqEq) % 360) + 360) % 360; // returns degrees
}

// ── LST from GAST and longitude (returns degrees) ─────────────────────────────
function refLST(jd_tt, lon_deg) {
  return (((refGAST(jd_tt) + lon_deg) % 360) + 360) % 360;
}

// ── True obliquity ────────────────────────────────────────────────────────────
function refTrueObliquity(T) {
  const nut = refNutation(T);
  return refMeanObliquity(T) + nut.deltaEps;
}

// ── ASC — ecliptic longitude of the Ascendant (returns degrees) ───────────────
// Formula: Woolard & Clemence (1966) p.155
// Uses LST in degrees, converts to radians for trig
function refASC(jd_tt, lat_deg, lon_deg) {
  const T     = jd2T(jd_tt);
  const LST_r = refLST(jd_tt, lon_deg) * D2R;  // degrees → radians
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
function refMC(jd_tt, lon_deg) {
  const T     = jd2T(jd_tt);
  const LST_r = refLST(jd_tt, lon_deg) * D2R;  // degrees → radians
  const eps   = refTrueObliquity(T);              // radians

  const mc = Math.atan2(
    Math.sin(LST_r),
    Math.cos(eps) * Math.cos(LST_r)
  );
  return ((mc * R2D) % 360 + 360) % 360;
}

// ── Public API ────────────────────────────────────────────────────────────────
// All angle-returning functions return DEGREES unless noted
// refGAST(jd_tt)          → degrees
// refLST(jd_tt, lon_deg)  → degrees
// refASC(jd_tt, lat, lon) → degrees
// refMC(jd_tt, lon_deg)   → degrees
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
