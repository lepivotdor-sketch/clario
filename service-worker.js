/* =====================================================================
   CLARIO - service-worker.js
   Stratégies :
   - HTML  : network-first (toujours le plus frais, sinon cache offline)
   - CSS / JS / SVG / icônes : cache-first (rarement changent)
   - data/*.json : stale-while-revalidate (rapide ET frais)
   Bump CACHE_VERSION à chaque déploiement majeur.
   ===================================================================== */

// IMPORTANT : bumper cette version à chaque déploiement majeur, ou
// quand on veut forcer tous les navigateurs à jeter leur ancien cache
// (notamment après une correction de sécurité ou de fuite).
const CACHE_VERSION = "clario-v3-2026-05-04-stripe";
const STATIC_CACHE = "clario-static-" + CACHE_VERSION;
const RUNTIME_CACHE = "clario-runtime-" + CACHE_VERSION;

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./formations.html",
  "./formation.html",
  "./contact.html",
  "./merci.html",
  "./conditions.html",
  "./confidentialite.html",
  "./404.html",
  "./manifest.json",
  "./css/base.css",
  "./css/accueil.css",
  "./css/catalogue.css",
  "./css/formation.css",
  "./css/responsive.css",
  "./js/main.js",
  "./js/navigation.js",
  "./js/catalogue.js",
  "./js/formation-loader.js",
  "./assets/logo/logo-clario.svg",
  "./assets/icones/favicon.svg"
];

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function (cache) {
      // addAll échoue si UN fichier manque → on fait un add tolérant
      return Promise.all(PRECACHE_URLS.map(function (url) {
        return cache.add(url).catch(function (err) {
          console.warn("SW precache miss:", url, err);
        });
      }));
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== STATIC_CACHE && k !== RUNTIME_CACHE) {
          return caches.delete(k);
        }
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);

  // On ne gère que la même origine (GitHub Pages)
  if (url.origin !== self.location.origin) return;

  var dest = req.destination;

  // JSON / data : stale-while-revalidate
  if (url.pathname.indexOf("/data/") !== -1 || /\.json($|\?)/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // CSS / JS / images / fonts : cache-first
  if (dest === "style" || dest === "script" || dest === "image" || dest === "font") {
    event.respondWith(cacheFirst(req));
    return;
  }

  // HTML : network-first (avec fallback cache + 404 offline)
  if (dest === "document" || req.headers.get("accept").indexOf("text/html") !== -1) {
    event.respondWith(networkFirstHtml(req));
    return;
  }

  // Reste : cache-first défensif
  event.respondWith(cacheFirst(req));
});

function cacheFirst(req) {
  return caches.match(req).then(function (cached) {
    if (cached) return cached;
    return fetch(req).then(function (res) {
      if (res && res.status === 200) {
        var copy = res.clone();
        caches.open(RUNTIME_CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () { return new Response("", { status: 504, statusText: "Offline" }); });
  });
}

function networkFirstHtml(req) {
  return fetch(req).then(function (res) {
    if (res && res.status === 200) {
      var copy = res.clone();
      caches.open(RUNTIME_CACHE).then(function (c) { c.put(req, copy); });
    }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (cached) {
      return cached || caches.match("./404.html");
    });
  });
}

function staleWhileRevalidate(req) {
  return caches.open(RUNTIME_CACHE).then(function (cache) {
    return cache.match(req).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.status === 200) cache.put(req, res.clone());
        return res;
      }).catch(function () { return null; });
      return cached || network || new Response("[]", {
        headers: { "Content-Type": "application/json" }
      });
    });
  });
}
