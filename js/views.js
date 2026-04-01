// ============================================================
// F4 Magazzino — views.js v2.3
// Regole: no backtick, no apostrofo italiano in stringhe JS single-quoted
// ============================================================

var F4 = F4 || {};
F4.views = F4.views || {};

// ============================================================
// UTILITY CONDIVISE
// ============================================================

var IDS_GF = ["gf-tipologia","gf-materiale","gf-codinternorm","gf-misura","gf-famiglia","gf-colore"];

function _fmtEur(v) {
  if (v === null || v === undefined || v === "" || isNaN(parseFloat(v))) return "-";
  return parseFloat(v).toLocaleString("it-IT", {minimumFractionDigits:2, maximumFractionDigits:2}) + " \u20ac";
}

function _fmtNum(v, dec) {
  if (v === null || v === undefined || v === "" || isNaN(parseFloat(v))) return "-";
  return parseFloat(v).toLocaleString("it-IT", {minimumFractionDigits:dec||0, maximumFractionDigits:dec||0});
}

function _fmtData(d) {
  if (!d) return "-";
  var dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("it-IT");
}

function _optsFrom(arr) {
  return arr.sort().map(function(k) {
    return "<option value=\\\"" + k + "\\\">" + k + "</option>";
  }).join("");
}

function _uniqueVals(dati, campo) {
  var s = {};
  (dati || []).forEach(function(r) { if (r[campo]) s[r[campo]] = 1; });
  return Object.keys(s).sort();
}

function _htmlFiltriCascata(dati, p) {
  p = p || "gf";
  function sel(id, label, campo) {
    var opts = _uniqueVals(dati, campo).map(function(v) {
      return "<option value=\\\"" + v.replace(/\"/g,"&quot;") + "\\\">" + v + "</option>";
    }).join("");
    return "<select id=\\\"" + p + "-" + id + "\\\" class=\\\"f4-select\\\"><option value=\\\"\\\">" + label + "</option>" + opts + "</select>";
  }
  return "<div class=\\\"filter-bar\\\">" +
    sel("tipologia","Tipologia","TIPOLOGIA") +
    sel("materiale","Materiale","MATERIALE") +
    sel("codinternorm","Cod.Internorm","COD_INTERNORM") +
    sel("misura","Misura","MISURA") +
    sel("famiglia","Famiglia","FAMIGLIA_COLORE") +
    sel("colore","Colore","COLORE") +
    "<button id=\\\"" + p + "-reset\\\" class=\\\"btn btn-outline btn-sm\\\">&#10005; Reset</button>" +
    "</div>";
}

function _applicaFiltriGF(righe, p, campExtra) {
  p = p || "gf";
  var ids =   [p+"-tipologia",p+"-materiale",p+"-codinternorm",p+"-misura",p+"-famiglia",p+"-colore"];
  var campi = ["TIPOLOGIA","MATERIALE","COD_INTERNORM","MISURA","FAMIGLIA_COLORE","COLORE"];
  if (campExtra) {
    for (var k in campExtra) {
      ids.push(k);
      campi.push(campExtra[k]);
    }
  }
  return (righe || []).filter(function(r) {
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el && el.value && (r[campi[i]] || "").toString() !== el.value) return false;
    }
    return true;
  });
}

function _attaccaEventiFiltri(p, righe, renderFn) {
  p = p || "gf";
  var allIds = IDS_GF.map(function(id) { return p + id.substring(2); });
  allIds.concat([p+"-mag",p+"-tipo",p+"-orig"]).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("change", function() { renderFn(); });
  });
  var reset = document.getElementById(p + "-reset");
  if (reset) reset.addEventListener("click", function() {
    allIds.concat([p+"-mag",p+"-tipo",p+"-orig"]).forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.value = "";
    });
    renderFn();
  });
}

// ============================================================
// VIEW: DASHBOARD
// ============================================================
F4.views.dashboard = function(container) {
  container.innerHTML =
    "<div class=\"view-header\"><h2 class=\"view-title\">&#127968; Plancia Operativa</h2></div>" +
    "<div id=\"dashboard-content\"><div class=\"loading-state\">Caricamento...</div></div>";

  F4.api.getDashboard(function(err, res) {
    var el = document.getElementById("dashboard-content");
    if (!el) return;
    if (err || !res || !res.success) {
      el.innerHTML = "<div class=\"empty-state\">Errore nel caricamento dati</div>"; return;
    }
    var d = res.data || {};
    var html = "<div class=\"stat-grid\">";
    html += "<div class=\"stat-card glass\"><div class=\"stat-icon\">&#128230;</div><div class=\"stat-label\">Tot. Lotti</div><div class=\"stat-value\">" + (d.totLotti || 0) + "</div></div>";
    html += "<div class=\"stat-card glass\"><div class=\"stat-icon\">&#128200;</div><div class=\"stat-label\">Tot. Pezzi</div><div class=\"stat-value\">" + _fmtNum(d.totPezzi) + "</div></div>";
    html += "<div class=\"stat-card glass\"><div class=\"stat-icon\">&#127975;</div><div class=\"stat-label\">Tot. ml</div><div class=\"stat-value\">" + _fmtNum(d.totMl, 1) + "</div></div>";
    if (F4.auth.canDo("vediPrezzi")) {
      html += "<div class=\"stat-card glass\"><div class=\"stat-icon\">&#128181;</div><div class=\"stat-label\">Valore Totale</div><div class=\"stat-value\">" + _fmtEur(d.totValore) + "</div></div>";
    }
    html += "</div>";

    var mags = d.perMagazzino || {};
    var magKeys = Object.keys(mags);
    if (magKeys.length > 0) {
      html += "<div class=\"section-title\">Dettaglio per Magazzino</div>";
      html += "<div class=\"table-wrap\"><table class=\"f4-table\"><thead><tr><th>Magazzino</th><th>Lotti</th><th>Pezzi</th><th>ml</th>";
      if (F4.auth.canDo("vediPrezzi")) html += "<th>Valore</th>";
      html += "</tr></thead><tbody>";
      magKeys.forEach(function(k) {
        var m = mags[k];
        html += "<tr><td><strong>" + (m.nomeMagazzino || k) + "</strong></td><td>" + (m.lotti||0) + "</td><td>" + _fmtNum(m.pezzi) + "</td><td>" + _fmtNum(m.ml,1) + "</td>";
        if (F4.auth.canDo("vediPrezzi")) html += "<td>" + _fmtEur(m.valore) + "</td>";
        html += "</tr>";
      });
      html += "</tbody></table></div>";
    }
    el.innerHTML = html;
  });
};

