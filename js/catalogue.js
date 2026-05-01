/* =====================================================================
   CLARIO - catalogue.js
   Charge data/formations.json, rend la grille, gère filtres et recherche.
   ===================================================================== */

(function () {
  "use strict";

  var ALL_FORMATIONS = [];
  var STATE = {
    categorie: "tous",
    prix: "tous",
    niveau: "tous",
    recherche: "",
  };

  function init() {
    var grid = document.getElementById("formation-grid");
    if (!grid) return; // page sans catalogue

    fetch("data/formations.json", { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        ALL_FORMATIONS = (data || []).filter(function (f) {
          return f && f.statut && /publi/i.test(f.statut);
        });

        // Lecture des paramètres URL (?cat=ia&prix=5)
        var params = new URLSearchParams(window.location.search);
        if (params.get("cat")) STATE.categorie = params.get("cat").toLowerCase();
        if (params.get("prix")) STATE.prix = params.get("prix");

        wireFilters();
        wirePills();
        render();
      })
      .catch(function (err) {
        console.error("Catalogue: erreur de chargement", err);
        grid.innerHTML =
          '<div class="empty-state"><h3>Catalogue temporairement indisponible</h3>' +
          '<p>Impossible de charger les formations. Réessaie dans quelques instants.</p></div>';
      });
  }

  function wireFilters() {
    var search = document.getElementById("filter-search");
    var prix = document.getElementById("filter-prix");
    var niveau = document.getElementById("filter-niveau");

    if (search) {
      search.addEventListener("input", function (e) {
        STATE.recherche = e.target.value.trim().toLowerCase();
        render();
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
        STATE.niveau = e.target.value;
        render();
      });
    }
  }

  function wirePills() {
    var pills = document.querySelectorAll(".pill[data-cat]");
    pills.forEach(function (p) {
      if (p.dataset.cat.toLowerCase() === STATE.categorie) {
        p.classList.add("active");
      }
      p.addEventListener("click", function () {
        STATE.categorie = p.dataset.cat.toLowerCase();
        pills.forEach(function (x) { x.classList.remove("active"); });
        p.classList.add("active");
        render();
      });
    });
  }

  function filtered() {
    return ALL_FORMATIONS.filter(function (f) {
      // Catégorie (slug officiel : IA, Productivité, etc.)
      if (STATE.categorie !== "tous") {
        var cat = (f.categorie || "").toLowerCase();
        // Map prefixe -> categorie
        var prefMap = {
          "ia": "ia",
          "pro": "productivit",
          "app": "apprentissage",
          "bus": "business",
          "fin": "finance",
          "rel": "relation",
          "bon": "bonheur",
          "san": "sant",
        };
        var needle = prefMap[STATE.categorie] || STATE.categorie;
        if (cat.indexOf(needle) === -1) return false;
      }
      // Prix
      if (STATE.prix !== "tous") {
        if (String(f.prix_numerique) !== String(STATE.prix)) return false;
      }
      // Niveau
      if (STATE.niveau !== "tous") {
        var n = (f.niveau || "").toLowerCase();
        if (n !== STATE.niveau.toLowerCase()) return false;
      }
      // Recherche texte
      if (STATE.recherche) {
        var hay = [
          f.titre, f.sous_titre, f.resume_court, f.public_cible,
          (f.tags || []).join(" "),
        ].join(" ").toLowerCase();
        if (hay.indexOf(STATE.recherche) === -1) return false;
      }
      return true;
    });
  }

  function render() {
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
        '<p>Essaie d’élargir tes filtres ou efface la recherche.</p></div>';
      return;
    }

    grid.innerHTML = list.map(cardHTML).join("");
  }

  function escapeHTML(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cardHTML(f) {
    var includes = [];
    if (f.duree_estimee) includes.push("Durée : " + f.duree_estimee);
    if (f.resultat_periode) includes.push("Résultat sous " + f.resultat_periode);
    if (f.niveau) includes.push("Niveau " + f.niveau);

    return (
      '<article class="formation-card">' +
        '<div class="formation-top">' +
          '<span class="category-tag">' + escapeHTML(f.categorie || "") + '</span>' +
          '<span class="level-tag">' + escapeHTML(f.niveau || "") + '</span>' +
        '</div>' +
        '<h3>' + escapeHTML(f.titre || "") + '</h3>' +
        '<p>' + escapeHTML(f.resume_court || f.sous_titre || "") + '</p>' +
        '<div class="price">' + escapeHTML(f.prix_affiche || (f.prix_numerique + " $")) + '</div>' +
        '<ul class="includes">' +
          includes.map(function (x) { return '<li>' + escapeHTML(x) + '</li>'; }).join("") +
        '</ul>' +
        '<a class="btn btn-card" href="' + escapeHTML(f.url || "formation.html?id=" + f.id) + '">Voir la fiche</a>' +
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

