# Contributing to Caelis Engine

Thank you for your interest in contributing to Caelis Engine.

This document defines the rules for contributions. Please read it before opening a pull request. The rules exist to protect the mathematical integrity of the engine — not to discourage contributions.

---

## Core principle

Caelis Engine is a **deterministic astronomical computation instrument**. Every number it produces must be traceable to a specific algorithm, source, and step in the documented pipeline. Contributions that compromise traceability, determinism, or precision are not accepted regardless of other merits.

---

## What we welcome

- **Precision improvements** — better series truncations, updated IERS data
- **New body support** — Pluto, asteroids, with declared precision bounds
- **New Atacir plugins** — under Plugin Contract R1-R5 (see below)
- **Bug fixes** — with regression test demonstrating the fix
- **Documentation improvements** — corrections, clarifications, examples
- **Validation suite expansion** — new reference epochs vs JPL Horizons
- **Build tooling** — packaging, bundlers, Node.js compatibility

---

## What requires prior discussion

Open an issue before submitting a PR for:

- Changes to the mathematical pipeline (SPEC §3)
- Changes to the output schema (SPEC §4)
- New fields in `meta`, `bodies`, or `luna`
- Changes to how `delta_t`, `nutation`, or `obliquity` are computed
- New house systems in the `houses` plugin
- Changes to `getSnapshot()` or `getSnapshotAt()` signatures

---

## Hard rules — PRs failing these are closed without review

### R-ALGO: Never modify algorithm or mathematical logic without explicit direction

The algorithms in `CaelisEngine.js` (VSOP87B, ELP/MPP02-LLR, IAU 2000B nutation, IAU 2006 obliquity, Bennett refraction, Morrison-Stephenson ΔT) are treated as **inviolable**. They encode primary sources, not approximations of approximations.

A PR that changes `nutation()`, `meanObliquity()`, `sunPosition()`, `moonPosition()`, or any VSOP87B series must:
1. Cite the primary source for the change
2. Declare the precision improvement or correction
3. Include a regression test demonstrating the improvement
4. Pass the full validation suite with tighter tolerances than before

If you believe there is an error in the mathematical implementation, open an issue with:
- The specific function
- The primary source reference
- A numerical example showing the discrepancy

### R-SCHEMA: No interpretive concepts in the astronomical layer

Fields `house`, `houses`, and any astrological assignment belong in `atacir.*`, not in `bodies.*`, `meta.*`, or `luna.*`. PRs adding interpretive fields to the astronomical schema are rejected.

### R-PURE: AstroCore must not read DOM or call Date.now() except in currentTime()

`getSnapshot()`, `getSnapshotAt()`, and all helper functions in `CaelisEngine.js` must not reference `document`, `window`, `localStorage`, or any browser API. The only permitted call to `Date.now()` is in `currentTime()`.

### R-DETERMINISM: Plugins must be pure functions

Atacir plugins must conform to the Plugin Contract:

```
(snapshot, config?) → data | null

R1: Does NOT modify snapshot
R2: Does NOT call Date.now() or currentTime()
R3: Does NOT read or write global state (lat, lon, timeOffset)
R4: Returns object with declared namespace, or null
R5: Same snapshot + same config = same output. Always.
```

A plugin that violates any of R1-R5 is not accepted.

### R-TEST: Every bug fix must include a regression test

Add the test to `validation/run.js` in the appropriate epoch, or create a new epoch entry. The test must fail before the fix and pass after.

### R-VALIDATE: The full validation suite must pass

```bash
node validation/run.js
```

Must exit 0 with 0 failures. No exceptions.

---

## Pull request process

1. **Fork** the repository and create a branch from `main`.

2. **One concern per PR.** Do not combine algorithm changes with plugin additions.

3. **Reference an issue** for any non-trivial change. PRs without a linked issue for significant changes may be closed.

4. **Document your change** in the relevant `docs/` file. Algorithm changes require `MATEMATICA.md` updates. Schema changes require `SPEC.md` updates. New public functions require `CATALOGO.md` updates.

5. **Run validation:**
   ```bash
   node validation/run.js --verbose
   ```

6. **Attribution:** you retain copyright on your contributions. By submitting a PR you agree to license your contribution under the same license as the file you are modifying (AGPL-3.0 for engine code, commercial for nothing — commercial licenses cover the engine as a whole, not individual contributions).

---

## Adding an Atacir plugin

A new plugin requires:

1. A function in `atacir/plugins/yourplugin.js` conforming to Plugin Contract R1-R5.

2. A registry entry in `Atacir.compute.js`:
   ```javascript
   {
     key:      'yourplugin',
     label:    'Your Plugin',
     describe: 'What it computes in one line',
     requires: [],           // other plugin keys that must be active
     compute:  (snap, cfg) => yourComputation(snap, cfg)
   }
   ```

3. An entry in `CATALOGO.md` documenting inputs, outputs, and algorithm.

4. At least one test in the validation suite demonstrating correct output.

5. If the plugin requires a modal in the UI reference implementation, a PR to `dist/caelis-minimal.html` following the existing modal pattern.

---

## Reporting precision discrepancies

If you find a case where Caelis Engine output differs significantly from JPL Horizons, Swiss Ephemeris, or another authoritative source:

1. Use the **precision discrepancy** issue template.
2. Include: epoch (JD_TT), body, field, engine value, reference value, reference source.
3. If possible, include the reference URL or page number.

We take precision reports seriously. The engine's declared precision bounds are conservative — if the engine is outside them, it is a bug.

---

## Code style

- **No transpilation required.** Write plain ES2020 JavaScript.
- **No external dependencies** in `CaelisEngine.js` or `atacir/`.
- **Comments cite primary sources.** `// Meeus Ch.22 p.148` is a comment. `// obliquity` is not.
- **Variable names follow the mathematical convention** used in the documentation: `T`, `eps`, `deltaPsi`, `phi`, `lambda`.
- **Angles in radians internally, degrees in the public API.** Never mix.

---

*Caelis Engine · Hermetica Labs · © 2024–2026 Cristian Valeria Bravo*
