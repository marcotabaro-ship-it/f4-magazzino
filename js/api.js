// ============================================================
// F4 Magazzino — api.js v3
// Usa GET con ?payload= per evitare problemi CORS con Apps Script
// ============================================================
var F4 = F4 || {};

F4.api = (function() {

  function _getUrl() {
    return (typeof F4 !== "undefined" && F4.CONFIG && F4.CONFIG.API_URL) ? F4.CONFIG.API_URL : "";
  }

  // Chiamata GET con payload JSON in query string
  function _call(action, params, callback) {
    if (typeof params === "function") { callback = params; params = {}; }
    if (typeof callback !== "function") return;
    var url = _getUrl();
    if (!url) { callback("URL non configurato", null); return; }
    var payload = { action: action };
    var token = F4.auth ? F4.auth.getToken() : null;
    if (token) payload.token = token;
    if (params) {
      for (var k in params) {
        if (params.hasOwnProperty(k)) payload[k] = params[k];
      }
    }
    var queryUrl = url + "?payload=" + encodeURIComponent(JSON.stringify(payload));
    var xhr = new XMLHttpRequest();
    xhr.open("GET", queryUrl, true);
    xhr.timeout = 30000;
    xhr.onload = function() {
      try {
        var data = JSON.parse(xhr.responseText);
        callback(null, data);
      } catch(e) {
        callback("Risposta non valida", null);
      }
    };
    xhr.onerror   = function() { callback("Errore di rete",  null); };
    xhr.ontimeout = function() { callback("Timeout",         null); };
    xhr.send();
  }

  // ——— TRASFORMAZIONI (backend camelCase -> frontend UPPER_SNAKE_CASE) ———

  function _tMag(r) {
    return {
      ID_MAGAZZINO:   r.idMagazzino   || "",
      NOME_MAGAZZINO: r.nomeMagazzino || r.nome || "",
      SEDE:           r.indirizzo     || r.sede || "",
      STATO:          r.stato         || "Attivo"
    };
  }

  function _tUtente(r) {
    return {
      ID_UTENTE:    r.idUtente   || "",
      USERNAME:     r.username   || "",
      NOME_COMPLETO:r.nome       || "",
      RUOLO:        r.ruolo      || "",
      ATTIVO:       r.stato === "Attivo" || r.attivo === true || r.attivo === 1,
      EMAIL:        r.email      || ""
    };
  }

  function _tAudit(r) {
    var det = "";
    if (r.idProdotto)       det += r.idProdotto;
    if (r.idMagazzinoOrig)  det += " da " + r.idMagazzinoOrig;
    if (r.idMagazzinoDest)  det += " a " + r.idMagazzinoDest;
    if (r.quantitaMov)      det += " qty:" + r.quantitaMov;
    return {
      TIMESTAMP: r.dataOra    || "",
      USERNAME:  r.operatore  || "",
      AZIONE:    r.tipoMovimento || "",
      DETTAGLIO: det || r.idTransazione || ""
    };
  }

  // ——— AUTH ———

  function login(params, callback) {
    _call("login", params, callback);
  }

  // ——— DASHBOARD ———

  function getDashboard(callback) {
    _call("getDashboard", {}, callback);
    // Il backend v3 ritorna gia i campi giusti
  }

  // ——— ANAGRAFICA ———
  // Il backend v3 ritorna gia UPPER_SNAKE_CASE per getAnagrafica

  function getAnagrafica(callback) {
    _call("getAnagrafica", {}, callback);
  }

  // ——— GIACENZE ———
  // Il backend v3 ritorna gia UPPER_SNAKE_CASE per getGiacenze

  function getGiacenze(callback) {
    _call("getGiacenze", {}, callback);
  }

  // ——— MAGAZZINI ———

  function getMagazzini(callback) {
    _call("getMagazzini", {}, function(err, res) {
      if (!err && res && res.data) {
        res.data = res.data.map(_tMag);
      }
      callback(err, res);
    });
  }

  function creaMagazzino(params, callback) {
    var p = {
      nomeMagazzino: params.nome || params.nomeMagazzino || "",
      indirizzo:     params.sede || params.indirizzo     || "",
      tipoUbicazione: params.tipoUbicazione || "Magazzino"
    };
    _call("creaMagazzino", p, callback);
  }

  function aggiornaMagazzino(params, callback) {
    var p = {
      idMagazzino:   params.id   || params.idMagazzino   || "",
      nomeMagazzino: params.nome || params.nomeMagazzino || "",
      indirizzo:     params.sede || params.indirizzo     || "",
      stato:         params.stato || "Attivo"
    };
    _call("aggiornaMagazzino", p, callback);
  }

  // ——— MOVIMENTI ———

  function caricaMerce(params, callback) {
    _call("caricaMerce", params, callback);
  }

  function scaricoMerce(params, callback) {
    _call("scaricoMerce", params, callback);
  }

  function trasferisciLotti(params, callback) {
    _call("trasferisciLotti", params, callback);
  }

  // ——— STORICO ———

  function getStorico(params, callback) {
    _call("getStorico", params, function(err, res) {
      if (!err && res && res.data) {
        res.data = res.data.map(function(r) {
          return {
            ID_LOTTO:        (r.idMagazzino || "") + "_" + (r.idProdotto || ""),
            ID_PRODOTTO:     r.idProdotto    || "",
            TIPO_PEZZO:      "Barra",
            LUNGHEZZA_ML:    null,
            QUANTITA_PZ:     r.quantita      || 0,
            NOME_MAGAZZINO:  r.idMagazzino   || "",
            VAL_TOTALE:      null
          };
        });
      }
      callback(err, res);
    });
  }

  // ——— UTENTI ———

  function getUtenti(callback) {
    _call("getUtenti", {}, function(err, res) {
      if (!err && res && res.data) {
        res.data = res.data.map(_tUtente);
      }
      callback(err, res);
    });
  }

  function creaUtente(params, callback) {
    var p = {
      nome:     params.nomeCompleto || params.nome     || "",
      email:    params.email        || "",
      ruolo:    params.ruolo        || "Operativo",
      username: params.username     || "",
      password: params.password     || ""
    };
    _call("creaUtente", p, callback);
  }

  function aggiornaUtente(params, callback) {
    var p = {
      idUtente: params.id      || params.idUtente  || "",
      nome:     params.nomeCompleto || params.nome || "",
      ruolo:    params.ruolo   || "",
      stato:    (params.attivo === false || params.attivo === 0) ? "Disattivato" : "Attivo"
    };
    _call("aggiornaUtente", p, callback);
  }

  function resetPassword(params, callback) {
    var p = {
      idUtente: params.id          || params.idUtente  || "",
      password: params.newPassword || params.password  || ""
    };
    _call("resetPassword", p, callback);
  }

  // ——— AUDIT LOG ———

  function getAuditLog(callback) {
    _call("getAuditLog", {limit: 200}, function(err, res) {
      if (!err && res && res.data) {
        res.data = res.data.map(_tAudit);
      }
      callback(err, res);
    });
  }

  // ——— IMPOSTAZIONI ———

  function getImpostazioni(callback) {
    _call("getImpostazioni", {}, callback);
  }

  function setImpostazioni(params, callback) {
    _call("setImpostazioni", params, callback);
  }

  // ——— LISTINI E SCONTI ———

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

  // ——— REPORT ———

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
