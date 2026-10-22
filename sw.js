/* Picking Serena · service worker
   Recebe as notificações push (novo pedido para separar) mesmo com o app fechado. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data && e.data.text() }; }
  e.waitUntil((async () => {
    await self.registration.showNotification(d.title || "Picking Serena", {
      body: d.body || "Novo pedido para separar",
      tag: d.tag || "picking-serena",
      renotify: true,
      requireInteraction: true,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      vibrate: [300, 120, 300, 120, 500],
      data: { url: d.url || "/" }
    });
  })());
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "/", self.location.origin).href;
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of list) {
      if (c.url.startsWith(self.location.origin)) { await c.focus(); c.postMessage({ type: "ps-open", url }); return; }
    }
    await self.clients.openWindow(url);
  })());
});
