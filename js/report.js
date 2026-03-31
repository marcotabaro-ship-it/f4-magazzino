// ============================================================
// report.js — Motore Report ISO F4 Magazzino
// ============================================================

var F4 = window.F4 || {};

F4.report = (function() {

  var _numDoc = 1;

  function _fmtEuro(v) {
    if (v === null || v === undefined || v === "") return "—";
    return parseFloat(v).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20ac";
  }

  function _fmtNum(v, dec) {
    if (v === null || v === undefined || v === "") return "—";
    return parseFloat(v).toLocaleString("it-IT", { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 2 });
  }

  function _esc(s) {
    return (s || "").toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function _oggi() {
    var d = new Date();
    return d.toLocaleDateString("it-IT");
  }

  function _ora() {
    var d = new Date();
    return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  }

  function _nomeDocumento(tipo) {
    var mappa = {
      "GIACENZE":           "Inventario Giacenze",
      "MOVIMENTI":          "Storico Movimenti",
      "SCHEDA_PRODOTTO":    "Scheda Prodotto",
      "RIEPILOGO_MAGAZZINI":"Riepilogo Magazzini"
    };
    return mappa[tipo] || tipo;
  }

  // ——— CARTIGLIO ISO HEADER ———
  function _buildHeader(data, progressivo) {
    var utente = F4.auth.getUtente();
    var nomeUtente = utente ? (utente.nome + " " + (utente.cognome || "")).trim() : "—";
    var numDoc = "RPT-" + new Date().getFullYear() + "-" + String(progressivo).padStart(4, "0");

    return "<div class=\"rpt-header\">" +
      "<div class=\"rpt-header-logo\">" +
        "<img src=\"icons/icon-192.png\" alt=\"F4\">" +
      "</div>" +
      "<div class=\"rpt-header-main\">" +
        "<div class=\"rpt-header-title\">FINESTRA 4 S.R.L. &mdash; " + _esc(_nomeDocumento(data.tipo)) + "</div>" +
        "<div class=\"rpt-header-meta\">" +
          "<div class=\"rpt-meta-cell\">" +
            "<span class=\"rpt-meta-label\">N. Documento</span>" +
            "<span class=\"rpt-meta-value\">" + _esc(numDoc) + "</span>" +
          "</div>" +
          "<div class=\"rpt-meta-cell\">" +
            "<span class=\"rpt-meta-label\">Data Emissione</span>" +
            "<span class=\"rpt-meta-value\">" + _oggi() + "</span>" +
          "</div>" +
          "<div class=\"rpt-meta-cell\">" +
            "<span class=\"rpt-meta-label\">Ora</span>" +
            "<span class=\"rpt-meta-value\">" + _ora() + "</span>" +
          "</div>" +
          "<div class=\"rpt-meta-cell\">" +
            "<span class=\"rpt-meta-label\">Emesso da</span>" +
            "<span class=\"rpt-meta-value\">" + _esc(nomeUtente) + "</span>" +
          "</div>" +
        "</div>" +
      "</div>" +
    "</div>";
  }

  // ——— FOOTER ISO ———
  function _buildFooter(data, pagina, totPagine) {
    var utente = F4.auth.getUtente();
    var ruolo  = utente ? utente.ruolo : "";
    return "<div class=\"rpt-footer\">" +
      "<div class=\"rpt-footer-left\">" +
        "<strong>Finestra 4 S.r.l.</strong> &mdash; Gestionale Magazzino Coprifili Internorm<br>" +
        "Documento generato il " + _oggi() + " alle " + _ora() + " da " + _esc((utente ? utente.nome : "") + " (" + ruolo + ")") +
      "</div>" +
      "<div class=\"rpt-footer-right\">" +
        "Pag. " + pagina + " / " + totPagine +
      "</div>" +
    "</div>";
  }

  // ——— BLOCCO TOTALI ———
  function _buildTotali(totali, vediPrezzi) {
    var html = "<div class=\"rpt-totali\">";
    html += "<div class=\"rpt-totali-row\">" +
      "<div class=\"rpt-totali-label\">Totale Pezzi</div>" +
      "<div class=\"rpt-totali-value\">" + _fmtNum(totali.pezzi, 0) + "</div>" +
      "</div>";
    if (vediPrezzi && totali.valore !== null && totali.valore !== undefined) {
      html += "<div class=\"rpt-totali-row\">" +
        "<div class=\"rpt-totali-label\">Valore Totale</div>" +
        "<div class=\"rpt-totali-value\">" + _fmtEuro(totali.valore) + "</div>" +
        "</div>";
    }
    if (totali.movimenti !== undefined) {
      html += "<div class=\"rpt-totali-row\">" +
        "<div class=\"rpt-totali-label\">Totale Movimenti</div>" +
        "<div class=\"rpt-totali-value\">" + _fmtNum(totali.movimenti, 0) + "</div>" +
        "</div>";
    }
    html += "</div>";
    return html;
  }

  // ——— RENDERER: GIACENZE ———
  function _renderGiacenze(data) {
    var vediPrezzi = F4.auth.canDo("vediPrezzi");
    var html = _buildHeader(data, ++_numDoc);

    html += "<div class=\"rpt-section-title\">Inventario Giacenze</div>";
    html += "<table class=\"rpt-table\"><thead><tr>" +
      "<th>Lotto</th><th>Prodotto</th><th>Cod.Int.</th><th>Magazzino</th>" +
      "<th>Tipo</th><th>Lungh.(ml)</th><th>Pezzi</th><th>Famiglia</th><th>Colore</th>" +
      (vediPrezzi ? "<th>Val.Unit.</th><th>Val.Totale</th>" : "") +
      "<th>Data Carico</th>" +
      "</tr></thead><tbody>";

    (data.righe || []).forEach(function(r) {
      var tipoClass = r.tipoPezzo === "Residuo" ? "rpt-badge-warn" : "rpt-badge-ok";
      html += "<tr>" +
        "<td><span class=\"rpt-badge rpt-badge-blue\">" + _esc(r.idLotto) + "</span></td>" +
        "<td>" + _esc(r.descrizione || r.idProdotto) + "</td>" +
        "<td>" + _esc(r.codInternorm) + "</td>" +
        "<td>" + _esc(r.nomeMag) + "</td>" +
        "<td><span class=\"rpt-badge " + tipoClass + "\">" + _esc(r.tipoPezzo) + "</span></td>" +
        "<td>" + _fmtNum(r.lunghezzaMl, 2) + "</td>" +
        "<td><strong>" + _fmtNum(r.quantitaPz, 0) + "</strong></td>" +
        "<td>" + _esc(r.famiglia) + "</td>" +
        "<td>" + _esc(r.colore) + "</td>" +
        (vediPrezzi ? "<td>" + _fmtEuro(r.valoreUnitario) + "</td><td>" + _fmtEuro(r.valoreTotale) + "</td>" : "") +
        "<td>" + _esc(r.dataCarico) + "</td>" +
        "</tr>";
    });
    html += "</tbody></table>";
    html += _buildTotali(data.totali, vediPrezzi);
    html += _buildFooter(data, 1, 1);
    return html;
  }

  // ——— RENDERER: MOVIMENTI ———
  function _renderMovimenti(data) {
    var html = _buildHeader(data, ++_numDoc);
    html += "<div class=\"rpt-section-title\">Storico Movimenti</div>";
    html += "<table class=\"rpt-table\"><thead><tr>" +
      "<th>ID Trans.</th><th>Data/Ora</th><th>Operatore</th><th>Tipo</th>" +
      "<th>Mag.Orig.</th><th>Mag.Dest.</th><th>Prodotto</th><th>Lungh.</th><th>Qty</th>" +
      "</tr></thead><tbody>";

    (data.righe || []).forEach(function(r) {
      var tipoClass = r.tipoMovimento === "CARICO" ? "rpt-badge-ok" :
                      (r.tipoMovimento === "SCARICO" ? "rpt-badge-warn" : "rpt-badge-blue");
      html += "<tr>" +
        "<td>" + _esc(r.idTransazione) + "</td>" +
        "<td>" + _esc(r.dataOra) + "</td>" +
        "<td>" + _esc(r.operatore) + "</td>" +
        "<td><span class=\"rpt-badge " + tipoClass + "\">" + _esc(r.tipoMovimento) + "</span></td>" +
        "<td>" + _esc(r.magOrigine) + "</td>" +
        "<td>" + _esc(r.magDestinazione) + "</td>" +
        "<td>" + _esc(r.idProdotto) + "</td>" +
        "<td>" + _fmtNum(r.lunghezzaMov, 2) + "</td>" +
        "<td>" + _fmtNum(r.quantitaMov, 0) + "</td>" +
        "</tr>";
    });
    html += "</tbody></table>";
    html += _buildTotali(data.totali, false);
    html += _buildFooter(data, 1, 1);
    return html;
  }

  // ——— RENDERER: SCHEDA PRODOTTO ———
  function _renderSchedaProdotto(data) {
    var vediPrezzi = F4.auth.canDo("vediPrezzi");
    var p = data.prodotto || {};
    var html = _buildHeader(data, ++_numDoc);

    html += "<div class=\"rpt-section-title\">Scheda Prodotto</div>";
    html += "<div class=\"rpt-info-grid\">" +
      "<div class=\"rpt-info-item\"><span class=\"rpt-info-label\">ID Prodotto</span><span class=\"rpt-info-value\">" + _esc(p.idProdotto) + "</span></div>" +
      "<div class=\"rpt-info-item\"><span class=\"rpt-info-label\">Cod. Internorm</span><span class=\"rpt-info-value\">" + _esc(p.codiceInternorm) + "</span></div>" +
      "<div class=\"rpt-info-item\"><span class=\"rpt-info-label\">Tipologia</span><span class=\"rpt-info-value\">" + _esc(p.categoria) + "</span></div>" +
      "<div class=\"rpt-info-item\"><span class=\"rpt-info-label\">Materiale</span><span class=\"rpt-info-value\">" + _esc(p.formaMateriale) + "</span></div>" +
      "<div class=\"rpt-info-item\"><span class=\"rpt-info-label\">Misura</span><span class=\"rpt-info-value\">" + _esc(p.dimensioni) + "</span></div>" +
      "<div class=\"rpt-info-item\"><span class=\"rpt-info-label\">Famiglia Colore</span><span class=\"rpt-info-value\">" + _esc(p.famigliaColore) + "</span></div>" +
      "<div class=\"rpt-info-item\"><span class=\"rpt-info-label\">Colore</span><span class=\"rpt-info-value\">" + _esc(p.codiceColore) + "</span></div>" +
      "<div class=\"rpt-info-item\"><span class=\"rpt-info-label\">U.M.</span><span class=\"rpt-info-value\">" + _esc(p.um) + "</span></div>" +
      "<div class=\"rpt-info-item\"><span class=\"rpt-info-label\">Stato</span><span class=\"rpt-info-value\">" + _esc(p.stato) + "</span></div>" +
    "</div>";

    if (vediPrezzi && data.listino) {
      var l = data.listino;
      html += "<div class=\"rpt-section-title\">Listino Prezzi (Sconto " + ((l.sconto || 0) * 100).toFixed(0) + "%)</div>";
      html += "<div class=\"rpt-info-grid\">" +
        "<div class=\"rpt-info-item\"><span class=\"rpt-info-label\">Prezzo ml Listino</span><span class=\"rpt-info-value\">" + _fmtEuro(l.prezzoMlListino) + "</span></div>" +
        "<div class=\"rpt-info-item\"><span class=\"rpt-info-label\">Prezzo ml Netto F4</span><span class=\"rpt-info-value\">" + _fmtEuro(l.prezzoMlNetto) + "</span></div>" +
        "<div class=\"rpt-info-item\"><span class=\"rpt-info-label\">Imposto Fisso ml</span><span class=\"rpt-info-value\">" + _fmtEuro(l.impostoFissoMl) + "</span></div>" +
        "<div class=\"rpt-info-item\"><span class=\"rpt-info-label\">Prezzo Barra Listino</span><span class=\"rpt-info-value\">" + _fmtEuro(l.prezzoBarraList) + "</span></div>" +
        "<div class=\"rpt-info-item\"><span class=\"rpt-info-label\">Prezzo Barra Netto F4</span><span class=\"rpt-info-value\">" + _fmtEuro(l.prezzoBarraNetto) + "</span></div>" +
        "<div class=\"rpt-info-item\"><span class=\"rpt-info-label\">Tipo Barra</span><span class=\"rpt-info-value\">" + _esc(l.tipoBarra) + " &mdash; " + _fmtNum(l.lunghezzaBarraM, 1) + " ml</span></div>" +
      "</div>";
    }

    html += "<div class=\"rpt-section-title\">Giacenze Attuali</div>";
    if (!data.giacenze || data.giacenze.length === 0) {
      html += "<p style=\"color:#888;font-style:italic\">Nessuna giacenza registrata</p>";
    } else {
      html += "<table class=\"rpt-table\"><thead><tr>" +
        "<th>Lotto</th><th>Magazzino</th><th>Tipo</th><th>Lungh.(ml)</th><th>Pezzi</th>" +
        (vediPrezzi ? "<th>Val.Unit.</th><th>Val.Totale</th>" : "") +
        "<th>Data Carico</th></tr></thead><tbody>";
      data.giacenze.forEach(function(g) {
        html += "<tr>" +
          "<td>" + _esc(g.idLotto) + "</td>" +
          "<td>" + _esc(g.nomeMag) + "</td>" +
          "<td>" + _esc(g.tipoPezzo) + "</td>" +
          "<td>" + _fmtNum(g.lunghezza, 2) + "</td>" +
          "<td><strong>" + _fmtNum(g.quantita, 0) + "</strong></td>" +
          (vediPrezzi ? "<td>" + _fmtEuro(g.valoreUnitario) + "</td><td>" + _fmtEuro(g.valoreTotale) + "</td>" : "") +
          "<td>" + _esc(g.dataCarico) + "</td>" +
          "</tr>";
      });
      html += "</tbody></table>";
      html += _buildTotali(data.totali, vediPrezzi);
    }

    html += "<div class=\"rpt-section-title\">Ultimi Movimenti</div>";
    if (!data.movimenti || data.movimenti.length === 0) {
      html += "<p style=\"color:#888;font-style:italic\">Nessun movimento registrato</p>";
    } else {
      html += "<table class=\"rpt-table\"><thead><tr>" +
        "<th>Data/Ora</th><th>Operatore</th><th>Tipo</th><th>Mag.Orig.</th><th>Mag.Dest.</th><th>Qty</th>" +
        "</tr></thead><tbody>";
      data.movimenti.forEach(function(m) {
        html += "<tr>" +
          "<td>" + _esc(m.dataOra) + "</td>" +
          "<td>" + _esc(m.operatore) + "</td>" +
          "<td>" + _esc(m.tipo) + "</td>" +
          "<td>" + _esc(m.magOrig) + "</td>" +
          "<td>" + _esc(m.magDest) + "</td>" +
          "<td>" + _fmtNum(m.quantita, 0) + "</td>" +
          "</tr>";
      });
      html += "</tbody></table>";
    }

    html += "<div class=\"rpt-firme\">" +
      "<div class=\"rpt-firma-box\"><div class=\"rpt-firma-label\">Redatto da</div>&nbsp;</div>" +
      "<div class=\"rpt-firma-box\"><div class=\"rpt-firma-label\">Verificato da</div>&nbsp;</div>" +
      "<div class=\"rpt-firma-box\"><div class=\"rpt-firma-label\">Approvato da</div>&nbsp;</div>" +
    "</div>";

    html += _buildFooter(data, 1, 1);
    return html;
  }

  // ——— RENDERER: RIEPILOGO MAGAZZINI ———
  function _renderRiepilogoMagazzini(data) {
    var vediPrezzi = F4.auth.canDo("vediPrezzi");
    var html = _buildHeader(data, ++_numDoc);
    html += "<div class=\"rpt-section-title\">Riepilogo per Magazzino</div>";
    html += "<table class=\"rpt-table\"><thead><tr>" +
      "<th>Magazzino</th><th>Lotti</th><th>Pezzi Totali</th>" +
      (vediPrezzi ? "<th>Valore Totale</th>" : "") +
      "</tr></thead><tbody>";
    (data.righe || []).forEach(function(r) {
      html += "<tr>" +
        "<td><strong>" + _esc(r.nomeMagazzino) + "</strong></td>" +
        "<td>" + _fmtNum(r.lotti, 0) + "</td>" +
        "<td><strong>" + _fmtNum(r.pezzi, 0) + "</strong></td>" +
        (vediPrezzi ? "<td>" + _fmtEuro(r.valore) + "</td>" : "") +
        "</tr>";
    });
    html += "</tbody></table>";
    html += _buildTotali(data.totali, vediPrezzi);
    html += _buildFooter(data, 1, 1);
    return html;
  }

  // ——— FUNZIONE PRINCIPALE ———
  function genera(data) {
    var bodyHtml = "";
    switch (data.tipo) {
      case "GIACENZE":            bodyHtml = _renderGiacenze(data);           break;
      case "MOVIMENTI":           bodyHtml = _renderMovimenti(data);          break;
      case "SCHEDA_PRODOTTO":     bodyHtml = _renderSchedaProdotto(data);     break;
      case "RIEPILOGO_MAGAZZINI": bodyHtml = _renderRiepilogoMagazzini(data); break;
      default: bodyHtml = "<p>Tipo report non riconosciuto: " + _esc(data.tipo) + "</p>";
    }
    return "<div class=\"rpt-page\">" + bodyHtml + "</div>";
  }

  // ——— APRI ANTEPRIMA ———
  function apriAnteprima(data) {
    var htmlBody = genera(data);
    var win = window.open("", "_blank", "width=900,height=800,scrollbars=yes");
    if (!win) {
      F4.ui.warn("Popup bloccato. Abilita i popup per questo sito.");
      return;
    }
    win.document.write(
      "<!DOCTYPE html><html lang=\"it\"><head>" +
      "<meta charset=\"UTF-8\">" +
      "<title>F4 Report &mdash; " + _nomeDocumento(data.tipo) + "</title>" +
      "<link rel=\"stylesheet\" href=\"https://marcotabaro-ship-it.github.io/f4-magazzino/css/print.css\">" +
      "<style>body{background:#e0e0e0;padding:20px;margin:0;} " +
      ".toolbar{background:#1a1a2e;color:#fff;padding:12px 20px;display:flex;gap:12px;align-items:center;margin-bottom:20px;border-radius:8px;}" +
      ".toolbar button{background:#c9a84c;color:#000;border:none;padding:8px 20px;font-weight:700;border-radius:6px;cursor:pointer;font-size:14px;}" +
      ".toolbar button:hover{background:#e0bd6a;}" +
      ".toolbar .title{font-size:15px;font-weight:600;flex:1;}" +
      "</style></head><body>" +
      "<div class=\"toolbar\">" +
        "<span class=\"title\">Anteprima: " + _nomeDocumento(data.tipo) + "</span>" +
        "<button onclick=\"window.print()\">&#128438; Stampa / Esporta PDF</button>" +
        "<button onclick=\"window.close()\">&#10005; Chiudi</button>" +
      "</div>" +
      "<div id=\"f4-print-area\">" + htmlBody + "</div>" +
      "</body></html>"
    );
    win.document.close();
  }

  return {
    genera: genera,
    apriAnteprima: apriAnteprima
  };

})();

window.F4 = F4;
