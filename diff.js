/* Спільне для ігор: рівень складності (Легко / Нормально / Складно) і тренер Артурович.
   DIFF.i  = 0 легко, 1 нормально, 2 складно (зберігається в браузері, один для всіх ігор)
   DIFF.pick(a, b, c)  = значення для поточної складності
   DIFF.mount(батько, перед)  = малює перемикач
   DIFF.on(функція)    = викликається, коли складність змінили
   DIFF.coach(батько, "wave"|"thumb"|"medal"|"win", "текст")  = Артурович з репискою */
(function () {
  var NAMES = ["Легко", "Нормально", "Складно"], ICON = ["🙂", "😐", "🔥"], KEY = "bus.diff";
  var cur = 1, subs = [];
  try { var v = localStorage.getItem(KEY); if (v !== null && +v >= 0 && +v <= 2) cur = +v; } catch (e) {}
  var css = document.createElement("style");
  css.textContent =
    ".dif{display:flex;gap:5px;justify-content:center;flex-wrap:wrap;align-items:center;font-size:12px;font-weight:700;color:#fff}" +
    ".dif b{font-weight:700;opacity:.8;flex-basis:100%;text-align:center}" +
    ".dif button{font:inherit;font-size:12.5px;font-weight:700;padding:7px 9px;border-radius:999px;border:1.5px solid rgba(255,255,255,.4);background:transparent;color:#fff;cursor:pointer;min-height:34px}" +
    ".dif button[aria-pressed=true]{background:var(--amber,#FF9F1C);color:#2a1700;border-color:transparent}" +
    ".coach{display:flex;align-items:flex-end;gap:8px;max-width:320px;margin:0 auto;text-align:left}" +
    ".coach img{height:78px;width:auto;flex:none;border-radius:0!important;object-fit:contain!important;filter:drop-shadow(0 3px 5px rgba(0,0,0,.55))}" +
    ".coach span{background:#fff;color:#1b1b1b;font-size:13px;line-height:1.35;padding:8px 11px;border-radius:12px 12px 12px 3px;font-weight:600}";
  document.head.appendChild(css);
  function paint() {
    var bars = document.querySelectorAll(".dif");
    for (var k = 0; k < bars.length; k++) {
      var bt = bars[k].querySelectorAll("button");
      for (var j = 0; j < bt.length; j++) bt[j].setAttribute("aria-pressed", j === cur ? "true" : "false");
    }
  }
  var D = {
    names: NAMES,
    get i() { return cur; },
    get name() { return NAMES[cur]; },
    pick: function (a, b, c) { return cur === 0 ? a : cur === 1 ? b : c; },
    on: function (f) { subs.push(f); },
    set: function (n) {
      cur = n; try { localStorage.setItem(KEY, String(n)); } catch (e) {}
      paint(); subs.forEach(function (f) { try { f(n); } catch (e) { if (window.console) console.error(e); } });
    },
    mount: function (host, before) {
      var bar = document.createElement("div"); bar.className = "dif"; bar.setAttribute("role", "group"); bar.setAttribute("aria-label", "Складність");
      var lab = document.createElement("b"); lab.textContent = "Складність:"; bar.appendChild(lab);
      NAMES.forEach(function (n, j) {
        var b = document.createElement("button"); b.type = "button"; b.textContent = ICON[j] + " " + n;
        b.onclick = function () { if (window.SFXLIB && SFXLIB.ac) { try { SFXLIB.ac(); } catch (e) {} } D.set(j); };
        bar.appendChild(b);
      });
      if (before && before.parentNode === host) host.insertBefore(bar, before); else host.appendChild(bar);
      paint(); return bar;
    },
    coach: function (host, pose, text) {
      var c = host.querySelector(".coach");
      if (!c) {
        c = document.createElement("div"); c.className = "coach";
        c.innerHTML = '<img alt="Артурович"><span></span>';
        var bar = host.querySelector(".dif");
        if (bar) host.insertBefore(c, bar); else host.appendChild(c);
      }
      c.querySelector("img").src = "art-" + pose + ".png"; c.querySelector("span").textContent = text;
      c.hidden = !text;
    },
    coachFor: function (host, kind) {
      var P = { start: "wave", win: "win", lose: "thumb", final: "medal" };
      var L = {
        start: [["Привіт! Я Артурович. Починаємо з легкого: розімнемось!", "Привіт! Я Артурович. Нормальний темп, давай спробуємо!", "Ага, сміливець! Я Артурович, і легко не буде!"]],
        win: [["Молодець! Так тримати!", "Чудово! Це зараховано!", "Сильно! Я пишаюсь тобою!"]],
        lose: [["Нічого страшного, спробуй ще раз!", "Не вийшло, зате була розминка. Ще раз!", "Майже! Ще одна спроба, і вийде!"]],
        final: [["Це золото! Ти чемпіон ліцею!", "Медаль твоя! Фізрук у захваті!"]]
      }[kind];
      var t = kind === "start" ? L[0][cur] : L[0][Math.floor(Math.random() * L[0].length)];
      D.coach(host, P[kind], t);
    }
  };
  window.DIFF = D;
})();
