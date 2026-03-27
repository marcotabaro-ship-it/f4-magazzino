// sw.js — Service Worker F4 Magazzino
var CACHE_NAME = "f4mag-v3";
var ASSETS = [
  "./index.html",
  "./css/style.css",
  "./js/config.js",
  "./js/api.js",
  "./js/ui.js",
  "./js/auth.js",
  "./js/views.js",
  "./js/app.js",
  "./manifest.json",
  "./icons/icon-192.png"
];

self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(e) {
  var url = e.request.url;
  if (url.indexOf("script.google.com") !== -1) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request);
    })
  );
});
