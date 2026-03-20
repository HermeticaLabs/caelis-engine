/**
 * Caelis Engine v2.1.0 — ESM Entry Point
 * Professional astronomical calculation engine
 *
 * VSOP87 + ELP/MPP02 (LLR calibrated) · 107/107 tests PASS vs JPL Horizons DE441
 * Placidus houses · Eclipse detection · Vedic Panchanga · Synastry
 *
 * © 2024–2026 Cristian Valeria Bravo / Hermetica Labs
 * License: AGPL-3.0 | Commercial: hermeticalabs.dev@proton.me
 * https://github.com/HermeticaLabs/caelis-engine
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const AstroCore = require('../src/astro/AstroCore.js');

export const {
  // ── Observer control ─────────────────────────────────────────
  setObserver,
  setTimeOffset,
  getObserver,

  // ── Time engine ──────────────────────────────────────────────
  julianDateUTC,
  julianDate,
  deltaT,
  getJulianCenturies,
  getLST,
  gast,
  geocentricRadius,

  // ── Nutation & obliquity ─────────────────────────────────────
  nutation,
  meanObliquity,
  trueObliquity,

  // ── Coordinate transforms ────────────────────────────────────
  eclipticToEquatorialWithEps,
  eclipticLonToRaDec,
  annualAberration,
  applyRefraction,
  obliqAsc,
  semiArcDiurno,
  eclLonToRA,
  raToEclLon,

  // ── Planet algorithms (VSOP87) ───────────────────────────────
  vsop87Mercurio,
  vsop87Venus,
  vsop87Tierra,
  vsop87Marte,
  vsop87Jupiter,
  vsop87Saturno,
  heliocentricCoords,
  earthHelio,
  geocentricEclipticWithLightTime,
  sunPosition,
  planetPosition,
  sunLonEcl,
  planetLonEcl,

  // ── Moon (ELP/MPP02 LLR calibrated) ─────────────────────────
  moonPosition,
  moonLonEcl,
  lunarDistELP,
  lunarPhaseJDE,
  lunarNodes,

  // ── Houses ───────────────────────────────────────────────────
  getHouseCusps,
  placidusHouseCusps,
  obliqAscension,

  // ── Snapshots — core API ─────────────────────────────────────
  getSnapshot,
  getSnapshotAt,

  // ── Aspects ──────────────────────────────────────────────────
  calcAspectosNatales,
  calcAspectosTransito,

  // ── Analysis cores (pure functions — no DOM) ─────────────────
  calcAtacirCore,
  calcPanchangaCore,
  calcEclipsesCore,
  calcSinastriaCore,

  // ── Astronomy utilities ──────────────────────────────────────
  nextSolEquinox,
  _lahiriAyanamsa,
  calcSimetrias,
  calcCiclos,
  calcResonancias,
  calcLunaAtacir,

  // ── Eclipse internals (advanced use) ─────────────────────────
  _eclSolarMagnitude,
  _eclLunarMagnitude,
  _eclGetF,
  _eclVisibleAt,

  // ── Math constants ───────────────────────────────────────────
  deg2rad,
  rad2deg,

} = AstroCore;

// Default export — objeto completo para import * as Caelis
export default AstroCore;
