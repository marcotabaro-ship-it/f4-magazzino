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
          "<label class=\"f4-label\">Email</label>" +
          "<input id=\"l-email\" type=\"email\" class=\"f4-input\" placeholder=\"nome@finestra4.it\" autocomplete=\"email\">" +
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

  F4.ui.showSpinner("Caricamento dashboard...");
  F4.api.getDashboard(function(err, res) {
    F4.ui.hideSpinner();
    var el = document.getElementById("dash-content");
    if (!el) return;
    if (err || !res || !res.success) {
      el.innerHTML = F4.ui.renderTabellaVuota("Errore nel caricamento");
      return;
    }
    var d = res.data;
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
      html += "<div class=\"section-title\">Dettaglio per Magazzino</div><div class=\"table-wrap\"><table class=\"f4-table\"><thead><tr>" +
        "<th>Magazzino</th><th>Pezzi</th>" +
        (d.totaleValore !== undefined ? "<th>Valore</th>" : "") +
        "</tr></thead><tbody>";
      magKeys.forEach(function(k) {
        var m = d.perMagazzino[k];
        html += "<tr><td>" + F4.ui.esc(k) + "</td><td>" + F4.ui.fmtNum(m.quantita, 0) + "</td>";
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
  });
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
// VIEW: GIACENZE
// ============================================================
F4.views.giacenze = function(container) {
  container.innerHTML =
    "<div class=\"view-header\">" +
      "<h2 class=\"view-title\">&#128197; Giacenze e Lotti</h2>" +
    "</div>" +
    "<div class=\"toolbar\">" +
      "<select id=\"giac-mag\" class=\"f4-input select-sm\"><option value=\"\">Tutti i magazzini</option></select>" +
      "<select id=\"giac-tipo\" class=\"f4-input select-sm\">" +
        "<option value=\"\">Tutti i tipi</option>" +
        "<option value=\"Barra\">Barre</option>" +
        "<option value=\"Residuo\">Residui</option>" +
      "</select>" +
      "<button id=\"giac-cerca\" class=\"btn btn-primary\">Filtra</button>" +
    "</div>" +
    "<div id=\"giac-list\"><div class=\"loading-placeholder\">Caricamento...</div></div>";

  var vediPrezzi = F4.auth.canDo("vediPrezzi");

  F4.api.getMagazzini(function(err, res) {
    if (err || !res || !res.success) return;
    var sel = document.getElementById("giac-mag");
    if (!sel) return;
    (res.data || []).forEach(function(m) {
      var opt = document.createElement("option");
      opt.value = m.idMagazzino;
      opt.textContent = m.nomeMagazzino;
      sel.appendChild(opt);
    });
  });

  function caricaGiacenze() {
    var mag  = document.getElementById("giac-mag").value;
    var tipo = document.getElementById("giac-tipo").value;
    var filtri = {};
    if (mag)  filtri.idMagazzino = mag;
    F4.ui.showSpinner("Caricamento giacenze...");
    F4.api.getGiacenze(filtri, function(err, res) {
      F4.ui.hideSpinner();
      var el = document.getElementById("giac-list");
      if (!el) return;
      if (err || !res || !res.success) {
        el.innerHTML = F4.ui.renderTabellaVuota("Errore caricamento");
        return;
      }
      var rows = (res.data || []).filter(function(r) {
        return !tipo || r.tipoPezzo === tipo;
      });
      if (rows.length === 0) {
        el.innerHTML = F4.ui.renderTabellaVuota("Nessuna giacenza trovata");
        return;
      }
      var html = "<div class=\"table-wrap\"><table class=\"f4-table\">" +
        "<thead><tr><th>Lotto</th><th>Prodotto</th><th>Magazzino</th><th>Tipo</th><th>Lungh. (ml)</th><th>Pezzi</th>";
      if (vediPrezzi) html += "<th>Val. Unitario</th><th>Val. Totale</th>";
      html += "<th>Data Carico</th></tr></thead><tbody>";
      rows.forEach(function(r) {
        var tipoClass = r.tipoPezzo === "Residuo" ? "badge-warn" : "badge-ok";
        html += "<tr>" +
          "<td><span class=\"badge\">" + F4.ui.esc(r.idLotto) + "</span></td>" +
          "<td>" + F4.ui.esc(r.idProdotto) + "</td>" +
          "<td>" + F4.ui.esc(r.idMagazzino) + "</td>" +
          "<td><span class=\"badge " + tipoClass + "\">" + F4.ui.esc(r.tipoPezzo) + "</span></td>" +
          "<td>" + F4.ui.fmtNum(r.lunghezzaMl, 2) + "</td>" +
          "<td>" + F4.ui.fmtNum(r.quantitaPz, 0) + "</td>";
        if (vediPrezzi) {
          html += "<td>" + F4.ui.fmtEuro(r.valoreUnitario) + "</td>" +
                  "<td>" + F4.ui.fmtEuro(r.valoreTotaleLotto) + "</td>";
        }
        html += "<td>" + F4.ui.fmtData(r.dataCarico) + "</td></tr>";
      });
      html += "</tbody></table></div>";
      html += "<div class=\"table-footer\">Lotti trovati: " + rows.length + "</div>";
      el.innerHTML = html;
    });
  }

  document.getElementById("giac-cerca").addEventListener("click", caricaGiacenze);
  caricaGiacenze();
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
// VIEW: TRASFERIMENTO
// ============================================================
F4.views.trasferimento = function(container) {
  container.innerHTML =
    "<div class=\"view-header\">" +
      "<h2 class=\"view-title\">&#8644; Trasferimento tra Magazzini</h2>" +
    "</div>" +
    "<div class=\"op-card glass\">" +
      "<div class=\"form-grid\">" +
        "<div class=\"form-group full-width\">" +
          "<label class=\"f4-label\">ID Lotto da trasferire *</label>" +
          "<input id=\"tra-lotto\" class=\"f4-input\" placeholder=\"es. LOT-20260327-0001\">" +
        "</div>" +
        "<div class=\"form-group full-width\">" +
          "<label class=\"f4-label\">Magazzino Destinazione *</label>" +
          "<select id=\"tra-dest\" class=\"f4-input\"><option value=\"\">Seleziona...</option></select>" +
        "</div>" +
      "</div>" +
      "<div class=\"form-actions\">" +
        "<button id=\"tra-btn\" class=\"btn btn-primary\">&#8644; Esegui Trasferimento</button>" +
        "<button class=\"btn btn-ghost\" onclick=\"F4.router.go('dashboard')\">Annulla</button>" +
      "</div>" +
    "</div>" +
    "<div class=\"section-title\" style=\"margin-top:2rem\">Tutti i Lotti</div>" +
    "<div id=\"tra-giac\"><div class=\"loading-placeholder\">Caricamento...</div></div>";

  F4.api.getMagazzini(function(err, res) {
    if (err || !res || !res.success) return;
    var sel = document.getElementById("tra-dest");
    if (!sel) return;
    (res.data || []).forEach(function(m) {
      var opt = document.createElement("option");
      opt.value = m.idMagazzino;
      opt.textContent = m.nomeMagazzino;
      sel.appendChild(opt);
    });
  });

  F4.api.getGiacenze({}, function(err, res) {
    var el = document.getElementById("tra-giac");
    if (!el) return;
    if (err || !res || !res.success || !res.data || res.data.length === 0) {
      el.innerHTML = F4.ui.renderTabellaVuota("Nessuna giacenza");
      return;
    }
    var html = "<div class=\"table-wrap\"><table class=\"f4-table\"><thead><tr><th>Lotto</th><th>Prodotto</th><th>Magazzino Attuale</th><th>Tipo</th><th>Pezzi</th><th></th></tr></thead><tbody>";
    res.data.forEach(function(r) {
      if ((r.quantitaPz || 0) <= 0) return;
      html += "<tr>" +
        "<td><span class=\"badge\">" + F4.ui.esc(r.idLotto) + "</span></td>" +
        "<td>" + F4.ui.esc(r.idProdotto) + "</td>" +
        "<td>" + F4.ui.esc(r.idMagazzino) + "</td>" +
        "<td>" + F4.ui.esc(r.tipoPezzo) + "</td>" +
        "<td>" + F4.ui.fmtNum(r.quantitaPz, 0) + "</td>" +
        "<td><button class=\"btn btn-sm btn-secondary\" onclick=\"document.getElementById('tra-lotto').value='" + F4.ui.esc(r.idLotto) + "'\">Seleziona</button></td>" +
        "</tr>";
    });
    html += "</tbody></table></div>";
    el.innerHTML = html;
  });

  document.getElementById("tra-btn").addEventListener("click", function() {
    var lotto = document.getElementById("tra-lotto").value.trim();
    var dest  = document.getElementById("tra-dest").value;
    if (!lotto) { F4.ui.err("Inserisci l'ID Lotto"); return; }
    if (!dest)  { F4.ui.err("Seleziona magazzino destinazione"); return; }
    F4.ui.showSpinner("Trasferimento in corso...");
    F4.api.trasferimento({ idLotto: lotto, idMagazzinoDestinazione: dest }, function(err, res) {
      F4.ui.hideSpinner();
      if (err || !res || !res.success) { F4.ui.err(res ? res.error : "Errore"); return; }
      F4.ui.ok("Trasferimento completato");
      document.getElementById("tra-lotto").value = "";
    });
  });
};

// ============================================================
// VIEW: SFRIDO INTELLIGENTE
// ============================================================
F4.views.sfrido = function(container) {
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
          "<label class=\"f4-label\">Magazzino (opzionale)</label>" +
          "<select id=\"sf-mag\" class=\"f4-input\"><option value=\"\">Tutti</option></select>" +
        "</div>" +
      "</div>" +
      "<div class=\"form-actions\">" +
        "<button id=\"sf-btn\" class=\"btn btn-accent\">&#128269; Cerca Sfrido</button>" +
      "</div>" +
    "</div>" +
    "<div id=\"sf-result\"></div>";

  var vediPrezzi = F4.auth.canDo("vediPrezzi");

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

  document.getElementById("sf-btn").addEventListener("click", function() {
    var ml  = parseFloat(document.getElementById("sf-ml").value);
    var mag = document.getElementById("sf-mag").value;
    if (!ml || ml <= 0) { F4.ui.err("Inserisci una lunghezza valida"); return; }
    F4.ui.showSpinner("Ricerca sfrido...");
    F4.api.cercaSfrido(ml, null, mag || null, function(err, res) {
      F4.ui.hideSpinner();
      var el = document.getElementById("sf-result");
      if (!el) return;
      if (err || !res || !res.success) { el.innerHTML = F4.ui.renderTabellaVuota("Errore ricerca"); return; }
      if (!res.data || res.data.length === 0) {
        el.innerHTML = "<div class=\"alert-box alert-warn\">&#9888; Nessun residuo utile trovato per " + ml + " ml. Verificare le giacenze o considerare una barra intera.</div>";
        return;
      }
      var html = "<div class=\"section-title\">Residui disponibili (" + res.trovati + " trovati, ordinati per spreco minimo)</div>";
      html += "<div class=\"table-wrap\"><table class=\"f4-table\"><thead><tr>" +
        "<th>Lotto</th><th>Prodotto</th><th>Magazzino</th><th>Lungh. Residuo (ml)</th><th>Spreco (ml)</th><th>Pezzi disp.</th>";
      if (vediPrezzi) html += "<th>Valore Unitario</th>";
      html += "</tr></thead><tbody>";
      res.data.forEach(function(r) {
        var sprecoClass = r.spreco < 0.3 ? "text-ok" : (r.spreco < 1 ? "text-warn" : "");
        html += "<tr>" +
          "<td><span class=\"badge badge-ok\">" + F4.ui.esc(r.idLotto) + "</span></td>" +
          "<td>" + F4.ui.esc(r.idProdotto) + "</td>" +
          "<td>" + F4.ui.esc(r.idMagazzino) + "</td>" +
          "<td><strong>" + F4.ui.fmtNum(r.lunghezzaMl, 2) + "</strong></td>" +
          "<td class=\"" + sprecoClass + "\">" + F4.ui.fmtNum(r.spreco, 2) + "</td>" +
          "<td>" + F4.ui.fmtNum(r.quantitaPz, 0) + "</td>";
        if (vediPrezzi) html += "<td>" + F4.ui.fmtEuro(r.valoreUnitario) + "</td>";
        html += "</tr>";
      });
      html += "</tbody></table></div>";
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
      (F4.auth.canDo("gestioneListini") ?
        "<div class=\"section-title\" style=\"margin-top:1.5rem\">Sconto Fornitore F4</div>" +
        "<div class=\"form-group\"><label class=\"f4-label\">Sconto attuale (%)</label>" +
        "<input id=\"imp-sconto\" type=\"number\" min=\"0\" max=\"1\" step=\"0.01\" class=\"f4-input\" placeholder=\"es. 0.36\"></div>" +
        "<button id=\"imp-save-sconto\" class=\"btn btn-warning\">Aggiorna Sconto</button>"
      : "") +
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

  if (F4.auth.canDo("gestioneListini")) {
    F4.api.getImpostazioni(function(err, res) {
      if (err || !res || !res.success) return;
      var el = document.getElementById("imp-sconto");
      if (el && res.data && res.data.SCONTO_F4 !== undefined) el.value = res.data.SCONTO_F4;
    });

    document.getElementById("imp-save-sconto").addEventListener("click", function() {
      var s = parseFloat(document.getElementById("imp-sconto").value);
      if (isNaN(s) || s < 0 || s > 1) { F4.ui.err("Inserisci un valore tra 0 e 1 (es. 0.36)"); return; }
      F4.ui.conferma("Conferma aggiornamento sconto", "Aggiornare lo sconto F4 a " + (s * 100).toFixed(0) + "%? Tutti i nuovi carichi useranno questo valore.", function() {
        F4.ui.showSpinner("Aggiornamento sconto...");
        F4.api.setSconto(s, function(e, r) {
          F4.ui.hideSpinner();
          if (e || !r || !r.success) { F4.ui.err(r ? r.error : "Errore"); return; }
          F4.ui.ok("Sconto aggiornato a " + (s * 100).toFixed(0) + "%");
        });
      });
    });
  }
};

window.F4 = F4;
