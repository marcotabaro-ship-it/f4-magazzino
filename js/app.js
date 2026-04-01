// ============================================================
// F4 Magazzino — app.js v3
// Fix: login usa res.utente+token, ruoli allineati al backend
// ============================================================

var F4 = F4 || {};

// ============================================================
// AUTH
// ============================================================
F4.auth = (function() {
  var _user = null;

  function _load() {
    try {
      var s = sessionStorage.getItem("f4_user");
      _user = s ? JSON.parse(s) : null;
    } catch(e) { _user = null; }
  }

  function isLogged() { _load(); return !!(_user && _user.token); }
  function getUser()  { _load(); return _user; }
  function getToken() { _load(); return _user ? (_user.token || null) : null; }

  function isAdmin() {
    _load();
    if (!_user) return false;
    var r = (_user.ruolo || "").toLowerCase();
    return r === "admin";
  }

  function isResponsabile() {
    _load();
    if (!_user) return false;
    var r = (_user.ruolo || "").toLowerCase();
    return r === "admin" || r === "management" || r === "amministrazione";
  }

  function canDo(perm) {
    _load();
    if (!_user) return false;
    var ruolo = (_user.ruolo || "").toLowerCase();
    if (ruolo === "admin") return true;
    var perms = {
      vediPrezzi:      ["management", "amministrazione"],
      gestioneListini: ["management"],
      gestioneMagazzini: ["management"],
      reportistica:    ["management", "amministrazione"],
      movimenti:       ["operativo", "management", "amministrazione"],
      audit:           ["management", "amministrazione"]
    };
    return perms[perm] ? perms[perm].indexOf(ruolo) !== -1 : false;
  }

  function login(userData) {
    _user = userData;
    try { sessionStorage.setItem("f4_user", JSON.stringify(userData)); } catch(e) {}
  }

  function logout() {
    _user = null;
    try { sessionStorage.removeItem("f4_user"); } catch(e) {}
  }

  return { isLogged:isLogged, getUser:getUser, getToken:getToken,
           isAdmin:isAdmin, isResponsabile:isResponsabile,
           canDo:canDo, login:login, logout:logout };
})();

// ============================================================
// UI HELPERS
// ============================================================
F4.ui = (function() {
  function showSpinner(msg) {
    var el = document.getElementById("f4-spinner");
    if (!el) return;
    var txt = el.querySelector(".spinner-msg");
    if (txt) txt.textContent = msg || "Caricamento...";
    el.style.display = "flex";
  }
  function hideSpinner() {
    var el = document.getElementById("f4-spinner");
    if (el) el.style.display = "none";
  }
  function toast(msg, type) {
    var t = document.createElement("div");
    t.className = "f4-toast f4-toast-" + (type || "info");
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() { t.classList.add("show"); }, 10);
    setTimeout(function() { t.classList.remove("show"); setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 300); }, 3000);
  }
  function err(msg) { toast(msg, "error"); }
  function conferma(titolo, testo, onOk) {
    var overlay = document.createElement("div");
    overlay.className = "f4-modal-overlay";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;z-index:9998;padding:1rem;";
    overlay.innerHTML =
      "<div class=\"glass\" style=\"max-width:480px;width:100%;padding:2rem;border-radius:12px;\">" +
      "<div style=\"font-size:1.1rem;font-weight:700;margin-bottom:.75rem;\">" + titolo + "</div>" +
      "<div style=\"color:#A0A8B8;margin-bottom:1.5rem;\">" + testo + "</div>" +
      "<div style=\"display:flex;gap:.75rem;justify-content:flex-end;\">" +
      "<button class=\"btn btn-ghost\" id=\"m-cancel\">Annulla</button>" +
      "<button class=\"btn btn-primary\" id=\"m-ok\">Conferma</button>" +
      "</div></div>";
    document.body.appendChild(overlay);
    overlay.querySelector("#m-cancel").addEventListener("click", function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); });
    overlay.querySelector("#m-ok").addEventListener("click", function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); onOk(); });
  }
  return { showSpinner:showSpinner, hideSpinner:hideSpinner, toast:toast, err:err, conferma:conferma };
})();

