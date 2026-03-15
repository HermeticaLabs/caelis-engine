# Atacir — Referencia de API

**Caelis Engine 1.5 · Hermetica Labs**  
© 2024–2026 Cristian Valeria Bravo / Hermetica Labs

Atacir es la capa analítica de Caelis Engine. Implementa el sistema de direcciones primarias por ascensión oblicua (método Al-Biruni / Ptolomeo), análisis de aspectos natales y de tránsito, ciclos planetarios, resonancias, simetrías y análisis lunar.

El nombre *Atacir* proviene de la tradición árabe medieval — designa el arco de dirección que mide el tiempo entre el momento natal y un evento astrológico.

**Depende de:** AstroCore.js, TimeEngine.js

---

## Instalación y uso

```javascript
const AstroCore  = require('./src/astro/AstroCore.js');
const TimeEngine = require('./src/TimeEngine.js');
Object.assign(global, AstroCore, TimeEngine);

const Atacir = require('./src/Atacir.js');
```

---

## Direcciones primarias

### `Atacir.calcAtacir(rx, tr, rxLat, rxLon, trLat, trLon, key)` → `Object`

Calcula las direcciones primarias por ascensión oblicua para los 9 cuerpos herméticos (Sol, Luna, Mercurio, Venus, Marte, Júpiter, Saturno, Nodo Norte, Nodo Sur).

El arco de dirección mide la diferencia de ascensión oblicua entre el promissor (cuerpo natal) y el significador (ASC o MC). La edad del evento es `arco / clave`.

```javascript
const jdRx = TimeEngine.dateToJD('1990-01-01', '12:00');
const jdTr = TimeEngine.dateToJD('2026-03-14', '12:00');
const rx   = TimeEngine.snapshotAt(jdRx, -33.45, -70.66);
const tr   = TimeEngine.snapshotAt(jdTr, -33.45, -70.66);

const resultado = Atacir.calcAtacir(rx, tr, -33.45, -70.66, -33.45, -70.66, 0.8219);
```

**Claves de dirección:**

| Clave | Sistema | Significado |
|---|---|---|
| `1.0` | Ptolomeo | 1° = 1 año |
| `0.8219` | Naibod | 0.8219° = 1 año (movimiento solar medio diario) |
| `0.9856` | Solar | 0.9856° = 1 año |

**Retorna:**

```javascript
{
  direcciones: [
    {
      promissor: 'Sol',
      arco_asc:  12.5,   // grados hacia el ASC
      edad_asc:  15.2,   // años hasta el evento (arco/clave)
      arco_mc:   -8.3,
      edad_mc:   -10.1
    },
    // ... un objeto por cada cuerpo hermético
  ],
  ageNow: 36.19  // edad actual del nativo en años
}
```

---

## Aspectos

### `Atacir.calcAspectosNatales(snap)` → `Array`

Calcula todos los aspectos mayores entre los cuerpos de un snapshot.

**Aspectos:** Conjunción (0°), Oposición (180°), Trígono (120°), Cuadratura (90°), Sextil (60°).

**Orbes:** 8° para aspectos mayores, +2° adicionales si participan luminarias (Sol o Luna).

```javascript
const aspectos = Atacir.calcAspectosNatales(snapNatal);

aspectos[0]
// {
//   nmA: 'Sol',   glA: '☉',
//   nmB: 'Marte', glB: '♂',
//   asp: 'Conjunción', sim: '☌',
//   angulo: 0, dif: 1.82, orb: '1.82',
//   exactitud: 0.77   // 1.0=exacto, 0=límite del orbe
// }
```

Resultado ordenado por exactitud descendente.

---

### `Atacir.calcAspectosTransito(snapRx, snapTr)` → `Array`

Aspectos de tránsito: cada planeta del tránsito contra cada planeta natal.

```javascript
const aspTr = Atacir.calcAspectosTransito(snapNatal, snapTransito);

aspTr[0]
// {
//   nmTr: 'Saturno', glTr: '♄',   // planeta en tránsito
//   nmRx: 'Sol',     glRx: '☉',   // planeta natal
//   asp: 'Cuadratura', sim: '□',
//   orb: '2.14', exactitud: 0.69
// }
```

---

## Simetrías

### `Atacir.calcSimetrias(snap)` → `{ antiscia, contrantiscia, ejeasc, ejemc }`

Calcula las simetrías entre los cuerpos herméticos.

- **Antiscia:** reflexión sobre el eje Cáncer–Capricornio (solsticios)
- **Contrantiscia:** reflexión sobre el eje Aries–Libra (equinoccios)
- **Eje ASC:** simetría respecto al Ascendente
- **Eje MC:** simetría respecto al Medio Cielo

