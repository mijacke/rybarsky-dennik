(function () {
  const btn = document.getElementById("favBtn");
  if (!btn) return;
  const id = btn.getAttribute("data-spot-id");

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    try {
      const res = await axios.post(`/revires/${id}/favorite`);
      if (res.data.favorite) btn.classList.add("is-fav");
      else btn.classList.remove("is-fav");
    } catch (err) {
      if (err.response && err.response.status === 401) {
        window.location.href = "/prihlasenie";
      }
    } finally {
      btn.disabled = false;
    }
  });
})();
