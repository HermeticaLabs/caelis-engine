# Caelis Engine

**Cada número que produce este motor puede ser trazado hasta un modelo astronómico conocido, con precisión declarada y sin suposiciones ocultas.**

Caelis Engine es un motor de cómputo determinista para datos celestes. Reemplaza APIs opacas y cálculos de caja negra con un sistema completamente auditable, reproducible y autocontenido — ejecutándose en el browser o Node.js, sin servidor, sin API key, sin archivos de efemérides y sin dependencias externas.

```json
{
  "schema_version": "3.1",
  "meta": {
    "jd_tt": 2461193.499437,
    "frame": {
      "planets":  "VSOP87B (Bretagnon & Francou 1987)",
      "moon":     "ELP/MPP02-LLR · 164L+105B+60R términos",
      "nutation": "IAU 2000B · 77 términos luni-solares"
    }
  },
  "bodies": {
    "Sol":     { "lon_ecl_geocentric_deg": 71.498, "alt_geometric_deg": -27.896, "above_horizon": false },
    "Luna":    { "lon_ecl_geocentric_deg": 269.330, "lon_ecl_topocentric_deg": 270.082, "dist_km": 388954 },
    "Jupiter": { "lon_ecl_geocentric_deg": 114.254, "alt_geometric_deg": 8.267, "above_horizon": true }
  }
}
```

---

## Esto no es una API. Es un protocolo.

Un protocolo tiene un contrato, invariantes y garantías verificables. Una API simplemente responde.

Caelis Engine define un contrato estricto — schema v3.1 — donde cada campo nombra su propio sistema de referencia, cada algoritmo está declarado en `meta.frame`, y cada output es determinista. Misma entrada, mismo resultado. Siempre. De forma demostrable.

**Si estás construyendo una app de astrología, una visualización del cielo, una herramienta de mecánica celeste, o cualquier sistema que necesite datos astronómicos confiables sin infraestructura adicional — esto es para ti.**

Sin backend que mantener. Sin límites de requests. Sin suscripción para computar el cielo.

Es lo que los productos están construidos sobre.

---

## Quién construye con Caelis Engine

**Aplicaciones de astrología** — cartas natales, tránsitos, sinastría, progresiones.
Posiciones planetarias reales sin costos de suscripción ni límites de velocidad. Funciona 100% offline en el dispositivo del usuario. Ningún dato sale del cliente.

**Herramientas de astronomía y educación** — planificación observacional, simuladores del cielo, planetarios interactivos.
El output determinista garantiza resultados reproducibles en cada dispositivo, en cada ejecución.

**Pipelines de IA e infraestructura de datos** — cualquier sistema donde los datos celestes deben ser consistentes, trazables e inequívocos.
Un plugin desactivado no existe en el JSON. Sin campos nulos, sin estados implícitos.

**Juegos y experiencias interactivas** — sistemas de cielo procedural, lógica de calendario lunar, mecánica celeste.
Distribución en un solo archivo. Funciona offline. Sin paso de build.

---

## Arquitectura

```
TimeEngine → AstroCore → [ A.T.A.C.I.R. (opcional) ]
```

Tres capas. Una dirección. Separación estricta de responsabilidades.

### TimeEngine
El único módulo que lee `Date.now()`. Computa JD, ΔT, GAST, LST, estado del observador. Todos los demás módulos reciben el tiempo como parámetro explícito.

### AstroCore
Recibe el tiempo de TimeEngine. Computa el estado físico del sistema solar. Retorna un snapshot astronómico puro — schema v3.1.

Cero conceptos interpretativos. Sin casas. Sin aspectos. Sin contenido simbólico.
El motor no interpreta el cielo. Lo mide.

### A.T.A.C.I.R. — capa interpretativa
**A**rc-based **T**ransformation of **A**stronomical **C**oordinates for **I**nterpretive **R**esolution.

Arquitectónicamente separada del núcleo astronómico por diseño. Recibe el snapshot. Agrega cómputos derivados bajo `result.atacir.*`. Nunca modifica los datos astronómicos.

Plugins disponibles: `houses` · `aspects` · `symmetries` · `lunar` · `cycles` · `resonances` · `panchanga` · `synastry` · `eclipses` · `directions`

Un plugin desactivado no existe en el JSON.

---

## Qué computa

| Cómputo | Algoritmo | Precisión declarada |
|---|---|---|
| Planetas Mercurio–Neptuno | VSOP87B (Bretagnon & Francou 1987) | < 1′ |
| Posición de la Luna | ELP/MPP02-LLR · 164L+105B+60R términos | < 10″ |
| Nutación | IAU 2000B · 77 términos luni-solares | < 1 mas |
| Oblicuidad | IAU 2006 (Capitaine et al.) | < 0.001° |
| Corrección de tiempo de luz | Iterativa · C = 173.14 UA/día | — |
| Aberración anual | κ = 9.9365×10⁻⁵ rad | — |
| Paralaje lunar | Topocéntrico completo · WGS-84 | máx ~57′ |
| Refracción atmosférica | Bennett (1982) · Atmósfera ISA | ±0.1′ > 15° |
| ΔT | Tabla IERS 500–2150 DC + Morrison-Stephenson | — |
| Tiempo sidéreo | GAST IAU 2006 | < 0.1″ |
| Nodos lunares | Meeus Cap.47 | — |

