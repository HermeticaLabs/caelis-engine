/**
 * Caelis Engine v2.1.0 — TypeScript Declarations
 * Professional astronomical calculation engine
 * https://github.com/HermeticaLabs/caelis-engine
 */

// ── Core types ───────────────────────────────────────────────────────────────

export interface BodyData {
  ra: number;        // Right ascension (radians)
  dec: number;       // Declination (radians)
  lon_ecl: number;   // Ecliptic longitude (degrees)
  lat_ecl?: number;  // Ecliptic latitude (degrees)
  alt: number;       // Altitude above horizon (degrees)
  az: number;        // Azimuth (degrees)
  visible: boolean;  // Above horizon
  house?: number;    // Placidus house (1–12)
  distance?: number; // Distance (km, Moon only)
}

export interface SnapshotMeta {
  jd: number;           // Julian Date (TT)
  utc: string;          // ISO 8601 UTC string
  timestamp: number;    // Unix timestamp (seconds)
  lst_deg: number;      // Local Sidereal Time (degrees)
  obliquity: number;    // True obliquity (degrees)
  delta_psi: number;    // Nutation in longitude (degrees)
  delta_eps: number;    // Nutation in obliquity (degrees)
  observer: { lat: number; lon: number }; // degrees
}

export interface Snapshot {
  meta: SnapshotMeta;
  bodies: {
    Sol: BodyData;
    Luna: BodyData;
    Mercurio: BodyData;
    Venus: BodyData;
    Marte: BodyData;
    Jupiter: BodyData;
    Saturno: BodyData;
    NodoNorte: BodyData;
    NodoSur: BodyData;
  };
  luna: {
    phase_ratio: number;    // 0=new, 0.5=full, 1=new
    phase_deg: number;      // 0–180 degrees elongation
    illumination: number;   // 0–1
  };
  houses: {
    asc: number;      // Ascendant (degrees)
    mc: number;       // Midheaven (degrees)
    cusps: number[];  // [I..XII] ecliptic degrees
    system: string;   // 'placidus'
  };
}

export interface Aspect {
  nmTr: string;       // Transit body name
  nmRx: string;       // Natal body name
  glTr: string;       // Transit body glyph
  glRx: string;       // Natal body glyph
  asp: string;        // Aspect name
  orb: number;        // Orb in degrees
  exactitud: number;  // Exactness 0–1
}

export interface AtacirResult {
  rx: Snapshot;
  tr: Snapshot;
  rows: Array<{
    glyph: string; name: string;
    arcASC: number; arcMC: number;
    ageASC: number; ageMC: number;
  }>;
  aspNatales: Aspect[];
  aspTransito: Aspect[];
  simData: object | null;
  ciclosData: object | null;
  resonData: object | null;
  lunaData: object | null;
  ageNow: number;
  key: number;
  jdRx: number;
  jdTr: number;
  rxDate: string; rxTime: string; rxLat: number; rxLon: number;
  trDate: string; trTime: string; trLat: number; trLon: number;
}

export interface PanchangaResult {
  jde: number; T: number; ayanDeg: number;
  sunLon: number; moonLon: number; sunSid: number; moonSid: number;
  tithiIdx: number; tithiName: string; paksha: string;
  tithiPct: string; jdeNextTithi: number;
  varaIdx: number; vara: { name: string; glyph: string; planet: string };
  naksIdx: number; naks: { name: string; ruler: string };
  naksPct: string; jdeNextNaks: number;
  yogaIdx: number; yogaName: string; yogaPct: string; jdeNextYoga: number;
  karanaName: string; karanaPct: string; jdeNextKarana: number;
}

export interface Eclipse {
  jde: number;
  tipo: string;       // 'Total' | 'Anular' | 'Parcial' | 'Umbral' | 'Penumbral'
  subtipo: string;    // 'solar' | 'lunar'
  magnitud: number;   // 0–1+
  dist: number | null; // km (solar only)
  visible: boolean;
}

export interface NutationResult {
  deltaPsi: number;  // radians
  deltaEps: number;  // radians
}

export interface LunarNodesResult {
  north: { ra: number; dec: number; lon_ecl: number };
  south: { ra: number; dec: number; lon_ecl: number };
  omega: number; // ascending node degrees
}

export interface HeliocentricCoords {
  L: number; // heliocentric longitude (radians)
  B: number; // heliocentric latitude (radians)
  R: number; // radius vector (AU)
  x?: number; y?: number; z?: number; // rectangular (AU)
}

// ── Time Engine ──────────────────────────────────────────────────────────────
export function julianDateUTC(): number;
export function julianDate(): number;
export function deltaT(jd: number): number;
export function getJulianCenturies(jd: number): number;
export function getLST(): number;
export function gast(jd: number): number;
export function geocentricRadius(): number;
export function _invalidateAstroCache(): void;

