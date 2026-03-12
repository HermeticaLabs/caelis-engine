/**
 * Atacir.js — Motor de Direcciones Primarias
 * Direcciones primarias, aspectos, simetrías, ciclos, resonancias y luna.
 *
 * Autor:      Cristian Vásquez
 * Proyecto:   Hermetica Labs — Caelis Engine
 * Repositorio: github.com/HermeticaLabs/caelis-engine
 * © 2024–2026 Cristian Vásquez / Hermetica Labs
 * Todos los derechos reservados.
 *
 * Depende de: AstroCore.js, TimeEngine.js
 */

// ── Panel HTML ───────────────────────────────────────────────────
const ATACIR_HTML = `
<div id="atacirPanel">
  <div id="atacirHeader" onclick="toggleAtacirPanel()">
    <h3>☊ Nodos · Atacir (Direcciones Primarias)</h3>
    <span style="color:rgba(255,255,255,0.4);font-size:11px;">▼ cerrar</span>
  </div>
  <div id="atacirBody">
    <div class="atc-cols">
      <!-- Radix -->
      <div class="atc-col">
        <h4>♈ Carta Natal (Radix)</h4>
        <div class="atc-row"><label>Fecha</label><input type="date" id="rx-date" value="1990-01-01"></div>
        <div class="atc-row"><label>Hora</label><input type="time" id="rx-time" value="12:00" step="60"></div>
        <div class="atc-row"><label>Lat</label><input type="number" id="rx-lat" value="-33.45" step="0.01" min="-90" max="90"></div>
        <div class="atc-row"><label>Lon</label><input type="number" id="rx-lon" value="-70.66" step="0.01" min="-180" max="180"></div>
        <div id="rx-preview" style="font-size:10px;color:rgba(180,165,255,0.60);margin-top:4px;">—</div>
        <button class="atc-btn" id="btnNatal" onclick="toggleNatal()" style="margin-top:6px;background:rgba(255,215,55,0.08);border-color:rgba(255,215,55,0.30);color:rgba(255,215,55,0.85);">
          ✦ Ver cielo natal
        </button>
      </div>
      <!-- Tránsito -->
      <div class="atc-col">
        <h4>⊙ Momento Actual (Tránsito)</h4>
        <div class="atc-row"><label>Fecha</label><input type="date" id="tr-date"></div>
        <div class="atc-row"><label>Hora</label><input type="time" id="tr-time" step="60"></div>
        <div class="atc-row"><label>Lat</label><input type="number" id="tr-lat" step="0.01" min="-90" max="90"></div>
        <div class="atc-row"><label>Lon</label><input type="number" id="tr-lon" step="0.01" min="-180" max="180"></div>
        <button class="atc-btn" onclick="syncTransitoNow()">↺ Sincronizar con ahora</button>
      </div>
      <!-- Key -->
      <div class="atc-col" style="flex:0.55;">
        <h4>⚙ Configuración</h4>
        <div class="atc-row"><label>Clave</label>
          <select id="atc-key" style="flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.13);border-radius:5px;color:rgba(255,255,255,0.90);font-family:'Georgia',serif;font-size:11px;padding:3px 6px;">
            <option value="1.0">Ptolomeo (1°/año)</option>
            <option value="0.8219" selected>Naibod (0.8219°/año)</option>
            <option value="0.9856">Solar (0.9856°/año)</option>
          </select>
        </div>
        <div style="font-size:10px;color:rgba(180,165,255,0.55);margin-top:6px;line-height:1.5;">
          Atacir = arco de dirección<br>por ascensión oblicua.<br>
          Edad = Arco ÷ Clave.
        </div>
        <button class="atc-btn" onclick="calcAtacir()" style="margin-top:14px;">Calcular Atacir ▶</button>
      </div>
    </div>
    <div id="atacirResults"></div>
  </div>
</div>
`;

// ── Estilos CSS ──────────────────────────────────────────────────
const ATACIR_CSS = `
/* ======= PANEL ATACIR ======= */
#atacirPanel{
  position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
  background:rgba(0,0,0,0.72);
  border:1px solid rgba(255,255,255,0.10);
  border-radius:14px; padding:0;
  color:rgba(255,255,255,0.88);
  font-family:'Georgia',serif; font-size:11.5px; line-height:1.7;
  width:760px; max-width:96vw;
  backdrop-filter:blur(10px);
  pointer-events:all; user-select:none;
  display:none;
}
#atacirPanel.open{ display:block; }
#atacirHeader{
  display:flex; justify-content:space-between; align-items:center;
  padding:10px 16px 8px;
  border-bottom:1px solid rgba(255,255,255,0.07); cursor:pointer;
}
#atacirHeader h3{ margin:0; font-size:13px; letter-spacing:0.06em; color:rgba(220,180,80,0.95); }
#atacirBody{ padding:12px 16px; }
.atc-cols{ display:flex; gap:16px; }
.atc-col{ flex:1; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:9px; padding:10px 12px; }
.atc-col h4{ margin:0 0 8px; font-size:11px; letter-spacing:0.08em; color:rgba(180,165,255,0.80); text-transform:uppercase; }
.atc-row{ display:flex; align-items:center; gap:6px; margin-bottom:5px; }
.atc-row label{ color:rgba(180,165,255,0.70); font-size:10.5px; min-width:42px; }
.atc-row input{ flex:1; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.13); border-radius:5px; color:rgba(255,255,255,0.90); font-family:'Georgia',serif; font-size:11px; padding:3px 6px; }
.atc-row input:focus{ outline:none; border-color:rgba(220,180,80,0.5); }
.atc-btn{ margin-top:8px; width:100%; background:rgba(220,180,80,0.12); border:1px solid rgba(220,180,80,0.35); color:rgba(220,180,80,0.95); border-radius:7px; padding:5px 0; cursor:pointer; font-size:11.5px; transition:background 0.2s; }
.atc-btn:hover{ background:rgba(220,180,80,0.22); }
#atacirResults{ margin-top:12px; border-top:1px solid rgba(255,255,255,0.07); padding-top:10px; }
#atacirResults table{ width:100%; border-collapse:collapse; font-size:11px; }
#atacirResults th{ color:rgba(180,165,255,0.75); font-weight:normal; text-align:left; padding:2px 6px; border-bottom:1px solid rgba(255,255,255,0.07); }
#atacirResults td{ padding:3px 6px; color:rgba(255,255,255,0.85); border-bottom:1px solid rgba(255,255,255,0.04); }
#atacirResults td.arc{ color:rgba(220,180,80,0.90); font-size:12px; }
#atacirResults td.age{ color:rgba(160,220,160,0.90); }
#atacirResults .note{ font-size:10px; color:rgba(255,255,255,0.40); margin-top:6px; }

/* ═══ TRANSFORMARE ASTRALIS ═══ */
#oculusCanvas {
  position:fixed; top:0; left:0; width:100%; height:100%;
  z-index:3; display:none; pointer-events:none;
}
#threeCanvas {
  position:fixed; top:0; left:0; width:100%; height:100%;
  z-index:3; display:none; pointer-events:none;
}
#vortexCanvas {
  position:fixed; top:0; left:0; width:100%; height:100%;
  z-index:5; pointer-events:none; display:none;
  mix-blend-mode: screen;
}
#flashOverlay {
  position:fixed; top:0; left:0; width:100%; height:100%;
  z-index:6; pointer-events:none;
  background:radial-gradient(ellipse at center,
    rgba(255,255,255,1) 0%, rgba(160,180,255,0.8) 40%, rgba(0,0,0,0) 100%);
  opacity:0; display:none;
}
/* ── OCULUS PANEL (estilo OCULUS original) ─────────────────────── */
#oculusPanel {
  position:fixed; top:20px; left:20px; z-index:20;
  color:#e0c097; background:rgba(15,15,15,0.92);
  padding:20px; border:1px solid #5d4a37; border-radius:12px;
  width:260px; backdrop-filter:blur(10px);
  box-shadow:0 10px 40px rgba(0,0,0,0.7);
  max-height:85vh; overflow-y:auto;
  display:none; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;
  font-size:13px;
}
#oculusPanel.visible { display:block; }
#oculusPanel h1 {
  font-size:18px; margin:0 0 14px 0; font-weight:300; letter-spacing:2px;
  text-align:center; border-bottom:1px solid #5d4a37; padding-bottom:10px;
  color:#d4af37;
}
#oculusPanel h2 {
  font-size:11px; margin:14px 0 8px 0; font-weight:400;
  letter-spacing:2px; text-transform:uppercase; color:#8a7662;
  border-bottom:1px solid #3d342a; padding-bottom:4px;
}
#oculusPanel .ctrl-group { margin-bottom:12px; }
#oculusPanel .slider-label {
  display:flex; justify-content:space-between;
  font-size:11px; color:#8a7662; margin-bottom:3px;
}
#oculusPanel input[type=range] { width:100%; accent-color:#e0c097; margin:4px 0; }
#oculusPanel button {
  background:#2a241e; color:#e0c097; border:1px solid #5d4a37;
  padding:7px 12px; margin:2px; cursor:pointer; border-radius:6px;
  font-size:13px; transition:all 0.2s; user-select:none;
}
#oculusPanel button:hover { background:#3d342a; border-color:#e0c097; }
#oculusPanel button:active { transform:scale(0.95); }
#oculusPanel .palette-grid {
  display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-top:6px;
}
#oculusPanel .pal-btn {
  padding:7px 6px; font-size:11px; border-radius:4px; cursor:pointer;
  text-align:center; border:1px solid #5d4a37; background:#2a241e;
  color:#e0c097; transition:all 0.2s;
}
#oculusPanel .pal-btn:hover { background:#3d342a; border-color:#e0c097; }
#oculusPanel .pal-btn.active {
  font-weight:600; border-color:#d4af37; border-width:2px;
  background:rgba(212,175,55,0.12); color:#d4af37;
}
#oculusPanel hr { border:0; border-top:1px solid #5d4a37; margin:12px 0; }
#oculusPanel .val { color:#d4af37; font-weight:500; }
#oculusPanel .legend {
  font-size:10px; color:#8a7662; margin-top:10px; line-height:1.6;
  padding:8px; background:rgba(0,0,0,0.3); border-radius:6px;
}
#oculusPanel::-webkit-scrollbar { width:6px; }
#oculusPanel::-webkit-scrollbar-track { background:rgba(0,0,0,0.3); border-radius:10px; }
#oculusPanel::-webkit-scrollbar-thumb { background:#5d4a37; border-radius:10px; }

/* barra inferior Oculus (velocidad + retornar) */
#oculusUI {
  position:fixed; bottom:20px; left:50%; transform:translateX(-50%);
  display:none; gap:8px; background:rgba(15,15,15,0.92);
  padding:10px 18px; border-radius:50px; color:#e0c097; align-items:center;
  backdrop-filter:blur(10px); border:1px solid #5d4a37;
  box-shadow:0 5px 20px rgba(0,0,0,0.5); z-index:20; flex-wrap:wrap; justify-content:center;
}
#oculusUI.visible { display:flex; }
#oculusUI button {
  background:#2a241e; color:#e0c097; border:1px solid #5d4a37;
  padding:8px 14px; margin:2px; cursor:pointer; border-radius:20px;
  font-size:14px; transition:all 0.2s; user-select:none;
}
#oculusUI button:hover { background:#3d342a; border-color:#e0c097; }
#oculusUI button:active { transform:scale(0.95); }
#oculusSpeedDisplay {
  min-width:60px; text-align:center; font-size:13px; color:#d4af37;
  font-family:'Georgia',serif;
}
#btnTransformare {
  background:rgba(100,80,200,0.15) !important;
  border-color:rgba(140,100,255,0.45) !important;
  color:rgba(200,170,255,1.0) !important;
}
#btnTransformare:hover { background:rgba(100,80,200,0.30) !important; }
#btnTransformare.oculus-active {
  background:rgba(212,175,55,0.18) !important;
  border-color:rgba(212,175,55,0.55) !important;
  color:rgba(255,230,100,1.0) !important;
}
`;

