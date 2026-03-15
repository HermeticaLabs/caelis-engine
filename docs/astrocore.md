# AstroCore — API Reference

**Caelis Engine 1.5 · Hermetica Labs**  
© 2024–2026 Cristian Valeria Bravo / Hermetica Labs

AstroCore es el núcleo matemático de Caelis Engine. Implementa los algoritmos astronómicos de precisión profesional sobre los que se construyen todos los modos del instrumento.

**Rango de validez:** 1800–2100 d.C. (series VSOP87 truncadas, Meeus Apéndice II)

---

## Fundamentos matemáticos

| Algoritmo | Fuente | Precisión verificada |
|---|---|---|
| Posiciones planetarias | VSOP87 — Bretagnon & Francou 1987 | < 0.003° vs JPL Horizons |
| Posición lunar | ELP2000-82B — Chapront (Meeus Cap.47) | < 0.016° longitud |
| Nutación | IAU 1980 — 63 series | < 0.004 arcsec |
| Oblicuidad | IAU 1980 | < 0.002° |
| Casas Placidus | Newton-Raphson | < 0.01° |
| ΔT | Tabla IERS interpolada | < 1s (1800–2100) |

Referencia canónica: Jean Meeus — *Astronomical Algorithms*, 2ª ed.

---

## Instalación y uso

### En Node.js

```javascript
const AstroCore = require('./src/astro/AstroCore.js');

// Exponer globales requeridos por el módulo
global.lat        = -33.45 * Math.PI / 180; // latitud observador (radianes)
global.lon        = -70.66 * Math.PI / 180; // longitud observador (radianes)
global.timeOffset = 0;                        // offset temporal en segundos
global.R_TIERRA   = 6371.0;                  // radio geocéntrico en km

const { sunPosition, moonPosition, planetPosition } = AstroCore;
```

### En browser (monolito)

AstroCore está embebido en `caelis_engine_1_5.html`. Todas las funciones están disponibles en el scope global.

### Uso modular básico

```javascript
const jd   = AstroCore.dateToJD('2026-03-14', '12:00'); // J2026
const sun  = AstroCore.sunPosition();
const moon = AstroCore.moonPosition();
const mars = AstroCore.planetPosition('Marte');

console.log(sun.ra * 180/Math.PI);   // RA en grados
console.log(moon.dec * 180/Math.PI); // Dec en grados
console.log(mars.lon);               // longitud eclíptica en grados
```

---

## Constantes exportadas

```javascript
AstroCore.deg2rad  // Math.PI / 180
AstroCore.rad2deg  // 180 / Math.PI
AstroCore.C_LIGHT  // 173.1446326 UA/día — velocidad de la luz
```

---

## Tiempo y fechas julianas

### `deltaT(jd)` → `number`

Diferencia TT − UTC en segundos. Interpolada desde tabla IERS (1620–2100), con extrapolación polinomial fuera del rango.

```javascript
deltaT(2451545.0) // → 63.8 s  (J2000.0)
deltaT(2460000.0) // → ~70 s   (2023)
```

| Parámetro | Tipo | Descripción |
|---|---|---|
| `jd` | `number` | Fecha Juliana |

---

### `getJulianCenturies(jd)` → `number`

Siglos julianos desde J2000.0. Usado internamente por todos los algoritmos.

```javascript
getJulianCenturies(2451545.0) // → 0.0   (J2000.0)
getJulianCenturies(2488070.0) // → 1.0   (J2100.0)
```

---

## Nutación y oblicuidad

### `nutation(T)` → `{ deltaPsi, deltaEps }`

Nutación en longitud (ΔΨ) y en oblicuidad (Δε). IAU 1980, 63 series periódicas.

```javascript
const T   = getJulianCenturies(jd);
const nut = nutation(T);

nut.deltaPsi  // radianes — nutación en longitud
nut.deltaEps  // radianes — nutación en oblicuidad
```

Precisión verificada: ΔΨ < 0.004 arcsec, Δε < 0.002 arcsec (Meeus Cap.22).

---

### `meanObliquity(T)` → `number` (radianes)

Oblicuidad media de la eclíptica. Fórmula IAU 1980.

---

### `trueObliquity(T)` → `number` (radianes)

Oblicuidad verdadera = oblicuidad media + Δε (nutación).

```javascript
const T   = getJulianCenturies(2451545.0);
trueObliquity(T) * rad2deg // → 23.4393°  (J2000.0)
```

---

## Tiempo sidéreo

### `gast(jd)` → `number` (grados, 0–360)

Tiempo sidéreo aparente de Greenwich (GAST). Incluye corrección por ecuación de los equinoccios (nutación en longitud × cos ε).

```javascript
gast(2451545.0) // → grados de tiempo sidéreo en Greenwich
```

---

## Posiciones principales

### `sunPosition()` → `{ ra, dec }`

Posición geocéntrica aparente del Sol en coordenadas ecuatoriales. Incluye: VSOP87 para la Tierra, corrección de nutación, aberración anual.

