/* Спільне для всіх ігор: монети 🪙, магазин, профіль і РЕЙТИНГ гравців.
   META.begin(гра)            -> {life:0|1, x2:0|1} бонуси з магазину на цей забіг (витрачаються)
   META.end(гра, {pts, coins, win, label}) -> {earned, total, best}  (pts = очки для рейтингу, coins = монети за забіг)
   META.open(["rating"|"shop"|"me"]) відкриває вікно.  Рейтинг ділиться між усіма пристроями через Firebase,
   якщо ж бази немає, то працює лише на цьому пристрої. */
(function () {
  var GAMES = { bus: "🚌 Автобус", volley: "🏐 Волейбол", basket: "🏀 Баскетбол", fizruk: "🕵️ Злий фізрук", bob: "🥷 Сторож Боб", egg: "🧺 Ловля м’ячів", goal: "⚽ Пенальті" };
  var SHOP = [
    { id: "life", ic: "❤️", n: "Додаткова спроба", d: "+1 життя / промах / кидок у наступній грі", p: 60, cons: 1 },
    { id: "gold", ic: "🌟", n: "Золотий м’яч (баскетбол)", d: "у наступній грі в баскетбол усі м’ячі золоті: ×2 очки", p: 120, cons: 1 },
    { id: "x2", ic: "✨", n: "Подвійні монети", d: "×2 монети за наступну гру (рейтинг не змінює)", p: 90, cons: 1 }
  ];
  var AVA = [{ a: "🙂", p: 0 }, { a: "🦦", p: 0 }, { a: "🦊", p: 150 }, { a: "🐺", p: 150 }, { a: "🦁", p: 300 }, { a: "🐯", p: 300 }, { a: "🚀", p: 500 }, { a: "👑", p: 800 }];
  var TITLES = [[0, "Новачок"], [300, "Гравець"], [1000, "Майстер"], [2500, "Капітан"], [5000, "Легенда ліцею"]];
  var P = "bus.meta.";
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(P + k); localStorage.setItem(P + k, v); } catch (e) {} return null; }
  function num(k) { return +ls(k) || 0; }
  function js(k, d) { try { return JSON.parse(ls(k)) || d; } catch (e) { return d; } }
  // перенесення монет зі старого баскетболу
  try { var old = +localStorage.getItem("bus.basket.coins") || 0; if (old) { ls("coins", String(num("coins") + old)); localStorage.removeItem("bus.basket.coins"); } } catch (e) {}
  var id = ls("id"); if (!id) { id = Math.random().toString(36).slice(2, 10); ls("id", id); }
  function day() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  var CF = window.CONFIG;
  function dbOk() { return CF && CF.dbUrl && String(CF.dbUrl).indexOf("ВАШ") === -1 && CF.key; }
  function url() { return CF.dbUrl + "/bus/" + CF.key + "/rating"; }
  var BAD = /(хуй|хуя|пізд|пизд|бляд|блят|єба|ебан|еба[лт]|сука|суки|нахуй|мудак|підор|педик|гандон|шлюх|дебіл|fuck|shit|nigg)/i;

  var M = {
    get coins() { return num("coins"); },
    get nick() { return ls("nick") || ""; },
    get avatar() { return ls("ava") || "🙂"; },
    perks: function () { return js("perks", {}); },
    add: function (n) { n = Math.max(0, Math.round(n)); ls("coins", String(M.coins + n)); paint(); return M.coins; },
    spend: function (n) { if (M.coins < n) return false; ls("coins", String(M.coins - n)); paint(); return true; },
    best: function () { return js("best", {}); },
    total: function () { var b = M.best(), t = 0; for (var k in b) t += b[k]; return Math.round(t); },
    title: function (t) { var r = TITLES[0][1]; TITLES.forEach(function (x) { if (t >= x[0]) r = x[1]; }); return r; },
    begin: function (game) {
      var p = M.perks(), r = { life: 0, x2: 1, gold: false };
      if (p.life > 0) { p.life--; r.life = 1; }
      if (p.x2 > 0) { p.x2--; r.x2 = 2; }
      if (p.gold > 0 && game === "basket") { p.gold--; r.gold = true; }
      ls("perks", JSON.stringify(p)); M._run = r; paint(); return r;
    },
    end: function (game, o) {
      o = o || {}; var r = M._run || { x2: 1 }; if (!o.keep) M._run = null;
      var earned = Math.max(0, Math.round(o.coins || 0)) * (r.x2 || 1);
      if (ls("day") !== day()) { ls("day", day()); earned += 10; o.daily = 10; }
      M.add(earned);
      var b = M.best(), pts = Math.max(0, Math.round(o.pts || 0)), nb = pts > (b[game] || 0);
      if (nb) { b[game] = pts; ls("best", JSON.stringify(b)); M.push(); }
      var out = { earned: earned, coins: earned, total: M.coins, best: nb, daily: o.daily || 0, x2: r.x2 > 1 };
      if (!M.nick && !ls("asked") && pts > 0) { ls("asked", "1"); setTimeout(function () { M.open("me"); }, 1400); }
      paint(); return out;
    },
    // рядок для оверлеїв ігор: «+12 🪙 (разом 340)»
    line: function (r) { return r ? "+" + r.earned + " 🪙" + (r.x2 ? " (×2 ✨)" : "") + (r.daily ? " · щоденний бонус +" + r.daily : "") + " · у тебе " + r.total : ""; },
    gain: function (r, el) { M.clear(el); if (!r) return; var d = document.createElement("div"); d.className = "mg"; d.style.cssText = "font:700 13px system-ui;color:#ffd23f;background:rgba(0,0,0,.4);border-radius:999px;padding:5px 12px;margin:2px auto"; d.textContent = M.line(r) + (r.best ? " · 🏆 новий особистий рекорд!" : ""); el.insertBefore(d, el.querySelector(".go") || null); },
    clear: function (el) { var o = el && el.querySelector(".mg"); if (o) o.remove(); },
    push: function () {
      if (!dbOk() || !M.nick || /[?&]nostat\b/.test(location.search)) return;
      var rec = { n: M.nick, a: M.avatar, p: M.total(), g: M.best(), ts: Date.now() };
      try { fetch(url() + "/" + id + ".json", { method: "PUT", body: JSON.stringify(rec), keepalive: true }).catch(function () {}); } catch (e) {}
    },
    list: function (cb) {
      var local = [{ id: id, n: M.nick || "Ти", a: M.avatar, p: M.total(), g: M.best(), me: 1 }];
      if (!dbOk()) return cb(local, false);
      fetch(url() + ".json", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (d) {
        var arr = []; for (var k in (d || {})) { var v = d[k]; if (v && v.n) arr.push({ id: k, n: String(v.n).slice(0, 16), a: v.a || "🙂", p: +v.p || 0, g: v.g || {}, me: k === id }); }
        if (!arr.some(function (x) { return x.me; }) && M.nick) arr.push(local[0]);
        cb(arr, true);
      }).catch(function () { cb(local, false); });
    }
  };

  /* ---------- інтерфейс ---------- */
  var css = document.createElement("style");
  css.textContent =
    ".mpill{position:fixed;right:8px;bottom:8px;z-index:60;display:flex;gap:6px;align-items:center;background:rgba(15,15,20,.82);color:#ffd23f;border:1.5px solid rgba(255,255,255,.3);border-radius:999px;padding:7px 12px;font:700 14px system-ui,sans-serif;cursor:pointer;backdrop-filter:blur(4px)}" +
    ".mpill:active{transform:scale(.96)}" +
    ".mw{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.72);display:none;align-items:center;justify-content:center;padding:10px;font-family:system-ui,sans-serif}" +
    ".mw.on{display:flex}.mw *{box-sizing:border-box;user-select:none}" +
    ".mb{width:100%;max-width:420px;max-height:92vh;overflow:auto;background:#17202a;color:#fff;border-radius:16px;padding:14px;border:1px solid rgba(255,255,255,.2)}" +
    ".mb h2{margin:0 0 8px;font-size:18px;display:flex;justify-content:space-between;align-items:center}" +
    ".mb h2 button{background:transparent;border:0;color:#fff;font-size:22px;cursor:pointer}" +
    ".mt{display:flex;gap:6px;margin-bottom:10px}.mt button{flex:1;font:700 13px inherit;padding:8px 4px;border-radius:9px;border:1px solid rgba(255,255,255,.25);background:transparent;color:#fff;cursor:pointer}" +
    ".mt button.on{background:#FF9F1C;color:#2a1700;border-color:transparent}" +
    ".mf{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px}.mf button{font:600 11.5px inherit;padding:5px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:transparent;color:#fff;cursor:pointer}.mf button.on{background:#fff;color:#111}" +
    ".mr{display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:9px;background:rgba(255,255,255,.07);margin-bottom:5px;font-size:14px}.mr.me{outline:2px solid #FF9F1C;background:rgba(255,159,28,.14)}" +
    ".mr i{font-style:normal;width:26px;text-align:center;font-weight:800;color:#ffd23f}.mr .nm{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mr small{opacity:.65;display:block;font-size:11px}.mr b{color:#ffd23f}" +
    ".mi{display:flex;gap:8px;align-items:center;padding:9px;border-radius:10px;background:rgba(255,255,255,.08);margin-bottom:6px}.mi span{flex:1;font-size:13px}.mi small{display:block;opacity:.7;font-size:11.5px}" +
    ".mi button,.mp button.ok{font:700 13px inherit;padding:8px 12px;border-radius:9px;border:0;background:#FF9F1C;color:#2a1700;cursor:pointer}.mi button:disabled{opacity:.4}" +
    ".mp input{width:100%;font:600 16px inherit;padding:10px;border-radius:9px;border:1px solid rgba(255,255,255,.3);background:#0e141b;color:#fff;margin:6px 0}" +
    ".mp p{font-size:12.5px;opacity:.8;margin:4px 0}.av{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}.av button{font-size:24px;padding:6px 9px;border-radius:10px;border:2px solid transparent;background:rgba(255,255,255,.08);cursor:pointer;position:relative}.av button.on{border-color:#FF9F1C}.av button small{display:block;font-size:10px;color:#ffd23f}" +
    ".mn{font-size:13px;opacity:.85;text-align:center;padding:12px}";
  document.head.appendChild(css);
  var pill = document.createElement("div"), win = document.createElement("div"), tab = "rating", gf = "all";
  pill.className = "mpill"; pill.setAttribute("role", "button"); pill.setAttribute("aria-label", "Монети, магазин і рейтинг");
  pill.onclick = function () { M.open(); };
  win.className = "mw"; win.onclick = function (e) { if (e.target === win) win.classList.remove("on"); };
  function paint() { pill.innerHTML = "🪙 " + M.coins + " · 🏆"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function render() {
    var h = '<div class="mb"><h2><span>🏆 Кунівська ліга</span><button aria-label="Закрити" id="mx">✕</button></h2><div class="mt">' +
      [["rating", "🏆 Рейтинг"], ["shop", "🛒 Магазин"], ["me", "👤 Я"]].map(function (t) { return '<button data-t="' + t[0] + '"' + (tab === t[0] ? ' class="on"' : "") + ">" + t[1] + "</button>"; }).join("") + '</div><div id="mc"></div></div>';
    win.innerHTML = h;
    win.querySelector("#mx").onclick = function () { win.classList.remove("on"); };
    Array.prototype.forEach.call(win.querySelectorAll(".mt button"), function (b) { b.onclick = function () { tab = b.getAttribute("data-t"); render(); }; });
    var c = win.querySelector("#mc");
    if (tab === "rating") viewRating(c); else if (tab === "shop") viewShop(c); else viewMe(c);
  }
  function viewRating(c) {
    c.innerHTML = '<div class="mn">Завантаження…</div>';
    M.list(function (arr, online) {
      var f = '<div class="mf"><button data-g="all"' + (gf === "all" ? ' class="on"' : "") + ">Усі ігри</button>" + Object.keys(GAMES).map(function (k) { return '<button data-g="' + k + '"' + (gf === k ? ' class="on"' : "") + ">" + GAMES[k] + "</button>"; }).join("") + "</div>";
      arr.forEach(function (x) { x.s = gf === "all" ? x.p : Math.round((x.g || {})[gf] || 0); });
      arr = arr.filter(function (x) { return x.s > 0 || x.me; }).sort(function (a, b) { return b.s - a.s; });
      var rows = arr.slice(0, 30).map(function (x, i) {
        return '<div class="mr' + (x.me ? " me" : "") + '"><i>' + (i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1) + "</i><span style='font-size:22px'>" + esc(x.a) + '</span><span class="nm">' + esc(x.n) + "<small>" + M.title(x.p) + "</small></span><b>" + x.s + "</b></div>";
      }).join("");
      c.innerHTML = f + (rows || '<div class="mn">Поки нікого. Зіграй і стань першим!</div>') +
        (online ? "" : '<div class="mn">Рейтинг поки показує лише твої результати на цьому пристрої.</div>') +
        (M.nick ? "" : '<div class="mn">Щоб потрапити в рейтинг, вибери ім’я на вкладці «Я».</div>');
      Array.prototype.forEach.call(c.querySelectorAll(".mf button"), function (b) { b.onclick = function () { gf = b.getAttribute("data-g"); render(); }; });
    });
  }
  function viewShop(c) {
    var p = M.perks();
    c.innerHTML = '<div class="mn" style="padding:0 0 8px">У тебе: <b style="color:#ffd23f">🪙 ' + M.coins + "</b></div>" +
      SHOP.map(function (s) { return '<div class="mi"><span>' + s.ic + " <b>" + s.n + "</b> (є: " + (p[s.id] || 0) + ")<small>" + s.d + '</small></span><button data-s="' + s.id + '"' + (M.coins < s.p ? " disabled" : "") + ">🪙 " + s.p + "</button></div>"; }).join("") +
      '<div class="mn">Бонус використовується автоматично на початку наступної гри. Очки рейтингу за монети купити не можна: тільки гра!</div>';
    Array.prototype.forEach.call(c.querySelectorAll("[data-s]"), function (b) {
      b.onclick = function () { var s = SHOP.filter(function (x) { return x.id === b.getAttribute("data-s"); })[0]; if (M.spend(s.p)) { var q = M.perks(); q[s.id] = (q[s.id] || 0) + 1; ls("perks", JSON.stringify(q)); if (window.SFXLIB) SFXLIB.seq([660, 880], 0.07, "triangle", 0.15); render(); } };
    });
  }
  function viewMe(c) {
    var t = M.total(), tt = M.title(t), have = js("avas", ["🙂", "🦦"]);
    c.innerHTML = '<div class="mp"><div style="font-size:15px">' + esc(M.avatar) + " <b>" + esc(M.nick || "Без імені") + "</b> · " + tt + " · " + t + ' очок</div>' +
      "<p>Ім’я для рейтингу (до 14 символів). Не пиши справжнє прізвище, краще придумай псевдонім.</p>" +
      '<input id="nk" maxlength="14" placeholder="Наприклад: Куниця_7" value="' + esc(M.nick) + '" autocomplete="off">' +
      "<p>Аватар:</p><div class=\"av\">" + AVA.map(function (x) { var own = have.indexOf(x.a) >= 0; return '<button data-a="' + x.a + '" class="' + (M.avatar === x.a ? "on" : "") + '">' + x.a + (own ? "" : "<small>🪙" + x.p + "</small>") + "</button>"; }).join("") + '</div><button class="ok" id="sv">Зберегти</button><div id="er" class="mn" style="color:#ff8c8c"></div></div>';
    var sel = M.avatar;
    Array.prototype.forEach.call(c.querySelectorAll("[data-a]"), function (b) {
      b.onclick = function () {
        var a = b.getAttribute("data-a"), x = AVA.filter(function (z) { return z.a === a; })[0], h = js("avas", ["🙂", "🦦"]);
        if (h.indexOf(a) < 0) { if (!M.spend(x.p)) { c.querySelector("#er").textContent = "Не вистачає монет"; return; } h.push(a); ls("avas", JSON.stringify(h)); }
        ls("ava", a); M.push(); render();
      };
    });
    c.querySelector("#sv").onclick = function () {
      var v = c.querySelector("#nk").value.trim().replace(/\s+/g, " ");
      if (v.length < 2) { c.querySelector("#er").textContent = "Занадто коротке ім’я"; return; }
      if (BAD.test(v) || !/^[\p{L}\p{N} _.\-]+$/u.test(v)) { c.querySelector("#er").textContent = "Це ім’я не підходить. Придумай інше"; return; }
      ls("nick", v); M.push(); tab = "rating"; render();
    };
  }
  M.open = function (t) { if (t) tab = Array.isArray(t) ? t[0] : t; render(); win.classList.add("on"); };
  function mount() { if (!window.META_NOPILL) document.body.appendChild(pill); document.body.appendChild(win); paint(); }
  if (document.body) mount(); else addEventListener("DOMContentLoaded", mount);
  M.push();
  window.META = M;
})();