// ============================================================
// VIEW: ANAGRAFICA PRODOTTI
// ============================================================
F4.views.anagrafica = function(container) {
  F4.ui.showSpinner("Caricamento anagrafica...");
  F4.api.getAnagrafica(function(err, res) {
    F4.ui.hideSpinner();
    if (err || !res || !res.success) {
      container.innerHTML = "<div class=\"empty-state\">Errore nel caricamento</div>"; return;
    }
    var dati = res.data || [];
    var showPrezzi = F4.auth.canDo("vediPrezzi");

    container.innerHTML =
      "<div class=\"view-header\"><h2 class=\"view-title\">&#128196; Anagrafica Prodotti</h2>" +
      "<span class=\"badge-count\">" + dati.length + " SKU</span></div>" +
      "<div id=\"ana-filtri\"></div>" +
      "<div class=\"table-wrap\"><table class=\"f4-table f4-table-sm\"><thead><tr>" +
      "<th>Codice</th><th>Tipologia</th><th>Materiale</th><th>Cod.Int.</th>" +
      "<th>Misura</th><th>Famiglia</th><th>Colore</th><th>Tipo Barra</th>" +
      (showPrezzi ? "<th>Prezzo ml</th><th>Prezzo Barra</th><th>Sconto</th><th>Netto ml</th>" : "") +
      "</tr></thead><tbody id=\"ana-tbody\"></tbody></table></div>";

    document.getElementById("ana-filtri").innerHTML = _htmlFiltriCascata(dati, "gf");

    function render() {
      var fil = _applicaFiltriGF(dati, "gf");
      var tbody = document.getElementById("ana-tbody");
      if (!tbody) return;
      if (fil.length === 0) {
        tbody.innerHTML = "<tr><td colspan=\"12\" class=\"empty-cell\">Nessun prodotto trovato</td></tr>"; return;
      }
      tbody.innerHTML = fil.map(function(r) {
        var tr = "<tr>" +
          "<td><code>" + (r.ID_PRODOTTO||"?") + "</code></td>" +
          "<td>" + (r.TIPOLOGIA||"-") + "</td>" +
          "<td>" + (r.MATERIALE||"-") + "</td>" +
          "<td>" + (r.COD_INTERNORM||"-") + "</td>" +
          "<td>" + (r.MISURA||"-") + "</td>" +
          "<td>" + (r.FAMIGLIA_COLORE||"-") + "</td>" +
          "<td>" + (r.COLORE||"-") + "</td>" +
          "<td>" + (r.TIPO_BARRA||"-") + "</td>";
        if (showPrezzi) {
          tr += "<td>" + _fmtEur(r.PREZZO_ML_LISTINO) + "</td>" +
               "<td>" + _fmtEur(r.PREZZO_BARRA_LISTINO) + "</td>" +
               "<td>" + (r.SCONTO_PERC !== undefined ? (parseFloat(r.SCONTO_PERC)*100).toFixed(0)+"%" : "-") + "</td>" +
               "<td>" + _fmtEur(r.PREZZO_ML_NETTO) + "</td>";
        }
        tr += "</tr>";
        return tr;
      }).join("");
    }

    _attaccaEventiFiltri("gf", dati, render);
    render();
  });
};

// ============================================================
// VIEW: GIACENZE E LOTTI
// ============================================================
F4.views.giacenze = function(container) {
  F4.ui.showSpinner("Caricamento giacenze...");
  F4.api.getGiacenze(function(err, res) {
    F4.ui.hideSpinner();
    if (err || !res || !res.success) {
      container.innerHTML = "<div class=\"empty-state\">Errore nel caricamento</div>"; return;
    }
    var dati = res.data || [];
    var showPrezzi = F4.auth.canDo("vediPrezzi");

    var magSet = {};
    dati.forEach(function(r) { if (r.NOME_MAGAZZINO) magSet[r.NOME_MAGAZZINO] = 1; });
    var magOpts = Object.keys(magSet).sort().map(function(m) {
      return "<option value=\"" + m + "\">" + m + "</option>";
    }).join("");

    container.innerHTML =
      "<div class=\"view-header\"><h2 class=\"view-title\">&#128200; Giacenze e Lotti</h2>" +
      "<span class=\"badge-count\" id=\"giac-count\">" + dati.length + " lotti</span></div>" +
      "<div class=\"filter-bar\">" +
      "<select id=\"gg-mag\" class=\"f4-select\"><option value=\"\">Magazzino</option>" + magOpts + "</select>" +
      "<select id=\"gg-tipo\" class=\"f4-select\"><option value=\"\">Tipo</option><option>Barra</option><option>Residuo</option><option>Sfuso</option></select>" +
      "</div>" +
      "<div id=\"giac-filtri\"></div>" +
      "<div class=\"table-wrap\"><table class=\"f4-table f4-table-sm\"><thead><tr>" +
      "<th>Lotto</th><th>Prodotto</th><th>Tipologia</th><th>Misura</th><th>Colore</th>" +
      "<th>Tipo</th><th>ml</th><th>Pezzi</th><th>Magazzino</th>" +
      (showPrezzi ? "<th>Val.Unit.</th><th>Val.Tot.</th>" : "") +
      "<th>Data</th></tr></thead><tbody id=\"giac-tbody\"></tbody></table></div>";

    document.getElementById("giac-filtri").innerHTML = _htmlFiltriCascata(dati, "gg");

    function render() {
      var mag = (document.getElementById("gg-mag")||{}).value || "";
      var tipo = (document.getElementById("gg-tipo")||{}).value || "";
      var fil = _applicaFiltriGF(dati, "gg");
      if (mag) fil = fil.filter(function(r) { return (r.NOME_MAGAZZINO||"") === mag; });
      if (tipo) fil = fil.filter(function(r) { return (r.TIPO_PEZZO||"") === tipo; });
      var cnt = document.getElementById("giac-count");
      if (cnt) cnt.textContent = fil.length + " lotti";
      var tbody = document.getElementById("giac-tbody");
      if (!tbody) return;
      if (fil.length === 0) {
        tbody.innerHTML = "<tr><td colspan=\"12\" class=\"empty-cell\">Nessun lotto trovato</td></tr>"; return;
      }
      tbody.innerHTML = fil.map(function(r) {
        var tr = "<tr>" +
          "<td><code style=\"font-size:0.75rem\">" + (r.ID_LOTTO||"-") + "</code></td>" +
          "<td><small>" + (r.ID_PRODOTTO||"-") + "</small></td>" +
          "<td>" + (r.TIPOLOGIA||"-") + "</td>" +
          "<td>" + (r.MISURA||"-") + "</td>" +
          "<td>" + (r.COLORE||"-") + "</td>" +
          "<td><span class=\"badge badge-" + (r.TIPO_PEZZO||"barra").toLowerCase() + "\">" + (r.TIPO_PEZZO||"Barra") + "</span></td>" +
          "<td>" + _fmtNum(r.LUNGHEZZA_ML, 2) + "</td>" +
          "<td>" + _fmtNum(r.QUANTITA_PZ) + "</td>" +
          "<td>" + (r.NOME_MAGAZZINO||"-") + "</td>";
        if (showPrezzi) {
          tr += "<td>" + _fmtEur(r.VAL_UNITARIO) + "</td>" +
               "<td><strong>" + _fmtEur(r.VAL_TOTALE) + "</strong></td>";
        }
        tr += "<td>" + _fmtData(r.DATA_CARICO) + "</td></tr>";
        return tr;
      }).join("");
    }

    _attaccaEventiFiltri("gg", dati, render);
    var mgEl = document.getElementById("gg-mag");
    var tpEl = document.getElementById("gg-tipo");
    if (mgEl) mgEl.addEventListener("change", render);
    if (tpEl) tpEl.addEventListener("change", render);
    render();
  });
};

