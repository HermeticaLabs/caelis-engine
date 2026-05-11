# ══════════════════════════════════════════════════════════════════
# sync_caelis_v3.ps1 — Caelis Engine 3.0
# Repo local: C:\Users\matpe\OneDrive\Escritorio\caelis-engine
# Repo remoto: https://github.com/HermeticaLabs/caelis-engine
#
# Ejecutar en PowerShell — UN PASO A LA VEZ
# Confirmar git status antes de cada git add / commit / push
# ══════════════════════════════════════════════════════════════════

# ── PASO 1 — Posicionarse en el repo ─────────────────────────────
cd "C:\Users\matpe\OneDrive\Escritorio\caelis-engine"
Write-Host "Directorio actual:" (Get-Location)

# ── PASO 2 — Verificar remote y branch ───────────────────────────
git remote -v
git branch
git log --oneline -3

# ── PASO 3 — Pull para estar al día ──────────────────────────────
git checkout main
git pull origin main

# ── PASO 4 — Ver estado limpio antes de empezar ──────────────────
git status

# ══ LIMPIEZA — eliminar archivos que ya no aplican ═══════════════

# ── PASO 5 — Eliminar duplicado index (= caelis_engine_3_0.html) ─
git rm index --ignore-unmatch
git rm index.html --ignore-unmatch

# ── PASO 6 — Eliminar README_npm ─────────────────────────────────
git rm README_npm --ignore-unmatch
git rm README_npm.md --ignore-unmatch

# ── PASO 7 — Eliminar scripts de sync anteriores (reemplazados) ──
git rm sync_caelis.ps1 --ignore-unmatch
git rm sync_caelis_v22.ps1 --ignore-unmatch

# ── PASO 8 — Eliminar test_precision.js legacy de raíz ───────────
# (el nuevo va en tests/ — si ya no está en raíz, --ignore-unmatch lo maneja)
git rm test_precision.js --ignore-unmatch

# ── PASO 9 — Mover archivos legacy a /OLD/ si no están ya ────────
# suite_v2_final.js, validation.html, validation_v2_results, audit_prod
# CaelisEngine_Validation_Report, ValidatonReport_v21
# → ya los moviste a /OLD/ manualmente, solo asegurarse de que git los rastrea ahí

# Verificar que OLD/ tiene contenido rastreado:
git status OLD/

# ── PASO 10 — Renombrar READMEs correctamente ────────────────────
# README    → README.md    (inglés, el que generamos)
# README_es → README_es.md (español)
# Si ya tienen extensión .md, saltar este paso

# Si son archivos sin extensión:
if (Test-Path "README") {
    git rm README --ignore-unmatch
}
if (Test-Path "README_es") {
    git rm README_es --ignore-unmatch
}

# ── PASO 11 — Copiar archivos nuevos desde Downloads ─────────────
$dl = "C:\Users\matpe\Downloads"

# Monolito principal
Copy-Item "$dl\caelis_engine_3_0.html" -Destination "caelis_engine_3_0.html" -Force
Write-Host "✓ caelis_engine_3_0.html copiado"

# AstroCore actualizado (VSOP87B + moonPosition fix)
# Ya está en src\astro\AstroCore.js — solo si el de Downloads es más nuevo:
Copy-Item "$dl\AstroCore.js" -Destination "src\astro\AstroCore.js" -Force
Write-Host "✓ AstroCore.js actualizado"

# TimeEngine y Atacir — sin cambios en v3.0, pero copiar para tener versiones limpias
Copy-Item "$dl\TimeEngine.js" -Destination "src\TimeEngine.js" -Force
Copy-Item "$dl\Atacir.js"     -Destination "src\Atacir.js"     -Force
Write-Host "✓ TimeEngine.js y Atacir.js copiados"

# READMEs
Copy-Item "$dl\README.md"    -Destination "README.md"    -Force
Write-Host "✓ README.md (inglés) copiado"

# CHANGELOG
Copy-Item "$dl\CHANGELOG.md" -Destination "CHANGELOG.md" -Force
Write-Host "✓ CHANGELOG.md copiado"

# Tests actualizados
Copy-Item "$dl\test_precision.js"   -Destination "tests\test_precision.js"   -Force
Copy-Item "$dl\astrocore.test.js"   -Destination "tests\astrocore.test.js"   -Force
Copy-Item "$dl\timeengine.test.js"  -Destination "tests\timeengine.test.js"  -Force
Copy-Item "$dl\atacir.test.js"      -Destination "tests\atacir.test.js"      -Force
Write-Host "✓ Tests actualizados"

# ── PASO 12 — Actualizar dist/ (ESM + TypeScript declarations) ──
Copy-Item "$dl\caelis-engine.esm.js" -Destination "dist\caelis-engine.esm.js" -Force
Copy-Item "$dl\index.d.ts"           -Destination "dist\index.d.ts"           -Force
Write-Host "✓ dist/ actualizado (v3.0.0)"

# ── Actualizar versión en package.json ───────────────────────────
$pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
$pkg.version = "3.0.0"
$pkg | ConvertTo-Json -Depth 10 | Out-File -Encoding UTF8 "package.json"
Write-Host "✓ package.json: version → 3.0.0"

