(function () {
  const el = document.getElementById("spotMap");
  if (!el || typeof L === "undefined") return;

  const lat = parseFloat(el.dataset.lat);
  const lon = parseFloat(el.dataset.lon);
  const name = el.dataset.name || "Revír";
  if (!isFinite(lat) || !isFinite(lon)) return;

  const map = L.map(el, {
    scrollWheelZoom: false,
    zoomControl: true,
  }).setView([lat, lon], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
    maxZoom: 18,
  }).addTo(map);

  L.marker([lat, lon]).addTo(map).bindPopup(name).openPopup();
})();
