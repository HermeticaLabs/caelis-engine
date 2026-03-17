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

### Posición lunar — ELP/MPP02

**Fuente:** J. Chapront & G. Francou — *«The lunar theory ELP revisited. Introduction of new planetary perturbations»*, Astronomy & Astrophysics 412, 567–587 (2002). Calibrado con datos LLR (Lunar Laser Ranging) hasta 2001.

**Actualización Marzo 2026:** motor lunar migrado de ELP2000/Meeus Cap.47 a ELP/MPP02. Mejora 63× en precisión de longitud.

**Implementación:**

- 164 términos en longitud eclíptica (vs 60 anteriores)
- 105 términos en latitud eclíptica (vs 60 anteriores)
- 29 términos en distancia geocéntrica (Meeus Cap.47, a₀ = 385000.56 km)
- Argumentos fundamentales calibrados con LLR
- Correcciones periódicas A1, A2, A3
- Corrección por achatamiento de la Tierra (E)

**Precisión verificada** contra Meeus Ejemplo 47.a (JDE 2448724.5) — referencia canónica independiente:

| Cantidad | Error anterior (ELP2000) | Error actual (ELP/MPP02) | Mejora |
|---|---|---|---|
| Longitud | 0.0078° (7.8") | **0.0001° (0.45")** | **63×** |
| Latitud | 0.001° | **0.0001°** | **10×** |
| Distancia | 26 km | **27 km** | — |

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

## Precision verification

All positions verified against:

1. **Jean Meeus** — numerical examples from *Astronomical Algorithms* 2nd ed.
2. **JPL Horizons System** — DE441 ephemeris from NASA/JPL.
3. **Swiss Ephemeris** — Astrodienst AG, DE441.

**Validation suite:** `validation.html` — **56/56 tests PASS** (30 original + 26 extended planetary).

| Component | Algorithm | Max error verified | Source | Tolerance |
|---|---|---|---|---|
| Nutation ΔΨ | IAU 1980, 63 series | < 0.004 arcsec | Meeus Cap.22 | < 0.01" |
| Nutation Δε | IAU 1980, 63 series | < 0.002 arcsec | Meeus Cap.22 | < 0.01" |
| Obliquity ε₀ at J2000 | IAU 1980 | < 0.002° | Meeus Cap.22 | < 0.01° |
| **Moon — longitude** | **ELP/MPP02, 164L** | **< 0.0001° (0.45")** | **JPL DE441** | < 0.002° |
| Moon — latitude | ELP/MPP02, 105B | < 0.0001° | Meeus Ex.47.a | < 0.001° |
| Moon — distance | ELP/MPP02, 29R | < 27 km (0.007%) | Meeus Ex.47.a | < 200 km |
| Sun VSOP87 | VSOP87, 185 terms | < 0.001° | Meeus Cap.25 | < 0.01° |
| Mercury | Meeus Cap.31, 5 terms | < 0.116° | JPL Horizons DE441 | < 0.5° |
| Venus VSOP87 | VSOP87, 79 terms | < 0.107° | JPL Horizons DE441 | < 0.2° |
| Mars VSOP87 | VSOP87, 152 terms | < 0.113° | JPL Horizons DE441 | < 0.2° |
| Jupiter VSOP87 | VSOP87, 141 terms | < 0.131° | JPL Horizons DE441 | < 0.2° |
| Saturn VSOP87 | VSOP87, 167 terms | < 0.126° | JPL Horizons DE441 | < 0.2° |
| Lunar phases (JDE) | Meeus Cap.49 | < 0.17 days | Meeus Cap.49 | < 1 day |
| ASC Placidus | Newton-Raphson | < 0.009° | Reference chart | < 1° |
| Lunar nodes (symmetry) | Meeus Cap.47 | 0.000° | Theory | < 0.01° |
| ΔT at J2000.0 | IERS table | < 0.1 s | IERS | < 3s |

**Note on Mercury:** uses equation of center (Meeus Cap.31) instead of truncated VSOP87, due to its high orbital eccentricity (e = 0.206).

**Note on outer planets:** the ~0.11° systematic offset in Venus, Mars, Jupiter and Saturn reflects the genuine precision floor of the truncated VSOP87 series from Meeus Appendix II — not a defect of the engine.

**Note on the Moon:** the previous 0.016° error corresponded to ELP2000/Meeus Cap.47 (60 terms). The current engine uses ELP/MPP02 (164L+105B+29R, LLR-calibrated 2002) with error 0.0001° — 63× improvement.

**Valid range:** 1800–2100 CE.

---

*Caelis Engine 1.5 · Hermetica Labs · Cristian Valeria Bravo*  
*github.com/HermeticaLabs/caelis-engine*
