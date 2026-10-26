// SORA — bright marketplace theme with a currency switcher. Renders each page by body[data-page].
(function () {
  const { cars, money, km, title, esc, carUrl, counts } = Demo;
  const page = document.body.dataset.page;
  const cur = Demo.getCur();
  const price = (c) => money(c.total_jpy, cur);
  const litres = (c) => (c.engine_cc ? (c.engine_cc / 1000).toFixed(1) + " л" : "—");

  document.body.insertAdjacentHTML("afterbegin", `
    <div class="util"><div class="wrap util-in">
      <span>Экспорт автомобилей из Японии в Казахстан и Кыргызстан</span>
      <div class="cur" role="group" aria-label="Валюта">${["USD", "KZT", "JPY"].map((c) =>
        `<button data-cur="${c}"${c === cur ? ' class="on"' : ""}>${{ USD: "$ USD", KZT: "₸ KZT", JPY: "¥ JPY" }[c]}</button>`).join("")}</div>
    </div></div>
    <header class="top"><div class="wrap top-in">
      <a class="logo" href="index.html"><b>SORA</b>auto</a>
      <form class="top-search" action="catalog.html"><input type="search" name="q" placeholder="Марка или модель, например G-Class" aria-label="Поиск"><button aria-label="Найти">Найти</button></form>
      <nav class="nav"><a href="catalog.html">Каталог</a><a href="index.html#calc">Расчёт доставки</a></nav>
      <a href="#" class="btn btn-orange" data-open-lead>Заявка</a>
    </div></header>`);

  document.body.querySelector(".cur").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cur]");
    if (b) { Demo.setCur(b.dataset.cur); location.reload(); }
  });

  document.body.insertAdjacentHTML("beforeend", `
    <footer class="foot"><div class="wrap foot-in">
      <div><a class="logo" href="index.html"><b>SORA</b>auto</a><p>Подбор, покупка и доставка автомобилей из Японии.</p></div>
      <div><h4>Каталог</h4>${counts("make").slice(0, 5).map(([m]) => `<a href="catalog.html?make=${encodeURIComponent(m)}">${esc(m)}</a>`).join("")}</div>
      <div><h4>Клиентам</h4><a href="index.html#calc">Расчёт доставки</a><a href="index.html#steps">Как купить</a><a href="#" data-open-lead>Подбор под заказ</a></div>
      <div><h4>Связь</h4><p>+996 000 000 000<br>+7 700 000-00-00<br>WhatsApp · Telegram</p></div>
    </div><p class="wrap demo-note">Демо-версия сайта. Машины и цены взяты с японского рынка для примера.</p></footer>`);

  Demo.leadModal((car) => `
    <form data-lead class="lead">
      <h3>${car ? "Заявка на автомобиль" : "Оставить заявку"}</h3>
      ${car ? `<p class="lead-car">${esc(car)}</p>` : ""}
      <label>Имя<input name="name" required></label>
      <label>Телефон / WhatsApp<input name="phone" type="tel" placeholder="+7 / +996" required></label>
      <label>Город доставки<select name="city"><option>Алматы</option><option>Астана</option><option>Шымкент</option><option>Бишкек</option><option>Ош</option></select></label>
      <button class="btn btn-orange">Отправить</button>
    </form>`);

  // One badge: how this car's price compares with the same model on the market.
  const badges = (c) => {
    const d = Demo.dealView(c);
    return d && d.badge ? `<span class="tag ${d.cls === "good" ? "tag-green" : "tag-gray"}">${d.badge}</span>` : "";
  };

  // Price assessment block for the car page: where the price sits against the market median.
  const assessment = (c) => {
    const d = Demo.dealView(c);
    if (!d) return `<div class="panel deal"><h2>Оценка цены</h2><p class="deal-note">Редкая версия: на рынке Японии мало сопоставимых предложений с левым рулём.</p></div>`;
    return `
      <div class="panel deal">
        <h2>Оценка цены</h2>
        <p class="deal-verdict ${d.cls}">${d.verdict}</p>
        <div class="deal-scale" aria-hidden="true"><span class="deal-mid"></span><span class="deal-dot ${d.cls}" style="left:${d.pos}%"></span></div>
        <div class="deal-legend"><span>Дешевле</span><span>Средняя цена</span><span>Дороже</span></div>
        <dl class="deal-facts">
          <div><dt>Эта машина</dt><dd>${price(c)}</dd></div>
          <div><dt>Средняя цена ${esc(c.model)}</dt><dd>${money(d.market, cur)}</dd></div>
          <div><dt>Сравнили с</dt><dd>${d.basis}</dd></div>
        </dl>
        <p class="deal-note">Медиана цен на эту модель с левым рулём у дилеров Японии. Пробег и комплектация могут объяснять разницу.</p>
      </div>`;
  };

  const tile = (c) => `
    <a class="tile" href="${carUrl(c)}">
      <div class="tile-img"><img src="${esc(c.photo)}" alt="${esc(title(c))}" loading="lazy" data-fallback><div class="tags">${badges(c)}</div></div>
      <div class="tile-body"><h3>${esc(title(c))}</h3><p>${c.year} г. · ${km(c.km)}</p><strong>${price(c)}</strong></div>
    </a>`;

  const row = (c) => `
    <article class="row">
      <a class="row-img" href="${carUrl(c)}"><img src="${esc(c.photo)}" alt="${esc(title(c))}" loading="lazy" data-fallback><div class="tags">${badges(c)}</div></a>
      <div class="row-main">
        <a href="${carUrl(c)}"><h3>${esc(title(c))}</h3></a>
        <p class="grade">${esc(c.grade)}</p>
        <dl class="row-specs">
          <div><dt>Год</dt><dd>${c.year}</dd></div><div><dt>Пробег</dt><dd>${km(c.km)}</dd></div>
          <div><dt>Двигатель</dt><dd>${litres(c)}</dd></div><div><dt>КПП</dt><dd>${esc(c.gearbox)}</dd></div>
          <div><dt>Цвет</dt><dd>${esc(c.color)}</dd></div><div><dt>Где</dt><dd>${esc(c.region)}</dd></div>
        </dl>
      </div>
      <div class="row-side">
        <small>Цена в Японии</small><strong>${price(c)}</strong>
        <a class="btn btn-blue" href="${carUrl(c)}">Подробнее</a>
        <a class="btn btn-ghost" href="#" data-open-lead="${esc(title(c) + ", " + c.year)}">Запросить расчёт</a>
      </div>
    </article>`;

  if (page === "home") {
    const hero = cars.find((c) => c.make === "Lamborghini") || cars[0];
    document.getElementById("hero-img").src = hero.photo;
    document.getElementById("stock").textContent = cars.length;
    Demo.quickSearch(document.getElementById("quick"));
    document.getElementById("makes").innerHTML = counts("make").map(([m, n]) =>
      `<a href="catalog.html?make=${encodeURIComponent(m)}"><span class="mk">${esc(m.split(/[ -]/)[0].slice(0, 2).toUpperCase())}</span><b>${esc(m)}</b><small>${n}</small></a>`).join("");
    document.getElementById("fresh").innerHTML = [...cars].sort((a, b) => b.year - a.year || a.km - b.km).slice(0, 8).map(tile).join("");
    document.getElementById("budget").innerHTML = [
      ["до $150 000", "?price_to=150000"], ["$150–300 тыс.", "?price_from=150000&price_to=300000"], ["$300–500 тыс.", "?price_from=300000&price_to=500000"], ["от $500 000", "?price_from=500000"],
    ].map(([t, q]) => `<a href="catalog.html${q}">${t}</a>`).join("");
  }

  if (page === "catalog") {
    const p = Demo.readParams();
    Demo.catalog({
      form: document.getElementById("filters"),
      grid: document.getElementById("grid"),
      count: document.getElementById("count"),
      pager: document.getElementById("pager"),
      card: row,
      scrollTo: document.querySelector(".res-head"),
      onRender: (list, f) => {
        document.getElementById("crumb").textContent = f.make ? f.make + (f.model ? " " + f.model : "") : "Все автомобили";
      },
    });
    if (p.q) document.querySelector(".top-search input").value = p.q;
    document.getElementById("toggle-filters").onclick = () => document.querySelector(".side").classList.toggle("open");
  }

  if (page === "car") {
    const c = Demo.byId(Demo.readParams().id) || cars[0];
    document.title = `${title(c)} ${c.year} — SORA auto`;
    const specs = [
      ["Марка", c.make], ["Модель", c.model], ["Комплектация", c.grade], ["Год выпуска", c.year], ["Пробег", km(c.km)],
      ["Кузов", c.body], ["Цвет", c.color], ["Двигатель", litres(c)], ["КПП", c.gearbox], ["Руль", "Левый"],
      ["Техосмотр до", c.inspection || "—"], ["Местонахождение", "Япония, " + c.region],
    ];
    const cond = [["Без ДТП", c.accident === "Нет"], ["Гарантия дилера", c.warranty === "Есть"], ["Сервисная история", c.service === "Есть"],
      ["Левый руль", true], ["Действующий техосмотр", !!c.inspection], ["Экспорт в KZ / KG", true]];
    document.getElementById("car").innerHTML = `
      <nav class="crumbs"><a href="index.html">Главная</a> › <a href="catalog.html">Каталог</a> › <a href="catalog.html?make=${encodeURIComponent(c.make)}">${esc(c.make)}</a> › ${esc(c.model)}</nav>
      <div class="car-grid">
        <div class="panel"><div class="gallery" id="gallery"></div></div>
        <aside class="panel buy">
          <p class="buy-make">${esc(c.make)}</p>
          <h1>${esc(c.model)} <span>${esc(c.grade)}</span></h1>
          <div class="tags">${badges(c)}</div>
          <div class="buy-price"><small>Цена в Японии</small><strong>${price(c)}</strong>
            <span>${["USD", "KZT", "JPY"].filter((x) => x !== cur).map((x) => money(c.total_jpy, x)).join(" · ")}</span></div>
          <div class="quick-specs">
            <div><small>Год</small><b>${c.year}</b></div><div><small>Пробег</small><b>${km(c.km)}</b></div>
            <div><small>Двигатель</small><b>${litres(c)}</b></div><div><small>КПП</small><b>${esc(c.gearbox)}</b></div>
          </div>
          <a href="#" class="btn btn-orange wide" data-open-lead="${esc(title(c) + ", " + c.year)}">Рассчитать цену под ключ</a>
          <a href="#" class="btn btn-ghost wide" data-open-lead="${esc(title(c) + ", " + c.year)}">Задать вопрос в WhatsApp</a>
        </aside>
      </div>
      ${assessment(c)}
      <div class="panel"><h2>Состояние</h2><ul class="cond">${cond.map(([t, ok]) => `<li class="${ok ? "ok" : ""}">${t}</li>`).join("")}</ul></div>
      <div class="panel"><h2>Характеристики</h2><table class="spec-table">${specs.map(([k, v]) => `<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join("")}</table></div>
      <div class="panel"><h2>Похожие автомобили</h2><div class="tiles">${Demo.similar(c, 4).map(tile).join("")}</div></div>`;
    Demo.gallery(document.getElementById("gallery"), c.photos, title(c));
  }

  Demo.leads();
})();
