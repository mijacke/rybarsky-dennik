(function () {
  const root = document.getElementById("globeRoot");
  const dataNode = document.getElementById("globeData");
  if (!root || !dataNode) return;

  const mode = root.getAttribute("data-globe-mode") || "interactive";
  const isStatic = mode === "static";
  const raw = JSON.parse(dataNode.textContent || "[]");
  const spots = raw
    .filter((s) => Number.isFinite(Number(s.lat)) && Number.isFinite(Number(s.lon)))
    .map((s, index) => ({
      id: String(s.id),
      name: s.name || "Revír",
      country: s.country || "Svet",
      flag: s.flag || "🇸🇰",
      lat: Number(s.lat),
      lon: Number(s.lon),
      type: s.type || "Revír",
      species: s.species || "Šťuka, Zubáč, Kapor",
      catches: Number(s.catches || 0),
      rating: Number(s.rating || 0),
      note: s.note || "",
      url: s.url || "",
      active: index === 0,
    }));

  // Arc source: always Slovakia (Liptovská Mara if available, else fixed Bratislava-ish point).
  const slovakSpot = spots.find((s) => s.country === "Slovensko");
  const SOURCE = slovakSpot ? { lat: slovakSpot.lat, lon: slovakSpot.lon } : { lat: 48.7, lon: 19.5 };

  if (!spots.length) {
    root.innerHTML = '<div class="empty-panel">Na glóbe zatiaľ nie sú revíry s GPS súradnicami.</div>';
    return;
  }

  const svg = root.querySelector(".globe-svg");
  const card = root.querySelector(".globe-spot-card");
  const list = root.querySelector(".globe-list-items");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const W = 600;
  const H = 520;
  const cx = W / 2;
  const cy = H / 2;
  const R = 205;
  const scale = R * 2.22;
  const fov = 2.2;

  // Initial view centered on the equator/prime meridian (≈ Africa, lat 0, lon 0).
  let yaw = -Math.PI / 2;
  let pitch = 0;
  let activeId = spots[0].id;
  let hoveredId = null;
  let dragging = false;
  let autoSpin = !reduceMotion;
  let zoom = 1;
  let lastPoint = { x: 0, y: 0 };
  let lastFrame = 0;
  let raf = 0;
  let landRings = [];

  const graticule = [];
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts = [];
    for (let lon = -180; lon <= 180; lon += 5) pts.push(latLonToXYZ(lat, lon));
    graticule.push(pts);
  }
  for (let lon = -180; lon < 180; lon += 30) {
    const pts = [];
    for (let lat = -90; lat <= 90; lat += 5) pts.push(latLonToXYZ(lat, lon));
    graticule.push(pts);
  }

  function latLonToXYZ(lat, lon, r = 1) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return {
      x: -r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.cos(phi),
      z: r * Math.sin(phi) * Math.sin(theta),
    };
  }

  function rotateY(p, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return { x: p.x * cos + p.z * sin, y: p.y, z: -p.x * sin + p.z * cos };
  }

  function rotateX(p, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return { x: p.x, y: p.y * cos - p.z * sin, z: p.y * sin + p.z * cos };
  }

  function transform(p) {
    return rotateX(rotateY(p, yaw), pitch);
  }

  function project(p) {
    const t = transform(p);
    const z = t.z + fov;
    return {
      px: cx + (t.x / z) * scale,
      py: cy - (t.y / z) * scale,
      visible: t.z > 0.02,
      depth: t.z,
    };
  }

  function pathFrom(points, onlyVisible) {
    let d = "";
    let pen = false;
    for (const p of points) {
      const pp = project(p);
      if (onlyVisible && !pp.visible) { pen = false; continue; }
      d += pen ? `L${pp.px.toFixed(1)},${pp.py.toFixed(1)}` : `M${pp.px.toFixed(1)},${pp.py.toFixed(1)}`;
      pen = true;
    }
    return d;
  }

  // Ring path: fill+close only when fully on the front hemisphere; otherwise draw open visible segments.
  function pathFromRing(points) {
    let allVisible = true;
    for (const p of points) {
      if (!project(p).visible) { allVisible = false; break; }
    }
    if (allVisible) {
      return { d: pathFrom(points, false) + "Z", filled: true };
    }
    return { d: pathFrom(points, true), filled: false };
  }

  function decodeTopologyArc(topology, arcIndex) {
    const reversed = arcIndex < 0;
    const arc = topology.arcs[reversed ? ~arcIndex : arcIndex];
    const scale = topology.transform.scale;
    const translate = topology.transform.translate;
    let x = 0;
    let y = 0;
    const decoded = arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
    });
    return reversed ? decoded.reverse() : decoded;
  }

  function decodeLandRings(topology) {
    const land = topology.objects.land.geometries[0];
    const rings = [];
    for (const polygon of land.arcs) {
      for (const ringArcIndexes of polygon) {
        const ring = [];
        for (const arcIndex of ringArcIndexes) {
          const decoded = decodeTopologyArc(topology, arcIndex);
          if (ring.length) decoded.shift();
          ring.push(...decoded);
        }
        if (ring.length > 2) rings.push(ring.map(([lon, lat]) => latLonToXYZ(lat, lon)));
      }
    }
    return rings;
  }

  async function loadLand() {
    const response = await fetch("/data/land-110m.json", { cache: "force-cache" });
    if (!response.ok) throw new Error("Nepodarilo sa načítať Natural Earth land dáta.");
    landRings = decodeLandRings(await response.json());
  }

  function arcPoints(a, b, steps = 32) {
    const pts = [];
    const dot = Math.min(1, Math.max(-1, a.x * b.x + a.y * b.y + a.z * b.z));
    const angle = Math.acos(dot);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      if (angle < 0.001) {
        pts.push({ ...a });
        continue;
      }
      const s = Math.sin(angle);
      const aa = Math.sin((1 - t) * angle) / s;
      const bb = Math.sin(t * angle) / s;
      pts.push({ x: aa * a.x + bb * b.x, y: aa * a.y + bb * b.y, z: aa * a.z + bb * b.z });
    }
    return pts;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function theme() {
    return document.documentElement.getAttribute("data-theme") || "dark";
  }

  function colors() {
    // Globe always renders in its dark "deep ocean" palette regardless of UI theme.
    return {
      isDark: true,
      landFill: "rgba(8,28,60,0.55)",
      landStroke: "rgba(80,160,220,0.35)",
      grid: "rgba(80,160,220,0.10)",
      arc: "rgba(0,220,255,",
      labelBg: "rgba(4,14,32,0.86)",
      labelText: "#72f5dd",
    };
  }

  function renderCard() {
    const selected = spots.find((s) => s.id === activeId) || spots[0];
    card.innerHTML = `
      <div class="globe-spot-header">
        <span class="globe-country">${escapeHtml(selected.country)} <span aria-hidden="true">${escapeHtml(selected.flag)}</span></span>
        <span class="globe-type-chip">${escapeHtml(selected.type)}</span>
      </div>
      <h3 class="globe-spot-name">${escapeHtml(selected.name)}</h3>
      <p class="globe-spot-note">${escapeHtml(selected.note)}</p>
      <div class="globe-spot-meta">
        <div class="globe-meta-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg><span>${escapeHtml(selected.species)}</span></div>
        <div class="globe-meta-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg><span class="mono">${selected.lat.toFixed(2)}°, ${selected.lon.toFixed(2)}°</span></div>
        <div class="globe-meta-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg><span><b style="color:var(--cyan)">${selected.catches}</b> zaznamenaných úlovkov</span></div>
        <div class="globe-meta-row"><svg viewBox="0 0 24 24" fill="currentColor" style="color:var(--warn)"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg><span class="globe-rating">${selected.rating ? selected.rating.toFixed(1) : "—"} / 5.0</span></div>
      </div>
      ${selected.url
        ? `<a class="btn btn-primary btn-block" style="margin-top:16px" href="${escapeHtml(selected.url)}">Otvoriť v portáli <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>`
        : `<span class="btn btn-ghost btn-block globe-reference" style="margin-top:16px">Svetový referenčný bod</span>`}
    `;
  }

  function renderList() {
    list.innerHTML = spots.map((s) => `
      <button class="globe-list-item ${s.id === activeId ? "active" : ""}" data-spot-id="${escapeHtml(s.id)}" type="button">
        <span class="gli-flag">${escapeHtml(s.flag)}</span>
        <span class="gli-name">${escapeHtml(s.name)}</span>
        <span class="gli-type">${escapeHtml(s.type)}</span>
      </button>
    `).join("");
  }

  function renderGlobe() {
    const c = colors();
    const active = spots.find((s) => s.id === activeId) || spots[0];
    const sourceP = latLonToXYZ(SOURCE.lat, SOURCE.lon);
    const projected = spots.map((s) => ({ ...s, p3: latLonToXYZ(s.lat, s.lon), p: project(latLonToXYZ(s.lat, s.lon)) }));

    const gridPaths = graticule
      .map((line) => `<path d="${pathFrom(line, true)}" fill="none" stroke="${c.grid}" stroke-width="0.6"/>`)
      .join("");

    const landPaths = landRings.map((ring) => {
      const r = pathFromRing(ring);
      if (!r.d) return "";
      return `<path d="${r.d}" fill="${r.filled ? c.landFill : "none"}" stroke="${c.landStroke}" stroke-width="0.7"/>`;
    }).join("");

    let arcs = "";
    if (!isStatic) {
      const baseLines = projected
        .filter((s) => Math.abs(s.lat - SOURCE.lat) > 0.01 || Math.abs(s.lon - SOURCE.lon) > 0.01)
        .filter((s) => s.id !== activeId)
        .map((s) => {
          const d = pathFrom(arcPoints(sourceP, s.p3, 64), true);
          return d ? `<path d="${d}" fill="none" stroke="${c.arc}0.32)" stroke-width="0.9" stroke-linecap="round"/>` : "";
        })
        .join("");

      const target = projected.find((s) => s.id === activeId);
      const targetIsSource = target && Math.abs(target.lat - SOURCE.lat) < 0.01 && Math.abs(target.lon - SOURCE.lon) < 0.01;
      let highlight = "";
      if (target && !targetIsSource) {
        const d = pathFrom(arcPoints(sourceP, target.p3, 96), true);
        if (d) {
          const accent = "rgba(255, 205, 91,";
          highlight = `
            <g filter="url(#glow-arc)">
              <path d="${d}" fill="none" stroke="${accent}0.85)" stroke-width="3.2" stroke-linecap="round"/>
            </g>
            <path d="${d}" fill="none" stroke="${accent}1)" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="4 6"/>
          `;
        }
      }
      arcs = baseLines + highlight;
    }

    const pins = projected.map((s) => {
      if (!s.p.visible) return "";
      const isActive = !isStatic && s.id === activeId;
      const r = isActive ? 4.5 : 3.4;
      const fill = isActive ? "rgba(255,205,91,1)" : "rgba(0,220,255,0.95)";
      return `<g class="globe-pin ${isActive ? "active" : ""}" data-spot-id="${escapeHtml(s.id)}" filter="${isActive ? "url(#glow-strong)" : "url(#glow-pin)"}">
        <circle cx="${s.p.px.toFixed(1)}" cy="${s.p.py.toFixed(1)}" r="${r}" fill="${fill}"/>
      </g>`;
    }).join("");

    const labels = projected.map((s) => {
      if (!s.p.visible) return "";
      const showThis = isStatic || s.id === activeId || s.id === hoveredId;
      if (!showThis) return "";
      const width = Math.max(92, s.name.length * 7.2 + 14);
      const x = s.p.px + 14;
      const y = s.p.py + 4;
      return `<g class="globe-label">
        <rect x="${(x - 5).toFixed(1)}" y="${(y - 14).toFixed(1)}" width="${width}" height="20" rx="5" fill="${c.labelBg}" stroke="rgba(0,255,200,0.38)" stroke-width="0.9"/>
        <text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="${c.labelText}" font-size="11" font-family="'JetBrains Mono', monospace" font-weight="500">${escapeHtml(s.name)}</text>
      </g>`;
    }).join("");

    const zoomTransform = `translate(${cx} ${cy}) scale(${zoom}) translate(${-cx} ${-cy})`;

    svg.innerHTML = `
      <defs>
        <radialGradient id="globe-bloom" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stop-color="${c.isDark ? "rgba(40,140,230,0.18)" : "rgba(80,150,220,0.16)"}"/>
          <stop offset="78%" stop-color="${c.isDark ? "rgba(20,90,180,0.10)" : "rgba(80,150,220,0.08)"}"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
        </radialGradient>
        <radialGradient id="globe-bg" cx="35%" cy="32%" r="72%">
          <stop offset="0%" stop-color="${c.isDark ? "rgba(38,84,150,0.95)" : "rgba(220,235,250,0.95)"}"/>
          <stop offset="60%" stop-color="${c.isDark ? "rgba(14,38,82,0.98)" : "rgba(190,215,240,0.98)"}"/>
          <stop offset="100%" stop-color="${c.isDark ? "rgba(3,10,26,1)" : "rgba(160,195,230,1)"}"/>
        </radialGradient>
        <radialGradient id="globe-shine" cx="35%" cy="28%" r="45%">
          <stop offset="0%" stop-color="${c.isDark ? "rgba(80,180,255,0.12)" : "rgba(255,255,255,0.35)"}"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
        </radialGradient>
        <filter id="glow-pin" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.5" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
        <filter id="glow-arc" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
        <filter id="glow-strong" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="4" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
        <clipPath id="globe-clip"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>
        <radialGradient id="atmosphere" cx="50%" cy="50%" r="50%"><stop offset="85%" stop-color="rgba(0,0,0,0)"/><stop offset="100%" stop-color="${c.isDark ? "rgba(0,160,255,0.15)" : "rgba(30,100,200,0.10)"}"/></radialGradient>
      </defs>
      <g transform="${zoomTransform}">
        <circle cx="${cx}" cy="${cy}" r="${R + 60}" fill="url(#globe-bloom)"/>
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#globe-bg)"/>
        <g clip-path="url(#globe-clip)">
          ${gridPaths}
          ${landPaths}
          ${arcs}
          ${pins}
          <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#globe-shine)"/>
          <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#atmosphere)"/>
        </g>
        ${labels}
      </g>
    `;
  }

  function renderStatic() {
    if (isStatic) return;
    renderCard();
    renderList();
  }

  function selectSpot(id) {
    activeId = String(id);
    renderStatic();
    renderGlobe();
  }

  if (!isStatic) {
    root.addEventListener("click", (event) => {
      const target = event.target.closest("[data-spot-id]");
      if (!target) return;
      selectSpot(target.getAttribute("data-spot-id"));
    });

    root.addEventListener("pointerdown", (event) => {
      if (!event.target.closest(".globe-svg")) return;
      event.preventDefault();
      dragging = true;
      autoSpin = false;
      lastPoint = { x: event.clientX, y: event.clientY };
      svg.setPointerCapture(event.pointerId);
      document.body.style.userSelect = "none";
    });

    root.addEventListener("pointermove", (event) => {
      const pin = event.target.closest(".globe-pin");
      const nextHovered = pin ? pin.getAttribute("data-spot-id") : null;
      if (nextHovered !== hoveredId) {
        hoveredId = nextHovered;
        renderGlobe();
      }

      if (!dragging) return;
      const dx = event.clientX - lastPoint.x;
      const dy = event.clientY - lastPoint.y;
      yaw += dx * 0.006;
      pitch = Math.max(-0.7, Math.min(0.7, pitch + dy * 0.006));
      lastPoint = { x: event.clientX, y: event.clientY };
      renderGlobe();
    });

    root.addEventListener("pointerup", () => {
      dragging = false;
      document.body.style.userSelect = "";
      window.setTimeout(() => {
        if (!dragging && !reduceMotion) autoSpin = true;
      }, 1600);
    });

    const zoomIn = root.querySelector("[data-globe-zoom-in]");
    const zoomOut = root.querySelector("[data-globe-zoom-out]");
    const setZoom = (next) => {
      zoom = Math.max(0.6, Math.min(3.5, next));
      renderGlobe();
    };
    if (zoomIn) zoomIn.addEventListener("click", () => setZoom(zoom * 1.25));
    if (zoomOut) zoomOut.addEventListener("click", () => setZoom(zoom / 1.25));
    svg.addEventListener("wheel", (event) => {
      event.preventDefault();
      const delta = event.deltaY < 0 ? 1.12 : 1 / 1.12;
      setZoom(zoom * delta);
    }, { passive: false });
  }

  new MutationObserver(renderGlobe).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  function loop(ts) {
    if (autoSpin && ts - lastFrame > 34) {
      yaw += 0.0036;
      renderGlobe();
      lastFrame = ts;
    }
    raf = window.requestAnimationFrame(loop);
  }

  renderStatic();
  loadLand()
    .catch(() => {
      landRings = [];
    })
    .finally(() => {
      renderGlobe();
      if (!reduceMotion) raf = window.requestAnimationFrame(loop);
    });
  window.addEventListener("beforeunload", () => window.cancelAnimationFrame(raf));
})();