# ── PASO 12b — Crear README_es.md si no existe ────────────────────
if (-not (Test-Path "README_es.md")) {
@"
# ⊛ Caelis Engine 3.0

**Motor astronómico contemplativo — Hermetica Labs**

Consulta [README.md](README.md) para documentación completa en inglés.

## Uso rápido

Abre \`caelis_engine_3_0.html\` directamente en el navegador.
No requiere instalación ni servidor.

## Algoritmos

| Cuerpo | Algoritmo | Precisión |
|--------|-----------|-----------|
| Mercurio | VSOP87B oficial (IMCCE, 122 términos) | ±3'' |
| Venus–Saturno | VSOP87 (Meeus App.II) | ±5–40'' |
| Luna | ELP/MPP02 (164L+105B+29R términos) | ±30'' |

## Licencia

CC BY-NC-ND 4.0 — Hermetica Labs
© 2024–2026 Cristian Valeria Bravo / Hermetica Labs
"@ | Out-File -Encoding UTF8 "README_es.md"
    Write-Host "✓ README_es.md creado"
}

# ── PASO 13 — Añadir subcarpetas de referencia si no existen ─────
New-Item -ItemType Directory -Force -Path "src\vsop87" | Out-Null
New-Item -ItemType Directory -Force -Path "src\elp"    | Out-Null

if (-not (Test-Path "src\vsop87\README.md")) {
@"
# VSOP87B — Coeficientes fuente

Serie VSOP87B (Bretagnon & Francou 1988, IMCCE).
AstroCore.js v3.0 implementa 122 términos para Mercurio (±3'' longitud).
Referencia: https://ftp.imcce.fr/pub/ephem/planets/vsop87/
"@ | Out-File -Encoding UTF8 "src\vsop87\README.md"
}

if (-not (Test-Path "src\elp\README.md")) {
@"
# ELP/MPP02 — Tablas lunares

Serie ELP/MPP02 (Chapront-Touze & Chapront 2002).
AstroCore.js v3.0: 164L + 105B + 29R términos.
Precisión: ±30'' longitud, ±15'' latitud.
"@ | Out-File -Encoding UTF8 "src\elp\README.md"
}

Write-Host "✓ Subcarpetas de referencia creadas"

# ── PASO 14 — Verificar estado completo antes de commitear ───────
Write-Host "`n══ ESTADO ANTES DEL COMMIT ══"
git status
git diff --stat

# ── PASO 15 — Revisar con calma ──────────────────────────────────
Write-Host "`nREVISAR: ¿todo se ve correcto arriba?"
Write-Host "Archivos eliminados correctos, archivos nuevos correctos."
Write-Host "Si algo no se ve bien, DETENER aquí con Ctrl+C"
Write-Host "Presiona Enter para continuar con git add..."
Read-Host

# ── PASO 16 — Staging ────────────────────────────────────────────
git add -A

# ── PASO 17 — Confirmación final ─────────────────────────────────
git status
Write-Host "`n¿Confirmar commit? (Enter = sí, Ctrl+C = cancelar)"
Read-Host

# ── PASO 18 — Commit ─────────────────────────────────────────────
git commit -m "feat: Caelis Engine 3.0 — VSOP87B, Armilar Mode, suite de tests v3.0

Motor:
- caelis_engine_3_0.html: monolito ~540KB, sin dependencias externas
- AstroCore.js v3.0: vsop87Mercurio VSOP87B oficial IMCCE (122 terms, +-3'')
- AstroCore.js v3.0: moonPosition RA normalizado a [0, 2pi]
- TimeEngine.js / Atacir.js: sin cambios funcionales

Tests:
- tests/test_precision.js: 45/45 PASS (suite independiente, sin deps)
- tests/astrocore.test.js: VSOP87B + RA normalizacion añadidos
- tests/timeengine.test.js: deltaT 2026 corregido, snapshot 2026 añadido
- tests/atacir.test.js: NodoNorte.ra >= 0 verificado

Limpieza:
- Elimina: index (duplicado), README_npm, sync_caelis.ps1, sync_caelis_v22.ps1
- Archivos legacy (suite_v2, validation, audit) conservados en OLD/
- README.md (EN) + README_es.md (ES) como documentacion oficial
- src/vsop87/ + src/elp/ con README de referencia"

# ── PASO 19 — Push ────────────────────────────────────────────────
git push origin main

# ── PASO 20 — Tag v3.0.0 ─────────────────────────────────────────
git tag -a v3.0.0 -m "Caelis Engine 3.0 — VSOP87B Mercurio, Armilar Mode 3D, Rise/Set Meeus Cap.15"
git push origin v3.0.0

# ── PASO 21 — Verificar en GitHub ────────────────────────────────
Start-Process "https://github.com/HermeticaLabs/caelis-engine"

Write-Host "`n✅ Sincronización completada — Caelis Engine v3.0.0"

# ══════════════════════════════════════════════════════════════════
# NOTAS:
# • Si OneDrive muestra conflictos de sync, pausar OneDrive antes
#   de hacer push: bandeja sistema → OneDrive → Pausar sincronización
# • Si aparece error de index.lock:
#   Remove-Item .git\index.lock -Force
# • El archivo 'index' sin extensión: si git rm no lo encuentra,
#   borrarlo manualmente desde el explorador y luego git add -A
# • manifest y sw.js (PWA): se conservan tal cual — no tocar
# • docs/ y legal/ se conservan tal cual — no tocar
# ══════════════════════════════════════════════════════════════════