// ============================================================
// VIEW: CARICO MERCI
// ============================================================
F4.views.carico = function(container) {
  F4.api.getAnagrafica(function(errA, resA) {
    F4.api.getMagazzini(function(errM, resM) {
      var prodotti = (resA && resA.success ? resA.data : []) || [];
      var magazzini = (resM && resM.success ? resM.data : []) || [];

      var magOpts = magazzini.filter(function(m) { return m.STATO !== "Obsoleto"; }).map(function(m) {
        return "<option value=\"" + m.ID_MAGAZZINO + "\">" + m.NOME_MAGAZZINO + "</option>";
      }).join("");

      container.innerHTML =
        "<div class=\"view-header\"><h2 class=\"view-title\">&#128229; Carico Merci</h2></div>" +
        "<div class=\"op-card glass\">" +
        "<div id=\"car-filtri\"></div>" +
        "<div class=\"form-grid\">" +
        "<div class=\"form-group\"><label class=\"f4-label\">Prodotto *</label>" +
        "<select id=\"car-prod\" class=\"f4-input\"><option value=\"\">Seleziona prodotto...</option></select></div>" +
        "<div class=\"form-group\"><label class=\"f4-label\">Magazzino *</label>" +
        "<select id=\"car-mag\" class=\"f4-input\"><option value=\"\">Seleziona magazzino...</option>" + magOpts + "</select></div>" +
        "<div class=\"form-group\"><label class=\"f4-label\">Tipo Pezzo</label>" +
        "<select id=\"car-tipo\" class=\"f4-input\"><option>Barra</option><option>Residuo</option><option>Sfuso</option></select></div>" +
        "<div class=\"form-group\"><label class=\"f4-label\">Quantita Pezzi</label><input id=\"car-pz\" type=\"number\" min=\"0\" step=\"1\" class=\"f4-input\" value=\"1\"></div>" +
        "<div class=\"form-group\"><label class=\"f4-label\">Lunghezza ml (per pezzo)</label><input id=\"car-ml\" type=\"number\" min=\"0\" step=\"0.01\" class=\"f4-input\" placeholder=\"es. 6\"></div>" +
        "<div class=\"form-group\"><label class=\"f4-label\">Note</label><input id=\"car-note\" type=\"text\" class=\"f4-input\" placeholder=\"Opzionale\"></div>" +
        "</div>" +
        "<div id=\"car-preview\" class=\"preview-box\"></div>" +
        "<button id=\"car-btn\" class=\"btn btn-primary\">&#128229; Esegui Carico</button>" +
        "</div>";

      document.getElementById("car-filtri").innerHTML = _htmlFiltriCascata(prodotti, "cf");

      function aggiornaSelectProdotto() {
        var fil = _applicaFiltriGF(prodotti, "cf");
        var sel = document.getElementById("car-prod");
        if (!sel) return;
        sel.innerHTML = "<option value=\"\">Seleziona prodotto... (" + fil.length + ")</option>" +
          fil.map(function(p) {
            return "<option value=\"" + p.ID_PRODOTTO + "\">" + p.ID_PRODOTTO + " - " + (p.TIPOLOGIA||"") + " " + (p.MISURA||"") + " " + (p.COLORE||"") + "</option>";
          }).join("");
      }

      _attaccaEventiFiltri("cf", prodotti, aggiornaSelectProdotto);
      aggiornaSelectProdotto();

      document.getElementById("car-btn").addEventListener("click", function() {
        var prod = document.getElementById("car-prod").value;
        var mag = document.getElementById("car-mag").value;
        var tipo = document.getElementById("car-tipo").value;
        var pz = parseFloat(document.getElementById("car-pz").value) || 0;
        var ml = parseFloat(document.getElementById("car-ml").value) || 0;
        var note = document.getElementById("car-note").value;
        if (!prod) { F4.ui.err("Seleziona un prodotto"); return; }
        if (!mag) { F4.ui.err("Seleziona un magazzino"); return; }
        if (pz <= 0 && ml <= 0) { F4.ui.err("Inserisci quantita o ml"); return; }
        F4.ui.conferma("Conferma Carico", "Caricare " + pz + " pz / " + ml + " ml di " + prod + "?", function() {
          F4.ui.showSpinner("Registrazione carico...");
          F4.api.caricaMerce({idProdotto:prod,idMagazzino:mag,tipoPezzo:tipo,quantitaPz:pz,lunghezzaMl:ml,note:note}, function(e,r) {
            F4.ui.hideSpinner();
            if (e || !r || !r.success) { F4.ui.err(r ? r.message : "Errore carico"); return; }
            F4.ui.toast("Carico registrato: " + (r.idLotto||""), "success");
            F4.router.go("giacenze");
          });
        });
      });
    });
  });
};

// ============================================================
// VIEW: SCARICO MERCI
// ============================================================
F4.views.scarico = function(container) {
  F4.api.getGiacenze(function(err, res) {
    var lotti = (res && res.success ? res.data : []) || [];

    var magSet = {};
    lotti.forEach(function(r) { if (r.NOME_MAGAZZINO) magSet[r.NOME_MAGAZZINO] = 1; });
    var magOpts = Object.keys(magSet).sort().map(function(m) {
      return "<option value=\"" + m + "\">" + m + "</option>";
    }).join("");

    container.innerHTML =
      "<div class=\"view-header\"><h2 class=\"view-title\">&#128230; Scarico Merci</h2></div>" +
      "<div class=\"op-card glass\">" +
      "<div class=\"form-grid\">" +
      "<div class=\"form-group\"><label class=\"f4-label\">Filtra per Magazzino</label>" +
      "<select id=\"sc-mag\" class=\"f4-input\"><option value=\"\">Tutti</option>" + magOpts + "</select></div>" +
      "</div>" +
      "<div class=\"form-group\"><label class=\"f4-label\">Seleziona Lotto *</label>" +
      "<select id=\"sc-lotto\" class=\"f4-input\" size=\"6\"><option value=\"\">--</option></select></div>" +
      "<div class=\"form-grid\" style=\"margin-top:1rem\">" +
      "<div class=\"form-group\"><label class=\"f4-label\">Quantita Pezzi</label><input id=\"sc-pz\" type=\"number\" min=\"0\" step=\"1\" class=\"f4-input\" value=\"0\"></div>" +
      "<div class=\"form-group\"><label class=\"f4-label\">ml (solo sfuso/residuo)</label><input id=\"sc-ml\" type=\"number\" min=\"0\" step=\"0.01\" class=\"f4-input\" value=\"0\"></div>" +
      "<div class=\"form-group\"><label class=\"f4-label\">Causale</label><input id=\"sc-causale\" type=\"text\" class=\"f4-input\" placeholder=\"es. Vendita cliente\"></div>" +
      "</div>" +
      "<button id=\"sc-btn\" class=\"btn btn-danger\">&#128230; Esegui Scarico</button>" +
      "</div>";

    function aggiornaLotti() {
      var mag = (document.getElementById("sc-mag")||{}).value || "";
      var fil = mag ? lotti.filter(function(r) { return r.NOME_MAGAZZINO === mag; }) : lotti;
      var sel = document.getElementById("sc-lotto");
      if (!sel) return;
      sel.innerHTML = fil.map(function(r) {
        return "<option value=\"" + r.ID_LOTTO + "\">" + r.ID_LOTTO + " | " + (r.TIPOLOGIA||"") + " " + (r.COLORE||"") + " | " + (r.TIPO_PEZZO||"") + " " + _fmtNum(r.LUNGHEZZA_ML,2) + "ml x" + r.QUANTITA_PZ + " | " + (r.NOME_MAGAZZINO||"") + "</option>";
      }).join("");
    }
    var mgEl = document.getElementById("sc-mag");
    if (mgEl) mgEl.addEventListener("change", aggiornaLotti);
    aggiornaLotti();

    document.getElementById("sc-btn").addEventListener("click", function() {
      var lotto = document.getElementById("sc-lotto").value;
      var pz = parseFloat(document.getElementById("sc-pz").value) || 0;
      var ml = parseFloat(document.getElementById("sc-ml").value) || 0;
      var causale = document.getElementById("sc-causale").value;
      if (!lotto) { F4.ui.err("Seleziona un lotto"); return; }
      if (pz <= 0 && ml <= 0) { F4.ui.err("Inserisci quantita o ml da scaricare"); return; }
      F4.ui.conferma("Conferma Scarico", "Scaricare " + pz + " pz / " + ml + " ml dal lotto " + lotto + "?", function() {
        F4.ui.showSpinner("Registrazione scarico...");
        F4.api.scaricoMerce({idLotto:lotto,quantitaPz:pz,lunghezzaMl:ml,causale:causale}, function(e,r) {
          F4.ui.hideSpinner();
          if (e || !r || !r.success) { F4.ui.err(r ? r.message : "Errore scarico"); return; }
          F4.ui.toast("Scarico registrato", "success");
          F4.router.go("giacenze");
        });
      });
    });
  });
};

