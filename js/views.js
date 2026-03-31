// ============================================================
// views.js — Tutte le viste della SPA F4 Magazzino
// ============================================================

var F4 = window.F4 || {};
F4.views = {};

// ============================================================
// VIEW: LOGIN
// ============================================================
F4.views.login = function(container) {
  container.innerHTML =
    "<div class=\"login-wrap\">" +
      "<div class=\"login-card glass\">" +
        "<div class=\"login-logo\"><img src=\"icons/icon-192.png\" alt=\"F4 Magazzino\"></div>" +
        "<h1 class=\"login-title\">F4 Magazzino</h1>" +
        "<p class=\"login-sub\">Gestionale Coprifili Internorm</p>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Username</label>" +
          "<input id=\"l-email\" type=\"text\" class=\"f4-input\" placeholder=\"nome@finestra4.it\" autocomplete=\"email\">" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Password</label>" +
          "<input id=\"l-pass\" type=\"password\" class=\"f4-input\" placeholder=\"Password\" autocomplete=\"current-password\">" +
        "</div>" +
        "<div id=\"l-err\" class=\"login-err hidden\"></div>" +
        "<button id=\"l-btn\" class=\"btn btn-primary btn-full\">Accedi</button>" +
      "</div>" +
    "</div>";

  function doLogin() {
    var email = document.getElementById("l-email").value.trim();
    var pass  = document.getElementById("l-pass").value;
    var errEl = document.getElementById("l-err");
    errEl.classList.add("hidden");
    if (!email || !pass) { errEl.textContent = "Compila tutti i campi"; errEl.classList.remove("hidden"); return; }
    F4.auth.login(email, pass, function(errMsg) {
      if (errMsg) { errEl.textContent = errMsg; errEl.classList.remove("hidden"); return; }
      F4.router.go("dashboard");
    });
  }

  document.getElementById("l-btn").addEventListener("click", doLogin);
  document.getElementById("l-pass").addEventListener("keydown", function(e) {
    if (e.key === "Enter") doLogin();
  });
};

// ============================================================
// VIEW: DASHBOARD / PLANCIA OPERATIVA
// ============================================================
F4.views.dashboard = function(container) {
  container.innerHTML =
    "<div class=\"view-header\">" +
      "<h2 class=\"view-title\">&#127968; Plancia Operativa</h2>" +
    "</div>" +
    "<div id=\"dash-content\"><div class=\"loading-placeholder\">Caricamento dashboard...</div></div>";

  // Carica magazzini e dashboard in parallelo
  var magNomi  = {};
  var dashData = null;
  var chiamate = 0;

  function prova() {
    chiamate++;
    if (chiamate < 2) return; // aspetta entrambe le chiamate
    renderDash();
  }

  F4.api.getMagazzini(function(err, res) {
    if (!err && res && res.success) {
      (res.data || []).forEach(function(m) { magNomi[m.idMagazzino] = m.nomeMagazzino; });
    }
    prova();
  });

  // Chiama anche tutti i magazzini inclusi inattivi via getGiacenze per mappare IDs
  F4.api.call("getMagazzini", {}, function(err, res) { /* already handled above */ });

  F4.api.getDashboard(function(err, res) {
    if (!err && res && res.success) dashData = res.data;
    prova();
  });

  function renderDash() {
    var el = document.getElementById("dash-content");
    if (!el) return;
    if (!dashData) {
      el.innerHTML = F4.ui.renderTabellaVuota("Errore nel caricamento");
      return;
    }
    var d = dashData;
    var html = "<div class=\"stats-grid\">";

    html += "<div class=\"stat-card glass\">" +
      "<div class=\"stat-icon\">&#128230;</div>" +
      "<div class=\"stat-label\">Pezzi Totali in Stock</div>" +
      "<div class=\"stat-value\">" + F4.ui.fmtNum(d.totalePezzi, 0) + "</div>" +
      "</div>";

    if (d.totaleValore !== undefined) {
      html += "<div class=\"stat-card glass\">" +
        "<div class=\"stat-icon\">&#128176;</div>" +
        "<div class=\"stat-label\">Valore Totale Stock</div>" +
        "<div class=\"stat-value\">" + F4.ui.fmtEuro(d.totaleValore) + "</div>" +
        "</div>";
    }

    var magKeys = Object.keys(d.perMagazzino || {});
    html += "<div class=\"stat-card glass\">" +
      "<div class=\"stat-icon\">&#127968;</div>" +
      "<div class=\"stat-label\">Magazzini Attivi</div>" +
      "<div class=\"stat-value\">" + magKeys.length + "</div>" +
      "</div>";

    html += "</div>";

    if (magKeys.length > 0) {
      html += "<div class=\"section-title\">Dettaglio per Magazzino</div>" +
        "<div class=\"table-wrap\"><table class=\"f4-table\"><thead><tr>" +
        "<th>Magazzino</th><th>Pezzi</th>" +
        (d.totaleValore !== undefined ? "<th>Valore</th>" : "") +
        "</tr></thead><tbody>";
      magKeys.forEach(function(k) {
        var m    = d.perMagazzino[k];
        var nome = magNomi[k] || (d.nomeMagazzini && d.nomeMagazzini[k]) || k;
        html += "<tr><td><strong>" + F4.ui.esc(nome) + "</strong></td>" +
          "<td>" + F4.ui.fmtNum(m.quantita, 0) + "</td>";
        if (d.totaleValore !== undefined) html += "<td>" + F4.ui.fmtEuro(m.valore) + "</td>";
        html += "</tr>";
      });
      html += "</tbody></table></div>";
    }

    html += "<div class=\"dash-actions\">" +
      "<button class=\"btn btn-primary\" onclick=\"F4.router.go('carico')\">&#10133; Carico</button>" +
      "<button class=\"btn btn-warning\" onclick=\"F4.router.go('scarico')\">&#10134; Scarico</button>" +
      "<button class=\"btn btn-secondary\" onclick=\"F4.router.go('trasferimento')\">&#8644; Trasferimento</button>" +
      "<button class=\"btn btn-accent\" onclick=\"F4.router.go('sfrido')\">&#9986; Cerca Sfrido</button>" +
      "</div>";

    el.innerHTML = html;
  }
};