// ============================================================
// ROUTER
// ============================================================
F4.router = (function() {
  var _routes = {};
  function register(name, fn) { _routes[name] = fn; }
  function go(name) {
    if (!F4.auth.isLogged() && name !== "login") { go("login"); return; }
    var container = document.getElementById("view-container");
    if (!container) return;
    container.innerHTML = "";
    _buildNav();
    _setActiveNav(name);
    _updateUserBar();
    _toggleSidebar(false);
    var fn = _routes[name];
    if (fn) { fn(container); }
    else { container.innerHTML = "<div class=\"empty-state\">Vista non trovata: " + name + "</div>"; }
  }
  return { register:register, go:go };
})();

// ============================================================
// NAVIGAZIONE
// ============================================================
function _buildNav() {
  var nav = document.getElementById("sidebar-nav");
  if (!nav) return;
  if (!F4.auth.isLogged()) { nav.innerHTML = ""; return; }
  var isAdmin = F4.auth.isAdmin();
  var isResp  = F4.auth.isResponsabile();
  var voci = [
    { id:"dashboard",    lbl:"Plancia Operativa",  icon:"&#127968;", always:true },
    { id:"anagrafica",   lbl:"Anagrafica Prodotti", icon:"&#128196;", always:true },
    { id:"giacenze",     lbl:"Giacenze e Lotti",    icon:"&#128200;", always:true },
    { id:"carico",       lbl:"Carico Merci",        icon:"&#128229;", always:true },
    { id:"scarico",      lbl:"Scarico Merci",       icon:"&#128230;", always:true },
    { id:"trasferimento",lbl:"Trasferimento",       icon:"&#8644;",   always:true },
    { id:"sfrido",       lbl:"Sfrido Intelligente", icon:"&#9986;",   always:true },
    { id:"macchinaTempo",lbl:"Macchina del Tempo",  icon:"&#128336;", always:true },
    { id:"listini",      lbl:"Listini e Sconti",    icon:"&#128181;", resp:true },
    { id:"reportistica", lbl:"Report ISO",          icon:"&#128196;", resp:true },
    { id:"magazzini",    lbl:"Gestione Magazzini",  icon:"&#127968;", admin:true },
    { id:"utenti",       lbl:"Gestione Utenti",     icon:"&#128100;", admin:true },
    { id:"auditLog",     lbl:"Audit Log",           icon:"&#128220;", admin:true },
    { id:"impostazioni", lbl:"Impostazioni",        icon:"&#9881;",   admin:true }
  ];
  var html = "";
  voci.forEach(function(v) {
    if (v.admin && !isAdmin) return;
    if (v.resp  && !isResp)  return;
    html += "<a class=\"nav-item\" data-route=\"" + v.id + "\" href=\"#\">" +
      "<span class=\"nav-icon\">" + v.icon + "</span>" +
      "<span class=\"nav-label\">" + v.lbl + "</span></a>";
  });
  nav.innerHTML = html;
  nav.querySelectorAll(".nav-item").forEach(function(a) {
    a.addEventListener("click", function(e) {
      e.preventDefault();
      F4.router.go(this.getAttribute("data-route"));
    });
  });
}

function _setActiveNav(routeName) {
  var nav = document.getElementById("sidebar-nav");
  if (!nav) return;
  nav.querySelectorAll(".nav-item").forEach(function(a) {
    a.classList.toggle("active", a.getAttribute("data-route") === routeName);
  });
}

function _updateUserBar() {
  var u = F4.auth.getUser();
  var el = document.getElementById("user-name");
  if (el && u) el.textContent = u.nomeCompleto || u.nome || u.username || "Utente";
}

function _toggleSidebar(force) {
  var sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  if (force === true)       sidebar.classList.add("open");
  else if (force === false) sidebar.classList.remove("open");
  else                      sidebar.classList.toggle("open");
}