Cada snapshot contiene altitud geométrica y aparente.
Cada campo nombra su propio sistema de referencia.
Cada algoritmo está declarado en `meta.frame`.

---

## Inicio rápido

### Opción A — Archivo único (recomendado)

Descarga `dist/caelis-minimal.html`. Ábrelo con un servidor local:

```bash
python -m http.server 8080
# abrir http://localhost:8080/caelis-minimal.html
```

Sin instalación. Sin dependencias. Sin paso de build.

### Opción B — Node.js o bundler

```javascript
import { getSnapshot, getSnapshotAt, setObserver }
  from 'caelis-engine';

// Configurar observador — Santiago, Chile
setObserver(-33.45, -70.66);

// Estado celeste actual
const snapshot = getSnapshot();

console.log(snapshot.bodies.Sol.lon_ecl_geocentric_deg);  // longitud eclíptica
console.log(snapshot.bodies.Sol.alt_geometric_deg);       // altitud geométrica
console.log(snapshot.bodies.Luna.dist_km);                // distancia lunar
console.log(snapshot.meta.obliquity.true_deg);            // oblicuidad verdadera
console.log(snapshot.meta.frame.planets);                 // declaración del algoritmo
```

### Opción C — Cualquier época, cualquier ubicación

```javascript
// J2000.0 desde Londres — completamente determinista
const j2000 = getSnapshotAt(2451545.0, { lat_deg: 51.5, lon_deg: -0.1 });

// 10-Abr-1987 desde París — época de referencia Meeus Cap.25
const meeus = getSnapshotAt(2446895.5, { lat_deg: 48.8, lon_deg: 2.3 });
```

---

## Por qué no una API de terceros o Swiss Ephemeris

|  | APIs de terceros | Swiss Ephemeris | **Caelis Engine** |
|---|:---:|:---:|:---:|
| Corre en el browser | ✗ | ✗ | **✓** |
| Sin servidor requerido | ✗ | ✗ | **✓** |
| Sin API key ni costo | ✗ | ✓ | **✓** |
| Precisión declarada por campo | ✗ | parcial | **✓** |
| Algoritmo nombrado en cada output | ✗ | ✗ | **✓** |
| Archivo JS único · sin instalación | ✗ | ✗ | **✓** |
| Capaz de funcionar offline | ✗ | ✓ | **✓** |
| Output versioned schema-estable | ✗ | ✗ | **✓** |
| Capa interpretativa opcional | N/A | N/A | **✓** |

---

## Validación

```bash
node validation/run.js
# 28 assertions · 5 épocas · 0 fallos
```

| Época | Fuente | Assertions |
|---|---|---|
| J2000.0 — 2000-Ene-01 12:00 TT | IAU SOFA + paper VSOP87 | 6 |
| 1987-Abr-10 (Meeus Cap.25) | Meeus *Astronomical Algorithms* 2da ed. | 4 |
| 1992-Abr-12 Venus (Meeus Cap.33) | Tabla de verificación VSOP87 | 1 |
| Baseline regresión 2026-Jun-01 | Output canónico Caelis v4.0 | 8 |
| Invariantes Schema v3.1 | Contrato de arquitectura | 9 |

---

## A.T.A.C.I.R. Cloud

La capa interpretativa está disponible como API gestionada a través de Hermetica Labs.

Lo que agrega sobre el núcleo astronómico:
sistemas de casas · aspectos natales y de tránsito · simetrías eclípticas · direcciones primarias · ápsis y ciclos lunares · resonancias orbitales · Panchanga Védico · sinastría · predicción de eclipses · **Firma Digital R1-R5**

La lógica de cómputo es propietaria y corre del lado del servidor.
El cliente es open source: [`client/AtacirClient.js`](client/AtacirClient.js)

**Acceso temprano:** `hermeticalabs.dev@proton.me`

---

## Licencia

Caelis Engine se publica bajo **AGPL-3.0**.

Libre para usar en software open source bajo los términos de AGPL-3.0.
**Si estás construyendo un producto comercial o propietario, necesitas una licencia comercial.**

Licencias comerciales: `hermeticalabs.dev@proton.me`
Detalles: [`COMMERCIAL_LICENSE.md`](COMMERCIAL_LICENSE.md)

---

## Sobre el proyecto

Caelis Engine fue construido por **Cristian Valeria Bravo** bajo **Hermetica Labs**.

Dos principios guiaron cada decisión:

**Computar el cielo, no interpretarlo.**
AstroCore mide el estado físico. A.T.A.C.I.R. deriva significado geométrico — solo cuando se solicita, solo en su propio namespace, sin modificar jamás la verdad astronómica.

**Cero suposiciones ocultas.**
Cada número es trazable. Cada algoritmo está declarado. Cada output es reproducible.

---

*Caelis Engine no es el producto. Es sobre lo que los productos se construyen.*

---

*Caelis Engine v4.0 · Hermetica Labs · © 2024–2026 Cristian Valeria Bravo*
