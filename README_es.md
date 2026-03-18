# Caelis Engine

**Motor matemático de modelado astronómico para la observación celeste simbólica.**

Caelis Engine v2.0 calcula posiciones planetarias reales con algoritmos de precisión profesional (VSOP87, ELP/MPP02), las renderiza como un instrumento simbólico vivo, y expone un framework completo de análisis astronómico-astrológico — en un único archivo HTML sin dependencias.

[**→ Demo en vivo**](https://hermeticalabs.github.io/caelis-engine/) · [**Documentación**](#documentación) · [**Licencia**](#licencia) · [**Ko-fi**](https://ko-fi.com/hermeticalabs)

---

## Qué hace

```
Símbolo → Estructura → Simulación
```

- Calcula Sol, Luna y 5 planetas con **VSOP87** (planetas) y **ELP/MPP02** (Luna, calibrado LLR 2002), verificados contra Meeus, JPL Horizons y Swiss Ephemeris — **56/56 tests PASS**
- Renderiza un **mapa de cielo 2D** en tiempo real con horizonte, eclíptica, casas Placidus, 600 estrellas y marcadores de equinoccios/solsticios
- Cambia a **Oculus 3D** — esfera orbital Three.js con planetas en coordenadas celestes reales
- Analiza **ciclos planetarios, resonancias y periodicidad** — conjunciones, períodos sinódicos, aspectos
- Panel **Atacir** — aspectos natales y de tránsito, direcciones primarias, ciclos, resonancias, tab de **Sinastría**
- **Calculadora de eclipses** — solar y lunar con visibilidad georeferenciada (Meeus Cap.54, Premium)
- **Panchanga védico** — Tithi, Vara, Nakshatra, Yoga, Karana con Ayanamsa Lahiri (Premium)
- **Marcadores de equinoccios/solsticios** — bisección VSOP87, adaptativo por hemisferio

---

## Por qué es diferente

| Característica | Caelis Engine | Librería astro típica | App de cielo típica |
|---|---|---|---|
| VSOP87 + ELP/MPP02 (calibrado LLR) | ✓ | a veces | raramente |
| 56/56 tests vs JPL Horizons + Swiss Eph. | ✓ | raramente | no |
| Sin dependencias | ✓ | no | no |
| Capa simbólica + científica | ✓ | no | no |
| Calculadora de eclipses (georef.) | ✓ | raramente | raramente |
| Panchanga védico (5 elementos) | ✓ | no | raramente |
| Sinastría aspectos cruzados | ✓ | no | no |
| Marcadores equinoccios/solsticios | ✓ | no | no |
| Archivo único, corre offline | ✓ | no | no |

---

## Módulos principales

```
caelis-engine/
├── caelis_engine_2_0.html     ← Instrumento completo (archivo único) — 8.157 líneas
├── index.html                 ← Punto de entrada GitHub Pages (idéntico)
├── validation.html            ← Suite de precisión — 56/56 PASS
└── src/
    ├── astro/AstroCore.js     ← VSOP87, ELP/MPP02, transformaciones, eclipses
    ├── TimeEngine.js          ← Fechas julianas, tiempo sidéreo, control temporal
    └── Atacir.js              ← Ciclos, aspectos, resonancias, sinastría, Panchanga
```

---

## Fundamentos matemáticos

### Algoritmos

| Algoritmo | Fuente | Términos | Aplica a |
|---|---|---|---|
| **VSOP87** | Bretagnon & Francou 1987, Meeus App.II | Tierra: 185 · Venus: 79 · Marte: 152 · Júpiter: 141 · Saturno: 167 | Venus, Marte, Júpiter, Saturno, Sol |
| **Mercurio** | Meeus Cap.31 | 5 términos, e=0.206 | Mercurio |
| **ELP/MPP02** | Chapront & Francou 2002, A&A 412 (LLR) | 164L + 105B + 29R | Luna |
| **Nutación IAU 1980** | Meeus Cap.22 | 63 series | ΔΨ, Δε |
| **Casas Placidus** | Meeus Cap.38 | Newton-Raphson < 1×10⁻⁹ rad | Cúspides I–XII |
| **Detección eclipses** | Meeus Cap.54 | Criterio argumento F | Solar · Lunar |
| **Equinoccios/Solsticios** | Bisección VSOP87 | Precisión < 1 min | 0°, 90°, 180°, 270° |
| **Ayanamsa Lahiri** | IAU 1955 | 23.85282° + 0.013972°/año | Base sidérea védica |
| **ΔT** | Tabla IERS 1620–2100 | Interpolación lineal | Todos los JDE |
| **Direcciones primarias** | Ptolomeo / Al-Biruni | Ascensión oblicua | Carta natal |

### Precisión — 56/56 tests PASS

| Componente | Error máximo | Fuente |
|---|---|---|
| **Luna λ (ELP/MPP02)** | **0.0001° (0.45") — 63× vs ELP2000** | JPL Horizons DE441 |
| Sol VSOP87 | 0.001° | Meeus Cap.25 |
| Mercurio | < 0.116° | JPL Horizons DE441 |
| Venus / Marte / Júpiter / Saturno | < 0.131° | JPL Horizons DE441 |
| Nutación IAU 1980 ΔΨ | < 0.004 arcsec | Meeus Cap.22 |
| ASC Placidus | < 0.009° | Carta referencia |
| ΔT en J2000 | < 0.1 s | IERS |

**Rango de validez:** 1800–2100 d.C.

---

## Inicio rápido

```bash
git clone https://github.com/HermeticaLabs/caelis-engine
# Abre index.html en cualquier browser moderno — sin instalación, sin build, sin servidor.
```

Node.js:

```javascript
const AstroCore = require('./src/astro/AstroCore.js');
Object.assign(global, AstroCore);
global.lat = -33.45 * Math.PI/180;
global.lon = -70.66 * Math.PI/180;
global.R_TIERRA = 6371.0;
const nowJD = Date.now()/86400000 + 2440587.5;
global.timeOffset = (2451545.0 - nowJD) * 86400;
console.log(AstroCore.sunLonEcl(), AstroCore.moonLonEcl());
```

---

## Modelo Freemium

Premium es un **pago único de $12 USD** — sin suscripción, sin renovación.

| Característica | Free | Premium |
|---|---|---|
| Caelis 2D, Astrolabio, Oculus 3D | ✓ | ✓ |
| 7 planetas + nodos lunares (Oculus) | Sol, Luna, Saturno | ✓ todos |
| Paletas de color | 2 | 6 |
| Atacir completo (tránsitos, ciclos, resonancias) | 1 aspecto (Naibod fijo) | ✓ completo |
| Calculadora de eclipses | Solo el próximo | ✓ rango completo |
| Marcadores equinoccios/solsticios | ✓ | ✓ |
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
- [x] Validación extendida — 56/56 tests vs JPL Horizons DE441 + Swiss Ephemeris
- [ ] Interpretación hermética IA — próximamente (experimental)
- [ ] Google Play Store
- [ ] Serie R extendida ELP/MPP02 → dist < 10 km
- [ ] Nutación IAU 2000A (1365 términos → ~0.1 mas)
- [ ] Capa API REST

---

## Documentación

- [AstroCore API](docs/astrocore.es.md) — VSOP87, ELP/MPP02, transformaciones, eclipses, ayanamsa
- [TimeEngine API](docs/timeengine.es.md) — Control temporal, fechas julianas, tiempo sidéreo
- [Atacir — Análisis de Ciclos](docs/atacir.es.md) — Direcciones primarias, aspectos, ciclos, sinastría, Panchanga
- [Referencias matemáticas](docs/references.es.md) — Algoritmos fuente y tabla de 56 tests de precisión

---

## Referencias

- Jean Meeus — *Astronomical Algorithms*, 2ª ed. (Willmann-Bell, 1998)
- VSOP87 — Bretagnon & Francou, A&A 202, 309 (1988)
- ELP/MPP02 — Chapront & Francou, A&A 412, 567 (2002)
- Nutación IAU 1980 — Seidelmann (ed.), *Explanatory Supplement*, 1992
- JPL Horizons — https://ssd.jpl.nasa.gov/horizons/ (DE441)
- Swiss Ephemeris — Astrodienst AG, DE441

---

## Licencia

**Open Source — AGPL-3.0** · Libre para usar, estudiar, modificar y compartir. Uso en productos requiere publicar el código fuente. Texto completo: [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html)

**Licencia Comercial — Hermetica Labs** · Para uso propietario. Contacto: [hermeticalabs.dev@proton.me](mailto:hermeticalabs.dev@proton.me)

---

## Autor

**Cristian Valeria Bravo** · [Hermetica Labs](https://github.com/HermeticaLabs)

*Caelis Engine existe en el límite entre la precisión matemática y la observación simbólica — donde la estructura del tiempo se vuelve navegable.*

Apoya el proyecto: [ko-fi.com/hermeticalabs](https://ko-fi.com/hermeticalabs) · © 2024–2026 Cristian Valeria Bravo / Hermetica Labs
