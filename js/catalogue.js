/* =====================================================================
   CLARIO - catalogue.js
   Charge data/formations.json, rend la grille, gère filtres et recherche.

   Version « architecture publique ». Le JSON ne contient que des champs
   de vente : id, titre, categorie, prix, niveau, duree, resume_court,
   sous_titre, promesse, resultat_vise_court, public_cible, inclus_public,
   lien_achat, statut. Aucun contenu pédagogique n'est rendu ici.
   ===================================================================== */

(function () {
  "use strict";

  var STORAGE_KEY = "clario:filters:v1";
  var WIRED = false;
  var ALL_FORMATIONS = [];
  var STATE = loadStoredState() || {
    categorie: "tous",
    prix: "tous",
    niveau: "tous",
    recherche: "",
  };

  function loadStoredState() {
    try {
      var raw = window.localStorage && window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    } catch (e) { /* ignore */ }
    return null;
  }

  function saveState() {
    try {
      if (window.localStorage) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE));
    } catch (e) { /* quota / privé : on ignore */ }
  }

  function debounce(fn, wait) {
    var t = null;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  var FILTER_CACHE = { key: null, list: null };
  function cacheKey() {
    return STATE.categorie + "|" + STATE.prix + "|" + STATE.niveau + "|" + STATE.recherche;
  }

  /* ---------- HELPERS ---------- */

  function escapeHTML(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getPrixNumerique(f) {
    if (typeof f.prix === "number") return f.prix;
    if (typeof f.prix === "string") {
      var m = f.prix.match(/\d+(?:[.,]\d+)?/);
      if (m) {
        var n = parseFloat(m[0].replace(",", "."));
        return isNaN(n) ? null : n;
      }
    }
    return null;
  }

  function formatPrix(f) {
    if (typeof f.prix === "string" && f.prix.trim()) return f.prix;
    var n = getPrixNumerique(f);
    return n != null ? (n + " $") : "—";
  }

  function isPublished(f) {
    if (!f) return false;
    var s = (f.statut || "").toLowerCase();
    return /publi|en.?ligne/.test(s);
  }

  function robustFetch(url, opts) {
    opts = opts || {};
    var timeoutMs = opts.timeout || 8000;
    var attempts = (opts.retries == null) ? 2 : opts.retries;
    function attempt(i) {
      var controller = (typeof AbortController !== "undefined") ? new AbortController() : null;
      var to = setTimeout(function () { if (controller) controller.abort(); }, timeoutMs);
      return fetch(url, { cache: "no-cache", signal: controller && controller.signal })
        .then(function (r) {
          clearTimeout(to);
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r;
        })
        .catch(function (err) {
          clearTimeout(to);
          if (i >= attempts) throw err;
          var wait = 250 * Math.pow(3, i);
          return new Promise(function (res) { setTimeout(res, wait); }).then(function () {
            return attempt(i + 1);
          });
        });
    }
    return attempt(0);
  }

  /* ---------- INIT ---------- */

  function init() {
    var grid = document.getElementById("formation-grid");
    if (!grid) return;

    robustFetch("data/formations.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!Array.isArray(data)) throw new Error("Le JSON formations.json doit être un tableau.");
        ALL_FORMATIONS = data.filter(isPublished);

        ALL_FORMATIONS.sort(function (a, b) {
          var ca = (a.categorie || "").toLowerCase();
          var cb = (b.categorie || "").toLowerCase();
          if (ca !== cb) return ca < cb ? -1 : 1;
          return (a.titre || "").localeCompare(b.titre || "", "fr");
        });

        var params = new URLSearchParams(window.location.search);
        if (params.get("cat")) STATE.categorie = params.get("cat").toLowerCase();
        if (params.get("prix")) STATE.prix = params.get("prix");
        if (params.get("niveau")) STATE.niveau = params.get("niveau").toLowerCase();
        if (params.get("q")) STATE.recherche = params.get("q").toLowerCase();

        if (!WIRED) { wireFilters(); wirePills(); WIRED = true; }
        syncFilterUI();
        render();
      })
      .catch(function (err) {
        console.error("Catalogue: erreur de chargement", err);
        grid.innerHTML =
          '<div class="empty-state"><h3>Catalogue temporairement indisponible</h3>' +
          '<p>Impossible de charger les formations. Vérifie ta connexion ou réessaie dans quelques instants.</p>' +
          '<button type="button" class="btn btn-secondary" id="retry-load" style="margin-top:18px">Réessayer</button>' +
          '</div>';
        var rb = document.getElementById("retry-load");
        if (rb) rb.addEventListener("click", function () {
          grid.innerHTML = '<div class="loading"><div class="loading-spinner"></div><span>Nouvelle tentative…</span></div>';
          init();
        });
      });
  }

  /* ---------- FILTRES ---------- */

  function wireFilters() {
    var search = document.getElementById("filter-search");
    var prix = document.getElementById("filter-prix");
    var niveau = document.getElementById("filter-niveau");

    if (search) {
      var onSearch = debounce(function () { render(); }, 120);
      search.addEventListener("input", function (e) {
        STATE.recherche = e.target.value.trim().toLowerCase();
        onSearch();
      });
    }
    if (prix) {
      prix.addEventListener("change", function (e) {
        STATE.prix = e.target.value;
        render();
      });
    }
    if (niveau) {
      niveau.addEventListener("change", function (e) {
        STATE.niveau = e.target.value.toLowerCase();
        render();
      });
    }
  }

  function syncFilterUI() {
    var search = document.getElementById("filter-search");
    var prix = document.getElementById("filter-prix");
    var niveau = document.getElementById("filter-niveau");
    if (search && STATE.recherche) search.value = STATE.recherche;
    if (prix && STATE.prix) prix.value = STATE.prix;
    if (niveau && STATE.niveau) niveau.value = STATE.niveau;
  }

  function wirePills() {
    var pills = document.querySelectorAll(".pill[data-cat]");
    pills.forEach(function (p) {
      if ((p.dataset.cat || "").toLowerCase() === STATE.categorie) {
        p.classList.add("active");
      } else {
        p.classList.remove("active");
      }
      p.addEventListener("click", function () {
        STATE.categorie = (p.dataset.cat || "tous").toLowerCase();
        pills.forEach(function (x) { x.classList.remove("active"); });
        p.classList.add("active");
        render();
      });
    });
  }

  /* ---------- FILTRAGE ---------- */

  var PREF_MAP = {
    "ia": "ia",
    "pro": "productivit",
    "app": "apprentissage",
    "bus": "business",
    "fin": "finance",
    "rel": "relation",
    "bon": "bonheur",
    "san": "sant",
  };

  function matchesCategorie(f) {
    if (STATE.categorie === "tous") return true;
    var cat = (f.categorie || "").toLowerCase();
    var needle = PREF_MAP[STATE.categorie] || STATE.categorie;
    return cat.indexOf(needle) !== -1;
  }

  function matchesPrix(f) {
    if (STATE.prix === "tous") return true;
    var n = getPrixNumerique(f);
    return String(n) === String(STATE.prix);
  }

  function matchesNiveau(f) {
    if (STATE.niveau === "tous") return true;
    return (f.niveau || "").toLowerCase() === STATE.niveau.toLowerCase();
  }

  function matchesRecherche(f) {
    if (!STATE.recherche) return true;
    var hay = [
      f.titre, f.sous_titre, f.resume_court, f.promesse,
      f.public_cible, f.categorie, f.id,
    ].filter(Boolean).join(" ").toLowerCase();
    return hay.indexOf(STATE.recherche) !== -1;
  }

  function filtered() {
    var key = cacheKey();
    if (FILTER_CACHE.key === key && FILTER_CACHE.list) return FILTER_CACHE.list;
    var list = ALL_FORMATIONS.filter(function (f) {
      return matchesCategorie(f) && matchesPrix(f) && matchesNiveau(f) && matchesRecherche(f);
    });
    FILTER_CACHE.key = key;
    FILTER_CACHE.list = list;
    return list;
  }

  /* ---------- RENDU ---------- */

  function render() {
    saveState();
    var grid = document.getElementById("formation-grid");
    var count = document.getElementById("results-count");
    var list = filtered();

    if (count) {
      count.textContent =
        list.length === 0 ? "Aucun résultat" :
        list.length === 1 ? "1 formation" :
        list.length + " formations";
    }

    if (list.length === 0) {
      grid.innerHTML =
        '<div class="empty-state"><h3>Aucune formation ne correspond</h3>' +
        '<p>Essaie d’élargir tes filtres ou efface la recherche.</p>' +
        '<button type="button" class="btn btn-secondary" id="reset-filters" style="margin-top:18px">Réinitialiser les filtres</button>' +
        '</div>';
      var btn = document.getElementById("reset-filters");
      if (btn) btn.addEventListener("click", resetFilters);
      return;
    }

    grid.innerHTML = list.map(cardHTML).join("");
    injectItemListJsonLd(list);
  }

  function injectItemListJsonLd(list) {
    var origin = (window.location.origin || "https://lepivotdor-sketch.github.io") +
      window.location.pathname.replace(/[^/]*$/, "");
    var data = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Catalogue Clario",
      "itemListElement": list.slice(0, 50).map(function (f, i) {
        return {
          "@type": "ListItem",
          "position": i + 1,
          "url": origin + "formation.html?id=" + encodeURIComponent(f.id || ""),
          "name": f.titre || ""
        };
      })
    };
    var prev = document.querySelectorAll('script[type="application/ld+json"][data-clario-list]');
    prev.forEach(function (n) { n.parentNode.removeChild(n); });
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.setAttribute("data-clario-list", "1");
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  function resetFilters() {
    STATE = { categorie: "tous", prix: "tous", niveau: "tous", recherche: "" };
    saveState();
    var search = document.getElementById("filter-search");
    var prix = document.getElementById("filter-prix");
    var niveau = document.getElementById("filter-niveau");
    if (search) search.value = "";
    if (prix) prix.value = "tous";
    if (niveau) niveau.value = "tous";
    document.querySelectorAll(".pill[data-cat]").forEach(function (p) {
      p.classList.toggle("active", (p.dataset.cat || "").toLowerCase() === "tous");
    });
    render();
  }

  function cardHTML(f) {
    var includes = [];
    if (f.duree) includes.push("Durée : " + f.duree);
    if (f.niveau) includes.push("Niveau " + f.niveau);

    var url = "formation.html?id=" + encodeURIComponent(f.id || "");
    var summary = f.resume_court || f.sous_titre || "";

    return (
      '<article class="formation-card">' +
        '<div class="formation-top">' +
          '<span class="category-tag">' + escapeHTML(f.categorie || "") + '</span>' +
          (f.niveau ? '<span class="level-tag">' + escapeHTML(f.niveau) + '</span>' : '') +
        '</div>' +
        '<h3>' + escapeHTML(f.titre || "Formation") + '</h3>' +
        '<p>' + escapeHTML(summary) + '</p>' +
        '<div class="price">' + escapeHTML(formatPrix(f)) + '</div>' +
        (includes.length ? '<ul class="includes">' +
          includes.map(function (x) { return '<li>' + escapeHTML(x) + '</li>'; }).join("") +
        '</ul>' : '') +
        '<a class="btn btn-card" href="' + escapeHTML(url) + '">Voir la fiche</a>' +
        '<p class="notice">Accès numérique privé. Vente finale dès activation.</p>' +
      '</article>'
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
