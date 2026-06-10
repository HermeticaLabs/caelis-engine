/**
 * ============================================================================
 * CAELIS ENGINE v4.0 - AtacirClient.js
 * A.T.A.C.I.R.(TM) Cloud API Client
 * Arc-based Transformation of Astronomical Coordinates for Interpretive Resolution
 * ============================================================================
 *
 * Copyright (c) 2024-2026 Cristian Valeria Bravo
 * Hermetica Labs - Santiago, Chile
 * https://github.com/hermeticalabs/caelis-engine
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This client is open source and connects to the Hermetica Labs
 * A.T.A.C.I.R. Cloud API. The API implementation is proprietary.
 *
 * A.T.A.C.I.R.(TM) Cloud provides:
 *   - Primary directions (oblique ascension · Naibod/Ptolemy keys)
 *   - Natal and transit aspects (5 major · configurable orbs)
 *   - Ecliptic symmetries (antiscia / contrantiscia)
 *   - Lunar phases, apsides, and cycles
 *   - Vedic Panchanga (5 elements · Lahiri ayanamsa)
 *   - Synastry cross-aspects between two snapshots
 *   - Eclipse prediction (Meeus Ch.54 · Saros series)
 *   - Orbital resonances (p/q <= 16)
 *   - House systems (Placidus · Porphyry · Alcabitius · Equal · Whole Sign)
 *   - R1-R5 Digital Signature (data integrity certification)
 *
 * USAGE:
 *   import { getSnapshot } from '@hermeticalabs/caelis-engine';
 *   import { AtacirClient } from '@hermeticalabs/caelis-engine/client';
 *
 *   const client = new AtacirClient({ apiKey: 'your-api-key' });
 *   const snapshot = getSnapshot();
 *   const result = await client.compute(snapshot, {
 *     plugins: ['houses', 'aspects', 'panchanga']
 *   });
 *
 * API docs:   https://api.hermeticalabs.com/docs
 * Licensing: hermeticalabs.dev@proton.me
 * ============================================================================
 */

'use strict';

const ATACIR_API_VERSION = 'v1';
const ATACIR_API_BASE    = 'https://api.hermeticalabs.com';
const SCHEMA_VERSION     = '3.1';

// ── Available plugins in the A.T.A.C.I.R. Cloud API ──────────────────────────
const AVAILABLE_PLUGINS = [
  'houses',       // House systems + body assignments
  'aspects',      // Natal and transit aspects
  'symmetries',   // Antiscia / contrantiscia
  'lunar',        // Phases, apsides, cycles
  'cycles',       // Synodic periods and returns
  'resonances',   // Orbital resonances p/q <= 16
  'panchanga',    // Vedic almanac (Lahiri ayanamsa)
  'synastry',     // Cross-aspects between two snapshots
  'eclipses',     // Solar/lunar prediction (Meeus Ch.54)
  'directions',   // Primary directions (oblique ascension)
];

// ── R1-R5 Plugin Contract (enforced server-side) ──────────────────────────────
// Every plugin in the A.T.A.C.I.R. Cloud satisfies:
//   R1: Does NOT modify the snapshot
//   R2: Does NOT use real-time clock (time comes from snapshot)
//   R3: Does NOT read or write global state
//   R4: Returns an object with declared namespace
//   R5: Same snapshot + same config = same output. Always.
//
// The R1-R5 Digital Signature in the response certifies this contract
// was enforced for that specific computation.

class AtacirClient {
  /**
   * @param {object} config
   * @param {string} config.apiKey       - Your Hermetica Labs API key
   * @param {string} [config.apiBase]    - Override API base URL (for testing)
   * @param {number} [config.timeout]    - Request timeout in ms (default: 10000)
   * @param {string} [config.version]    - API version (default: 'v1')
   */
  constructor(config = {}) {
    if (!config.apiKey) {
      throw new Error(
        'AtacirClient requires an API key. ' +
        'Get yours at https://hermeticalabs.com/api-keys'
      );
    }

    this._apiKey  = config.apiKey;
    this._base    = (config.apiBase || ATACIR_API_BASE).replace(/\/$/, '');
    this._version = config.version || ATACIR_API_VERSION;
    this._timeout = config.timeout || 10000;
  }

