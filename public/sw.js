// Uchqun.ai Service Worker — PWA + Push Notifications

const CACHE_NAME = "uchqunai-v1";
const STATIC_ASSETS = [
  "/",
  "/bots",
  "/manifest.json",
  "/favicon.png",
  "/logo.png",
];

// ── Install: static assetlarni cache ga olish ──────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: eski cache larni o'chirish ───────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first, offline fallback ─────────────────────────────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API so'rovlarini cache qilmaymiz
  if (url.pathname.startsWith("/api/")) return;

  // Navigation (sahifa o'tish) — network first
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match("/").then((r) => r || new Response("Offline", { status: 503 }))
      )
    );
    return;
  }

  // Statik fayllar — cache first
  event.respondWith(
    caches.match(event.request).then(
      (cached) => cached || fetch(event.request).then((res) => {
        if (res.ok && event.request.method === "GET") {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return res;
      })
    )
  );
});

// ── Push Notifications ─────────────────────────────────────────────────────
self.addEventListener("push", function (event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Uchqun.ai", body: event.data.text() };
  }

  const options = {
    body: data.body || "",
    icon: data.icon || "/favicon.png",
    badge: "/favicon.png",
    tag: data.tag || "uchqunai-reminder",
    renotify: true,
    data: { url: data.url || "/chat/umumiy" },
    actions: [
      { action: "open", title: "Ochish" },
      { action: "dismiss", title: "Yopish" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Uchqun.ai eslatma", options)
  );
});

// ── Notification click ─────────────────────────────────────────────────────
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/chat/umumiy";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
