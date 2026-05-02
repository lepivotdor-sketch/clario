/* =====================================================================
   CLARIO - main.js
   Point d'entrée global. Détecte la page et active les modules.
   ===================================================================== */

(function () {
  "use strict";

  // Marque le lien actif dans la nav (a11y : aria-current)
  function markActiveNavLink() {
    var path = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (path === "") path = "index.html";
    var links = document.querySelectorAll(".nav-links a");
    links.forEach(function (a) {
      var href = (a.getAttribute("href") || "").toLowerCase();
      if (!href) return;
      var fileName = href.split("/").pop().split("?")[0];
      if (fileName === path || (path === "index.html" && fileName === "")) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
      } else {
        a.removeAttribute("aria-current");
      }
    });
  }

  // Année automatique dans le footer
  function setFooterYear() {
    var els = document.querySelectorAll("[data-year]");
    var y = String(new Date().getFullYear());
    els.forEach(function (el) { el.textContent = y; });
  }

  // Ajoute un lien d'évitement (skip-to-content) au tout début du body
  function injectSkipLink() {
    if (document.querySelector(".skip-link")) return;
    var main = document.querySelector("main");
    if (!main) return;
    if (!main.id) main.id = "contenu-principal";
    var a = document.createElement("a");
    a.href = "#" + main.id;
    a.className = "skip-link";
    a.textContent = "Aller au contenu";
    document.body.insertBefore(a, document.body.firstChild);
  }

  // Bouton retour haut (apparaît après 600 px de scroll)
  function injectBackToTop() {
    if (document.querySelector(".back-to-top")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "back-to-top";
    btn.setAttribute("aria-label", "Revenir en haut de page");
    btn.innerHTML = "<svg viewBox='0 0 24 24' aria-hidden='true' width='18' height='18' fill='none' stroke='currentColor' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'><polyline points='18 15 12 9 6 15'/></svg>";
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    document.body.appendChild(btn);

    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        btn.classList.toggle("visible", window.scrollY > 600);
        ticking = false;
      });
    }, { passive: true });
  }

  // Raccourci clavier "/" (ou "s") : focus la barre de recherche du catalogue
  function bindSearchShortcut() {
    document.addEventListener("keydown", function (e) {
      if (e.defaultPrevented) return;
      var tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key !== "/" && e.key.toLowerCase() !== "s") return;
      var input = document.getElementById("filter-search");
      if (!input) return;
      e.preventDefault();
      input.focus();
      input.select && input.select();
    });
  }

  // Enregistre le Service Worker (cache + offline)
  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol !== "https:" && location.hostname !== "localhost") return;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-worker.js").catch(function (err) {
        console.warn("SW registration failed:", err);
      });
    });
  }

  function init() {
    injectSkipLink();
    markActiveNavLink();
    setFooterYear();
    injectBackToTop();
    bindSearchShortcut();
    registerServiceWorker();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