  // ── Core method: compute interpretive layer ─────────────────────────────────
  /**
   * Sends an astronomical snapshot to the A.T.A.C.I.R. Cloud API
   * and returns the enriched result with the requested plugin outputs.
   *
   * The snapshot is produced by CaelisEngine.getSnapshot() or
   * CaelisEngine.getSnapshotAt(). It is sent as-is — the API
   * validates schema version and computes the requested plugins
   * against the immutable astronomical data.
   *
   * @param {object} snapshot - Schema v3.1 snapshot from CaelisEngine
   * @param {object} [config]
   * @param {string[]} [config.plugins]       - Plugins to activate (see AVAILABLE_PLUGINS)
   * @param {string}   [config.houseSystem]   - 'placidus'|'porfirio'|'alcabitius'|'equal'|'wholesign'
   * @param {object}   [config.synastry]      - { snapshot_b: snapshot } for synastry
   * @param {object}   [config.eclipses]      - { range: number, solar: bool, lunar: bool }
   * @param {object}   [config.transit]       - Transit snapshot for aspects
   *
   * @returns {Promise<AtacirResult>}
   *
   * @example
   * const result = await client.compute(snapshot, {
   *   plugins: ['houses', 'aspects', 'panchanga'],
   *   houseSystem: 'placidus'
   * });
   * console.log(result.atacir.houses.asc);
   * console.log(result.atacir.aspects.natales[0]);
   * console.log(result.signature.valid); // R1-R5 certification
   */
  async compute(snapshot, config = {}) {
    this._validateSnapshot(snapshot);

    const plugins = config.plugins || AVAILABLE_PLUGINS;
    this._validatePlugins(plugins);

    const payload = {
      schema_version: SCHEMA_VERSION,
      snapshot:       this._cleanSnapshot(snapshot),
      plugins,
      config: {
        houseSystem: config.houseSystem || 'placidus',
        eclipses:    config.eclipses    || null,
        synastry:    config.synastry    || null,
        transit:     config.transit     || null,
      }
    };

    const response = await this._post('/compute', payload);
    return response;
  }

  // ── Synastry shorthand ──────────────────────────────────────────────────────
  /**
   * Computes cross-aspects between two snapshots.
   * Each snapshot is produced independently by CaelisEngine.
   *
   * @param {object} snapshotA - First person's snapshot
   * @param {object} snapshotB - Second person's snapshot
   * @returns {Promise<SynastryResult>}
   */
  async synastry(snapshotA, snapshotB) {
    this._validateSnapshot(snapshotA);
    this._validateSnapshot(snapshotB);

    return this._post('/synastry', {
      schema_version: SCHEMA_VERSION,
      snapshot_a: this._cleanSnapshot(snapshotA),
      snapshot_b: this._cleanSnapshot(snapshotB),
    });
  }

  // ── Eclipse search ──────────────────────────────────────────────────────────
  /**
   * Searches for eclipses around the snapshot's epoch.
   *
   * @param {object} snapshot
   * @param {object} [options]
   * @param {number}  [options.range]  - Search range in years (default: 1)
   * @param {boolean} [options.solar]  - Include solar eclipses (default: true)
   * @param {boolean} [options.lunar]  - Include lunar eclipses (default: true)
   * @returns {Promise<EclipseResult[]>}
   */
  async eclipses(snapshot, options = {}) {
    this._validateSnapshot(snapshot);
    return this._post('/eclipses', {
      schema_version: SCHEMA_VERSION,
      snapshot: this._cleanSnapshot(snapshot),
      range:  options.range  ?? 1,
      solar:  options.solar  ?? true,
      lunar:  options.lunar  ?? true,
    });
  }

