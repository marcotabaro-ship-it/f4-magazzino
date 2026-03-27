// ============================================================
// app.js — Router principale e inizializzazione F4 Magazzino
// ============================================================

var F4 = window.F4 || {};

// ——— ROUTER ———
F4.router = (function() {

  var routes = {
    "login":         { view: F4.views.login,        auth: false, title: "Accesso" },
    "dashboard":     { view: F4.views.dashboard,    auth: true,  title: "Plancia Operativa" },
    "anagrafica":    { view: F4.views.anagrafica,   auth: true,  title: "Anagrafica Prodotti" },
    "giacenze":      { view: F4.views.giacenze,     auth: true,  title: "Giacenze e Lotti" },
    "carico":        { view: F4.views.carico,       auth: true,  title: "Carico Merce" },
    "scarico":       { view: F4.views.scarico,      auth: true,  title: "Scarico Merce" },
    "trasferimento": { view: F4.views.trasferimento,auth: true,  title: "Trasferimento" },
    "sfrido":        { view: F4.views.sfrido,       auth: true,  title: "Sfrido Intelligente" },
    "storico":       { view: F4.views.storico,      auth: true,  title: "Macchina del Tempo",  perm: "snapshotStorico" },
    "magazzini":     { view: F4.views.magazzini,    auth: true,  title: "Magazzini" },
    "utenti":        { view: F4.views.utenti,       auth: true,  title: "Utenti",              perm: "gestioneUtenti" },
    "audit":         { view: F4.views.audit,        auth: true,  title: "Audit Log",           perm: "audit" },
    "impostazioni":  { view: F4.views.impostazioni, auth: true,  title: "Impostazioni" }
  };

  function go(routeName) {
    var route = routes[routeName] || routes["dashboard"];

    if (route.auth && !F4.auth.isLogged()) {
      _render("login");
      return;
    }
    if (!route.auth && F4.auth.isLogged()) {
      _render("dashboard");
      return;
    }

    _render(routeName);
  }

  function _render(routeName) {
    var route = routes[routeName];
    if (!route) return;

    var container = document.getElementById("view-container");
    if (!container) return;

    container.innerHTML = "";

    _setActiveNav(routeName);
    _updateUserBar();
    _toggleSidebar(false);

    if (route.view) {
      route.view(container);
    }
  }

  function _setActiveNav(routeName) {
    var links = document.querySelectorAll(".nav-link");
    links.forEach(function(l) {
      l.classList.remove("active");
      if (l.dataset.route === routeName) l.classList.add("active");
    });
  }

  function _updateUserBar() {
    var utente = F4.auth.getUtente();
    var bar = document.getElementById("user-bar");
    if (!bar) return;
    if (!utente) { bar.innerHTML = ""; return; }
    bar.innerHTML = "<span class=\"user-name\">" + F4.ui.esc(utente.nome) + "</span>" +
      "<span class=\"user-role badge badge-gold\">" + F4.ui.esc(utente.ruolo) + "</span>" +
      "<button class=\"btn btn-sm btn-ghost\" id=\"btn-logout\">Esci</button>";
    var btnLogout = document.getElementById("btn-logout");
    if (btnLogout) btnLogout.addEventListener("click", function() { F4.auth.logout(); });
  }

  function _toggleSidebar(force) {
    var sidebar = document.getElementById("sidebar");
    var overlay = document.getElementById("sidebar-overlay");
    if (!sidebar) return;
    var isOpen = !sidebar.classList.contains("closed");
    var shouldOpen = (force !== undefined) ? force : !isOpen;
    if (shouldOpen) {
      sidebar.classList.remove("closed");
      if (overlay) overlay.classList.remove("hidden");
    } else {
      sidebar.classList.add("closed");
      if (overlay) overlay.classList.add("hidden");
    }
  }

  return { go: go, toggleSidebar: _toggleSidebar };

})();

// ——— INIZIALIZZAZIONE APP ———
document.addEventListener("DOMContentLoaded", function() {

  // Hamburger menu
  var hamburger = document.getElementById("hamburger");
  if (hamburger) hamburger.addEventListener("click", function() { F4.router.toggleSidebar(); });

  var overlay = document.getElementById("sidebar-overlay");
  if (overlay) overlay.addEventListener("click", function() { F4.router.toggleSidebar(false); });

  // Navigazione sidebar
  var navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(function(link) {
    link.addEventListener("click", function(e) {
      e.preventDefault();
      var route = link.dataset.route;
      if (route) F4.router.go(route);
    });
  });

  // Chiudi modal
  var modalClose = document.getElementById("f4-modal-close");
  if (modalClose) modalClose.addEventListener("click", function() { F4.ui.closeModal(); });
  var modalOverlay = document.getElementById("f4-modal-overlay");
  if (modalOverlay) modalOverlay.addEventListener("click", function(e) {
    if (e.target === modalOverlay) F4.ui.closeModal();
  });

  // Sidebar: costruisci nav in base al ruolo
  _buildNav();

  // Route iniziale
  if (F4.auth.isLogged()) {
    F4.router.go("dashboard");
  } else {
    F4.router.go("login");
  }
});

function _buildNav() {
  var nav = document.getElementById("nav-menu");
  if (!nav) return;

  var items = [
    { route: "dashboard",     icon: "&#127968;", label: "Plancia",           perm: null },
    { route: "carico",        icon: "&#10133;",  label: "Carico",            perm: null },
    { route: "scarico",       icon: "&#10134;",  label: "Scarico",           perm: null },
    { route: "trasferimento", icon: "&#8644;",   label: "Trasferimento",     perm: null },
    { route: "giacenze",      icon: "&#128197;", label: "Giacenze",          perm: null },
    { route: "anagrafica",    icon: "&#128196;", label: "Anagrafica",        perm: null },
    { route: "sfrido",        icon: "&#9986;",   label: "Sfrido",            perm: null },
    { route: "storico",       icon: "&#8987;",   label: "Macchina del Tempo",perm: "snapshotStorico" },
    { route: "magazzini",     icon: "&#127968;", label: "Magazzini",         perm: null },
    { route: "utenti",        icon: "&#128100;", label: "Utenti",            perm: "gestioneUtenti" },
    { route: "audit",         icon: "&#128221;", label: "Audit Log",         perm: "audit" },
    { route: "impostazioni",  icon: "&#9881;",   label: "Impostazioni",      perm: null }
  ];

  nav.innerHTML = "";
  items.forEach(function(item) {
    if (item.perm && !F4.auth.canDo(item.perm)) return;
    if (!F4.auth.isLogged() && item.route !== "login") return;
    var a = document.createElement("a");
    a.href = "#";
    a.className = "nav-link";
    a.dataset.route = item.route;
    a.innerHTML = "<span class=\"nav-icon\">" + item.icon + "</span><span class=\"nav-label\">" + item.label + "</span>";
    a.addEventListener("click", function(e) {
      e.preventDefault();
      F4.router.go(item.route);
    });
    nav.appendChild(a);
  });
}

window.F4 = F4;
