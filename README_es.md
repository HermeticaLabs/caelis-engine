# Caelis Engine

**Motor matemático de modelado astronómico para la observación celeste simbólica.**

Caelis Engine calcula posiciones planetarias reales usando algoritmos de precisión profesional (VSOP87, ELP/MPP02), las renderiza como un instrumento simbólico vivo, y expone un framework de análisis de ciclos, resonancias, eclipses y calendario védico — todo en un único archivo HTML, sin dependencias.

[**→ Demo en vivo**](https://hermeticalabs.github.io/caelis-engine/caelis_engine_1_5.html) · [**Documentación**](#documentación) · [**Licencia**](#licencia) · [**Ko-fi**](https://ko-fi.com/hermeticalabs)

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
| Archivo único, corre en browser | ✓ | no | no |
| Arquitectura modular | ✓ | varía | no |

---

## Módulos principales

```
caelis-engine/
├── caelis_engine_1_5.html     ← Instrumento completo (archivo único, standalone) — 7.875 líneas
├── validation.html            ← Suite de precisión — 56/56 PASS
└── src/
    ├── astro/
    │   └── AstroCore.js       ← VSOP87, ELP/MPP02, transformaciones, detección de eclipses
    ├── TimeEngine.js          ← Fechas julianas, tiempo sidéreo, control temporal
    └── Atacir.js              ← Análisis de ciclos, aspectos, resonancias, sinastría, Panchanga
```

**AstroCore** — el núcleo matemático. Algoritmos de posición planetaria (VSOP87, ELP/MPP02), transformaciones de coordenadas (eclíptica → ecuatorial → horizontal), cómputo de fase lunar, detección de eclipses (Meeus Cap.54), bisección de equinoccios/solsticios, Ayanamsa Lahiri, datos de estrellas fijas.

**TimeEngine** — el tiempo como variable de primera clase. Conversión de fecha juliana, tiempo sidéreo, control de offset temporal, multiplicador de velocidad (desde 1 segundo/frame hasta 1 año/frame).

**Atacir** — la capa analítica. Aspectos natales y de tránsito, ciclos planetarios, períodos sinódicos, detección de resonancias, progresión de casas Placidus, direcciones primarias (Al-Biruni / Ptolomeo), sinastría, Panchanga védico.

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
| **Detección de eclipses** | Meeus Cap.54 | Criterio argumento F | Solar (total/anular/parcial) · Lunar (total/parcial) |
| **Equinoccios/Solsticios** | Bisección VSOP87 sobre sunLonEcl() | Precisión < 1 min | Cruces del Sol en 0°, 90°, 180°, 270° |
| **Ayanamsa Lahiri** | IAU 1955, Lahiri | 23.85282° + 0.013972°/año desde J2000 | Base sidérea védica |
| **Aberración anual** | Diferencial numérico | Δτ = 0.001 siglos | Todos los cuerpos |
| **Corrección tiempo-luz** | Iterativa | c = 173.1446326 UA/día | Todos los planetas |
| **Paralaje topocéntrico** | Meeus Cap.40 | Radio geocéntrico WGS84 | Luna AR/Dec |
| **Refracción atmosférica** | Bennett 1982 | Alt > −1° | Todos los cuerpos |
| **GAST / Tiempo sidéreo** | IAU 2000A, Meeus Cap.12 | Ecuación de los equinoccios | TSL |
| **ΔT** | Tabla IERS 1620–2100 | Interpolación lineal + polinomio | Todos los JDE |
| **Direcciones primarias (Atacir)** | Ptolomeo / Al-Biruni | Método de ascensión oblicua | Carta natal |

### Por qué Mercurio usa un algoritmo diferente

La excentricidad orbital de Mercurio es e = 0.206 — la más alta de los planetas clásicos. El VSOP87 truncado de Meeus Apéndice II acumula errores significativos para Mercurio porque la truncación elimina términos no despreciables a alta excentricidad. La ecuación del centro (Meeus Cap.31, 5 términos) es más estable. Error medido: Δ < 0.12° vs JPL Horizons DE441.

### Nota sobre el patrón de error del VSOP87 truncado

El offset sistemático de ~0.11° observado en Venus, Marte, Júpiter y Saturno refleja el piso de precisión real de las **series VSOP87 truncadas de Meeus Apéndice II** — no es un defecto del motor. Las series VSOP87 completas alcanzan < 1 arcsegundo; la serie truncada de Meeus alcanza < 8 arcminutos (0.13°). Todas las mediciones están dentro de la tolerancia declarada. Rango de validez: 1800–2100 d.C.

---

## Precisión

Todos los resultados verificados — **56/56 tests PASS** — contra JPL Horizons (DE441), Swiss Ephemeris (DE441) y Meeus Astronomical Algorithms 2ª ed.

### Sol · VSOP87 (Meeus Cap.25)

| Fecha | Calculado | Referencia | Δ | Fuente |
|---|---|---|---|---|
| 1992-10-13 00:00 TT | 199.9066° | 199.906° | **0.0006°** | Meeus Cap.25 Ej.25.a |
| 1992-04-12 00:00 TT | 22.3399° | 22.340° | **0.0001°** | Meeus Cap.25 |

### Luna · ELP/MPP02 (Chapront & Francou 2002, A&A 412)

*Actualizado Marzo 2026: mejora 63× en longitud vs implementación anterior ELP2000/Meeus Cap.47.*

| Cantidad | Calculado | Referencia | Δ | Fuente |
|---|---|---|---|---|
| λ Longitud eclíptica | 133.1671° | 133.167° | **0.0001° (0.45")** | JPL Horizons DE441 |
| β Latitud eclíptica | −3.2292° | −3.2291° | **0.0001°** | Meeus Ej.47.a |
| Δ Distancia geocéntrica | 368.437 km | 368.409,7 km | **27 km (0.007%)** | Meeus Ej.47.a |

### Planetas · JPL Horizons (DE441) — validación extendida, 4 fechas por planeta (2025–2026)

| Planeta | Algoritmo | Δ max vs JPL | Δ max vs Swiss Eph. |
|---|---|---|---|
| Mercurio | Meeus Cap.31 (ec. del centro) | < 0.116° | < 0.116° |
| Venus | VSOP87, 79 términos | < 0.107° | < 0.107° |
| Marte | VSOP87, 152 términos | < 0.113° | < 0.113° |
| Júpiter | VSOP87, 141 términos | < 0.131° | < 0.131° |
| Saturno | VSOP87, 167 términos | < 0.126° | < 0.126° |

### Otros componentes

| Componente | Resultado | Fuente |
|---|---|---|
| Nutación IAU 1980 ΔΨ | error < 0.004 arcsec | Meeus Cap.22 |
| Nutación IAU 1980 Δε | error < 0.002 arcsec | Meeus Cap.22 |
| Oblicuidad ε₀ en J2000 | error < 0.002° | Meeus Cap.22 |
| Fases lunares (JDE) | error < 0.17 días | Meeus Cap.49 |
| Cúspides Placidus | 12/12, error < 0.009° | Carta de referencia |
| Nodos lunares | Nodo Sur = Nodo Norte + 180° exacto | Teoría |
| ΔT en J2000.0 | error < 0.1 s | IERS |

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

const lonSol   = AstroCore.sunLonEcl();          // longitud eclíptica en grados
const lonLuna  = AstroCore.moonLonEcl();
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

## Modelo Freemium

Caelis Engine usa un modelo freemium. Premium es un **pago único de $12 USD** vía Ko-fi — sin suscripción, sin renovación anual. La clave de licencia se activa en el browser y funciona offline indefinidamente.

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
- [ ] Serie R extendida ELP/MPP02 (coef. Chapront & Francou 2002 → dist < 10 km)
- [ ] Nutación IAU 2000A (1365 términos → ~0.1 mas)
- [ ] Capa API REST para integración en aplicaciones externas
- [ ] Núcleo WebAssembly para cómputo batch de alta performance
- [ ] Precesión IAU 2006

---

## Documentación

- [AstroCore API](docs/astrocore.es.md) — Núcleo matemático: VSOP87, ELP/MPP02, transformaciones de coordenadas, casas Placidus, nodos lunares, fases, eclipses, ayanamsa
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