  // ── Verify R1-R5 signature ──────────────────────────────────────────────────
  /**
   * Verifies the R1-R5 Digital Signature of a previously computed result.
   * Use this to certify that a result was produced by the Hermetica Labs
   * API and has not been tampered with.
   *
   * @param {object} result - An AtacirResult with a signature field
   * @returns {Promise<{ valid: boolean, certified_at: string, plugins: string[] }>}
   */
  async verifySignature(result) {
    if (!result?.signature?.token) {
      throw new Error('Result does not contain an R1-R5 signature token.');
    }
    return this._post('/verify', { token: result.signature.token });
  }

  // ── Account info ────────────────────────────────────────────────────────────
  /**
   * Returns current API key usage and quota.
   * @returns {Promise<{ calls_used: number, calls_limit: number, plan: string }>}
   */
  async quota() {
    return this._get('/quota');
  }

  // ── Internal: clean snapshot before sending ──────────────────────────────────
  _cleanSnapshot(snapshot) {
    // Filter internal _ fields — never sent to the API
    return JSON.parse(
      JSON.stringify(snapshot, (k, v) => k.startsWith('_') ? undefined : v)
    );
  }

  // ── Internal: validate snapshot schema ──────────────────────────────────────
  _validateSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') {
      throw new Error('snapshot must be a CaelisEngine schema v3.1 object.');
    }
    if (snapshot.schema_version !== SCHEMA_VERSION) {
      throw new Error(
        `snapshot.schema_version must be "${SCHEMA_VERSION}". ` +
        `Got: "${snapshot.schema_version}". ` +
        'Use CaelisEngine.getSnapshot() to generate a valid snapshot.'
      );
    }
    if (!snapshot.meta?.jd_tt) {
      throw new Error(
        'snapshot.meta.jd_tt is required. ' +
        'Use CaelisEngine.getSnapshot() to generate a valid snapshot.'
      );
    }
    if (!snapshot.bodies) {
      throw new Error('snapshot.bodies is required.');
    }
  }

  // ── Internal: validate plugin list ──────────────────────────────────────────
  _validatePlugins(plugins) {
    if (!Array.isArray(plugins) || plugins.length === 0) {
      throw new Error(
        `plugins must be a non-empty array. ` +
        `Available: ${AVAILABLE_PLUGINS.join(', ')}`
      );
    }
    const unknown = plugins.filter(p => !AVAILABLE_PLUGINS.includes(p));
    if (unknown.length > 0) {
      throw new Error(
        `Unknown plugins: ${unknown.join(', ')}. ` +
        `Available: ${AVAILABLE_PLUGINS.join(', ')}`
      );
    }
  }

  // ── Internal: HTTP POST ──────────────────────────────────────────────────────
  async _post(path, body) {
    const url = `${this._base}/${this._version}${path}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this._timeout);

    let response;
    try {
      response = await fetch(url, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${this._apiKey}`,
          'X-Client':      `caelis-engine/4.0`,
        },
        body:   JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error(`A.T.A.C.I.R. API timeout after ${this._timeout}ms.`);
      }
      throw new Error(`A.T.A.C.I.R. API network error: ${err.message}`);
    } finally {
      clearTimeout(timer);
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const msg = data?.error || data?.message || response.statusText;
      throw new Error(
        `A.T.A.C.I.R. API error ${response.status}: ${msg}`
      );
    }

    return data;
  }

  // ── Internal: HTTP GET ───────────────────────────────────────────────────────
  async _get(path) {
    const url = `${this._base}/${this._version}${path}`;

    const response = await fetch(url, {
      method:  'GET',
      headers: {
        'Authorization': `Bearer ${this._apiKey}`,
        'X-Client':      `caelis-engine/4.0`,
      },
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(
        `A.T.A.C.I.R. API error ${response.status}: ${data?.error || response.statusText}`
      );
    }
    return data;
  }
}

// ── Exports ───────────────────────────────────────────────────────────────────

// ESM
export { AtacirClient, AVAILABLE_PLUGINS, ATACIR_API_VERSION };
export default AtacirClient;

// CJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AtacirClient, AVAILABLE_PLUGINS, ATACIR_API_VERSION };
}