// ============================================================
// VIEW: ANAGRAFICA PRODOTTI — Filtri a cascata
// ============================================================
F4.views.anagrafica = function(container) {
  container.innerHTML =
    "<div class=\"view-header\">" +
      "<h2 class=\"view-title\">&#128196; Anagrafica Prodotti</h2>" +
    "</div>" +
    "<div class=\"anag-filters glass\" style=\"padding:1rem;margin-bottom:1rem;\">" +
      "<div class=\"form-grid\">" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Tipologia</label>" +
          "<select id=\"f-tip\" class=\"f4-input\"><option value=\"\">Tutte</option></select>" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Materiale</label>" +
          "<select id=\"f-mat\" class=\"f4-input\"><option value=\"\">Tutti</option></select>" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Cod. Internorm</label>" +
          "<select id=\"f-cod\" class=\"f4-input\"><option value=\"\">Tutti</option></select>" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Misura</label>" +
          "<select id=\"f-mis\" class=\"f4-input\"><option value=\"\">Tutte</option></select>" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Famiglia Colore</label>" +
          "<select id=\"f-fam\" class=\"f4-input\"><option value=\"\">Tutte</option></select>" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Colore</label>" +
          "<select id=\"f-col\" class=\"f4-input\"><option value=\"\">Tutti</option></select>" +
        "</div>" +
      "</div>" +
      "<div style=\"margin-top:0.75rem;\">" +
        "<button id=\"anag-reset\" class=\"btn btn-ghost\">&#8635; Reset filtri</button>" +
      "</div>" +
    "</div>" +
    "<div id=\"anag-list\"><div class=\"loading-placeholder\">Caricamento...</div></div>";

  var allProdotti = [];
  var IDS   = ["f-tip","f-mat","f-cod","f-mis","f-fam","f-col"];
  var CAMPI = ["categoria","formaMateriale","codiceInternorm","dimensioniHxlxsp","famigliaColore","codiceColore"];

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value : "";
  }

  function unique(arr) {
    var seen = {};
    return arr.filter(function(v) {
      if (!v || seen[v]) return false;
      seen[v] = true; return true;
    }).sort();
  }

  function subsetFino(idx) {
    return allProdotti.filter(function(p) {
      for (var i = 0; i < idx; i++) {
        var v = val(IDS[i]);
        if (v && (p[CAMPI[i]] || "") !== v) return false;
      }
      return true;
    });
  }

  function popolaSel(id, values, keepVal) {
    var sel = document.getElementById(id);
    if (!sel) return;
    var curr = (keepVal !== undefined) ? keepVal : sel.value;
    sel.innerHTML = "<option value=\"\">Tutti</option>";
    values.forEach(function(v) {
      var opt = document.createElement("option");
      opt.value = v; opt.textContent = v;
      if (v === curr) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function onFiltroChange(idx) {
    for (var j = idx + 1; j < IDS.length; j++) {
      var base = subsetFino(j);
      var vals = unique(base.map(function(p) { return p[CAMPI[j]] || ""; }).filter(Boolean));
      var currVal = val(IDS[j]);
      if (currVal && vals.indexOf(currVal) === -1) currVal = "";
      popolaSel(IDS[j], vals, currVal);
    }
    renderTabella();
  }

  function inizializzaFiltri() {
    IDS.forEach(function(id, i) {
      var vals = unique(allProdotti.map(function(p) { return p[CAMPI[i]] || ""; }).filter(Boolean));
      popolaSel(id, vals, "");
      document.getElementById(id).addEventListener("change", function() {
        onFiltroChange(i);
      });
    });
    renderTabella();
  }

  function filtraCorrente() {
    return allProdotti.filter(function(p) {
      for (var i = 0; i < IDS.length; i++) {
        var v = val(IDS[i]);
        if (v && (p[CAMPI[i]] || "") !== v) return false;
      }
      return true;
    });
  }

  function renderTabella() {
    var el = document.getElementById("anag-list");
    if (!el) return;
    var filtrati = filtraCorrente();
    if (filtrati.length === 0) {
      el.innerHTML = F4.ui.renderTabellaVuota("Nessun prodotto trovato con i filtri selezionati");
      return;
    }
    var html = "<div class=\"table-wrap\"><table class=\"f4-table\">" +
      "<thead><tr>" +
      "<th>ID</th><th>Cod.Internorm</th><th>Tipologia</th><th>Materiale</th>" +
      "<th>Misura</th><th>Famiglia</th><th>Colore</th><th>U.M.</th>" +
      "</tr></thead><tbody>";
    filtrati.forEach(function(p) {
      html += "<tr>" +
        "<td><span class=\"badge\">" + F4.ui.esc(p.idProdotto) + "</span></td>" +
        "<td><span class=\"badge badge-blue\">" + F4.ui.esc(p.codiceInternorm || "") + "</span></td>" +
        "<td>" + F4.ui.esc(p.categoria) + "</td>" +
        "<td>" + F4.ui.esc(p.formaMateriale) + "</td>" +
        "<td>" + F4.ui.esc(p.dimensioniHxlxsp || "") + "</td>" +
        "<td>" + F4.ui.esc(p.famigliaColore || "") + "</td>" +
        "<td><span class=\"colore-badge\">" + F4.ui.esc(p.codiceColore) + "</span></td>" +
        "<td>" + F4.ui.esc(p.unitaMisuraUm) + "</td>" +
        "</tr>";
    });
    html += "</tbody></table></div>";
    html += "<div class=\"table-footer\">Trovati: " + filtrati.length + " / " + allProdotti.length + " prodotti</div>";
    el.innerHTML = html;
  }

  document.getElementById("anag-reset").addEventListener("click", function() {
    IDS.forEach(function(id) { document.getElementById(id).value = ""; });
    inizializzaFiltri();
  });

  F4.ui.showSpinner("Caricamento prodotti...");
  F4.api.getProdotti({ stato: "Attivo" }, function(err, res) {
    F4.ui.hideSpinner();
    if (err || !res || !res.success) {
      document.getElementById("anag-list").innerHTML = F4.ui.renderTabellaVuota("Errore caricamento");
      return;
    }
    allProdotti = res.data || [];
    inizializzaFiltri();
  });
};

// ============================================================
// VIEW: GIACENZE E LOTTI — filtri a cascata + dati prodotto
// ============================================================
F4.views.giacenze = function(container) {
  var vediPrezzi = F4.auth.canDo("vediPrezzi");

  container.innerHTML =
    "<div class=\"view-header\">" +
      "<h2 class=\"view-title\">&#128197; Giacenze e Lotti</h2>" +
    "</div>" +
    "<div class=\"anag-filters glass\" style=\"padding:1rem;margin-bottom:1rem;\">" +
      "<div class=\"form-grid\">" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Magazzino</label>" +
          "<select id=\"gf-mag\" class=\"f4-input\"><option value=\"\">Tutti</option></select>" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Tipo Pezzo</label>" +
          "<select id=\"gf-tipo\" class=\"f4-input\"><option value=\"\">Tutti</option><option value=\"Barra\">Barre</option><option value=\"Residuo\">Residui</option></select>" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Tipologia</label>" +
          "<select id=\"gf-tip\" class=\"f4-input\"><option value=\"\">Tutte</option></select>" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Materiale</label>" +
          "<select id=\"gf-mat\" class=\"f4-input\"><option value=\"\">Tutti</option></select>" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Cod. Internorm</label>" +
          "<select id=\"gf-cod\" class=\"f4-input\"><option value=\"\">Tutti</option></select>" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Misura</label>" +
          "<select id=\"gf-mis\" class=\"f4-input\"><option value=\"\">Tutte</option></select>" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Famiglia Colore</label>" +
          "<select id=\"gf-fam\" class=\"f4-input\"><option value=\"\">Tutte</option></select>" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Colore</label>" +
          "<select id=\"gf-col\" class=\"f4-input\"><option value=\"\">Tutti</option></select>" +
        "</div>" +
      "</div>" +
      "<div style=\"margin-top:0.75rem;\">" +
        "<button id=\"gf-reset\" class=\"btn btn-ghost\">&#8635; Reset</button>" +
      "</div>" +
    "</div>" +
    "<div id=\"giac-list\"><div class=\"loading-placeholder\">Caricamento...</div></div>";

  var allRighe = [];
  var IDS_GF   = ["gf-tip","gf-mat","gf-cod","gf-mis","gf-fam","gf-col"];
  var CAMPI_GF = ["categoria","formaMateriale","codiceInternorm","dimensioni","famigliaColore","codiceColore"];

  // Carica magazzini
  F4.api.getMagazzini(function(err, res) {
    if (err || !res || !res.success) return;
    var sel = document.getElementById("gf-mag");
    if (!sel) return;
    (res.data || []).forEach(function(m) {
      var opt = document.createElement("option");
      opt.value = m.idMagazzino;
      opt.textContent = m.nomeMagazzino;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", applicaFiltri);
  });

  function valGF(id) { var el = document.getElementById(id); return el ? el.value : ""; }

  function uniqueGF(arr) {
    var seen = {};
    return arr.filter(function(v) { if (!v || seen[v]) return false; seen[v] = true; return true; }).sort();
  }

  function subsetGF(idx) {
    var mag  = valGF("gf-mag");
    var tipo = valGF("gf-tipo");
    return allRighe.filter(function(r) {
      if (mag  && r.idMagazzino !== mag)  return false;
      if (tipo && r.tipoPezzo   !== tipo) return false;
      for (var i = 0; i < idx; i++) {
        var v = valGF(IDS_GF[i]);
        if (v && (r[CAMPI_GF[i]] || "") !== v) return false;
      }
      return true;
    });
  }

  function popolaSelGF(id, vals, keepVal) {
    var sel = document.getElementById(id);
    if (!sel) return;
    var curr = keepVal !== undefined ? keepVal : sel.value;
    sel.innerHTML = "<option value=\"\">Tutti</option>";
    vals.forEach(function(v) {
      var opt = document.createElement("option");
      opt.value = v; opt.textContent = v;
      if (v === curr) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function aggiornaFiltriCascata(fromIdx) {
    for (var j = fromIdx + 1; j < IDS_GF.length; j++) {
      var base = subsetGF(j);
      var vals = uniqueGF(base.map(function(r) { return r[CAMPI_GF[j]] || ""; }).filter(Boolean));
      var curr = valGF(IDS_GF[j]);
      if (curr && vals.indexOf(curr) === -1) curr = "";
      popolaSelGF(IDS_GF[j], vals, curr);
    }
    renderGiac();
  }

  function inizializzaFiltriProdotto() {
    IDS_GF.forEach(function(id, i) {
      var vals = uniqueGF(allRighe.map(function(r) { return r[CAMPI_GF[i]] || ""; }).filter(Boolean));
      popolaSelGF(id, vals, "");
      document.getElementById(id).addEventListener("change", function() {
        aggiornaFiltriCascata(i);
      });
    });
    document.getElementById("gf-tipo").addEventListener("change", function() {
      aggiornaFiltriCascata(-1);
    });
  }

  function applicaFiltri() {
    var mag  = valGF("gf-mag");
    var tipo = valGF("gf-tipo");
    var filtri = {};
    if (mag) filtri.idMagazzino = mag;
    F4.ui.showSpinner("Caricamento...");
    F4.api.getGiacenze(filtri, function(err, res) {
      F4.ui.hideSpinner();
      if (err || !res || !res.success) return;
      allRighe = (res.data || []).filter(function(r) { return (r.quantitaPz || 0) > 0; });
      inizializzaFiltriProdotto();
      aggiornaFiltriCascata(-1);
    });
  }

  function filtraCorrente() {
    var mag  = valGF("gf-mag");
    var tipo = valGF("gf-tipo");
    return allRighe.filter(function(r) {
      if (mag  && r.idMagazzino !== mag)  return false;
      if (tipo && r.tipoPezzo   !== tipo) return false;
      for (var i = 0; i < IDS_GF.length; i++) {
        var v = valGF(IDS_GF[i]);
        if (v && (r[CAMPI_GF[i]] || "") !== v) return false;
      }
      return true;
    });
  }

  function renderGiac() {
    var el = document.getElementById("giac-list");
    if (!el) return;
    var rows = filtraCorrente();
    if (rows.length === 0) { el.innerHTML = F4.ui.renderTabellaVuota("Nessuna giacenza trovata"); return; }

    var html = "<div class=\"table-wrap\"><table class=\"f4-table\"><thead><tr>" +
      "<th>Lotto</th><th>ID Prod.</th><th>Cod.Int.</th><th>Tipologia</th><th>Materiale</th>" +
      "<th>Misura</th><th>Famiglia</th><th>Colore</th><th>U.M.</th>" +
      "<th>Magazzino</th><th>Tipo</th><th>Pezzi</th><th>Lungh.(ml)</th>";
    if (vediPrezzi) html += "<th>Val.Unit.</th><th>Val.Totale</th>";
    html += "<th>Data Carico</th></tr></thead><tbody>";

    rows.forEach(function(r) {
      var tc = r.tipoPezzo === "Residuo" ? "badge-warn" : "badge-ok";
      html += "<tr>" +
        "<td><span class=\"badge\">" + F4.ui.esc(r.idLotto) + "</span></td>" +
        "<td><span class=\"badge\">" + F4.ui.esc(r.idProdotto) + "</span></td>" +
        "<td><span class=\"badge badge-blue\">" + F4.ui.esc(r.codiceInternorm || "") + "</span></td>" +
        "<td>" + F4.ui.esc(r.categoria || "") + "</td>" +
        "<td>" + F4.ui.esc(r.formaMateriale || "") + "</td>" +
        "<td>" + F4.ui.esc(r.dimensioni || "") + "</td>" +
        "<td>" + F4.ui.esc(r.famigliaColore || "") + "</td>" +
        "<td><span class=\"colore-badge\">" + F4.ui.esc(r.codiceColore || "") + "</span></td>" +
        "<td>" + F4.ui.esc(r.unitaMisura || "ml") + "</td>" +
        "<td><strong>" + F4.ui.esc(r.nomeMagazzino || r.idMagazzino) + "</strong></td>" +
        "<td><span class=\"badge " + tc + "\">" + F4.ui.esc(r.tipoPezzo) + "</span></td>" +
        "<td><strong>" + F4.ui.fmtNum(r.quantitaPz, 0) + "</strong></td>" +
        "<td>" + F4.ui.fmtNum(r.lunghezzaMl, 2) + "</td>";
      if (vediPrezzi) html += "<td>" + F4.ui.fmtEuro(r.valoreUnitario) + "</td><td><strong>" + F4.ui.fmtEuro(r.valoreTotaleLotto) + "</strong></td>";
      html += "<td>" + F4.ui.fmtData(r.dataCarico) + "</td></tr>";
    });

    var totPezzi  = rows.reduce(function(s,r){ return s + (r.quantitaPz||0); }, 0);
    html += "</tbody></table></div>";
    html += "<div class=\"table-footer\">Lotti: " + rows.length + " &nbsp;|&nbsp; Pezzi: " + F4.ui.fmtNum(totPezzi,0) + "</div>";
    if (vediPrezzi) {
      var totVal = rows.reduce(function(s,r){ return s + (r.valoreTotaleLotto||0); }, 0);
      html += "<div class=\"table-footer\">Valore totale: <strong>" + F4.ui.fmtEuro(totVal) + "</strong></div>";
    }
    el.innerHTML = html;
  }

  document.getElementById("gf-reset").addEventListener("click", function() {
    ["gf-mag","gf-tipo"].concat(IDS_GF).forEach(function(id) {
      var el = document.getElementById(id); if (el) el.value = "";
    });
    applicaFiltri();
  });

  applicaFiltri();
};

// ============================================================
// VIEW: CARICO
// ============================================================
F4.views.carico = function(container) {
  var vediPrezzi = F4.auth.canDo("vediPrezzi");
  container.innerHTML =
    "<div class=\"view-header\">" +
      "<h2 class=\"view-title\">&#10133; Carico Merce</h2>" +
    "</div>" +
    "<div class=\"op-card glass\">" +
      "<div class=\"form-grid\">" +
        "<div class=\"form-group full-width\">" +
          "<label class=\"f4-label\">Magazzino Destinazione *</label>" +
          "<select id=\"car-mag\" class=\"f4-input\"><option value=\"\">Seleziona magazzino...</option></select>" +
        "</div>" +
        "<div class=\"form-group full-width\">" +
          "<label class=\"f4-label\">Prodotto *</label>" +
          "<div class=\"autocomplete-wrap\">" +
            "<input id=\"car-prod-input\" class=\"f4-input\" placeholder=\"Cerca prodotto per descrizione o colore...\" autocomplete=\"off\">" +
            "<div id=\"car-prod-dd\" class=\"autocomplete-dropdown hidden\"></div>" +
          "</div>" +
          "<div id=\"car-prod-info\" class=\"prod-info-bar hidden\"></div>" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Tipo Pezzo *</label>" +
          "<select id=\"car-tipo\" class=\"f4-input\">" +
            "<option value=\"Barra\">Barra intera</option>" +
            "<option value=\"Residuo\">Residuo / Sfrido</option>" +
          "</select>" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Quantita Barre / Pezzi</label>" +
          "<input id=\"car-qta\" type=\"number\" min=\"0\" step=\"1\" class=\"f4-input\" value=\"1\">" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Lunghezza ml (se Residuo)</label>" +
          "<input id=\"car-ml\" type=\"number\" min=\"0\" step=\"0.01\" class=\"f4-input\" placeholder=\"es. 2.35\">" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Data Carico</label>" +
          "<input id=\"car-data\" type=\"date\" class=\"f4-input\">" +
        "</div>" +
      "</div>" +
      (vediPrezzi ? "<div id=\"car-preview\" class=\"price-preview hidden\"></div>" : "") +
      "<div class=\"form-actions\">" +
        "<button id=\"car-btn-salva-chiudi\" class=\"btn btn-primary\">&#10003; Salva e Chiudi</button>" +
        "<button id=\"car-btn-salva-nuovo\" class=\"btn btn-secondary\">&#10133; Salva e Nuovo</button>" +
        "<button class=\"btn btn-ghost\" onclick=\"F4.router.go('dashboard')\">Annulla</button>" +
      "</div>" +
    "</div>";

  var oggi = new Date();
  var mm   = String(oggi.getMonth() + 1).padStart(2, "0");
  var gg   = String(oggi.getDate()).padStart(2, "0");
  document.getElementById("car-data").value = oggi.getFullYear() + "-" + mm + "-" + gg;

  var prodottoSelezionato = null;

  F4.api.getMagazzini(function(err, res) {
    if (err || !res || !res.success) return;
    var sel = document.getElementById("car-mag");
    if (!sel) return;
    (res.data || []).forEach(function(m) {
      var opt = document.createElement("option");
      opt.value = m.idMagazzino;
      opt.textContent = m.nomeMagazzino;
      sel.appendChild(opt);
    });
  });

  var allProdotti = [];
  F4.api.getProdotti({ stato: "Attivo" }, function(err, res) {
    if (err || !res || !res.success) return;
    allProdotti = res.data || [];
  });

  var ddEl    = document.getElementById("car-prod-dd");
  var inpEl   = document.getElementById("car-prod-input");
  var infoEl  = document.getElementById("car-prod-info");

  inpEl.addEventListener("input", function() {
    var q = inpEl.value.trim().toLowerCase();
    prodottoSelezionato = null;
    if (infoEl) { infoEl.classList.add("hidden"); infoEl.innerHTML = ""; }
    if (q.length < 2) { ddEl.classList.add("hidden"); return; }
    var matches = allProdotti.filter(function(p) {
      return (p.descrizioneCompleta || "").toLowerCase().indexOf(q) !== -1 ||
             (p.codiceColore || "").toLowerCase().indexOf(q) !== -1;
    }).slice(0, 20);

    if (matches.length === 0) {
      ddEl.innerHTML = "<div class=\"dd-item dd-new\" id=\"dd-crea-nuovo\">&#43; Crea nuovo prodotto \"" + F4.ui.esc(inpEl.value) + "\"</div>";
      ddEl.classList.remove("hidden");
      document.getElementById("dd-crea-nuovo").addEventListener("click", function() {
        ddEl.classList.add("hidden");
        F4.ui.modalCreaProdotto({ categoria: inpEl.value }, function(newId, dati) {
          inpEl.value = dati.categoria + " " + (dati.dimensioni || "") + " " + dati.codiceColore;
          prodottoSelezionato = { idProdotto: newId };
        });
      });
      return;
    }

    ddEl.innerHTML = "";
    matches.forEach(function(p) {
      var item = document.createElement("div");
      item.className = "dd-item";
      item.innerHTML = "<span class=\"dd-id\">" + F4.ui.esc(p.idProdotto) + "</span> " + F4.ui.esc(p.descrizioneCompleta);
      item.addEventListener("click", function() {
        selezionaProdotto(p);
      });
      ddEl.appendChild(item);
    });
    ddEl.classList.remove("hidden");
  });

  document.addEventListener("click", function(e) {
    if (!ddEl.contains(e.target) && e.target !== inpEl) ddEl.classList.add("hidden");
  });

  function selezionaProdotto(p) {
    prodottoSelezionato = p;
    inpEl.value = p.descrizioneCompleta;
    ddEl.classList.add("hidden");
    if (infoEl) {
      infoEl.innerHTML = "<span class=\"info-id\">" + F4.ui.esc(p.idProdotto) + "</span> " +
        F4.ui.esc(p.categoria) + " | " + F4.ui.esc(p.dimensioniHxlxsp) + " | " +
        "<strong>" + F4.ui.esc(p.codiceColore) + "</strong> | U.M.: " + F4.ui.esc(p.unitaMisuraUm);
      infoEl.classList.remove("hidden");
    }
  }

  function getDatiCarico() {
    return {
      idMagazzino: document.getElementById("car-mag").value,
      idProdotto:  prodottoSelezionato ? prodottoSelezionato.idProdotto : "",
      tipoPezzo:   document.getElementById("car-tipo").value,
      quantitaPz:  parseFloat(document.getElementById("car-qta").value) || 0,
      lunghezzaMl: parseFloat(document.getElementById("car-ml").value) || 0
    };
  }

  function resetVariabili() {
    prodottoSelezionato = null;
    inpEl.value = "";
    if (infoEl) { infoEl.classList.add("hidden"); infoEl.innerHTML = ""; }
    document.getElementById("car-tipo").value = "Barra";
    document.getElementById("car-qta").value  = "1";
    document.getElementById("car-ml").value   = "";
  }

  function eseguiCarico(callback) {
    var dati = getDatiCarico();
    if (!dati.idMagazzino) { F4.ui.err("Seleziona il magazzino"); return; }
    if (!dati.idProdotto)  { F4.ui.err("Seleziona un prodotto"); return; }
    if (!dati.quantitaPz && !dati.lunghezzaMl) { F4.ui.err("Inserisci quantita o lunghezza"); return; }
    F4.ui.showSpinner("Salvataggio carico...");
    F4.api.carico(dati, function(err, res) {
      F4.ui.hideSpinner();
      if (err || !res || !res.success) {
        F4.ui.err("Errore: " + (res ? res.error : (err ? err.message : "sconosciuto")));
        return;
      }
      F4.ui.ok("Carico registrato — Lotto: " + res.idLotto);
      if (callback) callback();
    });
  }

  document.getElementById("car-btn-salva-chiudi").addEventListener("click", function() {
    eseguiCarico(function() { F4.router.go("dashboard"); });
  });

  document.getElementById("car-btn-salva-nuovo").addEventListener("click", function() {
    eseguiCarico(function() { resetVariabili(); inpEl.focus(); });
  });
};

// ============================================================
// VIEW: SCARICO
// ============================================================
F4.views.scarico = function(container) {
  container.innerHTML =
    "<div class=\"view-header\">" +
      "<h2 class=\"view-title\">&#10134; Scarico Merce</h2>" +
    "</div>" +
    "<div class=\"op-card glass\">" +
      "<div class=\"form-grid\">" +
        "<div class=\"form-group full-width\">" +
          "<label class=\"f4-label\">Magazzino</label>" +
          "<select id=\"sca-mag\" class=\"f4-input\"><option value=\"\">Tutti i magazzini</option></select>" +
        "</div>" +
        "<div class=\"form-group full-width\">" +
          "<label class=\"f4-label\">ID Lotto *</label>" +
          "<input id=\"sca-lotto\" class=\"f4-input\" placeholder=\"es. LOT-20260327-0001\">" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Quantita Pezzi da scaricare *</label>" +
          "<input id=\"sca-qta\" type=\"number\" min=\"1\" step=\"1\" class=\"f4-input\" value=\"1\">" +
        "</div>" +
      "</div>" +
      "<div class=\"form-actions\">" +
        "<button id=\"sca-btn\" class=\"btn btn-warning\">&#10134; Esegui Scarico</button>" +
        "<button class=\"btn btn-ghost\" onclick=\"F4.router.go('dashboard')\">Annulla</button>" +
      "</div>" +
    "</div>" +
    "<div class=\"section-title\" style=\"margin-top:2rem\">Giacenze Correnti</div>" +
    "<div id=\"sca-giac\"><div class=\"loading-placeholder\">Caricamento...</div></div>";

  F4.api.getMagazzini(function(err, res) {
    if (err || !res || !res.success) return;
    var sel = document.getElementById("sca-mag");
    if (!sel) return;
    (res.data || []).forEach(function(m) {
      var opt = document.createElement("option");
      opt.value = m.idMagazzino;
      opt.textContent = m.nomeMagazzino;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", caricaGiacenze);
  });

  function caricaGiacenze() {
    var mag = document.getElementById("sca-mag") ? document.getElementById("sca-mag").value : "";
    var filtri = {};
    if (mag) filtri.idMagazzino = mag;
    F4.api.getGiacenze(filtri, function(err, res) {
      var el = document.getElementById("sca-giac");
      if (!el) return;
      if (err || !res || !res.success || !res.data || res.data.length === 0) {
        el.innerHTML = F4.ui.renderTabellaVuota("Nessuna giacenza");
        return;
      }
      var html = "<div class=\"table-wrap\"><table class=\"f4-table\"><thead><tr><th>Lotto</th><th>Prodotto</th><th>Tipo</th><th>Lungh. ml</th><th>Pezzi</th><th></th></tr></thead><tbody>";
      res.data.forEach(function(r) {
        if ((r.quantitaPz || 0) <= 0) return;
        html += "<tr>" +
          "<td><span class=\"badge\">" + F4.ui.esc(r.idLotto) + "</span></td>" +
          "<td>" + F4.ui.esc(r.idProdotto) + "</td>" +
          "<td>" + F4.ui.esc(r.tipoPezzo) + "</td>" +
          "<td>" + F4.ui.fmtNum(r.lunghezzaMl, 2) + "</td>" +
          "<td>" + F4.ui.fmtNum(r.quantitaPz, 0) + "</td>" +
          "<td><button class=\"btn btn-sm btn-warning\" onclick=\"document.getElementById('sca-lotto').value='" + F4.ui.esc(r.idLotto) + "'\">Seleziona</button></td>" +
          "</tr>";
      });
      html += "</tbody></table></div>";
      el.innerHTML = html;
    });
  }

  document.getElementById("sca-btn").addEventListener("click", function() {
    var lotto = document.getElementById("sca-lotto").value.trim();
    var qta   = parseInt(document.getElementById("sca-qta").value) || 1;
    if (!lotto) { F4.ui.err("Inserisci l'ID Lotto"); return; }
    F4.ui.conferma("Conferma Scarico", "Scaricare " + qta + " pz dal lotto " + lotto + "?", function() {
      F4.ui.showSpinner("Scarico in corso...");
      F4.api.scarico({ idLotto: lotto, quantitaPz: qta }, function(err, res) {
        F4.ui.hideSpinner();
        if (err || !res || !res.success) { F4.ui.err(res ? res.error : "Errore scarico"); return; }
        F4.ui.ok("Scarico registrato");
        document.getElementById("sca-lotto").value = "";
        document.getElementById("sca-qta").value = "1";
        caricaGiacenze();
      });
    });
  });

  caricaGiacenze();
};

// ============================================================
// VIEW: TRASFERIMENTO — multi-selezione + nome magazzino
// ============================================================
F4.views.trasferimento = function(container) {
  container.innerHTML =
    "<div class=\"view-header\">" +
      "<h2 class=\"view-title\">&#8644; Trasferimento tra Magazzini</h2>" +
    "</div>" +
    "<div class=\"op-card glass\">" +
      "<div class=\"form-grid\">" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Magazzino Origine (filtro)</label>" +
          "<select id=\"tra-orig\" class=\"f4-input\"><option value=\"\">Tutti i magazzini</option></select>" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Magazzino Destinazione *</label>" +
          "<select id=\"tra-dest\" class=\"f4-input\"><option value=\"\">Seleziona...</option></select>" +
        "</div>" +
      "</div>" +
      "<p style=\"color:var(--text-secondary);font-size:0.85rem;margin-top:0.5rem\">Seleziona uno o piu lotti dalla tabella sottostante, poi clicca Esegui Trasferimento.</p>" +
      "<div id=\"tra-selected\" style=\"margin-top:0.5rem;color:var(--accent-gold);font-weight:600\"></div>" +
      "<div class=\"form-actions\">" +
        "<button id=\"tra-btn\" class=\"btn btn-primary\" disabled>&#8644; Esegui Trasferimento Selezionati</button>" +
        "<button id=\"tra-deselect\" class=\"btn btn-ghost\">Deseleziona tutti</button>" +
        "<button id=\"tra-annulla\" class=\"btn btn-ghost\">Annulla</button>" +
      "</div>" +
    "</div>" +
    "<div class=\"section-title\" style=\"margin-top:1.5rem\">Lotti Disponibili — clicca per selezionare</div>" +
    "<div id=\"tra-giac\"><div class=\"loading-placeholder\">Caricamento...</div></div>";

  // Bind annulla button after innerHTML
  var _traAnnullaTimer = setInterval(function() {
    var btn = document.getElementById("tra-annulla");
    if (btn) {
      btn.addEventListener("click", function() { F4.router.go("dashboard"); });
      clearInterval(_traAnnullaTimer);
    }
  }, 50);

  var selezionati = {};
  var tuttiLotti  = [];

  F4.api.getMagazzini(function(err, res) {
    if (err || !res || !res.success) return;
    var selO = document.getElementById("tra-orig");
    var selD = document.getElementById("tra-dest");
    if (!selO || !selD) return;
    (res.data || []).forEach(function(m) {
      var o1 = document.createElement("option"); o1.value = m.idMagazzino; o1.textContent = m.nomeMagazzino; selO.appendChild(o1);
      var o2 = document.createElement("option"); o2.value = m.idMagazzino; o2.textContent = m.nomeMagazzino; selD.appendChild(o2);
    });
    selO.addEventListener("change", caricaLotti);
  });

  function aggiornaBottone() {
    var n   = Object.keys(selezionati).length;
    var btn = document.getElementById("tra-btn");
    var lbl = document.getElementById("tra-selected");
    if (btn) btn.disabled = (n === 0);
    if (lbl) lbl.textContent = n > 0 ? (n + " lotto" + (n > 1 ? "/i selezionato/i" : " selezionato")) : "";
  }

  function caricaLotti() {
    var orig = document.getElementById("tra-orig") ? document.getElementById("tra-orig").value : "";
    var filtri = {};
    if (orig) filtri.idMagazzino = orig;
    F4.api.getGiacenze(filtri, function(err, res) {
      var el = document.getElementById("tra-giac");
      if (!el) return;
      if (err || !res || !res.success) { el.innerHTML = F4.ui.renderTabellaVuota("Errore caricamento"); return; }
      tuttiLotti = (res.data || []).filter(function(r) { return (r.quantitaPz || 0) > 0; });
      selezionati = {};
      aggiornaBottone();
      renderLotti();
    });
  }

  function renderLotti() {
    var el = document.getElementById("tra-giac");
    if (!el) return;
    if (tuttiLotti.length === 0) { el.innerHTML = F4.ui.renderTabellaVuota("Nessun lotto disponibile"); return; }
    var html = "<div class=\"table-wrap\"><table class=\"f4-table\"><thead><tr>" +
      "<th style=\"width:36px\">&#10003;</th>" +
      "<th>Lotto</th><th>Prodotto</th><th>Tipologia</th><th>Colore</th><th>Magazzino Attuale</th><th>Tipo</th><th>Pezzi</th><th>Lungh.(ml)</th>" +
      "</tr></thead><tbody>";
    tuttiLotti.forEach(function(r) {
      var sel = !!selezionati[r.idLotto];
      var rowClass = sel ? "style=\"background:rgba(201,168,76,0.12);cursor:pointer\"" : "style=\"cursor:pointer\"";
      var check = sel ? "&#9745;" : "&#9744;";
      html += "<tr " + rowClass + " onclick=\"F4._traToggle('" + F4.ui.esc(r.idLotto) + "')\">" +
        "<td style=\"text-align:center;font-size:1.1rem\">" + check + "</td>" +
        "<td><span class=\"badge\">" + F4.ui.esc(r.idLotto) + "</span></td>" +
        "<td>" + F4.ui.esc(r.idProdotto) + "</td>" +
        "<td>" + F4.ui.esc(r.categoria || "") + "</td>" +
        "<td><span class=\"colore-badge\">" + F4.ui.esc(r.codiceColore || "") + "</span></td>" +
        "<td><strong>" + F4.ui.esc(r.nomeMagazzino || r.idMagazzino) + "</strong></td>" +
        "<td>" + F4.ui.esc(r.tipoPezzo) + "</td>" +
        "<td>" + F4.ui.fmtNum(r.quantitaPz, 0) + "</td>" +
        "<td>" + F4.ui.fmtNum(r.lunghezzaMl, 2) + "</td>" +
        "</tr>";
    });
    html += "</tbody></table></div>";
    el.innerHTML = html;
  }

  F4._traToggle = function(idLotto) {
    if (selezionati[idLotto]) delete selezionati[idLotto];
    else selezionati[idLotto] = true;
    aggiornaBottone();
    renderLotti();
  };

  document.getElementById("tra-deselect").addEventListener("click", function() {
    selezionati = {};
    aggiornaBottone();
    renderLotti();
  });

  document.getElementById("tra-btn").addEventListener("click", function() {
    var dest = document.getElementById("tra-dest").value;
    var ids  = Object.keys(selezionati);
    if (!dest)       { F4.ui.err("Seleziona il magazzino di destinazione"); return; }
    if (!ids.length) { F4.ui.err("Seleziona almeno un lotto"); return; }
    F4.ui.conferma(
      "Conferma Trasferimento",
      "Trasferire " + ids.length + " lotto/i al magazzino selezionato?",
      function() {
        F4.ui.showSpinner("Trasferimento in corso...");
        var completati = 0;
        var errori     = 0;
        ids.forEach(function(idLotto) {
          F4.api.trasferimento({idLotto: idLotto, idMagazzinoDestinazione: dest}, function(e, r) {
            if (e || !r || !r.success) errori++;
            else completati++;
            if (completati + errori === ids.length) {
              F4.ui.hideSpinner();
              if (errori === 0) F4.ui.ok("Trasferiti " + completati + " lotti con successo");
              else F4.ui.warn("Trasferiti " + completati + " / " + ids.length + " lotti. Errori: " + errori);
              selezionati = {};
              aggiornaBottone();
              caricaLotti();
            }
          });
        });
      }
    );
  });

  caricaLotti();
};

// ============================================================
// VIEW: SFRIDO INTELLIGENTE — con filtri a cascata
// ============================================================
F4.views.sfrido = function(container) {
  var vediPrezzi = F4.auth.canDo("vediPrezzi");
  container.innerHTML =
    "<div class=\"view-header\">" +
      "<h2 class=\"view-title\">&#9986; Sfrido Intelligente</h2>" +
      "<p class=\"view-sub\">Trova il residuo utile piu corto che soddisfa la tua misura</p>" +
    "</div>" +
    "<div class=\"op-card glass\">" +
      "<div class=\"form-grid\">" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Lunghezza Richiesta (ml) *</label>" +
          "<input id=\"sf-ml\" type=\"number\" min=\"0.01\" step=\"0.01\" class=\"f4-input\" placeholder=\"es. 1.85\">" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Magazzino</label>" +
          "<select id=\"sf-mag\" class=\"f4-input\"><option value=\"\">Tutti</option></select>" +
        "</div>" +
      "</div>" +
      "<div class=\"section-title\" style=\"margin-top:1rem;\">Filtri Prodotto (opzionali)</div>" +
      "<div class=\"form-grid\">" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Tipologia</label>" +
          "<select id=\"sf-tip\" class=\"f4-input\"><option value=\"\">Tutte</option></select>" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Materiale</label>" +
          "<select id=\"sf-mat\" class=\"f4-input\"><option value=\"\">Tutti</option></select>" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Cod. Internorm</label>" +
          "<select id=\"sf-cod\" class=\"f4-input\"><option value=\"\">Tutti</option></select>" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Misura</label>" +
          "<select id=\"sf-mis\" class=\"f4-input\"><option value=\"\">Tutte</option></select>" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Famiglia Colore</label>" +
          "<select id=\"sf-fam\" class=\"f4-input\"><option value=\"\">Tutte</option></select>" +
        "</div>" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Colore</label>" +
          "<select id=\"sf-col\" class=\"f4-input\"><option value=\"\">Tutti</option></select>" +
        "</div>" +
      "</div>" +
      "<div class=\"form-actions\" style=\"margin-top:1rem;\">" +
        "<button id=\"sf-btn\" class=\"btn btn-accent\">&#128269; Cerca Sfrido</button>" +
        "<button id=\"sf-reset\" class=\"btn btn-ghost\">&#8635; Reset</button>" +
      "</div>" +
    "</div>" +
    "<div id=\"sf-result\"></div>";

  var allProdotti = [];
  var IDS_SF   = ["sf-tip","sf-mat","sf-cod","sf-mis","sf-fam","sf-col"];
  var CAMPI_SF = ["categoria","formaMateriale","codiceInternorm","dimensioniHxlxsp","famigliaColore","codiceColore"];

  // Carica magazzini
  F4.api.getMagazzini(function(err, res) {
    if (err || !res || !res.success) return;
    var sel = document.getElementById("sf-mag");
    if (!sel) return;
    (res.data || []).forEach(function(m) {
      var opt = document.createElement("option");
      opt.value = m.idMagazzino;
      opt.textContent = m.nomeMagazzino;
      sel.appendChild(opt);
    });
  });

  // Carica prodotti per filtri a cascata
  F4.api.getProdotti({ stato: "Attivo" }, function(err, res) {
    if (err || !res || !res.success) return;
    allProdotti = res.data || [];
    _inizializzaFiltriSfrido();
  });

  function _unique(arr) {
    var seen = {};
    return arr.filter(function(v) { if (!v || seen[v]) return false; seen[v] = true; return true; }).sort();
  }

  function _valSF(id) { var el = document.getElementById(id); return el ? el.value : ""; }

  function _subsetSF(idx) {
    return allProdotti.filter(function(p) {
      for (var i = 0; i < idx; i++) {
        var v = _valSF(IDS_SF[i]);
        if (v && (p[CAMPI_SF[i]] || "") !== v) return false;
      }
      return true;
    });
  }

  function _popolaSelSF(id, vals, keepVal) {
    var sel = document.getElementById(id);
    if (!sel) return;
    var curr = keepVal !== undefined ? keepVal : sel.value;
    sel.innerHTML = "<option value=\"\">Tutti</option>";
    vals.forEach(function(v) {
      var opt = document.createElement("option");
      opt.value = v; opt.textContent = v;
      if (v === curr) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function _inizializzaFiltriSfrido() {
    IDS_SF.forEach(function(id, i) {
      var vals = _unique(allProdotti.map(function(p) { return p[CAMPI_SF[i]] || ""; }).filter(Boolean));
      _popolaSelSF(id, vals, "");
      document.getElementById(id).addEventListener("change", function() {
        for (var j = i + 1; j < IDS_SF.length; j++) {
          var base = _subsetSF(j);
          var vals2 = _unique(base.map(function(p) { return p[CAMPI_SF[j]] || ""; }).filter(Boolean));
          var currVal = _valSF(IDS_SF[j]);
          if (currVal && vals2.indexOf(currVal) === -1) currVal = "";
          _popolaSelSF(IDS_SF[j], vals2, currVal);
        }
      });
    });
  }

  document.getElementById("sf-reset").addEventListener("click", function() {
    IDS_SF.forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ""; });
    document.getElementById("sf-ml").value = "";
    document.getElementById("sf-result").innerHTML = "";
    _inizializzaFiltriSfrido();
  });

  document.getElementById("sf-btn").addEventListener("click", function() {
    var ml  = parseFloat(document.getElementById("sf-ml").value);
    var mag = document.getElementById("sf-mag").value;
    if (!ml || ml <= 0) { F4.ui.err("Inserisci una lunghezza valida"); return; }

    // Trova idProdotto se selezionato un colore specifico
    var tip = _valSF("sf-tip");
    var mat = _valSF("sf-mat");
    var cod = _valSF("sf-cod");
    var mis = _valSF("sf-mis");
    var fam = _valSF("sf-fam");
    var col = _valSF("sf-col");

    F4.ui.showSpinner("Ricerca sfrido...");
    F4.api.cercaSfrido(ml, null, mag || null, function(err, res) {
      F4.ui.hideSpinner();
      var el = document.getElementById("sf-result");
      if (!el) return;
      if (err || !res || !res.success) { el.innerHTML = F4.ui.renderTabellaVuota("Errore ricerca"); return; }

      // Filtra lato client per i filtri prodotto selezionati
      var rows = (res.data || []).filter(function(r) {
        if (tip && r.categoria      !== tip) return false;
        if (mat && r.formaMateriale !== mat) return false;
        if (cod && (r.codiceInternorm || "") !== cod) return false;
        if (mis && r.dimensioni     !== mis) return false;
        if (fam && r.famigliaColore !== fam) return false;
        if (col && r.codiceColore   !== col) return false;
        return true;
      });

      if (rows.length === 0) {
        el.innerHTML = "<div class=\"alert-box alert-warn\">&#9888; Nessun residuo utile trovato per " + ml + " ml con i filtri selezionati.</div>";
        return;
      }

      var html = "<div class=\"section-title\">Residui disponibili (" + rows.length + " trovati, ordinati per spreco minimo)</div>";
      html += "<div class=\"table-wrap\"><table class=\"f4-table\"><thead><tr>" +
        "<th>Lotto</th><th>ID Prod.</th><th>Cod.Int.</th><th>Tipologia</th><th>Materiale</th>" +
        "<th>Misura</th><th>Famiglia</th><th>Colore</th><th>U.M.</th>" +
        "<th>Magazzino</th><th>Pezzi</th><th>Lungh.(ml)</th><th>Spreco(ml)</th>";
      if (vediPrezzi) html += "<th>Val.Unit.</th><th>Val.Totale</th>";
      html += "</tr></thead><tbody>";

      rows.forEach(function(r) {
        var sc = r.spreco < 0.3 ? "text-ok" : (r.spreco < 1 ? "text-warn" : "");
        html += "<tr>" +
          "<td><span class=\"badge badge-ok\">" + F4.ui.esc(r.idLotto) + "</span></td>" +
          "<td><span class=\"badge\">" + F4.ui.esc(r.idProdotto) + "</span></td>" +
          "<td><span class=\"badge badge-blue\">" + F4.ui.esc(r.codiceInternorm || "") + "</span></td>" +
          "<td>" + F4.ui.esc(r.categoria || "") + "</td>" +
          "<td>" + F4.ui.esc(r.formaMateriale || "") + "</td>" +
          "<td>" + F4.ui.esc(r.dimensioni || "") + "</td>" +
          "<td>" + F4.ui.esc(r.famigliaColore || "") + "</td>" +
          "<td><span class=\"colore-badge\">" + F4.ui.esc(r.codiceColore || "") + "</span></td>" +
          "<td>" + F4.ui.esc(r.unitaMisura || "ml") + "</td>" +
          "<td><strong>" + F4.ui.esc(r.nomeMagazzino || r.idMagazzino) + "</strong></td>" +
          "<td><strong>" + F4.ui.fmtNum(r.quantitaPz, 0) + "</strong></td>" +
          "<td><strong>" + F4.ui.fmtNum(r.lunghezzaMl, 2) + "</strong></td>" +
          "<td class=\"" + sc + "\"><strong>" + F4.ui.fmtNum(r.spreco, 2) + "</strong></td>";
        if (vediPrezzi) {
          html += "<td>" + F4.ui.fmtEuro(r.valoreUnitario) + "</td>" +
                  "<td><strong>" + F4.ui.fmtEuro(r.valoreTotaleLotto) + "</strong></td>";
        }
        html += "</tr>";
      });
      html += "</tbody></table></div>";

      var totPezzi = rows.reduce(function(s,r){ return s + (r.quantitaPz||0); }, 0);
      html += "<div class=\"table-footer\">Lotti: " + rows.length + " &nbsp;|&nbsp; Pezzi: " + F4.ui.fmtNum(totPezzi,0) + "</div>";
      el.innerHTML = html;
    });
  });
};

// ============================================================
// VIEW: MACCHINA DEL TEMPO
// ============================================================
F4.views.storico = function(container) {
  container.innerHTML =
    "<div class=\"view-header\">" +
      "<h2 class=\"view-title\">&#8987; Macchina del Tempo</h2>" +
      "<p class=\"view-sub\">Visualizza le giacenze storiche a una data passata</p>" +
    "</div>" +
    "<div class=\"op-card glass\">" +
      "<div class=\"form-grid\">" +
        "<div class=\"form-group\">" +
          "<label class=\"f4-label\">Data di riferimento *</label>" +
          "<input id=\"st-data\" type=\"date\" class=\"f4-input\">" +
        "</div>" +
      "</div>" +
      "<div class=\"form-actions\">" +
        "<button id=\"st-btn\" class=\"btn btn-primary\">&#8987; Calcola Snapshot</button>" +
      "</div>" +
    "</div>" +
    "<div id=\"st-result\"></div>";

  document.getElementById("st-btn").addEventListener("click", function() {
    var rawData = document.getElementById("st-data").value;
    if (!rawData) { F4.ui.err("Seleziona una data"); return; }
    var parts = rawData.split("-");
    var dataFmt = parts[2] + "/" + parts[1] + "/" + parts[0];
    F4.ui.showSpinner("Calcolo snapshot storico...");
    F4.api.getSnapshotStorico(dataFmt, function(err, res) {
      F4.ui.hideSpinner();
      var el = document.getElementById("st-result");
      if (!el) return;
      if (err || !res || !res.success) { el.innerHTML = F4.ui.renderTabellaVuota("Errore calcolo"); return; }
      if (!res.data || res.data.length === 0) {
        el.innerHTML = "<div class=\"alert-box alert-info\">Nessuna giacenza rilevata al " + dataFmt + "</div>";
        return;
      }
      var html = "<div class=\"section-title\">Snapshot al " + F4.ui.esc(dataFmt) + " (" + res.data.length + " righe)</div>";
      html += "<div class=\"table-wrap\"><table class=\"f4-table\"><thead><tr><th>Magazzino</th><th>Prodotto</th><th>Quantita</th></tr></thead><tbody>";
      res.data.forEach(function(r) {
        html += "<tr><td>" + F4.ui.esc(r.idMagazzino) + "</td><td>" + F4.ui.esc(r.idProdotto) + "</td><td>" + F4.ui.fmtNum(r.quantita, 0) + "</td></tr>";
      });
      html += "</tbody></table></div>";
      el.innerHTML = html;
    });
  });
};

// ============================================================
// VIEW: MAGAZZINI
// ============================================================
F4.views.magazzini = function(container) {
  var puoGestire = F4.auth.canDo("gestioneMagazzini");
  container.innerHTML =
    "<div class=\"view-header\">" +
      "<h2 class=\"view-title\">&#127968; Gestione Magazzini</h2>" +
      (puoGestire ? "<button id=\"mag-nuovo\" class=\"btn btn-primary\">&#43; Nuovo Magazzino</button>" : "") +
    "</div>" +
    "<div id=\"mag-list\"><div class=\"loading-placeholder\">Caricamento...</div></div>";

  function carica() {
    F4.api.getMagazzini(function(err, res) {
      var el = document.getElementById("mag-list");
      if (!el) return;
      if (err || !res || !res.success || !res.data || res.data.length === 0) {
        el.innerHTML = F4.ui.renderTabellaVuota("Nessun magazzino configurato");
        return;
      }
      var html = "<div class=\"table-wrap\"><table class=\"f4-table\"><thead><tr><th>ID</th><th>Nome</th><th>Indirizzo</th><th>Stato</th>" +
        (puoGestire ? "<th>Azioni</th>" : "") + "</tr></thead><tbody>";
      res.data.forEach(function(m) {
        html += "<tr>" +
          "<td><span class=\"badge\">" + F4.ui.esc(m.idMagazzino) + "</span></td>" +
          "<td><strong>" + F4.ui.esc(m.nomeMagazzino) + "</strong></td>" +
          "<td>" + F4.ui.esc(m.indirizzo) + "</td>" +
          "<td><span class=\"badge badge-ok\">" + F4.ui.esc(m.stato) + "</span></td>";
        if (puoGestire) {
          html += "<td><button class=\"btn btn-sm btn-secondary\" onclick=\"F4.views._editMagazzino('" +
            F4.ui.esc(m.idMagazzino) + "','" + F4.ui.esc(m.nomeMagazzino) + "','" + F4.ui.esc(m.indirizzo) + "','" + F4.ui.esc(m.stato) + "')\">&#9998; Modifica</button></td>";
        }
        html += "</tr>";
      });
      html += "</tbody></table></div>";
      el.innerHTML = html;
    });
  }

  F4.views._editMagazzino = function(id, nome, ind, stato) {
    var html = "<div class=\"form-group\"><label>Nome Magazzino</label>" +
      "<input id=\"em-nome\" class=\"f4-input\" value=\"" + F4.ui.esc(nome) + "\"></div>" +
      "<div class=\"form-group\"><label>Indirizzo</label>" +
      "<input id=\"em-ind\" class=\"f4-input\" value=\"" + F4.ui.esc(ind) + "\"></div>" +
      "<div class=\"form-group\"><label>Stato</label>" +
      "<select id=\"em-stato\" class=\"f4-input\">" +
      "<option value=\"Attivo\"" + (stato === "Attivo" ? " selected" : "") + ">Attivo</option>" +
      "<option value=\"Inattivo\"" + (stato === "Inattivo" ? " selected" : "") + ">Inattivo (obsoleto)</option>" +
      "</select></div>";
    F4.ui.modal("Modifica Magazzino " + id, html, [
      { label: "Annulla", cls: "btn-ghost" },
      { label: "Salva", cls: "btn-primary", chiudi: false, action: function() {
        var dati = {
          idMagazzino:   id,
          nomeMagazzino: document.getElementById("em-nome").value.trim(),
          indirizzo:     document.getElementById("em-ind").value.trim(),
          stato:         document.getElementById("em-stato").value
        };
        if (!dati.nomeMagazzino) { F4.ui.err("Nome obbligatorio"); return; }
        F4.ui.showSpinner("Salvataggio...");
        F4.api.aggiornaMagazzino(dati, function(e, r) {
          F4.ui.hideSpinner();
          if (e || !r || !r.success) { F4.ui.err(r ? r.error : "Errore"); return; }
          F4.ui.ok("Magazzino aggiornato");
          F4.ui.closeModal();
          carica();
        });
      }}
    ]);
  };

  if (puoGestire) {
    var btnNuovo = document.getElementById("mag-nuovo");
    if (btnNuovo) btnNuovo.addEventListener("click", function() {
      var html = "<div class=\"form-group\"><label>Nome Magazzino</label>" +
        "<input id=\"nm-nome\" class=\"f4-input\" placeholder=\"es. Magazzino Trieste\"></div>" +
        "<div class=\"form-group\"><label>Indirizzo</label>" +
        "<input id=\"nm-ind\" class=\"f4-input\" placeholder=\"Via...\"></div>";
      F4.ui.modal("Nuovo Magazzino", html, [
        { label: "Annulla", cls: "btn-ghost" },
        { label: "Crea", cls: "btn-primary", chiudi: false, action: function() {
          var nome = document.getElementById("nm-nome").value.trim();
          var ind  = document.getElementById("nm-ind").value.trim();
          if (!nome) { F4.ui.err("Nome obbligatorio"); return; }
          F4.ui.showSpinner("Creazione...");
          F4.api.creaMagazzino({ nomeMagazzino: nome, indirizzo: ind }, function(e, r) {
            F4.ui.hideSpinner();
            if (e || !r || !r.success) { F4.ui.err(r ? r.error : "Errore"); return; }
            F4.ui.ok("Magazzino " + r.idMagazzino + " creato");
            F4.ui.closeModal();
            carica();
          });
        }}
      ]);
    });
  }

  carica();
};

// ============================================================
// VIEW: GESTIONE LISTINI E SCONTI — COMPLETA
// ============================================================
F4.views.listini = function(container) {
  var canEdit = F4.auth.canDo("gestioneListini");

  container.innerHTML =
    "<div class=\"view-header\">" +
      "<h2 class=\"view-title\">&#128181; Listini e Sconti</h2>" +
    "</div>" +
    "<div class=\"op-card glass\">" +
      "<div class=\"section-title\">Fornitori</div>" +
      "<div id=\"lst-fornitori\"><div class=\"loading-placeholder\">Caricamento...</div></div>" +
      (canEdit ? "<button id=\"lst-nuovo-for\" class=\"btn btn-secondary\" style=\"margin-top:0.75rem\">&#43; Nuovo Fornitore</button>" : "") +
    "</div>" +
    "<div id=\"lst-listini-section\" class=\"hidden\"></div>" +
    "<div id=\"lst-sconti-section\" class=\"hidden\"></div>" +
    "<div id=\"lst-prezzi-section\" class=\"hidden\"></div>";

  var statoListini = { idFornitore: null, idListino: null };

  // ——— FORNITORI ———
  function caricaFornitori() {
    F4.api.getFornitori(function(err, res) {
      var el = document.getElementById("lst-fornitori");
      if (!el) return;
      if (err || !res || !res.success || !res.data || !res.data.length) {
        el.innerHTML = F4.ui.renderTabellaVuota("Nessun fornitore. Eseguire la migrazione.");
        return;
      }
      var html = "<div class=\"table-wrap\"><table class=\"f4-table\"><thead><tr><th>ID</th><th>Fornitore</th><th>Stato</th><th></th></tr></thead><tbody>";
      res.data.forEach(function(f) {
        html += "<tr>" +
          "<td><span class=\"badge\">" + F4.ui.esc(f.idFornitore) + "</span></td>" +
          "<td><strong>" + F4.ui.esc(f.nomeFornitore) + "</strong></td>" +
          "<td><span class=\"badge badge-ok\">" + F4.ui.esc(f.stato) + "</span></td>" +
          "<td><button class=\"btn btn-sm btn-primary\" onclick=\"F4._lstSelFornitore('" + F4.ui.esc(f.idFornitore) + "','" + F4.ui.esc(f.nomeFornitore) + "')\">Gestisci Listini</button></td>" +
          "</tr>";
      });
      html += "</tbody></table></div>";
      el.innerHTML = html;
    });
  }

  F4._lstSelFornitore = function(idFor, nomeFor) {
    statoListini.idFornitore = idFor;
    statoListini.idListino   = null;
    var sec = document.getElementById("lst-listini-section");
    sec.classList.remove("hidden");
    sec.innerHTML =
      "<div class=\"op-card glass\">" +
        "<div class=\"section-title\">Listini — " + F4.ui.esc(nomeFor) + "</div>" +
        "<div id=\"lst-listini-table\"><div class=\"loading-placeholder\">Caricamento...</div></div>" +
        (canEdit ?
          "<div class=\"form-actions\" style=\"margin-top:0.75rem;\">" +
            "<button id=\"lst-nuovo-lst\" class=\"btn btn-primary\">&#43; Nuovo Listino</button>" +
          "</div>" : "") +
      "</div>";
    caricaListini(idFor);
    if (canEdit) {
      document.getElementById("lst-nuovo-lst").addEventListener("click", function() {
        modalNuovoListino(idFor);
      });
    }
  };

  function caricaListini(idFor) {
    F4.api.getListiniTestata({idFornitore: idFor}, function(err, res) {
      var el = document.getElementById("lst-listini-table");
      if (!el) return;
      if (err || !res || !res.success || !res.data || !res.data.length) {
        el.innerHTML = F4.ui.renderTabellaVuota("Nessun listino per questo fornitore");
        return;
      }
      var html = "<div class=\"table-wrap\"><table class=\"f4-table\"><thead><tr><th>ID</th><th>Nome</th><th>Data Inizio</th><th>Stato</th><th></th></tr></thead><tbody>";
      res.data.forEach(function(l) {
        var statoClass = l.stato === "Attivo" ? "badge-ok" : (l.stato === "Bozza" ? "badge-warn" : "");
        html += "<tr>" +
          "<td><span class=\"badge\">" + F4.ui.esc(l.idListino) + "</span></td>" +
          "<td><strong>" + F4.ui.esc(l.nomeListino) + "</strong></td>" +
          "<td>" + F4.ui.esc(l.dataInizio) + "</td>" +
          "<td><span class=\"badge " + statoClass + "\">" + F4.ui.esc(l.stato) + "</span></td>" +
          "<td style=\"display:flex;gap:0.4rem;\">" +
            "<button class=\"btn btn-sm btn-primary\" onclick=\"F4._lstSelListino('" + F4.ui.esc(l.idListino) + "','" + F4.ui.esc(l.nomeListino) + "')\">Gestisci</button>" +
            (canEdit && l.stato === "Bozza" ? "<button class=\"btn btn-sm btn-warning\" onclick=\"F4._lstAttivaListino('" + F4.ui.esc(l.idListino) + "')\">Attiva</button>" : "") +
          "</td></tr>";
      });
      html += "</tbody></table></div>";
      el.innerHTML = html;
    });
  }

  F4._lstAttivaListino = function(idListino) {
    F4.ui.conferma("Attiva Listino", "Attivare il listino " + idListino + "? Il listino attuale diventerà Storico.", function() {
      F4.ui.showSpinner("Attivazione...");
      F4.api.attivaListino(idListino, function(e, r) {
        F4.ui.hideSpinner();
        if (e || !r || !r.success) { F4.ui.err(r ? r.error : "Errore"); return; }
        F4.ui.ok("Listino attivato");
        caricaListini(statoListini.idFornitore);
      });
    });
  };

  function modalNuovoListino(idFor) {
    var html = "<div class=\"form-grid\">" +
      "<div class=\"form-group full-width\"><label class=\"f4-label\">Nome Listino</label><input id=\"nl-nome\" class=\"f4-input\" placeholder=\"es. Internorm 2027\"></div>" +
      "<div class=\"form-group\"><label class=\"f4-label\">Data Inizio (gg/mm/aaaa)</label><input id=\"nl-data\" class=\"f4-input\" placeholder=\"01/01/2027\"></div>" +
      "</div>" +
      "<p style=\"color:var(--text-secondary);font-size:0.85rem;margin-top:0.75rem\">Il listino viene creato in stato Bozza. Gli sconti vengono preimpostati al 36% per tutte le tipologie e possono essere modificati.</p>";
    F4.ui.modal("Nuovo Listino", html, [
      { label: "Annulla", cls: "btn-ghost" },
      { label: "Crea Listino", cls: "btn-primary", chiudi: false, action: function() {
        var nome = document.getElementById("nl-nome").value.trim();
        var data = document.getElementById("nl-data").value.trim();
        if (!nome || !data) { F4.ui.err("Compila tutti i campi"); return; }
        F4.ui.showSpinner("Creazione...");
        F4.api.creaListinoTestata({idFornitore: idFor, nomeListino: nome, dataInizio: data}, function(e, r) {
          F4.ui.hideSpinner();
          if (e || !r || !r.success) { F4.ui.err(r ? r.error : "Errore"); return; }
          F4.ui.ok("Listino " + r.idListino + " creato in Bozza");
          F4.ui.closeModal();
          caricaListini(idFor);
        });
      }}
    ]);
  }

  // ——— SCONTI E PREZZI PER LISTINO ———
  F4._lstSelListino = function(idListino, nomeListino) {
    statoListini.idListino = idListino;
    var secSc = document.getElementById("lst-sconti-section");
    var secPr = document.getElementById("lst-prezzi-section");
    secSc.classList.remove("hidden");
    secPr.classList.remove("hidden");

    secSc.innerHTML =
      "<div class=\"op-card glass\">" +
        "<div class=\"section-title\">Sconti per Tipologia — " + F4.ui.esc(nomeListino) + "</div>" +
        "<p style=\"color:var(--text-secondary);font-size:0.85rem;margin-bottom:1rem\">Ogni tipologia ha il proprio sconto applicato al prezzo di listino.</p>" +
        "<div id=\"lst-sconti-table\"><div class=\"loading-placeholder\">Caricamento...</div></div>" +
      "</div>";

    secPr.innerHTML =
      "<div class=\"op-card glass\">" +
        "<div class=\"section-title\">Prezzi Listino — " + F4.ui.esc(nomeListino) + "</div>" +
        "<div class=\"toolbar\">" +
          "<select id=\"lst-f-tip\" class=\"f4-input select-sm\"><option value=\"\">Tutte le tipologie</option></select>" +
          "<select id=\"lst-f-fam\" class=\"f4-input select-sm\"><option value=\"\">Tutte le famiglie</option></select>" +
          "<button id=\"lst-filtra\" class=\"btn btn-primary\">Filtra</button>" +
          (canEdit ? "<button id=\"lst-mod-famiglia\" class=\"btn btn-warning\">&#9998; Modifica per Famiglia</button>" : "") +
        "</div>" +
        "<div id=\"lst-prezzi-table\"><div class=\"loading-placeholder\">Caricamento prezzi...</div></div>" +
      "</div>";

    caricaSconti(idListino);
    caricaPrezziListino(idListino, {});

    document.getElementById("lst-filtra").addEventListener("click", function() {
      caricaPrezziListino(idListino, {
        tipologia:      document.getElementById("lst-f-tip").value,
        famigliaColore: document.getElementById("lst-f-fam").value
      });
    });

    if (canEdit) {
      document.getElementById("lst-mod-famiglia").addEventListener("click", function() {
        modalModificaFamiglia(idListino);
      });
    }
  };

  function caricaSconti(idListino) {
    F4.api.getScontiListino(idListino, function(err, res) {
      var el = document.getElementById("lst-sconti-table");
      if (!el) return;
      if (err || !res || !res.success || !res.data || !res.data.length) {
        el.innerHTML = F4.ui.renderTabellaVuota("Nessuno sconto configurato");
        return;
      }
      var html = "<div class=\"table-wrap\"><table class=\"f4-table\"><thead><tr><th>Tipologia</th><th>Sconto (%)</th>" + (canEdit ? "<th></th>" : "") + "</tr></thead><tbody>";
      res.data.forEach(function(s) {
        html += "<tr>" +
          "<td>" + F4.ui.esc(s.tipologia) + "</td>" +
          "<td><strong>" + s.scontoPerc.toFixed(1) + " %</strong></td>";
        if (canEdit) {
          html += "<td><button class=\"btn btn-sm btn-secondary\" onclick=\"F4._lstEditSconto('" + F4.ui.esc(idListino) + "','" + F4.ui.esc(s.tipologia) + "'," + s.sconto + ")\">Modifica</button></td>";
        }
        html += "</tr>";
      });
      html += "</tbody></table></div>";
      el.innerHTML = html;
    });
  }

  F4._lstEditSconto = function(idListino, tipologia, scontoCorrente) {
    var html = "<div class=\"form-group\">" +
      "<label class=\"f4-label\">Tipologia</label>" +
      "<div style=\"padding:0.5rem 0;font-weight:600\">" + F4.ui.esc(tipologia) + "</div>" +
      "</div>" +
      "<div class=\"form-group\">" +
      "<label class=\"f4-label\">Nuovo Sconto (%)</label>" +
      "<input id=\"es-sconto\" type=\"number\" min=\"0\" max=\"100\" step=\"0.1\" class=\"f4-input\" value=\"" + (scontoCorrente * 100).toFixed(1) + "\"></div>";
    F4.ui.modal("Modifica Sconto — " + tipologia, html, [
      { label: "Annulla", cls: "btn-ghost" },
      { label: "Salva", cls: "btn-primary", chiudi: false, action: function() {
        var pct = parseFloat(document.getElementById("es-sconto").value);
        if (isNaN(pct) || pct < 0 || pct > 100) { F4.ui.err("Valore tra 0 e 100"); return; }
        F4.ui.showSpinner("Salvataggio...");
        F4.api.setScontoTipologia({idListino: idListino, tipologia: tipologia, sconto: pct / 100}, function(e, r) {
          F4.ui.hideSpinner();
          if (e || !r || !r.success) { F4.ui.err(r ? r.error : "Errore"); return; }
          F4.ui.ok("Sconto aggiornato a " + pct.toFixed(1) + "% per " + tipologia);
          F4.ui.closeModal();
          caricaSconti(idListino);
        });
      }}
    ]);
  };

  function caricaPrezziListino(idListino, filtri) {
    var el = document.getElementById("lst-prezzi-table");
    if (el) el.innerHTML = "<div class=\"loading-placeholder\">Caricamento...</div>";
    F4.api.getListinoDettaglio({
      idListino:      idListino,
      tipologia:      filtri.tipologia      || "",
      famigliaColore: filtri.famigliaColore || ""
    }, function(err, res) {
      if (!el) return;
      if (err || !res || !res.success || !res.data || !res.data.length) {
        el.innerHTML = F4.ui.renderTabellaVuota("Nessun prezzo trovato");
        return;
      }

      // Popola filtri tipologia e famiglia
      var tipSet = {}, famSet = {};
      res.data.forEach(function(r) { tipSet[r.categoria] = true; famSet[r.famigliaColore] = true; });
      var selTip = document.getElementById("lst-f-tip");
      var selFam = document.getElementById("lst-f-fam");
      if (selTip && selTip.children.length === 1) {
        Object.keys(tipSet).sort().forEach(function(v) {
          var o = document.createElement("option"); o.value = v; o.textContent = v; selTip.appendChild(o);
        });
      }
      if (selFam && selFam.children.length === 1) {
        Object.keys(famSet).sort().forEach(function(v) {
          var o = document.createElement("option"); o.value = v; o.textContent = v; selFam.appendChild(o);
        });
      }

      var html = "<div class=\"table-wrap\"><table class=\"f4-table\"><thead><tr>" +
        "<th>Cod.Int.</th><th>Tipologia</th><th>Misura</th><th>Famiglia</th><th>Colore</th>" +
        "<th>Imp.Fisso</th><th>Prezzo ml</th><th>Prezzo Barra</th><th>Sconto</th><th>Netto ml</th><th>Netto Barra</th>" +
        (canEdit ? "<th></th>" : "") +
        "</tr></thead><tbody>";
      res.data.slice(0, 300).forEach(function(r) {
        html += "<tr>" +
          "<td><span class=\"badge badge-blue\">" + F4.ui.esc(r.codiceInternorm) + "</span></td>" +
          "<td>" + F4.ui.esc(r.categoria) + "</td>" +
          "<td>" + F4.ui.esc(r.dimensioni) + "</td>" +
          "<td>" + F4.ui.esc(r.famigliaColore) + "</td>" +
          "<td><span class=\"colore-badge\">" + F4.ui.esc(r.codiceColore) + "</span></td>" +
          "<td>" + F4.ui.fmtEuro(r.impostoFissoMl) + "</td>" +
          "<td>" + F4.ui.fmtEuro(r.prezzoMlListino) + "</td>" +
          "<td>" + F4.ui.fmtEuro(r.prezzoBarraList) + "</td>" +
          "<td><strong>" + r.scontoPerc.toFixed(1) + "%</strong></td>" +
          "<td>" + F4.ui.fmtEuro(r.prezzoMlNetto) + "</td>" +
          "<td><strong>" + F4.ui.fmtEuro(r.prezzoBarraNetto) + "</strong></td>";
        if (canEdit) {
          html += "<td><button class=\"btn btn-sm btn-secondary\" onclick=\"F4._lstEditPrezzo('" + F4.ui.esc(idListino) + "','" + F4.ui.esc(r.idProdotto) + "'," + (r.impostoFissoMl||0) + "," + (r.prezzoMlListino||0) + "," + (r.prezzoBarraList||0) + ")\">&#9998;</button></td>";
        }
        html += "</tr>";
      });
      html += "</tbody></table></div>";
      html += "<div class=\"table-footer\">Visualizzati: " + Math.min(res.data.length, 300) + " / " + res.totale + " record</div>";
      el.innerHTML = html;
    });
  }

  F4._lstEditPrezzo = function(idListino, idProdotto, impFisso, prezzoMl, prezzoBar) {
    var html = "<div class=\"form-group\"><label class=\"f4-label\">ID Prodotto</label><div style=\"padding:0.5rem 0;font-weight:600\">" + F4.ui.esc(idProdotto) + "</div></div>" +
      "<div class=\"form-grid\">" +
      "<div class=\"form-group\"><label class=\"f4-label\">Imposto Fisso ml (€)</label><input id=\"ep-imp\" type=\"number\" step=\"0.01\" class=\"f4-input\" value=\"" + impFisso + "\"></div>" +
      "<div class=\"form-group\"><label class=\"f4-label\">Prezzo ml Listino (€)</label><input id=\"ep-ml\" type=\"number\" step=\"0.01\" class=\"f4-input\" value=\"" + prezzoMl + "\"></div>" +
      "<div class=\"form-group\"><label class=\"f4-label\">Prezzo Barra Listino (€)</label><input id=\"ep-bar\" type=\"number\" step=\"0.01\" class=\"f4-input\" value=\"" + prezzoBar + "\"></div>" +
      "</div>";
    F4.ui.modal("Modifica Prezzo Singolo", html, [
      { label: "Annulla", cls: "btn-ghost" },
      { label: "Salva", cls: "btn-primary", chiudi: false, action: function() {
        var dati = {
          idListino:      idListino,
          idProdotto:     idProdotto,
          impostoFissoMl:  parseFloat(document.getElementById("ep-imp").value),
          prezzoMlListino: parseFloat(document.getElementById("ep-ml").value),
          prezzoBarraList: parseFloat(document.getElementById("ep-bar").value)
        };
        F4.ui.showSpinner("Salvataggio...");
        F4.api.aggiornaPrezzoSingolo(dati, function(e, r) {
          F4.ui.hideSpinner();
          if (e || !r || !r.success) { F4.ui.err(r ? r.error : "Errore"); return; }
          F4.ui.ok("Prezzo aggiornato");
          F4.ui.closeModal();
          caricaPrezziListino(idListino, {});
        });
      }}
    ]);
  };

  function modalModificaFamiglia(idListino) {
    var html = "<div class=\"form-grid\">" +
      "<div class=\"form-group full-width\"><label class=\"f4-label\">Tipologia</label>" +
      "<select id=\"mf-tip\" class=\"f4-input\">" +
        "<option value=\"Piatta PVC\">Piatta PVC</option>" +
        "<option value=\"Piatta PVC c/incisione\">Piatta PVC c/incisione</option>" +
        "<option value=\"Piatta Alluminio\">Piatta Alluminio</option>" +
        "<option value=\"Angolare PVC\">Angolare PVC</option>" +
        "<option value=\"Angolare Alluminio\">Angolare Alluminio</option>" +
        "<option value=\"Angolare non 90°\">Angolare non 90°</option>" +
        "<option value=\"Angolare PVC Espanso\">Angolare PVC Espanso</option>" +
        "<option value=\"Aggancio Ang. PVC Esp.\">Aggancio Ang. PVC Esp.</option>" +
        "<option value=\"Squadretta PVC Esp.\">Squadretta PVC Esp.</option>" +
        "<option value=\"Coprifuga Legno Impl.\">Coprifuga Legno Impl.</option>" +
      "</select></div>" +
      "<div class=\"form-group full-width\"><label class=\"f4-label\">Famiglia Colore</label>" +
      "<input id=\"mf-fam\" class=\"f4-input\" placeholder=\"es. Bianco, Decor, Standard, EL/HDS/HF/HFM\"></div>" +
      "<div class=\"form-group\"><label class=\"f4-label\">Imposto Fisso ml (€) — lascia vuoto per non modificare</label><input id=\"mf-imp\" type=\"number\" step=\"0.01\" class=\"f4-input\" placeholder=\"es. 12.00\"></div>" +
      "<div class=\"form-group\"><label class=\"f4-label\">Prezzo ml Listino (€)</label><input id=\"mf-ml\" type=\"number\" step=\"0.01\" class=\"f4-input\" placeholder=\"es. 8.90\"></div>" +
      "<div class=\"form-group\"><label class=\"f4-label\">Prezzo Barra Listino (€)</label><input id=\"mf-bar\" type=\"number\" step=\"0.01\" class=\"f4-input\" placeholder=\"es. 58.90\"></div>" +
      "</div>" +
      "<p style=\"color:var(--text-secondary);font-size:0.85rem;margin-top:0.75rem\">Verranno aggiornati tutti i prodotti della tipologia e famiglia selezionate. I campi lasciati vuoti non verranno modificati.</p>";

    F4.ui.modal("Modifica Prezzi per Famiglia", html, [
      { label: "Annulla", cls: "btn-ghost" },
      { label: "Aggiorna Famiglia", cls: "btn-warning", chiudi: false, action: function() {
        var tip = document.getElementById("mf-tip").value;
        var fam = document.getElementById("mf-fam").value.trim();
        if (!fam) { F4.ui.err("Inserisci la famiglia colore"); return; }
        var dati = { idListino: idListino, tipologia: tip, famigliaColore: fam };
        var imp = document.getElementById("mf-imp").value;
        var ml  = document.getElementById("mf-ml").value;
        var bar = document.getElementById("mf-bar").value;
        if (imp) dati.impostoFissoMl  = parseFloat(imp);
        if (ml)  dati.prezzoMlListino = parseFloat(ml);
        if (bar) dati.prezzoBarraList = parseFloat(bar);
        if (!imp && !ml && !bar) { F4.ui.err("Inserisci almeno un prezzo"); return; }
        F4.ui.showSpinner("Aggiornamento prezzi...");
        F4.api.aggiornaPrezziPerFamiglia(dati, function(e, r) {
          F4.ui.hideSpinner();
          if (e || !r || !r.success) { F4.ui.err(r ? r.error : "Errore"); return; }
          F4.ui.ok("Aggiornati " + r.aggiornati + " prodotti per " + tip + " / " + fam);
          F4.ui.closeModal();
          caricaPrezziListino(idListino, {});
        });
      }}
    ]);
  }

  // Nuovo fornitore
  if (canEdit) {
    var btnFor = document.getElementById("lst-nuovo-for");
    if (btnFor) btnFor.addEventListener("click", function() {
      var html = "<div class=\"form-group\"><label class=\"f4-label\">Nome Fornitore</label><input id=\"nf-nome\" class=\"f4-input\" placeholder=\"es. Schuco\"></div>";
      F4.ui.modal("Nuovo Fornitore", html, [
        { label: "Annulla", cls: "btn-ghost" },
        { label: "Crea", cls: "btn-primary", chiudi: false, action: function() {
          var nome = document.getElementById("nf-nome").value.trim();
          if (!nome) { F4.ui.err("Nome obbligatorio"); return; }
          F4.ui.showSpinner("Creazione...");
          F4.api.creaFornitore({nomeFornitore: nome}, function(e, r) {
            F4.ui.hideSpinner();
            if (e || !r || !r.success) { F4.ui.err(r ? r.error : "Errore"); return; }
            F4.ui.ok("Fornitore " + r.idFornitore + " creato");
            F4.ui.closeModal();
            caricaFornitori();
          });
        }}
      ]);
    });
  }

  caricaFornitori();
};

// ============================================================
// VIEW: UTENTI (solo Admin)
// ============================================================
F4.views.utenti = function(container) {
  if (!F4.auth.canDo("gestioneUtenti")) {
    container.innerHTML = "<div class=\"alert-box alert-err\">Accesso non autorizzato</div>";
    return;
  }
  container.innerHTML =
    "<div class=\"view-header\">" +
      "<h2 class=\"view-title\">&#128100; Gestione Utenti</h2>" +
      "<button id=\"ut-nuovo\" class=\"btn btn-primary\">&#43; Nuovo Utente</button>" +
    "</div>" +
    "<div id=\"ut-list\"><div class=\"loading-placeholder\">Caricamento...</div></div>";

  function carica() {
    F4.api.getUtenti(function(err, res) {
      var el = document.getElementById("ut-list");
      if (!el) return;
      if (err || !res || !res.success || !res.data || res.data.length === 0) {
        el.innerHTML = F4.ui.renderTabellaVuota("Nessun utente");
        return;
      }
      var html = "<div class=\"table-wrap\"><table class=\"f4-table\"><thead><tr><th>ID</th><th>Nome</th><th>Email</th><th>Ruolo</th><th>Stato</th><th></th></tr></thead><tbody>";
      res.data.forEach(function(u) {
        var ruoloClass = u.ruolo === "Admin" ? "badge-gold" : (u.ruolo === "Management" ? "badge-blue" : "");
        html += "<tr>" +
          "<td><span class=\"badge\">" + F4.ui.esc(u.idUtente) + "</span></td>" +
          "<td>" + F4.ui.esc(u.nome) + " " + F4.ui.esc(u.cognome) + "</td>" +
          "<td>" + F4.ui.esc(u.email) + "</td>" +
          "<td><span class=\"badge " + ruoloClass + "\">" + F4.ui.esc(u.ruolo) + "</span></td>" +
          "<td>" + F4.ui.esc(u.stato) + "</td>" +
          "<td><button class=\"btn btn-sm btn-secondary\" onclick=\"F4.views._editUtente('" + F4.ui.esc(u.idUtente) + "');\">Modifica</button></td>" +
          "</tr>";
      });
      html += "</tbody></table></div>";
      el.innerHTML = html;
    });
  }

  F4.views._editUtente = function(idUtente) {
    F4.ui.modal("Reimposta Password", "<div class=\"form-group\"><label>Nuova Password</label><input id=\"rp-pass\" type=\"password\" class=\"f4-input\"></div>", [
      { label: "Annulla", cls: "btn-ghost" },
      { label: "Aggiorna", cls: "btn-primary", chiudi: false, action: function() {
        var pass = document.getElementById("rp-pass").value;
        if (!pass) { F4.ui.err("Password obbligatoria"); return; }
        F4.ui.showSpinner("Aggiornamento...");
        F4.api.impostaPassword({ idUtente: idUtente, nuovaPassword: pass }, function(e, r) {
          F4.ui.hideSpinner();
          if (e || !r || !r.success) { F4.ui.err(r ? r.error : "Errore"); return; }
          F4.ui.ok("Password aggiornata");
          F4.ui.closeModal();
        });
      }}
    ]);
  };

  document.getElementById("ut-nuovo").addEventListener("click", function() {
    var html = "<div class=\"form-grid\">" +
      "<div class=\"form-group\"><label>Nome</label><input id=\"nu-nome\" class=\"f4-input\"></div>" +
      "<div class=\"form-group\"><label>Cognome</label><input id=\"nu-cog\" class=\"f4-input\"></div>" +
      "<div class=\"form-group\"><label>Email</label><input id=\"nu-email\" type=\"email\" class=\"f4-input\"></div>" +
      "<div class=\"form-group\"><label>Cellulare</label><input id=\"nu-cell\" class=\"f4-input\"></div>" +
      "<div class=\"form-group\"><label>Ruolo</label><select id=\"nu-ruolo\" class=\"f4-input\"><option>Admin</option><option selected>Management</option><option>Operativo</option></select></div>" +
      "<div class=\"form-group\"><label>Password iniziale</label><input id=\"nu-pass\" type=\"password\" class=\"f4-input\"></div>" +
      "</div>";
    F4.ui.modal("Nuovo Utente", html, [
      { label: "Annulla", cls: "btn-ghost" },
      { label: "Crea Utente", cls: "btn-primary", chiudi: false, action: function() {
        var dati = {
          nome: document.getElementById("nu-nome").value.trim(),
          cognome: document.getElementById("nu-cog").value.trim(),
          email: document.getElementById("nu-email").value.trim(),
          cellulare: document.getElementById("nu-cell").value.trim(),
          ruolo: document.getElementById("nu-ruolo").value,
          password: document.getElementById("nu-pass").value
        };
        if (!dati.email || !dati.password) { F4.ui.err("Email e password obbligatorie"); return; }
        F4.ui.showSpinner("Creazione utente...");
        F4.api.creaUtente(dati, function(e, r) {
          F4.ui.hideSpinner();
          if (e || !r || !r.success) { F4.ui.err(r ? r.error : "Errore"); return; }
          F4.ui.ok("Utente " + r.idUtente + " creato");
          F4.ui.closeModal();
          carica();
        });
      }}
    ]);
  });

  carica();
};

// ============================================================
// VIEW: AUDIT LOG
// ============================================================
F4.views.audit = function(container) {
  if (!F4.auth.canDo("audit")) {
    container.innerHTML = "<div class=\"alert-box alert-err\">Accesso non autorizzato</div>";
    return;
  }
  container.innerHTML =
    "<div class=\"view-header\">" +
      "<h2 class=\"view-title\">&#128221; Audit Log</h2>" +
    "</div>" +
    "<div id=\"audit-list\"><div class=\"loading-placeholder\">Caricamento...</div></div>";

  F4.ui.showSpinner("Caricamento log...");
  F4.api.getAudit({ limit: 100 }, function(err, res) {
    F4.ui.hideSpinner();
    var el = document.getElementById("audit-list");
    if (!el) return;
    if (err || !res || !res.success || !res.data || res.data.length === 0) {
      el.innerHTML = F4.ui.renderTabellaVuota("Nessuna transazione");
      return;
    }
    var html = "<div class=\"table-wrap\"><table class=\"f4-table\"><thead><tr><th>ID</th><th>Data/Ora</th><th>Operatore</th><th>Tipo</th><th>Mag. Orig.</th><th>Mag. Dest.</th><th>Prodotto</th><th>Lungh.</th><th>Qty</th></tr></thead><tbody>";
    res.data.forEach(function(r) {
      var tipoClass = r.tipoMovimento === "CARICO" ? "badge-ok" : (r.tipoMovimento === "SCARICO" ? "badge-warn" : "badge-blue");
      html += "<tr>" +
        "<td><span class=\"badge\">" + F4.ui.esc(r.idTransazione) + "</span></td>" +
        "<td>" + F4.ui.esc(r.dataOra) + "</td>" +
        "<td>" + F4.ui.esc(r.operatore) + "</td>" +
        "<td><span class=\"badge " + tipoClass + "\">" + F4.ui.esc(r.tipoMovimento) + "</span></td>" +
        "<td>" + F4.ui.esc(r.idMagazzinoOrig) + "</td>" +
        "<td>" + F4.ui.esc(r.idMagazzinoDest) + "</td>" +
        "<td>" + F4.ui.esc(r.idProdotto) + "</td>" +
        "<td>" + F4.ui.fmtNum(r.lunghezzaMov, 2) + "</td>" +
        "<td>" + F4.ui.fmtNum(r.quantitaMov, 0) + "</td>" +
        "</tr>";
    });
    html += "</tbody></table></div>";
    html += "<div class=\"table-footer\">Ultime " + res.data.length + " transazioni</div>";
    el.innerHTML = html;
  });
};

// ============================================================
// VIEW: IMPOSTAZIONI
// ============================================================
F4.views.impostazioni = function(container) {
  var utente = F4.auth.getUtente();
  container.innerHTML =
    "<div class=\"view-header\">" +
      "<h2 class=\"view-title\">&#9881; Impostazioni</h2>" +
    "</div>" +
    "<div class=\"op-card glass\">" +
      "<div class=\"section-title\">Profilo Utente</div>" +
      "<p><strong>Nome:</strong> " + F4.ui.esc((utente ? utente.nome + " " + utente.cognome : "—")) + "</p>" +
      "<p><strong>Email:</strong> " + F4.ui.esc((utente ? utente.email : "—")) + "</p>" +
      "<p><strong>Ruolo:</strong> " + F4.ui.esc((utente ? utente.ruolo : "—")) + "</p>" +
      "<div class=\"section-title\" style=\"margin-top:1.5rem\">Cambia Password</div>" +
      "<div class=\"form-group\"><label class=\"f4-label\">Nuova Password</label>" +
      "<input id=\"imp-pass\" type=\"password\" class=\"f4-input\" placeholder=\"Nuova password\"></div>" +
      "<button id=\"imp-save-pass\" class=\"btn btn-primary\">Aggiorna Password</button>" +
"" +
    "</div>";

  document.getElementById("imp-save-pass").addEventListener("click", function() {
    var pass = document.getElementById("imp-pass").value;
    if (!pass) { F4.ui.err("Password obbligatoria"); return; }
    F4.ui.showSpinner("Aggiornamento...");
    F4.api.impostaPassword({ nuovaPassword: pass }, function(e, r) {
      F4.ui.hideSpinner();
      if (e || !r || !r.success) { F4.ui.err(r ? r.error : "Errore"); return; }
      F4.ui.ok("Password aggiornata con successo");
      document.getElementById("imp-pass").value = "";
    });
  });


};

window.F4 = F4;

// ============================================================
// VIEW: REPORTISTICA ISO
// ============================================================
F4.views.reportistica = function(container) {
  var vediPrezzi = F4.auth.canDo("vediPrezzi");
  var vediAudit  = F4.auth.canDo("audit");

  container.innerHTML =
    "<div class=\"view-header\">" +
      "<h2 class=\"view-title\">&#128438; Reportistica ISO</h2>" +
      "<p class=\"view-sub\">Genera report personalizzati in formato ISO con cartiglio</p>" +
    "</div>" +

    "<div class=\"op-card glass\">" +
      "<div class=\"section-title\">Seleziona Tipo Report</div>" +
      "<div class=\"form-grid\">" +
        "<div class=\"form-group full-width\">" +
          "<label class=\"f4-label\">Tipo Report</label>" +
          "<select id=\"rpt-tipo\" class=\"f4-input\">" +
            "<option value=\"\">Seleziona...</option>" +
            "<option value=\"GIACENZE\">Inventario Giacenze</option>" +
            (vediAudit ? "<option value=\"MOVIMENTI\">Storico Movimenti</option>" : "") +
            "<option value=\"SCHEDA_PRODOTTO\">Scheda Prodotto</option>" +
            "<option value=\"RIEPILOGO_MAGAZZINI\">Riepilogo Magazzini</option>" +
          "</select>" +
        "</div>" +
      "</div>" +
      "<div id=\"rpt-filtri\" style=\"margin-top:1rem;\"></div>" +
      "<div class=\"form-actions\" style=\"margin-top:1rem;\">" +
        "<button id=\"rpt-genera\" class=\"btn btn-primary\" disabled>&#128438; Genera Anteprima e PDF</button>" +
      "</div>" +
    "</div>";

  var magazzini = [];
  F4.api.getMagazzini(function(err, res) {
    if (!err && res && res.success) magazzini = res.data || [];
  });

  document.getElementById("rpt-tipo").addEventListener("change", function() {
    var tipo = this.value;
    document.getElementById("rpt-genera").disabled = !tipo;
    _aggiornaPanelloFiltri(tipo, magazzini, vediPrezzi, vediAudit);
  });

  document.getElementById("rpt-genera").addEventListener("click", function() {
    _eseguiReport(magazzini);
  });
};

function _aggiornaPanelloFiltri(tipo, magazzini, vediPrezzi, vediAudit) {
  var el = document.getElementById("rpt-filtri");
  if (!el) return;

  if (!tipo) { el.innerHTML = ""; return; }

  var html = "<div class=\"section-title\" style=\"margin-top:0;\">Filtri Report</div><div class=\"form-grid\">";

  if (tipo === "GIACENZE") {
    html += "<div class=\"form-group\">" +
      "<label class=\"f4-label\">Magazzino</label>" +
      "<select id=\"rpt-f-mag\" class=\"f4-input\"><option value=\"\">Tutti</option>" +
      magazzini.map(function(m) { return "<option value=\"" + m.idMagazzino + "\">" + m.nomeMagazzino + "</option>"; }).join("") +
      "</select></div>" +
      "<div class=\"form-group\">" +
      "<label class=\"f4-label\">Tipo Pezzo</label>" +
      "<select id=\"rpt-f-tipo\" class=\"f4-input\">" +
        "<option value=\"\">Tutti</option>" +
        "<option value=\"Barra\">Barre</option>" +
        "<option value=\"Residuo\">Residui</option>" +
      "</select></div>" +
      "<div class=\"form-group\">" +
      "<label class=\"f4-label\">Solo giacenze positive</label>" +
      "<select id=\"rpt-f-attivi\" class=\"f4-input\">" +
        "<option value=\"true\">Si (predefinito)</option>" +
        "<option value=\"false\">No (includi vuoti)</option>" +
      "</select></div>";
  }

  if (tipo === "MOVIMENTI" && vediAudit) {
    html += "<div class=\"form-group\">" +
      "<label class=\"f4-label\">Data Inizio (gg/mm/aaaa)</label>" +
      "<input id=\"rpt-f-dstart\" type=\"date\" class=\"f4-input\"></div>" +
      "<div class=\"form-group\">" +
      "<label class=\"f4-label\">Data Fine (gg/mm/aaaa)</label>" +
      "<input id=\"rpt-f-dend\" type=\"date\" class=\"f4-input\"></div>" +
      "<div class=\"form-group\">" +
      "<label class=\"f4-label\">Tipo Movimento</label>" +
      "<select id=\"rpt-f-tmov\" class=\"f4-input\">" +
        "<option value=\"\">Tutti</option>" +
        "<option value=\"CARICO\">Carico</option>" +
        "<option value=\"SCARICO\">Scarico</option>" +
        "<option value=\"TRASFERIMENTO\">Trasferimento</option>" +
        "<option value=\"RETTIFICA\">Rettifica</option>" +
      "</select></div>";
  }

  if (tipo === "SCHEDA_PRODOTTO") {
    html += "</div>"; // chiude form-grid
    html += "<div class=\"section-title\" style=\"margin-top:1rem;\">Seleziona Prodotto</div>";
    html += "<div class=\"form-grid\">" +
      "<div class=\"form-group\">" +
        "<label class=\"f4-label\">Tipologia</label>" +
        "<select id=\"rpt-f-tip\" class=\"f4-input\"><option value=\"\">Tutte</option></select>" +
      "</div>" +
      "<div class=\"form-group\">" +
        "<label class=\"f4-label\">Materiale</label>" +
        "<select id=\"rpt-f-mat\" class=\"f4-input\"><option value=\"\">Tutti</option></select>" +
      "</div>" +
      "<div class=\"form-group\">" +
        "<label class=\"f4-label\">Cod. Internorm</label>" +
        "<select id=\"rpt-f-cod\" class=\"f4-input\"><option value=\"\">Tutti</option></select>" +
      "</div>" +
      "<div class=\"form-group\">" +
        "<label class=\"f4-label\">Misura</label>" +
        "<select id=\"rpt-f-mis\" class=\"f4-input\"><option value=\"\">Tutte</option></select>" +
      "</div>" +
      "<div class=\"form-group\">" +
        "<label class=\"f4-label\">Famiglia Colore</label>" +
        "<select id=\"rpt-f-fam\" class=\"f4-input\"><option value=\"\">Tutte</option></select>" +
      "</div>" +
      "<div class=\"form-group\">" +
        "<label class=\"f4-label\">Colore *</label>" +
        "<select id=\"rpt-f-col\" class=\"f4-input\"><option value=\"\">Seleziona colore</option></select>" +
      "</div>" +
    "</div>" +
    "<div id=\"rpt-prod-selezionato\" style=\"margin-top:0.5rem;color:var(--accent-gold);font-weight:600;\"></div>";

    el.innerHTML = html;

    // Carica prodotti e inizializza filtri a cascata
    var allProdotti = [];
    var IDS_RPT = ["rpt-f-tip","rpt-f-mat","rpt-f-cod","rpt-f-mis","rpt-f-fam","rpt-f-col"];
    var CAMPI_RPT = ["categoria","formaMateriale","codiceInternorm","dimensioniHxlxsp","famigliaColore","codiceColore"];

    F4.api.getProdotti({stato: "Attivo"}, function(err, res) {
      if (err || !res || !res.success) return;
      allProdotti = res.data || [];

      function uniqueRPT(arr) {
        var seen = {};
        return arr.filter(function(v) { if (!v || seen[v]) return false; seen[v] = true; return true; }).sort();
      }

      function valRPT(id) { var el2 = document.getElementById(id); return el2 ? el2.value : ""; }

      function subsetRPT(idx) {
        return allProdotti.filter(function(p) {
          for (var i = 0; i < idx; i++) {
            var v = valRPT(IDS_RPT[i]);
            if (v && (p[CAMPI_RPT[i]] || "") !== v) return false;
          }
          return true;
        });
      }

      function popolaRPT(id, vals, keepVal) {
        var sel2 = document.getElementById(id);
        if (!sel2) return;
        var curr = keepVal !== undefined ? keepVal : sel2.value;
        var isLast = (id === "rpt-f-col");
        sel2.innerHTML = "<option value=\"\">Tutt" + (isLast ? "i" : "i") + "</option>";
        vals.forEach(function(v) {
          var opt = document.createElement("option");
          opt.value = v; opt.textContent = v;
          if (v === curr) opt.selected = true;
          sel2.appendChild(opt);
        });
        if (isLast) aggiornaSelezionato();
      }

      function aggiornaSelezionato() {
        var col = valRPT("rpt-f-col");
        var tip = valRPT("rpt-f-tip");
        var lbl = document.getElementById("rpt-prod-selezionato");
        var btnR = document.getElementById("rpt-genera");
        var matches = allProdotti.filter(function(p) {
          if (tip && p.categoria !== tip) return false;
          if (valRPT("rpt-f-mat") && p.formaMateriale !== valRPT("rpt-f-mat")) return false;
          if (valRPT("rpt-f-cod") && (p.codiceInternorm||"") !== valRPT("rpt-f-cod")) return false;
          if (valRPT("rpt-f-mis") && (p.dimensioniHxlxsp||"") !== valRPT("rpt-f-mis")) return false;
          if (valRPT("rpt-f-fam") && p.famigliaColore !== valRPT("rpt-f-fam")) return false;
          if (col && p.codiceColore !== col) return false;
          return true;
        });
        if (lbl) lbl.textContent = matches.length > 0 ? (matches.length + " prodotto/i trovato/i — verranno generati tutti") : (col ? "Nessun prodotto trovato" : "");
        if (btnR) btnR.disabled = (matches.length === 0);
      }

      IDS_RPT.forEach(function(id, i) {
        var vals = uniqueRPT(allProdotti.map(function(p) { return p[CAMPI_RPT[i]] || ""; }).filter(Boolean));
        popolaRPT(id, vals, "");
        var sel2 = document.getElementById(id);
        if (sel2) sel2.addEventListener("change", function() {
          for (var j = i + 1; j < IDS_RPT.length; j++) {
            var base = subsetRPT(j);
            var vals2 = uniqueRPT(base.map(function(p) { return p[CAMPI_RPT[j]] || ""; }).filter(Boolean));
            var curr = valRPT(IDS_RPT[j]);
            if (curr && vals2.indexOf(curr) === -1) curr = "";
            popolaRPT(IDS_RPT[j], vals2, curr);
          }
          aggiornaSelezionato();
        });
      });
    });
    return; // return early - innerHTML already set
  }

  html += "</div>";
  el.innerHTML = html;
}

function _eseguiReport(magazzini) {
  var tipo = document.getElementById("rpt-tipo").value;
  if (!tipo) { F4.ui.err("Seleziona un tipo di report"); return; }

  var params = {};

  if (tipo === "GIACENZE") {
    var magEl    = document.getElementById("rpt-f-mag");
    var tipoEl   = document.getElementById("rpt-f-tipo");
    var attiviEl = document.getElementById("rpt-f-attivi");
    if (magEl && magEl.value)    params.idMagazzino = magEl.value;
    if (tipoEl && tipoEl.value)  params.tipoPezzo   = tipoEl.value;
    if (attiviEl)                params.soloAttivi  = attiviEl.value;
  }

  if (tipo === "MOVIMENTI") {
    var dstartEl = document.getElementById("rpt-f-dstart");
    var dendEl   = document.getElementById("rpt-f-dend");
    var tmovEl   = document.getElementById("rpt-f-tmov");
    if (dstartEl && dstartEl.value) {
      var ps = dstartEl.value.split("-");
      params.dataInizio = ps[2] + "/" + ps[1] + "/" + ps[0];
    }
    if (dendEl && dendEl.value) {
      var pe = dendEl.value.split("-");
      params.dataFine = pe[2] + "/" + pe[1] + "/" + pe[0];
    }
    if (tmovEl && tmovEl.value) params.tipoMovimento = tmovEl.value;
  }

  if (tipo === "SCHEDA_PRODOTTO") {
    // Raccoglie tutti i prodotti che corrispondono ai filtri selezionati
    var colore = document.getElementById("rpt-f-col") ? document.getElementById("rpt-f-col").value : "";
    var tipRpt = document.getElementById("rpt-f-tip") ? document.getElementById("rpt-f-tip").value : "";
    var matRpt = document.getElementById("rpt-f-mat") ? document.getElementById("rpt-f-mat").value : "";
    var codRpt = document.getElementById("rpt-f-cod") ? document.getElementById("rpt-f-cod").value : "";
    var misRpt = document.getElementById("rpt-f-mis") ? document.getElementById("rpt-f-mis").value : "";
    var famRpt = document.getElementById("rpt-f-fam") ? document.getElementById("rpt-f-fam").value : "";
    if (!tipRpt && !colore) { F4.ui.err("Seleziona almeno la Tipologia o il Colore"); return; }
    if (tipRpt)  params.categoria       = tipRpt;
    if (matRpt)  params.formaMateriale  = matRpt;
    if (codRpt)  params.codiceInternorm = codRpt;
    if (misRpt)  params.dimensioni      = misRpt;
    if (famRpt)  params.famigliaColore  = famRpt;
    if (colore)  params.codiceColore    = colore;
  }

  var actionMap = {
    "GIACENZE":            "getReportGiacenze",
    "MOVIMENTI":           "getReportMovimenti",
    "SCHEDA_PRODOTTO":     "getSchedaProdotto",
    "RIEPILOGO_MAGAZZINI": "getReportRiepilogoMagazzini"
  };

  F4.ui.showSpinner("Generazione report...");
  F4.api.call(actionMap[tipo], params, function(err, res) {
    F4.ui.hideSpinner();
    if (err || !res || !res.success) {
      F4.ui.err("Errore: " + (res ? res.error : (err ? err.message : "sconosciuto")));
      return;
    }
    F4.ui.ok("Report generato — apertura anteprima...");
    setTimeout(function() { F4.report.apriAnteprima(res); }, 300);
  });
}


window.F4 = F4;
