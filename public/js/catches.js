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
    return Array.from({ length: 5 }, (_, i) => {
      const on = i < Number(n || 0) ? "on" : "off";
      return `<svg class="${on}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.8 5.5 21 7.5 13.5 2 9h7l3-7Z"/></svg>`;
    }).join("");
  }

  function renderItem(c) {
    const li = document.createElement("li");
    li.className = "catch-list-item";
    li.dataset.id = c.id;

    const photo = c.photo_path
      ? `<img src="${escapeHtml(c.photo_path)}" alt="Úlovok ${escapeHtml(c.species)}"/>`
      : `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs><linearGradient id="catch-${c.id}" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#0c2444"/><stop offset="100%" stop-color="#1a4f7a"/></linearGradient></defs>
          <rect width="100" height="100" fill="url(#catch-${c.id})"/>
          <path d="M10 52 Q35 30 60 52 Q70 52 80 47 L90 42 L90 62 L80 57 Q70 52 60 52 Q35 74 10 52" fill="rgba(120, 200, 255, 0.25)" stroke="rgba(120, 200, 255, 0.5)" stroke-width="0.5"/>
          <circle cx="62" cy="49" r="0.9" fill="#fff"/>
        </svg>`;

    const canEdit = String(c.user_id) === String(currentUserId);
    const canDelete = canEdit || isAdmin;

    const actions = [];
    if (canEdit) {
      actions.push(`<button class="icon-btn" data-act="edit" title="Upraviť" aria-label="Upraviť úlovok">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3l5 5-12 12H4v-5L16 3Z"/></svg>
      </button>`);
    }
    if (canDelete) {
      actions.push(`<button class="icon-btn icon-btn-danger" data-act="delete" title="Vymazať" aria-label="Vymazať úlovok">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/></svg>
      </button>`);
    }

    li.innerHTML = `
      <article class="catch">
        <div class="catch-photo">
          ${photo}
          <span class="corner">#${String(c.id).padStart(3, "0")}</span>
        </div>
        <div class="catch-body">
          <div class="head">
            <span class="species">${escapeHtml(c.species)}</span>
            <span class="rating">${stars(c.rating)}</span>
          </div>
          <div class="stats">
            <span>${escapeHtml(c.weight_kg)} kg</span>
            <span>${escapeHtml(c.length_cm)} cm</span>
            <span>${fmtDate(c.caught_at)}</span>
          </div>
          ${c.comment ? `<p class="comment">„${escapeHtml(c.comment)}"</p>` : ""}
          <span class="author">${escapeHtml(c.author_name)}</span>
        </div>
        <div class="catch-actions">
          ${actions.join("")}
        </div>
      </article>`;

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
        openEditModal(c, (updated) => {
          Object.assign(c, updated);
          const fresh = renderItem(c);
          li.replaceWith(fresh);
        });
      }
    });

    return li;
  }

  async function load() {
    try {
      const res = await axios.get(`/revires/${spotId}/catches`);
      list.innerHTML = "";
      if (!res.data.items.length) {
        list.innerHTML = `<li class="empty-panel">Tichá voda. Buďte prvý, kto sem zapíše úlovok.</li>`;
        return;
      }
      for (const c of res.data.items) list.appendChild(renderItem(c));
    } catch (e) {
      list.innerHTML = `<li class="empty-panel">Chyba pri načítaní úlovkov.</li>`;
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

  const editModal = document.getElementById("modal-editCatch");
  const editForm = document.getElementById("editCatchForm");
  const editMsg = document.getElementById("editCatchMsg");
  const editTitle = document.getElementById("editCatchTitle");
  let editingId = null;
  let editingCallback = null;

  function openEditModal(c, onSaved) {
    if (!editModal || !editForm) return;
    editingId = c.id;
    editingCallback = onSaved;
    editTitle.textContent = `Upraviť úlovok: ${c.species}`;
    editForm.querySelector("#ec_species").value = c.species || "";
    editForm.querySelector("#ec_weight").value = c.weight_kg ?? "";
    editForm.querySelector("#ec_length").value = c.length_cm ?? "";
    editForm.querySelector("#ec_rating").value = String(c.rating || 5);
    editForm.querySelector("#ec_comment").value = c.comment || "";
    editMsg.className = "catch-form__msg";
    editMsg.textContent = "";
    editModal.hidden = false;
    setTimeout(() => editForm.querySelector("#ec_species").focus(), 50);
  }

  if (editForm) {
    editForm.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      if (!editingId) return;
      editMsg.className = "catch-form__msg";
      editMsg.textContent = "Ukladám…";
      try {
        const res = await axios.patch(`/catches/${editingId}`, {
          species: editForm.querySelector("#ec_species").value,
          weight_kg: editForm.querySelector("#ec_weight").value,
          length_cm: editForm.querySelector("#ec_length").value,
          rating: editForm.querySelector("#ec_rating").value,
          comment: editForm.querySelector("#ec_comment").value,
        });
        if (editingCallback) editingCallback(res.data.item);
        editModal.hidden = true;
        editingId = null;
        editingCallback = null;
      } catch (err) {
        editMsg.classList.add("is-error");
        editMsg.textContent = err.response?.data?.error || "Nepodarilo sa upraviť.";
      }
    });
  }

  load();
})();