```javascript
const sim = Atacir.calcSimetrias(snapNatal);
sim.antiscia[0]
// { nmA: 'Sol', nmB: 'Venus', dif: 2.3, orbe: 3 }
```

---

## Ciclos planetarios

### `Atacir.calcCiclos(snapRx, snapTr)` → `{ ciclos, ageNow }`

Calcula en qué fase de su ciclo se encuentra cada planeta respecto a su posición natal: cuántos retornos completos ha dado y cuándo será el próximo.

```javascript
const ciclos = Atacir.calcCiclos(snapNatal, snapTransito);

ciclos.ageNow      // → 36.19 años
ciclos.ciclos[0]
// {
//   nombre: 'Sol',
//   lon_natal: 65.6,
//   lon_transito: 353.3,
//   desplazamiento: 287.7,
//   retornos: 36,
//   proximoRetorno_jd: ...
// }
```

---

## Resonancias

### `Atacir.calcResonancias(snapRx, snapTr)` → `{ resonancias }`

Detecta resonancias entre pares de planetas basadas en sus períodos sinódicos. Una resonancia ocurre cuando la relación entre los períodos de dos cuerpos se aproxima a una fracción simple (1:2, 2:3, 3:5, etc.).

```javascript
const reson = Atacir.calcResonancias(snapNatal, snapTransito);

reson.resonancias[0]
// {
//   nmA: 'Venus', nmB: 'Marte',
//   Psyn: 583.9,       // período sinódico en días
//   ratio: '8:13',     // resonancia aproximada
//   proximidad: 0.94   // cercanía a la resonancia exacta (0–1)
// }
```

---

## Análisis lunar

### `Atacir.calcLunaAtacir(snapRx, snapTr)` → `Object`

Análisis completo del ciclo lunar entre el momento natal y el tránsito.

```javascript
const luna = Atacir.calcLunaAtacir(snapNatal, snapTransito);

luna.elongNatal    // elongación eclíptica natal Sol–Luna en grados
luna.nLunaciones   // lunaciones completas desde el nacimiento
luna.fases         // próximas fases lunares desde el tránsito
luna.apsis         // próximos apsis lunares

luna.fases[0]
// { jde, nombre: 'Luna nueva', fecha_utc: '2026-03-29' }
```

---

## Integración UI

Atacir expone también los elementos del panel para uso interno del monolito:

```javascript
Atacir.HTML   // markup del panel de resultados
Atacir.CSS    // estilos del panel
Atacir.mount  // función — monta el panel en el DOM
```

> En uso modular externo se trabaja directamente con las funciones de cálculo.

---

## Ejemplo completo

```javascript
const jdRx = TimeEngine.dateToJD('1990-01-01', '12:00');
const jdTr = TimeEngine.dateToJD('2026-03-14', '12:00');
const rx   = TimeEngine.snapshotAt(jdRx, -33.45, -70.66);
const tr   = TimeEngine.snapshotAt(jdTr, -33.45, -70.66);

// Aspectos natales
const aspNatales = Atacir.calcAspectosNatales(rx);
aspNatales.forEach(a =>
  console.log(`${a.glA} ${a.nmA} ${a.sim} ${a.glB} ${a.nmB} — orbe ${a.orb}°`)
);

// Direcciones primarias (clave Naibod)
const atc = Atacir.calcAtacir(rx, tr, -33.45, -70.66, -33.45, -70.66, 0.8219);
console.log(`Edad actual: ${atc.ageNow.toFixed(2)} años`);
atc.direcciones.forEach(d =>
  console.log(`${d.promissor} → ASC en ${d.edad_asc.toFixed(1)} años`)
);

// Resonancias
const reson = Atacir.calcResonancias(rx, tr);
console.log(`${reson.resonancias.length} pares con resonancia detectada`);
```

---

## Tests

```bash
node tests/atacir.test.js
```

**Resultado esperado:** todos los tests en verde.

---

## Fundamento histórico

El método de direcciones primarias por ascensión oblicua fue sistematizado por Ptolomeo en el *Tetrabiblos* y refinado por Al-Biruni en el *Kitāb al-Tafhīm* (1029 d.C.). El nombre *Atacir* viene del árabe *al-tasyīr* — «el que hace avanzar».

La implementación en Caelis Engine sigue el método ptolemaico estándar: el promissor es el planeta natal, el significador es el ASC o MC, y el arco mide la distancia en ascensión oblicua entre ambos.

---

*Caelis Engine 1.5 · Hermetica Labs · Cristian Valeria Bravo*  
*github.com/HermeticaLabs/caelis-engine*
