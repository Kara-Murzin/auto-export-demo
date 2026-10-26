// KURO — dark premium theme. Injects header/footer, renders each page by body[data-page].
(function () {
  const { cars, money, km, title, esc, carUrl, counts } = Demo;
  const page = document.body.dataset.page;

  document.body.insertAdjacentHTML("afterbegin", `
    <header class="top">
      <a class="logo" href="index.html">KURO<span>Motors · Tokyo</span></a>
      <nav class="nav" id="nav">
        <a href="catalog.html"${page === "catalog" ? ' aria-current="page"' : ""}>Каталог</a>
        <a href="index.html#process">Как мы работаем</a>
        <a href="index.html#delivery">Доставка</a>
        <a href="index.html#contacts">Контакты</a>
      </nav>
      <a class="btn btn-gold top-cta" href="#" data-open-lead>Подобрать авто</a>
      <button class="burger" aria-label="Меню" onclick="document.getElementById('nav').classList.toggle('open')">☰</button>
    </header>`);

  document.body.insertAdjacentHTML("beforeend", `
    <footer class="foot" id="contacts">
      <div class="wrap foot-grid">
        <div><div class="logo">KURO<span>Motors · Tokyo</span></div>
          <p class="muted">Экспорт премиальных автомобилей из Японии в Казахстан и Кыргызстан.</p></div>
        <div><h4>Контакты</h4><p>+7 700 000-00-00<br>WhatsApp · Telegram<br>Токио, Минато-ку</p></div>
        <div><h4>Офисы</h4><p>Алматы<br>Бишкек</p></div>
      </div>
      <p class="wrap demo-note">Демо-версия сайта. Машины и цены взяты с японского рынка для примера.</p>
    </footer>`);

  Demo.leadModal((car) => `
    <form data-lead class="lead">
      <h3>${car ? "Запрос по автомобилю" : "Подбор автомобиля"}</h3>
      <p class="muted">${car ? esc(car) : "Напишите марку и бюджет, подберём варианты с ценой под ключ."}</p>
      <input name="name" placeholder="Имя" required>
      <input name="phone" type="tel" placeholder="Телефон / WhatsApp" required>
      <select name="city"><option>Алматы</option><option>Астана</option><option>Бишкек</option><option>Другой город</option></select>
      <button class="btn btn-gold">Отправить заявку</button>
    </form>`);

  const dealBadge = (c) => {
    const d = Demo.dealView(c);
    return d && d.badge ? `<span class="deal-badge ${d.cls}">${d.badge}</span>` : "";
  };

  const card = (c) => `
    <a class="card" href="${carUrl(c)}">
      <div class="card-img"><img src="${esc(c.photo)}" alt="${esc(title(c))}" loading="lazy" data-fallback>${dealBadge(c)}</div>
      <div class="card-body">
        <div class="card-make">${esc(c.make)}</div>
        <h3>${esc(c.model)}</h3>
        <p class="muted">${esc(c.grade)}</p>
        <div class="card-meta"><span>${c.year}</span><span>${km(c.km)}</span><span>${esc(c.color)}</span></div>
        <div class="card-price">${money(c.total_jpy, "USD")}</div>
      </div>
    </a>`;

  if (page === "home") {
    const hero = [...cars].sort((a, b) => b.total_jpy - a.total_jpy)[0];
    document.querySelector(".hero").style.setProperty("--hero", `url("${hero.photo}")`);
    document.getElementById("stock").textContent = cars.length;
    Demo.quickSearch(document.getElementById("quick"));
    document.getElementById("brands").innerHTML = counts("make").map(([m, n]) =>
      `<a href="catalog.html?make=${encodeURIComponent(m)}"><strong>${esc(m)}</strong><span>${n} авто</span></a>`).join("");
    const picks = [];
    counts("make").forEach(([m]) => { const c = cars.find((x) => x.make === m); if (c) picks.push(c); });
    document.getElementById("featured").innerHTML = picks.slice(0, 6).map(card).join("");
  }

  if (page === "catalog") {
    Demo.catalog({
      form: document.getElementById("filters"),
      grid: document.getElementById("grid"),
      count: document.getElementById("count"),
      pager: document.getElementById("pager"),
      card,
      scrollTo: document.querySelector(".cat-head"),
    });
    document.getElementById("toggle-filters").onclick = () => document.querySelector(".side").classList.toggle("open");
  }

  const assessment = (c) => {
    const d = Demo.dealView(c);
    if (!d) return `<section class="deal"><h2>Оценка цены</h2><p class="muted">Редкая версия: на рынке Японии мало сопоставимых предложений с левым рулём.</p></section>`;
    return `
      <section class="deal">
        <h2>Оценка цены</h2>
        <div class="deal-grid">
          <div>
            <p class="deal-verdict ${d.cls}">${d.verdict}</p>
            <div class="deal-scale" aria-hidden="true"><span class="deal-dot" style="left:${d.pos}%"></span></div>
            <div class="deal-legend"><span>Дешевле</span><span>Рынок</span><span>Дороже</span></div>
          </div>
          <dl>
            <div><dt>Эта машина</dt><dd>${money(c.total_jpy, "USD")}</dd></div>
            <div><dt>Средняя цена ${esc(c.model)}</dt><dd>${money(d.market, "USD")}</dd></div>
            <div><dt>Сравнили с</dt><dd>${d.basis}</dd></div>
          </dl>
        </div>
        <p class="muted small">Медиана цен на эту модель с левым рулём у дилеров Японии. Пробег и комплектация могут объяснять разницу.</p>
      </section>`;
  };

  if (page === "car") {
    const c = Demo.byId(Demo.readParams().id) || cars[0];
    document.title = `${title(c)} ${c.year} — KURO Motors`;
    const specs = [
      ["Год", c.year], ["Пробег", km(c.km)], ["Кузов", c.body], ["Цвет", c.color],
      ["Двигатель", c.engine_cc ? (c.engine_cc / 1000).toFixed(1) + " л" : "—"], ["КПП", c.gearbox],
      ["ДТП", c.accident], ["Гарантия", c.warranty], ["Обслуживание", c.service],
      ["Техосмотр до", c.inspection || "—"], ["Руль", "Левый"], ["Где находится", "Япония, " + c.region],
    ];
    document.getElementById("car").innerHTML = `
      <nav class="crumbs"><a href="index.html">Главная</a> / <a href="catalog.html">Каталог</a> / <a href="catalog.html?make=${encodeURIComponent(c.make)}">${esc(c.make)}</a></nav>
      <div class="car-grid">
        <div class="gallery" id="gallery"></div>
        <aside class="buy">
          <div class="card-make">${esc(c.make)}</div>
          <h1>${esc(c.model)}</h1>
          <p class="muted">${esc(c.grade)}</p>
          <div class="buy-meta"><span>${c.year}</span><span>${km(c.km)}</span><span>${esc(c.color)}</span></div>
          <div class="buy-price">${money(c.total_jpy, "USD")}</div>
          <p class="muted small">Цена в Японии · ${money(c.total_jpy, "JPY")}<br>Доставку и растаможку рассчитаем под ваш город.</p>
          <a href="#" class="btn btn-gold wide" data-open-lead="${esc(title(c) + " " + c.year)}">Рассчитать под ключ</a>
          <a href="#" class="btn btn-line wide" data-open-lead="${esc(title(c) + " " + c.year)}">Написать в WhatsApp</a>
          <ul class="ticks"><li>Проверка перед покупкой</li><li>Фото и видео-осмотр по запросу</li><li>Доставка в Алматы и Бишкек</li></ul>
        </aside>
      </div>
      ${assessment(c)}
      <section class="specs"><h2>Характеристики</h2>
        <dl>${specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl></section>
      <section><h2>Похожие автомобили</h2><div class="cards">${Demo.similar(c, 3).map(card).join("")}</div></section>`;
    Demo.gallery(document.getElementById("gallery"), c.photos, title(c));
  }

  Demo.leads();
})();
