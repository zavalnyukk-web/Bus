/* Спільні звуки для ігор (створюються кодом). Вимкнення звуку спільне для всіх ігор. */
(function () {
  var AC = null, muted = false;
  try { muted = localStorage.getItem("bus.game.mute") === "1"; } catch (e) {}
  function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === "suspended") AC.resume(); return AC; }
  function tone(f, d, type, vol, when, slide) {
    if (muted) return; var a = ac(); if (!a) return;
    var t0 = a.currentTime + (when || 0), o = a.createOscillator(), gn = a.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + d);
    gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.012); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(gn); gn.connect(a.destination); o.start(t0); o.stop(t0 + d + 0.03);
  }
  function noise(d, vol, freq, type) {
    if (muted) return; var a = ac(); if (!a) return;
    var n = Math.max(1, Math.floor(a.sampleRate * d)), buf = a.createBuffer(1, n, a.sampleRate), ch = buf.getChannelData(0);
    for (var i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = a.createBufferSource(), fl = a.createBiquadFilter(), gn = a.createGain();
    fl.type = type || "lowpass"; fl.frequency.value = freq || 900; gn.gain.value = vol; src.buffer = buf; src.connect(fl); fl.connect(gn); gn.connect(a.destination); src.start();
  }
  function label(b) { if (b) b.textContent = muted ? "🔇 Звук вимк." : "🔊 Звук увімк."; }
  window.SFXLIB = {
    tone: tone, noise: noise, ac: ac,
    bind: function (btn) {
      label(btn); if (!btn) return;
      btn.addEventListener("click", function () { muted = !muted; try { localStorage.setItem("bus.game.mute", muted ? "1" : "0"); } catch (e) {} label(btn); if (!muted) { ac(); tone(660, 0.09, "sine", 0.18); } });
    },
    seq: function (notes, step, type, vol) { notes.forEach(function (f, i) { tone(f, step * 1.3, type || "triangle", vol || 0.2, i * step); }); }
  };
})();
