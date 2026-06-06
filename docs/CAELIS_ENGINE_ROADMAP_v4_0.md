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

### Lo que está bien

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
Necesario antes del primer release público de NPM.

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

## Hacia NPM — plan de empaquetado

### Estructura objetivo del paquete

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

Herramienta recomendada: **Rollup** (mínimo overhead, output limpio).

```javascript
// rollup.config.js
export default [
  { input: 'src/index.js', output: { file: 'dist/caelis-engine.esm.js', format: 'esm' } },
  { input: 'src/index.js', output: { file: 'dist/caelis-engine.cjs.js', format: 'cjs' } },
  { input: 'src/index.js', output: { file: 'dist/caelis-engine.umd.js', format: 'umd', name: 'CaelisEngine' } },
];
```

---

## Hacia GitHub — preparación del repo

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

Texto mínimo recomendado para `COMMERCIAL_LICENSE.md`:

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
> Contact: hermeticalabs@[domain]

---

## Checklist antes del primer commit público

- [x] P1: funciones de casas migradas a Atacir (7 funciones — v4.0)
- [x] P2: UI functions fuera del motor (4 funciones — v4.0)
- [x] P3: validation suite 28/28 — 5 epochs, 3 fuentes canónicas (v4.0)
- [x] Monolito actualizado — caelis-minimal_v4_p3.html
- [ ] `CATALOGO.md` actualizado (función por función)
- [ ] `COMMERCIAL_LICENSE.md` redactado
- [ ] `CONTRIBUTING.md` con reglas de PR (especialmente: no tocar algoritmos sin validación)
- [ ] `.gitignore` configurado
- [ ] `package.json` inicial
- [ ] Tag `v4.0.0` en el primer commit estable

---

## Resumen de pendientes de esta sesión

Lo que está hecho y estable en el monolito actual:

✅ Arquitectura AstroCore / Atacir separada con fronteras formales  
✅ Schema v3.1 astronómico puro (sin houses, sin house por cuerpo)  
✅ 10 plugins Atacir bajo Plugin Contract v1.0  
✅ Toggle system UI con pills violeta/gris  
✅ Modales por plugin (Houses, Aspects, Symmetries, Panchanga, Synastry, Eclipses)  
✅ Timezone handling sin fricción (hora local → UTC automático)  
✅ Bodies tab con JSON astronómico puro + GetSnapshot + export  
✅ Eclipse "Ver ↗" carga snapshot de ese momento celeste  
✅ Sinastría como flujo paralelo independiente con JSON propio  
✅ Safety Polar Switch™ en modal Houses  
✅ Documentación (README, MATEMATICA, ARQUITECTURA, SPEC)  

Lo que queda antes del repo público:

⬜ P1: migrar casas fuera de AstroCore  
⬜ P2: migrar UI functions fuera de motor  
⬜ P3: validation suite JPL Horizons  
⬜ CATALOGO.md actualizado  
⬜ COMMERCIAL_LICENSE.md  
⬜ CONTRIBUTING.md  
⬜ Build tooling (Rollup)  
⬜ `package.json` inicial  

---

*Caelis Engine v4.0 · Hermetica Labs · © 2024–2026 Cristian Valeria Bravo*
