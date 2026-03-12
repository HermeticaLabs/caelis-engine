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
└── src/
    ├── AstroCore.js           ← VSOP87, ELP2000, transformaciones de coordenadas
    ├── TimeEngine.js          ← Fechas julianas, tiempo sidéreo, control temporal
    └── Atacir.js              ← Análisis de ciclos, aspectos, resonancias, progresiones
```

**AstroCore** — el núcleo matemático. Algoritmos de posición planetaria, transformaciones de sistemas de coordenadas (eclíptica → ecuatorial → horizontal), cómputo de fase lunar, datos de estrellas fijas.

**TimeEngine** — el tiempo como variable de primera clase. Conversión de fecha juliana, tiempo sidéreo, control de offset temporal, multiplicador de velocidad (desde 1 segundo/frame hasta 1 año/frame).

**Atacir** — la capa analítica. Aspectos natales y de tránsito, ciclos planetarios, períodos sinódicos, detección de resonancias, progresión de casas Placidus.

---

## Precisión

Posición lunar verificada en JDE 2448724.5 (Ejemplo 47.a de Meeus):
- Calculado: λ = 133.1628°, β = −3.2291°, Δ = 368409.7 km
- Referencia Meeus: λ = 133.1627°, β = −3.2291°, Δ = 368409.7 km
- **Error: < 0.001°**

Posiciones planetarias verificadas contra JPL Horizons para 2026-03-08 12:00 UTC. Todos los cuerpos dentro de 0.1° de la referencia.

---

## Inicio rápido

```bash
git clone https://github.com/HermeticaLabs/caelis-engine
# Abre caelis_engine_1_5.html en cualquier browser moderno
# Sin instalación. Sin build. Sin servidor.
```

O usa los módulos en Node.js:

```javascript
import { sunPosition, moonPosition, planetPosition } from './src/AstroCore.js';

const jd   = 2451545.0; // J2000.0
const sol  = sunPosition(jd);
const luna = moonPosition(jd);
const marte = planetPosition(jd, 'Marte');

console.log(sol.lon, luna.lon, marte.lon); // longitudes eclípticas en grados
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

- [API AstroCore](docs/astrocore.md) *(próximamente)*
- [API TimeEngine](docs/timeengine.md) *(próximamente)*
- [Atacir — Análisis de Ciclos](docs/atacir.md) *(próximamente)*
- [Referencias matemáticas](docs/references.md) *(próximamente)*

---

## Fundamentos matemáticos

- Jean Meeus — *Astronomical Algorithms*, 2ª ed.
- VSOP87 — Bretagnon & Francou, 1987
-  ELP2000-82B — Chapront-Touzé & Chapront, 1988
- Series de nutación IAU, correcciones FK5, aberración

---

## Licencia

Caelis Engine tiene licencia dual:

**Open Source — AGPL-3.0**
Libre para usar, estudiar, modificar y compartir. Si usas Caelis Engine en un producto o servicio, debes publicar tu código fuente bajo los mismos términos.

**Licencia Comercial — Hermetica Labs**
Para uso en productos o servicios propietarios sin el requisito de divulgación de código fuente de la AGPL. Contacto: [hermeticalabs@proton.me](mailto:hermeticalabs@proton.me)

---

## Autor

**Cristian Valeria Bravo** · [Hermetica Labs](https://github.com/HermeticaLabs)

*Caelis Engine existe en el límite entre la precisión matemática y la observación simbólica — donde la estructura del tiempo se vuelve navegable.*

© 2024–2026 Cristian Valeria Bravo / Hermetica Labs
