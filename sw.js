/* Мінімальний service worker: потрібен для встановлення на головний екран і для показу сповіщень. */
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function () {});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    if (cs.length) return cs[0].focus();
    return self.clients.openWindow('./');
  }));
});

/* Web Push: показуємо сповіщення, навіть коли сайт закритий */
self.addEventListener('push', function (e) {
  var d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Шкільний автобус', {
    body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: d.tag || 'bus', renotify: true, vibrate: [200, 100, 200], data: { url: d.url || './' }
  }));
});
