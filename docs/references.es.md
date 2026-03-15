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

### Posición lunar — ELP2000

**Fuente:** M. Chapront-Touzé & J. Chapront — *«ELP 2000-85: a semi-analytical lunar ephemeris adequate for historical times»*, Astronomy & Astrophysics 190, 342–352 (1988).

**Implementación:** Meeus Cap.47. El Ejemplo 47.a de Meeus (JDE 2448724.5) es el caso de prueba canónico para implementaciones ELP2000.

- 60 términos en longitud eclíptica
- 60 términos en latitud eclíptica
- 30 términos en distancia geocéntrica
- Correcciones periódicas A1, A2, A3
- Factor de corrección E por achatamiento terrestre

**Precisión verificada:**

| Cantidad | Calculado | Meeus | Error |
|---|---|---|---|
| λ Longitud | 133.1782° | 133.1627° | 0.016° |
| β Latitud | −3.2286° | −3.2291° | 0.001° |
| Δ Distancia | 368,436 km | 368,409.7 km | 27 km |

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

Todos los valores verificados contra Meeus *Astronomical Algorithms* 2ª ed. y JPL Horizons System (NASA/JPL).

| Componente | Error máximo verificado | Fuente |
|---|---|---|
| Nutación ΔΨ | < 0.004 arcsec | Meeus Cap.22 |
| Nutación Δε | < 0.002 arcsec | Meeus Cap.22 |
| Oblicuidad ε₀ en J2000 | < 0.002° | Meeus Cap.22 |
| Luna — longitud eclíptica | < 0.016° | Meeus Ej.47.a |
| Luna — latitud eclíptica | < 0.001° | Meeus Ej.47.a |
| Luna — distancia geocéntrica | < 27 km | Meeus Ej.47.a |
| Sol VSOP87 (Oct 1992) | < 0.001° | Meeus Cap.25 |
| Sol VSOP87 (Abr 1992) | < 0.001° | Meeus Cap.25 |
| Venus VSOP87 | < 0.003° | JPL Horizons |
| Marte VSOP87 | < 0.001° | JPL Horizons |
| Júpiter VSOP87 | < 0.002° | JPL Horizons |
| Saturno VSOP87 | < 0.003° | JPL Horizons |
| Fases lunares (JDE) | < 0.17 días | Meeus Cap.49 |
| ASC Placidus | < 0.009° | Carta de referencia |
| Nodos lunares (simetría) | 0.000° | Teoría |
| ΔT en J2000.0 | < 0.1 s | IERS |

**Suite de validación:** `validation.html` — **30/30 tests PASS**

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
