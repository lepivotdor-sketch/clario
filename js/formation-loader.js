/* =====================================================================
   CLARIO - formation-loader.js
   Lit l'ID dans l'URL (?id=xxx), charge data/formations.json,
   hydrate la page formation.html avec les bonnes données + contenu détaillé.

   Compatibilité :
   - Schéma riche (resume_court, sous_titre, detail.{introduction,methode,...})
   - Schéma simple (description, benefices[], contenu[], resultat_attendu)
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

  function paragraphs(text) {
    if (!text) return "";
    return String(text).split(/\n\n+/).map(function (p) {
      return "<p>" + escapeHTML(p.trim()).replace(/\n/g, "<br>") + "</p>";
    }).join("");
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

  /** Format prix : "5 $" si prix_affiche absent et prix_numerique/prix présent. */
  function formatPrix(f) {
    if (f.prix_affiche) return f.prix_affiche;
    var n = (typeof f.prix_numerique === "number") ? f.prix_numerique
          : (typeof f.prix === "number") ? f.prix : null;
    return (n != null) ? (n + " $") : "—";
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

    // Blocklist défensive : IDs explicitement non-disponibles publiquement,
    // quel que soit l'état du JSON.
    var BLOCKLIST = ["bus-bio-pro-claire-20-minutes"];
    if (BLOCKLIST.indexOf(id.toLowerCase()) !== -1) {
      showError("Formation introuvable.");
      return;
    }

    robustFetch("data/formations.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!Array.isArray(data)) throw new Error("Le JSON formations.json doit être un tableau.");
        var f = data.find(function (x) {
          var idLower = id.toLowerCase();
          return (x.id || "").toLowerCase() === idLower
              || (x.code || "").toLowerCase() === idLower
              || (x.slug || "").toLowerCase() === idLower;
        });

        if (!f) {
          showError("L'identifiant « " + id + " » ne correspond à aucune formation publiée.");
          return;
        }

        // Vérifie le statut : si non publié, on protège (sauf override par paramètre)
        var statut = (f.statut || "").toLowerCase();
        if (statut && !/publi|en.?ligne/.test(statut)) {
          showError("Cette formation n'est pas encore disponible. Reviens très bientôt.");
          return;
        }

        // Met à jour titre + meta
        document.title = "Clario | " + (f.titre || "Formation");
        var metaDesc = document.querySelector('meta[name="description"]');
        var summary = f.resume_court || f.description || f.sous_titre || "";
        if (metaDesc && summary) metaDesc.setAttribute("content", summary);

        // Met à jour Open Graph
        setMeta('meta[property="og:title"]', "Clario | " + (f.titre || "Formation"));
        if (summary) setMeta('meta[property="og:description"]', summary);

        // Injecte les données structurées (Schema.org Course + BreadcrumbList)
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
    var fid = f.id || f.code || "";
    var url = origin + "formation.html?id=" + encodeURIComponent(fid);
    var price = (typeof f.prix_numerique === "number") ? f.prix_numerique
              : (typeof f.prix === "number") ? f.prix : null;

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
    if (price != null) {
      course.offers = {
        "@type": "Offer",
        "price": price,
        "priceCurrency": "CAD",
        "availability": "https://schema.org/InStock",
        "url": url
      };
    }
    if (f.categorie) course.about = f.categorie;
    var dureeStr = f.duree_estimee || f.duree;
    if (dureeStr) {
      var m = String(dureeStr).match(/\d+/);
      if (m) course.timeRequired = "PT" + m[0] + "M";
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

    // Supprime tout JSON-LD précédent injecté (en cas de SPA)
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

  /* ---------- RENDU PRINCIPAL ---------- */

  function render(root, f) {
    var includes = [];
    if (f.duree_estimee || f.duree) includes.push("Durée : " + (f.duree_estimee || f.duree));
    if (f.niveau) includes.push("Niveau : " + f.niveau);
    if (f.resultat_periode) includes.push("Résultat visé sous " + f.resultat_periode);
    if (f.formation_suivante) includes.push("Suite recommandée : " + f.formation_suivante);

    var detail = f.detail || {};

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
            ((f.duree_estimee || f.duree) ? '<span class="meta-duree">' + escapeHTML(f.duree_estimee || f.duree) + '</span>' : '') +
          '</div>' +
          '<h1>' + escapeHTML(f.titre || "Formation") + '</h1>' +
          (f.sous_titre ? '<p class="formation-soustitre">' + escapeHTML(f.sous_titre) + '</p>' : '') +
          (f.resume_court || f.description ? '<p class="formation-resume">' + escapeHTML(f.resume_court || f.description) + '</p>' : '') +
          (f.promesse ? '<div class="formation-promesse">' + escapeHTML(f.promesse) + '</div>' : '') +
        '</div>' +
        '<aside class="formation-buy" aria-label="Bloc d’achat">' +
          '<span class="price">' + escapeHTML(formatPrix(f)) + '</span>' +
          '<span class="price-note">Achat unique. Accès immédiat.</span>' +
          (includes.length ? '<ul>' + includes.map(function (x) { return '<li>' + escapeHTML(x) + '</li>'; }).join("") + '</ul>' : '') +
          '<a class="btn btn-primary" href="contact.html?formation=' + encodeURIComponent(f.id || f.code || "") + '">' + escapeHTML(f.bouton_cta || "Acheter cette formation") + '</a>' +
          '<p class="reassurance">Vente finale dès activation. Aucun coaching obligatoire. Aucun rendez-vous requis.</p>' +
        '</aside>' +
      '</div>' +
      buildDetail(f, detail) +
      buildSuivante(f);

    root.innerHTML = html;
  }

  /* ---------- DÉTAIL : SCHÉMA RICHE OU SIMPLE ---------- */

  function buildDetail(f, d) {
    var sections = [];

    /* Schéma riche : detail.{introduction, resultat_vise, ...} */

    if (d.introduction) {
      sections.push(section("Introduction", paragraphs(d.introduction)));
    }
    if (d.resultat_vise) {
      sections.push(section("Résultat visé", paragraphs(d.resultat_vise)));
    }
    if (d.demarrage_rapide) {
      sections.push(section("Démarrage rapide (5 minutes)", paragraphs(d.demarrage_rapide)));
    }
    if (d.avant_apres && (d.avant_apres.avant || d.avant_apres.apres)) {
      sections.push(section("Avant / Après", avantApresHTML(d.avant_apres)));
    }
    if (d.methode && d.methode.length) {
      sections.push(section("Méthode pédagogique", methodeHTML(d.methode)));
    }
    if (d.exemple) {
      sections.push(section("Exemple complet", paragraphs(d.exemple)));
    }
    if (d.outil) {
      sections.push(section("Outil prêt à copier", outilHTML(d.outil)));
    }
    if (d.checklist && d.checklist.length) {
      sections.push(section("Checklist d'action", listHTML(d.checklist, "bloc-checklist")));
    }
    if (d.plan_action) {
      sections.push(section("Plan d'action 24-72 h", paragraphs(d.plan_action)));
    }
    if (d.erreurs_a_eviter && d.erreurs_a_eviter.length) {
      sections.push(section("Erreurs à éviter", erreursHTML(d.erreurs_a_eviter)));
    }
    if (d.bilan && d.bilan.length) {
      sections.push(section("Bilan", '<ol>' + d.bilan.map(function (q) { return '<li>' + escapeHTML(q) + '</li>'; }).join("") + '</ol>'));
    }
    if (d.conclusion) {
      sections.push(section("Conclusion", paragraphs(d.conclusion)));
    }

    /* Schéma simple : f.benefices, f.contenu, f.resultat_attendu */

    if (sections.length === 0) {
      if (f.description) sections.push(section("Description", paragraphs(f.description)));
      if (f.benefices && f.benefices.length) {
        sections.push(section("Bénéfices", listHTML(f.benefices)));
      }
      if (f.contenu && f.contenu.length) {
        sections.push(section("Contenu inclus", listHTML(f.contenu)));
      }
      if (f.resultat_attendu) {
        sections.push(section("Résultat attendu", paragraphs(f.resultat_attendu)));
      }
    }

    if (sections.length === 0) {
      sections.push(section("Aperçu", '<p>' + escapeHTML(f.resume_court || f.description || "Cette formation est en cours de finalisation. Reviens très bientôt.") + '</p>'));
    }

    return '<div class="formation-detail">' + sections.join("") + '</div>';
  }

  /* ---------- HELPERS DE RENDU ---------- */

  function section(titre, html) {
    return '<section class="formation-section"><h2>' + escapeHTML(titre) + '</h2>' + html + '</section>';
  }

  function listHTML(arr, extraClass) {
    var cls = extraClass ? ' class="' + extraClass + '"' : "";
    return '<ul' + cls + '>' + arr.map(function (i) {
      return '<li>' + escapeHTML(i) + '</li>';
    }).join("") + '</ul>';
  }

  function avantApresHTML(ap) {
    return '<div class="bloc-avant-apres">' +
      '<div class="bloc-avant"><h4>Avant</h4><p>' + escapeHTML(ap.avant || "") + '</p></div>' +
      '<div class="bloc-apres"><h4>Après</h4><p>' + escapeHTML(ap.apres || "") + '</p></div>' +
    '</div>';
  }

  function methodeHTML(modules) {
    return modules.map(function (m, i) {
      return '<h3>' + (i + 1) + '. ' + escapeHTML(m.titre || "Module " + (i + 1)) + '</h3>' +
        (m.objectif ? '<p><strong>Objectif :</strong> ' + escapeHTML(m.objectif) + '</p>' : '') +
        (m.explication ? '<p>' + escapeHTML(m.explication).replace(/\n/g, "<br>") + '</p>' : '') +
        (m.action ? '<p><strong>Action :</strong> ' + escapeHTML(m.action) + '</p>' : '') +
        (m.resultat ? '<p><strong>Résultat attendu :</strong> ' + escapeHTML(m.resultat) + '</p>' : '');
    }).join("");
  }

  function outilHTML(o) {
    var html = "";
    if (o.titre) html += '<h3>' + escapeHTML(o.titre) + '</h3>';
    if (o.description) html += '<p>' + escapeHTML(o.description) + '</p>';
    if (o.contenu) html += '<div class="bloc-prompt">' + escapeHTML(o.contenu) + '</div>';
    return html;
  }

  function erreursHTML(arr) {
    return arr.map(function (e) {
      return '<h3>• ' + escapeHTML(e.erreur || "") + '</h3>' +
        (e.risque ? '<p><strong>Risque :</strong> ' + escapeHTML(e.risque) + '</p>' : '') +
        (e.correction ? '<p><strong>Correction :</strong> ' + escapeHTML(e.correction) + '</p>' : '');
    }).join("");
  }

  function buildSuivante(f) {
    if (!f.formation_suivante) return "";
    var prixSuivante = (f.prix_formation_suivante != null)
      ? (f.prix_formation_suivante + " $")
      : "tarif communiqué dans la fiche";
    return '<div class="formation-suivante">' +
      '<small>Pour aller plus loin</small>' +
      '<h3>' + escapeHTML(f.formation_suivante) + '</h3>' +
      '<p>Une formation plus complète au prix de ' + escapeHTML(prixSuivante) + '.</p>' +
      '<a class="btn btn-secondary" href="formations.html">Voir le catalogue complet</a>' +
    '</div>';
  }

  /* ---------- DÉMARRAGE ---------- */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
