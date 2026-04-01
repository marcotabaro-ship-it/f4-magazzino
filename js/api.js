// ============================================================
// F4 Magazzino — api.js v2.3
// ============================================================
var F4 = F4 || {};

F4.api = (function() {

  function _getUrl() {
    return (typeof F4 !== "undefined" && F4.CONFIG && F4.CONFIG.API_URL) ? F4.CONFIG.API_URL : "";
  }

  function _call(action, params, callback) {
    if (typeof params === "function") { callback = params; params = {}; }
    if (typeof callback !== "function") return;
    var url = _getUrl();
    if (!url) { callback("URL non configurato", null); return; }
    var payload = { action: action };
    var token = F4.auth ? F4.auth.getToken() : null;
    if (token) payload.token = token;
    if (params) { for (var k in params) { if (params.hasOwnProperty(k)) payload[k] = params[k]; } }

    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "text/plain;charset=utf-8");
    xhr.timeout = 30000;
    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 400) {
        try { callback(null, JSON.parse(xhr.responseText)); }
        catch(e) { callback("Risposta non valida", null); }
      } else if (xhr.status === 0) {
        // status 0 con risposta = redirect GAS seguito correttamente
        try { callback(null, JSON.parse(xhr.responseText)); }
        catch(e) { callback("Errore di rete", null); }
      } else {
        callback("Errore HTTP " + xhr.status, null);
      }
    };
    xhr.ontimeout = function() { callback("Timeout", null); };
    xhr.send(JSON.stringify(payload));
  }

  function login(p,cb)                   { _call("login",p,cb); }
  function getDashboard(cb)              { _call("getDashboard",{},cb); }
  function getAnagrafica(cb)             { _call("getAnagrafica",{},cb); }
  function getGiacenze(cb)               { _call("getGiacenze",{},cb); }
  function getMagazzini(cb)              { _call("getMagazzini",{},cb); }
  function creaMagazzino(p,cb)           { _call("creaMagazzino",p,cb); }
  function aggiornaMagazzino(p,cb)       { _call("aggiornaMagazzino",p,cb); }
  function caricaMerce(p,cb)             { _call("caricaMerce",p,cb); }
  function scaricoMerce(p,cb)            { _call("scaricoMerce",p,cb); }
  function trasferisciLotti(p,cb)        { _call("trasferisciLotti",p,cb); }
  function getStorico(p,cb)              { _call("getStorico",p,cb); }
  function getUtenti(cb)                 { _call("getUtenti",{},cb); }
  function creaUtente(p,cb)              { _call("creaUtente",p,cb); }
  function aggiornaUtente(p,cb)          { _call("aggiornaUtente",p,cb); }
  function resetPassword(p,cb)           { _call("resetPassword",p,cb); }
  function getAuditLog(cb)               { _call("getAuditLog",{},cb); }
  function getImpostazioni(cb)           { _call("getImpostazioni",{},cb); }
  function setImpostazioni(p,cb)         { _call("setImpostazioni",p,cb); }
  function getListiniCompleto(cb)        { _call("getListiniCompleto",{},cb); }
  function creaListino(p,cb)             { _call("creaListino",p,cb); }
  function attivaListino(p,cb)           { _call("attivaListino",p,cb); }
  function aggiornaScontiListino(p,cb)   { _call("aggiornaScontiListino",p,cb); }
  function generaReport(p,cb)            { _call("generaReport",p,cb); }

  return {
    login:login, getDashboard:getDashboard, getAnagrafica:getAnagrafica,
    getGiacenze:getGiacenze, getMagazzini:getMagazzini, creaMagazzino:creaMagazzino,
    aggiornaMagazzino:aggiornaMagazzino, caricaMerce:caricaMerce, scaricoMerce:scaricoMerce,
    trasferisciLotti:trasferisciLotti, getStorico:getStorico, getUtenti:getUtenti,
    creaUtente:creaUtente, aggiornaUtente:aggiornaUtente, resetPassword:resetPassword,
    getAuditLog:getAuditLog, getImpostazioni:getImpostazioni, setImpostazioni:setImpostazioni,
    getListiniCompleto:getListiniCompleto, creaListino:creaListino, attivaListino:attivaListino,
    aggiornaScontiListino:aggiornaScontiListino, generaReport:generaReport
  };
})();
