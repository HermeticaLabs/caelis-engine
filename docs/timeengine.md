# TimeEngine — API Reference

**Caelis Engine 2.2 · Hermetica Labs**
© 2024–2026 Cristian Valeria Bravo / Hermetica Labs

TimeEngine gestiona el tiempo como variable de primera clase en Caelis Engine. Convierte entre sistemas de tiempo, genera snapshots astronómicos completos y controla el estado temporal del instrumento.

**Integrado en:** `caelis_engine_2_2.html` (monolito) — todas las funciones disponibles en scope global.

---

## Control de velocidad temporal

El instrumento tiene **11 velocidades** predefinidas (v2.2 — ampliado desde 7):

```javascript
speedLevels = [-31536000, -2592000, -86400, -3600, -60, 1, 60, 3600, 86400, 2592000, 31536000]
speedLabels = ["−1año/s","−1mes/s","−1día/s","−1h/s","−1min/s","1x","1min/s","1h/s","1día/s","1mes/s","1año/s"]
```

El índice 5 (`speedIndex = 5`) es tiempo real (`1x`). Los índices 0–4 van hacia el pasado, 6–10 hacia el futuro.

**Pausa:** `timeSpeed = 0` detiene la simulación sin modificar `speedIndex`. Se activa automáticamente al usar la función "Saltar al eclipse" (`_eclJumpTo`).

---

## Conversión de fechas

### `julianDate()` → `number`

Fecha Juliana actual del engine (TT). Incluye corrección ΔT (Morrison & Stephenson 2004).

```javascript
julianDate() // → JD del instante actual según timeOffset
```

---

### `julianDateUTC()` → `number`

Fecha Juliana UTC sin corrección ΔT.

---

### `currentTime()` → `number`

Tiempo Unix del engine en segundos: `Date.now()/1000 + timeOffset`.

---

### `getLST()` → `number` (radianes)

Tiempo sidéreo local aparente en radianes (0–2π). Incluye nutación IAU 2000B vía GAST.

---

### `deltaT(jd)` → `number` (segundos)

Diferencia TT − UTC. Tabla de 74 puntos (500–2150 d.C.), extrapolación parabólica fuera del rango.

```javascript
deltaT(2451545.0) // → 63.8 s  (J2000.0)
deltaT(2460000.0) // → ~70 s   (2024)
```

---

## Snapshot astronómico completo

### `getSnapshotAt(jdTarget, latDeg, lonDeg)` → `Snapshot`

Snapshot para una Fecha Juliana y ubicación específicas. Preserva y restaura el estado del engine (try/finally) — no afecta la animación.

```javascript
const snap = getSnapshotAt(2451545.0, -33.45, -70.66);
```

---

### `getSnapshot()` → `Snapshot`

Snapshot del instante actual del engine (usa `timeOffset` activo y `lat`/`lon` globales).

---

## Estructura del Snapshot

```javascript
{
  meta: {
    jd,           // Fecha Juliana (TT)
    utc,          // string ISO 8601
    timestamp,    // Unix timestamp
    lst_deg,      // Tiempo sidéreo local en grados
    obliquity,    // Oblicuidad verdadera en grados (IAU 2006 + IAU 2000B)
    delta_psi,    // Nutación en longitud en grados (IAU 2000B)
    delta_eps,    // Nutación en oblicuidad en grados (IAU 2000B)
    observer: { lat, lon }  // en grados
  },

  bodies: {
    Sol:       BodyData,
    Luna:      BodyData,
    Mercurio:  BodyData,
    Venus:     BodyData,
    Marte:     BodyData,
    Júpiter:   BodyData,
    Saturno:   BodyData,
    NodoNorte: BodyData,
    NodoSur:   BodyData
  },

  luna: {
    phase_ratio,   // 0–1 (0=nueva, 0.5=llena)
    phase_deg,     // 0–180° elongación angular Sol–Luna
    illumination   // 0–1 fracción iluminada
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

## Navegación temporal

### `timeOffset` (global, segundos)

Offset aplicado al reloj del sistema. `timeOffset = 0` es el instante presente.

### `resetNow()` → `void`

Vuelve al instante presente, velocidad 1x.

### `changeSpeed(delta)` → `void`

Cambia la velocidad en `delta` pasos (−1 = más lento, +1 = más rápido).

### `_eclJumpTo(jde)` → `void` *(v2.2)*

Salta al momento exacto de un eclipse (JDE en Tiempo Dinámico), pausa la simulación y cierra el panel de eclipses. Muestra un toast con instrucciones.

```javascript
_eclJumpTo(2461500.5) // → salta al momento del eclipse, velocidad pausada
// Toast: "⊗ Eclipse — usa ◀ ▶ para explorar · Reset para volver al presente"
```

---

## i18n — Internacionalización *(v2.2)*

### `_t(key)` → `string`

Retorna el string del idioma activo. Fallback a español si la clave no existe en el idioma seleccionado.

```javascript
_t("btn.atacir")     // → "☊ Atacir" (ES) | "☊ Atacir" (EN)
_t("ia.generate")    // → "✦ Generar lectura" (ES) | "✦ Generate reading" (EN)
_t("ia.voice.lang")  // → "es-ES" (ES) | "en-US" (EN)
```

### `_setLang(lang)` → `void`

Cambia el idioma activo y persiste en `localStorage`.

```javascript
_setLang('en') // → cambia a English, actualiza todo el DOM
_setLang('es') // → cambia a Español
```

### `_applyLang()` → `void`

Aplica el idioma activo a todos los elementos `[data-i18n]` del DOM, placeholders `[data-i18n-ph]`, spinner, hints IA y botones del Settings.

---

## Ejemplo completo

```javascript
// Snapshot natal: Santiago de Chile, 1 enero 1990, 12:00 UTC
const snap = getSnapshotAt(
  new Date('1990-01-01T12:00:00Z').getTime()/86400000 + 2440587.5,
  -33.45,
  -70.66
);

console.log('ASC natal:', snap.houses.asc.toFixed(2) + '°');
console.log('Sol:', snap.bodies.Sol.lon_ecl.toFixed(2) + '°');
console.log('Luna:', snap.bodies.Luna.lon_ecl.toFixed(2) + '°');
console.log('Fase lunar:', (snap.luna.illumination * 100).toFixed(1) + '%');
console.log('Nutación ΔΨ:', snap.meta.delta_psi.toFixed(6) + '°'); // IAU 2000B
console.log('Oblicuidad:', snap.meta.obliquity.toFixed(4) + '°');  // IAU 2006
```

---

*Caelis Engine 2.2 · Hermetica Labs · Cristian Valeria Bravo*
*github.com/HermeticaLabs/caelis-engine*