// ============================================================
// REGISTRAZIONE VISTE
// ============================================================
function _registerRoutes() {
  F4.router.register("login",         _viewLogin);
  F4.router.register("dashboard",     F4.views.dashboard);
  F4.router.register("anagrafica",    F4.views.anagrafica);
  F4.router.register("giacenze",      F4.views.giacenze);
  F4.router.register("carico",        F4.views.carico);
  F4.router.register("scarico",       F4.views.scarico);
  F4.router.register("trasferimento", F4.views.trasferimento);
  F4.router.register("sfrido",        F4.views.sfrido);
  F4.router.register("macchinaTempo", F4.views.macchinaTempo);
  F4.router.register("listini",       F4.views.listini);
  F4.router.register("reportistica",  F4.views.reportistica);
  F4.router.register("magazzini",     F4.views.magazzini);
  F4.router.register("utenti",        F4.views.utenti);
  F4.router.register("auditLog",      F4.views.auditLog);
  F4.router.register("impostazioni",  F4.views.impostazioni);
}

// ============================================================
// LOGIN VIEW
// ============================================================
function _viewLogin(container) {
  container.innerHTML =
    "<div class=\"login-wrap\">" +
    "<div class=\"login-card glass\">" +
    "<div class=\"login-logo\"><img src=\"icon.png\" alt=\"F4\" onerror=\"this.style.display='none'\"></div>" +
    "<h1 class=\"login-title\">F4 Magazzino</h1>" +
    "<p class=\"login-sub\">Gestione Magazzino Coprifili</p>" +
    "<div class=\"form-group\"><label class=\"f4-label\">Username</label>" +
    "<input id=\"lg-user\" type=\"text\" class=\"f4-input\" placeholder=\"Username\" autocomplete=\"username\"></div>" +
    "<div class=\"form-group\"><label class=\"f4-label\">Password</label>" +
    "<input id=\"lg-pwd\" type=\"password\" class=\"f4-input\" placeholder=\"Password\" autocomplete=\"current-password\"></div>" +
    "<button id=\"lg-btn\" class=\"btn btn-primary btn-full\">Accedi</button>" +
    "<div id=\"lg-err\" style=\"display:none;margin-top:.75rem;padding:.6rem .9rem;background:rgba(244,67,54,.15);border:1px solid rgba(244,67,54,.4);color:#FF8A80;border-radius:8px;font-size:.88rem;\"></div>" +
    "</div></div>";

  function showErr(msg) {
    var el = document.getElementById("lg-err");
    if (el) { el.textContent = msg; el.style.display = "block"; }
  }

  function doLogin() {
    var u = (document.getElementById("lg-user").value || "").trim();
    var p =  document.getElementById("lg-pwd").value  || "";
    if (!u || !p) { showErr("Inserisci username e password"); return; }
    F4.ui.showSpinner("Accesso in corso...");
    F4.api.login({username: u, password: p}, function(err, res) {
      F4.ui.hideSpinner();
      if (err || !res || !res.success) {
        showErr(res ? (res.error || res.message || "Accesso negato") : "Errore di connessione");
        return;
      }
      // FIX CRITICO: backend ritorna res.utente + res.token (non res.user)
      var userData = res.utente || {};
      userData.token = res.token;
      F4.auth.login(userData);
      _buildNav();
      F4.router.go("dashboard");
    });
  }

  document.getElementById("lg-btn").addEventListener("click", doLogin);
  document.getElementById("lg-pwd").addEventListener("keydown", function(e) { if (e.key === "Enter") doLogin(); });
  document.getElementById("lg-user").addEventListener("keydown", function(e) { if (e.key === "Enter") document.getElementById("lg-pwd").focus(); });
}

// ============================================================
// INIZIALIZZAZIONE
// ============================================================
document.addEventListener("DOMContentLoaded", function() {
  var hamburger = document.getElementById("hamburger");
  if (hamburger) hamburger.addEventListener("click", function() { _toggleSidebar(); });

  var esciBtn = document.getElementById("btn-esci");
  if (esciBtn) esciBtn.addEventListener("click", function() {
    F4.auth.logout();
    _buildNav();
    F4.router.go("login");
  });

  _registerRoutes();

  if (F4.auth.isLogged()) {
    _buildNav();
    F4.router.go("dashboard");
  } else {
    F4.router.go("login");
  }
});
