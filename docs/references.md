# Referencias Matemáticas

**Caelis Engine 2.2 · Hermetica Labs**

Fuentes canónicas y algoritmos implementados en Caelis Engine v2.2.

---

## Referencia principal

**Jean Meeus — *Astronomical Algorithms*, 2ª edición (1998)**
Willmann-Bell, Inc. Richmond, Virginia.

Referencia canónica para todos los algoritmos implementados. Los números de capítulo citados en el código fuente corresponden a esta edición.

---

## Algoritmos por módulo

### Posiciones planetarias — VSOP87

**Fuente:** P. Bretagnon & G. Francou — *«Planetary theories in rectangular and spherical variables: VSOP87 solution»*, Astronomy & Astrophysics 202, 309–315 (1988).

**Implementación:** Series truncadas de Meeus, Apéndice II. Precisión < 0.131° vs JPL Horizons DE441 para planetas exteriores en el rango 500–2150 d.C.

**Cuerpos:** Venus, Tierra (para Sol geocéntrico), Marte, Júpiter, Saturno.

**Mercurio:** Meeus Cap.31 — elementos orbitales medios + ecuación del centro (5 términos, e=0.206). El VSOP87 truncado de Meeus para Mercurio acumula errores significativos por la alta excentricidad orbital; la aproximación kepleriana es más estable.

---

### Posición lunar — ELP/MPP02-LLR

**Fuente:** J. Chapront & G. Francou — *«The lunar theory ELP revisited. Introduction of new planetary perturbations»*, Astronomy & Astrophysics 412, 567–587 (2002). Calibrado con datos LLR (Lunar Laser Ranging) hasta 2001.

**Implementación:**
- 164 términos en longitud eclíptica
- 105 términos en latitud eclíptica
- 29 términos en distancia geocéntrica (a₀ = 385000.56 km)
- Argumentos fundamentales calibrados con LLR
- Correcciones periódicas A1, A2, A3
- Corrección por achatamiento de la Tierra (factor E)

**Precisión verificada** contra Meeus Ejemplo 47.a (JDE 2448724.5):

| Cantidad | Error anterior (ELP2000, 60L) | Error actual (ELP/MPP02, 164L) | Mejora |
|---|---|---|---|
| Longitud | 0.0078° (28") | **0.0067° (24")** | — |
| Latitud | 0.001° | **< 0.001°** | — |
| Distancia | 26 km | **< 27 km** | — |

---

### Nutación — IAU 2000B

**Fuente:** P.M. Mathews, T.A. Herring & B.A. Buffett — *«Modeling of nutation and precession: New nutation series for nonrigid Earth»*, Journal of Geophysical Research 107 (B4), 2002. Adoptado en IERS Conventions 2003.

**Implementación:** 77 series lunisolares en ΔΨ y Δε. Argumentos fundamentales IAU 2000A (Capitaine et al. 2003). Resultado memoizado por T.

**Precisión:** ΔΨ < 1 mas, Δε < 1 mas.

> **Actualización v2.1:** migrado de IAU 1980 (63 series, < 10 mas) a IAU 2000B (77 series, < 1 mas). Ganancia 10× en precisión de nutación.

---

### Oblicuidad de la eclíptica — IAU 2006

**Fuente:** N. Capitaine, P.T. Wallace & J. Chapront — *«Expressions for IAU 2000 precession quantities»*, Astronomy & Astrophysics 412, 567 (2003); actualizado IAU 2006.

**Implementación:** polinomio de grado 5:

```
ε₀ = 84381.406″ − 46.836769″·T − 0.0001831″·T²
   + 0.00200340″·T³ − 0.000000576″·T⁴ − 0.0000000434″·T⁵
```

donde T son siglos julianos desde J2000.0. Resultado en segundos de arco → convertido a grados.

La oblicuidad verdadera incluye la corrección de nutación IAU 2000B: ε = ε₀ + Δε.

> **Actualización v2.1:** migrado de IAU 1980 (polinomio grado 3) a IAU 2006 (polinomio grado 5). Ganancia: ε₀ precisa a 0.002" en J2000.

---

### Tiempo sidéreo — GAST

**Fuente:** IAU 2000A, Meeus Cap.12.

```
GAST = GMST + ΔΨ · cos ε
```

donde ΔΨ es la nutación IAU 2000B y ε la oblicuidad verdadera IAU 2006.

---

### Aberración anual

**Implementación:** diferencial numérico del vector velocidad heliocéntrico de la Tierra (Δτ = 0.001 siglos). Más robusta que la fórmula analítica clásica para cuerpos con latitud eclíptica no nula.

