/* Анонімна статистика: скільки пристроїв відкрило сайт і скільки разів грали.
   Нічого особистого не зберігається: лише числа по днях. Свої пристрої можна виключити:
   відкрийте сайт з додаванням ?nostat до адреси один раз. */
(function () {
  var C = window.CONFIG;
  function ok() { return C && C.dbUrl && String(C.dbUrl).indexOf("ВАШ") === -1 && C.key; }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  if (/[?&]nostat\b/.test(location.search)) ls("bus.nostat", "1");
  if (ls("bus.nostat") === "1" || /[#&]demo/.test(location.hash)) { window.trackPlay = function () {}; return; }
  function day() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function inc(path) {
    if (!ok()) return;
    try { fetch(C.dbUrl + "/bus/" + C.key + "/stats/" + path + ".json", { method: "PUT", body: JSON.stringify({ ".sv": { increment: 1 } }), keepalive: true }).catch(function () {}); } catch (e) {}
  }
  var d = day();
  if (ls("bus.seen.day") !== d) {
    ls("bus.seen.day", d);
    inc("days/" + d);
    if (!ls("bus.seen.ever")) { ls("bus.seen.ever", "1"); inc("devices"); }
  }
  var seen = {};
  window.trackPlay = function (name) { if (seen[name]) return; seen[name] = 1; inc("plays/" + name + "/" + day()); };
})();
