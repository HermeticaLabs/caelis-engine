# Caelis Engine — Mathematical Documentation
## Version 4.0

```
Author:       Cristian Valeria Bravo
Organization: Hermetica Labs
Status:       Canonical — supersedes v3.0.1
Date:         2026-06
```

---

## Preface

This document describes the mathematical foundations of every computation
in Caelis Engine. It follows the canonical pipeline order defined in the
Technical Specification §3. Every formula is traceable to a primary source.
Every approximation declares its error bound.

**v4.0 change:** House systems are no longer part of the AstroCore pipeline.
They reside in the `atacir.houses` plugin. The pipeline below reflects
the pure astronomical computation.

**Variables:**

| Symbol | Meaning | Units |
|---|---|---|
| T | Julian centuries from J2000.0 = (JD_TT − 2451545.0) / 36525 | centuries |
| τ | Julian millennia = T / 10 | millennia |
| JD_UTC | Julian Date, Universal Time | days |
| JD_TT | Julian Date, Terrestrial Time | days |
| φ | Observer geodetic latitude | radians |
| λ_obs | Observer geodetic longitude | radians |
| ε | True obliquity of the ecliptic | radians |
| ΔΨ | Nutation in longitude | radians |
| Δε | Nutation in obliquity | radians |
| α | Right Ascension | radians |
| δ | Declination | radians |
| H | Hour Angle = LST − RA | radians |

---

# Part I — TimeEngine

---

## 1.1 Julian Date from Unix Epoch

```
JD_UTC = unix_sec / 86400 + 2440587.5
```

JD 2440587.5 = 1970-01-01 00:00:00 UTC (Unix epoch, IAU convention).  
Precision: IEEE 754 double · Resolution: ~1 millisecond at current epoch.

---

## 1.2 ΔT Correction

ΔT = TT − UTC in seconds. Accounts for Earth's irregular rotation.

```
JD_TT = JD_UTC + ΔT / 86400
```

**Level 1 — Tabular interpolation [500–2150 AD]**

Linear interpolation between empirical (year, ΔT) pairs from IERS Conventions 2003 §5.4:

```
ΔT = ΔT₀ + (year − y₀) / (y₁ − y₀) · (ΔT₁ − ΔT₀)
```

**Level 2 — Morrison-Stephenson parabola [outside table]**

```
u   = (year − 1820) / 100
ΔT  = −20 + 32u²           [seconds]
```

Source: Morrison & Stephenson (2004). Error outside table: up to ±20s.

---

## 1.3 Julian Centuries

```
T = (JD_TT − 2451545.0) / 36525
```

J2000.0 = 2000-01-01 12:00:00 TT = JD 2451545.0.

---

## 1.4 Greenwich Apparent Sidereal Time (GAST)

Four-step IAU 2006 procedure:

**Step 1 — Earth Rotation Angle (ERA)**
```
θ_ERA = 2π · (0.7790572732640 + 1.00273781191135448 · D_u)   [radians]
```
where D_u = JD_UTC − 2451545.0 (Julian days from J2000.0 UTC).

**Step 2 — Precession polynomial**
```
p_A = 0.014506 + 4612.15739966·T + 1.39667721·T² − 0.00009344·T³   [arcsec]
```

**Step 3 — Equation of equinoxes**
```
EE = ΔΨ · cos(ε_mean) + correction terms
```

**Step 4 — GAST**
```
GAST = θ_ERA + p_A/206265 + EE   [radians → degrees]
```

**Local Sidereal Time:**
```
LST = GAST + λ_observer   [degrees]
```

---

## 1.5 WGS-84 Geocentric Radius

Used for lunar topocentric parallax:

```
R_⊕(φ) = √[ (a²·cos(φ))² + (b²·sin(φ))² ] / √[ (a·cos(φ))² + (b·sin(φ))² ]
```

where a = 6378136.6 m (equatorial), b = 6356751.9 m (polar).

---

# Part II — AstroCore Pipeline

The canonical execution order. Any modification must preserve this sequence exactly.

```
JD_TT, T
  │
  ├─ Nutation [IAU 2000B]       → ΔΨ, Δε
  ├─ True Obliquity [IAU 2006]  → ε_true = ε_mean + Δε
  ├─ GAST → LST
  │
  ├─ For each planet (Mercury–Neptune):
  │    VSOP87B heliocentric
  │    → geocentric
  │    → light-time (1 iteration)
  │    → annual aberration
  │    → ΔΨ applied
  │    → ecliptic → equatorial (ε_true)
  │    → equatorial → horizontal (LST, φ)
  │    → atmospheric refraction
  │
  ├─ Moon (ELP/MPP02-LLR):
  │    164L + 105B + 60R terms
  │    → ΔΨ applied
  │    → ecliptic → equatorial
  │    → topocentric parallax (WGS-84)
  │    → horizontal + refraction
  │
  ├─ Lunar nodes Ω [Meeus Ch.47]
  │
  └─ quality_flags
```

