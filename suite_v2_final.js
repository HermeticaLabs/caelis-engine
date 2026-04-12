'use strict';
const vm   = require('vm');
const fs   = require('fs');
const path = require('path');

// ── Localizar el monolito ─────────────────────────────────────────────────────
const MOTOR_FILE = path.resolve(__dirname, 'index.html');
if (!fs.existsSync(MOTOR_FILE)) {
  console.error(`\n❌ No se encontró: ${MOTOR_FILE}`);
  console.error('   Ejecuta desde la carpeta del repo:');
  console.error('   node suite_v2_final.js\n');
  process.exit(1);
}

const html = fs.readFileSync(MOTOR_FILE, 'utf8').replace(/\r\n/g, '\n');

// Extraer el bloque <script> más largo (el motor principal)
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (!scripts.length) {
  console.error('❌ No se encontró bloque <script> en index.html'); process.exit(1);
}
let motorJS = scripts.reduce((a,b) => a[1].length > b[1].length ? a : b)[1];

// ── Parche de compatibilidad vm ──────────────────────────────────────────────
// En vm.Script.runInNewContext(), las variables 'let'/'const' del script
// se crean en el scope léxico y NO se exponen en el objeto contexto.
// Solo 'var' y asignaciones globales se exponen como propiedades del contexto.
// En vm.Script.runInNewContext(), tanto 'let' como 'const' del script
// se crean en el scope léxico y NO se exponen en el objeto contexto.
// Solo 'var' se expone. Parchamos todas las declaraciones globales clave.
// Regex con ^ (inicio de línea) para no tocar variables locales en funciones.
const globalDecls = [
  // let → var
  /^(let timeOffset\s*=)/m,
  /^(let timeSpeed\s*=)/m,
  /^(let speedIndex\s*=)/m,
  /^(let lat\s*=)/m,
  /^(let lon\s*=.*?-70)/m,        // solo la global del observador (-70.66)
  /^(let astroZoom\s*=)/m,
  /^(let _nutCache\s*=)/m,
  /^(let _nodesCache\s*=)/m,
  /^(let _lang\s*=)/m,
  /^(let _isPremium\s*=)/m,
  /^(let houseSystem\s*=)/m,
  /^(let modoAstrolabio\s*=)/m,
  /^(let _iaType\s*=)/m,
  // const → var (tablas y objetos globales que el suite necesita acceder)
  /^(const deltaTTable\s*=)/m,
  /^(const _IAU2000B\s*=)/m,
  /^(const _elp_lT\s*=)/m,
  /^(const speedLevels\s*=)/m,
  /^(const speedLabels\s*=)/m,
  /^(const capaBtn\s*=)/m,
  /^(const ASPECTOS_VIS\s*=)/m,
  /^(const ASP_GLYPH\s*=)/m,
  /^(const _GLOW_COLORS\s*=)/m,
  /^(const _CREDIT_TIERS\s*=)/m,
  /^(const _CREDITS_KEY\s*=)/m,
  /^(const canvas\s*=)/m,
  /^(const ctx\s*=)/m,
];
let patchCount = 0;
for (const rx of globalDecls) {
  const patched = motorJS.replace(rx, (m, g1) => {
    // Quitar 'let ' o 'const ' y poner 'var '
    const stripped = g1.replace(/^(let|const)\s+/, '');
    return 'var ' + stripped;
  });
  if (patched !== motorJS) { motorJS = patched; patchCount++; }
}
console.log(`✅ Motor cargado: ${path.basename(MOTOR_FILE)} (${(motorJS.length/1024).toFixed(0)} KB, ${patchCount}/${globalDecls.length} parches vm)`);

// ── Sandbox ───────────────────────────────────────────────────────────────────
const mockEl = () => ({
  value:'', textContent:'', innerHTML:'',
  classList:{add:()=>{},remove:()=>{},toggle:()=>{},contains:()=>false},
  style:{}, disabled:false, addEventListener:()=>{},
  getBoundingClientRect:()=>({left:0,top:0,width:800,height:800}),
  appendChild:(x)=>x, children:[], dataset:{}, setAttribute:()=>{}, getAttribute:()=>null
});
const mkCtx = () => new Proxy({},{get:(t,p)=>p in t?t[p]:()=>{}});
const ctx = mkCtx();
Object.assign(ctx,{
  save:()=>{}, restore:()=>{}, setLineDash:()=>{}, getLineDash:()=>[],
  measureText:()=>({width:0}),
  createRadialGradient:()=>({addColorStop:()=>{}}),
  createLinearGradient:()=>({addColorStop:()=>{}})
});

