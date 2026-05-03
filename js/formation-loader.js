/* =====================================================================
   CLARIO - formation-loader.js
   Lit l'ID dans l'URL (?id=xxx), charge data/formations.json,
   et rend UNIQUEMENT une fiche de vente publique.

   Le contenu pédagogique complet (méthode, outil, checklist, exemple,
   plan d'action…) n'est jamais affiché ici. Il est livré après l'achat,
   hors du dépôt public.
   ===================================================================== */

(function () {
  "use strict";

  /* ---------- HELPERS ---------- */

  function escapeHTML(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getId() {
    var params = new URLSearchParams(window.location.search);
    return (params.get("id") || "").trim();
  }

  function showError(msg, allowRetry) {
    var root = document.getElementById("formation-root");
    if (!root) return;
    var retryBtn = allowRetry
      ? '<button type="button" class="btn btn-secondary" id="retry-formation" style="margin-right:10px">Réessayer</button>'
      : "";
    root.innerHTML =
      '<div class="error-box"><h2>Formation introuvable</h2>' +
      '<p>' + escapeHTML(msg) + '</p>' +
      '<p style="margin-top:18px">' + retryBtn +
      '<a class="btn btn-secondary" href="formations.html">Retour au catalogue</a></p></div>';
    var rb = document.getElementById("retry-formation");
    if (rb) rb.addEventListener("click", function () {
      var r = document.getElementById("formation-root");
      if (r) r.innerHTML = '<div class="loading"><div class="loading-spinner"></div><span>Nouvelle tentative…</span></div>';
      init();
    });
  }

  /** fetch avec timeout (8s) + 2 retries exponentiels. */
  function robustFetch(url) {
    var timeoutMs = 8000, attempts = 2;
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
          return new Promise(function (res) { setTimeout(res, wait); }).then(function () { return attempt(i + 1); });
        });
    }
    return attempt(0);
  }

  function formatPrix(f) {
    return f.prix || "—";
  }

  /* ---------- INIT ---------- */

  function init() {
    var root = document.getElementById("formation-root");
    if (!root) return;

    var id = getId();
    if (!id) {
      showError("Aucun identifiant fourni dans l'adresse. Utilise un lien depuis le catalogue.");
      return;
    }

    robustFetch("data/formations.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!Array.isArray(data)) throw new Error("Le JSON formations.json doit être un tableau.");
        var f = data.find(function (x) {
          return (x.id || "").toLowerCase() === id.toLowerCase();
        });

        if (!f) {
          showError("L'identifiant « " + id + " » ne correspond à aucune formation publiée.");
          return;
        }

        var statut = (f.statut || "").toLowerCase();
        if (statut && !/publi|en.?ligne/.test(statut)) {
          showError("Cette formation n'est pas encore disponible. Reviens très bientôt.");
          return;
        }

        document.title = "Clario | " + (f.titre || "Formation");
        var metaDesc = document.querySelector('meta[name="description"]');
        var summary = f.resume_court || f.sous_titre || "";
        if (metaDesc && summary) metaDesc.setAttribute("content", summary);

        setMeta('meta[property="og:title"]', "Clario | " + (f.titre || "Formation"));
        if (summary) setMeta('meta[property="og:description"]', summary);

        injectStructuredData(f, summary);
        render(root, f);
      })
      .catch(function (err) {
        console.error("Formation loader:", err);
        showError("Impossible de charger les données. Vérifie ta connexion ou réessaie.", true);
      });
  }

  function setMeta(selector, value) {
    var el = document.querySelector(selector);
    if (el && value) el.setAttribute("content", value);
  }

  function injectStructuredData(f, summary) {
    var origin = (window.location.origin || "https://lepivotdor-sketch.github.io") +
      window.location.pathname.replace(/[^/]*$/, "");
    var url = origin + "formation.html?id=" + encodeURIComponent(f.id || "");

    var course = {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": f.titre || "Formation",
      "description": summary || "",
      "url": url,
      "inLanguage": "fr-CA",
      "provider": {
        "@type": "Organization",
        "name": "Clario",
        "url": origin
      }
    };
    if (f.prix) {
      var m = String(f.prix).match(/\d+(?:[.,]\d+)?/);
      if (m) {
        course.offers = {
          "@type": "Offer",
          "price": m[0].replace(",", "."),
          "priceCurrency": "CAD",
          "availability": "https://schema.org/InStock",
          "url": url
        };
      }
    }
    if (f.categorie) course.about = f.categorie;
    if (f.duree) {
      var md = String(f.duree).match(/\d+/);
      if (md) course.timeRequired = "PT" + md[0] + "M";
    }

    var breadcrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Accueil", "item": origin },
        { "@type": "ListItem", "position": 2, "name": "Catalogue", "item": origin + "formations.html" },
        { "@type": "ListItem", "position": 3, "name": f.titre || "Formation", "item": url }
      ]
    };

    var prev = document.querySelectorAll('script[type="application/ld+json"][data-clario]');
    prev.forEach(function (n) { n.parentNode.removeChild(n); });

    [course, breadcrumbs].forEach(function (obj) {
      var s = document.createElement("script");
      s.type = "application/ld+json";
      s.setAttribute("data-clario", "1");
      s.textContent = JSON.stringify(obj);
      document.head.appendChild(s);
    });
  }

  /* ---------- RENDU PUBLIC : FICHE DE VENTE UNIQUEMENT ---------- */

  function render(root, f) {
    var includes = [];
    if (f.duree) includes.push("Durée : " + f.duree);
    if (f.niveau) includes.push("Niveau : " + f.niveau);

    var ctaHref = f.lien_achat || ("contact.html?formation=" + encodeURIComponent(f.id || ""));
    var ctaLabel = f.lien_achat ? "Acheter cette formation" : "Demander la formation";

    var inclusBloc = "";
    if (Array.isArray(f.inclus_public) && f.inclus_public.length) {
      inclusBloc =
        '<section class="formation-section">' +
          '<h2>Ce que tu reçois</h2>' +
          '<ul class="bloc-checklist">' +
            f.inclus_public.map(function (i) {
              return '<li>' + escapeHTML(i) + '</li>';
            }).join("") +
          '</ul>' +
        '</section>';
    }

    var html =
      '<nav class="breadcrumb" aria-label="Fil d’Ariane">' +
        '<a href="index.html">Accueil</a><span aria-hidden="true">›</span>' +
        '<a href="formations.html">Catalogue</a><span aria-hidden="true">›</span>' +
        '<span>' + escapeHTML(f.categorie || "") + '</span>' +
      '</nav>' +

      '<div class="formation-hero">' +
        '<div>' +
          '<div class="formation-meta">' +
            (f.categorie ? '<span class="meta-categorie">' + escapeHTML(f.categorie) + '</span>' : '') +
            (f.niveau ? '<span class="meta-niveau">Niveau : ' + escapeHTML(f.niveau) + '</span>' : '') +
            (f.duree ? '<span class="meta-duree">' + escapeHTML(f.duree) + '</span>' : '') +
          '</div>' +
          '<h1>' + escapeHTML(f.titre || "Formation") + '</h1>' +
          (f.sous_titre ? '<p class="formation-soustitre">' + escapeHTML(f.sous_titre) + '</p>' : '') +
          (f.resume_court ? '<p class="formation-resume">' + escapeHTML(f.resume_court) + '</p>' : '') +
          (f.promesse ? '<div class="formation-promesse">' + escapeHTML(f.promesse) + '</div>' : '') +
        '</div>' +
        '<aside class="formation-buy" aria-label="Bloc d’achat">' +
          '<span class="price">' + escapeHTML(formatPrix(f)) + '</span>' +
          '<span class="price-note">Achat unique. Accès immédiat.</span>' +
          (includes.length ? '<ul>' + includes.map(function (x) { return '<li>' + escapeHTML(x) + '</li>'; }).join("") + '</ul>' : '') +
          '<a class="btn btn-primary" href="' + escapeHTML(ctaHref) + '">' + escapeHTML(ctaLabel) + '</a>' +
          '<p class="reassurance">Vente finale dès activation. Aucun coaching obligatoire. Aucun rendez-vous requis.</p>' +
        '</aside>' +
      '</div>' +

      '<div class="formation-detail">' +

        (f.public_cible ?
          '<section class="formation-section">' +
            '<h2>Pour qui</h2>' +
            '<p>' + escapeHTML(f.public_cible) + '</p>' +
          '</section>' : '') +

        (f.resultat_vise_court ?
          '<section class="formation-section">' +
            '<h2>Résultat visé</h2>' +
            '<p>' + escapeHTML(f.resultat_vise_court) + '</p>' +
          '</section>' : '') +

        inclusBloc +

        '<section class="formation-section">' +
          '<h2>Contenu de la formation</h2>' +
          '<p>Le contenu complet est remis après l\'achat.</p>' +
        '</section>' +

      '</div>';

    root.innerHTML = html;
  }

  /* ---------- DÉMARRAGE ---------- */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
