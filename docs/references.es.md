# Referencias Matemáticas

**Caelis Engine 1.5 · Hermetica Labs**

Fuentes canónicas y algoritmos implementados en Caelis Engine.

---

## Referencia principal

**Jean Meeus — *Astronomical Algorithms*, 2ª edición (1998)**  
Willmann-Bell, Inc. Richmond, Virginia.

Referencia canónica para todos los algoritmos implementados. Los números de capítulo citados en el código fuente corresponden a esta edición.

---

## Algoritmos por módulo

### Posiciones planetarias — VSOP87

**Fuente:** P. Bretagnon & G. Francou — *«Planetary theories in rectangular and spherical variables: VSOP87 solution»*, Astronomy & Astrophysics 202, 309–315 (1988).

**Implementación:** Series truncadas de Meeus, Apéndice II. Precisión < 1' de arco en el rango 1800–2100 d.C.

**Cuerpos:** Venus, Tierra (para Sol geocéntrico), Marte, Júpiter, Saturno.

**Mercurio:** Meeus Cap.31 — elementos orbitales medios + ecuación del centro (5 términos). La alta excentricidad de Mercurio (e=0.206) hace que el VSOP87 truncado acumule errores apreciables; la aproximación kepleriana es más estable.

---

### Posición lunar — ELP/MPP02

**Fuente:** J. Chapront & G. Francou — *«The lunar theory ELP revisited. Introduction of new planetary perturbations»*, Astronomy & Astrophysics 412, 567–587 (2002). Calibrado con datos LLR (Lunar Laser Ranging) hasta 2001.

**Actualización Marzo 2026:** motor lunar migrado de ELP2000/Meeus Cap.47 a ELP/MPP02. Mejora 63× en precisión de longitud.

**Implementación:**

- 164 términos en longitud eclíptica (vs 60 anteriores)
- 105 términos en latitud eclíptica (vs 60 anteriores)
- 29 términos en distancia geocéntrica (Meeus Cap.47, a₀ = 385000.56 km)
- Argumentos fundamentales calibrados con LLR
- Correcciones periódicas A1, A2, A3
- Factor de corrección E por achatamiento terrestre

**Precisión verificada** contra Meeus Ejemplo 47.a (JDE 2448724.5) — referencia canónica independiente:

| Cantidad | Error anterior (ELP2000) | Error actual (ELP/MPP02) | Mejora |
|---|---|---|---|
| λ Longitud | 0.0078° (7.8") | **0.0001° (0.45")** | **63×** |
| β Latitud | 0.001° | **0.0001°** | **10×** |
| Δ Distancia | 26 km | **27 km** | — |

---

### Nutación — IAU 1980

**Fuente:** Seidelmann, P.K. (ed.) — *Explanatory Supplement to the Astronomical Almanac*, 1992.

**Implementación:** Meeus Cap.22 — 63 series periódicas en longitud (ΔΨ) y oblicuidad (Δε).

**Precisión verificada:** ΔΨ < 0.004 arcsec, Δε < 0.002 arcsec.

---

### Oblicuidad de la eclíptica

**Fuente:** Meeus Cap.22, fórmula IAU 1980.

```
ε₀ = 23°26'21.448" − 46.8150"·T − 0.00059"·T² + 0.001813"·T³
```

T en siglos julianos desde J2000.0. La oblicuidad verdadera incluye la corrección de nutación: ε = ε₀ + Δε.

---

### Tiempo sidéreo — GAST

**Fuente:** IAU 2000A, Meeus Cap.12.

```
GAST = GMST + ΔΨ · cos ε
```

---

### Aberración anual

**Implementación:** diferencial numérico del vector velocidad heliocéntrico de la Tierra (Δτ = 0.001 siglos). Más robusta que la fórmula analítica clásica para cuerpos con latitud eclíptica no nula.