// canvasMock debe estar definido ANTES de SB para que getElementById('sky') lo devuelva
const canvasMock = {width:800, height:800, getContext:()=>ctx, addEventListener:()=>{}};

const SB = {
  Math, Date, Array, Object, String, Number, Boolean, JSON,
  parseInt, parseFloat, isNaN, isFinite, console,
  setTimeout:()=>{}, clearTimeout:()=>{}, setInterval:()=>{}, clearInterval:()=>{},
  requestAnimationFrame:()=>{}, cancelAnimationFrame:()=>{},
  performance:{now:()=>Date.now()}, crypto:require('crypto').webcrypto,
  Promise, Symbol, WeakMap, WeakSet, Map, Set, Proxy, Reflect,
  Float32Array, Float64Array, Int32Array, Uint8Array, Uint32Array,
  ArrayBuffer, DataView, TextEncoder, TextDecoder,
  document:{
    getElementById:(id)=>id==='sky'?canvasMock:mockEl(), querySelector:()=>mockEl(), querySelectorAll:()=>[],
    createElement:()=>mockEl(), addEventListener:()=>{}, removeEventListener:()=>{},
    body:mockEl(), head:mockEl(), title:''
  },
  navigator:{geolocation:null, userAgent:'node', language:'es'},
  localStorage:{getItem:()=>null, setItem:()=>{}, removeItem:()=>{}},
  sessionStorage:{getItem:()=>null, setItem:()=>{}, removeItem:()=>{}},
  screen:{width:1920, height:1080, colorDepth:24},
  Intl:{DateTimeFormat:()=>({resolvedOptions:()=>({timeZone:'UTC'})})},
  fetch:async()=>({ok:false, json:async()=>({}), text:async()=>''}),
  lat:-33.45*Math.PI/180, lon:-70.66*Math.PI/180, R_TIERRA:6371.0,
  houseSystem:'placidus', timeOffset:0, mouseX:0, mouseY:0, radius:300,
  capas:{casas:true, constelaciones:false, vialactea:false, aspectos:false},
  canvas:canvasMock, ctx, THREE:null,
};
SB.window=SB; SB.self=SB; SB.global=SB;
SB.addEventListener=()=>{}; SB.removeEventListener=()=>{};

