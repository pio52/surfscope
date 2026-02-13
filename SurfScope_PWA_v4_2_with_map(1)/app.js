/* SurfScope PWA v3
   - Global surf + marine dashboard
   - Source: Open-Meteo Marine + Weather
   - Works as a static site (GitHub Pages / Netlify / etc.)
*/
(() => {
  "use strict";

  const API = {
    geocode: "https://geocoding-api.open-meteo.com/v1/search",
    marine: "https://marine-api.open-meteo.com/v1/marine",
    weather: "https://api.open-meteo.com/v1/forecast"
  };

  const MARINE_ALL = [
    "wave_height","wave_direction","wave_period",
    "wind_wave_height","wind_wave_direction","wind_wave_period",
    "swell_wave_height","swell_wave_direction","swell_wave_period",
    "secondary_swell_wave_height","secondary_swell_wave_direction","secondary_swell_wave_period",
    "sea_level_height_msl",
    "sea_surface_temperature",
    "ocean_current_velocity","ocean_current_direction"
  ];

  const MARINE_WAVES = [
    "wave_height","wave_direction","wave_period",
    "wind_wave_height","wind_wave_direction","wind_wave_period",
    "swell_wave_height","swell_wave_direction","swell_wave_period",
    "secondary_swell_wave_height","secondary_swell_wave_direction","secondary_swell_wave_period",
    "sea_level_height_msl"
  ];

  const MARINE_CURRENTS = ["ocean_current_velocity","ocean_current_direction"];
  const MARINE_SST = ["sea_surface_temperature"];

  const WEATHER_HOURLY = ["wind_speed_10m","wind_direction_10m","wind_gusts_10m"];

  const LS_KEY = "surfscope:v3";

  const DEFAULT_STATE = {
    favorites: [],
    alerts: [],
    last: { spot: null, data: null, fetchedAt: null, modelInfo: null },
    settings: {
      lang: "en",
      waveUnit: "m",       // m | ft
      windUnit: "kmh",     // kmh | mph | kts
      tempUnit: "c",       // c | f
      ratingMode: "both",  // both | badge | stars
      tz: "auto",
      waveModel: "auto",   // auto | ncep_gfswave025 | ecmwf_wam025 | meteofrance_wave | dwd_gwam | dwd_ewam
      mergeExtras: "on",   // on | off
      alertCheckMinutes: 30,
      alertCooldownMinutes: 180,
    },
    alertRuntime: { lastFired: {}, lastCheckAt: 0 }
  };

  function $(id){ return document.getElementById(id); }

  // ---- i18n ----
  const I18N = {
    en: {
      brandSub: "Global surf + marine dashboard",
      tabDash: "Dashboard",
      tabForecast: "Forecast",
      tabFavorites: "Favorites",
      tabAlerts: "Alerts",
      tabSettings: "Settings",
      lblSearch: "Search anywhere",
      btnSearch: "Search",
      btnLoad: "Load",
      searchHint: "Tip: pick from results, then tap “Load”.",
      sourceNote: "Source: Open‑Meteo Marine + Weather",
      pillSummary: "Summary",
      pillChart: "Chart",
      kWave: "Significant wave (Hs)",
      kSwell: "Primary swell",
      kWind: "Wind (10m)",
      kTide: "Sea level (tide proxy)",
      kNextTides: "Next tides (approx)",
      kSurfIdx: "Surf rating",
      pillTable: "Hourly table",
      thTime: "Time",
      thSwell: "Swell",
      thSwell2: "2° Swell",
      thWindSea: "Wind-sea",
      thWind: "Wind",
      thTide: "Sea lvl",
      thCurr: "Current",
      thIndex: "SurfIdx",
      pillFavs: "Favorites",
      favHint: "Tap a favorite to load it.",
      pillAlerts: "Alerts",
      alertHint: "Alerts run while the app is open (iOS/desktop browsers limit background checks).",
      btnEnableNotifs: "Enable notifications",
      btnRunChecks: "Run checks now",
      kNewAlert: "New alert (for one or many spots)",
      kAlertSpots: "Apply to spots",
      alertSpotsHint: "Choose one or more favorites, or leave empty to use the current spot.",
      lblAllFavs: "All favorites",
      alertMultiTip: "Tip: on mobile, tap and hold to multi-select.",
      alertIdxTip: "SurfIdx ≈ Hs² × swellPeriod (simple energy proxy)",
      windDirTip: "Wind direction is where the wind is coming from (meteorological).",
      btnCreateAlert: "Create alert",
      pillSettings: "Settings",
      settingsHint: "Stored locally on this device.",
      kDisplay: "Display",
      lblLanguage: "Language",
      lblWaveUnit: "Wave unit",
      lblWindUnit: "Wind speed unit",
      lblTempUnit: "Temperature unit",
      lblRatingMode: "Surf rating display",
      lblTZ: "Timezone",
      kAlertsSettings: "Alerts",
      lblCheckEvery: "Auto-check every (minutes)",
      lblCooldown: "Cooldown per alert (minutes)",
      pushNote: "Background push notifications require a server + Web Push setup. This app does in‑app checks.",
      kBackup: "Backup",
      footerNote: "Made for quick global checks. Not for navigation.",
      ready: "Ready",
      loading: "Loading…",
      searched: "Results ready",
      addedFav: "Added to favorites",
      removedFav: "Removed from favorites",
      notifsEnabled: "Notifications enabled",
      notifsDenied: "Notifications denied",
      noSpot: "No spot loaded yet.",
      alertCreated: "Alert created",
      alertDeleted: "Alert deleted",
      exportOK: "Exported",
      importOK: "Imported",
      resetOK: "Reset done",
      compareEmpty: "Add favorites to compare.",
      compareRunning: "Checking favorites…",
      compareDone: "Compare ready",
      relOffshore: "Offshore",
      relOnshore: "Onshore",
      relSide: "Side",
      relUnknown: "No spot orientation set",
      edit: "Edit",
      load: "Load",
      remove: "Remove",
      shareTitle: "SurfScope forecast",
      minHs: "min Hs",
      minSwellH: "min Swell H",
      maxWind: "max Wind",
      tabMap: "Map",
      pillMap: "Map",
      mapHint: "Tap the map to pin a location. Tap a favorite marker to load.",
      mapPinned: "Pinned:",
      btnMapToLast: "Center on current spot",
      btnMapShowFavs: "Show favorites",
      btnMapLoad: "Load pinned",
      mapNote: "This is a base map for selecting coordinates. “Windy-style” animated overlays require a separate map data provider."
    },
    es: {
      brandSub: "Dashboard global de surf + mar",
      tabDash: "Inicio",
      tabForecast: "Pronóstico",
      tabFavorites: "Favoritos",
      tabAlerts: "Alertas",
      tabSettings: "Ajustes",
      lblSearch: "Buscar en cualquier lugar",
      btnSearch: "Buscar",
      btnLoad: "Cargar",
      searchHint: "Tip: elige un resultado y luego “Cargar”.",
      sourceNote: "Fuente: Open‑Meteo Marine + Weather",
      pillSummary: "Resumen",
      pillChart: "Gráfica",
      kWave: "Ola significativa (Hs)",
      kSwell: "Swell primario",
      kWind: "Viento (10m)",
      kTide: "Nivel del mar (proxy marea)",
      kNextTides: "Próximas mareas (aprox)",
      kSurfIdx: "Rating de surf",
      pillTable: "Tabla horaria",
      thTime: "Hora",
      thSwell: "Swell",
      thSwell2: "2° Swell",
      thWindSea: "Wind‑sea",
      thWind: "Viento",
      thTide: "Nivel mar",
      thCurr: "Corriente",
      thIndex: "SurfIdx",
      pillFavs: "Favoritos",
      favHint: "Toca un favorito para cargarlo.",
      pillAlerts: "Alertas",
      alertHint: "Las alertas corren mientras la app está abierta (iOS/desktop limita checks en fondo).",
      btnEnableNotifs: "Activar notificaciones",
      btnRunChecks: "Revisar ahora",
      kNewAlert: "Nueva alerta (para uno o varios spots)",
      kAlertSpots: "Aplicar a spots",
      alertSpotsHint: "Elige uno o más favoritos, o déjalo vacío para usar el spot actual.",
      lblAllFavs: "Todos los favoritos",
      alertMultiTip: "Tip: en móvil, mantén presionado para multi-selección.",
      alertIdxTip: "SurfIdx ≈ Hs² × Periodo de swell (proxy simple)",
      windDirTip: "La dirección del viento es de dónde viene (meteorológico).",
      btnCreateAlert: "Crear alerta",
      pillSettings: "Ajustes",
      settingsHint: "Guardado local en este dispositivo.",
      kDisplay: "Pantalla",
      lblLanguage: "Idioma",
      lblWaveUnit: "Unidad de ola",
      lblWindUnit: "Unidad de viento",
      lblTempUnit: "Unidad de temperatura",
      lblRatingMode: "Mostrar rating",
      lblTZ: "Zona horaria",
      kAlertsSettings: "Alertas",
      lblCheckEvery: "Revisar cada (minutos)",
      lblCooldown: "Enfriamiento por alerta (minutos)",
      pushNote: "Para notificaciones en segundo plano se necesita servidor + Web Push. Esta app revisa dentro de la app.",
      kBackup: "Respaldo",
      footerNote: "Hecho para checks rápidos. No es para navegación.",
      ready: "Listo",
      loading: "Cargando…",
      searched: "Resultados listos",
      addedFav: "Agregado a favoritos",
      removedFav: "Quitado de favoritos",
      notifsEnabled: "Notificaciones activadas",
      notifsDenied: "Notificaciones rechazadas",
      noSpot: "Aún no hay spot cargado.",
      alertCreated: "Alerta creada",
      alertDeleted: "Alerta eliminada",
      exportOK: "Exportado",
      importOK: "Importado",
      resetOK: "Reiniciado",
      compareEmpty: "Agrega favoritos para comparar.",
      compareRunning: "Revisando favoritos…",
      compareDone: "Comparación lista",
      relOffshore: "Offshore",
      relOnshore: "Onshore",
      relSide: "Lateral",
      relUnknown: "No hay orientación del spot",
      edit: "Editar",
      load: "Cargar",
      remove: "Quitar",
      shareTitle: "Pronóstico SurfScope",
      minHs: "min Hs",
      minSwellH: "min Swell H",
      maxWind: "max Viento",
      tabMap: "Mapa",
      pillMap: "Mapa",
      mapHint: "Toca el mapa para fijar un lugar. Toca un marcador favorito para cargar.",
      mapPinned: "Fijado:",
      btnMapToLast: "Centrar en spot actual",
      btnMapShowFavs: "Mostrar favoritos",
      btnMapLoad: "Cargar fijado",
      mapNote: "Este mapa es base para elegir coordenadas. Capas animadas tipo Windy requieren otro proveedor de mapas."
    }
  };

  // ---- State ----
  let state = loadState();

  function loadState(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return structuredClone(DEFAULT_STATE);
      const parsed = JSON.parse(raw);

      // shallow merge defaults (for upgrades)
      const merged = structuredClone(DEFAULT_STATE);
      Object.assign(merged, parsed);
      merged.settings = Object.assign(structuredClone(DEFAULT_STATE.settings), parsed.settings || {});
      merged.last = Object.assign(structuredClone(DEFAULT_STATE.last), parsed.last || {});
      merged.alertRuntime = Object.assign(structuredClone(DEFAULT_STATE.alertRuntime), parsed.alertRuntime || {});
      merged.favorites = Array.isArray(parsed.favorites) ? parsed.favorites : [];
      merged.alerts = Array.isArray(parsed.alerts) ? parsed.alerts : [];
      return merged;
    }catch{
      return structuredClone(DEFAULT_STATE);
    }
  }

  function saveState(){
    try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch{}
  }

  

  // ---- Map (Leaflet) ----
  let mapObj = null;
  let pinned = { lat: null, lon: null, marker: null };
  let favLayer = null;

  function setPinned(lat, lon, label){
    pinned.lat = lat;
    pinned.lon = lon;
    const txt = label || `lat ${lat.toFixed(4)}, lon ${lon.toFixed(4)}`;
    const el = $("mapPinned");
    if (el) el.textContent = `${t("mapPinned")} ${txt}`;

    const sel = $("results");
    if (sel){
      sel.innerHTML = "";
      const opt = document.createElement("option");
      opt.textContent = `Pinned (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
      opt.dataset.lat = lat;
      opt.dataset.lon = lon;
      opt.dataset.name = "Pinned";
      opt.dataset.admin1 = "";
      opt.dataset.country = "";
      sel.appendChild(opt);
    }
  }

  function renderFavoriteMarkers(){
    if (!mapObj || !favLayer) return;
    favLayer.clearLayers();
    if (!state.favorites || !state.favorites.length) return;

    state.favorites.forEach((f) => {
      const m = L.circleMarker([f.lat, f.lon], { radius: 6, weight: 2, fillOpacity: 0.6 }).addTo(favLayer);
      m.bindPopup(`${formatPlace(f)}<br>${f.lat.toFixed(4)}, ${f.lon.toFixed(4)}`);
      m.on("click", () => {
        const sel = $("results");
        sel.innerHTML = "";
        const opt = document.createElement("option");
        opt.textContent = `${formatPlace(f)} (lat ${f.lat.toFixed(4)}, lon ${f.lon.toFixed(4)})`;
        opt.dataset.lat = f.lat;
        opt.dataset.lon = f.lon;
        opt.dataset.name = f.name;
        opt.dataset.admin1 = f.admin1 || "";
        opt.dataset.country = f.country || "";
        sel.appendChild(opt);
        showView("dash");
        $("btnLoad").click();
      });
    });
  }

  function initMap(){
    const mapDiv = document.getElementById("map");
    if (!mapDiv) return;
    if (!window.L) {
      mapDiv.innerHTML = '<div class="muted small">Map failed to load (Leaflet).</div>';
      return;
    }
    if (mapObj) return;

    let center = [20, 0], zoom = 2;
    if (state.last && state.last.spot){
      center = [state.last.spot.lat, state.last.spot.lon];
      zoom = 8;
    }

    mapObj = L.map("map", { zoomControl: true }).setView(center, zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors"
    }).addTo(mapObj);

    favLayer = L.layerGroup().addTo(mapObj);

    mapObj.on("click", (e) => {
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;
      if (pinned.marker) pinned.marker.remove();
      pinned.marker = L.marker([lat, lon]).addTo(mapObj)
        .bindPopup(`Pinned<br>${lat.toFixed(4)}, ${lon.toFixed(4)}`).openPopup();
      setPinned(lat, lon);
    });

    const btnToLast = $("btnMapToLast");
    if (btnToLast){
      btnToLast.addEventListener("click", () => {
        const s = state.last?.spot;
        if (!s) return;
        mapObj.setView([s.lat, s.lon], 10);
      });
    }

    const btnShowFavs = $("btnMapShowFavs");
    if (btnShowFavs){
      btnShowFavs.addEventListener("click", () => renderFavoriteMarkers());
    }

    const btnLoadPinned = $("btnMapLoad");
    if (btnLoadPinned){
      btnLoadPinned.addEventListener("click", () => {
        if (Number.isFinite(pinned.lat) && Number.isFinite(pinned.lon)){
          setPinned(pinned.lat, pinned.lon);
          showView("dash");
          $("btnLoad").click();
        } else {
          showView("dash");
        }
      });
    }

    renderFavoriteMarkers();
  }

// ---- Utilities ----
  function t(key){
    const lang = state.settings.lang || "en";
    return (I18N[lang] && I18N[lang][key]) ? I18N[lang][key] : (I18N.en[key] || key);
  }

  function setErr(msg){
    const el = $("err");
    if (!msg){ el.hidden = true; el.textContent = ""; return; }
    el.hidden = false;
    el.textContent = msg;
  }

  function setStatus(msg, cls){
    const el = $("status");
    el.textContent = msg;
    el.className = "pill" + (cls ? (" " + cls) : "");
  }

  function fmt(x, d=1){
    if (x === null || x === undefined) return "—";
    const n = Number(x);
    if (!Number.isFinite(n)) return "—";
    return n.toFixed(d);
  }

  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

  function buildIndex(times){
    const m = new Map();
    (times || []).forEach((t, i) => m.set(t, i));
    return m;
  }

  function nowIndex(times){
    if (!times || !times.length) return 0;
    const now = new Date();
    let best = 0;
    let bestDiff = Infinity;
    for (let i=0; i<times.length; i++){
      const d = Math.abs(new Date(times[i]).getTime() - now.getTime());
      if (d < bestDiff){ bestDiff = d; best = i; }
    }
    return best;
  }

  function degToCardinal(deg){
    if (!Number.isFinite(deg)) return "—";
    const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
    const i = Math.round(((deg % 360) / 22.5)) % 16;
    return dirs[i];
  }

  function angDiff(a, b){
    // smallest absolute difference (deg) between angles
    const d = ((a - b + 540) % 360) - 180;
    return Math.abs(d);
  }

  function formatPlace(s){
    if (!s) return "—";
    const parts = [];
    if (s.name) parts.push(s.name);
    if (s.admin1) parts.push(s.admin1);
    if (s.country) parts.push(s.country);
    return parts.join(", ");
  }

  // ---- Units (canonical: waves in meters, wind/current in km/h, temp in °C) ----
  function waveFactor(){
    return state.settings.waveUnit === "ft" ? 3.28084 : 1.0;
  }
  function speedFactor(){
    const u = state.settings.windUnit;
    if (u === "mph") return 0.621371;
    if (u === "kts") return 0.539957;
    return 1.0; // km/h
  }
  function waveToDisplay(m){
    if (!Number.isFinite(m)) return null;
    return m * waveFactor();
  }
  function waveFromDisplay(v){
    if (!Number.isFinite(v)) return null;
    return v / waveFactor();
  }
  function speedToDisplay(kmh){
    if (!Number.isFinite(kmh)) return null;
    return kmh * speedFactor();
  }
  function speedFromDisplay(v){
    if (!Number.isFinite(v)) return null;
    return v / speedFactor();
  }
  function unitWave(m){
    const val = waveToDisplay(m);
    return { value: val, unit: (state.settings.waveUnit === "ft" ? "ft" : "m") };
  }
  function unitSpeed(kmh){
    const val = speedToDisplay(kmh);
    return { value: val, unit: (state.settings.windUnit === "kts" ? "kts" : (state.settings.windUnit === "mph" ? "mph" : "km/h")) };
  }
  function unitTemp(c){
    if (!Number.isFinite(c)) return { value: null, unit: state.settings.tempUnit === "f" ? "°F" : "°C" };
    if (state.settings.tempUnit === "f") return { value: (c * 9/5) + 32, unit:"°F" };
    return { value: c, unit:"°C" };
  }

  // ---- Surf index / rating ----
  function simpleSurfIdx(hs_m, swellP_s){
    if (!Number.isFinite(hs_m) || !Number.isFinite(swellP_s)) return null;
    return hs_m * hs_m * swellP_s;
  }

  function surfBadge(idx){
    // keep simple and tweak later
    const lang = state.settings.lang || "en";
    if (!Number.isFinite(idx)) return { text: "—", cls:"ghost" };
    if (idx < 4) return { text: lang==="es" ? "Chico" : "Small", cls:"bad" };
    if (idx < 10) return { text: lang==="es" ? "Ok" : "Okay", cls:"ghost" };
    if (idx < 20) return { text: lang==="es" ? "Bueno" : "Good", cls:"good" };
    return { text: lang==="es" ? "Fuego" : "Firing", cls:"ok" };
  }

  function surfStars(idx){
    if (!Number.isFinite(idx)) return 0;
    if (idx < 4) return 1;
    if (idx < 8) return 2;
    if (idx < 14) return 3;
    if (idx < 22) return 4;
    return 5;
  }

  // ---- Tides (approx from sea_level_height_msl) ----
  function detectTides(times, sea){
    // naive extrema detection, returns next highs/lows.
    const out = [];
    if (!times || !sea || times.length < 5) return out;

    for (let i=1; i<sea.length-1; i++){
      const a = sea[i-1], b = sea[i], c = sea[i+1];
      if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) continue;
      if (b > a && b > c) out.push({ type:"High", time: times[i], value: b });
      if (b < a && b < c) out.push({ type:"Low", time: times[i], value: b });
    }

    // de-duplicate close events
    const filtered = [];
    let lastT = -Infinity;
    for (const e of out){
      const tt = new Date(e.time).getTime();
      if (tt - lastT < 2.5*3600*1000) continue;
      filtered.push(e);
      lastT = tt;
      if (filtered.length >= 6) break;
    }
    return filtered;
  }

  // ---- Spot orientation helpers ----
  function windRelation(windDir, spot){
    // wind direction is where it comes from
    if (!spot || !Number.isFinite(spot.faceDeg) || !Number.isFinite(windDir)) return null;
    const offshoreDir = (spot.faceDeg + 180) % 360; // wind comes from land
    const dOff = angDiff(windDir, offshoreDir);
    const dOn  = angDiff(windDir, spot.faceDeg);
    if (dOff <= 45) return "offshore";
    if (dOn <= 45) return "onshore";
    return "side";
  }

  // ---- View switching ----
  function showView(name){
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    const el = document.getElementById("view-"+name);
    if (el) el.classList.add("active");

    document.querySelectorAll(".tab").forEach(b => { b.classList.remove("active"); b.setAttribute("aria-selected","false"); });
    const btn = document.querySelector(`.tab[data-view="${name}"]`);
    if (btn){ btn.classList.add("active"); btn.setAttribute("aria-selected","true"); }

    if (name === "map") initMap();
    if (name === "favorites") renderFavorites();
    if (name === "alerts") renderAlerts();
  }

  document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => showView(btn.dataset.view)));

  // ---- PWA install + SW ----
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    $("btnInstall").hidden = false;
  });

  $("btnInstall").addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    $("btnInstall").hidden = true;
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  }

  // ---- Share ----
  $("btnShare").addEventListener("click", async () => {
    const spot = state.last.spot;
    const url = new URL(location.href);
    if (spot) {
      url.searchParams.set("lat", spot.lat);
      url.searchParams.set("lon", spot.lon);
      url.searchParams.set("name", spot.name || "Spot");
    }
    const shareData = { title: t("shareTitle"), text: spot ? formatPlace(spot) : "SurfScope", url: url.toString() };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(url.toString());
      setStatus("Shared", "ok");
      setTimeout(()=>setStatus(t("ready")), 1200);
    } catch {}
  });

  // ---- i18n apply ----
  function applyI18n(){
    $("brandSub").textContent = t("brandSub");
    $("tabDash").textContent = t("tabDash");
    $("tabForecast").textContent = t("tabForecast");
    $("tabMap").textContent = t("tabMap");
    $("tabFavorites").textContent = t("tabFavorites");
    $("tabAlerts").textContent = t("tabAlerts");
    $("tabSettings").textContent = t("tabSettings");
    $("lblSearch").textContent = t("lblSearch");
    $("btnSearch").textContent = t("btnSearch");
    $("btnLoad").textContent = t("btnLoad");
    $("searchHint").textContent = t("searchHint");
    $("sourceNote").textContent = t("sourceNote");

    $("pillSummary").textContent = t("pillSummary");
    $("pillChart").textContent = t("pillChart");
    $("kWave").textContent = t("kWave");
    $("kSwell").textContent = t("kSwell");
    $("kWind").textContent = t("kWind");
    $("kTide").textContent = t("kTide");
    $("kNextTides").textContent = t("kNextTides");
    $("kSurfIdx").textContent = t("kSurfIdx");

    $("pillTable").textContent = t("pillTable");
    $("pillMap").textContent = t("pillMap");
    $("mapHint").textContent = t("mapHint");
    $("btnMapToLast").textContent = t("btnMapToLast");
    $("btnMapShowFavs").textContent = t("btnMapShowFavs");
    $("btnMapLoad").textContent = t("btnMapLoad");
    $("mapNote").textContent = t("mapNote");
    $("thTime").textContent = t("thTime");
    $("thSwell").textContent = t("thSwell");
    $("thSwell2").textContent = t("thSwell2");
    $("thWindSea").textContent = t("thWindSea");
    $("thWind").textContent = t("thWind");
    $("thTide").textContent = t("thTide");
    $("thCurr").textContent = t("thCurr");
    $("thIndex").textContent = t("thIndex");

    $("pillFavs").textContent = t("pillFavs");
    $("favHint").textContent = t("favHint");

    $("pillAlerts").textContent = t("pillAlerts");
    $("alertHint").textContent = t("alertHint");
    $("btnEnableNotifs").textContent = t("btnEnableNotifs");
    $("btnRunChecks").textContent = t("btnRunChecks");
    $("kNewAlert").textContent = t("kNewAlert");
    $("kAlertSpots").textContent = t("kAlertSpots");
    $("alertSpotsHint").textContent = t("alertSpotsHint");
    $("lblAllFavs").textContent = t("lblAllFavs");
    $("alertMultiTip").textContent = t("alertMultiTip");
    $("alertIdxTip").textContent = t("alertIdxTip");
    $("windDirTip").textContent = t("windDirTip");
    $("btnCreateAlert").textContent = t("btnCreateAlert");

    $("pillSettings").textContent = t("pillSettings");
    $("settingsHint").textContent = t("settingsHint");
    $("kDisplay").textContent = t("kDisplay");
    $("lblLanguage").textContent = t("lblLanguage");
    $("lblWaveUnit").textContent = t("lblWaveUnit");
    $("lblWindUnit").textContent = t("lblWindUnit");
    $("lblTempUnit").textContent = t("lblTempUnit");
    $("lblRatingMode").textContent = t("lblRatingMode");
    $("lblTZ").textContent = t("lblTZ");
    $("kAlertsSettings").textContent = t("kAlertsSettings");
    $("lblCheckEvery").textContent = t("lblCheckEvery");
    $("lblCooldown").textContent = t("lblCooldown");
    $("pushNote").textContent = t("pushNote");
    $("kBackup").textContent = t("kBackup");
    $("footerNote").textContent = t("footerNote");

    // Dynamic alert labels with units
    const wu = (state.settings.waveUnit === "ft" ? "ft" : "m");
    const su = unitSpeed(1).unit;
    $("lblMinHs").textContent = `${t("minHs")} (${wu})`;
    $("lblMinSwellH").textContent = `${t("minSwellH")} (${wu})`;
    $("lblMaxWind").textContent = `${t("maxWind")} (${su})`;

    // Settings values
    $("sLang").value = state.settings.lang;
    $("sWaveUnit").value = state.settings.waveUnit;
    $("sWindUnit").value = state.settings.windUnit;
    $("sTempUnit").value = state.settings.tempUnit;
    $("sRating").value = state.settings.ratingMode;
    $("sTZ").value = state.settings.tz;
    $("sWaveModel").value = state.settings.waveModel;
    $("sMergeExtras").value = state.settings.mergeExtras;

    $("sCheckEvery").value = String(state.settings.alertCheckMinutes || 30);
    $("sCooldown").value = String(state.settings.alertCooldownMinutes || 180);

    setStatus(t("ready"));
  }

  // ---- Geocoding ----
  async function geocode(query){
    const url = new URL(API.geocode);
    url.searchParams.set("name", query);
    url.searchParams.set("count", "10");
    url.searchParams.set("language", state.settings.lang);
    url.searchParams.set("format", "json");
    const r = await fetch(url);
    if (!r.ok) throw new Error("Geocoding failed");
    return r.json();
  }

  function fillResults(results){
    const sel = $("results");
    sel.innerHTML = "";
    (results || []).forEach((r, i) => {
      const opt = document.createElement("option");
      const name = r.name || "—";
      const admin1 = r.admin1 ? ", " + r.admin1 : "";
      const country = r.country ? ", " + r.country : "";
      opt.textContent = `${name}${admin1}${country} (lat ${Number(r.latitude).toFixed(4)}, lon ${Number(r.longitude).toFixed(4)})`;
      opt.value = String(i);
      opt.dataset.lat = r.latitude;
      opt.dataset.lon = r.longitude;
      opt.dataset.name = r.name || "";
      opt.dataset.admin1 = r.admin1 || "";
      opt.dataset.country = r.country || "";
      sel.appendChild(opt);
    });
  }

  $("btnSearch").addEventListener("click", async () => {
    setErr("");
    setStatus(t("loading"));
    try{
      const q = $("q").value.trim();
      if (!q) { setStatus(t("ready")); return; }
      const data = await geocode(q);
      fillResults(data.results || []);
      setStatus(t("searched"), "ok");
      setTimeout(()=>setStatus(t("ready")), 1200);
    }catch(e){
      setErr(e.message || String(e));
      setStatus(t("ready"));
    }
  });

  // ---- GPS ----
  $("btnUseGPS").addEventListener("click", () => {
    setErr("");
    if (!navigator.geolocation) { setErr("Geolocation not supported"); return; }
    setStatus(t("loading"));
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const opt = document.createElement("option");
      opt.textContent = `GPS (lat ${lat.toFixed(4)}, lon ${lon.toFixed(4)})`;
      opt.dataset.lat = lat;
      opt.dataset.lon = lon;
      opt.dataset.name = "GPS";
      opt.dataset.admin1 = "";
      opt.dataset.country = "";
      const sel = $("results");
      sel.innerHTML = "";
      sel.appendChild(opt);
      setStatus(t("ready"), "ok");
      setTimeout(()=>setStatus(t("ready")), 900);
    }, (err) => {
      setErr(err.message || "GPS error");
      setStatus(t("ready"));
    }, { enableHighAccuracy: true, timeout: 10000 });
  });

  // ---- Forecast loading (Open-Meteo) ----
  async function fetchMarine(lat, lon, hourlyVars, models=null){
    const tz = state.settings.tz;

    const u = new URL(API.marine);
    u.searchParams.set("latitude", lat);
    u.searchParams.set("longitude", lon);
    u.searchParams.set("hourly", hourlyVars.join(","));
    u.searchParams.set("forecast_days", "8");
    u.searchParams.set("timezone", tz);
    u.searchParams.set("cell_selection", "sea");
    // keep canonical units from API: meters, km/h, celsius
    if (models) u.searchParams.set("models", models);

    const r = await fetch(u);
    const j = await r.json();
    if (j.error) throw new Error(j.reason || "Marine API error");
    return j;
  }

  async function fetchWeather(lat, lon){
    const tz = state.settings.tz;

    const u = new URL(API.weather);
    u.searchParams.set("latitude", lat);
    u.searchParams.set("longitude", lon);
    u.searchParams.set("hourly", WEATHER_HOURLY.join(","));
    u.searchParams.set("forecast_days", "8");
    u.searchParams.set("timezone", tz);
    u.searchParams.set("wind_speed_unit", "kmh");
    u.searchParams.set("temperature_unit", "celsius");
    const r = await fetch(u);
    const j = await r.json();
    if (j.error) throw new Error(j.reason || "Weather API error");
    return j;
  }

  function anyFinite(arr){
    if (!Array.isArray(arr)) return false;
    for (const v of arr){ if (Number.isFinite(v)) return true; }
    return false;
  }

  async function loadForecast(lat, lon){
    // 1) Base marine: auto best match
    const base = await fetchMarine(lat, lon, MARINE_ALL, null);
    const modelInfo = { waveModel: "auto", waveModelOverride: state.settings.waveModel, merged: [] };
    let marine = base;

    // 2) Optional wave override: fetch waves only with selected wave model, then merge into base
    const override = state.settings.waveModel;
    if (override && override !== "auto"){
      try{
        const wave = await fetchMarine(lat, lon, MARINE_WAVES, override);
        const hasWave = anyFinite(wave.hourly?.wave_height);
        if (hasWave){
          modelInfo.waveModel = override;
          for (const k of MARINE_WAVES){
            if (wave.hourly && wave.hourly[k]) marine.hourly[k] = wave.hourly[k];
          }
        }
      }catch{
        // ignore override failures
      }
    }

    // 3) Optional fill missing SST / currents (if base returns nulls)
    if (state.settings.mergeExtras !== "off"){
      const needSst = !anyFinite(marine.hourly?.sea_surface_temperature);
      const needCur = !anyFinite(marine.hourly?.ocean_current_velocity);

      if (needSst){
        try{
          const sst = await fetchMarine(lat, lon, MARINE_SST, "meteofrance_sea_surface_temperature");
          if (anyFinite(sst.hourly?.sea_surface_temperature)){
            marine.hourly.sea_surface_temperature = sst.hourly.sea_surface_temperature;
            modelInfo.merged.push("SST");
          }
        }catch{}
      }

      if (needCur){
        try{
          const cur = await fetchMarine(lat, lon, MARINE_CURRENTS, "meteofrance_currents");
          if (anyFinite(cur.hourly?.ocean_current_velocity)){
            marine.hourly.ocean_current_velocity = cur.hourly.ocean_current_velocity;
            marine.hourly.ocean_current_direction = cur.hourly.ocean_current_direction;
            modelInfo.merged.push("Currents");
          }
        }catch{}
      }
    }

    // 4) Weather wind
    const weather = await fetchWeather(lat, lon);

    return { m: marine, w: weather, modelInfo };
  }

  function currentSpotFromSelection(){
    const sel = $("results");
    const opt = sel.options[sel.selectedIndex];
    if (!opt) return null;
    const lat = Number(opt.dataset.lat);
    const lon = Number(opt.dataset.lon);
    const name = opt.dataset.name || opt.textContent;
    const admin1 = opt.dataset.admin1 || "";
    const country = opt.dataset.country || "";
    const id = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    const fav = state.favorites.find(f => f.id === id);
    const faceDeg = fav && Number.isFinite(fav.faceDeg) ? fav.faceDeg : null;
    return { id, name, admin1, country, lat, lon, faceDeg };
  }

  $("btnLoad").addEventListener("click", async () => {
    setErr("");
    const spot = currentSpotFromSelection();
    if (!spot) { setErr("Select a result first."); return; }

    setStatus(t("loading"));
    try{
      const data = await loadForecast(String(spot.lat), String(spot.lon));
      // persist faceDeg if favorite has it
      const fav = state.favorites.find(f => f.id === spot.id);
      if (fav && Number.isFinite(fav.faceDeg)) spot.faceDeg = fav.faceDeg;

      state.last.spot = spot;
      state.last.data = { m: data.m, w: data.w };
      state.last.modelInfo = data.modelInfo;
      state.last.fetchedAt = new Date().toISOString();
      saveState();
      renderAll();
      setStatus(t("ready"), "ok");
      setTimeout(()=>setStatus(t("ready")), 900);
    }catch(e){
      setErr(e.message || String(e));
      setStatus(t("ready"));
    }
  });

  // ---- Favorites ----
  function isFavorite(id){ return state.favorites.some(f => f.id === id); }

  function populateAlertSpotPicker(){
    const sel = $("aSpotMulti");
    if (!sel) return;
    const prev = new Set(Array.from(sel.selectedOptions || []).map(o => o.value));
    sel.innerHTML = "";
    state.favorites.forEach((f) => {
      const opt = document.createElement("option");
      opt.value = f.id;
      opt.textContent = formatPlace(f);
      if (prev.has(f.id)) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  $("aAllFavs").addEventListener("change", () => {
    const sel = $("aSpotMulti");
    if (!sel) return;
    if ($("aAllFavs").checked){
      for (const opt of sel.options) opt.selected = true;
    }
  });

  $("btnFav").addEventListener("click", () => {
    const spot = state.last.spot || currentSpotFromSelection();
    if (!spot) return;
    if (isFavorite(spot.id)){
      state.favorites = state.favorites.filter(f => f.id !== spot.id);
      saveState();
      populateAlertSpotPicker();
      if (typeof renderFavoriteMarkers === "function") renderFavoriteMarkers();
      setStatus(t("removedFav"), "bad");
      $("btnFav").textContent = "☆ Favorite";
    } else {
      state.favorites.unshift({
        id: spot.id, name: spot.name, admin1: spot.admin1, country: spot.country,
        lat: spot.lat, lon: spot.lon,
        faceDeg: spot.faceDeg ?? null
      });
      state.favorites = state.favorites.slice(0, 120);
      saveState();
      populateAlertSpotPicker();
      if (typeof renderFavoriteMarkers === "function") renderFavoriteMarkers();
      setStatus(t("addedFav"), "ok");
      $("btnFav").textContent = "★ Favorited";
    }
    setTimeout(()=>setStatus(t("ready")), 1200);
  });

  function renderFavorites(){
    const list = $("favList");
    const compareBox = $("compareBox");
    list.innerHTML = "";
    if (!state.favorites.length){
      compareBox.innerHTML = `<div class="muted small">${t("compareEmpty")}</div>`;
      list.innerHTML = `<div class="muted">No favorites yet.</div>`;
      return;
    }
    compareBox.innerHTML = `<div class="muted small">Press “Run” to scan favorites for the best hour in the selected window. (Uses cached data if available.)</div>`;

    state.favorites.forEach((f) => {
      const item = document.createElement("div");
      item.className = "item";
      const face = Number.isFinite(f.faceDeg) ? `face ${Math.round(f.faceDeg)}°` : "face —";
      item.innerHTML = `
        <div>
          <div class="title">${formatPlace(f)}</div>
          <div class="meta">lat ${f.lat.toFixed(4)}, lon ${f.lon.toFixed(4)} • ${face}</div>
        </div>
        <div class="actions">
          <button class="btn ghost" data-act="load">${t("load")}</button>
          <button class="btn ghost" data-act="edit">${t("edit")}</button>
          <button class="btn danger" data-act="del">${t("remove")}</button>
        </div>
      `;
      item.querySelector('[data-act="load"]').addEventListener("click", async () => {
        $("q").value = formatPlace(f);
        const sel = $("results");
        sel.innerHTML = "";
        const opt = document.createElement("option");
        opt.textContent = `${formatPlace(f)} (lat ${f.lat.toFixed(4)}, lon ${f.lon.toFixed(4)})`;
        opt.dataset.lat = f.lat;
        opt.dataset.lon = f.lon;
        opt.dataset.name = f.name;
        opt.dataset.admin1 = f.admin1 || "";
        opt.dataset.country = f.country || "";
        sel.appendChild(opt);
        showView("dash");
        $("btnLoad").click();
      });
      item.querySelector('[data-act="edit"]').addEventListener("click", () => {
        const current = Number.isFinite(f.faceDeg) ? String(f.faceDeg) : "";
        const input = prompt("Spot facing direction (deg waves come FROM). Example: Zicatela ≈ 180 (S), La Punta ≈ 210 (SSW). Leave blank to clear.", current);
        if (input === null) return;
        const v = input.trim() === "" ? null : Number(input);
        f.faceDeg = (v === null) ? null : ((v % 360) + 360) % 360;
        saveState();
        renderFavorites();
        // update if currently loaded spot matches
        if (state.last.spot && state.last.spot.id === f.id) {
          state.last.spot.faceDeg = f.faceDeg;
          saveState();
          renderAll();
        }
      });
      item.querySelector('[data-act="del"]').addEventListener("click", () => {
        state.favorites = state.favorites.filter(x => x.id !== f.id);
        saveState();
        populateAlertSpotPicker();
        renderFavorites();
      });
      list.appendChild(item);
    });
  }

  // ---- Dashboard render ----
  function renderAll(){
    const spot = state.last.spot;
    const data = state.last.data;
    if (!spot || !data){ return; }

    const { m, w } = data;
    const mt = m.hourly.time;
    const wi = buildIndex(w.hourly.time);

    const iNow = nowIndex(mt);
    const tNow = mt[iNow];
    const jNow = wi.get(tNow);

    $("place").textContent = formatPlace(spot);
    $("tblPlace").textContent = formatPlace(spot);
    $("newAlertSpot").textContent = formatPlace(spot);

    const updated = state.last.fetchedAt ? new Date(state.last.fetchedAt).toLocaleString() : "—";
    $("asof").textContent = `${m.timezone_abbreviation || m.timezone || ""} • updated ${updated}`;

    const mi = state.last.modelInfo;
    const merged = (mi && mi.merged && mi.merged.length) ? ` • merged: ${mi.merged.join(", ")}` : "";
    const modelLine = mi ? `Wave model: ${mi.waveModel}${merged}` : "—";
    $("modelLine").textContent = modelLine;

    // Favorite button state
    $("btnFav").textContent = isFavorite(spot.id) ? "★ Favorited" : "☆ Favorite";

    // Current values
    const hs = m.hourly.wave_height?.[iNow];
    const per = m.hourly.wave_period?.[iNow];
    const dir = m.hourly.wave_direction?.[iNow];

    const swellH = m.hourly.swell_wave_height?.[iNow];
    const swellP = m.hourly.swell_wave_period?.[iNow];
    const swellD = m.hourly.swell_wave_direction?.[iNow];

    const windSeaH = m.hourly.wind_wave_height?.[iNow];

    const sea = m.hourly.sea_level_height_msl?.[iNow];
    const sst = m.hourly.sea_surface_temperature?.[iNow];

    const windSp = (jNow!=null) ? w.hourly.wind_speed_10m?.[jNow] : null;
    const windDir = (jNow!=null) ? w.hourly.wind_direction_10m?.[jNow] : null;
    const gust = (jNow!=null) ? w.hourly.wind_gusts_10m?.[jNow] : null;

    const hsU = unitWave(hs);
    const swellHU = unitWave(swellH);
    const windSeaHU = unitWave(windSeaH);
    const windSpU = unitSpeed(windSp);
    const gustU = unitSpeed(gust);
    const sstU = unitTemp(sst);

    $("vWave").textContent = `${fmt(hsU.value,2)} ${hsU.unit}`;
    $("sWave").textContent = `${fmt(per,1)} s • ${fmt(dir,0)}° ${degToCardinal(dir)} • wind‑sea ${fmt(windSeaHU.value,2)} ${windSeaHU.unit}`;

    $("vSwell").textContent = `${fmt(swellHU.value,2)} ${swellHU.unit}`;
    $("sSwell").textContent = `${fmt(swellP,1)} s • ${fmt(swellD,0)}° ${degToCardinal(swellD)}`;

    $("vWind").textContent = `${fmt(windSpU.value,0)} ${windSpU.unit}`;
    $("sWind").textContent = `${fmt(windDir,0)}° ${degToCardinal(windDir)} • gust ${fmt(gustU.value,0)} ${gustU.unit}`;

    // Wind relation (needs spot orientation)
    const rel = windRelation(windDir, spot);
    if (!rel){
      $("windRel").textContent = t("relUnknown");
    } else {
      const label = rel === "offshore" ? t("relOffshore") : (rel === "onshore" ? t("relOnshore") : t("relSide"));
      $("windRel").textContent = `Wind: ${label}${Number.isFinite(spot.faceDeg) ? ` (face ${Math.round(spot.faceDeg)}°)` : ""}`;
    }

    // Sea level: display in the SAME length unit as waves (m/ft), but label as "relative to MSL"
    const seaU = unitWave(sea);
    $("vTide").textContent = `${fmt(seaU.value,2)} ${seaU.unit}`;
    $("sTide").textContent = `SST ${fmt(sstU.value,1)} ${sstU.unit}`;

    // Tide events next ~48h
    const seaSlice = (m.hourly.sea_level_height_msl||[]).slice(iNow, iNow+60);
    const tSlice = mt.slice(iNow, iNow+60);
    const events = detectTides(tSlice, seaSlice);
    $("tides").innerHTML = events.length ? events.map(e => {
      const vU = unitWave(e.value);
      return `${e.type}: <b>${e.time.replace("T"," ").slice(0,16)}</b> (${fmt(vU.value,2)} ${vU.unit})`;
    }).join("<br/>") : "—";

    // Surf index + badge + stars
    const idx = simpleSurfIdx(hs, swellP);
    const badge = surfBadge(idx);
    const stars = surfStars(idx);
    const mode = state.settings.ratingMode || "both";

    const badgeEl = $("surfBadge");
    badgeEl.textContent = `${badge.text}${idx!=null ? " • " + fmt(idx,1) : ""}`;
    badgeEl.className = "pill " + badge.cls;
    badgeEl.style.display = (mode === "stars") ? "none" : "inline-flex";

    const starsEl = $("surfStars");
    starsEl.textContent = ("★".repeat(stars) + "☆".repeat(5-stars));
    starsEl.className = "stars " + (stars ? "" : "dim");
    starsEl.style.display = (mode === "badge") ? "none" : "inline-block";

    $("surfExplain").textContent = idx!=null ? "Hs² × swellPeriod (energy proxy)" : "—";

    drawChart($("chart"), mt, m, w);
    renderTable();
  }

  // ---- Table ----
  function renderTable(){
    const spot = state.last.spot;
    const data = state.last.data;
    if (!spot || !data) return;

    const { m, w } = data;
    const mt = m.hourly.time;
    const wi = buildIndex(w.hourly.time);

    const iNow = nowIndex(mt);
    const rangeH = Number($("range").value || 72);
    const end = Math.min(iNow + rangeH, mt.length);

    const tbody = $("tbl").querySelector("tbody");
    tbody.innerHTML = "";

    for (let i=iNow; i<end; i++){
      const t0 = mt[i];
      const j = wi.get(t0);

      const hs = m.hourly.wave_height?.[i];
      const per = m.hourly.wave_period?.[i];
      const dir = m.hourly.wave_direction?.[i];

      const swellH = m.hourly.swell_wave_height?.[i];
      const swellP = m.hourly.swell_wave_period?.[i];
      const swellD = m.hourly.swell_wave_direction?.[i];

      const swell2H = m.hourly.secondary_swell_wave_height?.[i];
      const swell2P = m.hourly.secondary_swell_wave_period?.[i];
      const swell2D = m.hourly.secondary_swell_wave_direction?.[i];

      const windSeaH = m.hourly.wind_wave_height?.[i];
      const windSeaP = m.hourly.wind_wave_period?.[i];
      const windSeaD = m.hourly.wind_wave_direction?.[i];

      const windSp = (j!=null) ? w.hourly.wind_speed_10m?.[j] : null;
      const windDir = (j!=null) ? w.hourly.wind_direction_10m?.[j] : null;
      const gust = (j!=null) ? w.hourly.wind_gusts_10m?.[j] : null;

      const sea = m.hourly.sea_level_height_msl?.[i];
      const curV = m.hourly.ocean_current_velocity?.[i];
      const curD = m.hourly.ocean_current_direction?.[i];
      const sst = m.hourly.sea_surface_temperature?.[i];

      const idx = simpleSurfIdx(hs, swellP);

      const hsU = unitWave(hs);
      const swellHU = unitWave(swellH);
      const swell2HU = unitWave(swell2H);
      const windSeaHU = unitWave(windSeaH);

      const windSpU = unitSpeed(windSp);
      const gustU = unitSpeed(gust);
      const seaU = unitWave(sea);
      const curVU = unitSpeed(curV);
      const sstU = unitTemp(sst);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t0.replace("T"," ").slice(0,16)}</td>
        <td>${fmt(hsU.value,2)} ${hsU.unit}</td>
        <td>${fmt(per,1)}s</td>
        <td>${fmt(dir,0)}° ${degToCardinal(dir)}</td>
        <td>${fmt(swellHU.value,2)} ${swellHU.unit} • ${fmt(swellP,1)}s • ${fmt(swellD,0)}°</td>
        <td>${fmt(swell2HU.value,2)} ${swell2HU.unit} • ${fmt(swell2P,1)}s • ${fmt(swell2D,0)}°</td>
        <td>${fmt(windSeaHU.value,2)} ${windSeaHU.unit} • ${fmt(windSeaP,1)}s • ${fmt(windSeaD,0)}°</td>
        <td>${fmt(windSpU.value,0)} ${windSpU.unit} • ${fmt(windDir,0)}° • gust ${fmt(gustU.value,0)} ${gustU.unit}</td>
        <td>${fmt(seaU.value,2)} ${seaU.unit}</td>
        <td>${fmt(curVU.value,2)} ${curVU.unit} • ${fmt(curD,0)}°</td>
        <td>${fmt(sstU.value,1)} ${sstU.unit}</td>
        <td>${idx==null ? "—" : fmt(idx,1)}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  $("range").addEventListener("change", renderTable);

  // ---- CSV export (canonical units) ----
  function toCSV(rows){
    const esc = (s) => {
      const str = String(s ?? "");
      if (/[",\n]/.test(str)) return `"${str.replaceAll('"','""')}"`;
      return str;
    };
    return rows.map(r => r.map(esc).join(",")).join("\n");
  }

  $("btnCSV").addEventListener("click", () => {
    const spot = state.last.spot;
    const data = state.last.data;
    if (!spot || !data) return;

    const { m, w } = data;
    const mt = m.hourly.time;
    const wi = buildIndex(w.hourly.time);

    const iNow = nowIndex(mt);
    const rangeH = Number($("range").value || 72);
    const end = Math.min(iNow + rangeH, mt.length);

    const rows = [["time","hs_m","period_s","dir_deg","swell_h_m","swell_p_s","swell_dir_deg","wind_kmh","wind_dir_deg","gust_kmh","sea_level_m","sst_c","current_kmh","current_dir_deg"]];
    for (let i=iNow; i<end; i++){
      const t0 = mt[i];
      const j = wi.get(t0);
      rows.push([
        t0,
        m.hourly.wave_height?.[i],
        m.hourly.wave_period?.[i],
        m.hourly.wave_direction?.[i],
        m.hourly.swell_wave_height?.[i],
        m.hourly.swell_wave_period?.[i],
        m.hourly.swell_wave_direction?.[i],
        (j!=null) ? w.hourly.wind_speed_10m?.[j] : "",
        (j!=null) ? w.hourly.wind_direction_10m?.[j] : "",
        (j!=null) ? w.hourly.wind_gusts_10m?.[j] : "",
        m.hourly.sea_level_height_msl?.[i],
        m.hourly.sea_surface_temperature?.[i],
        m.hourly.ocean_current_velocity?.[i],
        m.hourly.ocean_current_direction?.[i],
      ]);
    }
    const csv = toCSV(rows);
    const blob = new Blob([csv], {type:"text/csv"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(spot.name || "spot")}_surfscope.csv`.replaceAll(" ","_");
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // ---- Chart (canvas, no external libs). Converted to selected units ----
  function drawChart(canvas, times, m, w){
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);

    // Downsample for performance
    const step = Math.max(1, Math.floor(times.length / 240));
    const xs = [];
    const hs = [];
    const sw = [];
    const ws = [];
    const wind = [];
    const sea = [];
    const wi = buildIndex(w.hourly.time);

    for (let i=0; i<times.length; i+=step){
      const t0 = times[i];
      xs.push(t0);
      hs.push(waveToDisplay(m.hourly.wave_height?.[i]));
      sw.push(waveToDisplay(m.hourly.swell_wave_height?.[i]));
      ws.push(waveToDisplay(m.hourly.wind_wave_height?.[i]));
      sea.push(waveToDisplay(m.hourly.sea_level_height_msl?.[i]));
      const j = wi.get(t0);
      wind.push(j!=null ? speedToDisplay(w.hourly.wind_speed_10m?.[j]) : null);
    }

    const pad = {l:56, r:44, t:16, b:28};

    const maxWave = Math.max(...hs.filter(Number.isFinite), ...sw.filter(Number.isFinite), ...ws.filter(Number.isFinite), 0.1);
    const minSea = Math.min(...sea.filter(Number.isFinite), 0);
    const maxSea = Math.max(...sea.filter(Number.isFinite), 0);
    const maxWind = Math.max(...wind.filter(Number.isFinite), 0.1);

    // Grid
    ctx.strokeStyle = "rgba(169,182,198,.35)";
    ctx.lineWidth = 1;
    const nGrid = 4;
    for (let g=0; g<=nGrid; g++){
      const y = pad.t + (H - pad.t - pad.b) * (g/nGrid);
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(W - pad.r, y);
      ctx.stroke();
    }

    // Labels
    const waveUnit = (state.settings.waveUnit === "ft" ? "ft" : "m");
    const windUnit = unitSpeed(1).unit;

    ctx.fillStyle = "rgba(169,182,198,.9)";
    ctx.font = "12px -apple-system, system-ui, Segoe UI, Roboto, Arial";
    for (let g=0; g<=nGrid; g++){
      const waveVal = maxWave * (1 - g/nGrid);
      const y = pad.t + (H - pad.t - pad.b) * (g/nGrid);
      ctx.fillText(waveVal.toFixed(1) + waveUnit, 8, y + 4);

      const windVal = maxWind * (1 - g/nGrid);
      ctx.fillText(windVal.toFixed(0), W - pad.r + 4, y + 4);
    }
    ctx.fillText(windUnit, W - 36, pad.t - 2);

    const total = xs.length;
    const every = Math.max(1, Math.floor(total / 8));
    for (let i=0; i<total; i+=every){
      const x = pad.l + (W - pad.l - pad.r) * (i/(total-1));
      const d = xs[i].slice(5,10).replace("-","/") + " " + xs[i].slice(11,16);
      ctx.save();
      ctx.translate(x, H - 6);
      ctx.rotate(-Math.PI/6);
      ctx.fillText(d, 0, 0);
      ctx.restore();
    }

    function xy(i, val, maxVal){
      const x = pad.l + (W - pad.l - pad.r) * (i/(total-1));
      const y = pad.t + (H - pad.t - pad.b) * (1 - (val / maxVal));
      return [x,y];
    }

    function drawLine(series, maxVal, color, width=2){
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      let started = false;
      for (let i=0; i<series.length; i++){
        const v = series[i];
        if (!Number.isFinite(v)) { started = false; continue; }
        const [x,y] = xy(i, v, maxVal);
        if (!started){ ctx.moveTo(x,y); started = true; }
        else ctx.lineTo(x,y);
      }
      ctx.stroke();
    }

    // Waves / swell / wind-sea
    drawLine(hs, maxWave, "rgba(87,166,255,.95)", 2.2);
    drawLine(sw, maxWave, "rgba(140, 255, 206,.85)", 2.0);
    drawLine(ws, maxWave, "rgba(255, 217, 102,.85)", 1.8);

    // Wind (right axis scale)
    drawLine(wind, maxWind, "rgba(255,255,255,.7)", 1.4);

    // Sea level scaled into wave axis range
    const seaScaled = sea.map(v => Number.isFinite(v) ? ((v - minSea) / Math.max(1e-6, (maxSea - minSea))) * maxWave : null);
    drawLine(seaScaled, maxWave, "rgba(180, 180, 255,.55)", 1.4);

    // Legend
    ctx.fillStyle = "rgba(232,238,246,.85)";
    ctx.fillText("Hs", pad.l + 6, pad.t + 12);
    ctx.fillStyle = "rgba(140, 255, 206,.85)";
    ctx.fillText("Swell", pad.l + 40, pad.t + 12);
    ctx.fillStyle = "rgba(255, 217, 102,.85)";
    ctx.fillText("Wind‑sea", pad.l + 90, pad.t + 12);
    ctx.fillStyle = "rgba(255,255,255,.7)";
    ctx.fillText("Wind", pad.l + 165, pad.t + 12);
    ctx.fillStyle = "rgba(180, 180, 255,.55)";
    ctx.fillText("Sea lvl", pad.l + 215, pad.t + 12);
  }

  // ---- Alerts ----
  function notifStateText(){
    if (!("Notification" in window)) return "Notifications not supported";
    return "Permission: " + Notification.permission;
  }
  function updateNotifState(){ $("notifState").textContent = notifStateText(); }

  $("btnEnableNotifs").addEventListener("click", async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    updateNotifState();
    setStatus(perm === "granted" ? t("notifsEnabled") : t("notifsDenied"), perm==="granted" ? "ok" : "bad");
    setTimeout(()=>setStatus(t("ready")), 1200);
  });

  function createAlertFromForm(){
    const spot = state.last.spot;
    if (!spot) return null;

    const num = (id) => {
      const v = $(id).value.trim();
      if (!v) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    // Selected spots
    const sel = $("aSpotMulti");
    const selected = [];
    if (sel){
      for (const opt of sel.selectedOptions) selected.push(opt.value);
    }
    const spotIds = selected.length ? selected : [spot.id];

    // Convert threshold inputs from current display units to canonical units
    const minHsDisp = num("aMinHs");
    const minSwellHDisp = num("aMinSwellH");
    const maxWindDisp = num("aMaxWind");

    return {
      id: "a_" + Math.random().toString(16).slice(2) + Date.now().toString(16),
      spotIds,
      name: $("aName").value.trim() || "Surf alert",
      enabled: true,
      // canonical
      minHs_m: minHsDisp==null ? null : waveFromDisplay(minHsDisp),
      minSwellH_m: minSwellHDisp==null ? null : waveFromDisplay(minSwellHDisp),
      minSwellP_s: num("aMinSwellP"),
      minIdx: num("aMinIdx"),
      maxWind_kmh: maxWindDisp==null ? null : speedFromDisplay(maxWindDisp),
      windDirCenter: num("aWindDir"),
      windDirTol: num("aWindTol") ?? 60,
      lookHours: num("aLook") ?? 24,
      createdAt: new Date().toISOString()
    };
  }

  $("btnCreateAlert").addEventListener("click", () => {
    const a = createAlertFromForm();
    if (!a) return;
    state.alerts.unshift(a);
    state.alerts = state.alerts.slice(0, 250);
    saveState();
    renderAlerts();
    setStatus(t("alertCreated"), "ok");
    setTimeout(()=>setStatus(t("ready")), 1200);
  });

  function alertSpotsLabel(a){
    const ids = a.spotIds || [];
    if (!ids.length) return "—";
    const names = ids.map((id) => {
      const f = state.favorites.find(x => x.id === id);
      if (f) return formatPlace(f);
      if (state.last.spot && state.last.spot.id === id) return formatPlace(state.last.spot);
      return id;
    });
    return names.join(" • ");
  }

  function renderAlerts(){
    updateNotifState();
    populateAlertSpotPicker();

    const el = $("alertList");
    el.innerHTML = "";
    if (!state.alerts.length){
      el.innerHTML = `<div class="muted">No alerts yet.</div>`;
      return;
    }

    // show thresholds in current display units
    const wu = (state.settings.waveUnit === "ft" ? "ft" : "m");
    const su = unitSpeed(1).unit;

    state.alerts.forEach((a) => {
      const item = document.createElement("div");
      item.className = "item";

      const minHsDisp = a.minHs_m==null ? null : waveToDisplay(a.minHs_m);
      const minSwellDisp = a.minSwellH_m==null ? null : waveToDisplay(a.minSwellH_m);
      const maxWindDisp = a.maxWind_kmh==null ? null : speedToDisplay(a.maxWind_kmh);

      item.innerHTML = `
        <div>
          <div class="title">${a.name} <span class="pill ${a.enabled ? "ok": "bad"}" style="margin-left:8px;">${a.enabled ? "ON":"OFF"}</span></div>
          <div class="meta">${alertSpotsLabel(a)}</div>
          <div class="meta">
            ${minHsDisp!=null ? "minHs " + fmt(minHsDisp,1) + wu + " · " : ""}
            ${minSwellDisp!=null ? "minSwellH " + fmt(minSwellDisp,1) + wu + " · " : ""}
            ${a.minSwellP_s!=null ? "minSwellP " + fmt(a.minSwellP_s,0) + "s · " : ""}
            ${maxWindDisp!=null ? "maxWind " + fmt(maxWindDisp,0) + su + " · " : ""}
            ${a.windDirCenter!=null ? "wind " + a.windDirCenter + "±" + (a.windDirTol??60) + "° · " : ""}
            look ${a.lookHours}h
          </div>
        </div>
        <div class="actions">
          <button class="btn ghost" data-act="toggle">${a.enabled ? "Disable":"Enable"}</button>
          <button class="btn ghost" data-act="check">Check</button>
          <button class="btn danger" data-act="del">Delete</button>
        </div>
      `;
      item.querySelector('[data-act="toggle"]').addEventListener("click", () => {
        a.enabled = !a.enabled;
        saveState();
        renderAlerts();
      });
      item.querySelector('[data-act="del"]').addEventListener("click", () => {
        state.alerts = state.alerts.filter(x => x.id !== a.id);
        saveState();
        renderAlerts();
        setStatus(t("alertDeleted"), "bad");
        setTimeout(()=>setStatus(t("ready")), 1200);
      });
      item.querySelector('[data-act="check"]').addEventListener("click", async () => {
        const cache = new Map();
        await checkOneAlert(a, cache);
      });
      el.appendChild(item);
    });
  }

  async function ensureSpotData(spotId){
    // If last matches, use it.
    if (state.last.spot && state.last.spot.id === spotId && state.last.data) return state.last.data;

    // Otherwise, fetch from favorites.
    const fav = state.favorites.find(f => f.id === spotId);
    if (!fav) return null;
    const data = await loadForecast(String(fav.lat), String(fav.lon));
    return { m: data.m, w: data.w };
  }

  function evaluateAlertOnData(alert, data){
    const { m, w } = data;
    const mt = m.hourly.time;
    const wi = buildIndex(w.hourly.time);

    const iNow = nowIndex(mt);
    const look = clamp(Math.floor((alert.lookHours ?? 24)), 1, 192);
    const end = Math.min(iNow + look, mt.length);

    for (let i=iNow; i<end; i++){
      const t0 = mt[i];
      const j = wi.get(t0);

      const hs = m.hourly.wave_height?.[i];
      const swellH = m.hourly.swell_wave_height?.[i];
      const swellP = m.hourly.swell_wave_period?.[i];
      const idx = simpleSurfIdx(hs, swellP);

      const windSp = (j!=null) ? w.hourly.wind_speed_10m?.[j] : null;
      const windDir = (j!=null) ? w.hourly.wind_direction_10m?.[j] : null;

      if (alert.minHs_m!=null && !(Number.isFinite(hs) && hs >= alert.minHs_m)) continue;
      if (alert.minSwellH_m!=null && !(Number.isFinite(swellH) && swellH >= alert.minSwellH_m)) continue;
      if (alert.minSwellP_s!=null && !(Number.isFinite(swellP) && swellP >= alert.minSwellP_s)) continue;
      if (alert.minIdx!=null && !(Number.isFinite(idx) && idx >= alert.minIdx)) continue;
      if (alert.maxWind_kmh!=null && !(Number.isFinite(windSp) && windSp <= alert.maxWind_kmh)) continue;

      if (alert.windDirCenter!=null){
        if (!Number.isFinite(windDir)) continue;
        const tol = alert.windDirTol ?? 60;
        if (angDiff(windDir, alert.windDirCenter) > tol) continue;
      }

      return { time: t0, hs, swellH, swellP, windSp, windDir, idx };
    }
    return null;
  }

  function canFire(alertId){
    const cooldownMs = (Number(state.settings.alertCooldownMinutes)||180) * 60 * 1000;
    const last = state.alertRuntime.lastFired[alertId];
    if (!last) return true;
    return (Date.now() - last) >= cooldownMs;
  }

  function markFired(alertId){
    state.alertRuntime.lastFired[alertId] = Date.now();
    saveState();
  }

  function notify(title, body){
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    try{ new Notification(title, { body, silent: false }); }catch{}
  }

  async function checkOneAlert(alert, cache){
    if (!alert.enabled) return;

    const ids = alert.spotIds && alert.spotIds.length ? alert.spotIds : (state.last.spot ? [state.last.spot.id] : []);
    for (const spotId of ids){
      try{
        let data = cache?.get(spotId) || null;
        if (!data){
          data = await ensureSpotData(spotId);
          if (data && cache) cache.set(spotId, data);
        }
        if (!data) continue;

        const hit = evaluateAlertOnData(alert, data);
        if (hit && canFire(alert.id)){
          const wu = unitWave(hit.hs);
          const su = unitSpeed(hit.windSp);
          const title = `SurfScope: ${alert.name}`;
          const body = `${hit.time.replace("T"," ").slice(0,16)} • Hs ${fmt(wu.value,1)}${wu.unit} • swellP ${fmt(hit.swellP,0)}s • wind ${fmt(su.value,0)}${su.unit}`;
          notify(title, body);
          markFired(alert.id);
        }
      }catch{}
    }
  }

  async function runAllChecks(){
    if (!state.alerts.length) return;
    const cache = new Map();
    for (const a of state.alerts){
      await checkOneAlert(a, cache);
    }
    state.alertRuntime.lastCheckAt = Date.now();
    saveState();
  }

  $("btnRunChecks").addEventListener("click", async () => {
    setStatus(t("loading"));
    await runAllChecks();
    setStatus(t("ready"), "ok");
    setTimeout(()=>setStatus(t("ready")), 900);
  });

  // Auto-check timer
  let checkTimer = null;
  function restartCheckTimer(){
    if (checkTimer) clearInterval(checkTimer);
    const mins = clamp(Number(state.settings.alertCheckMinutes)||30, 5, 180);
    checkTimer = setInterval(() => {
      runAllChecks().catch(()=>{});
    }, mins * 60 * 1000);
  }

  // ---- Compare favorites (best hour by SurfIdx, penalize wind) ----
  async function compareFavorites(){
    const box = $("compareBox");
    const lookH = clamp(Number($("compareRange").value)||24, 6, 48);
    if (!state.favorites.length){
      box.innerHTML = `<div class="muted small">${t("compareEmpty")}</div>`;
      return;
    }
    box.innerHTML = `<div class="muted small">${t("compareRunning")}</div>`;

    const cache = new Map();
    const rows = [];

    for (const f of state.favorites.slice(0, 30)){
      try{
        let data = cache.get(f.id);
        if (!data){
          data = await ensureSpotData(f.id);
          if (data) cache.set(f.id, data);
        }
        if (!data) continue;

        const { m, w } = data;
        const mt = m.hourly.time;
        const wi = buildIndex(w.hourly.time);

        const iNow = nowIndex(mt);
        const end = Math.min(iNow + lookH, mt.length);
        let best = null;

        for (let i=iNow; i<end; i++){
          const t0 = mt[i];
          const j = wi.get(t0);

          const hs = m.hourly.wave_height?.[i];
          const swellP = m.hourly.swell_wave_period?.[i];
          const idx = simpleSurfIdx(hs, swellP);
          if (!Number.isFinite(idx)) continue;

          const wind = (j!=null) ? w.hourly.wind_speed_10m?.[j] : null;
          const score = idx - (Number.isFinite(wind) ? (wind * 0.4) : 0); // simple penalty
          if (!best || score > best.score){
            best = { score, t0, hs, swellP, wind };
          }
        }

        if (best){
          const wu = unitWave(best.hs);
          const su = unitSpeed(best.wind);
          rows.push({ spot: f, best, wu, su });
        }
      }catch{}
    }

    // Render
    if (!rows.length){
      box.innerHTML = `<div class="muted small">No data.</div>`;
      return;
    }

    rows.sort((a,b) => b.best.score - a.best.score);
    const lines = rows.slice(0, 20).map(r => {
      return `<div class="row between" style="gap:10px; padding:6px 0; border-bottom:1px solid rgba(169,182,198,.12);">
        <div style="min-width:0">
          <div style="font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${formatPlace(r.spot)}</div>
          <div class="muted small">${r.best.t0.replace("T"," ").slice(0,16)} • Hs ${fmt(r.wu.value,1)}${r.wu.unit} • swellP ${fmt(r.best.swellP,0)}s • wind ${fmt(r.su.value,0)}${r.su.unit}</div>
        </div>
        <button class="btn ghost" data-load="${r.spot.id}">${t("load")}</button>
      </div>`;
    }).join("");

    box.innerHTML = `<div class="muted small" style="margin-bottom:6px;">${t("compareDone")} • next ${lookH}h</div>${lines}`;

    // load handlers
    box.querySelectorAll("button[data-load]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-load");
        const f = state.favorites.find(x => x.id === id);
        if (!f) return;
        $("q").value = formatPlace(f);
        const sel = $("results");
        sel.innerHTML = "";
        const opt = document.createElement("option");
        opt.textContent = `${formatPlace(f)} (lat ${f.lat.toFixed(4)}, lon ${f.lon.toFixed(4)})`;
        opt.dataset.lat = f.lat;
        opt.dataset.lon = f.lon;
        opt.dataset.name = f.name;
        opt.dataset.admin1 = f.admin1 || "";
        opt.dataset.country = f.country || "";
        sel.appendChild(opt);
        showView("dash");
        $("btnLoad").click();
      });
    });
  }

  $("btnCompare").addEventListener("click", compareFavorites);

  // ---- Settings ----
  function onSettingsChange(){
    state.settings.lang = $("sLang").value;
    state.settings.waveUnit = $("sWaveUnit").value;
    state.settings.windUnit = $("sWindUnit").value;
    state.settings.tempUnit = $("sTempUnit").value;
    state.settings.ratingMode = $("sRating").value;
    state.settings.tz = $("sTZ").value;
    state.settings.waveModel = $("sWaveModel").value;
    state.settings.mergeExtras = $("sMergeExtras").value;

    state.settings.alertCheckMinutes = clamp(Number($("sCheckEvery").value)||30, 5, 180);
    state.settings.alertCooldownMinutes = clamp(Number($("sCooldown").value)||180, 30, 1440);

    saveState();
    applyI18n();
    restartCheckTimer();
    renderAll(); // update units
  }

  ["sLang","sWaveUnit","sWindUnit","sTempUnit","sRating","sTZ","sWaveModel","sMergeExtras","sCheckEvery","sCooldown"].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener("change", onSettingsChange);
  });

  // ---- Backup ----
  $("btnExport").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "surfscope_backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus(t("exportOK"), "ok");
    setTimeout(()=>setStatus(t("ready")), 900);
  });

  $("btnImport").addEventListener("click", async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      try{
        const txt = await f.text();
        const parsed = JSON.parse(txt);
        // basic validate
        if (!parsed || typeof parsed !== "object") throw new Error("Bad JSON");
        state = loadState(); // reset structure, then overlay
        state.favorites = Array.isArray(parsed.favorites) ? parsed.favorites : [];
        state.alerts = Array.isArray(parsed.alerts) ? parsed.alerts : [];
        state.settings = Object.assign(structuredClone(DEFAULT_STATE.settings), parsed.settings || {});
        state.last = Object.assign(structuredClone(DEFAULT_STATE.last), parsed.last || {});
        state.alertRuntime = Object.assign(structuredClone(DEFAULT_STATE.alertRuntime), parsed.alertRuntime || {});
        saveState();
        applyI18n();
        populateAlertSpotPicker();
        renderAll();
        setStatus(t("importOK"), "ok");
        setTimeout(()=>setStatus(t("ready")), 900);
      }catch(e){
        setErr(e.message || "Import failed");
      }
    };
    input.click();
  });

  $("btnReset").addEventListener("click", () => {
    const ok = confirm("Reset SurfScope? This clears favorites, alerts and settings on this device.");
    if (!ok) return;
    localStorage.removeItem(LS_KEY);
    state = structuredClone(DEFAULT_STATE);
    saveState();
    applyI18n();
    populateAlertSpotPicker();
    renderFavorites();
    renderAlerts();
    setStatus(t("resetOK"), "ok");
    setTimeout(()=>setStatus(t("ready")), 900);
  });

  // ---- Init: deep link (lat/lon/name) ----
  function tryLoadFromUrl(){
    const url = new URL(location.href);
    const lat = url.searchParams.get("lat");
    const lon = url.searchParams.get("lon");
    const name = url.searchParams.get("name");
    if (!lat || !lon) return;

    // Create a single result option and load it.
    const sel = $("results");
    sel.innerHTML = "";
    const opt = document.createElement("option");
    opt.textContent = `${name || "Shared spot"} (lat ${Number(lat).toFixed(4)}, lon ${Number(lon).toFixed(4)})`;
    opt.dataset.lat = Number(lat);
    opt.dataset.lon = Number(lon);
    opt.dataset.name = name || "Shared spot";
    opt.dataset.admin1 = "";
    opt.dataset.country = "";
    sel.appendChild(opt);
    $("btnLoad").click();
  }

  // ---- Boot ----
  function boot(){
    applyI18n();
    populateAlertSpotPicker();
    updateNotifState();
    restartCheckTimer();
    tryLoadFromUrl();
    if (state.last.spot && state.last.data){
      renderAll();
    }
  }

  boot();
})();