// ── Constantes del motor de aspectos ────────────────────────────
const ASPECTOS = [
  { nombre:"Conjunción", simbolo:"☌", angulo:  0, orbe: 8 },
  { nombre:"Oposición",  simbolo:"☍", angulo:180, orbe: 8 },
  { nombre:"Trígono",    simbolo:"△", angulo:120, orbe: 7 },
  { nombre:"Cuadratura", simbolo:"□", angulo: 90, orbe: 7 },
  { nombre:"Sextil",     simbolo:"⚹", angulo: 60, orbe: 5 },
];

// Luminarias — reciben orbe extra (+2°)
const LUMINARIAS = new Set(["Sol", "Luna"]);

// ── Funciones del motor ─────────────────────────────────────────
// ── Helpers del motor ────────────────────────────────────────────
function _orbeParaPar(nmA, nmB, orbeBase){
  let bonus = (LUMINARIAS.has(nmA) || LUMINARIAS.has(nmB)) ? 2 : 0;
  return orbeBase + bonus;
}

function _activarNatal(){
  let rxDate = document.getElementById("rx-date").value;
  let rxTime = document.getElementById("rx-time").value || "12:00";
  let rxLat  = parseFloat(document.getElementById("rx-lat").value);
  let rxLon  = parseFloat(document.getElementById("rx-lon").value);

  if(!rxDate || isNaN(rxLat) || isNaN(rxLon)){
    let btn = document.getElementById("btnNatal");
    if(btn){ btn.textContent = "⚠ Complete los datos del Radix"; }
    setTimeout(()=>{ if(btn) btn.textContent = "✦ Ver cielo natal"; }, 2000);
    return;
  }

  // Guardar estado actual completo
  _natalSaved = {
    timeOffset, timeSpeed, speedIndex,
    lat: lat*rad2deg, lon: lon*rad2deg
  };

  // Calcular JD del Radix y convertir a timeOffset
  let dt = new Date(`${rxDate}T${rxTime}:00Z`);
  let jdRx = dt.getTime()/86400000 + 2440587.5;
  let targetUnix = (jdRx - 2440587.5)*86400;

  // Inyectar tiempo y lugar natales
  timeOffset = targetUnix - Date.now()/1000;
  timeSpeed  = 0;
  speedIndex = 3; // visual display
  document.getElementById("speedDisplay").innerText = "natal";
  setObserver(rxLat, rxLon, `Natal ${rxLat.toFixed(2)}°, ${rxLon.toFixed(2)}°`);

  modoNatal = true;

  // Actualizar botón
  let btn = document.getElementById("btnNatal");
  if(btn){
    btn.textContent = "↩ Volver al presente";
    btn.style.background   = "rgba(255,215,55,0.22)";
    btn.style.borderColor  = "rgba(255,215,55,0.65)";
    btn.style.color        = "rgba(255,215,55,1.0)";
  }

  // Guardar fecha para el indicador
  window._natalDateStr = `${rxDate}  ${rxTime} UTC  ·  ${rxLat.toFixed(2)}°, ${rxLon.toFixed(2)}°`;
}

function _desactivarNatal(){
  if(!_natalSaved) return;

  // Restaurar estado
  timeOffset = _natalSaved.timeOffset;
  timeSpeed  = _natalSaved.timeSpeed;
  speedIndex = _natalSaved.speedIndex;
  document.getElementById("speedDisplay").innerText = speedLabels[speedIndex];
  setObserver(_natalSaved.lat, _natalSaved.lon);

  modoNatal = false;
  _natalSaved = null;
  window._natalDateStr = null;

  // Restaurar botón
  let btn = document.getElementById("btnNatal");
  if(btn){
    btn.textContent = "✦ Ver cielo natal";
    btn.style.background  = "rgba(255,215,55,0.08)";
    btn.style.borderColor = "rgba(255,215,55,0.30)";
    btn.style.color       = "rgba(255,215,55,0.85)";
  }
}

function _difAngular(lonA, lonB){
  let d = Math.abs(lonA - lonB) % 360;
  return d > 180 ? 360 - d : d;
}

function calcAspectosNatales(snap){
  const names  = Object.keys(snap.bodies);
  const glyphs = {Sol:"☉",Luna:"☽",Mercurio:"☿",Venus:"♀",Marte:"♂",
                  Jupiter:"♃",Saturno:"♄",NodoNorte:"☊",NodoSur:"☋"};
  let result = [];

  for(let i=0; i<names.length; i++){
    for(let j=i+1; j<names.length; j++){
      let nmA = names[i], nmB = names[j];
      let bA  = snap.bodies[nmA], bB = snap.bodies[nmB];
      if(!bA || !bB) continue;

      let dif = _difAngular(bA.lon_ecl, bB.lon_ecl);

      for(let asp of ASPECTOS){
        let orbe  = _orbeParaPar(nmA, nmB, asp.orbe);
        let delta = Math.abs(dif - asp.angulo);
        if(delta <= orbe){
          // Exactitud: porcentaje de cercanía al ángulo exacto
          let exactitud = 1 - delta/orbe; // 1.0 = exacto, 0 = en el límite
          result.push({
            nmA, nmB,
            glA: glyphs[nmA]||nmA, glB: glyphs[nmB]||nmB,
            asp: asp.nombre, sim: asp.simbolo,
            angulo: asp.angulo, dif, orb: delta.toFixed(2),
            exactitud
          });
        }
      }
    }
  }
  // Ordenar por exactitud descendente
  result.sort((a,b) => b.exactitud - a.exactitud);
  return result;
}

