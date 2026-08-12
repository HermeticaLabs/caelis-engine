# Caelis Engine — Technical Roadmap
## v4.0 → v4.1 → NPM

```
Author:       Cristian Valeria Bravo
Organization: Hermetica Labs
Date:         2026-06
```

---

## Estado actual — v4.0

El motor está funcional y arquitectónicamente correcto en su capa pública.
El monolito `caelis-minimal.html` es el artefacto de referencia.

### 

- AstroCore produce snapshot v3.1 100% astronómico puro
- `house`, `houses` y `NodoNorte/NodoSur` correctamente separados del schema público
- Atacir como capa complementaria con 10 plugins bajo contrato R1-R5
- Plugin Contract v1.0 documentado y aplicado
- `_houseConfig`, `_nodes` internos — filtrados de todo output público
- Timezone handling: hora local → UTC en el boundary UI, sin tocar el motor
- Sinastría como flujo paralelo independiente
- JSON export 100% limpio (filtra `_*` vía replacer)
- Safety Polar Switch™ operativo en plugin Houses
- Toggle panel A.T.A.C.I.R.™ con pills ON/OFF

---

## Pendientes técnicos — v4.1

### Prioridad alta

**[P1] Migrar funciones de casas fuera de AstroCore**

Actualmente en zona AstroCore (deberían estar en `atacir/plugins/houses.js`):
- `getHouseCusps`
- `placidusHouseCusps`
- `porfirioHouseCusps`
- `alcabitiusHouseCusps`
- `wholeSignHouseCusps`
- `semiArcDiurno`
- `placidusIterateCusp`

Impacto: `getSnapshot()` dejaría de computar `_houseConfig` completamente.
ASC y MC siguen siendo calculables desde TimeEngine (GAST + φ) — valor geométrico puro.

**[P2] Migrar funciones UI fuera de la zona AstroCore**

Actualmente en zona motor (deberían estar en UI Controller):
- `drawEcliptic` — render SVG
- `drawNodes` — render SVG
- `_bodyModalOpenSolsticio` — DOM interaction
- `toggleHouseSystem` — UI state

Impacto: `CaelisEngine.js` queda sin ninguna referencia al DOM.

**[P3] Validation suite vs JPL Horizons**

Estado: en progreso.


Epochs objetivo:
- J2000.0 (2000-01-01 12:00 TT)
- 2026-06-01 23:58 UTC (Santiago)
- 1900-01-01 12:00 TT (historical)
- 2050-01-01 12:00 TT (future)
- 1582-10-15 12:00 TT (calendar reform boundary)

### Prioridad media

**[P4] `_lonAtJDE` — verificar alineamiento con moonLonEcl**

`_lonAtJDE` usa `W1r + ΣL` (ELP sin nutación — correcto para Panchanga que
usa longitud tropical sidérea). Verificar que la simplificación de latitud = 0
para visibilidad de eclipses es aceptable en todos los casos polares.

**[P5] `calcAtacirCore` — limpiar dependencias internas**

`directions` plugin llama a `calcAtacirCore` que internamente usa
`rx.houses` (resuelto vía proxy). En v4.1, `directions` debería recibir
`atacir.houses` directamente como parámetro — eliminar dependencia del proxy.

**[P6] `getSnapshotAt` — atomic restoration**

El patrón save/restore de `timeOffset`/`lat`/`lon` en `getSnapshotAt` funciona
pero es frágil bajo concurrencia (workers). En v4.1, implementar con
parámetros explícitos para eliminar el estado global completamente.

---

## NPM — plan de empaquetado

### Estructura objetivo

```
@hermeticalabs/caelis-engine/
├── package.json
├── README.md
├── LICENSE
│
├── src/
│   ├── TimeEngine.js          ← módulo puro, sin DOM
│   ├── AstroCore.js           ← módulo puro, sin DOM, sin casas
│   └── index.js               ← re-exports
│
├── atacir/
│   ├── index.js               ← Atacir.compute + ATACIR_PLUGINS
│   ├── AtacirBase.js
│   └── plugins/
│       ├── houses.js
│       ├── aspects.js
│       ├── symmetries.js
│       ├── lunar.js
│       ├── cycles.js
│       ├── resonances.js
│       ├── panchanga.js
│       ├── synastry.js
│       ├── directions.js
│       └── eclipses.js
│
└── dist/
    ├── caelis-engine.cjs.js   ← CommonJS build
    ├── caelis-engine.esm.js   ← ES Module build
    └── caelis-engine.umd.js   ← UMD (browser script tag)
```

### package.json objetivo

```json
{
  "name": "@hermeticalabs/caelis-engine",
  "version": "4.0.0",
  "description": "Deterministic astronomical computation for JavaScript",
  "type": "module",
  "main": "dist/caelis-engine.cjs.js",
  "module": "dist/caelis-engine.esm.js",
  "browser": "dist/caelis-engine.umd.js",
  "exports": {
    ".": {
      "import":  "./dist/caelis-engine.esm.js",
      "require": "./dist/caelis-engine.cjs.js"
    },
    "./atacir": {
      "import":  "./atacir/index.js"
    }
  },
  "files": ["dist/", "atacir/", "src/", "README.md", "LICENSE"],
  "license": "AGPL-3.0",
  "keywords": ["astronomy", "planets", "ephemeris", "celestial", "vsop87", "elp"]
}
```

### API pública del módulo ESM