```javascript
const sun = sunPosition();
sun.ra    // ascensión recta en radianes (0–2π)
sun.dec   // declinación en radianes
```

Precisión: < 0.001° (Meeus Cap.25, verificado en dos fechas de referencia).

---

### `moonPosition()` → `{ ra, dec }`

Posición geocéntrica aparente de la Luna con paralaje topocéntrico. ELP2000 Cap.47: 60 términos en longitud, 60 en latitud, 30 en distancia. Incluye correcciones A1/A2/A3, nutación en longitud, paralaje topocéntrico RA/Dec.

```javascript
const moon = moonPosition();
moon.ra    // ascensión recta en radianes (topocéntrica)
moon.dec   // declinación en radianes (topocéntrica)
```

Precisión: longitud < 0.016°, latitud < 0.001°, distancia < 27 km (Meeus Ej.47.a).

> **Nota:** depende de los globals `lat`, `lon`, `R_TIERRA` para el paralaje topocéntrico.

---

### `planetPosition(name)` → `{ ra, dec }`

Posición geocéntrica aparente de un planeta en coordenadas ecuatoriales. Incluye: VSOP87, corrección de tiempo-luz, nutación, aberración anual.

```javascript
planetPosition('Mercurio')  // RA/Dec ecuatoriales
planetPosition('Venus')
planetPosition('Marte')
planetPosition('Júpiter')
planetPosition('Saturno')
```

**Nombres válidos:** `'Mercurio'`, `'Venus'`, `'Marte'`, `'Júpiter'`, `'Saturno'`

> No incluir la Tierra — no es un cuerpo visible en el sistema hermético.

Precisión planetas exteriores: < 0.003° vs JPL Horizons (2026-03-08).

---

## Longitudes eclípticas (para aspectos)

Versiones optimizadas que devuelven solo la longitud eclíptica geocéntrica en grados (0–360). Usadas internamente por el sistema de aspectos.

### `sunLonEcl()` → `number` (grados)
### `moonLonEcl()` → `number` (grados)
### `planetLonEcl(name)` → `number` (grados)

```javascript
sunLonEcl()           // → 353.3° (Sol en Piscis, marzo 2026)
moonLonEcl()          // → longitud eclíptica de la Luna
planetLonEcl('Marte') // → longitud eclíptica de Marte
```

---

## VSOP87 — funciones internas

Posiciones heliocentricas de cada cuerpo. **Para uso avanzado.** En uso normal se prefiere `planetPosition()`.

### `heliocentricCoords(name, T)` → `{ x, y, z }`

Coordenadas heliocentricas eclípticas rectangulares en UA.

```javascript
const T = getJulianCenturies(jd);
const pos = heliocentricCoords('Marte', T);
// pos.x, pos.y, pos.z en UA
```

### `geocentricEclipticWithLightTime(name, T, jd)` → `{ lambda, beta, dist }`

Coordenadas geocéntricas eclípticas con corrección de tiempo-luz (iteración en dos pasos).

```javascript
const { lambda, beta, dist } = geocentricEclipticWithLightTime('Venus', T, jd);
// lambda: longitud eclíptica en radianes
// beta:   latitud eclíptica en radianes
// dist:   distancia geocéntrica en UA
```

---

## Luna — nodos y fases

### `lunarNodes()` → `{ north, south, omega }`

Nodos lunares medios con correcciones periódicas (Meeus 47.7).

```javascript
const nodes = lunarNodes();
nodes.omega        // nodo ascendente Ω en grados (0–360)
nodes.north.ra     // RA del nodo norte en radianes
nodes.north.dec    // Dec del nodo norte en radianes
nodes.south.lon_ecl // longitud eclíptica del nodo sur = omega + 180°
```

---

### `lunarPhaseJDE(k, phase)` → `number` (JDE)

JDE de la fase lunar número `k`. Meeus Cap.49.

```javascript
// phase: 0=nueva, 0.25=cuarto creciente, 0.5=llena, 0.75=cuarto menguante
lunarPhaseJDE(0,   0)    // primera luna nueva después de J2000
lunarPhaseJDE(323, 0.5)  // luna llena cercana a marzo 2026
```

Precisión: < 0.17 días (Meeus Cap.49).

---

### `proximasFasesLunares(jdNow, nCiclos)` → `Array`

Devuelve las próximas fases lunares a partir de `jdNow`.

```javascript
const fases = proximasFasesLunares(jd, 3);
// Array de objetos: { jde, fase, nombre }
// fase: 0=nueva, 0.25=creciente, 0.5=llena, 0.75=menguante
```

---

### `lunarApsisJDE(k, isApogeo)` → `number` (JDE)

JDE del apsis lunar número `k`. Meeus Cap.50.

```javascript
lunarApsisJDE(0, false) // perigeo cercano a J2000
lunarApsisJDE(0, true)  // apogeo cercano a J2000
```

---

### `lunarDistELP(jde)` → `number` (km)

Distancia geocéntrica lunar en km para una JDE dada. ELP2000.

