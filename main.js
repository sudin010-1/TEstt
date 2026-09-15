/* ============================================================
   Rajdhani Motors — shared site behavior
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header scroll state ---------- */
  var header = document.querySelector(".site-header");
  function onScrollHeader() {
    if (!header) return;
    if (window.scrollY > 30) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---------- Mobile nav toggle ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.classList.remove("open");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el, i) {
      el.style.setProperty("--i", i % 6);
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Hero parallax (subtle, capped) ---------- */
  var heroBg = document.querySelector(".hero-bg-layer");
  if (heroBg && !reduceMotion) {
    var ticking = false;
    function updateParallax() {
      var y = window.scrollY;
      var offset = Math.min(y * 0.12, 90);
      heroBg.style.transform = "translateY(" + offset + "px)";
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(updateParallax);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Gallery filters ---------- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var galleryItems = document.querySelectorAll("[data-category]");
  if (filterBtns.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var target = btn.getAttribute("data-filter");
        galleryItems.forEach(function (item) {
          var show = target === "all" || item.getAttribute("data-category") === target;
          item.style.display = show ? "" : "none";
        });
      });
    });
  }

  /* ---------- Booking form -> Google Sheet webhook + WhatsApp handoff ---------- */
  // TODO (owner/dev): replace with the real Google Apps Script Web App URL
  // once the booking Sheet + script are deployed. Until then the form still
  // captures everything needed to message the shop directly on WhatsApp.
  var SHEET_WEBHOOK_URL = "REPLACE_WITH_GOOGLE_APPS_SCRIPT_URL";
  var WHATSAPP_NUMBER = "9779851031996"; // intl format, no plus sign, confirm before launch

  var bookingForm = document.getElementById("booking-form");
  if (bookingForm) {
    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var data = new FormData(bookingForm);
      var categories = data.getAll("category").join(", ") || "Not specified";
      var name = data.get("name") || "";
      var phone = data.get("phone") || "";
      var address = data.get("address") || "";
      var vehicle = data.get("vehicle") || "";
      var model = data.get("model") || "";
      var color = data.get("color") || "";
      var km = data.get("km") || "";
      var datetime = data.get("datetime") || "";
      var message = data.get("message") || "";

      var summary =
        "Hi Rajdhani Motors, I'd like to book a service.\n\n" +
        "Service(s): " + categories + "\n" +
        "Name: " + name + "\n" +
        "Phone: " + phone + "\n" +
        "Address: " + address + "\n" +
        "Vehicle: " + vehicle + " " + model + " (" + color + ")\n" +
        "KM: " + km + "\n" +
        "Preferred date/time: " + datetime +
        (message ? "\nNotes: " + message : "");

      var waLink = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(summary);

      // Fire-and-forget submit to the Sheet. no-cors means we can't read the
      // response, so we don't block the confirmation screen on it.
      if (SHEET_WEBHOOK_URL && SHEET_WEBHOOK_URL.indexOf("REPLACE_WITH") === -1) {
        var payload = new URLSearchParams();
        Array.from(data.entries()).forEach(function (pair) {
          payload.append(pair[0], pair[1]);
        });
        fetch(SHEET_WEBHOOK_URL, { method: "POST", mode: "no-cors", body: payload }).catch(function () {});
      }

      var waBtn = document.getElementById("confirm-wa-link");
      if (waBtn) waBtn.setAttribute("href", waLink);

      bookingForm.closest(".booking-form-panel").style.display = "none";
      var confirmPanel = document.getElementById("confirm-panel");
      if (confirmPanel) confirmPanel.classList.add("show");
      confirmPanel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  }

  var resetBtn = document.getElementById("booking-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      bookingForm.reset();
      document.getElementById("confirm-panel").classList.remove("show");
      bookingForm.closest(".booking-form-panel").style.display = "";
      bookingForm.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  }
})();