// ============================================================
// VIEW: TRASFERIMENTO — multi-selezione + nome magazzino
// ============================================================
F4.views.trasferimento = function(container) {
  F4.api.getGiacenze(function(errG, resG) {
    F4.api.getMagazzini(function(errM, resM) {
      var lotti = (resG && resG.success ? resG.data : []) || [];
      var magazzini = (resM && resM.success ? resM.data : []) || [];
      var magAttivi = magazzini.filter(function(m) { return m.STATO !== "Obsoleto"; });

      var magSet = {};
      lotti.forEach(function(r) { if (r.NOME_MAGAZZINO) magSet[r.NOME_MAGAZZINO] = 1; });
      var origOpts = Object.keys(magSet).sort().map(function(m) {
        return "<option value=\"" + m + "\">" + m + "</option>";
      }).join("");
      var destOpts = magAttivi.map(function(m) {
        return "<option value=\"" + m.ID_MAGAZZINO + "\">" + m.NOME_MAGAZZINO + "</option>";
      }).join("");

      container.innerHTML =
        "<div class=\"view-header\"><h2 class=\"view-title\">&#8644; Trasferimento tra Magazzini</h2></div>" +
        "<div class=\"op-card glass\">" +
        "<div class=\"form-grid\">" +
        "<div class=\"form-group\"><label class=\"f4-label\">Filtra Magazzino Origine</label>" +
        "<select id=\"tr-orig\" class=\"f4-input\"><option value=\"\">Tutti</option>" + origOpts + "</select></div>" +
        "<div class=\"form-group\"><label class=\"f4-label\">Magazzino Destinazione *</label>" +
        "<select id=\"tr-dest\" class=\"f4-input\"><option value=\"\">Seleziona...</option>" + destOpts + "</select></div>" +
        "</div>" +
        "<div id=\"tr-filtri\"></div>" +
        "<p class=\"hint-text\">Seleziona uno o piu lotti dalla tabella, poi premi il pulsante di trasferimento.</p>" +
        "<div class=\"table-wrap\"><table class=\"f4-table f4-table-sm\"><thead><tr>" +
        "<th><input type=\"checkbox\" id=\"tr-all\"></th>" +
        "<th>Lotto</th><th>Prodotto</th><th>Tipo</th><th>ml</th><th>Pezzi</th><th>Magazzino Attuale</th>" +
        "</tr></thead><tbody id=\"tr-tbody\"></tbody></table></div>" +
        "<button id=\"tr-btn\" class=\"btn btn-primary\" disabled>&#8644; Trasferisci Selezionati (0)</button>" +
        "</div>";

      document.getElementById("tr-filtri").innerHTML = _htmlFiltriCascata(lotti, "trf");

      var selezionati = {};

      function aggiornaBottone() {
        var cnt = Object.keys(selezionati).filter(function(k) { return selezionati[k]; }).length;
        var btn = document.getElementById("tr-btn");
        if (btn) { btn.disabled = cnt === 0; btn.textContent = "\u21C4 Trasferisci Selezionati (" + cnt + ")"; }
      }

      function render() {
        var orig = (document.getElementById("tr-orig")||{}).value || "";
        var fil = _applicaFiltriGF(lotti, "trf");
        if (orig) fil = fil.filter(function(r) { return (r.NOME_MAGAZZINO||"") === orig; });
        var tbody = document.getElementById("tr-tbody");
        if (!tbody) return;
        if (fil.length === 0) {
          tbody.innerHTML = "<tr><td colspan=\"7\" class=\"empty-cell\">Nessun lotto</td></tr>"; return;
        }
        tbody.innerHTML = fil.map(function(r) {
          var chk = selezionati[r.ID_LOTTO] ? "checked" : "";
          return "<tr class=\"" + (selezionati[r.ID_LOTTO] ? "row-selected\"" : "\"") + ">" +
            "<td><input type=\"checkbox\" class=\"tr-chk\" data-id=\"" + r.ID_LOTTO + "\" " + chk + "></td>" +
            "<td><code style=\"font-size:0.7rem\">" + (r.ID_LOTTO||"-") + "</code></td>" +
            "<td><small>" + (r.ID_PRODOTTO||"-") + "</small></td>" +
            "<td>" + (r.TIPO_PEZZO||"Barra") + "</td>" +
            "<td>" + _fmtNum(r.LUNGHEZZA_ML,2) + "</td>" +
            "<td>" + (r.QUANTITA_PZ||0) + "</td>" +
            "<td><strong>" + (r.NOME_MAGAZZINO||"-") + "</strong></td></tr>";
        }).join("");
        tbody.querySelectorAll(".tr-chk").forEach(function(chk) {
          chk.addEventListener("change", function() {
            selezionati[this.getAttribute("data-id")] = this.checked;
            var row = this.closest("tr");
            if (row) row.className = this.checked ? "row-selected" : "";
            aggiornaBottone();
          });
        });
      }

      var allChk = document.getElementById("tr-all");
      if (allChk) allChk.addEventListener("change", function() {
        document.querySelectorAll(".tr-chk").forEach(function(c) {
          c.checked = allChk.checked;
          selezionati[c.getAttribute("data-id")] = allChk.checked;
          var row = c.closest("tr");
          if (row) row.className = allChk.checked ? "row-selected" : "";
        });
        aggiornaBottone();
      });

      _attaccaEventiFiltri("trf", lotti, render);
      var origEl = document.getElementById("tr-orig");
      if (origEl) origEl.addEventListener("change", render);
      render();

      document.getElementById("tr-btn").addEventListener("click", function() {
        var dest = document.getElementById("tr-dest").value;
        if (!dest) { F4.ui.err("Seleziona il magazzino di destinazione"); return; }
        var ids = Object.keys(selezionati).filter(function(k) { return selezionati[k]; });
        if (ids.length === 0) { F4.ui.err("Seleziona almeno un lotto"); return; }
        var destNome = (document.getElementById("tr-dest").options[document.getElementById("tr-dest").selectedIndex]||{}).text || dest;
        F4.ui.conferma("Conferma Trasferimento", "Trasferire " + ids.length + " lotto/i in " + destNome + "?", function() {
          F4.ui.showSpinner("Trasferimento in corso...");
          F4.api.trasferisciLotti({idLotti:ids,idMagazzinoDestinazione:dest}, function(e,r) {
            F4.ui.hideSpinner();
            if (e || !r || !r.success) {
              F4.ui.err(r ? r.message : "Errore trasferimento"); return;
            }
            F4.ui.toast("Trasferiti " + ids.length + " lotto/i", "success");
            F4.router.go("giacenze");
          });
        });
      });
    });
  });
};