---

## 2.1 Nutation — IAU 2000B

77 luni-solar terms. Returns ΔΨ (longitude) and Δε (obliquity) in radians.

**Fundamental arguments (Meeus Ch.22):**

| Argument | Formula |
|---|---|
| l (Moon mean anomaly) | 134.96298° + 477198.867398°·T |
| l′ (Sun mean anomaly) | 357.52772° + 35999.050340°·T |
| F (Moon argument of latitude) | 93.27191° + 483202.017538°·T |
| D (Moon mean elongation) | 297.85036° + 445267.111480°·T |
| Ω (Ascending node) | 125.04452° − 1934.136261°·T |

**Series summation:**
```
ΔΨ = Σᵢ (S_i + S'_i · T) · sin(Σ n_ij · f_j)   [0.0001 arcsec]
Δε = Σᵢ (C_i + C'_i · T) · cos(Σ n_ij · f_j)   [0.0001 arcsec]
```

Precision: < 1 mas vs. IAU 2000A (1365 terms). Source: Mathews, Herring & Buffett (2002).

Caching: nutation result cached; invalidated when |ΔT| > 1×10⁻⁹ centuries.

---

## 2.2 Mean Obliquity — IAU 2006

Fifth-degree polynomial (Capitaine et al. 2006):

```
ε_mean = 84381.406″
       − 46.836769″·T
       − 0.0001831″·T²
       + 0.00200340″·T³
       − 0.000000576″·T⁴
       − 0.0000000434″·T⁵
```

True obliquity:
```
ε_true = ε_mean + Δε
```

---

## 2.3 VSOP87B — Planetary Positions

Source: Bretagnon & Francou (1987), A&A 202.

Heliocentric spherical coordinates (L, B, R) via power series in τ = T/10:

```
X = Σₙ τⁿ · Σₖ Aₖ · cos(Bₖ + Cₖ·τ)
```

where X ∈ {L (longitude), B (latitude), R (radius vector)}.

**Geocentric transformation:**
```
x_geo = x_planet − x_earth
y_geo = y_planet − y_earth
z_geo = z_planet − z_earth

λ_geo = atan2(y_geo, x_geo)
β_geo = atan(z_geo / √(x²+y²))
Δ     = √(x²+y²+z²)    [AU]
```

**Light-time correction (1 iteration):**
```
τ_lt = Δ / C_LIGHT    where C_LIGHT = 173.1446326 AU/day
T_lt = T − τ_lt / 36525
```
Recompute planet position at T_lt, then recompute Δ.

**Annual aberration (Meeus Ch.23):**
```
Δλ = −κ · (cos(λ_⊙-λ) − e·cos(π-λ)) / cos(β)
Δβ = −κ · sin(β) · (sin(λ_⊙-λ) − e·sin(π-λ))
```
where κ = 9.9365×10⁻⁵ rad (constant of aberration),
λ_⊙ = Sun's geometric longitude, e = Earth's orbital eccentricity.

**Nutation applied to longitude:**
```
λ_apparent = λ_geo + ΔΨ
```

---

## 2.4 Ecliptic → Equatorial

Given (λ, β) and true obliquity ε:

```
α = atan2(sin(λ)·cos(ε) − tan(β)·sin(ε), cos(λ))
δ = arcsin(sin(β)·cos(ε) + cos(β)·sin(ε)·sin(λ))
```

---

## 2.5 Equatorial → Horizontal

Hour angle:
```
H = LST − α
```

Geometric altitude:
```
a = arcsin(sin(δ)·sin(φ) + cos(δ)·cos(φ)·cos(H))
```

Azimuth (N=0, clockwise):
```
A = atan2(−sin(H), tan(δ)·cos(φ) − sin(φ)·cos(H))
A = (A · 180/π + 360) mod 360   [degrees]
```

---

## 2.6 Atmospheric Refraction — Bennett (1982)

Applied only when a_geometric > −1°. Input and output in degrees.

```
R = 1.02 / tan((a + 10.3/(a + 5.11)) · π/180)   [arcminutes]
a_apparent = a + R/60   [degrees]
```

