# Caelis Engine

> **Motor v4.0.9 · Schema v3.1** — son números de versión independientes.
> El Schema v3.1 define el contrato de salida y es estable entre parches del motor.
>
> **v4.0.8** corrige un error de unidades (minutos de arco → grados) en la refracción atmosférica que inflaba `alt_apparent_deg`. Las versiones ≤ 4.0.7 están afectadas — actualiza. Ver [`CHANGELOG.md`](CHANGELOG.md).
>
> **v4.0.9** sincroniza el paquete de npm con el repositorio (CHANGELOG, version del cliente, documentacion) - sin cambios en los calculos astronomicos.

[![npm version](https://img.shields.io/npm/v/caelis-engine.svg?style=flat-square)](https://www.npmjs.com/package/caelis-engine)
[![npm downloads](https://img.shields.io/npm/dm/caelis-engine.svg?style=flat-square)](https://www.npmjs.com/package/caelis-engine)
[![GitHub stars](https://img.shields.io/github/stars/HermeticaLabs/caelis-engine?style=flat-square)](https://github.com/HermeticaLabs/caelis-engine/stargazers)
[![license](https://img.shields.io/npm/l/caelis-engine.svg?style=flat-square)](./LICENSE)
[![demo](https://img.shields.io/badge/demo-live-brightgreen?style=flat-square)](https://hermeticalabs.github.io/caelis-engine/)
[![CI](https://github.com/HermeticaLabs/caelis-engine/actions/workflows/validate.yml/badge.svg)](https://github.com/HermeticaLabs/caelis-engine/actions/workflows/validate.yml)

**Cada número que produce este motor puede rastrearse hasta un modelo astronómico conocido, con precisión declarada y cero supuestos ocultos.**

Caelis Engine es un motor de cálculo determinista para datos celestes. Reemplaza las APIs opacas y los cálculos de caja negra por un sistema auditable, reproducible y autocontenido — que corre íntegramente en el navegador o en Node.js, sin servidor, sin clave de API, sin archivos de efemérides y sin dependencias.

```json
{
  "schema_version": "3.1",
  "meta": {
    "jd_tt": 2461193.499437,
    "frame": {
      "planets":  "VSOP87B (Bretagnon & Francou 1987)",
      "moon":     "ELP/MPP02-LLR · 164L+105B+60R terms",
      "nutation": "IAU 2000B · 77 luni-solar terms"
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

## El problema

La mayoría de las plataformas que trabajan con datos celestes dependen de:

- APIs de terceros con lógica interna opaca
- Resultados que no se pueden auditar ni reproducir de forma independiente
- Costos de infraestructura que crecen con el uso
- Una dependencia que no controlas — y que no puedes inspeccionar

Cuando algo devuelve un número incorrecto, no hay forma de saber por qué.
Cuando la API cambia, tu producto se rompe.
Cuando el servicio cae, caes con él.

---

## La solución

Caelis Engine te da control total sobre tu capa de cálculo celeste.

- **Determinista** — misma entrada, misma salida. Siempre. Demostrablemente.
- **Auditable** — cada algoritmo declarado en `meta.frame`. Cada número rastreable hasta su fuente.
- **Autocontenido** — corre en el navegador, en Node.js, en funciones edge, offline. No requiere backend.
- **Schema estable** — salidas JSON versionadas con garantías de compatibilidad a largo plazo.
- **Cero dependencias** — un solo archivo JavaScript. Sin instalación, sin paso de compilación, sin red.

Esto no es una API. Es un protocolo — con un contrato, invariantes y garantías verificables.

Es aquello sobre lo que se construyen los productos.

---

## Quién construye con Caelis Engine

**Aplicaciones de astrología** — cartas natales, tránsitos, sinastría, progresiones.
Posiciones planetarias reales sin costos de suscripción ni límites de uso. Funciona 100% offline en el dispositivo del usuario. Ningún dato sale del cliente.

**Herramientas de astronomía y educación** — planificación de observaciones, simuladores de cielo, planetarios interactivos.
La salida determinista implica resultados reproducibles en cualquier dispositivo, en cada ejecución.

**Pipelines de IA e infraestructura de datos** — cualquier sistema donde los datos celestes deban ser consistentes, trazables e inequívocos.
Un plugin desactivado no existe en el JSON. Sin campos nulos, sin estados implícitos.

**Juegos y experiencias interactivas** — sistemas de cielo procedural, lógica de calendario lunar, mecánica celeste.
Distribución en un solo archivo. Funciona offline. No requiere paso de compilación.

---

## Arquitectura

```
TimeEngine → AstroCore → [ A.T.A.C.I.R. (opcional) ]
```

Tres capas. Una sola dirección. Separación estricta de responsabilidades.

### TimeEngine
El único módulo que lee `Date.now()`. Calcula JD, ΔT, GAST, LST y el estado del observador. Todos los demás módulos reciben el tiempo como parámetro explícito.

### AstroCore
Recibe el tiempo de TimeEngine. Calcula el estado físico del sistema solar. Devuelve una instantánea astronómica pura — schema v3.1.

Cero conceptos interpretativos. Sin casas. Sin aspectos. Sin contenido simbólico.
El motor no interpreta el cielo. Lo mide.

### A.T.A.C.I.R. — capa interpretativa
**A**rc-based **T**ransformation of **A**stronomical **C**oordinates for **I**nterpretive **R**esolution.

Separada arquitectónicamente del núcleo astronómico por diseño. Recibe la instantánea. Añade cálculos derivados bajo `result.atacir.*`. Nunca modifica los datos astronómicos.

Plugins disponibles: `houses` · `aspects` · `symmetries` · `lunar` · `cycles` · `resonances` · `panchanga` · `synastry` · `eclipses` · `directions`

Un plugin desactivado no existe en el JSON.

---

## Qué calcula

| Cálculo | Algoritmo | Precisión declarada |
|---|---|---|
| Planetas Mercurio–Neptuno | VSOP87B (Bretagnon & Francou 1987) | < 1′ |
| Posición de la Luna | ELP/MPP02-LLR · 164L+105B+60R términos | < 10″ |
| Nutación | IAU 2000B · 77 términos lunisolares | < 1 mas |
| Oblicuidad | IAU 2006 (Capitaine et al.) | < 0.001° |
| Corrección por tiempo luz | Iterativa · C = 173.14 UA/día | — |
| Aberración anual | κ = 9.9365×10⁻⁵ rad | — |
| Paralaje lunar | Topocéntrico completo · WGS-84 | máx ~57′ |
| Refracción atmosférica | Sæmundsson (1986) · inversa de Bennett (1982), coincide en ~0.1′ · atmósfera ISA | ±0.1′ > 15° |
| ΔT | Tabla IERS 500–2150 d.C. + Morrison-Stephenson | — |
| Tiempo sidéreo | GAST IAU 2006 | ~15″ RMS (simplificación JD_TT, ver SCIENTIFIC_VALIDATION.md) |
| Nodos lunares | Meeus Cap.47 | — |

Cada instantánea contiene tanto la altitud geométrica como la aparente.
Cada campo nombra su propio marco de coordenadas.
Cada algoritmo se declara en `meta.frame`.

---

## Instalación

```bash
npm install caelis-engine
```

O descarga la implementación de referencia en un solo archivo:
[`caelis-minimal.html`](caelis-minimal.html) — ábrelo con cualquier servidor local, sin instalación.

> **Modos de API:**
> - `setObserver()` + `getSnapshot()` — API conveniente con estado. El observador se configura una vez y se llama repetidamente. No es pura en sentido funcional — depende de estado global.
> - `getSnapshotAt(jd_tt, observer)` — API determinista explícita. Sin estado global. Los mismos argumentos siempre producen la misma salida.

## Inicio rápido

### Opción A — Archivo único (recomendada)

Descarga `dist/caelis-minimal.html`. Ábrelo con un servidor local:

```bash
python -m http.server 8080
# abre http://localhost:8080/caelis-minimal.html
```

Sin instalación. Sin dependencias. Sin paso de compilación.

### Opción B — Node.js o bundler

```javascript
import { getSnapshot, getSnapshotAt, setObserver }
  from 'caelis-engine';

// Definir observador — Santiago, Chile
setObserver(-33.45, -70.66);

// Estado celeste actual
const snapshot = getSnapshot();

console.log(snapshot.bodies.Sol.lon_ecl_geocentric_deg);  // longitud eclíptica
console.log(snapshot.bodies.Sol.alt_geometric_deg);       // altitud geométrica
console.log(snapshot.bodies.Luna.dist_km);                // distancia lunar
console.log(snapshot.meta.obliquity.true_deg);            // oblicuidad verdadera
console.log(snapshot.meta.frame.planets);                 // declaración del algoritmo
```

### Opción C — Cualquier época, cualquier lugar

```javascript
// J2000.0 desde Londres — totalmente determinista
const j2000 = getSnapshotAt(2451545.0, { lat_deg: 51.5, lon_deg: -0.1 });

// 10-abr-1987 desde París — época de referencia de Meeus Cap.25
const meeus = getSnapshotAt(2446895.5, { lat_deg: 48.8, lon_deg: 2.3 });
```

### Opción D — A.T.A.C.I.R. Cloud

```javascript
import AtacirClient from 'caelis-engine/client';

const client   = new AtacirClient({ apiKey: 'your-key' });
const snapshot = getSnapshot();
const result   = await client.compute(snapshot, {
  plugins: ['houses', 'aspects', 'panchanga']
});

console.log(result.atacir.houses.asc);          // Ascendente
console.log(result.atacir.aspects.natales[0]);  // aspecto natal más fuerte
console.log(result.atacir.panchanga.tithiName); // almanaque védico
// result.atacir.signature — certificación de integridad R1-R5
```

---

## Schema de salida v3.1

El schema es el contrato. Estable, versionado y con garantía de no romperse entre versiones menores.

```json
{
  "schema_version": "3.1",
  "meta": {
    "jd_tt":       2461193.499437,
    "jd_utc":      2461193.498611,
    "utc":         "2026-06-01T23:58:00Z",
    "delta_t_sec": 69.19,
    "observer":    { "lat_deg": -33.45, "lon_deg": -70.66 },
    "frame": {
      "nutation":                "IAU 2000B (77 luni-solar terms, Mathews et al. 2002)",
      "obliquity":               "IAU 2006 (Capitaine et al. 2006)",
      "planets":                 "VSOP87B (Bretagnon & Francou 1987) + Meeus App.II",
      "moon":                    "ELP/MPP02-LLR (Chapront & Francou 2002) 164L+105B+60R",
      "above_horizon_criterion": "geometric (unrefracted)"
    },
    "sidereal":  { "gast_deg": 250.278, "lst_deg": 179.618 },
    "obliquity": { "mean_deg": 23.4358, "true_deg": 23.4383 },
    "nutation":  { "delta_psi_arcsec": 8.271, "delta_eps_arcsec": 8.816 }
  },
  "bodies": {
    "Sol": {
      "ra_deg":                 69.958,
      "dec_deg":                22.160,
      "lon_ecl_geocentric_deg": 71.498,
      "lat_ecl_geocentric_deg": -0.00011,
      "alt_geometric_deg":      -27.896,
      "alt_apparent_deg":       -27.896,
      "az_deg":                 279.309,
      "above_horizon":          false,
      "dist_au":                1.01404
    },
    "Luna": {
      "lon_ecl_geocentric_deg":  269.330,
      "lon_ecl_topocentric_deg": 270.082,
      "alt_geometric_deg":       14.381,
      "alt_apparent_deg":        14.445,
      "dist_km":                 388954
    }
  },
  "luna": {
    "phase_ratio":  0.894,
    "phase_deg":    160.98,
    "illumination": 0.972
  }
}
```

Schema completo: [`docs/CAELIS_ENGINE_SPEC_v4_0.md`](docs/CAELIS_ENGINE_SPEC_v4_0.md)

---

## ¿Por qué no una API de terceros o Swiss Ephemeris?

|  | APIs de terceros | Swiss Ephemeris | **Caelis Engine** |
|---|:---:|:---:|:---:|
| Corre en el navegador | ✗ | ✗ | **✓** |
| No requiere servidor | ✗ | ✗ | **✓** |
| Sin clave de API ni costo | ✗ | ✓ | **✓** |
| Precisión declarada por campo | ✗ | parcial | **✓** |
| Algoritmo nombrado en cada salida | ✗ | ✗ | **✓** |
| Un solo archivo JS · sin instalación | ✗ | ✗ | **✓** |
| Funciona offline | ✗ | ✓ | **✓** |
| Salida versionada con schema estable | ✗ | ✗ | **✓** |
| Capa interpretativa opcional | N/A | N/A | **✓** |

Las APIs de terceros añaden latencia, costo y una dependencia que no controlas.
Swiss Ephemeris es el estándar de precisión — pero requiere un servidor, un wrapper en C y archivos de efemérides.

Caelis Engine corre donde ninguna de las dos puede: directamente en el navegador, en funciones edge, en React Native, en cualquier entorno JavaScript. Offline. De forma determinista.

---

## Validación

```bash
node validation/run.js
# 31 aserciones · 6 grupos · 0 fallos
```

| Época | Fuente | Aserciones |
|---|---|---|
| J2000.0 — 2000-ene-01 12:00 TT | IAU SOFA + paper VSOP87 | 6 |
| 10-abr-1987 (Meeus Cap.25) | Meeus *Astronomical Algorithms* 2ª ed. | 4 |
| 12-abr-1992 (Meeus Cap.33 Venus) | Tabla de verificación VSOP87 | 1 |
| 2026-jun-01 línea base de regresión | Salida canónica Caelis v4.0 | 8 |
| Invariantes del schema v3.1 | Contrato de arquitectura | 9 |
| Regresión de refracción atmosférica (v4.0.8) | Fórmula de Sæmundsson, arcmin→grados | 3 |


---

## Precisión y limitaciones

Diseñado para portabilidad y auditabilidad — no para astrometría sub-arcosegundo.

| Fuente | Error máximo declarado |
|---|---|
| VSOP87B (Urano, Neptuno) | < 1′ |
| ELP/MPP02 (Luna) | < 10″ |
| Nutación IAU 2000B | < 1 mas |
| Refracción cerca del horizonte | 1–5′ |
| ΔT fuera de 500–2150 d.C. | variable |

Para requisitos sub-arcosegundo, usa JPL Horizons o Swiss Ephemeris con VSOP87 completo.
Para todo lo que necesite correr en un navegador, offline y de forma determinista — esto es.

---

## A.T.A.C.I.R. Cloud

La capa interpretativa está disponible como API gestionada a través de Hermetica Labs.

Lo que añade sobre el núcleo astronómico:
sistemas de casas · aspectos natales y de tránsito · simetrías eclípticas · direcciones primarias · ápsides y ciclos lunares · resonancias orbitales · Panchanga védico · sinastría · predicción de eclipses · **Firma Digital R1-R5**

La Firma Digital R1-R5 es una certificación criptográfica de que la salida fue producida bajo el Contrato de Plugins completo y no ha sido modificada. Cada resultado es auditable, trazable y verificable de forma independiente.

La lógica de cálculo es propietaria y corre en el servidor.
El cliente es de código abierto: [`client/AtacirClient.js`](client/AtacirClient.js)

**Acceso anticipado:** `hermeticalabs.dev@proton.me`

---

## Licencia

Caelis Engine se distribuye bajo **AGPL-3.0**.

Libre para usar en software de código abierto bajo los términos de la AGPL-3.0.
**Si estás construyendo un producto comercial o propietario, necesitas una licencia comercial.**

Licencias comerciales: `hermeticalabs.dev@proton.me`
Detalles: [`COMMERCIAL_LICENSE.md`](COMMERCIAL_LICENSE.md)

---

## Acerca de

Caelis Engine fue construido por **Cristian Valeria Bravo** bajo **Hermetica Labs**.

Dos principios guiaron cada decisión:

**Calcula el cielo, no lo interpretes.**
AstroCore mide el estado físico. A.T.A.C.I.R. deriva significado geométrico — solo cuando se le pide, solo en su propio namespace, sin modificar jamás la verdad astronómica.

**Cero supuestos ocultos.**
Cada número es rastreable. Cada algoritmo está declarado. Cada salida es reproducible.

---

*Caelis Engine no es el producto. Es aquello sobre lo que se construyen los productos.*

---

*Caelis Engine v4.0.9 · Hermetica Labs · © 2024–2026 Cristian Valeria Bravo*
