# Caelis Engine

**Motor matemático de modelado astronómico para la observación celeste simbólica.**

Caelis Engine v2.0 calcula posiciones planetarias reales usando algoritmos de precisión profesional (VSOP87, ELP/MPP02), las renderiza como un instrumento simbólico vivo, y expone un framework de análisis de ciclos, resonancias, eclipses, calendario védico, sinastría e interpretación hermética por IA — todo en un único archivo HTML, sin dependencias.

[**→ Demo en vivo**](https://hermeticalabs.github.io/caelis-engine/) · [**Documentación**](#documentación) · [**Licencia**](#licencia) · [**Ko-fi**](https://ko-fi.com/hermeticalabs)

---

## ¿Qué problema resuelve?

La mayoría del software astronómico es:
- **Demasiado científico** — datos crudos sin capa simbólica ni contemplativa
- **Demasiado decorativo** — visualizaciones hermosas con matemática imprecisa u opaca
- **Demasiado pesado** — frameworks, builds, servidores, APIs

Caelis Engine vive en la intersección: **matemáticamente riguroso, simbólicamente expresivo, y radicalmente simple de ejecutar.**

Sin `npm install`. Sin build. Sin servidor. Abre el archivo. Funciona.

---

## Qué hace

```
Símbolo → Estructura → Simulación
```

- Calcula Sol, Luna y 5 planetas usando **VSOP87** (planetas) y **ELP/MPP02** (Luna, calibrado LLR 2002), verificados contra Meeus, JPL Horizons y Swiss Ephemeris
- Renderiza un **mapa de cielo 2D** en tiempo real con horizonte, eclíptica, cúspides de casas (Placidus), 600 estrellas y marcadores de equinoccios/solsticios
- Cambia a **Oculus 3D** — una esfera orbital Three.js donde los planetas se mueven en coordenadas celestes reales
- Analiza **ciclos planetarios, resonancias y periodicidad** — conjunciones, períodos sinódicos, patrones de aspectos
- Casas, aspectos, tránsitos y progresiones vía el panel de análisis **Atacir** (con tab de **Sinastría**)
- Calcula **eclipses solares y lunares** con visibilidad georeferenciada (Meeus Cap.54, Premium)
- Muestra el **Panchanga védico** — Tithi, Vara, Nakshatra, Yoga, Karana con Ayanamsa Lahiri
- Genera **interpretaciones herméticas por IA** del cielo actual y tránsitos activos via Cloudflare Worker + Claude (Premium)

---

## Por qué es diferente

| Característica | Caelis Engine | Librería astro típica | App de cielo típica |
|---|---|---|---|
| VSOP87 + ELP/MPP02 | ✓ | a veces | raramente |
| Verificado contra Meeus | ✓ | raramente | no |
| Verificado contra JPL Horizons | ✓ | raramente | no |
| Verificado contra Swiss Ephemeris | ✓ | raramente | no |
| Sin dependencias | ✓ | no | no |
| Capa simbólica + científica | ✓ | no | no |
| Análisis de ciclos y resonancias | ✓ | no | no |
| Calculadora de eclipses (georef.) | ✓ | raramente | raramente |
| Panchanga védico (5 elementos) | ✓ | no | raramente |
| Sinastría aspectos cruzados | ✓ | no | no |
| Marcadores equinoccios/solsticios | ✓ | no | no |
| Interpretación hermética IA (Premium) | ✓ | no | no |
| Archivo único, corre en browser | ✓ | no | no |
| Arquitectura modular | ✓ | varía | no |

---

## Módulos principales

```
caelis-engine/
├── caelis_engine_2_0.html     ← Instrumento completo (archivo único, standalone) — 8.116 líneas
├── index.html                 ← Punto de entrada GitHub Pages (idéntico al anterior)
├── validation.html            ← Suite de precisión — 56/56 PASS
└── src/
    ├── astro/
    │   └── AstroCore.js       ← VSOP87, ELP/MPP02, transformaciones, detección de eclipses
    ├── TimeEngine.js          ← Fechas julianas, tiempo sidéreo, control temporal
    └── Atacir.js              ← Análisis de ciclos, aspectos, resonancias, sinastría, Panchanga
```

---

## Fundamentos matemáticos

### Algoritmos implementados

| Algoritmo | Fuente | Términos / Método | Aplica a |
|---|---|---|---|
| **VSOP87** | Bretagnon & Francou 1987, Meeus App.II | Venus: 79 · Tierra: 185 · Marte: 152 · Júpiter: 141 · Saturno: 167 | Venus, Marte, Júpiter, Saturno, Sol (geocéntrico) |
| **Mercurio** | Meeus Cap.31 | Ecuación del centro, 5 términos, e=0.206 | Mercurio |
| **ELP/MPP02** | Chapront & Francou 2002, A&A 412 (calibrado LLR) | 164L + 105B + 29R términos | Luna: longitud, latitud, distancia |
| **Nutación IAU 1980** | Seidelmann 1992, Meeus Cap.22 | 63 series periódicas | ΔΨ y Δε |
| **Oblicuidad** | IAU 1980, Meeus Cap.22 | Polinomio cúbico | ε₀ y ε verdadera |
| **Casas Placidus** | Meeus Cap.38 | Newton-Raphson < 1×10⁻⁹ rad | Cúspides I–XII |
| **Fases lunares** | Meeus Cap.49 | Serie completa + corrección W | JDE Luna nueva, cuartos, llena |
| **Apsis lunares** | Meeus Cap.50 | Series periódicas | JDE perigeo y apogeo |
| **Detección de eclipses** | Meeus Cap.54 | Criterio argumento F | Solar (total/anular/parcial) · Lunar |
| **Equinoccios/Solsticios** | Bisección VSOP87 sobre sunLonEcl() | Precisión < 1 min | Cruces del Sol en 0°, 90°, 180°, 270° |
| **Ayanamsa Lahiri** | IAU 1955, Lahiri | 23.85282° + 0.013972°/año desde J2000 | Base sidérea védica |
| **Aberración anual** | Diferencial numérico | Δτ = 0.001 siglos | Todos los cuerpos |
| **Corrección tiempo-luz** | Iterativa | c = 173.1446326 UA/día | Todos los planetas |
| **Paralaje topocéntrico** | Meeus Cap.40 | Radio geocéntrico WGS84 | Luna AR/Dec |
| **Refracción atmosférica** | Bennett 1982 | Alt > −1° | Todos los cuerpos |
| **GAST / Tiempo sidéreo** | IAU 2000A, Meeus Cap.12 | Ecuación de los equinoccios | TSL |
| **ΔT** | Tabla IERS 1620–2100 | Interpolación lineal + polinomio | Todos los JDE |
| **Direcciones primarias (Atacir)** | Ptolomeo / Al-Biruni | Método de ascensión oblicua | Carta natal |

---

## Precisión verificada

**56/56 tests PASS** contra JPL Horizons (DE441), Swiss Ephemeris (DE441) y Meeus Astronomical Algorithms 2ª ed.

### Luna · ELP/MPP02 — 63× mejora vs implementación anterior

| Cantidad | Calculado | Referencia | Δ | Fuente |
|---|---|---|---|---|
| λ Longitud eclíptica | 133.1671° | 133.167° | **0.0001° (0.45")** | JPL Horizons DE441 |
| β Latitud eclíptica | −3.2292° | −3.2291° | **0.0001°** | Meeus Ej.47.a |
| Δ Distancia geocéntrica | 368.437 km | 368.409,7 km | **27 km (0.007%)** | Meeus Ej.47.a |

### Planetas · JPL Horizons (DE441) — 4 fechas por planeta, 2025–2026

| Planeta | Algoritmo | Δ max vs JPL | Δ max vs Swiss Eph. |
|---|---|---|---|
| Mercurio | Meeus Cap.31 (ec. del centro) | < 0.116° | < 0.116° |
| Venus | VSOP87, 79 términos | < 0.107° | < 0.107° |
| Marte | VSOP87, 152 términos | < 0.113° | < 0.113° |
| Júpiter | VSOP87, 141 términos | < 0.131° | < 0.131° |
| Saturno | VSOP87, 167 términos | < 0.126° | < 0.126° |

**Rango de validez:** 1800–2100 d.C.

---

## Inicio rápido

```bash
git clone https://github.com/HermeticaLabs/caelis-engine
# Abre index.html en cualquier browser moderno — sin instalación, sin build, sin servidor.
```

---

## Interpretación Hermética IA (Premium)

Caelis Engine v2.0 incluye interpretación hermética por IA via un Cloudflare Worker proxy. La interpretación es generada por Claude (Anthropic) usando los datos astronómicos exactos calculados por el motor.

**Worker endpoint:** `https://caelis-ia.hermeticalabs.workers.dev`

El Worker valida tu clave Premium (mismo mecanismo SHA-256 del instrumento) y hace el proxy a la API de Anthropic. Tu API key de Anthropic vive encriptada en Cloudflare — nunca expuesta al cliente.

**Tipos de lectura:**
- **Cielo actual** — interpreta el snapshot del cielo simulado actual
- **Tránsitos activos** — interpreta los tránsitos activos sobre una carta natal (desde los inputs del Atacir)

Para usar: abre `✦ Leer` en la barra de controles, pega la URL del Worker, genera.

---

## Modelo Freemium

Premium es un **pago único de $12 USD** — sin suscripción, sin renovación anual.

| Característica | Free | Premium |
|---|---|---|
| Caelis 2D, Astrolabio, Oculus 3D | ✓ | ✓ |
| 7 planetas + nodos lunares (Oculus) | Sol, Luna, Saturno | ✓ todos |
| Paletas de color | 2 | 6 |
| Atacir completo (tránsitos, ciclos, resonancias, lunar) | 1 aspecto (Naibod fijo) | ✓ completo |
| Calculadora de eclipses | Solo el próximo eclipse | ✓ rango completo + georef. |
| Marcadores equinoccios/solsticios + modal | ✓ | ✓ |
| Panchanga — Tithi + Vara | ✓ | ✓ |
| Panchanga — Nakshatra + Yoga + Karana | — | ✓ con cuenta atrás |
| Sinastría — 3 aspectos más exactos | ✓ | ✓ |
| Sinastría — tabla completa + antiscias | — | ✓ |
| Interpretación hermética IA | — | ✓ cielo actual + tránsitos |
| Exportación JSON | Solo natales | ✓ completo |

[**→ Activar Premium — $12 USD pago único**](https://ko-fi.com/hermeticalabs)

---

## Roadmap

- [x] VSOP87 + ELP/MPP02 — planetas y Luna (164L + 105B + 29R, calibrado LLR)
- [x] Calculadora de eclipses — solar y lunar, visibilidad georeferenciada (Premium)
- [x] Marcadores equinoccios/solsticios — bisección VSOP87, adaptativo por hemisferio
- [x] Panchanga védico — 5 elementos (Tithi, Vara, Nakshatra, Yoga, Karana) + Ayanamsa Lahiri
- [x] Sinastría — aspectos cruzados + antiscias, tab en el panel Atacir
- [x] Validación extendida — 56/56 tests vs JPL Horizons DE441 + Swiss Ephemeris DE441
- [x] Interpretación hermética IA — Cloudflare Worker + Claude, cielo actual + tránsitos activos
- [ ] Validación matemática exhaustiva v2.0 — suite ampliada JPL/Swiss
- [ ] Serie R extendida ELP/MPP02 (coef. Chapront & Francou 2002 → dist < 10 km)
- [ ] Nutación IAU 2000A (1365 términos → ~0.1 mas)
- [ ] Google Play Store
- [ ] Capa API REST para integración en aplicaciones externas
- [ ] Precesión IAU 2006

---

## Documentación

- [AstroCore API](docs/astrocore.es.md) — Núcleo matemático: VSOP87, ELP/MPP02, transformaciones, casas Placidus, nodos lunares, fases, eclipses, ayanamsa
- [TimeEngine API](docs/timeengine.es.md) — Control temporal, fechas julianas, tiempo sidéreo, snapshots astronómicos completos
- [Atacir — Análisis de Ciclos](docs/atacir.es.md) — Direcciones primarias, aspectos natales y de tránsito, ciclos, resonancias, sinastría, Panchanga
- [Referencias matemáticas](docs/references.es.md) — Algoritmos fuente, fórmulas y tabla completa de 56 tests de precisión

---

## Referencias matemáticas

- Jean Meeus — *Astronomical Algorithms*, 2ª ed. (Willmann-Bell, 1998)
- VSOP87 — Bretagnon & Francou, A&A 202, 309 (1988)
- ELP/MPP02 — Chapront & Francou, A&A 412, 567 (2002)
- Series de nutación IAU 1980 — Seidelmann (ed.), *Explanatory Supplement*, 1992
- JPL Horizons System — https://ssd.jpl.nasa.gov/horizons/ (efeméride DE441)
- Swiss Ephemeris — Astrodienst AG, efeméride DE441

---

## Licencia

Caelis Engine tiene licencia dual:

**Open Source — AGPL-3.0**
Libre para usar, estudiar, modificar y compartir. Si usas Caelis Engine en un producto o servicio, debes publicar tu código fuente bajo los mismos términos. Texto completo: [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html)

**Licencia Comercial — Hermetica Labs**
Para uso en productos o servicios propietarios sin el requisito de divulgación de código fuente de la AGPL. Contacto: [hermeticalabs.dev@proton.me](mailto:hermeticalabs.dev@proton.me)

---

## Autor

**Cristian Valeria Bravo** · [Hermetica Labs](https://github.com/HermeticaLabs)

*Caelis Engine existe en el límite entre la precisión matemática y la observación simbólica — donde la estructura del tiempo se vuelve navegable.*

Apoya el proyecto: [ko-fi.com/hermeticalabs](https://ko-fi.com/hermeticalabs)

© 2024–2026 Cristian Valeria Bravo / Hermetica Labs
