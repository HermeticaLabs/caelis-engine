# AstroCore — API Reference

**Caelis Engine 2.2 · Hermetica Labs**
© 2024–2026 Cristian Valeria Bravo / Hermetica Labs

AstroCore es el núcleo matemático de Caelis Engine. Implementa los algoritmos astronómicos de precisión profesional sobre los que se construyen todos los modos del instrumento.

**Rango de validez:** 500–2150 d.C. (tabla ΔT Morrison & Stephenson 2004) · Estabilidad numérica hasta 3000 d.C.

---

## Fundamentos matemáticos

| Algoritmo | Fuente | Precisión verificada |
|---|---|---|
| Posiciones planetarias | VSOP87 — Bretagnon & Francou 1987 | < 0.131° vs JPL Horizons DE441 |
| Posición lunar | ELP/MPP02-LLR — Chapront & Francou 2002 (164L+105B+29R) | < 0.0067° longitud |
| Nutación | IAU 2000B — 77 series lunisolares (Mathews 2002) | < 1 mas ΔΨ |
| Oblicuidad | IAU 2006 — Capitaine et al. (polinomio grado 5) | < 0.001° en J2000 |
| Casas Placidus | Newton-Raphson — Meeus Cap.37 | < 0.105° ASC |
| ΔT | Morrison & Stephenson 2004 + IERS — 74 puntos | 500–2150 d.C. |
| Nodos lunares | Meeus Cap.47 — 15 términos periódicos | < 1.32° Ω |
| Ayanamsa Lahiri | IAU 1955 + Lieske 1977 (2° orden) | < 0.01° |

Referencia canónica: Jean Meeus — *Astronomical Algorithms*, 2ª ed. (1998)

---

## Instalación y uso

### En Node.js

```javascript
const AstroCore = require('./src/astro/AstroCore.js');

// Globals requeridos por el módulo
global.lat        = -33.45 * Math.PI / 180; // latitud observador (radianes)
global.lon        = -70.66 * Math.PI / 180; // longitud observador (radianes)
global.timeOffset = 0;                        // offset temporal en segundos
global.R_TIERRA   = 6371.0;                  // radio geocéntrico en km

const { sunPosition, moonPosition, planetPosition } = AstroCore;
```

### En browser (monolito)

AstroCore está embebido en `caelis_engine_2_2.html`. Todas las funciones están disponibles en el scope global.

### Uso modular básico

```javascript
const snap = getSnapshotAt(2451545.0, -33.45, -70.66); // J2000.0
console.log(snap.bodies.Sol.lon_ecl);   // longitud eclíptica del Sol
console.log(snap.bodies.Luna.lon_ecl);  // longitud eclíptica de la Luna
console.log(snap.houses.asc);           // Ascendente Placidus
```

---

## Constantes exportadas

```javascript
deg2rad  // Math.PI / 180
rad2deg  // 180 / Math.PI
C_LIGHT  // 173.1446326 UA/día — velocidad de la luz
R_TIERRA // 6371.0 km — radio geocéntrico medio
```

---

## Tiempo y fechas julianas

### `deltaT(jd)` → `number`

Diferencia TT − UTC en segundos. Interpolada desde tabla Morrison & Stephenson 2004 (74 puntos, 500–2150 d.C.), con extrapolación polinomial fuera del rango.

```javascript
deltaT(2451545.0) // → 63.8 s  (J2000.0)
deltaT(2460000.0) // → ~70 s   (2024)
```

**Rango garantizado:** 500–2150 d.C. · **Fuente:** Morrison & Stephenson (2004) JHA 35, 327 + Stephenson, Morrison & Hohenkerk (2016) Proc. R. Soc. A 472.

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

Nutación en longitud (ΔΨ) y en oblicuidad (Δε). **IAU 2000B — 77 series lunisolares** (Mathews, Herring & Buffett 2002). Argumentos fundamentales IAU 2000A (Capitaine et al. 2003). Resultado memoizado por T.

```javascript
const T   = getJulianCenturies(jd);
const nut = nutation(T);

nut.deltaPsi  // radianes — nutación en longitud
nut.deltaEps  // radianes — nutación en oblicuidad
```

**Precisión:** ΔΨ < 1 mas, Δε < 1 mas (IERS Conventions 2003).

> **v2.1 → v2.2:** Migrado de IAU 1980 (63 series) a IAU 2000B (77 series). Ganancia: 10× en precisión ΔΨ (10 mas → 1 mas).

---

### `meanObliquity(T)` → `number` (grados)

Oblicuidad media de la eclíptica. **Fórmula IAU 2006** (Capitaine et al. 2006) — polinomio de grado 5.

```javascript
const T = getJulianCenturies(2451545.0);
meanObliquity(T) // → 23.4392911°  (J2000.0)
```

> **v2.1 → v2.2:** Migrado de IAU 1980 a IAU 2006. Ganancia: ε₀ precisa a 0.002" en J2000.

