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

**Implementación:** Series truncadas de Meeus, Apéndice II. Precisión < 1' de arco para planetas exteriores en el rango 1800–2100 d.C.

**Cuerpos:** Venus, Tierra (para Sol geocéntrico), Marte, Júpiter, Saturno.

**Mercurio:** Meeus Cap.31 — elementos orbitales medios + ecuación del centro (5 términos). El VSOP87 truncado de Meeus para Mercurio acumula errores mayores por la alta excentricidad orbital (e=0.206); la aproximación kepleriana es más estable en este caso.

---

### Posición lunar — ELP2000

**Fuente:** M. Chapront-Touzé & J. Chapront — *«ELP 2000-85: a semi-analytical lunar ephemeris adequate for historical times»*, Astronomy & Astrophysics 190, 342–352 (1988).

**Implementación:** Meeus Cap.47 (Ejemplo 47.a como caso de prueba canónico).

- 60 términos en longitud eclíptica
- 60 términos en latitud eclíptica
- 30 términos en distancia geocéntrica
- Correcciones periódicas A1, A2, A3
- Corrección por achatamiento de la Tierra (E)

**Precisión verificada** contra Meeus Ejemplo 47.a (JDE 2448724.5):
- Longitud: error 0.016° (< 1 arcminuto)
- Latitud: error 0.001°
- Distancia: error 27 km de 368,409 km (0.007%)

---

### Nutación — IAU 1980

**Fuente:** Seidelmann, P.K. (ed.) — *Explanatory Supplement to the Astronomical Almanac*, 1992. Series IAU 1980.

**Implementación:** Meeus Cap.22 — 63 series periódicas en longitud (ΔΨ) y oblicuidad (Δε).

**Precisión verificada:** ΔΨ < 0.004 arcsec, Δε < 0.002 arcsec.

---

### Oblicuidad de la eclíptica

**Fuente:** Meeus Cap.22, fórmula IAU 1980.

```
ε₀ = 23°26'21.448" − 46.8150"T − 0.00059"T² + 0.001813"T³
```

donde T son siglos julianos desde J2000.0.

La oblicuidad verdadera incluye la corrección de nutación: ε = ε₀ + Δε.

---

### Tiempo sidéreo — GAST

**Fuente:** IAU 2000A, Meeus Cap.12.

El tiempo sidéreo aparente de Greenwich incluye la ecuación de los equinoccios:

```
GAST = GMST + ΔΨ · cos ε
```

---

### Aberración anual

**Implementación:** diferencial numérico del vector velocidad heliocéntrico de la Tierra (Δτ = 0.001 siglos). Más robusta que la fórmula analítica clásica para cuerpos con latitud eclíptica no nula.

La constante de aberración utilizada es κ = 9.9365×10⁻⁵ radianes (20.4958").

---

### Corrección de tiempo-luz

Para cada planeta se aplica una corrección iterativa: la posición se calcula primero en T, se determina la distancia geocéntrica Δ, y se recalcula en T − Δ/c donde c = 173.1446326 UA/día.

---

### Paralaje lunar topocéntrico

La posición de la Luna se corrige de geocéntrica a topocéntrica en RA y Dec usando la latitud, longitud y radio geocéntrico del observador (WGS84).

**Fuente:** Meeus Cap.40.

---

### Casas — Placidus

**Fuente:** Meeus Cap.38. Método de trisección del semiarco diurno/nocturno.

Las cúspides II, III (semiarco diurno) y XI, XII (semiarco nocturno) se calculan por iteración Newton-Raphson sobre la condición de trisección.

**Fallback:** para latitudes > ~66° donde algunos cuerpos son circumpolares, Placidus no converge; el sistema cae silenciosamente a casas iguales.

---

### Fases y apsis lunares

**Fases:** Meeus Cap.49 — JDE de luna nueva, cuarto creciente, llena, cuarto menguante.  
Precisión verificada: error < 0.17 días.

**Apsis:** Meeus Cap.50 — JDE de perigeo y apogeo lunares.

---

### ΔT — diferencia TT − UTC

Tabla IERS interpolada linealmente (1620–2100). Extrapolación polinomial para fechas fuera del rango:

```
ΔT ≈ 102.3 + 123.5·t + 32.5·t²  (t en siglos desde J2000)
```

---

### Direcciones primarias — Atacir

**Fuente:** Ptolomeo — *Tetrabiblos*; Al-Biruni — *Kitāb al-Tafhīm* (1029 d.C.); Meeus Cap.38.

La ascensión oblicua de un punto P con RA α y declinación δ a latitud geográfica φ es:

```
OA(P) = α − arcsin(tan δ · tan φ)
```

El arco de dirección entre un promissor P y el ASC es:

```
Arco = OA(P) − OA(ASC)
```

La edad del evento es `Arco / Clave`, donde la clave es el factor de conversión grados→años.

---

## Verificación de precisión

Todas las posiciones están verificadas contra:

1. **Jean Meeus** — ejemplos numéricos de *Astronomical Algorithms* 2ª ed.
2. **JPL Horizons System** — efemérides de referencia del Jet Propulsion Laboratory de NASA.

**Suite de validación:** `validation.html` — 30/30 tests PASS.

| Componente | Error máximo verificado |
|---|---|
| Nutación ΔΨ | < 0.004 arcsec |
| Nutación Δε | < 0.002 arcsec |
| Oblicuidad ε₀ | < 0.002° |
| Luna — longitud | < 0.016° |
| Luna — latitud | < 0.001° |
| Luna — distancia | < 27 km |
| Sol VSOP87 | < 0.001° |
| Venus VSOP87 | < 0.003° |
| Marte VSOP87 | < 0.001° |
| Júpiter VSOP87 | < 0.002° |
| Saturno VSOP87 | < 0.003° |
| Fases lunares | < 0.17 días |
| ASC Placidus | < 0.009° |
| ΔT en J2000 | < 0.1 s |

**Rango de validez:** 1800–2100 d.C.

---

*Caelis Engine 1.5 · Hermetica Labs · Cristian Valeria Bravo*  
*github.com/HermeticaLabs/caelis-engine*
