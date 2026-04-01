// ============================================================
// F4 Magazzino — api.js v2.3
// Tutte le chiamate seguono la firma: fn(params, callback)
// oppure fn(callback) quando non ci sono parametri.
// callback = function(err, response)
// ============================================================

var F4 = F4 || {};

F4.api = (function() {

  var GAS_URL = "";

  function _getUrl() {
    if (GAS_URL) return GAS_URL;
    if (typeof F4_CONFIG !== "undefined" && F4_CONFIG.GAS_URL) {
      GAS_URL = F4_CONFIG.GAS_URL;
    }
    return GAS_URL;
  }

  function _call(action, params, callback) {
    // Supporta sia _call(action, callback) che _call(action, params, callback)
    if (typeof params === "function") {
      callback = params;
      params = {};
    }
    if (typeof callback !== "function") {
      console.error("F4.api._call: callback non e una funzione per action=" + action);
      return;
    }

    var url = _getUrl();
    if (!url) {
      callback("GAS_URL non configurato", null);
      return;
    }

    var payload = { action: action };
    var token = F4.auth ? F4.auth.getToken() : null;
    if (token) payload.token = token;
    if (params) {
      for (var k in params) {
        if (params.hasOwnProperty(k)) payload[k] = params[k];
      }
    }

    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "text/plain;charset=utf-8");
    xhr.timeout = 30000;

    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var data = JSON.parse(xhr.responseText);
          callback(null, data);
        } catch(e) {
          callback("Risposta non valida dal server", null);
        }
      } else {
        callback("Errore HTTP " + xhr.status, null);
      }
    };

    xhr.onerror = function() { callback("Errore di rete", null); };
    xhr.ontimeout = function() { callback("Timeout", null); };

    xhr.send(JSON.stringify(payload));
  }

  // ── AUTH ──────────────────────────────────────────────────
  function login(params, callback) {
    _call("login", params, callback);
  }

  // ── DASHBOARD ─────────────────────────────────────────────
  function getDashboard(callback) {
    _call("getDashboard", {}, callback);
  }

  // ── ANAGRAFICA ────────────────────────────────────────────
  function getAnagrafica(callback) {
    _call("getAnagrafica", {}, callback);
  }

  // ── GIACENZE ──────────────────────────────────────────────
  function getGiacenze(callback) {
    _call("getGiacenze", {}, callback);
  }

  // ── MAGAZZINI ─────────────────────────────────────────────
  function getMagazzini(callback) {
    _call("getMagazzini", {}, callback);
  }

  function creaMagazzino(params, callback) {
    _call("creaMagazzino", params, callback);
  }

  function aggiornaMagazzino(params, callback) {
    _call("aggiornaMagazzino", params, callback);
  }

  // ── CARICO / SCARICO ──────────────────────────────────────
  function caricaMerce(params, callback) {
    _call("caricaMerce", params, callback);
  }

  function scaricoMerce(params, callback) {
    _call("scaricoMerce", params, callback);
  }

  // ── TRASFERIMENTO ─────────────────────────────────────────
  function trasferisciLotti(params, callback) {
    _call("trasferisciLotti", params, callback);
  }

  // ── STORICO ───────────────────────────────────────────────
  function getStorico(params, callback) {
    _call("getStorico", params, callback);
  }

  // ── UTENTI ────────────────────────────────────────────────
  function getUtenti(callback) {
    _call("getUtenti", {}, callback);
  }

  function creaUtente(params, callback) {
    _call("creaUtente", params, callback);
  }

  function aggiornaUtente(params, callback) {
    _call("aggiornaUtente", params, callback);
  }

  function resetPassword(params, callback) {
    _call("resetPassword", params, callback);
  }

  // ── AUDIT LOG ─────────────────────────────────────────────
  function getAuditLog(callback) {
    _call("getAuditLog", {}, callback);
  }

  // ── IMPOSTAZIONI ──────────────────────────────────────────
  function getImpostazioni(callback) {
    _call("getImpostazioni", {}, callback);
  }

  function setImpostazioni(params, callback) {
    _call("setImpostazioni", params, callback);
  }

  // ── LISTINI E SCONTI ──────────────────────────────────────
  function getListiniCompleto(callback) {
    _call("getListiniCompleto", {}, callback);
  }

  function creaListino(params, callback) {
    _call("creaListino", params, callback);
  }

  function attivaListino(params, callback) {
    _call("attivaListino", params, callback);
  }

  function aggiornaScontiListino(params, callback) {
    _call("aggiornaScontiListino", params, callback);
  }

  // ── REPORT ────────────────────────────────────────────────
  function generaReport(params, callback) {
    _call("generaReport", params, callback);
  }

  return {
    login:                login,
    getDashboard:         getDashboard,
    getAnagrafica:        getAnagrafica,
    getGiacenze:          getGiacenze,
    getMagazzini:         getMagazzini,
    creaMagazzino:        creaMagazzino,
    aggiornaMagazzino:    aggiornaMagazzino,
    caricaMerce:          caricaMerce,
    scaricoMerce:         scaricoMerce,
    trasferisciLotti:     trasferisciLotti,
    getStorico:           getStorico,
    getUtenti:            getUtenti,
    creaUtente:           creaUtente,
    aggiornaUtente:       aggiornaUtente,
    resetPassword:        resetPassword,
    getAuditLog:          getAuditLog,
    getImpostazioni:      getImpostazioni,
    setImpostazioni:      setImpostazioni,
    getListiniCompleto:   getListiniCompleto,
    creaListino:          creaListino,
    attivaListino:        attivaListino,
    aggiornaScontiListino:aggiornaScontiListino,
    generaReport:         generaReport
  };

})();