// ── Nutation & obliquity ─────────────────────────────────────────────────────
export function nutation(T: number): NutationResult;
export function meanObliquity(T: number): number;
export function trueObliquity(T: number): number;

// ── Coordinate transforms ─────────────────────────────────────────────────────
export function eclipticToEquatorialWithEps(lambda: number, beta: number, eps: number): { ra: number; dec: number };
export function eclipticLonToRaDec(lonDeg: number, epsRad?: number): { ra: number; dec: number };
export function annualAberration(lambda: number, beta: number, T: number): { lambda: number; beta: number };
export function applyRefraction(alt: number): number;
export function obliqAsc(raDeg: number, decDeg: number, latDeg: number): number | null;
export function semiArcDiurno(decDeg: number, latDeg: number): number | null;
export function eclLonToRA(lonDeg: number, epsRad: number): number;
export function raToEclLon(raDeg: number, epsRad: number): number;

// ── Planet algorithms ─────────────────────────────────────────────────────────
export function vsop87Mercurio(T: number): HeliocentricCoords;
export function vsop87Venus(T: number): HeliocentricCoords;
export function vsop87Tierra(T: number): HeliocentricCoords;
export function vsop87Marte(T: number): HeliocentricCoords;
export function vsop87Jupiter(T: number): HeliocentricCoords;
export function vsop87Saturno(T: number): HeliocentricCoords;
export function heliocentricCoords(name: string, T: number): { x: number; y: number; z: number };
export function earthHelio(T: number): { x: number; y: number; z: number };
export function geocentricEclipticWithLightTime(name: string, T: number, jd: number): { lambda: number; beta: number; dist: number };
export function sunPosition(): { ra: number; dec: number };
export function planetPosition(name: string): { ra: number; dec: number };
export function sunLonEcl(): number;
export function planetLonEcl(name: string): number;

// ── Moon ──────────────────────────────────────────────────────────────────────
export function moonPosition(): { ra: number; dec: number };
export function moonLonEcl(): number;
export function lunarDistELP(jde: number): number;
export function lunarPhaseJDE(k: number, phase: number): number;
export function lunarNodes(): LunarNodesResult;

// ── Houses ────────────────────────────────────────────────────────────────────
export function getHouseCusps(forLatDeg?: number): { cusps: number[]; asc: number; mc: number; eps: number; system: string } | null;
export function placidusHouseCusps(asc: number, mc: number, eps: number, latDeg: number): number[] | null;
export function obliqAscension(raDeg: number, decDeg: number, latDeg: number): number;

// ── Snapshots (core API) ──────────────────────────────────────────────────────
export function getSnapshot(): Snapshot;
export function getSnapshotAt(jdTarget: number, latDeg: number, lonDeg: number): Snapshot;

// ── Aspects ───────────────────────────────────────────────────────────────────
export function calcAspectosNatales(snap: Snapshot): Aspect[];
export function calcAspectosTransito(snapRx: Snapshot, snapTr: Snapshot): Aspect[];

// ── Analysis cores (pure functions — no DOM) ──────────────────────────────────
export function calcAtacirCore(
  rxDate: string, rxTime: string, rxLat: number, rxLon: number,
  trDate: string, trTime: string, trLat: number, trLon: number,
  key: number
): AtacirResult;

export function calcPanchangaCore(dateStr: string, timeStr: string): PanchangaResult;

export function calcEclipsesCore(
  latDeg: number, lonDeg: number,
  ranioY: number, doSolar: boolean, doLunar: boolean,
  jdCenter?: number
): Eclipse[];

export function calcSinastriaCore(
  dateA: string, timeA: string, latA: number, lonA: number,
  dateB: string, timeB: string, latB: number, lonB: number
): { rxA: Snapshot; rxB: Snapshot; aspectos: Aspect[]; simAB: object | null; fechaA: string; fechaB: string };

// ── Astronomy utilities ────────────────────────────────────────────────────────
export function nextSolEquinox(targetLon: number, jdStart: number): number;
export function _lahiriAyanamsa(T: number): number;
export function calcSimetrias(snap: Snapshot): object;
export function calcCiclos(rx: Snapshot, tr: Snapshot): object;
export function calcResonancias(rx: Snapshot, tr: Snapshot): object;
export function calcLunaAtacir(rx: Snapshot, tr: Snapshot): object;

// ── Eclipse internals (exposed for advanced use) ──────────────────────────────
export function _eclSolarMagnitude(F: number, dist: number): { tipo: string; subtipo: string; magnitud: number } | null;
export function _eclLunarMagnitude(F: number): { tipo: string; subtipo: string; magnitud: number } | null;
export function _eclGetF(k: number, phase: number): number;
export function _eclVisibleAt(jde: number, latDeg: number, lonDeg: number, isSolar: boolean): boolean;
