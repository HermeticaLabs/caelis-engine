# Atacir — API Reference

**Caelis Engine 2.2 · Hermetica Labs**
© 2024–2026 Cristian Valeria Bravo / Hermetica Labs

Atacir es la capa analítica de Caelis Engine. Implementa el sistema de direcciones primarias por ascensión oblicua (método Al-Biruni / Ptolomeo), análisis de aspectos natales y de tránsito, ciclos planetarios, resonancias, simetrías, análisis lunar, sinastría y lectura IA hermética.

El nombre *Atacir* proviene de la tradición árabe medieval — designa el arco de dirección que mide el tiempo entre el momento natal y un evento astrológico (*al-tasyīr* — «el que hace avanzar»).

**Depende de:** AstroCore (embebido en el monolito)

---

## Direcciones primarias

### `calcAtacirCore(rxDate, rxTime, rxLat, rxLon, trDate, trTime, trLat, trLon, key)` → `Object`

Núcleo puro de cálculo — sin DOM, usable en Node.js.

Calcula las direcciones primarias por ascensión oblicua, aspectos natales, aspectos de tránsito, ciclos, resonancias, simetrías y análisis lunar entre una carta natal (rx) y un momento de tránsito (tr).

```javascript
const result = calcAtacirCore(
  '1990-01-01', '12:00', -33.45, -70.66,   // natal
  '2026-03-14', '12:00', -33.45, -70.66,   // tránsito
  0.8219  // clave Naibod
);

result.rx          // snapshot natal
result.tr          // snapshot tránsito
result.aspNatales  // aspectos entre planetas natales
result.aspTransito // aspectos tránsito sobre natal
result.ageNow      // edad actual en años
result.rows        // arcos de dirección con edades
```

**Claves de dirección:**

| Clave | Sistema | Equivalencia |
|---|---|---|
| `1.0` | Ptolomeo | 1° = 1 año |
| `0.8219` | Naibod | 0.8219° = 1 año (≈ movimiento solar medio diario) |
| `0.9856` | Solar Arc | 0.9856° = 1 año |

---

## Aspectos

### `calcAspectosNatales(snap)` → `Array`

Aspectos mayores entre los cuerpos de un snapshot.

**Aspectos:** Conjunción (0°), Oposición (180°), Trígono (120°), Cuadratura (90°), Sextil (60°).
**Orbes:** 8° base, +2° si intervienen luminarias.

```javascript
const asp = calcAspectosNatales(snap);
asp[0]
// {
//   nmA: 'Sol', glA: '☉', nmB: 'Marte', glB: '♂',
//   asp: 'Conjunción', sim: '☌',
//   orb: '1.82', exactitud: 0.77
// }
```

---

### `calcAspectosTransito(snapRx, snapTr)` → `Array`

Aspectos de tránsito: planetas del tránsito contra planetas natales.

```javascript
const aspTr = calcAspectosTransito(snapNatal, snapTransito);
aspTr[0]
// {
//   nmTr: 'Saturno', glTr: '♄',
//   nmRx: 'Sol',     glRx: '☉',
//   asp: 'Cuadratura', sim: '□',
//   orb: '2.14', exactitud: 0.69
// }
```

---

## Sinastría

### `calcSinastriaCore(dateA, timeA, latA, lonA, dateB, timeB, latB, lonB)` → `Object`

Sinastría completa entre dos cartas natales. Núcleo puro — sin DOM.

```javascript
const sin = calcSinastriaCore(
  '1990-01-01', '12:00', -33.45, -70.66,
  '1995-07-22', '08:30', -33.45, -70.66
);

sin.rxA       // snapshot carta A
sin.rxB       // snapshot carta B
sin.aspectos  // aspectos cruzados con pesos simbólicos (_scoreAspecto)
sin.simAB     // simetrías cruzadas (antiscias, contrantiscias)
sin.fechaA    // string fecha A
sin.fechaB    // string fecha B
```

