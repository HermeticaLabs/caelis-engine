# Caelis Engine

**Hermetica Labs** — Motor astronómico contemplativo

## Descripción

Caelis Engine es un instrumento de visualización astronómica y astrológica de precisión,
construido con JavaScript puro. Incluye renderizado 2D del cielo, modo astrolabio clásico,
motor 3D Oculus con Three.js, y el sistema de Atacir con direcciones primarias.

## Estructura del proyecto

```
caelis-engine/
├── caelis_engine_1_5.html   ← Instrumento completo (versión monolito estable)
├── src/
│   └── astro/
│       └── AstroCore.js     ← Motor astronómico modular (Fase 1)
├── tests/
│   └── astrocore.test.js    ← Tests de verificación
└── README.md
```

## Precisión astronómica

- **Planetas**: VSOP87 (error < 0.1°)
- **Luna**: ELP2000 Cap.47 Meeus (error < 0.004°)  
- **Mercurio**: Meeus Cap.31 elementos orbitales (error < 0.25°)
- **Casas**: Placidus con iteración de Newton-Raphson
- **Nutación**: IAU 1980, 63 términos

## Licencia

© Hermetica Labs. Todos los derechos reservados.