Standard ISA atmosphere (1013.25 hPa, 10°C). No pressure/temperature/elevation correction.  
Error near horizon: 1–5′. Error above 15°: ±0.1′.

`above_horizon` uses **geometric** altitude as criterion (declared in `meta.frame`).

---

## 2.7 Moon — ELP/MPP02-LLR

Source: Chapront & Francou (2002), A&A 412. LLR-calibrated.

**Terms used:** 164 longitude (L) + 105 latitude (B) + 60 distance (R).

**Fundamental arguments:**
```
W₁  = 218.3664477° + 481267.88123421°·T − 0.0015786°·T² + ...   [mean longitude]
D   = 297.8501954° + 445267.1114034°·T − ...                     [mean elongation]
M   = 357.5291092° + 35999.0502909°·T − ...                      [Sun mean anomaly]
M′  = 134.9634114° + 477198.8676313°·T + ...                     [Moon mean anomaly]
F   = 93.2720950°  + 483202.0175233°·T − ...                     [argument of latitude]
```

**Eccentricity factor:**
```
E = 1 − 0.002516·T − 0.0000074·T²
```

**Longitude summation:**
```
ΣL = Σᵢ Aᵢ · Eᵉⁱ · sin(nᵢ·D + mᵢ·M + pᵢ·M′ + qᵢ·F)   [0.000001°]
```

Additional terms (Meeus 47.6):
```
A₁ = 119.75° + 131.849°·T
A₂ = 53.09°  + 479264.290°·T
ΔΣL += 3958·sin(A₁) + 1962·sin(W₁−F) + 318·sin(A₂)
```

Geocentric ecliptic longitude:
```
λ_Moon = W₁ + ΣL/1 000 000°
```

**Topocentric parallax correction (Moon only):**
```
ΔRA  = −(R_⊕/Δ) · cos(φ) · sin(H) / cos(δ)
Δδ   = −(R_⊕/Δ) · (sin(φ)·cos(δ) − cos(φ)·sin(δ)·cos(H))
```

where R_⊕ = WGS-84 geocentric radius at observer latitude, Δ = lunar distance in AU.

Maximum topocentric shift: ~57′ at horizon. This is the **only body** with topocentric correction — planetary parallax is < 9″ (Mars at closest approach), within VSOP87B truncation error.

---

## 2.8 Lunar Nodes — Meeus Ch.47

Ascending node Ω:
```
Ω = 125.04452° − 1934.136261°·T + 0.0020708°·T² + T³/450000°
```

Descending node:
```
Ω_south = (Ω + 180°) mod 360°
```

Equatorial coordinates computed from ecliptic via standard transformation (§2.4).

---

## 2.9 Lunar Phase and Distance

**Phase angle (elongation):**
```
ψ = arccos(sin(δ_Sun)·sin(δ_Moon) + cos(δ_Sun)·cos(δ_Moon)·cos(α_Sun−α_Moon))
```

**Illuminated fraction:**
```
k = (1 + cos(ψ)) / 2
```

**Phase ratio (0=new, 0.5=full, 1=new):**
```
phase_ratio = ψ / π
```

**Lunar distance:** from ELP R-series summation, converted from km to AU via 1 AU = 149 597 870.7 km.

---

# Part III — Atacir Mathematics (plugin layer)

Atacir plugins receive the snapshot and compute derived quantities.
None of the following modifies any field from Part I or Part II.

---

## 3.1 Houses — Placidus (Newton-Raphson)

ASC from GAST and observer latitude:
```
α_ASC = atan2(−cos(LST), sin(ε)·tan(φ) + cos(ε)·sin(LST))
```

MC:
```
α_MC = atan2(sin(LST), cos(ε)·cos(LST))
```

Placidus cusp condition (Naibod method): each cusp angle θ satisfies the
semi-arc equation via Newton-Raphson iteration (converges in < 5 steps).

**Polar Safety Switch™:** when |tan(δ)·tan(φ)| > 1 (Placidus undefined near poles),
system falls back automatically: Placidus → Porphyry → Equal. Fallback
is declared in `atacir.houses.system` (e.g. `"porfirio (fallback)"`).

## 3.2 Primary Directions — Oblique Ascension

Oblique ascension of a body (ra, dec) at latitude φ:
```
OA = ra − arcsin(tan(dec)·tan(φ))
```

Arc of direction (difference in oblique ascension between promissor and significator):
```
arc = |OA_promissor − OA_significator|
```

Age of event (Naibod key, default):
```
age_years = arc / 0.9856°
```

Other keys: Ptolemy (1.0°/yr), Cardano, Kühr.