function calcAspectosTransito(snapRx, snapTr){
  const glyphs = {Sol:"☉",Luna:"☽",Mercurio:"☿",Venus:"♀",Marte:"♂",
                  Jupiter:"♃",Saturno:"♄",NodoNorte:"☊",NodoSur:"☋"};
  let result = [];
  let namesTr = Object.keys(snapTr.bodies);
  let namesRx = Object.keys(snapRx.bodies);

  for(let nmTr of namesTr){
    for(let nmRx of namesRx){
      let bTr = snapTr.bodies[nmTr];
      let bRx = snapRx.bodies[nmRx];
      if(!bTr || !bRx) continue;

      let dif = _difAngular(bTr.lon_ecl, bRx.lon_ecl);

      for(let asp of ASPECTOS){
        let orbe  = _orbeParaPar(nmTr, nmRx, asp.orbe);
        let delta = Math.abs(dif - asp.angulo);
        if(delta <= orbe){
          let exactitud = 1 - delta/orbe;
          result.push({
            nmTr, nmRx,
            glTr: glyphs[nmTr]||nmTr, glRx: glyphs[nmRx]||nmRx,
            asp: asp.nombre, sim: asp.simbolo,
            angulo: asp.angulo, dif, orb: delta.toFixed(2),
            exactitud
          });
        }
      }
    }
  }
  result.sort((a,b) => b.exactitud - a.exactitud);
  return result;
}

function _renderTablaAspectos(aspectos, colA, colB, vacioMsg){
  if(aspectos.length === 0)
    return `<div class="note" style="text-align:center;padding:8px;">${vacioMsg}</div>`;

  // Color por tipo de aspecto
  const colorAsp = {
    "Conjunción": "rgba(255,240,160,0.90)",
    "Sextil":     "rgba(160,220,255,0.85)",
    "Cuadratura": "rgba(255,140,120,0.90)",
    "Trígono":    "rgba(160,255,180,0.90)",
    "Oposición":  "rgba(255,160,200,0.90)",
  };

  let html = `<table><tr>
    <th>${colA}</th><th>Asp.</th><th>${colB}</th>
    <th>Orbe</th><th>Exactitud</th>
  </tr>`;

  for(let a of aspectos){
    let color  = colorAsp[a.asp] || "rgba(255,255,255,0.85)";
    let exactP = Math.round(a.exactitud*100);
    let bar    = "█".repeat(Math.round(a.exactitud*8)) + "░".repeat(8-Math.round(a.exactitud*8));
    let nmA    = a.nmA  || a.nmTr;
    let nmB    = a.nmB  || a.nmRx;
    let glA    = a.glA  || a.glTr;
    let glB    = a.glB  || a.glRx;

    html += `<tr>
      <td><span class="atc-glyph">${glA}</span> ${nmA}</td>
      <td style="text-align:center;color:${color};font-size:14px;">${a.sim}</td>
      <td><span class="atc-glyph">${glB}</span> ${nmB}</td>
      <td style="color:rgba(255,255,255,0.55);text-align:center;">${a.orb}°</td>
      <td style="color:${color};font-size:10px;letter-spacing:-0.5px;">${bar} ${exactP}%</td>
    </tr>`;
  }
  html += `</table>`;
  return html;
}

function calcSimetrias(rx){
  const names = Object.keys(rx.bodies).filter(n=>rx.bodies[n]);
  const lons  = {};
  for(const n of names) lons[n] = ((rx.bodies[n].lon_ecl%360)+360)%360;
  const ascLon = ((rx.houses.asc%360)+360)%360;
  const mcLon  = ((rx.houses.mc%360)+360)%360;
  const ORB = 3.0;
  let result = { antiscia:[], contrantiscia:[], ejeasc:[], ejemc:[] };
  for(let i=0; i<names.length; i++){
    for(let j=i+1; j<names.length; j++){
      const a=names[i], b=names[j], la=lons[a], lb=lons[b];
      // Antiscia: suma ≡ 180° (eje ♋/♑)
      const sumAnt = ((la+lb)%360+360)%360;
      const dAnt180 = Math.min(Math.abs(sumAnt-180), 360-Math.abs(sumAnt-180));
      if(dAnt180 < ORB) result.antiscia.push({a,b,la,lb,orbe:dAnt180,tipo:"Antiscia ♋/♑"});
      // Contrantiscia: suma ≡ 0° (eje ♈/♎)
      const dAnt0 = Math.min(Math.abs(sumAnt), Math.abs(sumAnt-360));
      if(dAnt0 < ORB) result.contrantiscia.push({a,b,la,lb,orbe:dAnt0,tipo:"Contrantiscia ♈/♎"});
      // Eje ASC
      const dA_asc=Math.min(Math.abs(la-ascLon),360-Math.abs(la-ascLon));
      const dB_asc=Math.min(Math.abs(lb-ascLon),360-Math.abs(lb-ascLon));
      const diffAsc=Math.abs(dA_asc-dB_asc);
      if(diffAsc<ORB && Math.min(dA_asc,dB_asc)<90)
        result.ejeasc.push({a,b,la,lb,dA:dA_asc,dB:dB_asc,orbe:diffAsc,tipo:"Eje ASC"});
      // Eje MC
      const dA_mc=Math.min(Math.abs(la-mcLon),360-Math.abs(la-mcLon));
      const dB_mc=Math.min(Math.abs(lb-mcLon),360-Math.abs(lb-mcLon));
      const diffMc=Math.abs(dA_mc-dB_mc);
      if(diffMc<ORB && Math.min(dA_mc,dB_mc)<90)
        result.ejemc.push({a,b,la,lb,dA:dA_mc,dB:dB_mc,orbe:diffMc,tipo:"Eje MC"});
    }
  }
  return result;
}

function renderSimetrias(sim){
  const fmtLon = l=>{const z=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];return z[Math.floor(((l%360)+360)%360/30)]+" "+((((l%360)+360)%360)%30).toFixed(1)+"°";};
  const G={Sol:"☉",Luna:"☽",Mercurio:"☿",Venus:"♀",Marte:"♂",Jupiter:"♃",Saturno:"♄",NodoNorte:"☊",NodoSur:"☋"};
  const secciones=[
    {key:'antiscia',      label:'Antiscia — eje ♋/♑ (solsticial)', col:'rgba(255,220,100,0.85)'},
    {key:'contrantiscia', label:'Contrantiscia — eje ♈/♎ (equinoccial)', col:'rgba(160,220,255,0.85)'},
    {key:'ejeasc',        label:'Simetría eje ASC natal',            col:'rgba(200,180,255,0.85)'},
    {key:'ejemc',         label:'Simetría eje MC natal',             col:'rgba(180,255,200,0.85)'},
  ];
  let h='', total=0;
  for(const {key,label,col} of secciones){
    const items=sim[key]; if(!items.length) continue; total+=items.length;
    h+=`<div style="margin-top:10px;font-size:10px;color:${col};font-weight:bold;letter-spacing:0.5px;">${label}</div>`;
    h+=`<table><tr><th>Par</th><th>Longitudes natales</th><th>Orbe</th></tr>`;
    for(const it of items.sort((a,b)=>a.orbe-b.orbe)){
      const ga=G[it.a]||it.a, gb=G[it.b]||it.b;
      const extra=(key==='ejeasc'||key==='ejemc')?` <span style="color:rgba(255,255,255,0.40);font-size:9px;">(${it.dA.toFixed(1)}° / ${it.dB.toFixed(1)}°)</span>`:'';
      h+=`<tr><td><span class="atc-glyph">${ga}</span> ${it.a} · <span class="atc-glyph">${gb}</span> ${it.b}</td><td style="color:rgba(255,255,255,0.55)">${fmtLon(it.la)} · ${fmtLon(it.lb)}${extra}</td><td class="arc">${it.orbe.toFixed(2)}°</td></tr>`;
    }
    h+=`</table>`;
  }
  if(!total) h=`<div class="note" style="text-align:center;padding:8px;">Sin simetrías angulares dentro del orbe de 3°.</div>`;
  return h;
}

