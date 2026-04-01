#!/usr/bin/env python3
"""
audit_prod.py — Caelis Engine
Auditoría de producción: verifica que el monolito tenga todos los
features del DEV antes de hacer push al repo.

Uso:
    python audit_prod.py caelis_engine_2_1.html

Salida:
    PASS/FAIL por check + resumen final
"""
import sys, re

def audit(path):
    with open(path, encoding='utf-8') as f:
        c = f.read()

    checks = [
        # ── MOTOR MATEMÁTICO ────────────────────────────────────────
        ("VSOP87 Venus",             "vsop87Venus" in c),
        ("VSOP87 Tierra",            "vsop87Tierra" in c),
        ("VSOP87 Marte",             "vsop87Marte" in c),
        ("VSOP87 Jupiter",           "vsop87Jupiter" in c),
        ("VSOP87 Saturno",           "vsop87Saturno" in c),
        ("ELP tabla L (164 terms)",  "_elp_lT" in c),
        ("ELP tabla B (105 terms)",  "_elp_bT" in c),
        ("ELP tabla R (29 terms)",   "_elp_rT" in c),
        ("IAU 2000B array (77)",     "_IAU2000B" in c),
        ("Oblicuidad IAU 2006",      "84381.406" in c),
        ("DeltaT tabla MS2004",      "deltaTTable" in c),
        ("Lahiri ayanamsa 2°orden",  "_lahiriAyanamsa" in c),
        ("Nodos lunares 15 terms",   "dOm" in c and "-1.4979" in c),
        ("Placidus Newton-Raphson",  "placidusIterateCusp" in c),
        ("Mercurio Meeus Cap.31",    "vsop87Mercurio" in c),
        ("moonPosition ELP",         "function moonPosition" in c),
        ("nutation IAU 2000B",       "function nutation" in c),
        ("getSnapshot completo",     "function getSnapshot" in c),
        # ── FEATURES CORE ───────────────────────────────────────────
        ("Eclipse detección activa", "_eclipseActivoAhora" in c),
        ("Corona eclipse (Baily)",   "Baily" in c),
        ("Eclipse en Astrolabio",    "_eclAstro" in c),
        ("Fix luna hemisferio sur",  "xScaleL" in c),
        ("Calculadora eclipses",     "calcEclipsesCore" in c),
        ("Rango eclipses ±10 años",  'value="10"' in c or "± 10" in c),
        ("Tabla eclipses <table>",   'return `<table>' in c),
        ("Atacir core",              "calcAtacirCore" in c),
        ("Sinastría core",           "calcSinastriaCore" in c),
        ("Biwheel SVG",              "_cartaRenderBiwheel" in c),
        ("Panchanga core",           "calcPanchangaCore" in c),
        ("Botón IA Panchanga",       "leerPanchanga(window._lastPanchanga)" in c),
        ("Tabla aspectos <table>",   'style="width:100%;border-collapse' in c),
        ("Astrolabio estereográfico","drawAstrolabio" in c),
        ("Oculus/Transmutare",       "transformareAstralis" in c),
        # ── IA & SEGURIDAD ──────────────────────────────────────────
        ("Worker URL hardcodeado",   "_IA_ENDPOINT" in c),
        ("No input Worker URL",      'localStorage.getItem("_caelis_ia_worker")' not in c),
        ("leerAtacir IA",            "async function leerAtacir" in c),
        ("leerSinastria IA",         "async function leerSinastria" in c),
        ("leerPanchanga IA",         "async function leerPanchanga" in c),
        ("SpeechSynthesis voz",      "SpeechSynthesisUtterance" in c),
        ("Voz dinámica _t()",        '_t("ia.voice.lang")' in c),
        # ── i18n & SETTINGS ─────────────────────────────────────────
        ("i18n objeto _i18n",        "const _i18n" in c),
        ("_t() función",             "function _t(key)" in c),
        ("_applyLang() función",     "function _applyLang" in c),
        ("_setLang() función",       "function _setLang" in c),
        ("Settings dropdown CSS",    "#settingsDropdown" in c),
        ("Settings botón toolbar",   'id="btnSettings"' in c),
        ("data-i18n en toolbar",     'data-i18n="btn.reset"' in c),
        ("_applyLang al arranque",   "_applyLang();" in c),
        # ── PRODUCCIÓN (diferencias DEV→PROD) ───────────────────────
        ("_isPremium = false PROD",  "_isPremium = false" in c),
        ("Gates activos PROD",       "if(!_isPremium)" in c),
        ("Sin DEV hardcode",         "let _isPremium = true" not in c),
    ]

    passed = 0
    failed = []
    for name, ok in checks:
        status = "PASS" if ok else "FAIL"
        if ok:
            passed += 1
        else:
            failed.append(name)
        print(f"  [{status}] {name}")

    total = len(checks)
    print()
    print(f"{'='*55}")
    print(f"  Resultado: {passed}/{total} checks")
    if failed:
        print(f"  Fallidos ({len(failed)}):")
        for f in failed:
            print(f"    ✗ {f}")
    else:
        print("  ✅ Listo para producción")
    print(f"{'='*55}")
    return passed == total

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python audit_prod.py <archivo.html>")
        sys.exit(1)
    ok = audit(sys.argv[1])
    sys.exit(0 if ok else 1)
