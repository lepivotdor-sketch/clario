/* =====================================================================
   CLARIO - formation-loader.js
   Lit l'ID dans l'URL (?id=xxx), charge data/formations.json,
   hydrate la page formation.html avec les bonnes données + contenu détaillé.
   ===================================================================== */

(function () {
  "use strict";

  function escapeHTML(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function nl2list(text) {
    if (!text) return "";
    return text.split(/\n+/).filter(Boolean)
      .map(function (line) { return "<li>" + escapeHTML(line.replace(/^[-•*\d.\s]+/, "")) + "</li>"; })
      .join("");
  }

  function paragraphs(text) {
    if (!text) return "";
    return text.split(/\n\n+/).map(function (p) {
      return "<p>" + escapeHTML(p.trim()).replace(/\n/g, "<br>") + "</p>";
    }).join("");
  }

  function getId() {
    var params = new URLSearchParams(window.location.search);
    return (params.get("id") || "").trim();
  }

  function showError(msg) {
    var root = document.getElementById("formation-root");
    if (!root) return;
    root.innerHTML =
      '<div class="error-box"><h2>Formation introuvable</h2>' +
      '<p>' + escapeHTML(msg) + '</p>' +
      '<p style="margin-top:18px"><a class="btn btn-secondary" href="formations.html">Retour au catalogue</a></p></div>';
  }

  function init() {
    var root = document.getElementById("formation-root");
    if (!root) return;

    var id = getId();
    if (!id) {
      showError("Aucun identifiant fourni dans l'adresse. Utilise un lien depuis le catalogue.");
      return;
    }

    fetch("data/formations.json", { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        var f = (data || []).find(function (x) {
          return (x.id || "").toLowerCase() === id.toLowerCase()
              || (x.code || "").toLowerCase() === id.toLowerCase();
        });

        if (!f) {
          showError("L'identifiant « " + id + " » ne correspond à aucune formation publiée.");
          return;
        }

        document.title = "Clario | " + (f.titre || "Formation");
        var metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && f.resume_court) metaDesc.setAttribute("content", f.resume_court);

        render(root, f);
      })
      .catch(function (err) {
        console.error("Formation loader:", err);
        showError("Impossible de charger les données. Réessaie dans quelques instants.");
      });
  }

  function render(root, f) {
    var includes = [];
    if (f.duree_estimee) includes.push("Durée : " + f.duree_estimee);
    if (f.niveau) includes.push("Niveau : " + f.niveau);
    if (f.resultat_periode) includes.push("Résultat visé sous " + f.resultat_periode);
    if (f.formation_suivante) includes.push("Suite recommandée : " + f.formation_suivante);

    var detail = f.detail || {};

    var html =
      '<nav class="breadcrumb">' +
        '<a href="index.html">Accueil</a><span>›</span>' +
        '<a href="formations.html">Catalogue</a><span>›</span>' +
        '<span>' + escapeHTML(f.categorie || "") + '</span>' +
      '</nav>' +
      '<div class="formation-hero">' +
        '<div>' +
          '<div class="formation-meta">' +
            '<span class="meta-categorie">' + escapeHTML(f.categorie || "") + '</span>' +
            (f.niveau ? '<span class="meta-niveau">Niveau : ' + escapeHTML(f.niveau) + '</span>' : '') +
            (f.duree_estimee ? '<span class="meta-duree">' + escapeHTML(f.duree_estimee) + '</span>' : '') +
          '</div>' +
          '<h1>' + escapeHTML(f.titre || "") + '</h1>' +
          (f.sous_titre ? '<p class="formation-soustitre">' + escapeHTML(f.sous_titre) + '</p>' : '') +
          (f.resume_court ? '<p class="formation-resume">' + escapeHTML(f.resume_court) + '</p>' : '') +
          (f.promesse ? '<div class="formation-promesse">' + escapeHTML(f.promesse) + '</div>' : '') +
        '</div>' +
        '<aside class="formation-buy">' +
          '<span class="price">' + escapeHTML(f.prix_affiche || (f.prix_numerique + " $")) + '</span>' +
          '<span class="price-note">Achat unique. Accès immédiat.</span>' +
          '<ul>' + includes.map(function (x) { return '<li>' + escapeHTML(x) + '</li>'; }).join("") + '</ul>' +
          '<a class="btn btn-primary" href="contact.html?formation=' + encodeURIComponent(f.id) + '">' + escapeHTML(f.bouton_cta || "Acheter cette formation") + '</a>' +
          '<p class="reassurance">Vente finale dès activation. Aucun coaching obligatoire. Aucun rendez-vous requis.</p>' +
        '</aside>' +
      '</div>' +
      buildDetail(f, detail) +
      buildSuivante(f);

    root.innerHTML = html;
  }

  function buildDetail(f, d) {
    var sections = [];

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
      sections.push(section("Checklist d'action", '<ul class="bloc-checklist">' + d.checklist.map(function (i) { return '<li>' + escapeHTML(i) + '</li>'; }).join("") + '</ul>'));
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

    if (sections.length === 0) {
      sections.push(section("Aperçu", '<p>' + escapeHTML(f.resume_court || "Cette formation est en cours de finalisation. Reviens très bientôt.") + '</p>'));
    }

    return '<div class="formation-detail">' + sections.join("") + '</div>';
  }

  function section(titre, html) {
    return '<section class="formation-section"><h2>' + escapeHTML(titre) + '</h2>' + html + '</section>';
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
    return '<div class="formation-suivante">' +
      '<small>Pour aller plus loin</small>' +
      '<h3>' + escapeHTML(f.formation_suivante) + '</h3>' +
      '<p>Une formation plus complète au prix de ' + (f.prix_formation_suivante || "—") + ' $.</p>' +
      '<a class="btn btn-secondary" href="formations.html">Voir le catalogue complet</a>' +
    '</div>';
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector("#formation-detail");

  if (!container) {
    console.error("Erreur : l’élément #formation-detail est introuvable.");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const formationId = params.get("id");

  if (!formationId) {
    afficherErreur(container, "Aucune formation sélectionnée.");
    return;
  }

  try {
    const response = await fetch("data/formations.json");

    if (!response.ok) {
      throw new Error("Impossible de charger data/formations.json");
    }

    const formations = await response.json();
    const formation = formations.find((item) => item.id === formationId);

    if (!formation) {
      afficherErreur(container, "Formation introuvable.");
      return;
    }

    document.title = `${formation.titre} | Clario`;
    afficherFormation(container, formation);
  } catch (error) {
    console.error(error);
    afficherErreur(container, "Une erreur empêche l’affichage de la formation.");
  }
});

function afficherErreur(container, message) {
  container.innerHTML = `
    <section class="formation-erreur">
      <h1>Oups.</h1>
      <p>${echapperHTML(message)}</p>
      <a href="formations.html" class="btn-retour">Retour au catalogue</a>
    </section>
  `;
}

function afficherFormation(container, formation) {
  const detail = formation.detail || {};

  container.innerHTML = `
    <article class="formation-page">
      ${renderHero(formation)}
      ${renderSection("Introduction", detail.introduction)}
      ${renderSection("Résultat visé", detail.resultat_vise)}
      ${renderSection("Démarrage rapide", detail.demarrage_rapide)}
      ${renderAvantApres(detail.avant_apres)}
      ${renderMethode(detail.methode)}
      ${renderSection("Exemple complet", detail.exemple)}
      ${renderOutils(detail.outils || detail.outil)}
      ${renderChecklist(detail.checklist)}
      ${renderSection("Plan d’action", detail.plan_action)}
      ${renderErreurs(detail.erreurs_a_eviter)}
      ${renderListe("Bilan à 30 jours", detail.bilan_30_jours)}
      ${renderListe("Bilan à 60 jours", detail.bilan_60_jours)}
      ${renderListe("Bilan", detail.bilan)}
      ${renderConclusion(detail.conclusion)}
    </article>
  `;
}

function renderHero(formation) {
  return `
    <header class="formation-hero">
      <p class="formation-categorie">${echapperHTML(formation.categorie || "")}</p>
      <h1>${echapperHTML(formation.titre || "Formation Clario")}</h1>
      <p class="formation-sous-titre">${echapperHTML(formation.sous_titre || "")}</p>

      <div class="formation-meta">
        <span>${echapperHTML(formation.niveau || "")}</span>
        <span>${echapperHTML(formation.duree_estimee || "")}</span>
        <span>${echapperHTML(formation.prix_affiche || "")}</span>
      </div>

      <p class="formation-resume">${echapperHTML(formation.resume_court || "")}</p>
    </header>
  `;
}

function renderSection(titre, contenu) {
  if (!contenu) return "";

  return `
    <section class="formation-section">
      <h2>${echapperHTML(titre)}</h2>
      ${paragraphes(contenu)}
    </section>
  `;
}

function renderAvantApres(avantApres) {
  if (!avantApres) return "";

  return `
    <section class="formation-section">
      <h2>Avant / Après</h2>
      <div class="avant-apres-grid">
        <div class="carte">
          <h3>Avant</h3>
          ${paragraphes(avantApres.avant || "")}
        </div>
        <div class="carte">
          <h3>Après</h3>
          ${paragraphes(avantApres.apres || "")}
        </div>
      </div>
    </section>
  `;
}

function renderMethode(methode) {
  if (!Array.isArray(methode) || methode.length === 0) return "";

  return `
    <section class="formation-section">
      <h2>Méthode complète</h2>
      <div class="modules-list">
        ${methode
          .map((module, index) => `
            <article class="module-carte">
              <p class="module-numero">Module ${index + 1}</p>
              <h3>${echapperHTML(module.titre || "")}</h3>
              ${renderMiniBloc("Objectif", module.objectif)}
              ${renderMiniBloc("Explication", module.explication)}
              ${renderMiniBloc("Schéma", module.schema)}
              ${renderMiniBloc("Exemple", module.exemple)}
              ${renderMiniBloc("Action", module.action)}
              ${renderMiniBloc("Résultat attendu", module.resultat)}
              ${renderMiniBloc("Erreur à éviter", module.erreur)}
            </article>
          `)
          .join("")}
      </div>
    </section>
  `;
}

function renderMiniBloc(titre, contenu) {
  if (!contenu) return "";

  const isSchema = titre.toLowerCase().includes("schéma");

  return `
    <div class="mini-bloc ${isSchema ? "schema-bloc" : ""}">
      <strong>${echapperHTML(titre)} :</strong>
      ${isSchema ? `<pre>${echapperHTML(contenu)}</pre>` : paragraphes(contenu)}
    </div>
  `;
}

function renderOutils(outils) {
  if (!outils) return "";

  const listeOutils = Array.isArray(outils) ? outils : [outils];

  if (listeOutils.length === 0) return "";

  return `
    <section class="formation-section">
      <h2>Outils prêts à copier</h2>
      <div class="outils-grid">
        ${listeOutils
          .map((outil, index) => `
            <article class="outil-carte">
              <p class="outil-numero">Outil ${index + 1}</p>
              <h3>${echapperHTML(outil.titre || "")}</h3>
              ${outil.description ? `<p>${echapperHTML(outil.description)}</p>` : ""}
              <pre>${echapperHTML(outil.contenu || "")}</pre>
            </article>
          `)
          .join("")}
      </div>
    </section>
  `;
}

function renderChecklist(checklist) {
  if (!Array.isArray(checklist) || checklist.length === 0) return "";

  return `
    <section class="formation-section">
      <h2>Checklist d’action</h2>
      <ol class="checklist">
        ${checklist.map((item) => `<li>${echapperHTML(item)}</li>`).join("")}
      </ol>
    </section>
  `;
}

function renderErreurs(erreurs) {
  if (!Array.isArray(erreurs) || erreurs.length === 0) return "";

  return `
    <section class="formation-section">
      <h2>Erreurs à éviter</h2>
      <div class="erreurs-list">
        ${erreurs
          .map((item) => `
            <article class="erreur-carte">
              <h3>${echapperHTML(item.erreur || "")}</h3>
              <p><strong>Risque :</strong> ${echapperHTML(item.risque || "")}</p>
              <p><strong>Correction :</strong> ${echapperHTML(item.correction || "")}</p>
            </article>
          `)
          .join("")}
      </div>
    </section>
  `;
}

function renderListe(titre, liste) {
  if (!Array.isArray(liste) || liste.length === 0) return "";

  return `
    <section class="formation-section">
      <h2>${echapperHTML(titre)}</h2>
      <ol>
        ${liste.map((item) => `<li>${echapperHTML(item)}</li>`).join("")}
      </ol>
    </section>
  `;
}

function renderConclusion(conclusion) {
  if (!conclusion) return "";

  return `
    <section class="formation-section conclusion">
      <h2>Conclusion</h2>
      ${paragraphes(conclusion)}
    </section>
  `;
}

function paragraphes(texte) {
  if (!texte) return "";

  return String(texte)
    .split(/\n{2,}/)
    .map((paragraphe) => `<p>${echapperHTML(paragraphe).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function echapperHTML(valeur) {
  return String(valeur)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}