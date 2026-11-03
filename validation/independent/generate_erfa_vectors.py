#!/usr/bin/env python3
"""
Generate validation/independent/erfa_golden_vectors.json with the official ERFA/SOFA
implementation (pyerfa).  Caelis Engine v4.0.13.

Usage:   pip install pyerfa
         python validation/independent/generate_erfa_vectors.py > validation/independent/erfa_golden_vectors.json

The vectors are the independent evidence for nutation (IAU 2000B/2000A), mean obliquity
(IAU 2006) and Greenwich apparent sidereal time (IAU 2006/2000A).  The engine never reads
this script; validation/run.js reads the JSON.

For every epoch the TT-UT1 difference (dt_s) is the Espenak & Meeus (NASA TP-2006-214141)
polynomial value, evaluated here with an independent Python implementation, so the GAST
vectors exercise a realistic separation of UT1 and TT (up to about 17,000 s at -500).
"""
import json, math
import erfa

AS = 180.0 / math.pi * 3600.0
jd_of = lambda y: 2451545.0 + (y - 2000.0) * 365.25


def em_dt(y):
    """Espenak & Meeus (2006) delta-T polynomials, NASA eclipse.gsfc.nasa.gov/SEcat5/deltatpoly.html."""
    if y < -500:
        u = (y - 1820) / 100
        return -20 + 32 * u ** 2
    if y < 500:
        u = y / 100
        return (10583.6 - 1014.41 * u + 33.78311 * u ** 2 - 5.952053 * u ** 3
                - 0.1798452 * u ** 4 + 0.022174192 * u ** 5 + 0.0090316521 * u ** 6)
    if y < 1600:
        u = (y - 1000) / 100
        return (1574.2 - 556.01 * u + 71.23472 * u ** 2 + 0.319781 * u ** 3
                - 0.8503463 * u ** 4 - 0.005050998 * u ** 5 + 0.0083572073 * u ** 6)
    if y < 1700:
        t = y - 1600
        return 120 - 0.9808 * t - 0.01532 * t ** 2 + t ** 3 / 7129
    if y < 1800:
        t = y - 1700
        return 8.83 + 0.1603 * t - 0.0059285 * t ** 2 + 0.00013336 * t ** 3 - t ** 4 / 1174000
    if y < 1860:
        t = y - 1800
        return (13.72 - 0.332447 * t + 0.0068612 * t ** 2 + 0.0041116 * t ** 3 - 0.00037436 * t ** 4
                + 0.0000121272 * t ** 5 - 0.0000001699 * t ** 6 + 0.000000000875 * t ** 7)
    if y < 1900:
        t = y - 1860
        return 7.62 + 0.5737 * t - 0.251754 * t ** 2 + 0.01680668 * t ** 3 - 0.0004473624 * t ** 4 + t ** 5 / 233174
    if y < 1920:
        t = y - 1900
        return -2.79 + 1.494119 * t - 0.0598939 * t ** 2 + 0.0061966 * t ** 3 - 0.000197 * t ** 4
    if y < 1941:
        t = y - 1920
        return 21.20 + 0.84493 * t - 0.076100 * t ** 2 + 0.0020936 * t ** 3
    if y < 1961:
        t = y - 1950
        return 29.07 + 0.407 * t - t ** 2 / 233 + t ** 3 / 2547
    if y < 1986:
        t = y - 1975
        return 45.45 + 1.067 * t - t ** 2 / 260 - t ** 3 / 718
    if y < 2005:
        t = y - 2000
        return (63.86 + 0.3345 * t - 0.060374 * t ** 2 + 0.0017275 * t ** 3 + 0.000651814 * t ** 4
                + 0.00002373599 * t ** 5)
    if y < 2050:
        t = y - 2000
        return 62.92 + 0.32217 * t + 0.005589 * t ** 2
    if y < 2150:
        return -20 + 32 * ((y - 1820) / 100) ** 2 - 0.5628 * (2150 - y)
    u = (y - 1820) / 100
    return -20 + 32 * u ** 2


ancient = [-500.0, 0.0, 500.0, 1000.0, 1300.0, 1500.0]
ys = ancient + [1700.37 + 15 * k for k in range(41)]              # 1700.37 ... 2300.37
jds = [jd_of(y) for y in ys] + [2451545.0, 2446895.5, 2453736.5]
labels = ['y%.2f' % y for y in ys] + ['J2000.0', 'Meeus Ch.22 1987-04-10 0h TT', 'SOFA t_nut00b 2006-01-01 0h TT']
years = ys + [2000.0, 1987.27, 2006.0]

epochs = []
for lab, jd, y in zip(labels, jds, years):
    b = erfa.nut00b(jd, 0.0)
    a = erfa.nut00a(jd, 0.0)
    dt = round(em_dt(y), 3)
    ut1 = jd - dt / 86400.0
    epochs.append({
        'label': lab, 'jd_tt': round(jd, 6), 'dt_s': dt, 'jd_ut1': ut1,
        'nut00b_dpsi_arcsec': b[0] * AS, 'nut00b_deps_arcsec': b[1] * AS,
        'nut00a_dpsi_arcsec': a[0] * AS, 'nut00a_deps_arcsec': a[1] * AS,
        'obl06_deg': math.degrees(erfa.obl06(jd, 0.0)),
        'gst06a_deg': math.degrees(erfa.gst06a(ut1, 0.0, jd, 0.0)) % 360.0,
    })

doc = {
    'description': 'Golden vectors computed with the official ERFA/SOFA implementation (pyerfa). '
                   'Do not edit by hand: regenerate with generate_erfa_vectors.py.',
    'generator': 'validation/independent/generate_erfa_vectors.py',
    'pyerfa_version': erfa.__version__,
    'erfa_library_version': '2.0.1',
    'units': {
        'jd_tt': 'Julian Date, TT scale',
        'jd_ut1': 'Julian Date, UT1 scale (jd_tt - dt_s/86400)',
        'dt_s': 'TT - UT1 in seconds (Espenak & Meeus polynomial, independent Python implementation)',
        'nut*_arcsec': 'arcseconds',
        'obl06_deg': 'mean obliquity IAU 2006, degrees',
        'gst06a_deg': 'Greenwich apparent sidereal time IAU 2006/2000A, degrees [0,360)',
    },
    'sofa_t_nut00b': {
        'jd_tt': 2453736.5, 'dpsi_rad': -9.632552291148362783e-6, 'deps_rad': 4.063197106621159367e-5,
        'source': 'ERFA/SOFA t_erfa_c.c, t_nut00b (date 2400000.5 + 53736.0)',
    },
    'epochs': epochs,
}
print(json.dumps(doc, indent=1))
