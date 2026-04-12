# Caelis Engine 2.2

**Instrumento astronómico de precisión con interpretación IA hermética**

[![Demo en vivo](https://img.shields.io/badge/Demo-hermeticalabs.github.io-8b5cf6)](https://hermeticalabs.github.io/caelis-engine/)
[![npm](https://img.shields.io/npm/v/caelis-engine)](https://www.npmjs.com/package/caelis-engine)
[![Licencia](https://img.shields.io/badge/licencia-AGPL--3.0-blue)](LICENSE)

Caelis Engine es un instrumento astronómico profesional que corre íntegramente en el navegador como monolito HTML. Combina algoritmos matemáticos de precisión (VSOP87, ELP/MPP02-LLR, IAU 2000B) con una capa de interpretación IA, sin dependencias externas para el motor central.

---

## Demo en vivo

**[hermeticalabs.github.io/caelis-engine](https://hermeticalabs.github.io/caelis-engine/)**

---

## Novedades en v2.2

- **Resplandor perimetral** — retroalimentación visual en tiempo real para aspectos activos, tránsitos natales (halo púrpura) y eclipses (dorado/plateado)
- **Panel de aspectos en Astrolabio** — overlay compacto con los aspectos activos en modo astrolabio
- **Sistema de créditos renovables** — 3 créditos gratuitos/día con renovación automática a medianoche UTC; Personal (15/día, acumulable hasta 45), Developer (40/día, hasta 120), Studio (ilimitado)
- **Luna oscura en eclipse solar** — astronómicamente correcto: el disco lunar se oscurece al ocluir el Sol
- **Refactor de velocidades Oculus** — rango 10x–963x, paso ±10, barrera dura en 963x
- **Voz IA limpia** — markdown eliminado antes de síntesis de voz
- **Barra de audio con 5 controles** — reproducir · pausar · repetir · copiar · compartir
- **Toggles de capas en Settings** — constelaciones, casas, Vía Láctea, aspectos como interruptores ON/OFF
- **Persistencia localStorage** — ubicación, sistema de casas, capas, carta natal e idioma guardados entre sesiones
- **Detector Capacitor** — clase `body.capacitor` para control de features en app Android

---

## Motor Matemático

| Algoritmo | Fuente | Verificado |
|---|---|---|
| VSOP87 | Bretagnon & Francou 1987 | ✅ Sol + 5 planetas |
| ELP/MPP02-LLR | Chapront 2002 — 164L+105B+29R | ✅ Luna |
| Nutación IAU 2000B | Mathews 2002 — 77 series | ✅ |
| Oblicuidad IAU 2006 | Capitaine — polinomio grado 5 | ✅ |
| ΔT MS2004 + Stephenson 2016 | 74 puntos 500–2150 d.C. | ✅ |
| Ayanamsa Lahiri 2° orden | IAU 1955 + Lieske 1977 | ✅ |
| Nodos lunares 15 términos | Meeus Cap.47 | ✅ |
| Casas Placidus | Newton-Raphson | ✅ |
| Mercurio Meeus Cap.31 | Ecuación del centro | ✅ |

**Rango validado:** 500–2150 d.C.  
**Tests:** 145/145 precisión JPL · 29/29 algoritmos · 51/51 auditoría producción

---

## Funcionalidades

- Proyección estereográfica polar (modo Caelis)
- Modo Astrolabio (rete + tímpano)
- Modo Oculus 3D (Three.js)
- Atacir — Direcciones primarias (Al-Biruni, Ptolomeo, Naibod)
- Sinastría completa (aspectos cruzados, antiscias, biwheel SVG)
- Calculadora de eclipses (±10 años, click para saltar al momento)
- Panchanga védico (5 elementos + Lahiri)
- Lectura IA hermética (4 tipos + voz + barra de audio)
- Corona solar durante eclipse total
- i18n completo ES/EN con sistema `_t()`
- PWA instalable (offline)
- App Android via Capacitor

---

## Precios

| Tier | Precio | Créditos | Rollover |
|---|---|---|---|
| Free | — | 3/día | sin acumulación |
| Personal | $19 | 15/día | hasta 45 |
| Developer | $49 | 40/día | hasta 120 |
| Studio | $199 | ilimitado | — |

---

## API AstroSync

```javascript
import CaelisEngine from 'caelis-engine';

const engine = new CaelisEngine();
const snap = engine.getSnapshot();

console.log(snap.bodies.Sol.lon_ecl);  // longitud eclíptica
console.log(snap.moon.phase);          // 0–1
console.log(snap.houses.asc);          // grado ascendente
```

---

## Validación

```bash
node suite_v2_final.js           # 145/145 tests precisión JPL
node test_precision.js           # 29/29 tests unitarios
python audit_prod.py index.html  # 51/51 checks producción
```

---

## Estructura del repositorio

```
caelis-engine/
├── index.html              ← Monolito producción (PROD)
├── caelis_engine_2_2.html  ← Copia versionada
├── manifest.json           ← PWA manifest
├── sw.js                   ← Service worker
├── suite_v2_final.js       ← Suite de tests JPL
├── test_precision.js       ← Tests unitarios
├── audit_prod.py           ← Auditoría producción (51 checks)
├── sync_caelis_v22.ps1     ← Script de sincronización
├── docs/
│   ├── astrocore.md
│   ├── atacir.md
│   ├── references.md
│   └── timeengine.md
└── assets/icons/
```

---

## Licencia

AGPL-3.0 © 2024–2026 Cristian Valeria Bravo / Hermetica Labs  
[hermeticalabs.github.io/caelis-engine](https://hermeticalabs.github.io/caelis-engine/)
