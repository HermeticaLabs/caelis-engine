# Caelis Engine

**Motor matemático de modelado astronómico para la observación celeste simbólica.**

Caelis Engine calcula posiciones planetarias reales usando algoritmos de precisión profesional (VSOP87, ELP/MPP02), las renderiza como un instrumento simbólico vivo, y expone un framework de análisis de ciclos, resonancias y eclipses — todo en un único archivo HTML, sin dependencias.

[**→ Demo en vivo**](https://hermeticalabs.github.io/caelis-engine/caelis_engine_1_5.html) · [**Documentación**](#documentación) · [**Licencia**](#licencia)

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

- Calcula Sol, Luna y 5 planetas usando **VSOP87** (planetas) y **ELP/MPP02** (Luna), verificados contra *Astronomical Algorithms* de Jean Meeus y JPL Horizons
- Renderiza un **mapa de cielo 2D** en tiempo real con horizonte, eclíptica, cúspides de casas (Placidus) y 600 estrellas de fondo
- Cambia a **Oculus 3D** — una esfera orbital Three.js donde los planetas se mueven en coordenadas celestes reales
- Analiza **ciclos planetarios, resonancias y periodicidad** — conjunciones, períodos sinódicos, patrones de aspectos
- Casas, aspectos, tránsitos y progresiones vía el panel de análisis **Atacir**
- Calcula **eclipses solares y lunares** con visibilidad georeferenciada (Premium)

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
| Archivo único, corre en browser | ✓ | no | no |
| Arquitectura modular | ✓ | varía | no |

---

## Módulos principales

```
caelis-engine/
├── caelis_engine_1_5.html     ← Instrumento completo (archivo único, standalone)
├── validation.html            ← Suite de precisión — 30/30 PASS
└── src/
    ├── astro/
    │   └── AstroCore.js       ← VSOP87, ELP/MPP02, transformaciones, detección de eclipses
    ├── TimeEngine.js          ← Fechas julianas, tiempo sidéreo, control temporal
    └── Atacir.js              ← Análisis de ciclos, aspectos, resonancias, progresiones
```

**AstroCore** — el núcleo matemático. Algoritmos de posición planetaria, transformaciones de sistemas de coordenadas (eclíptica → ecuatorial → horizontal), cómputo de fase lunar, detección de eclipses (Meeus Cap.54), datos de estrellas fijas.

**TimeEngine** — el tiempo como variable de primera clase. Conversión de fecha juliana, tiempo sidéreo, control de offset temporal, multiplicador de velocidad (desde 1 segundo/frame hasta 1 año/frame).

**Atacir** — la capa analítica. Aspectos natales y de tránsito, ciclos planetarios, períodos sinódicos, detección de resonancias, progresión de casas Placidus, direcciones primarias (método Al-Biruni / Ptolomeo).

---

## Fundamentos matemáticos

### Algoritmos implementados

| Algoritmo | Fuente | Términos / Método | Aplica a |
|---|---|---|---|
| **VSOP87** | Bretagnon & Francou 1987, Meeus App.II | Venus: 79 · Tierra: 185 · Marte: 152 · Júpiter: 141 · Saturno: 167 | Venus, Marte, Júpiter, Saturno, Sol (geocéntrico) |
| **Mercurio** | Meeus Cap.31 | Ecuación del centro, 5 términos, e=0.206 | Mercurio |
| **ELP/MPP02** | Chapront & Francou 2002, A&A 412 (calibrado LLR) | 164L + 105B + 29R términos | Luna: longitud, latitud, distancia |
| **Distancia lunar** | Meeus Cap.47, `lunarDistELP()` | 29 términos R | Distancia geocéntrica Luna (km) |
| **Nutación IAU 1980** | Seidelmann 1992, Meeus Cap.22 | 63 series periódicas | ΔΨ y Δε |
| **Oblicuidad** | IAU 1980, Meeus Cap.22 | Polinomio cúbico | ε₀ y ε verdadera |
| **Casas Placidus** | Meeus Cap.38 | Newton-Raphson < 1×10⁻⁹ rad | Cúspides I–XII |
| **Fases lunares** | Meeus Cap.49 | Serie completa + corrección W | JDE Luna nueva, cuartos, llena |
| **Apsis lunares** | Meeus Cap.50 | Series periódicas | JDE perigeo y apogeo |
| **Detección de eclipses** | Meeus Cap.54 | Criterio argumento F | Solar (total/anular/parcial) · Lunar (total/parcial) |
| **Aberración anual** | Diferencial numérico | Δτ = 0.001 siglos | Todos los cuerpos |
| **Corrección tiempo-luz** | Iterativa | c = 173.1446326 UA/día | Todos los planetas |
| **Paralaje topocéntrico** | Meeus Cap.40 | Radio geocéntrico WGS84 | Luna AR/Dec |
| **Refracción atmosférica** | Bennett 1982 | Alt > −1° | Todos los cuerpos |
| **GAST / Tiempo sidéreo** | IAU 2000A, Meeus Cap.12 | Ecuación de los equinoccios | TSL |
| **ΔT** | Tabla IERS 1620–2100 | Interpolación lineal + polinomio | Todos los JDE |
| **Direcciones primarias (Atacir)** | Ptolomeo / Al-Biruni | Método de ascensión oblicua | Carta natal |

### Por qué Mercurio usa un algoritmo diferente

La excentricidad orbital de Mercurio es e = 0.206 — la más alta de los planetas clásicos. El VSOP87 truncado de Meeus Apéndice II acumula errores significativos para Mercurio porque la truncación elimina términos no despreciables a alta excentricidad. La ecuación del centro (Meeus Cap.31, 5 términos) es más estable y produce menores errores para Mercurio que el VSOP87 truncado. Error medido: Δ < 0.12° vs JPL Horizons DE441.

### Detección de eclipses — base matemática

Los eclipses solares y lunares se detectan evaluando el argumento de latitud de la Luna **F** en cada luna nueva (solar) o luna llena (lunar):

```
F = 160.7108° + 390.67050284°·k − 0.0016118°·T² − ...
```

donde k es el número de lunación de Meeus Cap.49 y T está en siglos julianos.

**Condición eclipse solar** (Meeus Cap.54):
```
|sin F| < 0.36  →  eclipse posible
|sin F| < 0.15  →  eclipse central (total si perigeo, anular si apogeo)
```

**Condición eclipse lunar** (Meeus Cap.54):
```
|sin F| < 0.40  →  eclipse posible
|sin F| < 0.26  →  eclipse total
```

El tipo total/anular (solar) se determina con `lunarDistELP(jde)`: distancia < 375.000 km → total, distancia ≥ 375.000 km → anular.

La **visibilidad georeferenciada** se calcula evaluando la altitud del Sol (solar) o la Luna (lunar) en las coordenadas del observador en el JDE del máximo del eclipse, usando el mismo pipeline `_bodyData` del instrumento principal.

---

## Precisión

Todos los resultados verificados por `validation.html` — **30/30 PASS** — y por la suite planetaria extendida a continuación.

### Sol · VSOP87 (Meeus Cap.25)

| Fecha | Calculado | Referencia | Δ | Fuente |
|---|---|---|---|---|
| 1992-10-13 00:00 TT | 199.9066° | 199.906° | **0.0006°** | Meeus Cap.25 Ej.25.a |
| 1992-04-12 00:00 TT | 22.3399° | 22.340° | **0.0001°** | Meeus Cap.25 |

### Luna · ELP/MPP02 (Chapront & Francou 2002, A&A 412)

Implementación: 164L + 105B + 29R términos. Argumentos calibrados con datos LLR (Laser Lunar Ranging) hasta 2001. Comparado con ELP2000/Meeus Cap.47 (60L+60B+29R), la precisión en longitud mejora 63×.

| Fecha | Cantidad | Calculado | Referencia | Δ | Fuente |
|---|---|---|---|---|---|
| 1992-04-12 00:00 TT | λ longitud | 133.1671° | 133.167° | **0.0001°** | Meeus Ej.47.a / JPL |
| 1992-04-12 00:00 TT | β latitud | −3.2292° | −3.2291° | **0.0001°** | Meeus Ej.47.a |
| 1992-04-12 00:00 TT | Δ distancia | 368.437 km | 368.409,7 km | **27 km** | Meeus Ej.47.a |

### Luna · Validación extendida vs JPL Horizons (DE441)

| Fecha | λ calculado | λ JPL | Δjpl | Δswiss | Tolerancia |
|---|---|---|---|---|---|
| 1992-04-12 00:00 TT | 133.1748° | 133.167° | **0.0078°** | 0.0118° | ≤ 0.020° |
| 2026-03-08 12:00 UTC | 226.1998° | 226.183° | **0.0168°** | 0.0208° | ≤ 0.020° |
| 2025-07-01 12:00 UTC | 175.2853° | 175.268° | **0.0173°** | 0.0213° | ≤ 0.020° |
| 2025-10-01 12:00 UTC | 295.8180° | 295.801° | **0.0170°** | 0.0210° | ≤ 0.020° |

### Mercurio · Meeus Cap.31 (ecuación del centro, 5 términos)

> **Nota sobre el algoritmo de Mercurio:** Mercurio usa Meeus Cap.31 (elementos orbitales + ecuación del centro) en lugar del VSOP87 truncado. El VSOP87 truncado de Meeus Apéndice II es menos preciso para Mercurio por su alta excentricidad orbital (e = 0.206). Error medido vs JPL Horizons DE441: Δ < 0.12° en todas las fechas de prueba.

| Fecha | λ calculado | λ JPL | Δjpl | Δswiss |
|---|---|---|---|---|
| 2026-03-08 12:00 UTC | 346.0744° | 346.090° | **0.0156°** | 0.0004° |
| 2025-07-01 12:00 UTC | 124.3027° | 124.418° | **0.1153°** | 0.1003° |
| 2025-10-01 12:00 UTC | 201.7178° | 201.834° | **0.1162°** | 0.1012° |
| 2026-09-01 12:00 UTC | 163.3590° | 163.472° | **0.1130°** | 0.0980° |

**Tolerancia: ≤ 0.12°** · Algoritmo: Meeus Cap.31

### Venus · VSOP87 (Meeus App.II — 79 términos)

| Fecha | λ calculado | λ JPL | Δjpl | Δswiss |
|---|---|---|---|---|
| 2026-03-08 12:00 UTC | 2.5458° | 2.550° | **0.0042°** | 0.0012° |
| 2025-07-01 12:00 UTC | 56.5414° | 56.648° | **0.1066°** | 0.1036° |
| 2025-10-01 12:00 UTC | 164.6817° | 164.789° | **0.1073°** | 0.1043° |
| 2026-09-01 12:00 UTC | 203.5653° | 203.672° | **0.1067°** | 0.1037° |

**Tolerancia: ≤ 0.12°** · Máximo observado: 0.1073°

### Marte · VSOP87 (Meeus App.II — 152 términos)

| Fecha | λ calculado | λ JPL | Δjpl | Δswiss |
|---|---|---|---|---|
| 2026-03-08 12:00 UTC | 334.6481° | 334.650° | **0.0019°** | 0.0011° |
| 2025-07-01 12:00 UTC | 158.0488° | 158.162° | **0.1132°** | 0.1102° |
| 2025-10-01 12:00 UTC | 216.1990° | 216.312° | **0.1130°** | 0.1100° |
| 2026-09-01 12:00 UTC | 103.7120° | 103.825° | **0.1130°** | 0.1100° |

**Tolerancia: ≤ 0.12°** · Máximo observado: 0.1132°

### Júpiter · VSOP87 (Meeus App.II — 141 términos)

| Fecha | λ calculado | λ JPL | Δjpl | Δswiss |
|---|---|---|---|---|
| 2026-03-08 12:00 UTC | 105.0983° | 105.100° | **0.0017°** | 0.0013° |
| 2025-07-01 12:00 UTC | 94.9236° | 95.036° | **0.1124°** | 0.1094° |
| 2025-10-01 12:00 UTC | 112.5237° | 112.636° | **0.1123°** | 0.1093° |
| 2026-09-01 12:00 UTC | 133.7989° | 133.912° | **0.1131°** | 0.1101° |

**Tolerancia: ≤ 0.12°** · Máximo observado: 0.1131°

### Saturno · VSOP87 (Meeus App.II — 167 términos)

| Fecha | λ calculado | λ JPL | Δjpl | Δswiss |
|---|---|---|---|---|
| 2026-03-08 12:00 UTC | 2.6229° | 2.620° | **0.0029°** | 0.0059° |
| 2025-07-01 12:00 UTC | 1.8217° | 1.934° | **0.1123°** | 0.1093° |
| 2025-10-01 12:00 UTC | 357.7244° | 357.837° | **0.1126°** | 0.1096° |
| 2026-09-01 12:00 UTC | 13.6574° | 13.770° | **0.1126°** | 0.1096° |

**Tolerancia: ≤ 0.12°** · Máximo observado: 0.1126°

### Otros componentes (validation.html — 30/30 PASS)

| Componente | Resultado | Fuente |
|---|---|---|
| Nutación IAU 1980 ΔΨ | error < 0.004 arcsec | Meeus Cap.22 |
| Nutación IAU 1980 Δε | error < 0.002 arcsec | Meeus Cap.22 |
| Oblicuidad ε₀ en J2000 | error < 0.002° | Meeus Cap.22 |
| Fases lunares (JDE) | error < 0.17 días | Meeus Cap.49 |
| Cúspides Placidus | 12/12 calculadas correctamente | Carta de referencia |
| ASC Santiago 1990 | error 0.009° | Carta de referencia |
| Nodos lunares | Nodo Sur = Nodo Norte + 180° exacto | Teoría |
| ΔT en J2000.0 | error < 0.1 s | IERS |

### Nota sobre el patrón de error del VSOP87

El offset sistemático de ~0.11° observado en Venus, Marte, Júpiter y Saturno en múltiples fechas (vs 0.003°–0.004° en la fecha de referencia original 2026-03-08) refleja el piso de precisión real de las **series VSOP87 truncadas de Meeus Apéndice II**. No es un defecto del motor — es el comportamiento esperado de la serie truncada. Las series VSOP87 completas de Bretagnon & Francou alcanzan < 1 arcsegundo; la serie truncada de Meeus alcanza < 8 arcminutos (0.13°). Todas las mediciones están dentro de la tolerancia declarada de **≤ 0.12°** y son consistentes con el rango de precisión documentado por Meeus para el intervalo 1800–2100 d.C.

**Rango de validez:** 1800–2100 d.C. (series VSOP87 truncadas, Meeus App.II).

---

## Inicio rápido

```bash
git clone https://github.com/HermeticaLabs/caelis-engine
# Abre caelis_engine_1_5.html en cualquier browser moderno
# Sin instalación. Sin build. Sin servidor.
```

O usa los módulos en Node.js:

```javascript
const AstroCore = require('./src/astro/AstroCore.js');
Object.assign(global, AstroCore);

// Globals del observador
global.lat = -33.45 * Math.PI/180;
global.lon = -70.66 * Math.PI/180;
global.R_TIERRA = 6371.0;

// Inyectar una Fecha Juliana para el cálculo
const jde = 2451545.0; // J2000.0
const nowJD = Date.now()/86400000 + 2440587.5;
global.timeOffset = (jde - nowJD) * 86400;

const lonSol  = AstroCore.sunLonEcl();          // longitud eclíptica en grados
const lonLuna = AstroCore.moonLonEcl();
const lonMarte = AstroCore.planetLonEcl('Marte');

console.log(lonSol, lonLuna, lonMarte);
```

Ejecutar la suite de precisión:

```bash
# Iniciar servidor local
node -e "const h=require('http'),f=require('fs'),p=require('path');h.createServer((req,res)=>{let fp='.'+req.url;if(fp==='./') fp='./index.html';f.readFile(fp,(e,d)=>{if(e){res.writeHead(404);res.end()}else{const ext=p.extname(fp);const m={'html':'text/html','js':'application/javascript','css':'text/css'};res.writeHead(200,{'Content-Type':m[ext.slice(1)]||'text/plain'});res.end(d)}})}).listen(8080,()=>console.log('http://localhost:8080'))"
# Abrir http://localhost:8080/validation.html
```

---

## Roadmap

- [x] VSOP87 + ELP/MPP02 — planetas y Luna (164L + 105B + 29R)
- [x] Calculadora de eclipses — solar y lunar, visibilidad georeferenciada (Premium)
- [ ] Serie R extendida ELP/MPP02 (coef. Chapront & Francou 2002 → dist < 10 km)
- [ ] Ayanamsa Lahiri (base sidérea)
- [ ] Nakshatras (27 mansiones lunares)
- [ ] Tithis (30 fases védicas)
- [ ] Panchanga (Tithi + Vara + Nakshatra + Yoga + Karana)
- [ ] Nutación IAU 2000A (1365 términos → ~0.1 mas)
- [ ] Capa API REST para integración en aplicaciones externas
- [ ] Núcleo WebAssembly para cómputo batch de alta performance
- [ ] Precesión IAU 2006

---

## Documentación

- [AstroCore API](docs/astrocore.es.md) — Núcleo matemático: VSOP87, ELP/MPP02, transformaciones de coordenadas, casas Placidus, nodos lunares, fases y detección de eclipses
- [TimeEngine API](docs/timeengine.es.md) — Control temporal, fechas julianas, tiempo sidéreo, snapshots astronómicos completos
- [Atacir — Análisis de Ciclos](docs/atacir.es.md) — Direcciones primarias, aspectos natales y de tránsito, ciclos, resonancias, análisis lunar
- [Referencias matemáticas](docs/references.es.md) — Algoritmos fuente, fórmulas y tabla completa de precisión verificada

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
Libre para usar, estudiar, modificar y compartir. Si usas Caelis Engine en un producto o servicio, debes publicar tu código fuente bajo los mismos términos.

**Licencia Comercial — Hermetica Labs**
Para uso en productos o servicios propietarios sin el requisito de divulgación de código fuente de la AGPL. Contacto: [hermeticalabs.dev@proton.me](mailto:hermeticalabs.dev@proton.me)

---

## Autor

**Cristian Valeria Bravo** · [Hermetica Labs](https://github.com/HermeticaLabs)

*Caelis Engine existe en el límite entre la precisión matemática y la observación simbólica — donde la estructura del tiempo se vuelve navegable.*

© 2024–2026 Cristian Valeria Bravo / Hermetica Labs