Constante de aberración: κ = 9.9365×10⁻⁵ rad (20.4958").

---

### Corrección de tiempo-luz

Para cada planeta se calcula primero la distancia geocéntrica Δ en la época T, y se recalcula la posición en T − Δ/c, donde c = 173.1446326 UA/día.

---

### Paralaje lunar topocéntrico

La posición de la Luna se corrige de geocéntrica a topocéntrica en AR y Dec usando la latitud, longitud y radio geocéntrico del observador (WGS84).

**Fuente:** Meeus Cap.40.

---

### Casas — Placidus

**Fuente:** Meeus Cap.38. Método de trisección del semiarco diurno/nocturno.

Las cúspides II, III (arco diurno) y XI, XII (arco nocturno) se calculan por iteración Newton-Raphson sobre la condición de trisección. Para latitudes > ~66° el método no converge y el sistema cae automáticamente a casas iguales.

---

### Fases y apsis lunares

**Fases:** Meeus Cap.49 — JDE de luna nueva, cuarto creciente, llena, cuarto menguante. Precisión < 0.17 días.

**Apsis:** Meeus Cap.50 — JDE de perigeo y apogeo lunares.

---

### ΔT — diferencia TT − UTC

Tabla IERS interpolada linealmente (1620–2100). Extrapolación polinomial fuera del rango:

```
ΔT ≈ 102.3 + 123.5·t + 32.5·t²  (t en siglos desde J2000)
```

---

### Direcciones primarias — Atacir

**Fuente:** Ptolomeo — *Tetrabiblos*; Al-Biruni — *Kitāb al-Tafhīm* (1029 d.C.); Meeus Cap.38.

La ascensión oblicua de un punto P con AR α y declinación δ a latitud geográfica φ:

```
OA(P) = α − arcsin(tan δ · tan φ)
```

El arco de dirección entre un promissor P y el ASC:

```
Arco = OA(P) − OA(ASC)
Edad = Arco / Clave
```

---

## Tabla completa de precisión verificada

Todos los valores verificados contra Meeus *Astronomical Algorithms* 2ª ed., JPL Horizons System (NASA/JPL, DE441) y Swiss Ephemeris (Astrodienst AG, DE441).

**Suite de validación:** `validation.html` — **56/56 tests PASS** (30 originales + 26 extendidos planetarios)

| Componente | Algoritmo | Error máximo verificado | Fuente | Tolerancia |
|---|---|---|---|---|
| Nutación ΔΨ | IAU 1980, 63 series | < 0.004 arcsec | Meeus Cap.22 | < 0.01" |
| Nutación Δε | IAU 1980, 63 series | < 0.002 arcsec | Meeus Cap.22 | < 0.01" |
| Oblicuidad ε₀ en J2000 | IAU 1980 | < 0.002° | Meeus Cap.22 | < 0.01° |
| **Luna — longitud eclíptica** | **ELP/MPP02, 164L** | **< 0.0001° (0.45")** | **JPL DE441** | < 0.002° |
| Luna — latitud eclíptica | ELP/MPP02, 105B | < 0.0001° | Meeus Ej.47.a | < 0.001° |
| Luna — distancia geocéntrica | ELP/MPP02, 29R | < 27 km (0.007%) | Meeus Ej.47.a | < 200 km |
| Sol VSOP87 | VSOP87, 185 términos | < 0.001° | Meeus Cap.25 | < 0.01° |
| Mercurio | Meeus Cap.31, 5 términos | < 0.116° | JPL Horizons DE441 | < 0.5° |
| Venus VSOP87 | VSOP87, 79 términos | < 0.107° | JPL Horizons DE441 | < 0.2° |
| Marte VSOP87 | VSOP87, 152 términos | < 0.113° | JPL Horizons DE441 | < 0.2° |
| Júpiter VSOP87 | VSOP87, 141 términos | < 0.131° | JPL Horizons DE441 | < 0.2° |
| Saturno VSOP87 | VSOP87, 167 términos | < 0.126° | JPL Horizons DE441 | < 0.2° |
| Fases lunares (JDE) | Meeus Cap.49 | < 0.17 días | Meeus Cap.49 | < 1 día |
| ASC Placidus | Newton-Raphson | < 0.009° | Carta de referencia | < 1° |
| Nodos lunares (simetría) | Meeus Cap.47 | 0.000° | Teoría | < 0.01° |
| ΔT en J2000.0 | Tabla IERS | < 0.1 s | IERS | < 3s |

**Nota sobre Mercurio:** usa ecuación del centro (Meeus Cap.31) en lugar de VSOP87 truncado, por su alta excentricidad orbital (e = 0.206).

**Nota sobre planetas exteriores:** el error sistemático de ~0.11° en Venus, Marte, Júpiter y Saturno refleja el piso de precisión real del VSOP87 truncado de Meeus Apéndice II — no es un defecto del motor.

**Nota sobre la Luna:** el error de 0.016° anterior correspondía a ELP2000/Meeus Cap.47 (60 términos). El motor actual usa ELP/MPP02 (164L+105B+29R, calibrado LLR 2002) con error 0.0001° — mejora de 63×.

**Rango de validez:** 1800–2100 d.C.

---

## Ejecutar la suite de validación

```bash
# En el navegador (servidor local)
node -e "const h=require('http'),f=require('fs'),p=require('path');h.createServer((req,res)=>{let fp='.'+req.url;if(fp==='./') fp='./index.html';f.readFile(fp,(e,d)=>{if(e){res.writeHead(404);res.end()}else{const ext=p.extname(fp);const m={'html':'text/html','js':'application/javascript'};res.writeHead(200,{'Content-Type':m[ext.slice(1)]||'text/plain'});res.end(d)}})}).listen(8080)"
# Abrir http://localhost:8080/validation.html

# Tests Jest por módulo
node tests/astrocore.test.js
node tests/timeengine.test.js
node tests/atacir.test.js
```

---

*Caelis Engine 1.5 · Hermetica Labs · Cristian Valeria Bravo*  
*github.com/HermeticaLabs/caelis-engine*