---

### `trueObliquity(T)` → `number` (grados)

Oblicuidad verdadera = oblicuidad media + Δε (nutación).

```javascript
trueObliquity(getJulianCenturies(2451545.0)) // → 23.4393° (J2000.0)
```

---

## Tiempo sidéreo

### `gast(jd)` → `number` (grados, 0–360)

Tiempo sidéreo aparente de Greenwich (GAST). Incluye corrección por ecuación de los equinoccios (ΔΨ × cos ε). **Fuente:** IAU 2000A, Meeus Cap.12.

---

## Posiciones principales

### `sunPosition()` → `{ ra, dec }`

Posición geocéntrica aparente del Sol en coordenadas ecuatoriales. Incluye: VSOP87 para la Tierra, corrección de nutación IAU 2000B, aberración anual.

```javascript
const sun = sunPosition();
sun.ra    // ascensión recta en radianes (0–2π)
sun.dec   // declinación en radianes
```

**Precisión:** < 0.0011° (Meeus Cap.25, verificado contra JPL Horizons DE441).

---

### `moonPosition()` → `{ ra, dec }`

Posición geocéntrica aparente de la Luna con paralaje topocéntrico. **ELP/MPP02-LLR** (Chapront & Francou 2002): 164 términos en longitud, 105 en latitud, 29 en distancia. Incluye correcciones A1/A2/A3, nutación IAU 2000B, paralaje topocéntrico RA/Dec.

```javascript
const moon = moonPosition();
moon.ra    // ascensión recta en radianes (topocéntrica)
moon.dec   // declinación en radianes (topocéntrica)
```