// ============================================================
// VIEW: SFRIDO INTELLIGENTE
// ============================================================
F4.views.sfrido = function(container) {
  F4.api.getGiacenze(function(err, res) {
    var lotti = (res && res.success ? res.data : []) || [];
    var residui = lotti.filter(function(r) {
      return r.TIPO_PEZZO === "Residuo" || r.TIPO_PEZZO === "Sfuso";
    });

    container.innerHTML =
      "<div class=\"view-header\"><h2 class=\"view-title\">&#9986;&#65039; Sfrido Intelligente</h2></div>" +
      "<div class=\"op-card glass\">" +
      "<p class=\"hint-text\">Filtra residui e sfusi disponibili per trovare il materiale piu adatto.</p>" +
      "<div id=\"sfrido-filtri\"></div>" +
      "<div class=\"form-group\"><label class=\"f4-label\">ml minimi richiesti</label>" +
      "<input id=\"sf-minml\" type=\"number\" min=\"0\" step=\"0.1\" class=\"f4-input\" placeholder=\"es. 1.5\"></div>" +
      "</div>" +
      "<div class=\"table-wrap\"><table class=\"f4-table\"><thead><tr>" +
      "<th>Lotto</th><th>Tipologia</th><th>Misura</th><th>Colore</th><th>Tipo</th><th>ml</th><th>Pezzi</th><th>Magazzino</th>" +
      "</tr></thead><tbody id=\"sf-tbody\"></tbody></table></div>";

    document.getElementById("sfrido-filtri").innerHTML = _htmlFiltriCascata(residui, "sf");

    function render() {
      var fil = _applicaFiltriGF(residui, "sf");
      var minml = parseFloat((document.getElementById("sf-minml")||{}).value) || 0;
      if (minml > 0) fil = fil.filter(function(r) { return parseFloat(r.LUNGHEZZA_ML||0) >= minml; });
      var tbody = document.getElementById("sf-tbody");
      if (!tbody) return;
      if (fil.length === 0) {
        tbody.innerHTML = "<tr><td colspan=\"8\" class=\"empty-cell\">Nessun residuo trovato</td></tr>"; return;
      }
      tbody.innerHTML = fil.map(function(r) {
        return "<tr>" +
          "<td><code style=\"font-size:0.72rem\">" + (r.ID_LOTTO||"-") + "</code></td>" +
          "<td>" + (r.TIPOLOGIA||"-") + "</td>" +
          "<td>" + (r.MISURA||"-") + "</td>" +
          "<td>" + (r.COLORE||"-") + "</td>" +
          "<td>" + (r.TIPO_PEZZO||"Residuo") + "</td>" +
          "<td><strong>" + _fmtNum(r.LUNGHEZZA_ML,2) + " ml</strong></td>" +
          "<td>" + (r.QUANTITA_PZ||1) + "</td>" +
          "<td>" + (r.NOME_MAGAZZINO||"-") + "</td></tr>";
      }).join("");
    }

    _attaccaEventiFiltri("sf", residui, render);
    var mlEl = document.getElementById("sf-minml");
    if (mlEl) mlEl.addEventListener("input", render);
    render();
  });
};

// ============================================================
// VIEW: MACCHINA DEL TEMPO
// ============================================================
F4.views.macchinaTempo = function(container) {
  container.innerHTML =
    "<div class=\"view-header\"><h2 class=\"view-title\">&#128336; Macchina del Tempo</h2></div>" +
    "<div class=\"op-card glass\">" +
    "<p class=\"hint-text\">Visualizza la giacenza storica a una data specifica.</p>" +
    "<div class=\"form-grid\">" +
    "<div class=\"form-group\"><label class=\"f4-label\">Data di riferimento *</label>" +
    "<input id=\"mt-data\" type=\"date\" class=\"f4-input\"></div>" +
    "</div>" +
    "<button id=\"mt-btn\" class=\"btn btn-primary\">&#128336; Visualizza</button>" +
    "</div>" +
    "<div id=\"mt-result\"></div>";

  document.getElementById("mt-btn").addEventListener("click", function() {
    var data = document.getElementById("mt-data").value;
    if (!data) { F4.ui.err("Seleziona una data"); return; }
    F4.ui.showSpinner("Caricamento storico...");
    F4.api.getStorico({dataRif: data}, function(err, res) {
      F4.ui.hideSpinner();
      var el = document.getElementById("mt-result");
      if (!el) return;
      if (err || !res || !res.success) { el.innerHTML = "<div class=\"empty-state\">Errore nel caricamento</div>"; return; }
      var dati = res.data || [];
      if (dati.length === 0) { el.innerHTML = "<div class=\"empty-state\">Nessun dato al " + data + "</div>"; return; }
      var showPrezzi = F4.auth.canDo("vediPrezzi");
      el.innerHTML = "<div class=\"section-title\">Giacenza al " + _fmtData(data) + " — " + dati.length + " lotti</div>" +
        "<div class=\"table-wrap\"><table class=\"f4-table f4-table-sm\"><thead><tr>" +
        "<th>Lotto</th><th>Prodotto</th><th>Tipo</th><th>ml</th><th>Pezzi</th><th>Magazzino</th>" +
        (showPrezzi ? "<th>Valore</th>" : "") + "</tr></thead><tbody>" +
        dati.map(function(r) {
          return "<tr>" +
            "<td><code style=\"font-size:0.7rem\">" + (r.ID_LOTTO||"-") + "</code></td>" +
            "<td><small>" + (r.ID_PRODOTTO||"-") + "</small></td>" +
            "<td>" + (r.TIPO_PEZZO||"Barra") + "</td>" +
            "<td>" + _fmtNum(r.LUNGHEZZA_ML,2) + "</td>" +
            "<td>" + (r.QUANTITA_PZ||0) + "</td>" +
            "<td>" + (r.NOME_MAGAZZINO||"-") + "</td>" +
            (showPrezzi ? "<td>" + _fmtEur(r.VAL_TOTALE) + "</td>" : "") +
            "</tr>";
        }).join("") +
        "</tbody></table></div>";
    });
  });
};

