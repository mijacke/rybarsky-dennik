(function () {
  const html = document.documentElement;
  const stored = localStorage.getItem("tv-theme");
  if (stored) html.setAttribute("data-theme", stored);

  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const current = html.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    html.setAttribute("data-theme", next);
    localStorage.setItem("tv-theme", next);
    fetch("/api/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: next }),
      credentials: "same-origin",
    }).catch(() => {});
  });
})();
