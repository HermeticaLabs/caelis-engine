/**
 * TimeEngine.js — Motor de Tiempo y Estado
 * Gestión del tiempo juliano, LST, snapshots astronómicos completos.
 *
 * Autor:      Cristian Valeria Bravo
 * Proyecto:   Hermetica Labs — Caelis Engine
 * Repositorio: github.com/HermeticaLabs/caelis-engine
 * © 2024–2026 Cristian Valeria Bravo / Hermetica Labs
 * Todos los derechos reservados.
 *
 * Depende de: AstroCore.js
 */

// ── Estado del observador ────────────────────────────────────────
// Estos valores son leídos del contexto global del monolito.
// En la arquitectura modular se reemplazarán por un objeto de estado explícito.

const TimeEngine = {

  // ── Configuración de velocidad temporal ─────────────────────
  speedLevels: [-86400, -3600, -60, 1, 60, 3600, 86400],
  speedLabels: ["−1día/s","−1h/s","−1min/s","1x","1min/s","1h/s","1día/s"],

  /**
   * Crea un snapshot astronómico completo para una fecha y ubicación dadas.
   * Es la función principal que consume el AstroCore.
   *
   * @param {number} jdTarget  — Fecha Juliana objetivo
   * @param {number} latDeg    — Latitud del observador en grados
   * @param {number} lonDeg    — Longitud del observador en grados
   * @returns {object}         — Snapshot con posiciones, casas, fase lunar
   */
  snapshotAt(jdTarget, latDeg, lonDeg) {
    return getSnapshotAt(jdTarget, latDeg, lonDeg);
  },

  /**
   * Snapshot en el momento actual (usa el tiempo del engine).
   */
  snapshotNow() {
    return getSnapshot();
  },

  /**
   * Convierte fecha/hora UTC a Fecha Juliana.
   * @param {string} dateStr — "YYYY-MM-DD"
   * @param {string} timeStr — "HH:MM"
   * @returns {number} JD
   */
  dateToJD(dateStr, timeStr) {
    const dt = new Date(`${dateStr}T${timeStr}:00Z`);
    return dt.getTime() / 86400000 + 2440587.5;
  },

  /**
   * Convierte Fecha Juliana a objeto Date UTC.
   * @param {number} jd
   * @returns {Date}
   */
  jdToDate(jd) {
    return new Date((jd - 2440587.5) * 86400000);
  },

  /**
   * Convierte Fecha Juliana a string UTC legible.
   * @param {number} jd
   * @returns {string} "YYYY-MM-DD HH:MMZ"
   */
  jdToString(jd) {
    return this.jdToDate(jd).toISOString().slice(0,16).replace('T',' ') + 'Z';
  },

  /**
   * Edad en años entre dos fechas julianas.
   * @param {number} jdBirth
   * @param {number} jdNow
   * @returns {number}
   */
  age(jdBirth, jdNow) {
    return (jdNow - jdBirth) / 365.25;
  },

};

// ── Funciones base (compatibilidad con monolito) ─────────────────
// Estas funciones se mantienen en el scope global para que el monolito
// siga funcionando sin cambios. TimeEngine las expone también como métodos.

function currentTime(){ return Date.now()/1000 + timeOffset; }

function julianDate(){ let j=julianDateUTC(); return j+deltaT(j)/86400; }

function julianDateUTC(){ return currentTime()/86400 + 2440587.5; }

function getLST(){
  let JD=julianDate();
  return(((gast(JD)+lon*rad2deg)%360)+360)%360*deg2rad;
}

function _bodyData(ra, dec){
  // Coordenadas horizontales
  let LST = getLST(), HA = LST - ra;
  let altRad = Math.asin(
    Math.sin(dec)*Math.sin(lat) + Math.cos(dec)*Math.cos(lat)*Math.cos(HA)
  );
  let altRef = applyRefraction(altRad); // con refracción
  let azRad  = Math.atan2(
    -Math.sin(HA),
    Math.tan(dec)*Math.cos(lat) - Math.sin(lat)*Math.cos(HA)
  );
  // Longitud y latitud eclíptica
  let T   = (julianDate()-2451545)/36525;
  let eps = trueObliquity(T);
  let lonEcl = Math.atan2(
    Math.sin(ra)*Math.cos(eps) + Math.tan(dec)*Math.sin(eps),
    Math.cos(ra)
  );
  let latEcl = Math.asin(
    Math.sin(dec)*Math.cos(eps) - Math.cos(dec)*Math.sin(eps)*Math.sin(ra)
  );
  lonEcl = ((lonEcl*rad2deg)%360+360)%360;
  latEcl = latEcl*rad2deg;

  // Casa astrológica (1–12) según longitud eclíptica y ASC
  let {asc} = getHouseCusps();
  let house  = (Math.floor(((lonEcl - asc + 360)%360) / 30) % 12) + 1;

  return {
    ra:      ra*rad2deg,
    dec:     dec*rad2deg,
    lon_ecl: lonEcl,
    lat_ecl: latEcl,
    alt:     altRef*rad2deg,
    az:      ((azRad*rad2deg)%360+360)%360,
    visible: altRef > 0,
    house
  };
}

