// sw.js — Service Worker F4 Magazzino — Network-first per JS
var CACHE_NAME = "f4mag-v5";

self.addEventListener("install", function(e) {
  self.skipWaiting();
});

self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(e) {
  var url = e.request.url;

  // API Google Script: sempre network, mai cache
  if (url.indexOf("script.google.com") !== -1) {
    e.respondWith(fetch(e.request));
    return;
  }

  // File JS e CSS: network-first, fallback cache
  if (url.indexOf(".js") !== -1 || url.indexOf(".css") !== -1) {
    e.respondWith(
      fetch(e.request).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return res;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }

  // Tutto il resto: cache-first
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return res;
      });
    })
  );
});
