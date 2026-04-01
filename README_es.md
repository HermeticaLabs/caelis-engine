# Caelis Engine v2.2

**Motor astronómico matemático + sistema de interpretación simbólica basado en mecánica celeste real.**

Caelis Engine calcula posiciones planetarias reales con precisión profesional (VSOP87, ELP/MPP02-LLR, IAU 2000B) y las transforma en un framework simbólico navegable — ahora extendido con interpretación IA segura.

[**→ Demo en vivo**](https://hermeticalabs.github.io/caelis-engine/) ·
Incluye demo IA limitada (sin licencia) [**npm**](https://npmjs.com/package/caelis-engine) · [**Ko-fi**](https://ko-fi.com/hermeticalabs)

---

## Qué es Caelis Engine

- No es solo un visor del cielo
- No es solo una herramienta astrológica
- No es solo una librería

Caelis Engine es un **instrumento astronómico simbólico** — combina mecánica celeste real con interpretación estructurada, ejecutándose completamente en el navegador sin dependencias para el núcleo matemático.

---

## Qué hace

Capacidades principales del instrumento:

| Función | Descripción |
|---|---|
| **Cielo en tiempo real** | Proyección estereográfica polar, todos los cuerpos, constelaciones, Vía Láctea |
| **Modo Astrolabio** | Astrolabio estereográfico clásico con rete y tímpano |
| **Atacir** | Arcos de dirección por ascensión oblicua (Al-Biruni / Ptolomeo / Naibod) |
| **Sinastría** | Aspectos cruzados, antiscias, simetrías, distribución elemental, biwheel SVG |
| **Calculadora de eclipses** | Solar + lunar, rango ±10 años, visibilidad georeferenciada — click para saltar al momento |
| **Panchanga** | Almanaque védico: Tithi, Vara, Nakshatra, Yoga, Karana con Ayanamsa Lahiri |
| **Lectura IA Hermética** | Interpretación estructurada y determinista de los datos astronómicos calculados (Premium) |
| **i18n** | Español / English (Deutsch, हिन्दी en roadmap) |
| **⚙ Settings** | Idioma, voz IA, panel compacto integrado en la barra de controles |

---

## Algoritmos

| Algoritmo | Fuente | Términos | Aplica a |
|---|---|---|---|
| **VSOP87** | Bretagnon & Francou 1987, Meeus App.II | Tierra: 185 · Venus: 79 · Marte: 152 · Júpiter: 141 · Saturno: 167 | Sol y planetas |
| **Mercurio** | Meeus Cap.31 (ecuación del centro) | 5 términos, e=0.206 | Mercurio |
| **ELP/MPP02-LLR** | Chapront & Francou 2002, A&A 412 | 164L + 105B + 29R | Luna |
| **Nutación IAU 2000B** | Mathews, Herring & Buffett 2002 / IERS Conv. 2003 | 77 series lunisolares + args. Capitaine 2003 | ΔΨ, Δε |
| **Oblicuidad IAU 2006** | Capitaine et al. 2006 | Polinomio grado 5 | ε₀ |
| **Casas Placidus** | Meeus Cap.37 | Newton-Raphson < 1×10⁻⁹ rad | Cúspides I–XII |
| **ΔT** | Morrison & Stephenson 2004 + IERS + USNO | Tabla 74 puntos, 500–2150 d.C. | TT−UT |
| **Nodos lunares** | Meeus Cap.47 | 15 correcciones periódicas | ☊ ☋ |
| **Detección eclipses** | Meeus Cap.54 | Criterio argumento F + magnitud | Solar · Lunar |
| **Ayanamsa Lahiri** | IAU 1955 + Lieske 1977 (2° orden) | Integral de precesión | Base sidérea védica |

---

## Precisión — 145/145 tests PASS

| Componente | Error máx. | Referencia |
|---|---|---|
| Luna λ (ELP/MPP02-LLR) | 0.0067° (24") | Meeus AA Ej.47.a |
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

## Capa de Interpretación IA

Caelis Engine integra un sistema de interpretación IA seguro construido **sobre** su núcleo astronómico determinista.

- **Entrada estructurada** — planetas, aspectos, casas, ciclos, ayanamsa
- **Sin exposición de prompts** — todas las plantillas residen en el servidor
- **Ejecución vía Worker** — sin claves API en el cliente
- **Acceso por licencia** — exclusivo Premium
- **4 tipos de lectura** — cielo actual · carta natal · tránsitos Atacir · sinastría · Panchanga
- **Voz** — SpeechSynthesis, adaptada al idioma activo (ES/EN)

La IA no reemplaza el modelo astronómico — interpreta la estructura ya calculada.

---

## Modelo de Seguridad

La capa IA se ejecuta a través de un Cloudflare Worker protegido:

- **Sin claves API en el cliente** — endpoint hardcodeado, la clave es un secret del Worker
- **Validación de Origin** — peticiones de dominios no autorizados son rechazadas (403)
- **Control de acceso por licencia** — header `X-Caelis-License` validado en el servidor
- **Validación de payload** — solo datos astronómicos estructurados, sin inyección de texto libre
- **Rate limiting** — control de uso por usuario/licencia
- **Firma de requests** — verificación de integridad entre cliente y Worker

Caelis Engine asume un entorno cliente hostil y mantiene toda la lógica sensible en el servidor.

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

## Novedades v2.2

| Mejora | Descripción |
|---|---|
| **⚙ Panel Settings** | Selector de idioma, voz IA, dropdown compacto en toolbar |
| **i18n ES/EN** | Sistema completo con `_t()`, `_applyLang()`, `data-i18n` en DOM |
| **Worker IA hardcodeado** | Sin configuración manual — URL y seguridad gestionadas internamente |
| **Eclipse → saltar al momento** | Click en cualquier eclipse → el instrumento salta a ese instante exacto |
| **Scroll en tabla de eclipses** | Headers fijos, scroll vertical, rango hasta ±10 años |
| **Botón IA en Panchanga** | Lectura hermética disponible directamente desde el panel védico |
| **Fix tablas de aspectos** | Natales y tránsito renderizaban sin `<table>` — corregido |
| **Eclipse en modo Astrolabio** | Corona, rayos, anillo de Baily y oscurecimiento en ambos modos |

---

## Mejoras matemáticas anteriores — v2.1

| Mejora | Ganancia |
|---|---|
| **Nutación IAU 2000B** (77 series, Mathews 2002) | Precisión ΔΨ: 10 mas → 1 mas (10×) |
| **Oblicuidad IAU 2006** (Capitaine et al.) | ε₀ precisa a 0.002" en J2000 |
| **Tabla ΔT 500–2150 d.C.** (Morrison & Stephenson 2004) | Rango extendido desde 1620 |
| **Ayanamsa 2° orden** (integral de precesión Lieske 1977) | Hasta 3' de mejora en 1600 d.C. |
| **Nodos lunares 15 términos** (Meeus Cap.47 completo) | Error: ~1.24° → ~0.25° (5×) |

---

## Modelo Freemium

**Pago único · Sin suscripción · Sin cuenta requerida**

| Tier | Precio | Incluye |
|---|---|---|
| **Personal** | $19 USD | Instrumento completo + lecturas IA + todos los calculadores |
| **Developer** | $49 USD | Personal + uso comercial + paquete npm |
| **Studio** | $199 USD | Developer + white-label + soporte prioritario |

Incluye capa de interpretación IA segura (Atacir · Sinastría · Panchanga · Carta natal).

---

## Roadmap

- [x] VSOP87 + ELP/MPP02-LLR calibrado
- [x] Eclipses, Panchanga, Sinastría + overlay de casas
- [x] 145/145 tests vs JPL Horizons DE441 + Meeus AA + IERS
- [x] Nutación IAU 2000B — 10× mejora sobre IAU 1980
- [x] ΔT extendido a 500–2150 d.C.
- [x] Ayanamsa 2° orden — Panchanga histórico mejorado
- [x] Nodos lunares 15 términos — 5× mejora
- [x] **Interpretación IA hermética — disponible (Premium, worker seguro)**
- [x] **i18n ES/EN · Panel Settings**
- [x] **Eclipse → saltar al instante exacto**
- [ ] Demo mode (IA sin licencia, payload limitado)
- [ ] SSE streaming para respuestas IA
- [ ] Nutación IAU 2000A (1365 términos)
- [ ] Memoria de carta natal (perfil en localStorage)
- [ ] Deutsch / हिन्दी
- [ ] Google Play Store

---

## Licencia

**AGPL-3.0** · Open Source · Modificaciones deben publicarse.
**Licencia Comercial** disponible para uso propietario — ver tiers Premium.

Contacto: [hermeticalabs.dev@proton.me](mailto:hermeticalabs.dev@proton.me)

---

**Cristian Valeria Bravo** · [Hermetica Labs](https://github.com/HermeticaLabs) · © 2024–2026

*"Caelis Engine existe en el límite entre la precisión matemática y la observación simbólica — donde la estructura del tiempo se vuelve navegable."*

[ko-fi.com/hermeticalabs](https://ko-fi.com/hermeticalabs)
