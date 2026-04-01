# Caelis Engine v2.2

**Mathematical astronomical engine + symbolic interpretation system.**

Caelis Engine computes real planetary positions with professional precision (VSOP87, ELP/MPP02-LLR, IAU 2000B) and transforms them into a navigable symbolic framework — extended with secure AI-assisted interpretation.

**[▶ Live Demo](https://hermeticalabs.github.io/caelis-engine/)**  ·  **[npm](https://npmjs.com/package/caelis-engine)**  ·  **[Ko-fi](https://ko-fi.com/hermeticalabs)**

---

## What Caelis Engine is

- Not just a sky viewer
- Not just an astrology tool
- Not just a library

Caelis Engine is a **symbolic astronomical instrument** — combining real celestial mechanics with structured interpretation, running entirely in the browser with no server dependencies for the mathematical core.

---

## What it does

| Feature | Description |
|---|---|
| **Real-time sky** | Stereographic polar projection, all bodies, constellations, Milky Way |
| **Astrolabe mode** | Classic stereographic astrolabe with rete and tympanum |
| **Atacir** | Directional arcs by oblique ascension (Al-Biruni / Ptolemy / Naibod) |
| **Synastry** | Cross-aspects, antiscia, symmetries, elemental distribution, biwheel SVG |
| **Eclipse calculator** | Solar + lunar, ±10 year range, geolocalised visibility |
| **Panchanga** | Vedic almanac: Tithi, Vara, Nakshatra, Yoga, Karana with Lahiri ayanamsa |
| **AI Hermetic Reading** | Structured interpretation of computed astronomical data (Premium) |
| **i18n** | English / Español (Deutsch, हिन्दी roadmap) |

---

## Mathematical Core

All algorithms validated against independent reference data. **145/145 tests PASS.**

| Algorithm | Source | Precision |
|---|---|---|
| **VSOP87** | Bretagnon & Francou (1987) | < 1″ (2000 AD ± 500y) |
| **ELP/MPP02-LLR** | Chapront & Francou (2002) — 164L + 105B + 29R terms | < 10″ |
| **IAU 2000B Nutation** | Mathews et al. (2002) — 77 luni-solar series | < 1 mas |
| **Obliquity IAU 2006** | Capitaine et al. — degree-5 polynomial | < 0.01″ |
| **ΔT** | Morrison & Stephenson (2004) + Stephenson (2016) | 500–2150 AD |
| **Lahiri Ayanamsa** | IAU 1955, Lieske 1977 2nd-order integration | < 0.01° |
| **Lunar Nodes** | Meeus Ch.47 — 15-term series | < 0.25° |
| **Placidus Houses** | Newton-Raphson iteration | < 0.001° |
| **Mercury** | Meeus Ch.31 equation of centre | < 0.5° |

Guaranteed range: **500–2150 AD**

---

## AI Interpretation Layer

Caelis Engine integrates a secure AI interpretation system built **on top of** its deterministic astronomical core.

- **Structured input** — planets, aspects, houses, cycles, ayanamsa
- **No raw prompt exposure** — all prompts are server-side templates
- **Worker-based execution** — no API keys in the client
- **License-gated access** — Premium only
- **4 reading types** — current sky · natal chart · Atacir transits · synastry · Panchanga
- **Voice output** — SpeechSynthesis, language-aware (ES/EN)

The AI does not replace the astronomical model — it interprets the already-computed structure.

---

## Security Model

The AI layer runs through a protected Cloudflare Worker backend:

- **No API keys exposed to client** — hardcoded endpoint, key is a Worker secret
- **Origin validation** — requests from unauthorised domains are rejected (403)
- **License-based access control** — `X-Caelis-License` header validated server-side
- **Payload validation** — structured astronomical data only, no free-text injection
- **Rate limiting** — per user, configurable

Caelis Engine assumes a hostile client environment and keeps all sensitive logic server-side.

---

## Architecture

```
caelis-engine/        ← Public repo (this) — GitHub Pages
caelis-web/           ← PWA (private)
caelis-app/           ← Capacitor Android (private)
caelis-worker/        ← Cloudflare Worker AI backend (private)
```

**Stack:** Vanilla JS · Canvas 2D · SVG · Web Speech API · Cloudflare Workers · Anthropic Claude

---

## Premium

One-time payment · No subscription · No account required

| Tier | Price | Includes |
|---|---|---|
| **Personal** | $19 USD | Full instrument + AI readings + all calculators |
| **Developer** | $49 USD | Personal + commercial use + npm package |
| **Studio** | $199 USD | Developer + white-label + priority support |

Includes secure AI interpretation layer (Atacir · Synastry · Panchanga · Natal).

---

## Quick Start (npm)

```bash
npm install caelis-engine
```

```javascript
import { sunPosition, moonPosition, getSnapshot } from 'caelis-engine';

const snap = getSnapshot();  // full astronomical snapshot
console.log(snap.bodies.Sol.lon_ecl);  // ecliptic longitude
```

---

## Running Tests

```bash
node test_precision.js
# 145/145 PASS — VSOP87, ELP/MPP02, IAU 2000B, ΔT, Placidus, Panchanga
```

---

## Roadmap

- [ ] Demo mode (AI without license, limited payload)
- [ ] SSE streaming for AI responses
- [ ] IAU 2000A nutation (1365 terms, ~0.1 mas)
- [ ] Natal chart memory (localStorage profile)
- [ ] Conversational AI panel (message history)
- [ ] Deutsch / हिन्दी i18n
- [ ] Google Play Store (Capacitor)

---

## License

**AGPL-3.0** — open source, modifications must be published.  
**Commercial license** available for closed-source use (see Premium tiers above).

---

*"Caelis Engine exists at the boundary between mathematical precision and symbolic observation — where the structure of time becomes navigable."*

**Hermetica Labs** · [hermeticalabs.dev@proton.me](mailto:hermeticalabs.dev@proton.me)  
Author: Cristian Valeria Bravo