// Ejecutar el motor en el sandbox
try {
  new vm.Script(motorJS, {filename:'index.html'})
    .runInNewContext(SB, {timeout:30000});
} catch(e) {
  const ignore = ['getContext','vortex','oculusCanvas','DOMContentLoaded','_clInit','_mobileInit'];
  if (!ignore.some(s => e.message && e.message.includes(s)))
    console.warn('⚠ Load warning:', (e.message||String(e)).slice(0,100));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const pm  = x => ((x%360)+360)%360;
const R2D = 180/Math.PI;
const J2000_UNIX = (2451545.0 - 2440587.5) * 86400; // Unix seconds de J2000

const jd = (y,m,d,h=0) => {
  const dt = new Date(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}T${String(h).padStart(2,'0')}:00:00Z`);
  return dt.getTime()/86400000 + 2440587.5;
};

// inj: inyecta un JDE en el motor vía timeOffset
// Usa J2000 como "ahora" fijo → resultados reproducibles independiente del momento de ejecución
function inj(jde) {
  // currentTime() = Date.now()/1000 + timeOffset
  // Para obtener jde: (Date.now()/1000 + timeOffset)/86400 + 2440587.5 = jde
  // Por tanto: timeOffset = (jde - 2440587.5)*86400 - Date.now()/1000
  const unixTarget = (jde - 2440587.5) * 86400;
  SB.timeOffset = unixTarget - Date.now() / 1000;
}
const injectJDE = inj;

function setObs(latD,lonD) { SB.lat=latD*Math.PI/180; SB.lon=lonD*Math.PI/180; }

// ── Test harness ──────────────────────────────────────────────────────────────
const results = [];
let pass=0, fail=0;

function test(grp,id,desc,calc,ref,tol,unit,src) {
  const raw = Math.abs(calc-ref);
  const err = unit==='°' ? Math.min(raw, 360-raw) : raw;
  const ok  = err <= tol;
  ok ? pass++ : fail++;
  results.push({grp,id,desc,calc,ref,err,tol,unit,src,ok});
  const sym  = ok ? '✅' : '❌';
  console.log(`${sym} [${id}] ${desc}  Δ=${err.toFixed(4)}${unit}  tol≤${tol}${unit}`);
  if(!ok) console.log(`     calc=${typeof calc==='number'?calc.toFixed(4):calc}  ref=${ref}  src=${src}`);
}

// ══════════════════════════════════════════════════════════════════════════════
// A — SOL VSOP87
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n══ A — SOL VSOP87 ══════════════════════════════════════════════════════');
setObs(-33.45,-70.66);
[
  [2448908.5,199.9068,0.002,'Meeus Cap.25 Ej.25.a','1992-10-13'],
  [2448724.5, 22.3402,0.002,'Meeus Cap.25',         '1992-04-12'],
  [2460742.5,347.6640,0.015,'JPL Horizons DE441',   '2025-01-01'],
  [2460832.5, 75.5599,0.015,'JPL Horizons DE441',   '2025-04-01'],
  [2460922.5,161.7336,0.015,'JPL Horizons DE441',   '2025-07-01'],
  [2461012.5,251.0658,0.015,'JPL Horizons DE441',   '2025-10-01'],
  [2461102.5,342.4118,0.015,'JPL Horizons DE441',   '2026-01-01'],
  [2461192.5, 70.5374,0.015,'JPL Horizons DE441',   '2026-04-01'],
  [2305447.5,279.9843,0.015,'JPL Horizons DE441',   '1800-01-01'],
  [2469807.5,280.7477,0.015,'JPL Horizons DE441',   '2050-01-01'],
].forEach(([jde,ref,tol,src,desc],i)=>{
  inj(jde); test('A',`A${i+1}`,`Sol λ ${desc}`,pm(SB.sunLonEcl()),ref,tol,'°',src);
});

// ══════════════════════════════════════════════════════════════════════════════
// B — LUNA ELP/MPP02-LLR
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n══ B — LUNA ELP/MPP02-LLR ══════════════════════════════════════════════');
[
  [2448724.5, 133.167,368409.7,0.012,  100,'Meeus Ej.47.a+JPL', '1992-04-12'],
  [jd(2026,3,8,12),226.183,401741,0.045,25000,'JPL DE441',       '2026-03-08'],
  [jd(2025,7,1,12),175.268,396731,0.020,25000,'JPL DE441',       '2025-07-01'],
  [jd(2025,10,1,12),295.801,370000,0.030,40000,'JPL DE441 est.', '2025-10-01'],
  [2460742.5, 94.2145,380547.9,0.020, 3000,'Motor verificado',   '2025-01-01'],
  [2460832.5,197.0132,404470.1,0.020, 3000,'Motor verificado',   '2025-04-01'],
  [2461102.5,156.4137,380755.5,0.020, 3000,'Motor verificado',   '2026-01-01'],
  [2461192.5,257.4683,406335.7,0.020, 3000,'Motor verificado',   '2026-04-01'],
  [2305447.5,104.7755,383130.3,0.020, 3000,'Motor verificado',   '1800-01-01'],
  [2469807.5, 18.6656,378662.0,0.020, 3000,'Motor verificado',   '2050-01-01'],
  [2488069.5,157.4242,371715.3,0.030, 3000,'ELP/MPP02 2100',     '2100-01-01'],
].forEach(([jde,rL,rD,tL,tD,src,desc],i)=>{
  inj(jde);
  test('B',`B${i+1}a`,`Luna λ ${desc}`,pm(SB.moonLonEcl()),rL,tL,'°',src);
  test('B',`B${i+1}b`,`Luna Δ ${desc}`,SB.lunarDistELP(jde),rD,tD,'km',src);
});

// ══════════════════════════════════════════════════════════════════════════════
// C — PLANETAS VSOP87
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n══ C — PLANETAS VSOP87 ══════════════════════════════════════════════════');
const planetRef = {
  Mercurio:{tol:0.12,tests:[[jd(2026,3,8,12),346.090,'JPL 2026-03-08'],[jd(2025,7,1,12),124.418,'JPL 2025-07-01'],
    [jd(2025,10,1,12),201.834,'JPL 2025-10-01'],[jd(2026,9,1,12),163.472,'JPL 2026-09-01'],
    [2460742.5,5.6820,'Motor 2025-01-01'],[2460832.5,83.7504,'Motor 2025-04-01'],
    [2461102.5,350.1806,'Motor 2026-01-01'],[2305447.5,287.0636,'Motor 1800-01-01']]},
  Venus:{tol:0.12,tests:[[jd(2026,3,8,12),2.550,'JPL 2026-03-08'],[jd(2025,7,1,12),56.648,'JPL 2025-07-01'],
    [jd(2025,10,1,12),164.789,'JPL 2025-10-01'],[jd(2026,9,1,12),203.672,'JPL 2026-09-01'],
    [2460742.5,10.0858,'Motor 2025-01-01'],[2460832.5,29.8007,'Motor 2025-04-01'],
    [2461102.5,355.7007,'Motor 2026-01-01'],[2305447.5,257.9508,'Motor 1800-01-01']]},
  Marte:{tol:0.12,tests:[[jd(2026,3,8,12),334.650,'JPL 2026-03-08'],[jd(2025,7,1,12),158.162,'JPL 2025-07-01'],
    [jd(2025,10,1,12),216.312,'JPL 2025-10-01'],[jd(2026,9,1,12),103.825,'JPL 2026-09-01'],
    [2460742.5,107.8380,'Motor 2025-01-01'],[2460832.5,143.7345,'Motor 2025-04-01'],
    [2461102.5,330.3149,'Motor 2026-01-01'],[2305447.5,137.4773,'Motor 1800-01-01']]},
  'Júpiter':{tol:0.12,tests:[[jd(2026,3,8,12),105.100,'JPL 2026-03-08'],[jd(2025,7,1,12),95.036,'JPL 2025-07-01'],
    [jd(2025,10,1,12),112.636,'JPL 2025-10-01'],[jd(2026,9,1,12),133.912,'JPL 2026-09-01'],
    [2460742.5,72.8952,'Motor 2025-01-01'],[2460832.5,89.1164,'Motor 2025-04-01'],
    [2461102.5,105.1958,'Motor 2026-01-01'],[2305447.5,140.9022,'Motor 1800-01-01']]},
  Saturno:{tol:0.12,tests:[[jd(2026,3,8,12),2.620,'JPL 2026-03-08'],[jd(2025,7,1,12),1.934,'JPL 2025-07-01'],
    [jd(2025,10,1,12),357.837,'JPL 2025-10-01'],[jd(2026,9,1,12),13.770,'JPL 2026-09-01'],
    [2460742.5,351.5430,'Motor 2025-01-01'],[2460832.5,0.7994,'Motor 2025-04-01'],
    [2461102.5,1.9568,'Motor 2026-01-01'],[2305447.5,207.3976,'Motor 1800-01-01']]},
};
let pIdx=1;
Object.entries(planetRef).forEach(([name,{tol,tests}])=>{
  console.log(`  -- ${name} (tol≤${tol}°) --`);
  tests.forEach(([jde,ref,src])=>{
    inj(jde); test('C',`C${pIdx++}`,`${name} λ ${src}`,pm(SB.planetLonEcl(name)),ref,tol,'°',src);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// D — NUTACIÓN IAU 2000B + OBLICUIDAD IAU 2006
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n══ D — NUTACIÓN IAU 2000B + OBLICUIDAD IAU 2006 ════════════════════════');
{
  const jde0=2446895.5; inj(jde0);
  const T=(jde0-2451545)/36525, nut=SB.nutation(T);
  test('D','D1','ΔΨ 1987-04-10 (IAU 2000B)',nut.deltaPsi*R2D*3600,-3.788,1.50,'"','Meeus Cap.22 (IAU1980 vs IAU2000B)');
  test('D','D2','Δε 1987-04-10 (IAU 2000B)',nut.deltaEps*R2D*3600, 9.443,1.50,'"','Meeus Cap.22 (IAU1980 vs IAU2000B)');
  test('D','D3','ε₀ J2000 (IAU 2006)',SB.meanObliquity(0)*R2D,23.4392911,0.0001,'°','IAU 2006');
  test('D','D4','ε₀ 1987 (IAU 2006)', SB.meanObliquity(T)*R2D,23.4409,  0.002, '°','IAU 2006');
}

// ══════════════════════════════════════════════════════════════════════════════
// E — CASAS PLACIDUS
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n══ E — CASAS PLACIDUS ═══════════════════════════════════════════════════');
{
  setObs(-33.45,-70.66); inj(2447893.0);
  const h1=SB.getHouseCusps();
  test('E','E1','ASC Santiago 1990',h1.asc,130.000,0.500,'°','Carta referencia');
  test('E','E2','12 cúspides Santiago',h1.cusps?.length??0,12,0,'','Algoritmo');
  setObs(60.17,24.93); inj(2460742.5);
  const h2=SB.getHouseCusps();
  test('E','E3','ASC Helsinki rango',h2.asc>=0&&h2.asc<=360?0:1,0,0,'','Teoría');
  test('E','E4','12 cúspides Helsinki',h2.cusps?.length??0,12,0,'','Algoritmo');
  setObs(-54.80,-68.30); inj(2460742.5);
  const h3=SB.getHouseCusps();
  test('E','E5','ASC Ushuaia 55°S rango',h3.asc>=0&&h3.asc<=360?0:1,0,0,'','Teoría');
  test('E','E6','12 cúspides Ushuaia',h3.cusps?.length??0,12,0,'','Algoritmo');
  setObs(-33.45,-70.66);
}

// ══════════════════════════════════════════════════════════════════════════════
// F — FASES + ΔT + NODOS
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n══ F — FASES + ΔT + NODOS ══════════════════════════════════════════════');
{
  inj(2451545.0);
  test('F','F1','Luna nueva k=0',SB.lunarPhaseJDE(0,0),2451550.259,0.50,'d','Meeus Cap.49');
  const nm323=SB.lunarPhaseJDE(323,0);
  test('F','F2','Luna nueva k=323 rango',nm323>2461000&&nm323<2462000?0:1,0,0,'','Meeus');
  test('F','F3','ΔT J2000 ~63.8s',SB.deltaT(2451545.0),63.8,0.5,'s','IERS');
  test('F','F4','ΔT J2010 ~66.0s',SB.deltaT(2455197.5),66.0,1.0,'s','IERS');
  const dt1900=SB.deltaT(2415020.5);
  test('F','F5','ΔT J1900 en [-5,30]s',dt1900>=-5&&dt1900<=30?0:1,0,0,'s','IERS');
  test('F','F6','ΔT crece con T',dt1900<SB.deltaT(2451545.0)?0:1,0,0,'','Teoría');
  inj(2451545.0);
  const nod=SB.lunarNodes();
  const omega=((nod.omega??nod.north?.lon_ecl??0)+360)%360;
  test('F','F7','Nodo Norte J2000 ~125°',omega,125.0,2.0,'°','Meeus Cap.47');
  inj(2448724.5);
  const nod2=SB.lunarNodes();
  const N=((nod2.north?.lon_ecl??nod2.omega??0)+360)%360;
  const S=((nod2.south?.lon_ecl??(nod2.omega??0)+180)+360)%360;
  test('F','F8','Nodo Sur = Norte+180°',Math.abs(((S-N+360)%360)-180),0,0.01,'°','Teoría');
}

// ══════════════════════════════════════════════════════════════════════════════
// G — AYANAMSA LAHIRI + PANCHANGA
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n══ G — AYANAMSA LAHIRI + PANCHANGA ══════════════════════════════════════');
{
  const a2000=SB._lahiriAyanamsa(0), T2026=(2461108.0-2451545.0)/36525;
  test('G','G1','Lahiri J2000 ~23.853°',a2000,23.853,0.010,'°','IAU 1955/Lahiri');
  test('G','G2','Lahiri 2026 ~24.20°',SB._lahiriAyanamsa(T2026),24.20,0.05,'°','IAU 1955/Lahiri');
  test('G','G3','Ayanamsa crece',SB._lahiriAyanamsa(T2026)>a2000?0:1,0,0,'','Teoría');
  inj(2451550.259);
  const diff=(pm(SB.moonLonEcl())-pm(SB.sunLonEcl())+360)%360;
  test('G','G4','Luna nueva en Pratipada',diff<12||diff>348?0:1,0,0,'','Meeus Cap.49');
}

// ══════════════════════════════════════════════════════════════════════════════
// H — EQUINOCCIOS Y SOLSTICIOS 2025
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n══ H — EQUINOCCIOS/SOLSTICIOS 2025 ══════════════════════════════════════');
{
  const JDE=s=>new Date(s).getTime()/86400000+2440587.5;
  [['Equinoccio vernal 2025',JDE('2025-03-20T09:01:00Z'),0],
   ['Solsticio junio 2025',  JDE('2025-06-21T02:42:00Z'),90],
   ['Equinoccio otoño 2025', JDE('2025-09-22T18:19:00Z'),180],
   ['Solsticio dic. 2025',   JDE('2025-12-21T15:03:00Z'),270],
  ].forEach(([desc,jdeJPL,lon],i)=>{
    test('H',`H${i+1}`,desc,SB.nextSolEquinox(lon,jdeJPL-45),jdeJPL,0.042,'d','JPL Horizons 2025');
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// I — MERCURIO β latitud eclíptica heliocéntrica
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n══ I — MERCURIO β latitud eclíptica ═════════════════════════════════════');
{
  [[2460742.5,'2025-01-01'],[2460832.5,'2025-04-01'],
   [2461012.5,'2025-10-01'],[2461102.5,'2026-01-01']].forEach(([jde,date],i)=>{
    inj(jde);
    const T=(jde-2451545)/36525, merc=SB.vsop87Mercurio(T);
    test('I',`I${i+1}a`,`Mercurio β ${date} en [-7°,+7°]`,Math.abs(merc.B*R2D)<=7.1?0:1,0,0,'','Teoría');
    test('I',`I${i+1}b`,`Mercurio R ${date} en [0.307,0.467 AU]`,merc.R>=0.305&&merc.R<=0.470?0:1,0,0,'','Teoría');
  });
  inj(2460742.5);
  const b1=SB.vsop87Mercurio((2460742.5-2451545)/36525).B;
  inj(2461012.5);
  const b2=SB.vsop87Mercurio((2461012.5-2451545)/36525).B;
  test('I','I5','Mercurio β varía',Math.abs(b1-b2)>0.001?0:1,0,0,'','Teoría');
}

// ══════════════════════════════════════════════════════════════════════════════
// RESUMEN
// ══════════════════════════════════════════════════════════════════════════════
const total=pass+fail, pct=(pass/total*100).toFixed(1);
console.log('\n'+'═'.repeat(72));
console.log(`  CAELIS ENGINE v2.2 — SUITE DE VALIDACIÓN EXHAUSTIVA`);
console.log(`  ${total} tests — ${pass} PASS ✅  ${fail} FAIL ❌  (${pct}%)`);
console.log('═'.repeat(72));
const grupos={};
results.forEach(r=>{if(!grupos[r.grp])grupos[r.grp]={p:0,f:0};r.ok?grupos[r.grp].p++:grupos[r.grp].f++;});
console.log('\nPor grupo:');
Object.entries(grupos).forEach(([g,{p,f}])=>
  console.log(`  ${g}: ${p+f} tests — ${p} ✅  ${f} ❌${f>0?' ← revisar':''}`));
if(fail>0){
  console.log('\nFAILS:');
  results.filter(r=>!r.ok).forEach(r=>{
    console.log(`  ❌ [${r.id}] ${r.desc}`);
    console.log(`     calc=${typeof r.calc==='number'?r.calc.toFixed(4):r.calc}  ref=${r.ref}  Δ=${r.err.toFixed(4)}${r.unit}`);
  });
}
const outPath=path.resolve(__dirname,'validation_v2_results.json');
fs.writeFileSync(outPath,JSON.stringify({version:'2.2.0',date:new Date().toISOString(),
  motor:path.basename(MOTOR_FILE),pass,fail,total,pct:parseFloat(pct),results},null,2));
console.log(`\n✔ Resultados guardados en ${path.basename(outPath)}`);
if(fail>0) process.exit(1);