function getSnapshot(){
  let jd  = julianDate();
  let T   = (jd-2451545)/36525;
  let now = new Date(currentTime()*1000);

  // Posiciones de los 7 astros herméticos
  let sun   = sunPosition();
  let moon  = moonPosition();
  let merc  = planetPosition("Mercurio");
  let venus = planetPosition("Venus");
  let mars  = planetPosition("Marte");
  let jup   = planetPosition("Júpiter");
  let sat   = planetPosition("Saturno");

  // Fase lunar (0–1, donde 0=luna nueva, 0.5=llena)
  let phase = Math.acos(
    Math.sin(sun.dec)*Math.sin(moon.dec) +
    Math.cos(sun.dec)*Math.cos(moon.dec)*Math.cos(sun.ra - moon.ra)
  ) / Math.PI;

  // ASC y MC
  let {asc, mc, cusps} = getHouseCusps();

  // Oblicuidad y nutación
  let eps  = trueObliquity(T)*rad2deg;
  let nut  = nutation(T);
  let LST  = getLST()*rad2deg;

  return {
    // Metadatos temporales
    meta: {
      jd,
      utc:        now.toISOString(),
      timestamp:  currentTime(),
      lst_deg:    LST,
      obliquity:  eps,
      delta_psi:  nut.deltaPsi*rad2deg,
      delta_eps:  nut.deltaEps*rad2deg,
      observer: {
        lat: lat*rad2deg,
        lon: lon*rad2deg
      }
    },
    // 7 astros herméticos + nodos lunares
    bodies: {
      Sol:        _bodyData(sun.ra,   sun.dec),
      Luna:       _bodyData(moon.ra,  moon.dec),
      Mercurio:   _bodyData(merc.ra,  merc.dec),
      Venus:      _bodyData(venus.ra, venus.dec),
      Marte:      _bodyData(mars.ra,  mars.dec),
      Jupiter:    _bodyData(jup.ra,   jup.dec),
      Saturno:    _bodyData(sat.ra,   sat.dec),
      NodoNorte:  (()=>{ let n=lunarNodes(); let d=_bodyData(n.north.ra,n.north.dec); d.lon_ecl=n.omega; return d; })(),
      NodoSur:    (()=>{ let n=lunarNodes(); let d=_bodyData(n.south.ra,n.south.dec); d.lon_ecl=n.south.lon_ecl; return d; })()
    },
    // Luna
    luna: {
      phase_ratio:  phase,          // 0=nueva, 0.5=llena, 1=nueva
      phase_deg:    phase*180,      // 0–180 grados de elongación
      illumination: (1+Math.cos(phase*Math.PI))/2  // 0–1
    },
    // Ángulos de las casas
    houses: {
      asc,
      mc,
      cusps,        // array [I..XII] en grados eclípticos
      system: houseSystem
    }
  };
}

function getSnapshotAt(jdTarget, latDeg, lonDeg){
  // Guardar estado actual
  let savedOffset = timeOffset;
  let savedLat    = lat, savedLon = lon;
  let savedSpeed  = timeSpeed, savedIdx = speedIndex;

  // Inyectar JD objetivo como offset temporal
  // julianDateUTC() = currentTime()/86400 + 2440587.5
  // → currentTime() = (jd - 2440587.5) * 86400
  // → timeOffset = currentTime_target - Date.now()/1000
  let targetUnix = (jdTarget - 2440587.5)*86400;
  timeOffset = targetUnix - Date.now()/1000;
  timeSpeed  = 0; // congelar durante el cálculo

  // Inyectar ubicación
  lat = latDeg*deg2rad;
  lon = lonDeg*deg2rad;
  R_TIERRA = geocentricRadius();

  // Calcular snapshot
  let snap = getSnapshot();

  // Incluir nodos lunares en el snapshot
  let nodes = lunarNodes();
  snap.bodies.NodoNorte = _bodyData(nodes.north.ra, nodes.north.dec);
  snap.bodies.NodoNorte.lon_ecl = nodes.omega;
  snap.bodies.NodoSur   = _bodyData(nodes.south.ra, nodes.south.dec);
  snap.bodies.NodoSur.lon_ecl   = nodes.south.lon_ecl;

  // Restaurar estado
  timeOffset = savedOffset;
  timeSpeed  = savedSpeed;
  speedIndex = savedIdx;
  lat = savedLat; lon = savedLon;
  R_TIERRA = geocentricRadius();

  return snap;
}



// ── Exposición al scope global (compatibilidad con monolito) ────
// Cuando se carga en browser, estas funciones quedan disponibles globalmente
if (typeof window !== 'undefined') {
  window.currentTime    = currentTime;
  window.julianDate     = julianDate;
  window.julianDateUTC  = julianDateUTC;
  window.getLST         = getLST;
  window._bodyData      = _bodyData;
  window.getSnapshot    = getSnapshot;
  window.getSnapshotAt  = getSnapshotAt;
}

// ── Exportación universal ────────────────────────────────────────
// Agregar funciones base al objeto TimeEngine para uso modular
TimeEngine.currentTime   = currentTime;
TimeEngine.julianDate    = julianDate;
TimeEngine.julianDateUTC = julianDateUTC;
TimeEngine.getLST        = getLST;
TimeEngine.getSnapshot   = getSnapshot;
TimeEngine.getSnapshotAt = getSnapshotAt;
TimeEngine._bodyData     = _bodyData;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TimeEngine;
} else if (typeof window !== 'undefined') {
  window.TimeEngine = TimeEngine;
}
