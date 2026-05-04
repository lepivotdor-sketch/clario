/* =====================================================================
   CLARIO - formation-loader.js  (PUBLIC-SAFE — STRICT MODE)
   Rend la fiche formation à partir de data/formations.json.
   GARDE-FOU : whitelist stricte. Tout champ non listé dans
   PUBLIC_WHITELIST est SUPPRIMÉ avant le rendu, même s'il existe
   dans le JSON. Aucun contenu premium ne peut être affiché par accident.
   Le bloc "Contenu verrouillé" remplace le contenu détaillé.
   ===================================================================== */

(function () {
  "use strict";

  /* ---------- WHITELIST STRICTE — PUBLIC ONLY ---------- */
  // Seuls ces champs sont autorisés à être lus depuis le JSON.
  // Tout autre champ (methode_complete, detail, modules, exemple,
  // checklist_complete, plan_action, conclusion, etc.) est ignoré.
  var PUBLIC_WHITELIST = [
    "id","code","titre","slug","url",
    "lien_achat","stripe_link","stripe_payment_link","success_url",
    "categorie","prix_affiche","prix_numerique","prix",
    "type","niveau","duree_estimee","duree","statut",
    "version","date_creation","derniere_mise_a_jour","prochaine_mise_a_jour",
    "promesse","resume_court","description_courte","sous_titre","preview","description",
    "benefices","livrables","inclus","apercu_public",
    "resultat_attendu","resultat_periode",
    "tags","bouton_cta","contenu_verrouille","avis_legal",
    "priorite_catalogue","public_cible"
  ];
  // Limites de longueur défensive : si un champ public est anormalement
  // long, on tronque pour éviter qu'une fuite involontaire ne s'affiche.
  var MAX_LEN = {
    titre: 140, sous_titre: 200, promesse: 280, resume_court: 320,
    preview: 600, description: 600, resultat_attendu: 280,
    resultat_periode: 80, prix_affiche: 40, niveau: 40,
    duree_estimee: 60, duree: 60, categorie: 60, bouton_cta: 60,
    avis_legal: 320
  };
  // Limite max d'items dans les listes publiques.
  var MAX_LIST = 12;
  // Limite max par item de liste.
  var MAX_LIST_ITEM = 200;

  /**
   * Sanitize : retourne un nouvel objet ne contenant QUE les champs
   * whitelistés, tronqués si trop longs. Aucun champ premium ne survit.
   */
  // Listes autorisées (un array ne peut survivre que pour ces clés)
  var ALLOWED_LISTS = ["benefices","livrables","inclus","apercu_public","tags"];
  function sanitize(raw) {
    if (!raw || typeof raw !== "object") return null;
    var clean = {};
    PUBLIC_WHITELIST.forEach(function (k) {
      if (!(k in raw)) return;
      var v = raw[k];
      if (v == null) return;
      if (Array.isArray(v)) {
        if (ALLOWED_LISTS.indexOf(k) === -1) return;
        clean[k] = v.slice(0, MAX_LIST).map(function (item) {
          return String(item).slice(0, MAX_LIST_ITEM);
        });
      } else if (typeof v === "string") {
        var max = MAX_LEN[k] || 600;
        clean[k] = v.slice(0, max);
      } else if (typeof v === "number" || typeof v === "boolean") {
        clean[k] = v;
      }
      // Tout autre type (object imbriqué) est ignoré : aucun "detail",
      // "methode", "modules", "outil" ne peut passer.
    });
    return clean;
  }

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

  function formatPrix(f) {
    if (f.prix_affiche) return f.prix_affiche;
    var n = (typeof f.prix_numerique === "number") ? f.prix_numerique
          : (typeof f.prix === "number") ? f.prix : null;
    return (n != null) ? (n + " $") : "—";
  }

  /**
   * Construit le HTML du bouton d'achat à partir du champ stripe_payment_link.
   * - Si stripe_payment_link non vide : bouton actif qui ouvre Stripe (nouvel onglet).
   * - Si vide : bouton désactivé "Paiement bientôt disponible" + lien contact.
   * Aucune clé Stripe secrète n'est utilisée côté client.
   */
  function buildBuyButton(f, fallbackLabel) {
    var label = escapeHTML(f.bouton_cta || fallbackLabel || "Acheter cette formation");
    var fid = encodeURIComponent(f.id || f.code || "");
    // Priorité : lien_achat > stripe_link > stripe_payment_link (rétrocompat).
    var raw = String(f.lien_achat || f.stripe_link || f.stripe_payment_link || "").trim();
    // Sécurité : on n'accepte qu'un lien Stripe public valide.
    // Tout placeholder du type "#stripe-link-a-ajouter" est rejeté.
    var isValidStripe = /^https:\/\/(buy\.stripe\.com|checkout\.stripe\.com)\//i.test(raw);

    if (isValidStripe) {
      return '<a class="btn btn-primary buy-btn" href="' + escapeHTML(raw) +
        '" target="_blank" rel="noopener noreferrer" data-formation="' + fid + '">' +
        label +
      '</a>';
    }

    // État "bientôt disponible" : bouton désactivé + lien de contact discret.
    return '<button type="button" class="btn btn-primary buy-btn buy-btn-disabled" disabled aria-disabled="true">' +
      'Achat bientôt disponible' +
    '</button>' +
    '<p class="buy-soon-note"><a href="contact.html?formation=' + fid + '">Une question avant l\'achat&nbsp;? Écris-nous.</a></p>';
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
        var rawMatch = data.find(function (x) {
          var idLower = id.toLowerCase();
          return (x.id || "").toLowerCase() === idLower
              || (x.code || "").toLowerCase() === idLower
              || (x.slug || "").toLowerCase() === idLower;
        });

        if (!rawMatch) {
          showError("L'identifiant « " + id + " » ne correspond à aucune formation publiée.");
          return;
        }

        // GARDE-FOU CRITIQUE : on ne rend QUE le résultat du sanitize.
        // Tout champ premium éventuellement présent dans le JSON est
        // supprimé ici et ne sera jamais affiché.
        var f = sanitize(rawMatch);
        if (!f) {
          showError("Données de formation invalides.");
          return;
        }

        var statut = (f.statut || "").toLowerCase();
        if (statut && !/publi|en.?ligne/.test(statut)) {
          showError("Cette formation n'est pas encore disponible. Reviens très bientôt.");
          return;
        }

        document.title = "Clario | " + (f.titre || "Formation");
        var metaDesc = document.querySelector('meta[name="description"]');
        var summary = f.resume_court || f.preview || f.sous_titre || "";
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
      "provider": { "@type": "Organization", "name": "Clario", "url": origin }
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

  /* ---------- RENDU PRINCIPAL (PUBLIC ONLY) ---------- */

  function render(root, f) {
    var includes = [];
    if (f.duree_estimee || f.duree) includes.push("Durée : " + (f.duree_estimee || f.duree));
    if (f.niveau) includes.push("Niveau : " + f.niveau);
    if (f.resultat_periode) includes.push("Résultat visé sous " + f.resultat_periode);

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
          (f.resume_court ? '<p class="formation-resume">' + escapeHTML(f.resume_court) + '</p>' : '') +
          (f.promesse ? '<div class="formation-promesse">' + escapeHTML(f.promesse) + '</div>' : '') +
        '</div>' +
        '<aside class="formation-buy" aria-label="Bloc d’achat">' +
          '<span class="price">' + escapeHTML(formatPrix(f)) + '</span>' +
          '<span class="price-note">Achat unique. Accès immédiat après paiement.</span>' +
          (includes.length ? '<ul>' + includes.map(function (x) { return '<li>' + escapeHTML(x) + '</li>'; }).join("") + '</ul>' : '') +
          buildBuyButton(f) +
          '<p class="reassurance">Achat unique. Accès immédiat après paiement.</p>' +
        '</aside>' +
      '</div>' +
      buildPublicSections(f) +
      buildLockedNotice(f) +
      buildLegalNotice(f);

    root.innerHTML = html;
  }

  /* ---------- SECTIONS PUBLIQUES UNIQUEMENT ---------- */

  function buildPublicSections(f) {
    var sections = [];

    if (f.preview) {
      sections.push(section("Aperçu", paragraphs(f.preview)));
    }
    if (f.benefices && f.benefices.length) {
      sections.push(section("Ce que tu vas en retirer", listHTML(f.benefices)));
    }
    if (f.livrables && f.livrables.length) {
      sections.push(section("Ce que tu reçois après l'achat", listHTML(f.livrables, "bloc-checklist")));
    }
    if (f.resultat_attendu) {
      sections.push(section("Résultat attendu", paragraphs(f.resultat_attendu)));
    }

    if (sections.length === 0) {
      sections.push(section("Aperçu", '<p>' + escapeHTML(f.resume_court || f.sous_titre || "Cette formation est en cours de finalisation. Reviens très bientôt.") + '</p>'));
    }

    return '<div class="formation-detail">' + sections.join("") + '</div>';
  }

  /* ---------- BLOC "CONTENU VERROUILLÉ" ---------- */

  function buildLockedNotice(f) {
    return '<section class="formation-locked" aria-label="Contenu verrouillé">' +
      '<div class="locked-icon" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="4" y="11" width="16" height="10" rx="2" ry="2"/>' +
          '<path d="M8 11V7a4 4 0 0 1 8 0v4"/>' +
        '</svg>' +
      '</div>' +
      '<h2>Contenu complet verrouillé</h2>' +
      '<p>La méthode détaillée, les outils prêts à copier, la checklist d\'action et le plan complet sont accessibles uniquement après l\'achat.</p>' +
      '<p class="locked-included">Tu reçois après paiement&nbsp;: la méthode complète, les outils, la checklist, le plan d\'action 24-72h, la liste des erreurs à éviter.</p>' +
      buildBuyButton(f) +
      '<p class="locked-note">Achat unique. Accès numérique privé. Aucun abonnement.</p>' +
    '</section>';
  }

  /* ---------- AVIS LÉGAL (catégories sensibles) ---------- */

  function buildLegalNotice(f) {
    if (!f.avis_legal) return "";
    return '<aside class="formation-avis" role="note">' +
      '<strong>Avis</strong> ' + escapeHTML(f.avis_legal) +
    '</aside>';
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

  /* ---------- DÉMARRAGE ---------- */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