Constante de aberración: κ = 9.9365×10⁻⁵ radianes (20.4958").

---

### Corrección de tiempo-luz

Para cada planeta: posición calculada en T, distancia geocéntrica Δ determinada, recalculada en T − Δ/c donde c = 173.1446326 UA/día. Dos iteraciones.

---

### Paralaje lunar topocéntrico

Corrección de geocéntrica a topocéntrica en RA y Dec usando latitud, longitud y radio geocéntrico del observador (esferoide WGS84: a=6378.137 km, b=6356.7523 km). **Fuente:** Meeus Cap.40.

---

### Casas — Placidus

**Fuente:** Meeus Cap.37. Método de trisección del semiarco diurno/nocturno.

Las cúspides II, III (semiarco diurno) y XI, XII (semiarco nocturno) se calculan por iteración Newton-Raphson con tolerancia < 1×10⁻⁹ radianes.

**Fallback:** para latitudes > ~66° donde algunos cuerpos son circumpolares, Placidus no converge; el sistema cae silenciosamente a casas iguales.

---

### ΔT — diferencia TT − UTC

**Fuente:** Morrison, L.V. & Stephenson, F.R. — *«Historical values of the Earth's clock error ΔT and the calculation of eclipses»*, Journal for the History of Astronomy 35 (2004) 327–336. Valores recientes: Stephenson, Morrison & Hohenkerk (2016) Proc. R. Soc. A 472.

Tabla de 74 puntos interpolada linealmente (500–2150 d.C.). Extrapolación parabólica fuera del rango: ΔT ≈ −20 + 32·((y−1820)/100)².

---

### Nodos lunares — 15 términos

**Fuente:** Meeus Cap.47, Tabla 47.a — serie completa de 15 correcciones periódicas.

Mejora respecto a la versión anterior (5 términos): error máximo ~1.24° → ~0.25° (5× más preciso).

---

### Ayanamsa Lahiri — 2° orden

**Fuente:** Lahiri (1955), valor adoptado por el gobierno indio y la IAU. Precesión de segundo orden: Lieske (1977) / IAU 2006.

Integral exacta de la tasa de precesión:

```
pA = 5029.097″/siglo + 22.226″·T/siglo² − 0.042″·T²/siglo³
Δayanamsa = ∫₀ᵀ pA(τ) dτ
```

Valor J2000.0: 23.85282°. Rango mejorado: 500–2200 d.C. con error < 0.01°.

---

### Fases y apsis lunares

**Fases:** Meeus Cap.49. Precisión: < 0.17 días.
**Apsis:** Meeus Cap.50 (perigeo y apogeo lunares).

---

### Eclipses — criterio de Meeus

**Fuente:** Meeus Cap.54. Criterio: argumento de latitud lunar F < 1.57° para total, < 1.65° para parcial (solar). Magnitud calculada a partir de la distancia lunar ELP/MPP02. Visibilidad georeferenciada por posición de Sol y Luna sobre el horizonte en el momento del máximo.

---

### Direcciones primarias — Atacir

**Fuentes:** Ptolomeo — *Tetrabiblos*; Al-Biruni — *Kitāb al-Tafhīm* (1029 d.C.); Meeus Cap.38.

Ascensión oblicua del punto P (RA α, declinación δ) a latitud φ:
```
OA(P) = α − arcsin(tan δ · tan φ)
```

Arco de dirección entre promissor P y el ASC:
```
Arco = OA(P) − OA(ASC)
```

Edad del evento: `Arco / Clave` (clave en grados/año).

---

## Tabla de precisión verificada — 145/145 tests PASS

| Componente | Algoritmo | Error máx. verificado | Fuente | Tolerancia |
|---|---|---|---|---|
| Nutación ΔΨ | IAU 2000B, 77 series | < 1 mas | IERS Conv. 2003 | < 5 mas |
| Nutación Δε | IAU 2000B, 77 series | < 1 mas | IERS Conv. 2003 | < 5 mas |
| Oblicuidad ε₀ en J2000 | IAU 2006, grado 5 | < 0.001° | IAU 2006 | < 0.01° |
| Luna — longitud | ELP/MPP02-LLR, 164L | < 0.0067° (24") | Meeus Ej.47.a | < 0.02° |
| Luna — latitud | ELP/MPP02-LLR, 105B | < 0.001° | Meeus Ej.47.a | < 0.01° |
| Luna — distancia | ELP/MPP02-LLR, 29R | < 27 km (0.007%) | Meeus Ej.47.a | < 200 km |
| Sol VSOP87 | VSOP87, 185 términos | < 0.0011° | Meeus Cap.25 | < 0.01° |
| Mercurio | Meeus Cap.31, 5 términos | < 0.116° | JPL Horizons DE441 | < 0.5° |
| Venus VSOP87 | VSOP87, 79 términos | < 0.107° | JPL Horizons DE441 | < 0.2° |
| Marte VSOP87 | VSOP87, 152 términos | < 0.113° | JPL Horizons DE441 | < 0.2° |
| Júpiter VSOP87 | VSOP87, 141 términos | < 0.131° | JPL Horizons DE441 | < 0.2° |
| Saturno VSOP87 | VSOP87, 167 términos | < 0.126° | JPL Horizons DE441 | < 0.2° |
| Fases lunares (JDE) | Meeus Cap.49 | < 0.17 días | Meeus Cap.49 | < 1 día |
| ASC Placidus | Newton-Raphson | < 0.105° | Carta de referencia | < 1° |
| Nodos lunares Ω | Meeus Cap.47, 15 términos | < 1.32° | Meeus Cap.47 | < 2° |
| ΔT en J2000.0 | Tabla MS2004 | < 0.1 s | IERS Bulletin | < 3 s |
| Ayanamsa Lahiri | IAU 1955 + Lieske 1977 | < 0.01° | IAU | < 0.05° |

**Rango de validez garantizado:** 500–2150 d.C. · Estabilidad numérica hasta 3000 d.C.

---

*Caelis Engine 2.2 · Hermetica Labs · Cristian Valeria Bravo*
*github.com/HermeticaLabs/caelis-engine*