function calcCiclos(rx, tr){
  const periodos={Sol:365.25,Luna:29.53,Mercurio:87.969,Venus:224.701,Marte:686.971,
                  Jupiter:4332.589,Saturno:10759.22,NodoNorte:6798.38,NodoSur:6798.38};
  const glyphs={Sol:"☉",Luna:"☽",Mercurio:"☿",Venus:"♀",Marte:"♂",Jupiter:"♃",Saturno:"♄",NodoNorte:"☊",NodoSur:"☋"};
  const jdRx=rx.meta?.jd ?? rx.meta?.jd ?? rx.jd, jdTr=tr.meta?.jd ?? tr.meta?.jd ?? tr.jd;
  const ageNow=(jdTr-jdRx)/365.25;
  let ciclos=[];
  for(const [nm,periodo] of Object.entries(periodos)){
    if(!rx.bodies[nm]) continue;
    const lonNatal=((rx.bodies[nm].lon_ecl%360)+360)%360;
    const retornosTranscurridos=(jdTr-jdRx)/periodo;
    const nRetornos=Math.floor(retornosTranscurridos);
    const jdRetSiguiente=jdRx+(nRetornos+1)*periodo;
    const edadRetAnterior=(jdRx+nRetornos*periodo-jdRx)/365.25;
    const edadRetSiguiente=(jdRetSiguiente-jdRx)/365.25;
    const jdMedSiguiente=jdRx+(nRetornos+0.5)*periodo;
    const edadMedSig=(jdMedSiguiente-jdRx)/365.25;
    ciclos.push({nm,glyph:glyphs[nm],periodo,nRetornos,lonNatal,
      edadRetAnterior,edadRetSiguiente,edadMedSig,
      diasSiguiente:jdRetSiguiente-jdTr,diasMedSig:jdMedSiguiente-jdTr});
  }
  return {ciclos,ageNow};
}

function renderCiclos(data){
  const {ciclos,ageNow}=data;
  const fmtD=d=>{
    if(Math.abs(d)<1) return 'Hoy';
    if(d<0) return Math.abs(d).toFixed(0)+'d atrás';
    if(Math.abs(d)<60) return d.toFixed(0)+'d';
    if(Math.abs(d)<730) return (d/30.44).toFixed(1)+'m';
    return (d/365.25).toFixed(2)+'a';
  };
  let h=`<table><tr><th>Astro</th><th>Período</th><th>Retornos</th><th>Próx. retorno</th><th>Próx. ½ retorno</th></tr>`;
  for(const c of ciclos){
    const pStr=c.periodo>=365.25?(c.periodo/365.25).toFixed(2)+' a':c.periodo.toFixed(1)+' d';
    const closeRet=Math.abs(c.edadRetSiguiente-ageNow)<0.5||Math.abs(c.edadRetAnterior-ageNow)<0.5;
    const closeMed=Math.abs(c.edadMedSig-ageNow)<0.5;
    const rowStyle=(closeRet||closeMed)?' style="background:rgba(255,220,80,0.07);"':'';
    h+=`<tr${rowStyle}>
      <td><span class="atc-glyph">${c.glyph}</span> ${c.nm}</td>
      <td style="color:rgba(255,255,255,0.55)">${pStr}</td>
      <td style="color:rgba(255,255,255,0.55)">${c.nRetornos}</td>
      <td class="${closeRet?'age':''}">${c.edadRetSiguiente.toFixed(2)} a <span style="color:rgba(255,255,255,0.40);font-size:9px;">(${fmtD(c.diasSiguiente)})</span></td>
      <td class="${closeMed?'age':''}">${c.edadMedSig.toFixed(2)} a <span style="color:rgba(255,255,255,0.40);font-size:9px;">(${fmtD(c.diasMedSig)})</span></td>
    </tr>`;
  }
  h+=`</table><div class="note">◀ Amarillo: dentro de ±6 meses de la edad actual (${ageNow.toFixed(2)} a). Retorno = planeta regresa a su longitud natal. ½ Retorno = oposición al natal.</div>`;
  return h;
}

function calcResonancias(rx, tr){
  const periodosSid={Mercurio:0.24085,Venus:0.61520,Sol:1.00000,Marte:1.88085,
                     Jupiter:11.8618,Saturno:29.4571,NodoNorte:18.5996};
  const glyphs={Sol:"☉",Mercurio:"☿",Venus:"♀",Marte:"♂",Jupiter:"♃",Saturno:"♄",NodoNorte:"☊"};
  const jdRx=rx.meta?.jd ?? rx.meta?.jd ?? rx.jd, jdTr=tr.meta?.jd ?? tr.meta?.jd ?? tr.jd;
  const ageNow=(jdTr-jdRx)/365.25;
  const pares=[['Venus','Mercurio'],['Sol','Venus'],['Marte','Sol'],['Marte','Venus'],
               ['Jupiter','Sol'],['Jupiter','Marte'],['Saturno','Jupiter'],
               ['Saturno','Sol'],['Saturno','Marte'],['NodoNorte','Saturno']];

  function fracSimple(ratio,maxQ){
    let bp=1,bq=1,be=999;
    for(let q=1;q<=maxQ;q++){const p=Math.round(ratio*q);if(p<=0)continue;const e=Math.abs(ratio-p/q);if(e<be){be=e;bp=p;bq=q;}}
    return{p:bp,q:bq,err:be};
  }

  let resonancias=[];
  for(const [a,b] of pares){
    const Pa=periodosSid[a],Pb=periodosSid[b];
    if(!Pa||!Pb) continue;
    const la_rx=rx.bodies[a]?.lon_ecl, lb_rx=rx.bodies[b]?.lon_ecl;
    if(la_rx===undefined||lb_rx===undefined) continue;
    const la=((la_rx%360)+360)%360, lb=((lb_rx%360)+360)%360;
    const la_tr=tr.bodies[a]?.lon_ecl, lb_tr=tr.bodies[b]?.lon_ecl;
    const lat=la_tr!==undefined?((la_tr%360)+360)%360:la;
    const lbt=lb_tr!==undefined?((lb_tr%360)+360)%360:lb;
    const Psyn=1/Math.abs(1/Pa-1/Pb);
    const ratio=Math.max(Pa/Pb,Pb/Pa);
    const {p,q,err}=fracSimple(ratio,16);
    const calidadRes=Math.max(0,(1-err*20))*100;
    const sepNatal=((lb-la+360)%360);
    const sepTransito=((lbt-lat+360)%360);
    const deltaSep=Math.abs(((sepTransito-sepNatal+180)%360)-180);
    const velRel=360/Psyn;
    const tiempoRetConf=deltaSep/velRel;
    const edadRetConf=ageNow+tiempoRetConf;
    const diasRet=tiempoRetConf*365.25;
    const paLabel=`${glyphs[a]||a}/${glyphs[b]||b}`;
    resonancias.push({a,b,paLabel,Pa,Pb,Psyn,ratio,p,q,err,calidadRes,
      sepNatal,sepTransito,deltaSep,tiempoRetConf,edadRetConf,diasRet,velRel});
  }
  return{resonancias,ageNow};
}

function renderResonancias(data){
  const {resonancias,ageNow}=data;
  const fmtSyn=p=>p<1?(p*365.25).toFixed(1)+'d':p.toFixed(2)+'a';
  const fmtD=d=>{if(d<1)return'Ahora';if(d<60)return d.toFixed(0)+'d';if(d<730)return(d/30.44).toFixed(1)+'m';return(d/365.25).toFixed(2)+'a';};
  let h=`<table><tr><th>Par orbital</th><th>Ciclo sinódico</th><th>Razón p:q</th><th>Sep. natal</th><th>Sep. actual</th><th>Retorno conf.</th></tr>`;
  for(const r of resonancias.sort((a,b)=>a.diasRet-b.diasRet)){
    const close=r.diasRet<730&&r.diasRet>=0;
    const rowStyle=close?' style="background:rgba(160,220,255,0.07);"':'';
    const calidadCol=r.calidadRes>75?'rgba(160,255,160,0.80)':r.calidadRes>40?'rgba(255,220,100,0.80)':'rgba(255,255,255,0.40)';
    h+=`<tr${rowStyle}>
      <td>${r.paLabel}</td>
      <td style="color:rgba(255,255,255,0.55)">${fmtSyn(r.Psyn)}</td>
      <td><span style="color:${calidadCol}">${r.p}:${r.q}</span> <span style="color:rgba(255,255,255,0.30);font-size:9px;">(${r.calidadRes.toFixed(0)}%)</span></td>
      <td style="color:rgba(255,255,255,0.55)">${r.sepNatal.toFixed(1)}°</td>
      <td style="color:rgba(255,255,255,0.55)">${r.sepTransito.toFixed(1)}°</td>
      <td class="${close?'age':''}">${r.edadRetConf.toFixed(2)} a <span style="color:rgba(255,255,255,0.35);font-size:9px;">(${fmtD(r.diasRet)})</span></td>
    </tr>`;
  }
  h+=`</table><div class="note">Razón p:q: fracción entera más simple (verde=alta resonancia orbital real). Retorno conf. = tiempo hasta recuperar la separación angular natal entre el par.</div>`;
  return h;
}

