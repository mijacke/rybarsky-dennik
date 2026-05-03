(function () {
  const root = document.querySelector(".catches");
  if (!root) return;

  const spotId = root.getAttribute("data-spot-id");
  const currentUserId = root.getAttribute("data-current-user-id");
  const isAdmin = root.getAttribute("data-is-admin") === "1";
  const list = document.getElementById("catchList");
  const form = document.getElementById("catchForm");
  const msg = document.getElementById("catchFormMsg");

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fmtDate(s) {
    try {
      return new Date(s).toLocaleDateString("sk-SK", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return s;
    }
  }

  function stars(n) {
    return "★".repeat(n) + "☆".repeat(5 - n);
  }

  function renderItem(c) {
    const li = document.createElement("li");
    li.className = "catch-list__item";
    li.dataset.id = c.id;

    const photo = c.photo_path
      ? `<img class="catch-list__photo" src="${escapeHtml(c.photo_path)}" alt=""/>`
      : `<div class="catch-list__no-photo">— bez foto —</div>`;

    const canEdit = String(c.user_id) === String(currentUserId);
    const canDelete = canEdit || isAdmin;

    const actions = [];
    if (canEdit) actions.push(`<button class="link-button" data-act="edit">Upraviť</button>`);
    if (canDelete) actions.push(`<button class="link-button link-button--danger" data-act="delete">Vymazať</button>`);

    li.innerHTML = `
      ${photo}
      <div>
        <h3 class="catch-list__species">${escapeHtml(c.species)}</h3>
        <p class="catch-list__numbers"><strong>${c.weight_kg} kg</strong> · ${c.length_cm} cm</p>
        <p class="catch-list__meta">${escapeHtml(c.author_name)} · ${fmtDate(c.caught_at)}</p>
        ${c.comment ? `<p class="catch-list__comment">„${escapeHtml(c.comment)}"</p>` : ""}
      </div>
      <div class="catch-list__actions">
        <span class="catch-list__stars">${stars(c.rating)}</span>
        ${actions.join("")}
      </div>`;

    li.addEventListener("click", async (ev) => {
      const btn = ev.target.closest("[data-act]");
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === "delete") {
        if (!confirm(`Vymazať úlovok ${c.species}?`)) return;
        try {
          await axios.delete(`/catches/${c.id}`);
          li.style.opacity = "0";
          setTimeout(() => li.remove(), 250);
        } catch (e) {
          alert("Nepodarilo sa vymazať.");
        }
      } else if (act === "edit") {
        const newSpecies = prompt("Druh ryby:", c.species);
        if (newSpecies === null) return;
        const newWeight = prompt("Hmotnosť (kg):", c.weight_kg);
        if (newWeight === null) return;
        const newLength = prompt("Dĺžka (cm):", c.length_cm);
        if (newLength === null) return;
        const newRating = prompt("Hodnotenie 1–5:", c.rating);
        if (newRating === null) return;
        const newComment = prompt("Komentár:", c.comment || "");
        try {
          const res = await axios.patch(`/catches/${c.id}`, {
            species: newSpecies,
            weight_kg: newWeight,
            length_cm: newLength,
            rating: newRating,
            comment: newComment,
          });
          Object.assign(c, res.data.item);
          const fresh = renderItem(c);
          li.replaceWith(fresh);
        } catch (e) {
          alert(e.response?.data?.error || "Nepodarilo sa upraviť.");
        }
      }
    });

    return li;
  }

  async function load() {
    try {
      const res = await axios.get(`/revires/${spotId}/catches`);
      list.innerHTML = "";
      if (!res.data.items.length) {
        list.innerHTML = `<li class="empty">Tichá voda. Buďte prvý, kto sem zapíše úlovok.</li>`;
        return;
      }
      for (const c of res.data.items) list.appendChild(renderItem(c));
    } catch (e) {
      list.innerHTML = `<li class="empty">Chyba pri načítaní úlovkov.</li>`;
    }
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.className = "catch-form__msg";
      msg.textContent = "Zapisujem…";

      const fd = new FormData(form);
      try {
        await axios.post(`/revires/${spotId}/catches`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        msg.classList.add("is-success");
        msg.textContent = "Úlovok zapísaný.";
        form.reset();
        await load();
      } catch (err) {
        msg.classList.add("is-error");
        msg.textContent = err.response?.data?.error || "Chyba pri zápise.";
      }
    });
  }

  load();
})();