**Precisión:** longitud < 0.0067° (24"), latitud < 0.001°, distancia < 27 km.

> **Nota:** depende de los globals `lat`, `lon`, `R_TIERRA` para el paralaje topocéntrico.

> **v2.1:** Migrado de ELP2000/Meeus Cap.47 (60L+60B+30R) a ELP/MPP02-LLR (164L+105B+29R, calibrado LLR). Ganancia: 63× en precisión de longitud.

---

### `planetPosition(name)` → `{ ra, dec }`

Posición geocéntrica aparente de un planeta en coordenadas ecuatoriales. Incluye: VSOP87, corrección de tiempo-luz (2 iteraciones), nutación IAU 2000B, aberración anual.

```javascript
planetPosition('Mercurio')  // RA/Dec ecuatoriales
planetPosition('Venus')
planetPosition('Marte')
planetPosition('Júpiter')
planetPosition('Saturno')
```

**Nombres válidos:** `'Mercurio'`, `'Venus'`, `'Marte'`, `'Júpiter'`, `'Saturno'`

**Nota sobre Mercurio:** usa Meeus Cap.31 (ecuación del centro, 5 términos, e=0.206) en lugar del VSOP87 truncado, que acumula errores significativos por la alta excentricidad orbital.

**Precisión:** < 0.131° vs JPL Horizons DE441.

---

## Longitudes eclípticas

Versiones optimizadas que devuelven solo la longitud eclíptica geocéntrica en grados (0–360). Usadas por el sistema de aspectos.

### `sunLonEcl()` → `number` (grados)
### `moonLonEcl()` → `number` (grados)
### `planetLonEcl(name)` → `number` (grados)

```javascript
sunLonEcl()           // → 353.3° (Sol en Piscis, marzo 2026)
moonLonEcl()          // → longitud eclíptica de la Luna
planetLonEcl('Marte') // → longitud eclíptica de Marte
```

---

## Luna — nodos, fases y distancia

### `lunarNodes()` → `{ north, south, omega }`

Nodo ascendente con **15 correcciones periódicas** (Meeus Cap.47 completo). Memoizado por T.

```javascript
const nodes = lunarNodes();
nodes.omega         // nodo ascendente Ω en grados (0–360)
nodes.north.ra      // RA del nodo norte en radianes
nodes.north.dec     // Dec del nodo norte en radianes
nodes.south.lon_ecl // longitud eclíptica del nodo sur = omega + 180°
```

**Precisión:** < 1.32° Ω en J2000. Error anterior (5 términos): ~1.24° — mejora 5×.

---

### `lunarPhaseJDE(k, phase)` → `number` (JDE)

JDE de la fase lunar número `k`. Meeus Cap.49.

```javascript
// phase: 0=nueva, 0.25=cuarto creciente, 0.5=llena, 0.75=cuarto menguante
lunarPhaseJDE(0,   0)    // primera luna nueva después de J2000
lunarPhaseJDE(323, 0.5)  // luna llena cercana a marzo 2026
```

---

### `lunarDistELP(jde)` → `number` (km)

Distancia geocéntrica lunar en km para una JDE dada.

```javascript
lunarDistELP(2448724.5) // → 368,409 km  (Meeus Ej.47.a)
```

---

## Snapshot astronómico completo

### `getSnapshotAt(jdTarget, latDeg, lonDeg)` → `Snapshot`

Captura el estado completo del cielo en un instante y lugar dados. Preserva y restaura el estado del engine sin afectar la animación (try/finally).

```javascript
const snap = getSnapshotAt(2451545.0, -33.45, -70.66); // J2000.0, Santiago

snap.meta.jd           // Fecha Juliana (TT)
snap.meta.obliquity    // oblicuidad verdadera en grados
snap.meta.delta_psi    // nutación ΔΨ en grados (IAU 2000B)
snap.bodies.Sol.lon_ecl   // longitud eclíptica del Sol
snap.bodies.Luna.lon_ecl  // longitud eclíptica de la Luna
snap.houses.asc        // Ascendente Placidus
snap.houses.cusps      // array de 12 cúspides en grados
snap.luna.illumination // fracción iluminada (0–1)
```

---

## Casas — Placidus e Iguales

### `getHouseCusps(forLatDeg?)` → `{ cusps, asc, mc, eps, system }`

Calcula las 12 cúspides de casas para la posición y tiempo actuales.

```javascript
const { cusps, asc, mc } = getHouseCusps();
// cusps: array de 12 longitudes eclípticas en grados
// asc:   Ascendente en grados (0–360)
// mc:    Medio Cielo en grados (0–360)
// system: 'equal' | 'placidus'
```

Para latitudes > ~66° Placidus no converge — cae silenciosamente a casas iguales.

---

## Ayanamsa Lahiri

### `_lahiriAyanamsa(T)` → `number` (grados)

Ayanamsa Lahiri de **segundo orden** — integral exacta de la precesión de Lieske (1977) / IAU 2006. Valor J2000.0: 23.85282°.

```javascript
_lahiriAyanamsa(0)     // → 23.853° (J2000.0)
_lahiriAyanamsa(-1)    // → ~22.46° (1900 d.C.)
```

**Ganancia vs 1° orden:** hasta 3' en 1600 d.C., ~0.8' en 1800 d.C., ~0.2' en 2100 d.C.

---

## Calculadoras de alta precisión

### `calcEclipsesCore(latDeg, lonDeg, rangoAnios, doSolar, doLunar, jdCenter)` → `Array`

Detecta eclipses solares y lunares usando las series de fases lunares validadas. Incluye visibilidad georeferenciada y distancia lunar.

```javascript
const eclipses = calcEclipsesCore(-33.45, -70.66, 2, true, true);
// Array de: { jde, tipo, subtipo, magnitud, dist, visible }
```

**Rango configurable:** ±6 meses, ±1, ±2, ±5, ±10 años.

---

### `calcPanchangaCore(dateStr, timeStr)` → `Object`

Almanaque védico completo. Usa Ayanamsa Lahiri 2° orden y ELP/MPP02-LLR.

```javascript
const p = calcPanchangaCore('2026-03-20', '09:00');
p.tithiName    // 'Dvitiya'
p.vara.name    // 'Viernes'
p.naks.name    // 'Uttara Bhadrapada'
p.yogaName     // 'Shiva'
p.karanaName   // 'Bava'
p.ayanDeg      // ayanamsa en grados
```

---

### `calcSinastriaCore(dateA, timeA, latA, lonA, dateB, timeB, latB, lonB)` → `Object`

Sinastría completa entre dos cartas natales. Incluye aspectos cruzados con pesos simbólicos, antiscias, simetrías y overlay de casas.

---

### `calcAtacirCore(rxDate, rxTime, rxLat, rxLon, trDate, trTime, trLat, trLon, key)` → `Object`

Direcciones primarias por ascensión oblicua (método Al-Biruni / Ptolomeo). Claves: 1.0 (Ptolomeo), 0.8219 (Naibod), 0.9856 (Solar).

---

## Notas de implementación

**Mercurio** usa Meeus Cap.31 (ecuación del centro, 5 términos) en lugar del VSOP87 truncado — más estable para e=0.206.

**Aberración anual** se calcula por diferencial numérico del vector velocidad terrestre (Δτ = 0.001 siglos) — más precisa para cuerpos con latitud eclíptica no nula.

**Paralaje lunar** es topocéntrico: corrección en RA y Dec según la posición del observador sobre el esferoide WGS84.

**Nutación memoizada:** `nutation(T)` y `lunarNodes()` almacenan en caché el último resultado. La caché se invalida automáticamente cuando cambia el tiempo del instrumento.

---

## Verificación de precisión

```bash
node test_precision.js      # 29/29 tests de algoritmos
node suite_v2_final.js      # 145/145 tests vs JPL Horizons + Meeus
python audit_prod.py index.html  # 51/51 checks de producción
```

---

*Caelis Engine 2.2 · Hermetica Labs · Cristian Valeria Bravo*
*github.com/HermeticaLabs/caelis-engine*
