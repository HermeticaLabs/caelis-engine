# Caelis Engine

**Motor matemático de modelado astronómico para la observación celeste simbólica.**

Caelis Engine calcula posiciones planetarias reales usando algoritmos de precisión profesional (VSOP87, ELP2000), las renderiza como un instrumento simbólico vivo, y expone un framework de análisis de ciclos y resonancias — todo en un único archivo HTML, sin dependencias.

[**→ Demo en vivo**](https://hermeticalabs.github.io/caelis-engine) · [**Documentación**](#documentación) · [**Licencia**](#licencia)

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

- Calcula Sol, Luna y 5 planetas usando **VSOP87** (planetas) y **ELP2000 Cap.47** (Luna), verificados contra *Astronomical Algorithms* de Jean Meeus
- Renderiza un **mapa de cielo 2D** en tiempo real con horizonte, eclíptica, cúspides de casas (Placidus) y 600 estrellas de fondo
- Cambia a **Oculus 3D** — una esfera orbital Three.js donde los planetas se mueven en coordenadas celestes reales
- Analiza **ciclos planetarios, resonancias y periodicidad** — conjunciones, períodos sinódicos, patrones de aspectos
- Casas, aspectos, tránsitos y progresiones vía el panel de análisis **Atacir**

---

## Por qué es diferente

| Característica | Caelis Engine | Librería astro típica | App de cielo típica |
|---|---|---|---|
| VSOP87 + ELP2000 | ✓ | a veces | raramente |
| Verificado contra Meeus | ✓ | raramente | no |
| Verificado contra JPL Horizons | ✓ | raramente | no |
| Sin dependencias | ✓ | no | no |
| Capa simbólica + científica | ✓ | no | no |
| Análisis de ciclos y resonancias | ✓ | no | no |
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
    │   └── AstroCore.js       ← VSOP87, ELP2000, transformaciones de coordenadas
    ├── TimeEngine.js          ← Fechas julianas, tiempo sidéreo, control temporal
    └── Atacir.js              ← Análisis de ciclos, aspectos, resonancias, progresiones
```

**AstroCore** — el núcleo matemático. Algoritmos de posición planetaria, transformaciones de sistemas de coordenadas (eclíptica → ecuatorial → horizontal), cómputo de fase lunar, datos de estrellas fijas.

**TimeEngine** — el tiempo como variable de primera clase. Conversión de fecha juliana, tiempo sidéreo, control de offset temporal, multiplicador de velocidad (desde 1 segundo/frame hasta 1 año/frame).

**Atacir** — la capa analítica. Aspectos natales y de tránsito, ciclos planetarios, períodos sinódicos, detección de resonancias, progresión de casas Placidus.

---

## Precisión

Todos los resultados verificados por `validation.html` — **30/30 tests PASS**.

### Luna · ELP2000 (Meeus Ejemplo 47.a · JDE 2448724.5)

| Cantidad | Calculado | Referencia Meeus | Error |
|---|---|---|---|
| λ Longitud eclíptica | 133.1782° | 133.1627° | **0.016°** |
| β Latitud eclíptica | −3.2286° | −3.2291° | **0.001°** |
| Δ Distancia geocéntrica | 368.436 km | 368.409,7 km | **27 km** |

### Sol · VSOP87 (Meeus Cap.25)

| Fecha | Calculado | Referencia | Error |
|---|---|---|---|
| 1992-10-13 (Libra) | 199.9068° | 199.906° | **< 0.001°** |
| 1992-04-12 (Tauro) | 22.3402° | 22.340° | **< 0.001°** |

### Planetas · JPL Horizons (2026-03-08 12:00 UTC)

| Planeta | Calculado | JPL Horizons | Error |
|---|---|---|---|
| Venus | 2.5469° | 2.5500° | **0.003°** |
| Marte | 334.6487° | 334.6500° | **0.001°** |
| Júpiter | 105.0983° | 105.1000° | **0.002°** |
| Saturno | 2.6230° | 2.6200° | **0.003°** |

### Otros componentes

| Componente | Resultado |
|---|---|
| Nutación IAU 1980 ΔΨ | error < 0.004 arcsec vs Meeus |
| Nutación IAU 1980 Δε | error < 0.002 arcsec vs Meeus |
| Oblicuidad ε₀ en J2000 | error < 0.002° vs Meeus |
| Fases lunares (JDE) | error < 0.17 días vs Meeus Cap.49 |
| Cúspides Placidus | 12/12 calculadas correctamente |
| Nodos lunares | Nodo Sur = Nodo Norte + 180° ✓ |

**Rango de validez:** Series VSOP87 truncadas (Meeus App.II) — precisión confiable dentro del rango 1800–2100 d.C.

---

## Inicio rápido

```bash
git clone https://github.com/HermeticaLabs/caelis-engine
# Abre caelis_engine_1_5.html en cualquier browser moderno
# Sin instalación. Sin build. Sin servidor.
```

O usa los módulos en Node.js:

```javascript
import { sunPosition, moonPosition, planetPosition } from './src/astro/AstroCore.js';

const jd   = 2451545.0; // J2000.0
const sol  = sunPosition(jd);
const luna = moonPosition(jd);
const marte = planetPosition(jd, 'Marte');

console.log(sol.lon, luna.lon, marte.lon); // longitudes eclípticas en grados
```

Ejecutar la suite de precisión:

```bash
# Iniciar servidor local
node -e "const h=require('http'),f=require('fs'),p=require('path');h.createServer((req,res)=>{let fp='.'+req.url;if(fp==='./') fp='./index.html';f.readFile(fp,(e,d)=>{if(e){res.writeHead(404);res.end()}else{const ext=p.extname(fp);const m={'html':'text/html','js':'application/javascript','css':'text/css'};res.writeHead(200,{'Content-Type':m[ext.slice(1)]||'text/plain'});res.end(d)}})}).listen(8080,()=>console.log('http://localhost:8080'))"
# Abrir http://localhost:8080/validation.html
```

---

## Roadmap

- [ ] Arquitectura de plugins — extender con cuerpos personalizados, sistemas de coordenadas, renderers
- [ ] Capa API REST para integración en aplicaciones externas
- [ ] Exportación: tablas de efemérides, líneas de tiempo de aspectos, reportes de ciclos
- [ ] Núcleo WebAssembly para cómputo batch de alta performance
- [ ] Modo cielo oscuro / overlays observacionales

---

## Documentación

- [API AstroCore](docs/astrocore.es.md) — Núcleo matemático: VSOP87, ELP2000, transformaciones de coordenadas, casas Placidus, nodos lunares y fases
- [API TimeEngine](docs/timeengine.es.md) — Control temporal, fechas julianas, tiempo sidéreo, snapshots astronómicos completos
- [Atacir — Análisis de Ciclos](docs/atacir.es.md) — Direcciones primarias, aspectos natales y de tránsito, ciclos, resonancias, análisis lunar
- [Referencias matemáticas](docs/references.es.md) — Algoritmos fuente, fórmulas y tabla completa de precisión verificada

---

## Fundamentos matemáticos

- Jean Meeus — *Astronomical Algorithms*, 2ª ed.
- VSOP87 — Bretagnon & Francou, 1987
- ELP2000-82B — Chapront-Touzé & Chapront, 1988
- Series de nutación IAU 1980, correcciones FK5, aberración anual

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
