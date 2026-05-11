# ⊛ Caelis Engine 3.0

**Motor astronómico contemplativo — Hermetica Labs**

Caelis Engine es un instrumento astronómico de alta precisión ejecutado completamente en el navegador, sin dependencias de servidor. Combina cálculo astronómico riguroso (VSOP87, ELP/MPP02, IAU 2000B) con una interfaz contemplativa diseñada para la observación y el estudio del cielo.

---

## Uso

Abre `caelis_engine_3_0.html` directamente en el navegador. No requiere instalación ni servidor.

```
caelis_engine_3_0.html   ← instrumento completo, autocontenido
```

---

## Arquitectura

Caelis Engine 3.0 es un **monolito de archivo único** (~540 KB). Todo el motor astronómico, la interfaz, los algoritmos de cálculo y la visualización 3D están contenidos en un solo archivo HTML.

### Estructura interna

```
caelis_engine_3_0.html
├── Motor de tiempo          currentTime(), julianDate(), deltaT()
├── Algoritmos planetarios   VSOP87B (Mercurio–Saturno), ELP/MPP02 (Luna)
├── Correcciones             Nutación IAU 2000B, aberración anual, light-time
├── Correcciones topocéntricas  paralaje diurno, refracción atmosférica
├── Módulo Rise/Set          Meeus Cap.15, interpolación 3 puntos, ΔT correcto
├── Dashboard de efemérides  RA, Dec, Alt, Az, Dist, Vel, Rise, Set
├── Visualización 2D         Astrolabio estereográfico, modo Oculus 2D
└── Visualización 3D         Three.js (modo reservado)
```

### Algoritmos de precisión

| Cuerpo | Algoritmo | Precisión |
|--------|-----------|-----------|
| Mercurio | VSOP87B oficial (IMCCE, 122 términos) | ±3" longitud |
| Venus | VSOP87 (Meeus App.II, ~79 términos) | ±5" |
| Tierra | VSOP87 (Meeus App.II, ~185 términos) | ±1" |
| Marte | VSOP87 (Meeus App.II, ~152 términos) | ±15" |
| Júpiter | VSOP87 (Meeus App.II, ~141 términos) | ±30" |
| Saturno | VSOP87 (Meeus App.II, ~167 términos) | ±40" |
| Luna | ELP/MPP02 (164L + 105B + 29R términos) | ±30" longitud |
| Sol | VSOP87 Tierra invertido + nutación + aberración | ±1" |

Correcciones aplicadas a todos los cuerpos:
- Nutación IAU 2000B (Δψ, Δε)
- Aberración anual (Meeus §23)
- Tiempo de luz (light-time, iterativo)
- Corrección topocéntrica (paralaje diurno, RA y Dec)
- ΔT (tabla IERS interpolada, 1900–2030)

### Rise / Set

Implementación Meeus Cap.15 con:
- Interpolación cuadrática de 3 puntos (t−1d, t₀, t+1d)
- ΔT aplicado al GMST (JD UT, no TT)
- 3 iteraciones de corrección de altitud
- h₀ correcto por cuerpo: Sol −50', Luna +7', planetas −34'
- Hora local automática vía `Date.getTimezoneOffset()`

---

## Módulos fuente (referencia)

La carpeta `src/` contiene los módulos que fueron la base de desarrollo de versiones anteriores. En v3.0, toda la lógica está consolidada en el monolito.

```
src/
├── vsop87/          Coeficientes VSOP87B fuente
├── elp/             Tablas ELP/MPP02
└── utils/           Utilidades de formateo y conversión
```

---

## Tests

```
tests/validation.html    Suite de 30 tests contra Meeus y JPL Horizons
```

Ejecutar: abrir `tests/validation.html` en el navegador.

---

## Changelog

Ver [CHANGELOG.md](CHANGELOG.md) para historial completo de versiones.

---

## Licencia

**CC BY-NC-ND 4.0** — Hermetica Labs  
Uso permitido con atribución. No comercial. Sin obras derivadas.

© 2024–2026 Hermetica Labs · [github.com/HermeticaLabs](https://github.com/HermeticaLabs)