function calcLunaAtacir(rx, tr){
  const jdRx=rx.meta?.jd ?? rx.meta?.jd ?? rx.jd, jdTr=tr.meta?.jd ?? tr.meta?.jd ?? tr.jd;
  const ageNow=(jdTr-jdRx)/365.25;

  // --- Fases lunares: las 8 siguientes al JD de tránsito ---
  const fases = proximasFasesLunares(jdTr, 2);

  // --- Apsis: los 4 próximos desde tránsito ---
  const apsis = proximosApsis(jdTr, 2);

  // --- Luna en el Atacir: ciclos lunares desde el nacimiento ---
  // Ciclo lunar sinódico (mes sinódico): 29.53059 días
  const mesSin = 29.53059;
  // Retornos al signo natal de la Luna
  const lonLunaNatal = rx.bodies.Luna?.lon_ecl ?? 0;
  const eraLunarRx   = (jdRx - 2451550.09766) / mesSin; // lunación al nacimiento
  const eraLunarTr   = (jdTr - 2451550.09766) / mesSin;
  const nLunaciones   = Math.floor(eraLunarTr - eraLunarRx);

  // Próximo retorno lunar al signo natal
  // La Luna recorre 360°/29.53d → velocidad ~13.18°/d
  // Distancia al retorno: calcular elongación actual vs natal
  const lonLunaTr   = tr.bodies.Luna?.lon_ecl ?? 0;
  const lonSolTr    = tr.bodies.Sol?.lon_ecl  ?? 0;
  const lonSolRx    = rx.bodies.Sol?.lon_ecl  ?? 0;
  // Elongación eclíptica lunar: Luna - Sol
  const elongNatal  = ((lonLunaNatal - lonSolRx + 360)%360);
  const elongActual = ((lonLunaTr   - lonSolTr  + 360)%360);
  const deltaElong  = ((elongActual - elongNatal + 360) % 360);
  const diasRetElong = ((360 - deltaElong) % 360) / (360/mesSin);
  const jdProxRetElong = jdTr + diasRetElong;
  const edadProxRetElong = (jdProxRetElong - jdRx)/365.25;

  // Nodos: longitud actual vs natal
  const lonNodoNatal = rx.bodies.NodoNorte?.lon_ecl ?? 0;
  const lonNodoTr    = tr.bodies.NodoNorte?.lon_ecl ?? 0;
  // Nodo retrograda ~19.35°/año → período 18.6 años
  const velNodo = -19.35/365.25; // grados/día (retrógrado)
  const deltaNodo = ((lonNodoTr - lonNodoNatal + 360)%360);
  // Tiempo para que el nodo vuelva a la posición natal:
  const diasRetNodo = deltaNodo > 0 ? (360-deltaNodo)/Math.abs(velNodo) : Math.abs(deltaNodo/velNodo);
  const edadRetNodo = (jdTr + diasRetNodo - jdRx)/365.25;

  // Fase lunar natal (icono)
  const ilumNatal = (1 - Math.cos(elongNatal*deg2rad))/2;
  const faseNombreNatal = elongNatal<22.5?'🌑 Nueva':elongNatal<67.5?'🌒 CC':elongNatal<112.5?'🌓 1er Cuarto':
    elongNatal<157.5?'🌔 Gibosa C':elongNatal<202.5?'🌕 Llena':elongNatal<247.5?'🌖 Gibosa M':
    elongNatal<292.5?'🌗 Ult Cuarto':'🌘 CM';

  const D2R = Math.PI/180;
  // Simetría Luna-Sol: distancia angular Sol-Luna en natal
  const angSolLunaNatal = Math.min(elongNatal, 360-elongNatal);

  return {
    fases, apsis, nLunaciones, elongNatal, elongActual,
    diasRetElong, edadProxRetElong,
    lonNodoNatal, lonNodoTr, diasRetNodo, edadRetNodo,
    ilumNatal, faseNombreNatal, angSolLunaNatal, jdTr, jdRx, ageNow,
  };
}

function renderLunaAtacir(data){
  const {fases,apsis,nLunaciones,elongNatal,elongActual,diasRetElong,edadProxRetElong,
         lonNodoNatal,lonNodoTr,diasRetNodo,edadRetNodo,
         ilumNatal,faseNombreNatal,angSolLunaNatal,ageNow} = data;

  const fmtJDE = jde => {
    const d=new Date((jde-2440587.5)*86400000);
    return d.toISOString().slice(0,10)+' '+d.toISOString().slice(11,16)+'Z';
  };
  const fmtD = d => {
    if(d<0.5) return 'Hoy';
    if(d<2) return d.toFixed(1)+'d';
    if(d<60) return d.toFixed(0)+'d';
    if(d<400) return (d/30.44).toFixed(1)+'m';
    return (d/365.25).toFixed(2)+'a';
  };
  const fmtLon = l=>{const z=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];const n=((l%360)+360)%360;return z[Math.floor(n/30)]+' '+(n%30).toFixed(1)+'°';};

  let h='';

  // ── 1. Luna natal ───────────────────────────────────────────
  h+=`<div style="margin-bottom:10px;padding:8px;background:rgba(200,180,255,0.07);border-radius:6px;border:1px solid rgba(200,180,255,0.15);">
    <div style="font-size:10px;color:rgba(200,180,255,0.80);font-weight:bold;margin-bottom:4px;">☽ Luna Natal</div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:11px;color:rgba(255,255,255,0.75);">
      <span>Fase: <b>${faseNombreNatal}</b></span>
      <span>Elongación: <b>${elongNatal.toFixed(1)}°</b></span>
      <span>Iluminación: <b>${(ilumNatal*100).toFixed(0)}%</b></span>
      <span>Ángulo ☉-☽: <b>${angSolLunaNatal.toFixed(1)}°</b></span>
      <span>Lunaciones desde nac.: <b>${nLunaciones}</b></span>
    </div>
    <div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:4px;">
      Elong. actual: ${elongActual.toFixed(1)}° · Próximo retorno a elong. natal: 
      <b style="color:rgba(200,180,255,0.85)">${edadProxRetElong.toFixed(2)} a</b>
      (${fmtD(diasRetElong)})
    </div>
  </div>`;

  // ── 2. Nodos ──────────────────────────────────────────────
  const closeNodo = (edadRetNodo - ageNow) < 2 && (edadRetNodo - ageNow) > 0;
  h+=`<div style="margin-bottom:10px;padding:8px;background:rgba(255,220,100,0.06);border-radius:6px;border:1px solid rgba(255,220,100,0.13);">
    <div style="font-size:10px;color:rgba(255,220,100,0.80);font-weight:bold;margin-bottom:4px;">☊ Nodos Lunares</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.70);">
      Nodo Norte natal: <b>${fmtLon(lonNodoNatal)}</b> &nbsp;·&nbsp;
      Nodo Norte actual: <b>${fmtLon(lonNodoTr)}</b>
    </div>
    <div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:4px;">
      Retorno nodal: <b style="color:${closeNodo?'rgba(255,220,80,0.95)':'rgba(255,220,100,0.75)'}">${edadRetNodo.toFixed(2)} a</b>
      (${fmtD(diasRetNodo)}) — ciclo ~18.6 años
    </div>
  </div>`;

  // ── 3. Próximas fases ─────────────────────────────────────
  h+=`<div style="margin-bottom:10px;">
    <div style="font-size:10px;color:rgba(160,220,255,0.80);font-weight:bold;margin-bottom:6px;">☽ Próximas Fases Lunares</div>
    <table><tr><th>Fase</th><th>Fecha UTC</th><th>En</th></tr>`;
  for(const f of fases){
    h+=`<tr>
      <td>${f.icono} ${f.nombre}</td>
      <td style="color:rgba(255,255,255,0.60);font-size:10px;">${fmtJDE(f.jde)}</td>
      <td class="${f.dias<3?'age':''}">${fmtD(f.dias)}</td>
    </tr>`;
  }
  h+=`</table></div>`;

  // ── 4. Perigeo / Apogeo ───────────────────────────────────
  h+=`<div>
    <div style="font-size:10px;color:rgba(180,255,200,0.80);font-weight:bold;margin-bottom:6px;">🌍 Perigeo / Apogeo Próximos</div>
    <table><tr><th>Tipo</th><th>Fecha UTC</th><th>Distancia</th><th>En</th></tr>`;
  for(const a of apsis){
    const pct=((a.dist/384400-1)*100);
    const col=a.tipo==='Perigeo'?'rgba(255,160,120,0.80)':'rgba(200,230,255,0.70)';
    h+=`<tr>
      <td>${a.icono} ${a.tipo}</td>
      <td style="color:rgba(255,255,255,0.60);font-size:10px;">${fmtJDE(a.jde)}</td>
      <td style="color:${col}">${a.dist.toFixed(0)} km <span style="font-size:9px;color:rgba(255,255,255,0.40);">(${pct>0?'+':''}${pct.toFixed(1)}%)</span></td>
      <td>${fmtD(a.dias)}</td>
    </tr>`;
  }
  h+=`</table>
    <div class="note" style="margin-top:4px;">Distancia media: 384,400 km. Perigeo = Luna más cercana (superluna si es llena). % respecto a distancia media.</div>
  </div>`;

  return h;
}

