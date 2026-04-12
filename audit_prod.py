#!/usr/bin/env python3
"""
audit_prod.py — Caelis Engine v2.2 Production Audit
Verifica 51 condiciones antes de publicar el monolito PROD.
Uso: python audit_prod.py index.html
"""
import sys, re

def audit(path):
    try:
        with open(path, encoding='utf-8') as f:
            html = f.read()
    except FileNotFoundError:
        print(f"❌ Archivo no encontrado: {path}")
        sys.exit(1)

    checks = [
        # ── Versión y metadata ──────────────────────────────────────
        ("v2.2 en título",               'Caelis Engine 2.2 · Hermetica Labs' in html),
        ("meta version 2.2.0",           'content="2.2.0"' in html),
        ("AstroSync version 2.2.0",      'version: "2.2.0"' in html),
        ("Cabecera versión 2.2",         'C A E L I S   E N G I N E   2.2' in html),
        ("Fecha >= 2026",                '2026' in html),
        ("Sin '— DEV' en título",        'Caelis Engine 2.2 — DEV' not in html),

        # ── Switches DEV→PROD ───────────────────────────────────────
        ("_isPremium = false PROD",      'let _isPremium = false;' in html),
        ("Sin _isPremium = true",        'let _isPremium = true;' not in html),
        ("Gates activos PROD",           'if(!_isPremium)' in html),
        ("Sin gate DEV (false &&)",      'if(false && !_isPremium)' not in html),
        ("Sin bypass _clInit DEV",       'return; // DEV' not in html),

        # ── Motor matemático ────────────────────────────────────────
        ("VSOP87 Sol",                   'function sunLonEcl' in html),
        ("VSOP87 planetas",              'function planetLonEcl' in html),
        ("ELP/MPP02 Luna longitud",      'function moonLonEcl' in html),
        ("ELP/MPP02 distancia",          'function lunarDistELP' in html),
        ("IAU 2000B nutación",           'function nutation' in html),
        ("Oblicuidad IAU 2006",          'function meanObliquity' in html),
        ("DeltaT MS2004",                'function deltaT' in html),
        ("Lahiri ayanamsa",              'function _lahiriAyanamsa' in html or '_lahiriAyanamsa' in html),
        ("Nodos lunares",                'function lunarNodes' in html),
        ("Casas Placidus",               'function getHouseCusps' in html),
        ("Fases lunares JDE",            'function lunarPhaseJDE' in html),
        ("AstroSync API",                'window.AstroSync' in html),

        # ── Sprint 1 ────────────────────────────────────────────────
        ("Persistencia localStorage",    '_PREFS_KEY' in html and '_prefsLoad' in html),
        ("Settings capas toggles",       'stg-tog-anillo' in html and '_stgToggleCapa' in html),
        ("Luna oscura eclipse",          'ECLIPSE SOLAR: Luna completamente oscura' in html),
        ("Oculus 963x barrera",          'OCULUS_SPEED_MAX = 963' in html),
        ("Oculus paso 10",               'OCULUS_SPEED_STEP = 10' in html),
        ("Voz IA limpia markdown",       'function _iaCleanForSpeech' in html),
        ("Barra audio 5 botones",        'iaBtnPlay' in html and 'iaBtnShare' in html),

        # ── Sprint 2 ────────────────────────────────────────────────
        ("Resplandor perimetral",        'function drawPerimeterGlow' in html),
        ("Colores por aspecto",          '_GLOW_COLORS' in html),
        ("Tránsitos natales",            'function _calcNatalTransits' in html),
        ("Halo púrpura natal",           '180,120,255' in html),
        ("Eclipse dorado solar",         '"255,200,50"' in html),
        ("Eclipse plateado lunar",       '"180,200,255"' in html),
        ("Panel astrolabio aspectos",    'function drawAstrolabeAspectPanel' in html),
        ("Snap natal en activar",        'window._caelisNatalSnap = getSnapshot()' in html),

        # ── Sprint 3 ────────────────────────────────────────────────
        ("Sistema créditos localStorage",'_CREDITS_KEY' in html),
        ("4 tiers definidos",            'free:' in html and 'personal:' in html and 'studio:' in html),
        ("Renovación medianoche UTC",    'function _creditsMidnightUTC' in html),
        ("Rollover acumulable",          'function _creditsRenew' in html and 'rolloverCap' in html),
        ("Widget iaFreeHint",            'id="iaFreeHint"' in html),
        ("CSS credits-ok/low/empty",     'credits-ok' in html and 'credits-empty' in html),
        ("Demo mode en payload",         'credits_tier' in html and 'credits_token' in html),
        ("Créditos en _iaCallWorker",    '_creditsCanRead()' in html and '_creditsConsume()' in html),
        ("Detector Capacitor",           'window.Capacitor && window.Capacitor.isNative' in html),
        ("CSS Capacitor oculta botones", 'body.capacitor #btnAtacir' in html),

        # ── PWA / infraestructura ───────────────────────────────────
        ("Worker IA hardcodeado",        'caelis-ia.hermeticalabs.workers.dev' in html),
        ("i18n ES/EN activo",            'const _i18n' in html and '"es"' in html and '"en"' in html),
        ("Sin link Ko-fi en hint",       'ko-fi.com' not in html),
    ]

    passed = 0
    failed = 0
    for name, ok in checks:
        status = "PASS" if ok else "FAIL"
        if ok:
            passed += 1
        else:
            failed += 1
            print(f"  [FAIL] {name}")

    print()
    # Solo mostrar PASS al final
    print("="*55)
    print(f"  Caelis Engine v2.2 — Auditoría de producción")
    print(f"  {passed}/{len(checks)} checks")
    if failed == 0:
        print("  ✅ Listo para producción")
    else:
        print(f"  ❌ {failed} checks fallidos — revisar antes de publicar")
    print("="*55)
    return failed == 0

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "index.html"
    ok = audit(path)
    sys.exit(0 if ok else 1)