**Pesos simbólicos:** los aspectos entre luminarias (Sol-Luna, Sol-Sol, Luna-Luna) y planetas personales reciben mayor peso relativo según la tradición hermética (_pesoPar, _scoreAspecto).

---

## Simetrías

### `calcSimetrias(snap)` → `{ antiscia, contrantiscia, ejeasc, ejemc }`

- **Antiscia:** reflexión sobre el eje Cáncer–Capricornio (0°–180°)
- **Contrantiscia:** reflexión sobre el eje Aries–Libra (90°–270°)
- **Eje ASC / MC:** simetría respecto a los ángulos de la carta

```javascript
const sim = calcSimetrias(snap);
sim.antiscia[0]
// { nmA: 'Sol', nmB: 'Venus', dif: 2.3 }
```

---

## Ciclos y resonancias

### `calcCiclos(snapRx, snapTr)` → `Object`

Fase del ciclo sinódico de cada planeta respecto a su posición natal.

### `calcResonancias(snapRx, snapTr)` → `Object`

Detección de resonancias entre pares de planetas basada en períodos sinódicos y fracciones simples (1:2, 2:3, 3:5...).

---

## Análisis lunar

### `calcLunaAtacir(snapRx, snapTr)` → `Object`

Análisis completo del ciclo lunar: elongación natal, lunaciones completas, próximas fases y apsis.

---

## Lectura IA Hermética

Caelis Engine 2.2 incluye lecturas IA disponibles directamente desde los paneles de cálculo:

| Panel | Función | Descripción |
|---|---|---|
| Atacir | `leerAtacir()` | Interpreta tránsitos y direcciones calculadas |
| Sinastría | `leerSinastria()` | Interpreta el vínculo entre dos cartas |
| Panchanga | `leerPanchanga(data)` | Interpreta el almanaque védico del día |
| Panel IA | `generarLecturaIA()` | Lectura del cielo actual o carta natal |

La IA recibe el payload astronómico estructurado (snapshot, aspectos, casas) — no texto libre. El resultado se renderiza en párrafos HTML con animación escalonada y opción de voz (`SpeechSynthesisUtterance`).

**Seguridad:** las peticiones se envían al Worker de Cloudflare con header `X-Caelis-License`. El cliente nunca ve la clave de Anthropic.

---

## Carta SVG natal y biwheel

```javascript
_cartaRenderSVG(snap, titulo, size)   // carta natal SVG circular
_cartaRenderBiwheel(snapA, snapB, size) // biwheel sinastría SVG
```

Incluyen posición de planetas, cúspides de casas, aspectos, glyphs zodiacales y distribución elemental.

---

## Ejemplo completo

```javascript
// Direcciones primarias (Naibod) con lectura IA
const result = calcAtacirCore(
  '1990-01-01', '12:00', -33.45, -70.66,
  '2026-03-14', '12:00', -33.45, -70.66,
  0.8219
);

console.log(`Edad: ${result.ageNow.toFixed(2)} años`);
console.log(`Aspectos natales: ${result.aspNatales.length}`);
console.log(`Aspectos tránsito: ${result.aspTransito.length}`);

result.aspNatales.forEach(a =>
  console.log(`${a.glA} ${a.nmA} ${a.sim} ${a.glB} ${a.nmB} — orbe ${a.orb}°`)
);
```

---

## Tests

```bash
node suite_v2_final.js      # suite completa 145/145
node test_precision.js      # algoritmos base 29/29
```

---

## Fundamento histórico

El método de direcciones primarias por ascensión oblicua fue sistematizado por Ptolomeo en el *Tetrabiblos* y refinado por Al-Biruni en el *Kitāb al-Tafhīm* (1029 d.C.). La implementación en Caelis Engine sigue el método ptolemaico estándar: el promissor es el planeta natal, el significador es el ASC o MC, y el arco de dirección mide la distancia en ascensión oblicua entre ambos.

---

*Caelis Engine 2.2 · Hermetica Labs · Cristian Valeria Bravo*
*github.com/HermeticaLabs/caelis-engine*
