// ============================================================
// api.js — Layer API F4 Magazzino
// ============================================================

var F4 = window.F4 || {};

F4.api = (function() {

  function _getToken() {
    return localStorage.getItem(F4.CONFIG.SESSION_KEY) || "";
  }

  function call(action, params, callback) {
    var payload = Object.assign({}, params || {});
    payload.action = action;
    var token = _getToken();
    if (token) payload.token = token;

    var url = F4.CONFIG.API_URL;
    var opts = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    };

    fetch(url, opts)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error === "Sessione non valida. Effettua il login.") {
          F4.auth.logout(true);
          return;
        }
        callback(null, data);
      })
      .catch(function(err) {
        callback(err, null);
      });
  }

  // ——— AUTH ———
  function login(email, password, cb) {
    call("login", { email: email, password: password }, cb);
  }

  function logout(cb) {
    var token = _getToken();
    call("logout", { token: token }, cb || function() {});
  }

  function getMe(cb) { call("getMe", {}, cb); }

  // ——— PRODOTTI ———
  function getProdotti(filtri, cb) { call("getProdotti", filtri || {}, cb); }
  function getProdotto(idProdotto, cb) { call("getProdotto", { idProdotto: idProdotto }, cb); }
  function creaProdotto(dati, cb) { call("creaProdotto", dati, cb); }
  function aggiornaProdotto(dati, cb) { call("aggiornaProdotto", dati, cb); }

  // ——— LISTINI ———
  function getListino(idProdotto, cb) {
    call("getListino", idProdotto ? { idProdotto: idProdotto } : {}, cb);
  }
  function getImpostazioni(cb) { call("getImpostazioni", {}, cb); }
  function setSconto(sconto, cb) { call("setSconto", { sconto: sconto }, cb); }

  // ——— GIACENZE ———
  function getGiacenze(filtri, cb) { call("getGiacenze", filtri || {}, cb); }
  function getLotti(filtri, cb)    { call("getLotti",    filtri || {}, cb); }

  // ——— MOVIMENTI ———
  function carico(dati, cb)         { call("carico",         dati, cb); }
  function scarico(dati, cb)        { call("scarico",        dati, cb); }
  function trasferimento(dati, cb)  { call("trasferimento",  dati, cb); }
  function rettifica(dati, cb)      { call("rettifica",      dati, cb); }

  // ——— MAGAZZINI ———
  function getMagazzini(cb)          { call("getMagazzini", {}, cb); }
  function creaMagazzino(dati, cb)   { call("creaMagazzino", dati, cb); }
  function aggiornaMagazzino(d, cb)  { call("aggiornaMagazzino", d, cb); }

  // ——— UTENTI ———
  function getUtenti(cb)             { call("getUtenti", {}, cb); }
  function creaUtente(dati, cb)      { call("creaUtente", dati, cb); }
  function aggiornaUtente(dati, cb)  { call("aggiornaUtente", dati, cb); }
  function impostaPassword(dati, cb) { call("impostaPassword", dati, cb); }

  // ——— AUDIT ———
  function getAudit(filtri, cb) { call("getAudit", filtri || {}, cb); }

  // ——— DASHBOARD ———
  function getDashboard(cb) { call("getDashboard", {}, cb); }

  // ——— MACCHINA DEL TEMPO ———
  function getSnapshotStorico(dataRif, cb) {
    call("getSnapshotStorico", { dataRiferimento: dataRif }, cb);
  }

  // ——— SFRIDO ———
  function cercaSfrido(lunghezza, idProdotto, idMagazzino, cb) {
    var p = { lunghezzaRichiesta: lunghezza };
    if (idProdotto)  p.idProdotto  = idProdotto;
    if (idMagazzino) p.idMagazzino = idMagazzino;
    call("cercaSfrido", p, cb);
  }

  return {
    call: call,
    login: login,
    logout: logout,
    getMe: getMe,
    getProdotti: getProdotti,
    getProdotto: getProdotto,
    creaProdotto: creaProdotto,
    aggiornaProdotto: aggiornaProdotto,
    getListino: getListino,
    getImpostazioni: getImpostazioni,
    setSconto: setSconto,
    getGiacenze: getGiacenze,
    getLotti: getLotti,
    carico: carico,
    scarico: scarico,
    trasferimento: trasferimento,
    rettifica: rettifica,
    getMagazzini: getMagazzini,
    creaMagazzino: creaMagazzino,
    aggiornaMagazzino: aggiornaMagazzino,
    getUtenti: getUtenti,
    creaUtente: creaUtente,
    aggiornaUtente: aggiornaUtente,
    impostaPassword: impostaPassword,
    getAudit: getAudit,
    getDashboard: getDashboard,
    getSnapshotStorico: getSnapshotStorico,
    cercaSfrido: cercaSfrido
  };

})();

window.F4 = F4;
