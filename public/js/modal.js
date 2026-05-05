(function () {
  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-modal-open]");
    if (opener) {
      const id = opener.getAttribute("data-modal-open");
      const modal = document.getElementById("modal-" + id);
      if (modal) modal.hidden = false;
      return;
    }
    const closer = e.target.closest("[data-modal-close]");
    if (closer) {
      const modal = closer.closest(".modal-layer");
      if (modal) modal.hidden = true;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-layer:not([hidden])").forEach((m) => (m.hidden = true));
    }
  });
})();