```javascript
// Core (siempre disponible)
import { setObserver, setOffset, getSnapshot, getSnapshotAt } from '@hermeticalabs/caelis-engine';

// Atacir (opcional)
import { Atacir } from '@hermeticalabs/caelis-engine/atacir';

// Uso básico
setObserver(-33.45, -70.66);
const snap = getSnapshot();
console.log(snap.bodies.Sol.lon_ecl_geocentric_deg);

// Con Atacir
const result = Atacir.compute(snap, {
  plugins: { houses: true, aspects: true }
});
console.log(result.atacir.houses.asc);
```

### Build tooling

**Rollup** (mínimo overhead, output limpio).

```javascript
// rollup.config.js
export default [
  { input: 'src/index.js', output: { file: 'dist/caelis-engine.esm.js', format: 'esm' } },
  { input: 'src/index.js', output: { file: 'dist/caelis-engine.cjs.js', format: 'cjs' } },
  { input: 'src/index.js', output: { file: 'dist/caelis-engine.umd.js', format: 'umd', name: 'CaelisEngine' } },
];
```

---

## GitHub

### Archivos necesarios

```
caelis-engine/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── precision_discrepancy.md   ← template específico para discrepancias astronómicas
│   └── workflows/
│       └── validate.yml               ← CI: schema check + regression vs JPL
├── README.md                          ✓ listo
├── docs/
│   ├── MATEMATICA.md                  ✓ listo
│   ├── ARQUITECTURA.md                ✓ listo
│   ├── SPEC.md                        ✓ listo
│   └── CATALOGO.md                    (función por función — pendiente actualizar)
├── COMMERCIAL_LICENSE.md              ← redactar
├── LICENSE                            ← AGPL-3.0 (texto estándar)
├── CONTRIBUTING.md                    ← lineamientos para PRs
└── CHANGELOG.md                       ← v3.0 → v4.0 changes
```

### CHANGELOG mínimo (v3.0 → v4.0)

**Breaking changes:**
- `snapshot.houses` eliminado del schema público
- `snapshot.bodies[*].house` eliminado
- `NodoNorte`/`NodoSur` permanecen en `bodies` con schema v3.1 correcto
- `calcPanchangaCore(dateStr, timeStr)` → `calcPanchangaCore(jde)`

**New:**
- `Atacir.compute(snapshot, config)` — orquestador formal
- Plugin registry `ATACIR_PLUGINS` — extensible
- Toggle system UI — plugins ON/OFF por sesión
- `atacir.houses` — casas en namespace interpretativo
- `_localToUTC(date, time, tz)` — timezone handling en boundary UI
- `_attachHousesProxy` — compatibilidad interna sin reescritura

**Fixed:**
- `_lonAtJDE` — ya no manipula `timeOffset` global
- `_eclVisibleAt` — ya no manipula `lat`/`lon`/`timeOffset`
- `calcPanchangaCore` — recibe JD explícito
- `_nextChange` — eliminado `Date.now()` dead code
- `speedIndex` — eliminada referencia no declarada

### Licencia comercial

`COMMERCIAL_LICENSE.md`:

> Caelis Engine is available under AGPL-3.0 for open source use.
> A commercial license is required for use in proprietary software,
> SaaS products, or any deployment where the AGPL-3.0 obligations
> (full source disclosure) cannot be met.
>
> Commercial licenses are available for:
> - Individual developers
> - Startups and small teams (< 10 employees)
> - Enterprise and white-label
>
> Contact: hermeticalabs.dev@proton.me

---

## Checklist — v4.0 release status

- [x] P1 — funciones de casas migradas a Atacir (7 funciones)
- [x] P2 — funciones UI fuera del motor (4 funciones)
- [x] P3 — validation suite **28/28 passing** · 5 epochs · CI en GitHub Actions
- [x] Monolito actualizado — caelis-minimal v4.0.1
- [x] CATALOGO.md — función por función con arquitectura v4.0
- [x] COMMERCIAL_LICENSE.md
- [x] CONTRIBUTING.md
- [x] README.md — modelo de negocio, comparativa técnica, badges
- [x] NPM publicado — `caelis-engine@4.0.1`
- [x] GitHub Pages — demo live
- [x] CI badge — verde en main

## Issues conocidos — v4.0.2 (próximo patch)

| Issue | Origen | Severidad |
|---|---|---|
| Lunar node latitude floating-point underflow `~1e-15` | Gemini analysis | Baja — cosmético |
| `directions` plugin anida `meta` duplicado — viola I-8 | Gemini analysis | Media — arquitectura |
| `_isPremium = true` hardcodeado — código muerto | Kimi analysis | Baja — limpieza |
| `calcAtacirCore` viola R3 — llama a `getSnapshotAt()` internamente | Kimi analysis | Media — arquitectura |
| `_getHouses()` / `_attachHousesProxy()` duplicados en scope | Kimi analysis | Baja — deuda técnica |

## Roadmap v4.1

- `getSnapshot(jd_tt, lat, lon, houseSystem)` — firma completamente explícita, sin globals
- `houseSystem` como parámetro puro, no estado global
- TypeScript type definitions
- Lazy-load de coeficientes VSOP87B opcionales

## Roadmap v5.0

- WebAssembly core para computación masiva
- VSOP2013 para mayor precisión en planetas exteriores
- Full ELP/MPP02 (35,000 términos) como opción premium





*Caelis Engine v4.0 · Hermetica Labs · © 2024–2026 Cristian Valeria Bravo*
