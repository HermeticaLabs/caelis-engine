# TimeEngine — API Reference

**Caelis Engine 1.5 · Hermetica Labs**  
© 2024–2026 Cristian Valeria Bravo / Hermetica Labs

TimeEngine gestiona el tiempo como variable de primera clase en Caelis Engine. Convierte entre sistemas de tiempo, genera snapshots astronómicos completos y controla el estado temporal del instrumento.

**Depende de:** AstroCore.js

---

## Instalación y uso

```javascript
const AstroCore = require('./src/astro/AstroCore.js');
Object.assign(global, AstroCore);

// Globals requeridos
global.lat        = -33.45 * Math.PI / 180;
global.lon        = -70.66 * Math.PI / 180;
global.timeOffset = 0;
global.timeSpeed  = 1;
global.speedIndex = 3;
global.houseSystem = 'placidus';
global.R_TIERRA   = 6371.0;

const TimeEngine = require('./src/TimeEngine.js');
```

---

## Control de velocidad temporal

El instrumento tiene 7 velocidades predefinidas:

```javascript
TimeEngine.speedLevels  // [-86400, -3600, -60, 1, 60, 3600, 86400]
TimeEngine.speedLabels  // ["−1día/s","−1h/s","−1min/s","1x","1min/s","1h/s","1día/s"]
```

El índice 3 (`speedIndex = 3`) es tiempo real (`1x`). Los índices 0–2 van hacia el pasado, 4–6 hacia el futuro.

---

## Conversión de fechas

### `TimeEngine.dateToJD(dateStr, timeStr)` → `number`

Convierte fecha y hora UTC a Fecha Juliana.

```javascript
TimeEngine.dateToJD('2000-01-01', '12:00') // → 2451545.0  (J2000.0)
TimeEngine.dateToJD('2026-03-14', '00:00') // → JD actual
```

| Parámetro | Tipo | Formato |
|---|---|---|
| `dateStr` | `string` | `'YYYY-MM-DD'` |
| `timeStr` | `string` | `'HH:MM'` (UTC) |

---

### `TimeEngine.jdToDate(jd)` → `Date`

Convierte Fecha Juliana a objeto `Date` UTC.

```javascript
TimeEngine.jdToDate(2451545.0) // → Date: 2000-01-01T12:00:00.000Z
```

---

### `TimeEngine.jdToString(jd)` → `string`

Convierte Fecha Juliana a string UTC legible.

```javascript
TimeEngine.jdToString(2451545.0) // → "2000-01-01 12:00Z"
```

---

### `TimeEngine.age(jdBirth, jdNow)` → `number`

Años transcurridos entre dos Fechas Julianas.

```javascript
const jdNac = TimeEngine.dateToJD('1990-01-01', '12:00');
const jdHoy = TimeEngine.dateToJD('2026-01-01', '12:00');
TimeEngine.age(jdNac, jdHoy) // → 36.0
```

---

## Tiempo del engine

### `TimeEngine.julianDate()` → `number`

Fecha Juliana actual del engine (TT). Incluye corrección ΔT.

```javascript
TimeEngine.julianDate() // → JD del instante actual según timeOffset
```

---

### `TimeEngine.julianDateUTC()` → `number`

Fecha Juliana UTC sin corrección ΔT.

---

### `TimeEngine.currentTime()` → `number`

Tiempo Unix del engine en segundos: `Date.now()/1000 + timeOffset`.

---

### `TimeEngine.getLST()` → `number` (radianes)

Tiempo sidéreo local aparente en radianes (0–2π).

```javascript
TimeEngine.getLST() // → ángulo horario del punto vernal en el meridiano local
```

---

## Snapshots astronómicos

El snapshot es la estructura central de datos del engine: captura el estado completo del cielo en un instante y lugar dados.

### `TimeEngine.snapshotNow()` → `Snapshot`

Snapshot del instante actual del engine (usa `timeOffset` activo).

