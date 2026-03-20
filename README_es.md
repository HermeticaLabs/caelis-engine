# Caelis Engine

**Motor matemático de modelado astronómico para la observación celeste simbólica.**

Caelis Engine v2.1 calcula posiciones planetarias reales con algoritmos de precisión profesional (VSOP87, ELP/MPP02), las renderiza como un instrumento simbólico vivo, y expone un framework completo de análisis astronómico-astrológico — en un único archivo HTML sin dependencias.

[**→ Demo en vivo**](https://hermeticalabs.github.io/caelis-engine/) · [**Documentación**](#documentación) · [**Licencia**](#licencia) · [**Ko-fi**](https://ko-fi.com/hermeticalabs)

---

## Qué hace

```
Símbolo → Estructura → Simulación
```

- Calcula Sol, Luna y 5 planetas con **VSOP87** (planetas) y **ELP/MPP02** (Luna, calibrado LLR 2002), verificados contra Meeus, JPL Horizons y Swiss Ephemeris — **107/107 tests PASS**
- Renderiza un **mapa de cielo 2D** en tiempo real con horizonte, eclíptica, casas Placidus, 600 estrellas y marcadores de equinoccios/solsticios
- Cambia a **Oculus 3D** — esfera orbital Three.js con planetas en coordenadas celestes reales
- Analiza **ciclos planetarios, resonancias y aspectos** vía el panel **Atacir** (con tab de Sinastría)
- **Calculadora de eclipses** — solar y lunar con visibilidad georeferenciada (Meeus Cap.54, Premium)
- **Panchanga védico** — Tithi, Vara, Nakshatra, Yoga, Karana con Ayanamsa Lahiri (Premium)
- **Marcadores equinoccios/solsticios** — bisección VSOP87, precisión < 1 minuto

---

## Arquitectura — mejoras v2.1

Caelis Engine v2.1 introduce separación limpia entre el núcleo matemático y la capa UI:

| Función | Estado | Descripción |
|---|---|---|
| `calcAtacirCore()` | ✅ Pura — sin DOM | Direcciones primarias + aspectos + ciclos |
| `calcPanchangaCore()` | ✅ Pura — sin DOM | 5 elementos Panchanga + Ayanamsa Lahiri |
| `calcEclipsesCore()` | ✅ Pura — sin DOM | Detección de eclipses + visibilidad georef. |
| `calcSinastriaCore()` | ✅ Pura — sin DOM | Aspectos cruzados + antiscias |
| `getSnapshotAt()` | ✅ try/finally | Estado siempre restaurado ante excepción |
| `_eclVisibleAt()` | ✅ try/finally | Estado siempre restaurado ante excepción |
| `nutation(T)` | ✅ Memoizada | Cache por clave T, invalidado al cambiar tiempo |
| `lunarNodes()` | ✅ Memoizada | Cache por clave T, invalidado al cambiar tiempo |

Las funciones `*Core()` reciben parámetros simples (fechas, coordenadas) y retornan objetos de datos — utilizables en Node.js, APIs REST o paquetes npm sin mocks de DOM.

---

## Módulos principales

```
caelis-engine/
├── caelis_engine_2_1.html     ← Instrumento completo (archivo único) — 8.200 líneas
├── index.html                 ← Punto de entrada GitHub Pages (idéntico)
├── validation.html            ← Suite de precisión — 107/107 PASS
└── src/
    ├── astro/AstroCore.js     ← VSOP87, ELP/MPP02, transformaciones
    ├── TimeEngine.js          ← Fechas julianas, tiempo sidéreo, control temporal
    └── Atacir.js              ← Ciclos, aspectos, resonancias, sinastría
```

---

## Fundamentos matemáticos

### Algoritmos

| Algoritmo | Fuente | Términos | Aplica a |
|---|---|---|---|
| **VSOP87** | Bretagnon & Francou 1987, Meeus App.II | Tierra: 185 · Venus: 79 · Marte: 152 · Júpiter: 141 · Saturno: 167 | Venus, Marte, Júpiter, Saturno, Sol |
| **Mercurio** | Meeus Cap.31 (ecuación del centro) | 5 términos, e=0.206 | Mercurio |
| **ELP/MPP02** | Chapront & Francou 2002, A&A 412 (LLR) | 164L + 105B + 29R | Luna |
| **Nutación IAU 1980** | Meeus Cap.22 | 63 series (memoizada) | ΔΨ, Δε |
| **Casas Placidus** | Meeus Cap.38 | Newton-Raphson < 1×10⁻⁹ rad | Cúspides I–XII |
| **Detección eclipses** | Meeus Cap.54 | Criterio argumento F | Solar · Lunar |
| **Equinoccios/Solsticios** | Bisección VSOP87 | Precisión < 1 min | 0°, 90°, 180°, 270° |
| **Ayanamsa Lahiri** | IAU 1955 | 23.85282° + 0.013972°/año | Base sidérea védica |

> **Nota sobre Mercurio:** `vsop87Mercurio()` usa la ecuación del centro de Meeus Cap.31 (no la serie VSOP87) debido a la alta excentricidad de Mercurio (e=0.206). El VSOP87 truncado da ~21° de error para este planeta. El nombre se mantiene por compatibilidad de interfaz. Error verificado: < 0.116° vs JPL Horizons DE441.

### Precisión — 107/107 tests PASS

| Componente | Error máx. | Referencia |
|---|---|---|
| **Luna λ (ELP/MPP02)** | **0.0001° (0.45") — 63× vs ELP2000** | JPL Horizons DE441 |
| Sol VSOP87 | 0.0003° | Meeus Cap.25 |
| Mercurio (ec. del centro) | < 0.116° | JPL Horizons DE441 |
| Venus / Marte / Júpiter / Saturno | < 0.131° | JPL Horizons DE441 |
| Mercurio β rango orbital | [-7°, +7°] ✓ | Teoría orbital |
| Nutación IAU 1980 ΔΨ | < 0.004 arcsec | Meeus Cap.22 |
| ASC Placidus | < 0.019° | Carta referencia |
| ΔT en J2000 | < 0.1 s | IERS |
| Equinoccios/Solsticios | < 1 min | JPL Horizons 2025 |

**Rango de validez:** 1800–2100 d.C.

---

## API Pública

```javascript
// Snapshot astronómico para cualquier fecha/lugar
const snap = getSnapshot();
const snap = getSnapshotAt(jde, latDeg, lonDeg);

// Núcleos de cálculo puros (sin DOM — usables en Node.js)
const atacir  = calcAtacirCore(rxDate, rxTime, rxLat, rxLon, trDate, trTime, trLat, trLon, key);
const panch   = calcPanchangaCore(dateStr, timeStr);
const ecl     = calcEclipsesCore(latDeg, lonDeg, rangoAnios, doSolar, doLunar, jdCenter);
const sin     = calcSinastriaCore(dateA, timeA, latA, lonA, dateB, timeB, latB, lonB);

// Aspectos
const aspectos = calcAspectosTransito(snapNatal, snapTransito);

// Posiciones individuales
const lonSol   = sunLonEcl();         // grados
const lonLuna  = moonLonEcl();        // grados
const lonPl    = planetLonEcl(name);  // grados
const dist     = lunarDistELP(jde);   // km

// Utilidades de tiempo
const dT       = deltaT(jde);         // segundos
const jdeEq    = nextSolEquinox(0, jdStart);  // equinoccio vernal JDE
```

---

## Inicio rápido

```bash
git clone https://github.com/HermeticaLabs/caelis-engine
# Abre index.html en cualquier browser moderno — sin instalación, sin build, sin servidor.
```

---

## Modelo Freemium

Premium es un **pago único de $12 USD** — sin suscripción, sin renovación.

| Característica | Free | Premium |
|---|---|---|
| Caelis 2D, Astrolabio, Oculus 3D | ✓ | ✓ |
| Atacir completo (tránsitos, ciclos, resonancias) | 1 aspecto (Naibod fijo) | ✓ completo |
| Calculadora de eclipses | Solo el próximo | ✓ rango completo |
| Panchanga — Tithi + Vara | ✓ | ✓ |
| Panchanga — Nakshatra + Yoga + Karana | — | ✓ |
| Sinastría — 3 aspectos más exactos | ✓ | ✓ |
| Sinastría — tabla completa + antiscias | — | ✓ |
| Exportación JSON | Solo natales | ✓ completo |

[**→ Activar Premium — $12 USD pago único**](https://ko-fi.com/hermeticalabs)

---

## Roadmap

- [x] VSOP87 + ELP/MPP02 — 164L + 105B + 29R, calibrado LLR (63× precisión lunar)
- [x] Calculadora de eclipses — georeferenciada, solar y lunar (Premium)
- [x] Marcadores equinoccios/solsticios — bisección VSOP87, adaptativo por hemisferio
- [x] Panchanga védico — 5 elementos + Ayanamsa Lahiri (Premium)
- [x] Sinastría — aspectos cruzados + antiscias
- [x] 107/107 tests vs JPL Horizons DE441 + Swiss Ephemeris
- [x] **v2.1 — Núcleos puros sin DOM, try/finally, cache nutación/nodos, tests Mercurio β**
- [ ] Interpretación hermética IA — próximamente (experimental)
- [ ] Google Play Store
- [ ] Serie R extendida ELP/MPP02 → dist < 10 km
- [ ] Nutación IAU 2000A (1365 términos → ~0.1 mas)
- [x] **Paquete npm — caelis-engine@2.1.0 publicado en npm**

---

## Documentación

- [AstroCore API](docs/astrocore.es.md) — VSOP87, ELP/MPP02, transformaciones, eclipses, ayanamsa
- [TimeEngine API](docs/timeengine.es.md) — Control temporal, fechas julianas, tiempo sidéreo
- [Atacir — Análisis de Ciclos](docs/atacir.es.md) — Direcciones primarias, aspectos, ciclos, sinastría, Panchanga
- [Referencias matemáticas](docs/references.es.md) — Algoritmos fuente y tabla de 107 tests de precisión

---

## Licencia Comercial

Caelis Engine tiene licencia dual:

- **AGPL-3.0** — gratuita para uso de código abierto
- **Licencia Comercial** — requerida para productos propietarios o de código cerrado

| Nivel | Precio | Uso |
|---|---|---|
| Premium Personal | $12 USD | Usuario final, solo funciones in-app |
| Licencia Indie | $59 USD | 1 producto comercial |
| Licencia Estudio | $199 USD | Productos ilimitados |

[Descargar Licencia ES (PDF)](legal/COMMERCIAL_LICENSE_ES.pdf) · [License EN (PDF)](legal/COMMERCIAL_LICENSE_EN.pdf)

Compra: [ko-fi.com/hermeticalabs](https://ko-fi.com/hermeticalabs) · Contacto: hermeticalabs.dev@proton.me

---

## Licencia

**Open Source — AGPL-3.0** · Libre para usar, estudiar, modificar y compartir. Uso en productos requiere publicar el código fuente. Texto completo: [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html)

**Licencia Comercial** · Para uso propietario. Contacto: [hermeticalabs.dev@proton.me](mailto:hermeticalabs.dev@proton.me)

---

## Autor

**Cristian Valeria Bravo** · [Hermetica Labs](https://github.com/HermeticaLabs)

*Caelis Engine existe en el límite entre la precisión matemática y la observación simbólica — donde la estructura del tiempo se vuelve navegable.*

Apoya el proyecto: [ko-fi.com/hermeticalabs](https://ko-fi.com/hermeticalabs) · © 2024–2026 Cristian Valeria Bravo / Hermetica Labs
