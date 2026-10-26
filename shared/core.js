// Shared engine for the three demo sites: data helpers, catalog filtering, gallery, lead forms.
(function () {
  const D = window.CARS;
  const cars = D.cars;
  const PER_PAGE = 24;

  // Photo paths in data/cars.js are relative to the site root; pages live one folder down.
  const root = new URL("..", document.currentScript.src).href;
  const abs = (p) => (/^https?:/.test(p) ? p : root + p);
  cars.forEach((c) => { c.photo = abs(c.photo); c.photos = c.photos.map(abs); });

  const nf = new Intl.NumberFormat("ru-RU");
  const CUR = {
    USD: { sign: "$", rate: D.jpy_usd, step: 100, pre: true },
    KZT: { sign: "₸", rate: D.jpy_kzt, step: 10000 },
    JPY: { sign: "¥", rate: 1, step: 1000, pre: true },
  };

  function getCur() {
    try { return localStorage.getItem("demo-cur") || "USD"; } catch (e) { return "USD"; }
  }
  function setCur(c) {
    try { localStorage.setItem("demo-cur", c); } catch (e) { /* private mode */ }
  }
  function money(jpy, cur) {
    const c = CUR[cur || getCur()];
    const v = nf.format(Math.round((jpy * c.rate) / c.step) * c.step);
    return c.pre ? c.sign + v : v + " " + c.sign;
  }
  const km = (n) => nf.format(n) + " км";
  const title = (c) => `${c.make} ${c.model}`;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const byId = (id) => cars.find((c) => c.id === id);
  const carUrl = (c) => "car.html?id=" + c.id;

  function counts(key, list) {
    const m = new Map();
    (list || cars).forEach((c) => m.set(c[key], (m.get(c[key]) || 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }

  // Price vs. the median of the same model on the Japanese market (computed in tools/add_market.py).
  // pct > 0 means cheaper than market. Gaps over 30% usually mean a different version, so they're not shown.
  function deal(c) {
    if (!c.market_jpy) return null;
    const pct = Math.round(((c.market_jpy - c.total_jpy) / c.market_jpy) * 100);
    if (Math.abs(pct) > 30) return null;
    return { pct, market: c.market_jpy, n: c.market_n, years: c.market_years, exact: c.market_exact };
  }

  // Ready-to-render wording for the deal badge and the price assessment block, shared by all themes.
  function dealView(c) {
    const d = deal(c);
    if (!d) return null;
    const cls = d.pct >= 1 ? "good" : d.pct > -3 ? "fair" : "high";
    const yrs = d.years[0] === d.years[1] ? `${d.years[0]} г.` : `${d.years[0]}–${d.years[1]} гг.`;
    return {
      ...d, cls,
      badge: cls === "good" ? `Выгоднее на ${d.pct}%` : cls === "fair" ? "Цена в рынке" : "",
      verdict: cls === "good" ? `Дешевле рынка на <b>${d.pct}%</b>` : cls === "fair" ? "Цена соответствует рынку" : `Дороже рынка на <b>${-d.pct}%</b>`,
      basis: `${d.n} авто ${d.exact ? "той же версии" : "этой модели"}, ${yrs}`,
      pos: Math.max(0, Math.min(100, 50 - (d.pct / 30) * 50)), // marker on a ±30% scale, cheaper to the left
    };
  }

  function similar(car, n) {
    return cars
      .filter((c) => c.id !== car.id)
      .sort((a, b) => (b.make === car.make) - (a.make === car.make) || Math.abs(a.total_jpy - car.total_jpy) - Math.abs(b.total_jpy - car.total_jpy))
      .slice(0, n);
  }

  // ---- filtering ----
  const usdToJpy = (usd) => usd / D.jpy_usd;
  function applyFilters(f) {
    const q = (f.q || "").trim().toLowerCase();
    let list = cars.filter((c) =>
      (!f.make || c.make === f.make) &&
      (!f.model || c.model === f.model) &&
      (!f.body || c.body === f.body) &&
      (!f.year_from || c.year >= +f.year_from) &&
      (!f.year_to || c.year <= +f.year_to) &&
      (!f.price_from || c.total_jpy >= usdToJpy(+f.price_from)) &&
      (!f.price_to || c.total_jpy <= usdToJpy(+f.price_to)) &&
      (!f.km_to || c.km <= +f.km_to) &&
      (!q || `${c.make} ${c.model} ${c.grade} ${c.color}`.toLowerCase().includes(q)));
    const sorts = {
      new: (a, b) => b.year - a.year || a.km - b.km,
      cheap: (a, b) => a.total_jpy - b.total_jpy,
      expensive: (a, b) => b.total_jpy - a.total_jpy,
      km: (a, b) => a.km - b.km,
      deal: (a, b) => ((deal(b) || { pct: -99 }).pct - (deal(a) || { pct: -99 }).pct),
    };
    return list.sort(sorts[f.sort] || sorts.new);
  }

  function readParams() {
    return Object.fromEntries(new URLSearchParams(location.search));
  }

  function fillSelect(sel, entries, placeholder, value) {
    sel.innerHTML = `<option value="">${placeholder}</option>` +
      entries.map(([v, n]) => `<option value="${esc(v)}"${v == value ? " selected" : ""}>${esc(v)}${n ? ` (${n})` : ""}</option>`).join("");
  }

  // Wires a filter <form> (inputs named like the filter keys) to a results grid.
  function catalog(opts) {
    const form = opts.form;
    const p = readParams();
    let page = +p.page || 1;
    const sel = (n) => form.elements[n];

    fillSelect(sel("make"), counts("make"), opts.anyMake || "Все марки", p.make);
    const fillModels = () => {
      const mk = sel("make").value;
      fillSelect(sel("model"), mk ? counts("model", cars.filter((c) => c.make === mk)) : [], opts.anyModel || "Все модели", p.model);
      sel("model").disabled = !mk;
    };
    fillModels();
    if (sel("body")) fillSelect(sel("body"), counts("body"), opts.anyBody || "Любой кузов", p.body);
    if (sel("year_from")) {
      const years = [...new Set(cars.map((c) => c.year))].sort((a, b) => b - a).map((y) => [y]);
      fillSelect(sel("year_from"), years, "Год от", p.year_from);
      fillSelect(sel("year_to"), years, "Год до", p.year_to);
    }
    ["price_from", "price_to", "km_to", "q", "sort"].forEach((n) => { if (sel(n) && p[n]) sel(n).value = p[n]; });

    function state() {
      const f = {};
      [...form.elements].forEach((el) => { if (el.name && el.value) f[el.name] = el.value; });
      if (f.sort === "new") delete f.sort;
      return f;
    }
    function render(push) {
      const f = state();
      const list = applyFilters(f);
      const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
      page = Math.min(page, pages);
      opts.count.textContent = list.length;
      opts.grid.innerHTML = list.length
        ? list.slice((page - 1) * PER_PAGE, page * PER_PAGE).map(opts.card).join("")
        : opts.empty || "<p>Ничего не нашлось. Попробуйте убрать часть фильтров.</p>";
      opts.pager.innerHTML = pages > 1 ? pager(page, pages) : "";
      if (push) {
        const qs = new URLSearchParams({ ...f, ...(page > 1 ? { page } : {}) }).toString();
        history.replaceState(null, "", qs ? "?" + qs : location.pathname);
      }
      if (opts.onRender) opts.onRender(list, f);
    }
    function pager(cur, total) {
      const nums = [];
      for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || Math.abs(i - cur) <= 1) nums.push(i);
        else if (nums[nums.length - 1] !== "…") nums.push("…");
      }
      return (cur > 1 ? `<button data-page="${cur - 1}" aria-label="Назад">←</button>` : "") +
        nums.map((n) => n === "…" ? `<span>…</span>` : `<button data-page="${n}"${n === cur ? ' aria-current="page"' : ""}>${n}</button>`).join("") +
        (cur < total ? `<button data-page="${cur + 1}" aria-label="Вперёд">→</button>` : "");
    }

    form.addEventListener("change", (e) => {
      if (e.target.name === "make") { p.model = ""; fillModels(); }
      page = 1;
      render(true);
    });
    form.addEventListener("input", (e) => { if (e.target.type === "search" || e.target.type === "number") { page = 1; render(true); } });
    form.addEventListener("submit", (e) => { e.preventDefault(); page = 1; render(true); });
    form.addEventListener("reset", () => setTimeout(() => { p.make = p.model = ""; fillModels(); page = 1; render(true); }));
    opts.pager.addEventListener("click", (e) => {
      const b = e.target.closest("[data-page]");
      if (!b) return;
      page = +b.dataset.page;
      render(true);
      (opts.scrollTo || opts.grid).scrollIntoView({ behavior: "smooth", block: "start" });
    });
    render(false);
    return { render };
  }

  // Quick-search form on landing pages: make/model selects that navigate to the catalog.
  function quickSearch(form) {
    const mk = form.elements.make, md = form.elements.model;
    fillSelect(mk, counts("make"), "Все марки");
    fillSelect(md, [], "Все модели");
    md.disabled = true;
    mk.addEventListener("change", () => {
      fillSelect(md, mk.value ? counts("model", cars.filter((c) => c.make === mk.value)) : [], "Все модели");
      md.disabled = !mk.value;
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = {};
      [...form.elements].forEach((el) => { if (el.name && el.value) f[el.name] = el.value; });
      location.href = "catalog.html" + (Object.keys(f).length ? "?" + new URLSearchParams(f) : "");
    });
  }

  // ---- gallery: main image, thumbnails, arrows, swipe, keyboard, fullscreen ----
  function gallery(root, photos, alt) {
    let i = 0;
    root.innerHTML = `
      <div class="g-main">
        <img src="${esc(photos[0])}" alt="${esc(alt)}">
        <button class="g-prev" aria-label="Предыдущее фото">‹</button>
        <button class="g-next" aria-label="Следующее фото">›</button>
        <span class="g-count"></span>
        <button class="g-full" aria-label="На весь экран">⤢</button>
      </div>
      <div class="g-thumbs">${photos.map((p, n) => `<button data-i="${n}" aria-label="Фото ${n + 1}"><img src="${esc(p)}" alt="" loading="lazy"></button>`).join("")}</div>`;
    const img = root.querySelector(".g-main img");
    const strip = root.querySelector(".g-thumbs");
    const thumbs = strip.querySelectorAll("button");
    strip.style.position = "relative";
    function show(n) {
      i = (n + photos.length) % photos.length;
      img.src = photos[i];
      root.querySelector(".g-count").textContent = `${i + 1} / ${photos.length}`;
      thumbs.forEach((t, k) => t.classList.toggle("on", k === i));
      // scroll only the thumbnail strip, never the page
      const t = thumbs[i];
      strip.scrollTo({ left: t.offsetLeft - (strip.clientWidth - t.clientWidth) / 2, top: t.offsetTop - (strip.clientHeight - t.clientHeight) / 2, behavior: "smooth" });
    }
    root.querySelector(".g-prev").onclick = () => show(i - 1);
    root.querySelector(".g-next").onclick = () => show(i + 1);
    strip.onclick = (e) => { const b = e.target.closest("button"); if (b) show(+b.dataset.i); };
    root.querySelector(".g-full").onclick = () => root.classList.toggle("g-fs");
    document.addEventListener("keydown", (e) => {
      if (e.target.closest("input, select, textarea, dialog")) return;
      if (e.key === "ArrowLeft") show(i - 1);
      if (e.key === "ArrowRight") show(i + 1);
      if (e.key === "Escape") root.classList.remove("g-fs");
    });
    let x0 = null;
    img.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    img.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    if (photos.length < 2) root.classList.add("g-single");
    show(0);
  }

  // ---- lead forms: <form data-lead> — demo only, shows a success state ----
  function leads(scope) {
    (scope || document).querySelectorAll("form[data-lead]").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const phone = form.elements.phone;
        if (phone && phone.value.replace(/\D/g, "").length < 10) {
          phone.setCustomValidity("Укажите номер телефона полностью");
          phone.reportValidity();
          phone.addEventListener("input", () => phone.setCustomValidity(""), { once: true });
          return;
        }
        form.classList.add("sent");
        form.innerHTML = `<div class="lead-ok"><strong>Спасибо, заявку получили!</strong><p>Скоро напишем вам в WhatsApp или Telegram.</p><small>Это демо, заявка никуда не отправилась.</small></div>`;
      });
    });
  }

  // ---- modal with a lead form, opened by [data-open-lead] ----
  function leadModal(html) {
    const dlg = document.createElement("dialog");
    dlg.className = "lead-modal";
    document.body.appendChild(dlg);
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-open-lead]");
      if (!b) return;
      e.preventDefault();
      dlg.innerHTML = `<button class="lead-close" aria-label="Закрыть">×</button>` + html(b.dataset.openLead || "");
      leads(dlg);
      dlg.querySelector(".lead-close").onclick = () => dlg.close();
      dlg.showModal();
    });
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  }

  // Hide cards whose remote photo is gone (sold listing).
  document.addEventListener("error", (e) => {
    if (e.target.tagName === "IMG" && e.target.dataset.fallback !== undefined) e.target.style.visibility = "hidden";
  }, true);

  window.Demo = { cars, money, km, title, esc, byId, carUrl, counts, similar, deal, dealView, applyFilters, catalog, quickSearch, gallery, leads, leadModal, getCur, setCur, readParams };
})();