## 3.3 Aspects

Angular separation between two bodies A and B:
```
sep = |λ_A − λ_B|   mod 360°
sep = min(sep, 360° − sep)
```

For each aspect angle θ ∈ {0°, 60°, 90°, 120°, 180°}:
```
orb = |sep − θ|
```

Orb thresholds: Conjunction/Opposition 8°, Trine/Square 6°, Sextile 4°.
Luminaries (Sun, Moon) receive +2° bonus per classical tradition.

Exactitude (precision percentage):
```
exactitud = 1 − orb / max_orb
```

## 3.4 Antiscia and Contrantiscia

Antiscion axis: Cancer/Capricorn (0° Cancer = 90° ecliptic).

```
antiscion(λ) = 180° − λ   mod 360°
contrantiscion(λ) = 360° − λ   mod 360°
```

Two bodies are in antiscia when `|λ_A − antiscion(λ_B)| < orb`.

## 3.5 Panchanga — Lahiri Ayanamsa

Sidereal longitude from tropical:
```
λ_sidereal = λ_tropical − ayanamsa(T)
```

Lahiri ayanamsa (IAU 1955, Lieske 2nd-order precession):
```
ayanamsa = 23.85° + 50.2564″·(year − 1900) / 3600°   [approx]
```

**Five elements:**

| Element | Formula |
|---|---|
| Tithi | `floor(λ_Moon_sid / 12°)` — lunar day [1–30] |
| Vara | Weekday from JD |
| Nakshatra | `floor(λ_Moon_sid / 13.3333°)` — lunar mansion [1–27] |
| Yoga | `floor((λ_Sun_sid + λ_Moon_sid) / 13.3333°) mod 27` |
| Karana | Half-tithi [1–60 cyclically] |

## 3.6 Eclipse Prediction — Meeus Ch.54

New moon (phase=0) and full moon (phase=0.5) JDE from lunar cycle k:
```
JDE = 2451550.09766 + 29.530588861·k
    + 0.00015437·T² − 0.000000150·T³ + ...
```

Solar eclipse condition: `|sin(F)| < 0.36`  
Lunar eclipse condition: `|sin(F)| < 0.40`

where F = Moon's argument of latitude at new/full moon.

Magnitude estimated from Saros geometry. Visibility from observer computed
via `_eclVisibleAt(jde, lat, lon)` — pure function using `_lonAtJDE` and
`gast()` without touching global state.

## 3.7 Orbital Resonances

Best rational approximation p/q for period ratio of two planets:

```
ratio = period_A / period_B
p/q   = convergent of continued fraction of ratio, q ≤ 16
```

Quality:
```
quality = 1 − |ratio − p/q| / (1/q²)
```

---

# Part IV — Precision Budget

| Source | Max error | Affected |
|---|---|---|
| VSOP87B truncation (Uranus, Neptune) | < 1′ | outer planets |
| ELP/MPP02 truncation | < 10″ | Moon |
| IAU 2000B vs. 2000A nutation | < 1 mas | all (frame) |
| Refraction (ISA, no P/T/h) | 1–5′ near horizon | near-horizon bodies |
| Planetary parallax ignored | < 9″ (Mars max) | planets |
| Polar motion ignored | < 0.3″ | all |
| Diurnal aberration ignored | < 0.3″ | all |
| ΔT outside [500, 2150 AD] | variable | all |

**Design decision:** these limitations are accepted in exchange for full
portability — browser, Node.js, edge functions, React Native, offline.
The engine is not designed to replace JPL Horizons. It is designed to be
deterministic, auditable, and self-contained.

---

# References

| Source | Used for |
|---|---|
| Meeus, J. *Astronomical Algorithms* 2nd ed. (1998) | ΔT, GAST, nutation, nodes, apsides, eclipses, refraction |
| Bretagnon & Francou (1987) A&A 202 | VSOP87B planetary series |
| Chapront & Francou (2002) A&A 412 | ELP/MPP02-LLR lunar series |
| Capitaine et al. (2006) A&A | IAU 2006 obliquity |
| Mathews, Herring & Buffett (2002) | IAU 2000B nutation |
| Morrison & Stephenson (2004) | ΔT historical model |
| IERS Conventions (2003) §5.4 | ΔT table 500–2150 AD |
| Bennett (1982) *Journal of Navigation* | Atmospheric refraction |
| WGS-84 | Geocentric radius for lunar parallax |

---

*Caelis Engine v4.0 · Hermetica Labs · © 2024–2026 Cristian Valeria Bravo*