function calcAtacir(){
  // Leer inputs
  let rxDate = document.getElementById("rx-date").value;
  let rxTime = document.getElementById("rx-time").value || "12:00";
  let rxLat  = parseFloat(document.getElementById("rx-lat").value);
  let rxLon  = parseFloat(document.getElementById("rx-lon").value);
  let trDate = document.getElementById("tr-date").value;
  let trTime = document.getElementById("tr-time").value || "12:00";
  let trLat  = parseFloat(document.getElementById("tr-lat").value);
  let trLon  = parseFloat(document.getElementById("tr-lon").value);
  let key    = parseFloat(document.getElementById("atc-key").value);

  if(!rxDate||!trDate||isNaN(rxLat)||isNaN(rxLon)||isNaN(trLat)||isNaN(trLon)){
    document.getElementById("atacirResults").innerHTML =
      '<p style="color:rgba(255,120,100,0.8);font-size:11px;">⚠ Complete todos los campos.</p>';
    return;
  }

  // Convertir fechas a JD
  function dateToJD(dateStr, timeStr){
    let dt = new Date(`${dateStr}T${timeStr}:00Z`);
    return dt.getTime()/86400000 + 2440587.5;
  }
  let jdRx = dateToJD(rxDate, rxTime);
  let jdTr = dateToJD(trDate, trTime);

  // Snapshots
  let rx = getSnapshotAt(jdRx, rxLat, rxLon);
  let tr = getSnapshotAt(jdTr, trLat, trLon);

  // Preview Radix
  document.getElementById("rx-preview").textContent =
    `JD ${jdRx.toFixed(2)} · ASC ${rx.houses.asc.toFixed(1)}° · MC ${rx.houses.mc.toFixed(1)}°`;

  // Cuerpos a considerar como promissores
  const glyphs = {Sol:"☉",Luna:"☽",Mercurio:"☿",Venus:"♀",Marte:"♂",
                  Jupiter:"♃",Saturno:"♄",NodoNorte:"☊",NodoSur:"☋"};
  const names  = Object.keys(glyphs);

  // Significadores: ASC y MC del Radix
  let sigASC = {
    name:"ASC",
    ra:  eclipticLonToRaDec(rx.houses.asc).ra*rad2deg,
    dec: eclipticLonToRaDec(rx.houses.asc).dec*rad2deg
  };
  let sigMC = {
    name:"MC",
    ra:  eclipticLonToRaDec(rx.houses.mc).ra*rad2deg,
    dec: eclipticLonToRaDec(rx.houses.mc).dec*rad2deg
  };

  // Calcular arcos para cada promissor → ASC y MC del Radix
  let rows = [];
  for(let nm of names){
    let b = rx.bodies[nm];
    if(!b) continue;

    // OA del promissor en Radix
    let oaProm = obliqAscension(b.ra, b.dec, rxLat);

    // OA del ASC radix
    let oaASC  = obliqAscension(sigASC.ra, sigASC.dec, rxLat);
    // OA del MC radix
    let oaMC   = obliqAscension(sigMC.ra,  sigMC.dec,  rxLat);

    // Arco de dirección = promissor − significador (módulo 360)
    let arcASC = ((oaProm - oaASC)+360)%360;
    let arcMC  = ((oaProm - oaMC )+360)%360;
    // Normalizar: arcos > 180° se interpretan como retrógrados (-360+arc)
    if(arcASC > 180) arcASC -= 360;
    if(arcMC  > 180) arcMC  -= 360;

    let ageASC = arcASC / key;
    let ageMC  = arcMC  / key;

    rows.push({glyph:glyphs[nm], name:nm, arcASC, arcMC, ageASC, ageMC});
  }

  // Edad del nativo en el momento del tránsito
  let ageNow = (jdTr - jdRx)/365.25;

  // Renderizar tabla
  let html = `
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
    <span style="font-size:11px;color:rgba(220,180,80,0.80);">
      Radix: <b>${rxDate} ${rxTime} UTC</b> · ${rxLat.toFixed(2)}°, ${rxLon.toFixed(2)}°
    </span>
    <span style="font-size:11px;color:rgba(160,220,160,0.80);">
      Edad actual: <b>${ageNow.toFixed(2)} años</b>
    </span>
  </div>
  <table>
    <tr>
      <th>Astro</th>
      <th>λ Natal</th>
      <th>Arco → ASC</th><th>Edad → ASC</th>
      <th>Arco → MC</th><th>Edad → MC</th>
    </tr>`;

  for(let r of rows){
    let b = rx.bodies[r.name];
    let lonStr = b ? b.lon_ecl.toFixed(1)+"°" : "—";

    let fmtArc = (a)=> a >= 0
      ? `<td class="arc">+${a.toFixed(2)}°</td>`
      : `<td class="arc" style="color:rgba(200,140,100,0.9)">${a.toFixed(2)}°</td>`;
    let fmtAge = (a)=>{
      let diff = a - ageNow;
      let cls  = Math.abs(diff) < 2 ? "age" : "";
      let mark = Math.abs(diff) < 2 ? " ◀" : "";
      return `<td class="${cls}">${a.toFixed(2)} a${mark}</td>`;
    };

    html += `<tr>
      <td><span class="atc-glyph">${r.glyph}</span> ${r.name}</td>
      <td style="color:rgba(255,255,255,0.55)">${lonStr}</td>
      ${fmtArc(r.arcASC)}${fmtAge(r.ageASC)}
      ${fmtArc(r.arcMC)}${fmtAge(r.ageMC)}
    </tr>`;
  }

  html += `</table>
  <div class="note">
    ◀ Eventos dentro de ±2 años de la edad actual (${ageNow.toFixed(1)} años).
    Clave: ${key} · Método: Ascensión oblicua (Ptolomeo/Al-Biruni).
    Nodos: ☊ Caput (Norte) · ☋ Cauda (Sur).
  </div>`;

  // Calcular aspectos
  let aspNatales  = calcAspectosNatales(rx);
  let aspTransito = calcAspectosTransito(rx, tr);

  // Guardar para exportación (después de calcular aspectos)
  window._lastAtacir = { rx, tr, aspNatales, aspTransito, ageNow, key,
    rxDate, rxTime, rxLat, rxLon, trDate, trTime, trLat, trLon };

  // HTML de aspectos natales
  let htmlNatales  = _renderTablaAspectos(aspNatales,
    "Planeta A", "Planeta B", "Sin aspectos mayores en el Radix.");
  // HTML de aspectos de tránsito
  let htmlTransito = _renderTablaAspectos(aspTransito,
    "Tránsito", "Natal", "Sin aspectos de tránsito activos.");

  // Montar resultado con tabs
  // Calcular las 3 nuevas secciones
  let simData      = calcSimetrias(rx);
  let ciclosData   = calcCiclos(rx, tr);
  let resonData    = calcResonancias(rx, tr);
  let lunaData     = calcLunaAtacir(rx, tr);
  let htmlLuna     = renderLunaAtacir(lunaData);
  let htmlSim      = renderSimetrias(simData);
  let htmlCiclos   = renderCiclos(ciclosData);
  let htmlReson    = renderResonancias(resonData);

  html += `
  <div id="aspTabs" style="margin-top:14px;border-top:1px solid rgba(255,255,255,0.07);padding-top:10px;">
    <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
      <button onclick="showAspTab('natal')" id="tabNatal"
        style="flex:1;min-width:90px;background:rgba(220,180,80,0.15);border:1px solid rgba(220,180,80,0.40);
               color:rgba(220,180,80,0.95);border-radius:6px;padding:4px 0;
               cursor:pointer;font-family:'Georgia',serif;font-size:10px;">
        ✦ Asp. Natales (${aspNatales.length})
      </button>
      <button onclick="showAspTab('transito')" id="tabTransito"
        style="flex:1;min-width:90px;background:rgba(160,220,255,0.08);border:1px solid rgba(160,220,255,0.25);
               color:rgba(160,220,255,0.80);border-radius:6px;padding:4px 0;
               cursor:pointer;font-family:'Georgia',serif;font-size:10px;">
        ⊙ Asp. Tránsito (${aspTransito.length})
      </button>
      <button onclick="showAspTab('simetrias')" id="tabSimetrias"
        style="flex:1;min-width:90px;background:rgba(255,200,100,0.08);border:1px solid rgba(255,200,100,0.28);
               color:rgba(255,200,120,0.85);border-radius:6px;padding:4px 0;
               cursor:pointer;font-family:'Georgia',serif;font-size:10px;">
        ⟷ Simetrías
      </button>
      <button onclick="showAspTab('ciclos')" id="tabCiclos"
        style="flex:1;min-width:90px;background:rgba(180,160,255,0.08);border:1px solid rgba(180,160,255,0.28);
               color:rgba(200,185,255,0.85);border-radius:6px;padding:4px 0;
               cursor:pointer;font-family:'Georgia',serif;font-size:10px;">
        ↺ Ciclos
      </button>
      <button onclick="showAspTab('resonancias')" id="tabResonancias"
        style="flex:1;min-width:90px;background:rgba(120,255,180,0.08);border:1px solid rgba(120,255,180,0.28);
               color:rgba(150,255,200,0.85);border-radius:6px;padding:4px 0;
               cursor:pointer;font-family:'Georgia',serif;font-size:10px;">
        ∿ Resonancias
      </button>
      <button onclick="showAspTab('luna')" id="tabLuna"
        style="flex:1;min-width:90px;background:rgba(200,180,255,0.08);border:1px solid rgba(200,180,255,0.28);
               color:rgba(210,195,255,0.85);border-radius:6px;padding:4px 0;
               cursor:pointer;font-family:'Georgia',serif;font-size:10px;">
        ☽ Luna
      </button>
    </div>
    <div id="aspTabNatal">${htmlNatales}</div>
    <div id="aspTabTransito" style="display:none;">${htmlTransito}</div>
    <div id="aspTabSimetrias" style="display:none;">${htmlSim}</div>
    <div id="aspTabCiclos"    style="display:none;">${htmlCiclos}</div>
    <div id="aspTabResonancias" style="display:none;">${htmlReson}</div>
    <div id="aspTabLuna" style="display:none;">${htmlLuna}</div>
  </div>

  <div style="display:flex;gap:8px;margin-top:12px;border-top:1px solid rgba(255,255,255,0.07);padding-top:10px;">
    <button onclick="exportarJSON()" class="atc-btn" style="flex:1;background:rgba(100,200,150,0.10);border-color:rgba(100,200,150,0.35);color:rgba(140,220,180,0.95);">
      ⬇ Exportar JSON
    </button>
    <button onclick="exportarTexto()" class="atc-btn" style="flex:1;background:rgba(180,160,255,0.10);border-color:rgba(180,160,255,0.35);color:rgba(200,185,255,0.95);">
      📋 Copiar texto
    </button>
  </div>`;

  document.getElementById("atacirResults").innerHTML = html;
}

