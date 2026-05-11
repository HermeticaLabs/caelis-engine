# Changelog — Caelis Engine

## [3.0.0] — 2026-05

### Motor astronómico — Precisión

**Mercurio — VSOP87B oficial**
- Reemplaza la ecuación del centro anterior (±5–10') por VSOP87B del IMCCE (Bretagnon & Francou 1988)
- 122 términos extraídos de `VSOP87B.mer` con umbral de amplitud ≥ 1×10⁻⁶ rad/AU
- Precisión: ±3" longitud, ±2" latitud, ±0.001 AU radio — mejora 10–100× sobre implementación anterior
- Constantes de fase pre-evaluadas correctamente (fix de `A×cos(π) = −A` en términos constantes)

**Rise / Set — Meeus Cap.15 completo**
- Interpolación cuadrática de 3 puntos: posiciones en t−1d, t₀, t+1d recalculadas con el motor real
- ΔT corregido: GMST calculado en JD UT (no TT) — elimina error sistemático de ~1 min
- 3 iteraciones de corrección de altitud — convergencia garantizada incluso para la Luna
- h₀ correcto por tipo de cuerpo: Sol −0.8333°, Luna +0.1167° (antes −0.1667°), planetas −0.5667°
- Resultado en hora local automática vía `Date.getTimezoneOffset()`
- Mejora: Luna de ±48 min → ±10 min de error vs Stellarium

**RA / Dec — normalización y unidades**
- `moonPosition()`: RA topocéntrico normalizado a [0, 2π] (corrige RA negativo en ciertas configuraciones)
- `fmtRA()`: normaliza input a [0, 360°) antes de formatear + carry para 60s/60m
- Todos los call sites de `fmtRA()` / `fmtDec()` corregidos para pasar grados (no radianes)
- Estrellas fijas, planetas y Sol en tooltips ahora muestran RA/Dec correctos

### Dashboard

**Nuevas columnas en tabla de posiciones**
- `Az` (azimut) añadido junto a `Alt`
- `Rise` y `Set` calculados por fila para todos los cuerpos
- `AR` renombrado a `RA` (convención estándar)
- Columnas en nuevo orden: `λ Ecl | β Ecl | RA | Dec | Alt | Az | Dist | Vel | Rise | Set`

**Card Luna expandida**
- Filas Rise y Set añadidas al resumen de la Luna

**Card Tiempo**
- Nueva fila `Local` (hora del dispositivo con timezone) como primera línea, destacada
- UTC permanece como segunda fila

**Planetas — limpieza de datos**
- Urano y Neptuno eliminados de todas las tablas (sin algoritmo implementado)
- Keys de planetas corregidas para coincidir con los nombres de `heliocentricCoords()`

### Motor de tiempo

**Loop de animación — delta-time real**
- `timeOffset += timeSpeed*(1/60)` reemplazado por delta-time basado en `performance.now()`
- Cap de 500ms para saltos grandes (tab en background, sleep del sistema)
- Cuando `timeSpeed === 1` (tiempo real): `timeOffset = 0` — anclado a `Date.now()` sin drift
- `_lastFrameTime` se resetea en `resetNow()` para evitar deltas acumulados tras saltos manuales

### Correcciones de bugs

- `_iaUpdateContextLabel` eliminado de `_applyLang()` (función eliminada en v3.0, llamada huérfana)
- `observer.lon` en `_riseSetForBody` corregido a `lon` (variable global, no objeto inexistente)
- `ocuToggleArmilar()` protegido con guards null para `btnArmilar` (elemento eliminado en v3.0)
- Variable `t` (blend por planeta) eliminada de `renderOculus()` — reemplazada por `tG` (blend global)

### Modo Armilar 3D

**Posicionamiento astronómico real**
- Nueva variable `armilarReal`: cuando activa, los planetas se posicionan en `(cos(dec)cos(ra), sin(dec), cos(dec)sin(ra)) × orbitR` — coordenadas esféricas ecuatoriales directas del motor
- Blend animado `armilarBlendGlobal` (0→1) para transición suave libre ↔ real
- La pulsación estética se reduce a 15% en modo real para no distorsionar posiciones

**Capas visuales armilares** (todas activables/desactivables)
- Eclíptica: `TorusGeometry` inclinado 23.44° (oblicuidad real), dorado
- Ecuador ecuatorial: anillo horizontal Y=0, azul
- Horizonte local: inclinado según `lat` del observador, verde
- Meridiano: plano YZ, naranja
- Grid de declinación: anillos en ±30° y ±60°, azul oscuro

**Escala radial**
- Slider Uniforme ↔ Logarítmica (proporcional a AU reales)
- `OCU_SCALE_LOG` con radios logarítmicos normalizados por planeta

**Panel rediseñado** — secciones: Modo / Esferas / Escala / Paleta / Estelas / Astros

**Acceso**
- Modo accesible mediante secuencia de interacción en el dashboard

---

## [2.2.0] — 2024

- Motor VSOP87 base (Meeus Apéndice II) para Venus, Tierra, Marte, Júpiter, Saturno
- ELP/MPP02 para Luna (Meeus Cap.47)
- Nutación IAU 2000B
- Aberración anual (Meeus §23)
- Light-time iterativo
- Astrolabio estereográfico 2D
- Dashboard de efemérides inicial

---

## [1.5.0] — 2024

- Motor inicial: atasir.js, astrocore.js, timeengine.js (arquitectura multi-archivo)
- Algoritmos simplificados (ecuación del centro, coordenadas aproximadas)
- Primer prototipo de visualización astronómica

---

*Hermetica Labs · CC BY-NC-ND 4.0*
