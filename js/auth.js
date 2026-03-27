// ============================================================
// auth.js — Gestione sessione e accesso
// ============================================================

var F4 = window.F4 || {};

F4.auth = (function() {

  function getToken() {
    return localStorage.getItem(F4.CONFIG.SESSION_KEY) || "";
  }

  function getUtente() {
    try {
      var raw = localStorage.getItem(F4.CONFIG.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  }

  function isLogged() {
    return !!getToken();
  }

  function getRuolo() {
    var u = getUtente();
    return u ? (u.ruolo || "") : "";
  }

  function canDo(permesso) {
    var ruolo = getRuolo();
    var rbac = {
      "Admin":      { vediPrezzi: true,  gestioneUtenti: true,  gestioneListini: true,  movimenti: true, rettifica: true,  audit: true,  dashboard: true,  snapshotStorico: true },
      "Management": { vediPrezzi: true,  gestioneUtenti: false, gestioneListini: false, movimenti: true, rettifica: false, audit: true,  dashboard: true,  snapshotStorico: true },
      "Operativo":  { vediPrezzi: false, gestioneUtenti: false, gestioneListini: false, movimenti: true, rettifica: false, audit: false, dashboard: false, snapshotStorico: false }
    };
    return rbac[ruolo] ? (rbac[ruolo][permesso] === true) : false;
  }

  function login(email, password, callback) {
    F4.ui.showSpinner("Accesso in corso...");
    F4.api.login(email, password, function(err, res) {
      F4.ui.hideSpinner();
      if (err || !res) {
        callback("Errore di rete. Riprova.");
        return;
      }
      if (!res.success) {
        callback(res.error || "Credenziali non valide");
        return;
      }
      localStorage.setItem(F4.CONFIG.SESSION_KEY, res.token);
      localStorage.setItem(F4.CONFIG.USER_KEY, JSON.stringify(res.utente));
      callback(null, res.utente);
    });
  }

  function logout(forced) {
    var token = getToken();
    localStorage.removeItem(F4.CONFIG.SESSION_KEY);
    localStorage.removeItem(F4.CONFIG.USER_KEY);
    if (token) F4.api.logout(function() {});
    if (forced) F4.ui.warn("Sessione scaduta. Effettua nuovamente il login.");
    setTimeout(function() { F4.router.go("login"); }, forced ? 1200 : 0);
  }

  return {
    getToken: getToken,
    getUtente: getUtente,
    isLogged: isLogged,
    getRuolo: getRuolo,
    canDo: canDo,
    login: login,
    logout: logout
  };

})();

window.F4 = F4;