```javascript
const snap = TimeEngine.snapshotNow();
```

---

### `TimeEngine.snapshotAt(jdTarget, latDeg, lonDeg)` → `Snapshot`

Snapshot para una Fecha Juliana y ubicación específicas. Preserva y restaura el estado del engine sin afectar la animación.

```javascript
const snap = TimeEngine.snapshotAt(2451545.0, -33.45, -70.66);
```

| Parámetro | Tipo | Descripción |
|---|---|---|
| `jdTarget` | `number` | Fecha Juliana objetivo |
| `latDeg` | `number` | Latitud en grados decimales |
| `lonDeg` | `number` | Longitud en grados decimales |

---

## Estructura del Snapshot

```javascript
{
  meta: {
    jd,           // Fecha Juliana (TT)
    utc,          // string ISO 8601
    timestamp,    // Unix timestamp
    lst_deg,      // Tiempo sidéreo local en grados
    obliquity,    // Oblicuidad verdadera en grados
    delta_psi,    // Nutación en longitud en grados
    delta_eps,    // Nutación en oblicuidad en grados
    observer: { lat, lon }  // en grados
  },

  bodies: {
    Sol:       BodyData,
    Luna:      BodyData,
    Mercurio:  BodyData,
    Venus:     BodyData,
    Marte:     BodyData,
    Jupiter:   BodyData,
    Saturno:   BodyData,
    NodoNorte: BodyData,
    NodoSur:   BodyData
  },

  luna: {
    phase_ratio,   // 0–1 (0=nueva, 0.5=llena, 1=nueva — ciclo completo)
    phase_deg,     // 0–180° elongación angular Sol–Luna
    illumination   // 0–1 fracción iluminada (0=nueva, 1=llena)
  },

  houses: {
    asc,     // Ascendente en grados (0–360)
    mc,      // Medio Cielo en grados (0–360)
    cusps,   // Array de 12 longitudes eclípticas en grados
    system   // 'equal' | 'placidus'
  }
}
```

---

## Estructura BodyData

Cada cuerpo en `snap.bodies` tiene la siguiente forma:

```javascript
{
  ra,       // Ascensión recta en grados (0–360)
  dec,      // Declinación en grados
  lon_ecl,  // Longitud eclíptica geocéntrica en grados (0–360)
  lat_ecl,  // Latitud eclíptica geocéntrica en grados
  alt,      // Altitud sobre el horizonte en grados (con refracción)
  az,       // Azimut en grados (0–360, N=0, E=90)
  visible,  // boolean — true si alt > 0°
  house     // Casa astrológica (1–12)
}
```

---

## Ejemplo completo

```javascript
// Snapshot natal: Santiago de Chile, 1 enero 1990, 12:00 UTC
const jdNac = TimeEngine.dateToJD('1990-01-01', '12:00');
const natal = TimeEngine.snapshotAt(jdNac, -33.45, -70.66);

console.log('ASC natal:', natal.houses.asc.toFixed(2) + '°');
console.log('Sol:', natal.bodies.Sol.lon_ecl.toFixed(2) + '°');
console.log('Luna:', natal.bodies.Luna.lon_ecl.toFixed(2) + '°');
console.log('Fase lunar:', (natal.luna.illumination * 100).toFixed(1) + '%');

// Snapshot actual
const ahora = TimeEngine.snapshotNow();
const edad  = TimeEngine.age(jdNac, ahora.meta.jd);
console.log('Edad:', edad.toFixed(2), 'años');
```

---

## Tests

```bash
node tests/timeengine.test.js
```

**Resultado esperado:** todos los tests en verde.

Tests incluidos: conversión JD↔fecha, J2000.0 exacto, LST válido (0–2π), snapshot con todos los cuerpos, Sol en J2000 ~280°.

---

*Caelis Engine 1.5 · Hermetica Labs · Cristian Valeria Bravo*  
*github.com/HermeticaLabs/caelis-engine*
