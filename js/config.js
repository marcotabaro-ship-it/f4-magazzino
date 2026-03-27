// ============================================================
// config.js — Configurazione globale F4 Magazzino PWA
// ============================================================

var F4 = window.F4 || {};

F4.CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbyX2yKpeXnggoOota642mZk2VEVO-hHY1eKVWVpJypCsgsmUIbnB-WZeinEGnwCdK6WYw/exec",
  APP_NAME: "F4 Magazzino",
  VERSION: "1.0.0",
  SESSION_KEY: "f4mag_token",
  USER_KEY: "f4mag_user",
  TOKEN_TTL_H: 6
};

F4.RUOLI = {
  ADMIN:      "Admin",
  MANAGEMENT: "Management",
  OPERATIVO:  "Operativo"
};

F4.TIPO_MOVIMENTO = {
  CARICO:        "CARICO",
  SCARICO:       "SCARICO",
  TRASFERIMENTO: "TRASFERIMENTO",
  RETTIFICA:     "RETTIFICA"
};

window.F4 = F4;