function showAspTab(tab){
  // Mostrar panel activo
  ['natal','transito','simetrias','ciclos','resonancias','luna'].forEach(t=>{
    const el=document.getElementById('aspTab'+t.charAt(0).toUpperCase()+t.slice(1));
    if(el) el.style.display = t===tab ? '' : 'none';
  });
  // Highlight botón activo
  const tabMap={natal:'tabNatal',transito:'tabTransito',simetrias:'tabSimetrias',ciclos:'tabCiclos',resonancias:'tabResonancias',luna:'tabLuna'};
  const bgMap ={natal:'rgba(220,180,80,0.30)',transito:'rgba(160,220,255,0.20)',simetrias:'rgba(255,200,100,0.22)',ciclos:'rgba(180,160,255,0.22)',resonancias:'rgba(120,255,180,0.20)',luna:'rgba(200,180,255,0.25)'};
  const bgOff ={natal:'rgba(220,180,80,0.15)',transito:'rgba(160,220,255,0.08)',simetrias:'rgba(255,200,100,0.08)',ciclos:'rgba(180,160,255,0.08)',resonancias:'rgba(120,255,180,0.08)',luna:'rgba(200,180,255,0.08)'};
  Object.entries(tabMap).forEach(([t,id])=>{
    const btn=document.getElementById(id);
    if(btn) btn.style.background = t===tab ? bgMap[t] : bgOff[t];
  });
}

function toggleAtacirPanel(){
  let p = document.getElementById("atacirPanel");
  let b = document.getElementById("btnAtacir");
  p.classList.toggle("open");
  let open = p.classList.contains("open");
  if(b){ b.style.background   = open ? "rgba(220,180,80,0.18)" : ""; }
  if(b){ b.style.borderColor  = open ? "rgba(220,180,80,0.50)" : ""; }
  if(open) syncTransitoNow();
}

function toggleNatal(){
  if(!modoNatal){
    _activarNatal();
  } else {
    _desactivarNatal();
  }
}

function syncTransitoNow(){
  let now = new Date();
  let d = now.toISOString().slice(0,10);
  let h = now.toISOString().slice(11,16);
  document.getElementById("tr-date").value = d;
  document.getElementById("tr-time").value = h;
  document.getElementById("tr-lat").value  = (lat*rad2deg).toFixed(3);
  document.getElementById("tr-lon").value  = (lon*rad2deg).toFixed(3);
}

function exportarJSON(){
  let d = window._lastAtacir;
  if(!d){ alert("Primero calcula el Atacir."); return; }

  const glyphs = {Sol:"☉",Luna:"☽",Mercurio:"☿",Venus:"♀",Marte:"♂",
                  Jupiter:"♃",Saturno:"♄",NodoNorte:"☊",NodoSur:"☋"};

  // Construir objeto limpio y legible
  let out = {
    motor:   "Caelis Engine 1.0",
    exportado: new Date().toISOString(),

    radix: {
      fecha:    `${d.rxDate} ${d.rxTime} UTC`,
      jd:       d.rx.meta.jd,
      lat:      d.rxLat,
      lon:      d.rxLon,
      lst:      d.rx.meta.lst_deg.toFixed(4),
      oblicuidad: d.rx.meta.obliquity.toFixed(6),
      casas: {
        sistema: "iguales",
        asc:     d.rx.houses.asc.toFixed(4),
        mc:      d.rx.houses.mc.toFixed(4),
        cuspides: d.rx.houses.cusps.map((c,i)=>({
          casa: i+1, lon: c.toFixed(4), signo: _fmtLon(c)
        }))
      },
      cuerpos: Object.fromEntries(
        Object.entries(d.rx.bodies).map(([nm, b])=>[nm, {
          glifo:      glyphs[nm]||"",
          ra:         b.ra.toFixed(6),
          dec:        b.dec.toFixed(6),
          lon_ecl:    b.lon_ecl.toFixed(6),
          lat_ecl:    b.lat_ecl.toFixed(6),
          signo:      _fmtLon(b.lon_ecl),
          alt:        b.alt.toFixed(4),
          az:         b.az.toFixed(4),
          casa:       b.house,
          visible:    b.visible
        }])
      ),
      luna: d.rx.luna
    },

    transito: {
      fecha:    `${d.trDate} ${d.trTime} UTC`,
      jd:       d.tr.meta.jd,
      lat:      d.trLat,
      lon:      d.trLon,
      edad_anos: d.ageNow.toFixed(4),
      casas: {
        asc: d.tr.houses.asc.toFixed(4),
        mc:  d.tr.houses.mc.toFixed(4)
      },
      cuerpos: Object.fromEntries(
        Object.entries(d.tr.bodies).map(([nm, b])=>[nm, {
          glifo:   glyphs[nm]||"",
          lon_ecl: b.lon_ecl.toFixed(6),
          signo:   _fmtLon(b.lon_ecl),
          alt:     b.alt.toFixed(4),
          casa:    b.house,
          visible: b.visible
        }])
      )
    },

    atacir: {
      clave:  d.key,
      metodo: "Ascensión oblicua (Ptolomeo/Al-Biruni)",
      // Re-calcular arcos para incluirlos en el JSON
      direcciones: (()=>{
        const names = Object.keys(glyphs);
        let dirs = [];
        for(let nm of names){
          let b = d.rx.bodies[nm];
          if(!b) continue;
          let oaProm = obliqAscension(b.ra, b.dec, d.rxLat);
          let oaASC  = obliqAscension(
            d.rx.houses.asc, eclipticLonToRaDec(d.rx.houses.asc).dec*rad2deg, d.rxLat);
          let oaMC   = obliqAscension(
            d.rx.houses.mc,  eclipticLonToRaDec(d.rx.houses.mc).dec*rad2deg,  d.rxLat);
          let arcASC = ((oaProm-oaASC)+360)%360; if(arcASC>180) arcASC-=360;
          let arcMC  = ((oaProm-oaMC )+360)%360; if(arcMC >180) arcMC -=360;
          dirs.push({
            promissor: nm, glifo: glyphs[nm],
            arco_asc:  +arcASC.toFixed(4), edad_asc: +(arcASC/d.key).toFixed(4),
            arco_mc:   +arcMC.toFixed(4),  edad_mc:  +(arcMC /d.key).toFixed(4)
          });
        }
        return dirs;
      })()
    },

    aspectos_natales: d.aspNatales.map(a=>({
      a: a.nmA, b: a.nmB, aspecto: a.asp,
      angulo: a.angulo, orbe: +a.orb, exactitud: +(a.exactitud*100).toFixed(1)
    })),

    aspectos_transito: d.aspTransito.map(a=>({
      transito: a.nmTr, natal: a.nmRx, aspecto: a.asp,
      angulo: a.angulo, orbe: +a.orb, exactitud: +(a.exactitud*100).toFixed(1)
    }))
  };

  let json = JSON.stringify(out, null, 2);
  let nombre = `caelis_radix_${d.rxDate}_${d.rxTime.replace(":","h")}.json`;
  _descargaArchivo(json, nombre, "application/json");
}