// ============================================================
// VIEW: LISTINI E SCONTI
// ============================================================
F4.views.listini = function(container) {
  if (!F4.auth.canDo("gestioneListini")) {
    container.innerHTML = "<div class=\"empty-state\">Accesso non autorizzato</div>"; return;
  }
  F4.ui.showSpinner("Caricamento listini...");
  F4.api.getListiniCompleto(function(err, res) {
    F4.ui.hideSpinner();
    if (err || !res || !res.success) {
      container.innerHTML = "<div class=\"empty-state\">Errore nel caricamento</div>"; return;
    }
    var d = res.data || {};
    var fornitori = d.fornitori || [];
    var listiniTestata = d.listiniTestata || [];
    var scontiListino = d.scontiListino || [];

    function badgeStato(stato) {
      var cls = stato === "Attivo" ? "badge-attivo" : (stato === "Bozza" ? "badge-bozza" : "badge-storico");
      return "<span class=\"badge " + cls + "\">" + stato + "</span>";
    }

    var htmlFor = fornitori.map(function(f) {
      var lstFor = listiniTestata.filter(function(l) { return l.ID_FORNITORE === f.ID_FORNITORE; });
      var lstHtml = lstFor.length === 0 ? "<p class=\"hint-text\">Nessun listino</p>" :
        lstFor.map(function(l) {
          var sconti = scontiListino.filter(function(s) { return s.ID_LISTINO === l.ID_LISTINO; });
          var scontiHtml = sconti.map(function(s) {
            return "<tr><td>" + (s.TIPOLOGIA||"-") + "</td>" +
              "<td><strong>" + (parseFloat(s.SCONTO_PERC||0)*100).toFixed(0) + "%</strong></td>" +
              (l.STATO === "Bozza" ?
                "<td><input type=\"number\" class=\"f4-input-sm sc-edit\" data-id=\"" + s.ID_SCONTO + "\" data-listino=\"" + l.ID_LISTINO + "\" data-tipologia=\"" + (s.TIPOLOGIA||"") + "\" value=\"" + (parseFloat(s.SCONTO_PERC||0)*100).toFixed(0) + "\"></td>" : "<td></td>") +
              "</tr>";
          }).join("");
          return "<div class=\"listino-card glass\">" +
            "<div class=\"listino-header\">" +
            "<span class=\"listino-nome\">" + l.NOME_LISTINO + "</span>" +
            badgeStato(l.STATO||"Bozza") +
            "<span class=\"listino-data\">dal " + _fmtData(l.DATA_INIZIO) + "</span>" +
            (l.STATO === "Bozza" ? "<button class=\"btn btn-sm btn-success lst-attiva\" data-id=\"" + l.ID_LISTINO + "\">Attiva</button>" : "") +
            "</div>" +
            "<table class=\"f4-table f4-table-sm\"><thead><tr><th>Tipologia</th><th>Sconto</th><th>Modifica</th></tr></thead><tbody>" +
            scontiHtml + "</tbody></table>" +
            (l.STATO === "Bozza" ? "<button class=\"btn btn-sm btn-primary lst-salva-sconti\" data-id=\"" + l.ID_LISTINO + "\">Salva Sconti</button>" : "") +
            "</div>";
        }).join("");

      return "<div class=\"fornitore-card glass\">" +
        "<div class=\"section-title\">" + f.NOME_FORNITORE + " <span class=\"badge badge-attivo\">" + f.STATO + "</span></div>" +
        lstHtml +
        "<button class=\"btn btn-outline btn-sm lst-nuovo\" data-fornitore=\"" + f.ID_FORNITORE + "\" data-nome=\"" + f.NOME_FORNITORE + "\">+ Nuovo Listino</button>" +
        "</div>";
    }).join("");

    container.innerHTML =
      "<div class=\"view-header\"><h2 class=\"view-title\">&#128181; Listini e Sconti</h2></div>" +
      htmlFor;

    // Attiva listino
    container.querySelectorAll(".lst-attiva").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var id = this.getAttribute("data-id");
        F4.ui.conferma("Attiva Listino", "Attivare il listino? Da questo momento tutti i nuovi carichi useranno questi prezzi.", function() {
          F4.ui.showSpinner("Attivazione...");
          F4.api.attivaListino({idListino:id}, function(e,r) {
            F4.ui.hideSpinner();
            if (e || !r || !r.success) { F4.ui.err(r ? r.message : "Errore"); return; }
            F4.ui.toast("Listino attivato", "success");
            F4.router.go("listini");
          });
        });
      });
    });

    // Salva sconti
    container.querySelectorAll(".lst-salva-sconti").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var idListino = this.getAttribute("data-id");
        var scontiNuovi = [];
        container.querySelectorAll(".sc-edit[data-listino=\"" + idListino + "\"]").forEach(function(inp) {
          scontiNuovi.push({
            idSconto: inp.getAttribute("data-id"),
            idListino: idListino,
            tipologia: inp.getAttribute("data-tipologia"),
            scontoPerc: parseFloat(inp.value||0) / 100
          });
        });
        F4.ui.showSpinner("Salvataggio sconti...");
        F4.api.aggiornaScontiListino({idListino:idListino, sconti:scontiNuovi}, function(e,r) {
          F4.ui.hideSpinner();
          if (e || !r || !r.success) { F4.ui.err(r ? r.message : "Errore"); return; }
          F4.ui.toast("Sconti aggiornati", "success");
          F4.router.go("listini");
        });
      });
    });

    // Nuovo listino
    container.querySelectorAll(".lst-nuovo").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var idFor = this.getAttribute("data-fornitore");
        var nomeFor = this.getAttribute("data-nome");
        var nomeListino = prompt("Nome del nuovo listino (es. " + nomeFor + " 2027):");
        if (!nomeListino) return;
        var dataInizio = prompt("Data di inizio validita (YYYY-MM-DD):");
        if (!dataInizio) return;
        F4.ui.showSpinner("Creazione listino...");
        F4.api.creaListino({idFornitore:idFor,nomeListino:nomeListino,dataInizio:dataInizio}, function(e,r) {
          F4.ui.hideSpinner();
          if (e || !r || !r.success) { F4.ui.err(r ? r.message : "Errore"); return; }
          F4.ui.toast("Listino creato: " + r.idListino, "success");
          F4.router.go("listini");
        });
      });
    });
  });
};

