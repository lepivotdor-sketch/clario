/* =====================================================================
   CLARIO - main.js
   Point d'entrée global. Détecte la page et active les modules.
   ===================================================================== */

(function () {
  "use strict";

  // Marque le lien actif dans la nav
  function markActiveNavLink() {
    var path = window.location.pathname.split("/").pop() || "index.html";
    var links = document.querySelectorAll(".nav-links a");
    links.forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href) return;
      var fileName = href.split("/").pop();
      if (fileName === path || (path === "" && fileName === "index.html")) {
        a.classList.add("active");
      }
    });
  }

  // Année automatique dans le footer
  function setFooterYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  // Attendre le DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    markActiveNavLink();
    setFooterYear();
  }
})();
function ouvrirDashboard() {
  const motDePasse = document.getElementById("dashboardPassword").value;
  const erreur = document.getElementById("dashboardError");
  const lock = document.getElementById("dashboardLock");
  const content = document.getElementById("dashboardContent");

  const motDePasseDashboard = "clario2026";

  if (motDePasse === motDePasseDashboard) {
    lock.hidden = true;
    content.hidden = false;
    erreur.textContent = "";
  } else {
    erreur.textContent = "Mot de passe incorrect.";
  }
}

function fermerDashboard() {
  const lock = document.getElementById("dashboardLock");
  const content = document.getElementById("dashboardContent");
  const input = document.getElementById("dashboardPassword");

  content.hidden = true;
  lock.hidden = false;
  input.value = "";
}