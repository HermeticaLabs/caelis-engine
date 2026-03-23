# Caelis Engine

**Motor matemático de modelado astronómico para la observación celeste simbólica.**

Caelis Engine v2.1 calcula posiciones planetarias reales con algoritmos de precisión profesional (VSOP87, ELP/MPP02, IAU 2000B), las renderiza como un instrumento simbólico vivo, y expone un framework completo de análisis astronómico-astrológico — en un único archivo HTML sin dependencias.

[**→ Demo en vivo**](https://hermeticalabs.github.io/caelis-engine/) · [**Documentación**](#documentación) · [**Licencia**](#licencia) · [**Ko-fi**](https://ko-fi.com/hermeticalabs)

---

## Qué hace

- Calcula Sol, Luna y 5 planetas con **VSOP87** y **ELP/MPP02** (LLR), verificados contra Meeus, JPL Horizons DE441 e IERS — **145/145 tests PASS**
- Renderiza un **mapa de cielo 2D** en tiempo real con horizonte, eclíptica, casas Placidus y 600 estrellas
- **Oculus 3D** — esfera orbital Three.js con planetas en coordenadas celestes reales
- **Atacir** — análisis de ciclos, resonancias y sinastría con overlay de casas
- **Calculadora de eclipses** georeferenciada (Meeus Cap.54, Premium)
- **Panchanga védico** — 5 elementos + Ayanamsa Lahiri 2° orden (Premium)
- **Equinoccios/solsticios** — bisección VSOP87, precisión < 1 minuto

---

## Algoritmos

| Algoritmo | Fuente | Términos | Aplica a |
|---|---|---|---|
| **VSOP87** | Bretagnon & Francou 1987, Meeus App.II | Tierra: 185 · Venus: 79 · Marte: 152 · Júpiter: 141 · Saturno: 167 | Sol y planetas |
| **Mercurio** | Meeus Cap.31 (ecuación del centro) | 5 términos, e=0.206 | Mercurio |
| **ELP/MPP02** | Chapront & Francou 2002, A&A 412 (LLR) | 164L + 105B + 29R | Luna |
| **Nutación IAU 2000B** | Mathews, Herring & Buffett 2002 / IERS Conv. 2003 | 77 series lunisolares + args. Capitaine 2003 | ΔΨ, Δε |
| **Oblicuidad IAU 2006** | Capitaine et al. 2006 | Polinomio grado 5 | ε₀ |
| **Casas Placidus** | Meeus Cap.37 | Newton-Raphson < 1×10⁻⁹ rad | Cúspides I–XII |
| **ΔT** | Morrison & Stephenson 2004 + IERS + USNO | Tabla 74 puntos, 500–2150 d.C. | TT−UT |
| **Nodos lunares** | Meeus Cap.47 | 15 correcciones periódicas | ☊ ☋ |
| **Detección eclipses** | Meeus Cap.54 | Criterio argumento F | Solar · Lunar |
| **Ayanamsa Lahiri** | IAU 1955 + Lieske 1977 (2° orden) | Integral de precesión | Base sidérea védica |

---

## Precisión — 145/145 tests PASS

| Componente | Error máx. | Referencia |
|---|---|---|
| Luna λ (ELP/MPP02) | 0.0067° (24") | Meeus AA Ej.47.a |
| Sol VSOP87 | 0.0011° | Meeus AA Ej.25.a |
| Mercurio (ec. del centro) | < 0.116° | JPL Horizons DE441 |
| Venus / Marte / Júpiter / Saturno | < 0.131° | JPL Horizons DE441 |
| Nutación IAU 2000B ΔΨ | < 1 mas | IERS Conventions 2003 |
| Oblicuidad ε₀ en J2000 | < 0.001° | IAU 2006 |
| ASC Placidus | < 0.105° | Newton-Raphson |
| ΔT en J2000 | 63.8 s | IERS Bulletin |
| Nodo Norte Ω en J2000 | < 1.32° | Meeus Cap.47 |

**Rango de validez: 500–2150 d.C.** · Estabilidad numérica hasta 3000 d.C.

---

## Mejoras recientes — v2.1.1

| Mejora | Ganancia |
|---|---|
| **Nutación IAU 2000B** (77 series, Mathews 2002) | Precisión ΔΨ: 10 mas → 1 mas (10×) |
| **Oblicuidad IAU 2006** (Capitaine et al.) | ε₀ precisa a 0.002" en J2000 |
| **Tabla ΔT 500–2150 d.C.** (Morrison & Stephenson 2004) | Rango extendido desde 1620 |
| **Ayanamsa 2° orden** (integral de precesión Lieske 1977) | Hasta 3' de mejora en 1600 d.C. |
| **Nodos lunares 15 términos** (Meeus Cap.47 completo) | Error: ~1.24° → ~0.25° (5×) |

---

## API Pública

```javascript
const snap    = getSnapshotAt(jde, latDeg, lonDeg);
const panch   = calcPanchangaCore(dateStr, timeStr);
const ecl     = calcEclipsesCore(latDeg, lonDeg, rangoAnios, doSolar, doLunar, jdCenter);
const sin     = calcSinastriaCore(dateA, timeA, latA, lonA, dateB, timeB, latB, lonB);
const atacir  = calcAtacirCore(rxDate, rxTime, rxLat, rxLon, trDate, trTime, trLat, trLon, key);
const lonSol  = sunLonEcl();       // grados
const lonLuna = moonLonEcl();      // grados
const dist    = lunarDistELP(jde); // km
const dT      = deltaT(jde);       // segundos
```

---

## Roadmap

- [x] VSOP87 + ELP/MPP02 — LLR calibrado
- [x] Eclipses, Panchanga, Sinastría + overlay de casas
- [x] 145/145 tests vs JPL Horizons DE441 + Meeus AA + IERS
- [x] **Nutación IAU 2000B — 10× mejora sobre IAU 1980**
- [x] **ΔT extendido a 500–2150 d.C.**
- [x] **Ayanamsa 2° orden — Panchanga histórico mejorado**
- [x] **Nodos lunares 15 términos — 5× mejora**
- [ ] Interpretación hermética IA (experimental)
- [ ] Google Play Store
- [ ] Nutación IAU 2000A (1365 términos)
- [ ] Paquete npm (caelis-js)

---

## Modelo Freemium

**$12 USD pago único** — sin suscripción.

| Característica | Free | Premium |
|---|---|---|
| Caelis 2D, Astrolabio, Oculus 3D | ✓ | ✓ |
| Atacir completo | 1 aspecto | ✓ completo |
| Eclipses | Solo el próximo | ✓ rango completo |
| Panchanga completo | Tithi + Vara | ✓ 5 elementos |
| Sinastría — tabla completa + overlay | — | ✓ |
| Exportación JSON | Solo natales | ✓ completo |

[**→ Activar Premium — $12 USD**](https://ko-fi.com/hermeticalabs)

---

## Licencia

**AGPL-3.0** · Open Source · [Licencia Comercial](legal/COMMERCIAL_LICENSE_ES.pdf) para uso propietario ($59–$199 USD)

Contacto: [hermeticalabs.dev@proton.me](mailto:hermeticalabs.dev@proton.me)

---

**Cristian Valeria Bravo** · [Hermetica Labs](https://github.com/HermeticaLabs) · © 2024–2026

*Caelis Engine existe en el límite entre la precisión matemática y la observación simbólica.*

[ko-fi.com/hermeticalabs](https://ko-fi.com/hermeticalabs)