// ============================================================
// VIEW: GESTIONE MAGAZZINI
// ============================================================
F4.views.magazzini = function(container) {
  if (!F4.auth.isAdmin()) {
    container.innerHTML = "<div class=\"empty-state\">Solo amministratori</div>"; return;
  }
  F4.api.getMagazzini(function(err, res) {
    var dati = (res && res.success ? res.data : []) || [];
    container.innerHTML =
      "<div class=\"view-header\"><h2 class=\"view-title\">&#127968; Gestione Magazzini</h2>" +
      "<button id=\"mag-nuovo\" class=\"btn btn-primary btn-sm\">+ Nuovo</button></div>" +
      "<div class=\"table-wrap\"><table class=\"f4-table\"><thead><tr>" +
      "<th>ID</th><th>Nome</th><th>Sede</th><th>Stato</th><th>Azioni</th>" +
      "</tr></thead><tbody>" +
      dati.map(function(m) {
        return "<tr>" +
          "<td><code>" + m.ID_MAGAZZINO + "</code></td>" +
          "<td><strong>" + m.NOME_MAGAZZINO + "</strong></td>" +
          "<td>" + (m.SEDE||"-") + "</td>" +
          "<td><span class=\"badge " + (m.STATO === "Attivo" ? "badge-attivo" : "badge-storico") + "\">" + (m.STATO||"Attivo") + "</span></td>" +
          "<td><button class=\"btn btn-outline btn-xs mag-edit\" data-id=\"" + m.ID_MAGAZZINO + "\" data-nome=\"" + m.NOME_MAGAZZINO + "\" data-sede=\"" + (m.SEDE||"") + "\" data-stato=\"" + (m.STATO||"Attivo") + "\">Modifica</button></td>" +
          "</tr>";
      }).join("") +
      "</tbody></table></div>";

    document.getElementById("mag-nuovo").addEventListener("click", function() {
      var nome = prompt("Nome del nuovo magazzino:");
      if (!nome) return;
      var sede = prompt("Sede (opzionale):") || "";
      F4.ui.showSpinner("Creazione...");
      F4.api.creaMagazzino({nome:nome, sede:sede}, function(e,r) {
        F4.ui.hideSpinner();
        if (e || !r || !r.success) { F4.ui.err(r ? r.message : "Errore"); return; }
        F4.ui.toast("Magazzino creato", "success");
        F4.router.go("magazzini");
      });
    });

    container.querySelectorAll(".mag-edit").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var id = this.getAttribute("data-id");
        var nome = this.getAttribute("data-nome");
        var sede = this.getAttribute("data-sede");
        var stato = this.getAttribute("data-stato");
        var nuovoNome = prompt("Nome magazzino:", nome);
        if (!nuovoNome) return;
        var nuovaSede = prompt("Sede:", sede) || "";
        var nuovoStato = prompt("Stato (Attivo/Obsoleto):", stato) || stato;
        F4.ui.showSpinner("Aggiornamento...");
        F4.api.aggiornaMagazzino({id:id, nome:nuovoNome, sede:nuovaSede, stato:nuovoStato}, function(e,r) {
          F4.ui.hideSpinner();
          if (e || !r || !r.success) { F4.ui.err(r ? r.message : "Errore"); return; }
          F4.ui.toast("Magazzino aggiornato", "success");
          F4.router.go("magazzini");
        });
      });
    });
  });
};

// ============================================================
// VIEW: GESTIONE UTENTI
// ============================================================
F4.views.utenti = function(container) {
  if (!F4.auth.isAdmin()) {
    container.innerHTML = "<div class=\"empty-state\">Solo amministratori</div>"; return;
  }
  F4.api.getUtenti(function(err, res) {
    var dati = (res && res.success ? res.data : []) || [];
    container.innerHTML =
      "<div class=\"view-header\"><h2 class=\"view-title\">&#128100; Gestione Utenti</h2>" +
      "<button id=\"ut-nuovo\" class=\"btn btn-primary btn-sm\">+ Nuovo</button></div>" +
      "<div class=\"table-wrap\"><table class=\"f4-table\"><thead><tr>" +
      "<th>Username</th><th>Nome</th><th>Ruolo</th><th>Stato</th><th>Azioni</th>" +
      "</tr></thead><tbody>" +
      dati.map(function(u) {
        return "<tr>" +
          "<td><code>" + u.USERNAME + "</code></td>" +
          "<td>" + (u.NOME_COMPLETO||"-") + "</td>" +
          "<td><span class=\"badge badge-" + (u.RUOLO||"operativo").toLowerCase() + "\">" + (u.RUOLO||"Operativo") + "</span></td>" +
          "<td><span class=\"badge " + (u.ATTIVO ? "badge-attivo" : "badge-storico") + "\">" + (u.ATTIVO ? "Attivo" : "Disattivato") + "</span></td>" +
          "<td>" +
          "<button class=\"btn btn-outline btn-xs ut-edit\" data-id=\"" + u.ID_UTENTE + "\" data-username=\"" + u.USERNAME + "\" data-nome=\"" + (u.NOME_COMPLETO||"") + "\" data-ruolo=\"" + (u.RUOLO||"Operativo") + "\" data-attivo=\"" + (u.ATTIVO ? "1" : "0") + "\">Modifica</button>" +
          "<button class=\"btn btn-outline btn-xs ut-pwd\" data-id=\"" + u.ID_UTENTE + "\" data-username=\"" + u.USERNAME + "\">Reset pwd</button>" +
          "</td></tr>";
      }).join("") +
      "</tbody></table></div>";

    document.getElementById("ut-nuovo").addEventListener("click", function() {
      var username = prompt("Username (senza spazi):");
      if (!username) return;
      var nome = prompt("Nome completo:") || username;
      var ruolo = prompt("Ruolo (Admin/Responsabile/Operativo):", "Operativo") || "Operativo";
      var pwd = prompt("Password iniziale:");
      if (!pwd) return;
      F4.ui.showSpinner("Creazione utente...");
      F4.api.creaUtente({username:username, nomeCompleto:nome, ruolo:ruolo, password:pwd}, function(e,r) {
        F4.ui.hideSpinner();
        if (e || !r || !r.success) { F4.ui.err(r ? r.message : "Errore"); return; }
        F4.ui.toast("Utente creato", "success");
        F4.router.go("utenti");
      });
    });

    container.querySelectorAll(".ut-edit").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var id = this.getAttribute("data-id");
        var nomeAtt = this.getAttribute("data-nome");
        var ruoloAtt = this.getAttribute("data-ruolo");
        var attivoAtt = this.getAttribute("data-attivo") === "1";
        var nuovoNome = prompt("Nome completo:", nomeAtt);
        if (!nuovoNome) return;
        var nuovoRuolo = prompt("Ruolo (Admin/Responsabile/Operativo):", ruoloAtt) || ruoloAtt;
        var nuovoAttivo = prompt("Attivo? (1=si, 0=no):", attivoAtt ? "1" : "0");
        F4.api.aggiornaUtente({id:id, nomeCompleto:nuovoNome, ruolo:nuovoRuolo, attivo: nuovoAttivo !== "0"}, function(e,r) {
          if (e || !r || !r.success) { F4.ui.err(r ? r.message : "Errore"); return; }
          F4.ui.toast("Utente aggiornato", "success");
          F4.router.go("utenti");
        });
      });
    });

    container.querySelectorAll(".ut-pwd").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var id = this.getAttribute("data-id");
        var username = this.getAttribute("data-username");
        var nuovaPwd = prompt("Nuova password per " + username + ":");
        if (!nuovaPwd) return;
        F4.api.resetPassword({id:id, newPassword:nuovaPwd}, function(e,r) {
          if (e || !r || !r.success) { F4.ui.err(r ? r.message : "Errore"); return; }
          F4.ui.toast("Password aggiornata", "success");
        });
      });
    });
  });
};

