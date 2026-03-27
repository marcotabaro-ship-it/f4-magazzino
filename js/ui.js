// ============================================================
// ui.js — Componenti UI: spinner, notifiche, modal
// ============================================================

var F4 = window.F4 || {};

F4.ui = (function() {

  // ——— SPINNER ———
  function showSpinner(msg) {
    var el = document.getElementById("f4-spinner");
    if (!el) return;
    var txt = el.querySelector(".spinner-msg");
    if (txt) txt.textContent = msg || "Caricamento...";
    el.classList.remove("hidden");
  }

  function hideSpinner() {
    var el = document.getElementById("f4-spinner");
    if (el) el.classList.add("hidden");
  }

  // ——— NOTIFICHE ———
  function notify(msg, tipo) {
    var container = document.getElementById("f4-notify");
    if (!container) return;
    var div = document.createElement("div");
    div.className = "notify-item notify-" + (tipo || "info");
    div.textContent = msg;
    container.appendChild(div);
    setTimeout(function() { div.classList.add("fade-out"); }, 3200);
    setTimeout(function() { if (div.parentNode) div.parentNode.removeChild(div); }, 3800);
  }

  function ok(msg)    { notify(msg, "ok"); }
  function err(msg)   { notify(msg, "err"); }
  function warn(msg)  { notify(msg, "warn"); }
  function info(msg)  { notify(msg, "info"); }

  // ——— MODAL GENERICA ———
  function modal(titolo, htmlCorpo, bottoni) {
    var overlay = document.getElementById("f4-modal-overlay");
    var title   = document.getElementById("f4-modal-title");
    var body    = document.getElementById("f4-modal-body");
    var footer  = document.getElementById("f4-modal-footer");
    if (!overlay) return;

    title.textContent = titolo || "";
    body.innerHTML    = htmlCorpo || "";
    footer.innerHTML  = "";

    (bottoni || []).forEach(function(btn) {
      var b = document.createElement("button");
      b.className = "btn " + (btn.cls || "btn-secondary");
      b.textContent = btn.label || "OK";
      b.addEventListener("click", function() {
        if (btn.action) btn.action();
        if (btn.chiudi !== false) closeModal();
      });
      footer.appendChild(b);
    });

    overlay.classList.remove("hidden");
  }

  function closeModal() {
    var overlay = document.getElementById("f4-modal-overlay");
    if (overlay) overlay.classList.add("hidden");
  }

  // ——— MODAL CONFERMA ———
  function conferma(titolo, testo, cbSi, cbNo) {
    modal(titolo, "<p>" + testo + "</p>", [
      { label: "Annulla", cls: "btn-ghost", chiudi: true, action: cbNo || null },
      { label: "Conferma", cls: "btn-danger", chiudi: true, action: cbSi }
    ]);
  }

  // ——— MODAL CREA PRODOTTO AL VOLO ———
  function modalCreaProdotto(prefill, onSuccess) {
    var html = "<div class=\"form-grid\">" +
      "<div class=\"form-group\"><label>Tipologia</label>" +
      "<input id=\"mp-categoria\" class=\"f4-input\" value=\"" + (prefill.categoria || "") + "\" placeholder=\"es. Piatta PVC\"></div>" +
      "<div class=\"form-group\"><label>Materiale</label>" +
      "<input id=\"mp-materiale\" class=\"f4-input\" value=\"" + (prefill.materiale || "") + "\" placeholder=\"PVC / Alluminio\"></div>" +
      "<div class=\"form-group\"><label>Dimensioni</label>" +
      "<input id=\"mp-dimensioni\" class=\"f4-input\" value=\"" + (prefill.dimensioni || "") + "\" placeholder=\"es. 30/3\"></div>" +
      "<div class=\"form-group\"><label>Famiglia Colore</label>" +
      "<input id=\"mp-famiglia\" class=\"f4-input\" value=\"" + (prefill.famigliaColore || "") + "\" placeholder=\"Bianco / Decor / Standard\"></div>" +
      "<div class=\"form-group\"><label>Codice Colore</label>" +
      "<input id=\"mp-colore\" class=\"f4-input\" value=\"" + (prefill.codiceColore || "") + "\" placeholder=\"es. DP001\"></div>" +
      "<div class=\"form-group\"><label>U.M.</label>" +
      "<select id=\"mp-um\" class=\"f4-input\"><option value=\"ml\">ml</option><option value=\"pz\">pz</option></select></div>" +
      "</div>";

    modal("Nuovo Prodotto", html, [
      { label: "Annulla", cls: "btn-ghost" },
      {
        label: "Crea Prodotto",
        cls: "btn-primary",
        chiudi: false,
        action: function() {
          var dati = {
            categoria:      document.getElementById("mp-categoria").value.trim(),
            formaMateriale: document.getElementById("mp-materiale").value.trim(),
            dimensioni:     document.getElementById("mp-dimensioni").value.trim(),
            famigliaColore: document.getElementById("mp-famiglia").value.trim(),
            codiceColore:   document.getElementById("mp-colore").value.trim(),
            unitaMisura:    document.getElementById("mp-um").value
          };
          if (!dati.categoria || !dati.codiceColore) {
            err("Tipologia e Codice Colore sono obbligatori");
            return;
          }
          showSpinner("Creazione prodotto...");
          F4.api.creaProdotto(dati, function(e, r) {
            hideSpinner();
            if (e || !r || !r.success) {
              err("Errore: " + (r ? r.error : (e ? e.message : "sconosciuto")));
              return;
            }
            ok("Prodotto " + r.idProdotto + " creato");
            closeModal();
            if (onSuccess) onSuccess(r.idProdotto, dati);
          });
        }
      }
    ]);
  }

  // ——— HELPER HTML ———
  function esc(str) {
    return (str || "").toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtEuro(v) {
    if (v === null || v === undefined || v === "") return "—";
    return parseFloat(v).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20ac";
  }

  function fmtNum(v, dec) {
    if (v === null || v === undefined || v === "") return "—";
    return parseFloat(v).toLocaleString("it-IT", { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 2 });
  }

  function fmtData(v) {
    if (!v) return "—";
    return v.toString();
  }

  function renderTabellaVuota(msg) {
    return "<div class=\"empty-state\"><span class=\"icon\">&#128230;</span><p>" + esc(msg || "Nessun dato") + "</p></div>";
  }

  return {
    showSpinner: showSpinner,
    hideSpinner: hideSpinner,
    notify: notify,
    ok: ok,
    err: err,
    warn: warn,
    info: info,
    modal: modal,
    closeModal: closeModal,
    conferma: conferma,
    modalCreaProdotto: modalCreaProdotto,
    esc: esc,
    fmtEuro: fmtEuro,
    fmtNum: fmtNum,
    fmtData: fmtData,
    renderTabellaVuota: renderTabellaVuota
  };

})();

window.F4 = F4;
