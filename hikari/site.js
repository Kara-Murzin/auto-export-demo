// HIKARI — light minimal theme. Injects header/footer, renders each page by body[data-page].
(function () {
  const { cars, money, km, title, esc, carUrl, counts } = Demo;
  const page = document.body.dataset.page;

  document.body.insertAdjacentHTML("afterbegin", `
    <header class="top">
      <a class="logo" href="index.html">hikari<i></i></a>
      <nav class="nav" id="nav">
        <a href="catalog.html"${page === "catalog" ? ' aria-current="page"' : ""}>Автомобили</a>
        <a href="index.html#how">Доставка</a>
        <a href="index.html#faq">Вопросы</a>
        <a href="index.html#contact">Контакты</a>
      </nav>
      <a class="top-phone" href="#" data-open-lead>+7 700 000-00-00</a>
      <button class="burger" aria-label="Меню" onclick="document.getElementById('nav').classList.toggle('open')"><span></span><span></span></button>
    </header>`);

  document.body.insertAdjacentHTML("beforeend", `
    <footer class="foot">
      <div class="wrap foot-in">
        <a class="logo" href="index.html">hikari<i></i></a>
        <p>Автомобили из Японии<br>для Казахстана и Кыргызстана</p>
        <p>Алматы · Бишкек · Токио<br>hello@hikari.example</p>
      </div>
      <p class="wrap demo-note">Демо-версия сайта. Машины и цены взяты с японского рынка для примера.</p>
    </footer>`);

  Demo.leadModal((car) => `
    <form data-lead class="lead">
      <h3>${car ? esc(car) : "Связаться с нами"}</h3>
      <p class="muted">Ответим в WhatsApp или Telegram в течение 15 минут.</p>
      <input name="name" placeholder="Ваше имя" required>
      <input name="phone" type="tel" placeholder="+7 ___ ___ __ __" required>
      <button class="btn">Отправить</button>
    </form>`);

  const dealBadge = (c) => {
    const d = Demo.dealView(c);
    return d && d.badge ? `<span class="deal-badge ${d.cls}">${d.badge}</span>` : "";
  };

  const assessment = (c) => {
    const d = Demo.dealView(c);
    if (!d) return `<div class="deal"><h2>Оценка цены</h2><p class="card-sub">Редкая версия: на рынке Японии мало сопоставимых предложений с левым рулём.</p></div>`;
    return `
      <div class="deal">
        <h2>Оценка цены</h2>
        <p class="deal-verdict ${d.cls}">${d.verdict}</p>
        <div class="deal-scale" aria-hidden="true"><span class="deal-dot ${d.cls}" style="left:${d.pos}%"></span></div>
        <div class="deal-legend"><span>Дешевле</span><span>Средняя цена</span><span>Дороже</span></div>
        <p class="deal-text">Средняя цена ${esc(c.model)}: <b>${money(d.market, "USD")}</b>. Сравнили с ${d.basis}, с левым рулём у дилеров Японии. Пробег и комплектация могут объяснять разницу.</p>
      </div>`;
  };

  const card = (c) => `
    <a class="card" href="${carUrl(c)}">
      <div class="card-img"><img src="${esc(c.photo)}" alt="${esc(title(c))}" loading="lazy" data-fallback>${dealBadge(c)}</div>
      <div class="card-row"><h3>${esc(title(c))}</h3><strong>${money(c.total_jpy, "USD")}</strong></div>
      <p class="card-sub">${c.year} · ${km(c.km)} · ${esc(c.grade)}</p>
    </a>`;

  if (page === "home") {
    const pick = (make) => cars.find((c) => c.make === make) || cars[0];
    const mosaic = ["Rolls-Royce", "Ferrari", "Porsche", "Lamborghini"].map(pick);
    document.getElementById("mosaic").innerHTML = mosaic.map((c) =>
      `<a href="${carUrl(c)}"><img src="${esc(c.photo)}" alt="${esc(title(c))}"><span>${esc(title(c))}</span></a>`).join("");
    Demo.quickSearch(document.getElementById("quick"));
    document.getElementById("bodies").innerHTML = counts("body").slice(0, 6).map(([b, n]) =>
      `<a href="catalog.html?body=${encodeURIComponent(b)}">${esc(b)} <sup>${n}</sup></a>`).join("");
    document.getElementById("count").textContent = cars.length;
    document.getElementById("fresh").innerHTML = [...cars].sort((a, b) => b.year - a.year || a.km - b.km).slice(0, 10).map(card).join("");
    const rail = document.getElementById("fresh");
    document.querySelectorAll("[data-rail]").forEach((b) =>
      b.addEventListener("click", () => rail.scrollBy({ left: +b.dataset.rail * rail.clientWidth * 0.8, behavior: "smooth" })));
  }

  if (page === "catalog") {
    const form = document.getElementById("filters");
    const chips = document.getElementById("chips");
    chips.innerHTML = `<button type="button" data-body="">Все</button>` +
      counts("body").map(([b]) => `<button type="button" data-body="${esc(b)}">${esc(b)}</button>`).join("");
    chips.onclick = (e) => {
      const b = e.target.closest("[data-body]");
      if (!b) return;
      form.elements.body.value = b.dataset.body;
      form.dispatchEvent(new Event("change"));
    };
    Demo.catalog({
      form, card,
      grid: document.getElementById("grid"),
      count: document.getElementById("count"),
      pager: document.getElementById("pager"),
      scrollTo: document.querySelector(".cat-head"),
      onRender: (list, f) => chips.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.body === (f.body || ""))),
    });
  }

  if (page === "car") {
    const c = Demo.byId(Demo.readParams().id) || cars[0];
    document.title = `${title(c)} ${c.year} — hikari`;
    const specs = [
      ["Год выпуска", c.year], ["Пробег", km(c.km)], ["Тип кузова", c.body], ["Цвет", c.color],
      ["Объём двигателя", c.engine_cc ? (c.engine_cc / 1000).toFixed(1) + " л" : "—"], ["Коробка передач", c.gearbox],
      ["Руль", "Левый"], ["ДТП", c.accident], ["Гарантия дилера", c.warranty], ["Сервисная история", c.service],
      ["Техосмотр в Японии до", c.inspection || "—"], ["Местонахождение", "Япония, " + c.region],
    ];
    document.getElementById("car").innerHTML = `
      <div class="wrap car-head">
        <a href="catalog.html" class="back">← Все автомобили</a>
        <h1>${esc(title(c))}</h1>
        <p class="card-sub">${esc(c.grade)}</p>
      </div>
      <div class="wrap gallery" id="gallery"></div>
      <div class="wrap car-body">
        <div>
          <div class="facts">
            <div><small>Год</small><b>${c.year}</b></div>
            <div><small>Пробег</small><b>${km(c.km)}</b></div>
            <div><small>Двигатель</small><b>${c.engine_cc ? (c.engine_cc / 1000).toFixed(1) + " л" : "—"}</b></div>
            <div><small>Цвет</small><b>${esc(c.color)}</b></div>
          </div>
          ${assessment(c)}
          <h2>Характеристики</h2>
          <dl class="specs">${specs.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
        </div>
        <aside class="price-box">
          <small>Цена в Японии</small>
          <div class="price">${money(c.total_jpy, "USD")}</div>
          <p class="card-sub">≈ ${money(c.total_jpy, "KZT")} · ${money(c.total_jpy, "JPY")}</p>
          <form data-lead class="lead">
            <p>Рассчитаем стоимость под ключ до вашего города</p>
            <input name="phone" type="tel" placeholder="+7 ___ ___ __ __" required>
            <select name="city"><option>Алматы</option><option>Астана</option><option>Бишкек</option></select>
            <button class="btn">Получить расчёт</button>
          </form>
        </aside>
      </div>
      <section class="wrap"><h2>Похожие</h2><div class="cards">${Demo.similar(c, 3).map(card).join("")}</div></section>`;
    Demo.gallery(document.getElementById("gallery"), c.photos, title(c));
  }

  Demo.leads();
})();