function exportarTexto(){
  let d = window._lastAtacir;
  if(!d){ alert("Primero calcula el Atacir."); return; }

  const glyphs = {Sol:"☉",Luna:"☽",Mercurio:"☿",Venus:"♀",Marte:"♂",
                  Jupiter:"♃",Saturno:"♄",NodoNorte:"☊",NodoSur:"☋"};
  const pad = (s,n)=> String(s).padEnd(n);
  const padL= (s,n)=> String(s).padStart(n);

  let t = [];
  t.push("╔══════════════════════════════════════════════════════╗");
  t.push("║            C A E L I S   E N G I N E  1.0           ║");
  t.push("║                  Carta Natal — Radix                 ║");
  t.push("╚══════════════════════════════════════════════════════╝");
  t.push("");
  t.push(`  Fecha natal : ${d.rxDate}  ${d.rxTime} UTC`);
  t.push(`  Lugar natal : ${d.rxLat.toFixed(3)}°,  ${d.rxLon.toFixed(3)}°`);
  t.push(`  JD          : ${d.rx.meta.jd.toFixed(4)}`);
  t.push(`  ASC         : ${_fmtLon(d.rx.houses.asc)}  (${d.rx.houses.asc.toFixed(2)}°)`);
  t.push(`  MC          : ${_fmtLon(d.rx.houses.mc)}   (${d.rx.houses.mc.toFixed(2)}°)`);
  t.push(`  Oblicuidad  : ${d.rx.meta.obliquity.toFixed(4)}°`);
  t.push("");
  t.push("  ── POSICIONES NATALES ─────────────────────────────");
  t.push(`  ${"Astro".padEnd(12)} ${"Signo".padEnd(10)} ${"λ eclíp.".padEnd(10)} ${"Alt".padEnd(7)} Casa`);
  t.push("  " + "─".repeat(48));

  for(let [nm, b] of Object.entries(d.rx.bodies)){
    let g = glyphs[nm]||" ";
    t.push(`  ${(g+" "+nm).padEnd(12)} ${_fmtLon(b.lon_ecl).padEnd(10)} ${b.lon_ecl.toFixed(2).padEnd(10)}° ${b.alt.toFixed(1).padStart(6)}°  ${b.house}`);
  }

  t.push("");
  t.push("  ── ASPECTOS NATALES ────────────────────────────────");
  if(d.aspNatales.length === 0){
    t.push("  Sin aspectos mayores.");
  } else {
    for(let a of d.aspNatales){
      let ex = (a.exactitud*100).toFixed(0);
      t.push(`  ${(glyphs[a.nmA]+" "+a.nmA).padEnd(14)} ${a.sim.padEnd(3)} ${(glyphs[a.nmB]+" "+a.nmB).padEnd(14)}  orbe ${a.orb}°  (${ex}%)`);
    }
  }

  t.push("");
  t.push("  ── TRÁNSITO ────────────────────────────────────────");
  t.push(`  Fecha tránsito : ${d.trDate}  ${d.trTime} UTC`);
  t.push(`  Lugar tránsito : ${d.trLat.toFixed(3)}°,  ${d.trLon.toFixed(3)}°`);
  t.push(`  Edad           : ${d.ageNow.toFixed(2)} años`);

  t.push("");
  t.push("  ── ASPECTOS DE TRÁNSITO ACTIVOS ────────────────────");
  if(d.aspTransito.length === 0){
    t.push("  Sin aspectos de tránsito activos.");
  } else {
    for(let a of d.aspTransito){
      let ex = (a.exactitud*100).toFixed(0);
      t.push(`  TR ${(glyphs[a.nmTr]+" "+a.nmTr).padEnd(12)} ${a.sim.padEnd(3)} RX ${(glyphs[a.nmRx]+" "+a.nmRx).padEnd(12)}  orbe ${a.orb}°  (${ex}%)`);
    }
  }

  t.push("");
  t.push("  ── ATACIR ──────────────────────────────────────────");
  t.push(`  Clave: ${d.key} (${d.key===1?"Ptolomeo":d.key===0.8219?"Naibod":"Solar"})`);
  t.push(`  ${"Promissor".padEnd(14)} ${"→ ASC arc".padEnd(12)} ${"Edad ASC".padEnd(12)} ${"→ MC arc".padEnd(12)} Edad MC`);
  t.push("  " + "─".repeat(60));

  const names = Object.keys(glyphs);
  for(let nm of names){
    let b = d.rx.bodies[nm];
    if(!b) continue;
    let oaProm = obliqAscension(b.ra, b.dec, d.rxLat);
    let oaASC  = obliqAscension(eclipticLonToRaDec(d.rx.houses.asc).ra*rad2deg,
                                eclipticLonToRaDec(d.rx.houses.asc).dec*rad2deg, d.rxLat);
    let oaMC   = obliqAscension(eclipticLonToRaDec(d.rx.houses.mc).ra*rad2deg,
                                eclipticLonToRaDec(d.rx.houses.mc).dec*rad2deg,  d.rxLat);
    let arcASC = ((oaProm-oaASC)+360)%360; if(arcASC>180) arcASC-=360;
    let arcMC  = ((oaProm-oaMC)+360)%360;  if(arcMC>180)  arcMC-=360;
    let mark = (x)=> Math.abs(x/d.key - d.ageNow) < 2 ? " ◀" : "";
    t.push(`  ${(glyphs[nm]+" "+nm).padEnd(14)} ${(arcASC>=0?"+":"")+arcASC.toFixed(2)+"°".padEnd(10)} ${(arcASC/d.key).toFixed(2)+" a"+(mark(arcASC)).padEnd(8)} ${(arcMC>=0?"+":"")+arcMC.toFixed(2)+"°".padEnd(10)} ${(arcMC/d.key).toFixed(2)+" a"+mark(arcMC)}`);
  }

  t.push("");
  t.push("  ◀ = dentro de ±2 años de la edad actual");
  t.push(`  Exportado: ${new Date().toISOString()}`);
  t.push("  Motor: Caelis Engine 1.0 — VSOP87 / ELP-Meeus");
  t.push("");

  let texto = t.join("\n");

  // Intentar copiar al portapapeles; si falla, descargar como .txt
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(texto).then(()=>{
      _flashBtn("Copiado ✓");
    }).catch(()=>{
      _descargaArchivo(texto, `caelis_radix_${d.rxDate}.txt`, "text/plain");
    });
  } else {
    _descargaArchivo(texto, `caelis_radix_${d.rxDate}.txt`, "text/plain");
  }
}


// ── API pública del módulo ───────────────────────────────────────
const Atacir = {
  // Panel
  HTML: ATACIR_HTML,
  CSS:  ATACIR_CSS,

  // Motor de cálculo
  calcAtacir,
  calcAspectosNatales,
  calcAspectosTransito,
  calcSimetrias,
  calcCiclos,
  calcResonancias,
  calcLunaAtacir,

  // Renderizado
  renderSimetrias,
  renderCiclos,
  renderResonancias,
  renderLunaAtacir,
  _renderTablaAspectos,

  // UI
  showAspTab,
  toggleAtacirPanel,
  toggleNatal,
  syncTransitoNow,
  exportarJSON,
  exportarTexto,

  /**
   * Inyecta el panel Atacir en el DOM y registra sus estilos.
   * @param {string} containerId — ID del elemento donde insertar el panel
   */
  mount(containerId = 'body') {
    // Inyectar CSS
    if (!document.getElementById('atacir-styles')) {
      const style = document.createElement('style');
      style.id = 'atacir-styles';
      style.textContent = ATACIR_CSS;
      document.head.appendChild(style);
    }
    // Inyectar HTML
    if (!document.getElementById('atacirPanel')) {
      const container = containerId === 'body'
        ? document.body
        : document.getElementById(containerId);
      if (container) {
        const div = document.createElement('div');
        div.innerHTML = ATACIR_HTML;
        container.appendChild(div.firstElementChild);
      }
    }
  },
};

// ── Exportación universal ────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Atacir;
} else if (typeof window !== 'undefined') {
  window.Atacir = Atacir;
}