```javascript
lunarDistELP(2448724.5) // → 368,436 km  (Meeus Ej.47.a)
```

---

### `proximosApsis(jdNow, n)` → `Array`

Devuelve los próximos `n` apsis lunares (perigeos y apogeos).

```javascript
const apsis = proximosApsis(jd, 4);
// Array: { jde, tipo: 'perigeo'|'apogeo', dist_km }
```

---

## Transformaciones de coordenadas

### `eclipticToEquatorialWithEps(lambda, beta, eps)` → `{ ra, dec }`

Transformación directa eclíptica → ecuatorial con oblicuidad conocida. Todo en radianes.

```javascript
const { ra, dec } = eclipticToEquatorialWithEps(lambda, beta, eps);
```

---

### `eclipticLonToRaDec(lonDeg, epsRad?)` → `{ ra, dec }`

Convierte longitud eclíptica en grados (latitud β=0) a RA/Dec en radianes. Si no se pasa `epsRad` usa la oblicuidad verdadera actual.

```javascript
const { ra, dec } = eclipticLonToRaDec(65.6);   // Sol en Géminis
```

---

### `annualAberration(lambda, beta, T)` → `{ lambda, beta }`

Corrección de aberración anual. Calculada por diferencial numérico del vector velocidad heliocéntrico de la Tierra.

---

### `applyRefraction(alt)` → `number` (radianes)

Refracción atmosférica estándar (Bennett 1982). Solo para altitudes > −1°.

```javascript
applyRefraction(0)  // → ~0.0083 rad (+0.48° en el horizonte)
```

---

## Casas — Placidus e Iguales

### `getHouseCusps(forLatDeg?)` → `{ cusps, asc, mc, eps, system }`

Calcula las 12 cúspides de casas para la posición y tiempo actuales del engine.

```javascript
const { cusps, asc, mc } = getHouseCusps();
// cusps: array de 12 longitudes eclípticas en grados
// asc:   Ascendente en grados (0–360)
// mc:    Medio Cielo en grados (0–360)
// system: 'equal' | 'placidus'
```

Si `forLatDeg` se omite, usa la latitud del observador global. Para latitudes > ~66° Placidus no converge y cae silenciosamente a casas iguales.

---

### `placidusHouseCusps(asc, mc, eps, latDeg)` → `Array | null`

Cúspides Placidus por trisección del semiarco diurno/nocturno (Newton-Raphson). Devuelve `null` si no converge.

```javascript
const cusps = placidusHouseCusps(asc, mc, eps, -33.45);
// Array de 12 longitudes eclípticas en grados, o null
```

---

## Ascensión oblicua y semiarco

### `obliqAscension(raDeg, decDeg, latDeg)` → `number` (grados)

Ascensión oblicua: `OA = RA − arcsin(tan δ · tan φ)`. Base del método de direcciones primarias (Atacir).

```javascript
obliqAscension(65.6, 21.2, -33.45) // → OA del Sol en grados
```

---

### `semiArcDiurno(decDeg, latDeg)` → `number | null`

Semiarco diurno: `SAD = 90° + arcsin(tan δ · tan φ)`. Devuelve `null` para cuerpos circumpolares.

---

## Radio geocéntrico

### `geocentricRadius()` → `number` (km)

Radio de la Tierra en la latitud del observador. Esferoide WGS84 (a=6378.137 km, b=6356.7523 km).

```javascript
geocentricRadius() // → 6356.8 km en los polos, 6378.1 km en el ecuador
```

---

## Verificación de precisión

Ejecuta la suite completa desde el navegador:

```bash
# Iniciar servidor local
node -e "const h=require('http'),f=require('fs'),p=require('path');h.createServer((req,res)=>{let fp='.'+req.url;if(fp==='./') fp='./index.html';f.readFile(fp,(e,d)=>{if(e){res.writeHead(404);res.end()}else{const ext=p.extname(fp);const m={'html':'text/html','js':'application/javascript'};res.writeHead(200,{'Content-Type':m[ext.slice(1)]||'text/plain'});res.end(d)}})}).listen(8080)"
# Abrir http://localhost:8080/validation.html
```

O ejecutar los tests Jest:

```bash
node tests/astrocore.test.js
```

**Resultado esperado: 30/30 PASS** (validation.html) y todos los tests Jest en verde.

---

## Notas de implementación

**Mercurio** usa Meeus Cap.31 (ecuación del centro, 5 términos) en lugar del VSOP87 truncado, que acumulaba errores significativos para este planeta de alta excentricidad (e=0.206).

**Aberración anual** se calcula por diferencial numérico del vector velocidad terrestre en lugar de la fórmula analítica clásica — más precisa para cuerpos con latitud eclíptica no nula.

**Paralaje lunar** es topocéntrico: la posición de la Luna se corrige en RA y Dec según la posición del observador sobre la superficie terrestre.

---

*Caelis Engine 1.5 · Hermetica Labs · Cristian Valeria Bravo*  
*github.com/HermeticaLabs/caelis-engine*