// ============================================================
// VIEW: AUDIT LOG
// ============================================================
F4.views.auditLog = function(container) {
  if (!F4.auth.isAdmin()) {
    container.innerHTML = "<div class=\"empty-state\">Solo amministratori</div>"; return;
  }
  F4.ui.showSpinner("Caricamento log...");
  F4.api.getAuditLog(function(err, res) {
    F4.ui.hideSpinner();
    var dati = (res && res.success ? res.data : []) || [];
    container.innerHTML =
      "<div class=\"view-header\"><h2 class=\"view-title\">&#128220; Audit Log</h2>" +
      "<span class=\"badge-count\">" + dati.length + " eventi</span></div>" +
      "<div class=\"table-wrap\"><table class=\"f4-table f4-table-sm\"><thead><tr>" +
      "<th>Data/Ora</th><th>Utente</th><th>Azione</th><th>Dettaglio</th>" +
      "</tr></thead><tbody>" +
      dati.slice(0,200).map(function(r) {
        return "<tr>" +
          "<td><small>" + _fmtData(r.TIMESTAMP) + "</small></td>" +
          "<td>" + (r.USERNAME||"-") + "</td>" +
          "<td><span class=\"badge badge-azione\">" + (r.AZIONE||"-") + "</span></td>" +
          "<td><small>" + (r.DETTAGLIO||"") + "</small></td></tr>";
      }).join("") +
      "</tbody></table></div>";
  });
};

// ============================================================
// VIEW: IMPOSTAZIONI
// ============================================================
F4.views.impostazioni = function(container) {
  if (!F4.auth.isAdmin()) {
    container.innerHTML = "<div class=\"empty-state\">Solo amministratori</div>"; return;
  }
  container.innerHTML =
    "<div class=\"view-header\"><h2 class=\"view-title\">&#9881;&#65039; Impostazioni</h2></div>" +
    "<div class=\"op-card glass\">" +
    "<div class=\"section-title\">Impostazioni Generali</div>" +
    "<p class=\"hint-text\">Gli sconti per fornitore sono gestiti nella sezione Listini e Sconti.</p>" +
    "<div class=\"form-grid\">" +
    "<div class=\"form-group\"><label class=\"f4-label\">Nome Azienda</label>" +
    "<input id=\"imp-azienda\" type=\"text\" class=\"f4-input\" placeholder=\"Finestra 4 S.r.l.\"></div>" +
    "</div>" +
    "<button id=\"imp-save\" class=\"btn btn-primary\">Salva Impostazioni</button>" +
    "</div>";

  F4.api.getImpostazioni(function(err, res) {
    if (err || !res || !res.success) return;
    var d = res.data || {};
    var el = document.getElementById("imp-azienda");
    if (el && d.NOME_AZIENDA) el.value = d.NOME_AZIENDA;
  });

  document.getElementById("imp-save").addEventListener("click", function() {
    var nomeAz = (document.getElementById("imp-azienda")||{}).value || "";
    F4.ui.showSpinner("Salvataggio...");
    F4.api.setImpostazioni({NOME_AZIENDA: nomeAz}, function(e,r) {
      F4.ui.hideSpinner();
      if (e || !r || !r.success) { F4.ui.err(r ? r.message : "Errore"); return; }
      F4.ui.toast("Impostazioni salvate", "success");
    });
  });
};

// ============================================================
// VIEW: REPORTISTICA ISO
// ============================================================
F4.views.reportistica = function(container) {
  if (!F4.auth.canDo("vediPrezzi")) {
    container.innerHTML = "<div class=\"empty-state\">Accesso non autorizzato</div>"; return;
  }

  F4.api.getMagazzini(function(errM, resM) {
    var magazzini = (resM && resM.success ? resM.data : []) || [];
    var magOpts = magazzini.map(function(m) {
      return "<option value=\"" + m.ID_MAGAZZINO + "\">" + m.NOME_MAGAZZINO + "</option>";
    }).join("");

    container.innerHTML =
      "<div class=\"view-header\"><h2 class=\"view-title\">&#128196; Report ISO</h2></div>" +
      "<div class=\"report-grid\">" +

      "<div class=\"op-card glass\">" +
      "<div class=\"section-title\">Inventario Magazzino</div>" +
      "<p class=\"hint-text\">Elenco completo giacenze per magazzino con valorizzazione.</p>" +
      "<div class=\"form-group\"><label class=\"f4-label\">Magazzino</label>" +
      "<select id=\"rp-mag-inv\" class=\"f4-input\"><option value=\"\">Tutti</option>" + magOpts + "</select></div>" +
      "<button class=\"btn btn-primary rp-btn\" data-tipo=\"inventario\">&#128196; Genera PDF</button>" +
      "</div>" +

      "<div class=\"op-card glass\">" +
      "<div class=\"section-title\">Report Movimenti</div>" +
      "<p class=\"hint-text\">Storico movimenti per periodo.</p>" +
      "<div class=\"form-grid\">" +
      "<div class=\"form-group\"><label class=\"f4-label\">Data da</label><input id=\"rp-da\" type=\"date\" class=\"f4-input\"></div>" +
      "<div class=\"form-group\"><label class=\"f4-label\">Data a</label><input id=\"rp-a\" type=\"date\" class=\"f4-input\"></div>" +
      "</div>" +
      "<button class=\"btn btn-primary rp-btn\" data-tipo=\"movimenti\">&#128196; Genera PDF</button>" +
      "</div>" +

      "<div class=\"op-card glass\">" +
      "<div class=\"section-title\">Report Valorizzazione</div>" +
      "<p class=\"hint-text\">Valore totale magazzino per tipologia e famiglia colore.</p>" +
      "<button class=\"btn btn-primary rp-btn\" data-tipo=\"valorizzazione\">&#128196; Genera PDF</button>" +
      "</div>" +

      "</div>";

    container.querySelectorAll(".rp-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var tipo = this.getAttribute("data-tipo");
        var params = { tipo: tipo };
        if (tipo === "inventario") {
          params.idMagazzino = (document.getElementById("rp-mag-inv")||{}).value || "";
        } else if (tipo === "movimenti") {
          params.dataDa = (document.getElementById("rp-da")||{}).value || "";
          params.dataA = (document.getElementById("rp-a")||{}).value || "";
          if (!params.dataDa || !params.dataA) { F4.ui.err("Seleziona entrambe le date"); return; }
        }
        F4.ui.showSpinner("Generazione report...");
        F4.api.generaReport(params, function(err, res) {
          F4.ui.hideSpinner();
          if (err || !res || !res.success) { F4.ui.err(res ? res.message : "Errore nella generazione"); return; }
          var data = res.data;
          if (!data || !data.html) { F4.ui.err("Nessun dato per questo report"); return; }
          var win = window.open("", "_blank");
          if (!win) { F4.ui.err("Popup bloccato. Abilita i popup per questo sito."); return; }
          win.document.write(data.html);
          win.document.close();
          setTimeout(function() { win.print(); }, 800);
        });
      });
    });
  });
};
