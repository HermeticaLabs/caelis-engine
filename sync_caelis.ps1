# ═══════════════════════════════════════════════════════════════════
# sync_caelis.ps1 — Sincronización y commit Caelis Engine v1.5
# Hermetica Labs © 2024-2026 Cristian Valeria Bravo
# Uso: ejecutar desde PowerShell en la raíz del repo
# ═══════════════════════════════════════════════════════════════════

$RepoPath = "C:\Users\matpe\OneDrive\Escritorio\caelis-engine"
$ErrorActionPreference = "Stop"

Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor DarkYellow
Write-Host " CAELIS ENGINE — Sincronización de Repositorio" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor DarkYellow

# ── 1. Verificar que estamos en el repo correcto ─────────────────
Set-Location $RepoPath
$remote = git remote get-url origin 2>&1
Write-Host "📁 Repo:   $RepoPath"
Write-Host "🌐 Remote: $remote"

$branch = git rev-parse --abbrev-ref HEAD
Write-Host "🌿 Rama:   $branch`n"

if ($branch -ne "main") {
    Write-Host "⚠ No estás en 'main'. Cambiando..." -ForegroundColor Red
    git checkout main
}

# ── 2. Verificar archivos en la carpeta local ────────────────────
Write-Host "── Archivos esperados ──" -ForegroundColor Cyan

$files = @{
    "caelis_engine_1_5.html" = "Motor principal (~256KB)"
    "manifest.json"          = "PWA Manifest"
    "sw.js"                  = "Service Worker"
    "README.md"              = "Documentación EN"
    "README.es.md"           = "Documentación ES"
    ".github\FUNDING.yml"    = "Ko-fi funding"
}

$allOk = $true
foreach ($file in $files.Keys) {
    $path = Join-Path $RepoPath $file
    if (Test-Path $path) {
        $size = (Get-Item $path).Length
        Write-Host "  ✓ $file ($([math]::Round($size/1024))KB) — $($files[$file])" -ForegroundColor Green
    } else {
        Write-Host "  ✗ FALTA: $file — $($files[$file])" -ForegroundColor Red
        $allOk = $false
    }
}

# Verificar carpeta assets/icons
$icon192 = Join-Path $RepoPath "assets\icons\icon-192.png"
$icon512 = Join-Path $RepoPath "assets\icons\icon-512.png"
if (Test-Path $icon192) {
    Write-Host "  ✓ assets/icons/icon-192.png" -ForegroundColor Green
} else {
    Write-Host "  ⚠ assets/icons/icon-192.png — FALTA (necesario para PWA)" -ForegroundColor Yellow
}
if (Test-Path $icon512) {
    Write-Host "  ✓ assets/icons/icon-512.png" -ForegroundColor Green
} else {
    Write-Host "  ⚠ assets/icons/icon-512.png — FALTA (necesario para PWA)" -ForegroundColor Yellow
}

# ── 3. Estado git actual ─────────────────────────────────────────
Write-Host "`n── Estado Git ──" -ForegroundColor Cyan
git status --short

$changes = git status --short | Measure-Object -Line
Write-Host "`n  Archivos modificados: $($changes.Lines)"

# ── 4. Verificar tamaño del HTML (sanity check) ──────────────────
$htmlPath = Join-Path $RepoPath "caelis_engine_1_5.html"
if (Test-Path $htmlPath) {
    $htmlSize = (Get-Item $htmlPath).Length
    $htmlKB   = [math]::Round($htmlSize / 1024)
    if ($htmlKB -lt 200) {
        Write-Host "`n⚠ ALERTA: HTML muy pequeño ($htmlKB KB) — posible archivo incorrecto" -ForegroundColor Red
        Write-Host "  El archivo correcto debe ser ~256KB. Abortando commit." -ForegroundColor Red
        exit 1
    }
    Write-Host "`n✓ Tamaño HTML: $htmlKB KB — OK" -ForegroundColor Green
}

# ── 5. Mostrar último commit ──────────────────────────────────────
Write-Host "`n── Último commit ──" -ForegroundColor Cyan
git log --oneline -5

# ── 6. Confirmar y hacer commit ──────────────────────────────────
Write-Host "`n" -NoNewline
$confirm = Read-Host "¿Hacer commit y push? (s/n)"

if ($confirm -eq "s" -or $confirm -eq "S") {

    # Agregar solo los archivos esperados del proyecto
    git add caelis_engine_1_5.html
    git add manifest.json
    git add sw.js
    git add README.md
    git add README.es.md

    # Agregar .github/FUNDING.yml si existe
    if (Test-Path ".github\FUNDING.yml") { git add .github/FUNDING.yml }

    # Agregar assets si existen
    if (Test-Path "assets") { git add assets/ }

    # Agregar src/ si existe
    if (Test-Path "src") { git add src/ }

    # Mostrar qué se va a commitear
    Write-Host "`n── Staged para commit ──" -ForegroundColor Cyan
    git diff --cached --name-status

    # Mensaje de commit
    $msg = Read-Host "`nMensaje de commit (Enter para usar el default)"
    if ([string]::IsNullOrWhiteSpace($msg)) {
        $msg = "fix: Atacir showAspTab + Oculus controls + Luna hemisferio sur + PWA"
    }

    git commit -m $msg

    Write-Host "`n── Push a origin/main ──" -ForegroundColor Cyan
    git push origin main

    # Verificar resultado
    $exitCode = $LASTEXITCODE
    if ($exitCode -eq 0) {
        Write-Host "`n✓ Push exitoso" -ForegroundColor Green
        Write-Host "  Demo: https://hermeticalabs.github.io/caelis-engine/caelis_engine_1_5.html" -ForegroundColor DarkYellow
        Write-Host "  Repo: https://github.com/HermeticaLabs/caelis-engine`n" -ForegroundColor DarkYellow
    } else {
        Write-Host "`n✗ Error en push (código $exitCode)" -ForegroundColor Red
    }

    # ── 7. Verificar último commit subido ────────────────────────
    Write-Host "── Verificación post-push ──" -ForegroundColor Cyan
    git log --oneline -3
    git show --stat HEAD

} else {
    Write-Host "`n  Commit cancelado." -ForegroundColor Yellow
}

Write-Host "`n═══════════════════════════════════════════════════`n" -ForegroundColor DarkYellow
