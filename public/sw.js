// Uchqun.ai Service Worker — push notifications

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
    icon: data.icon || "/icon-192.png",
    badge: "/icon-192.png",
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
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));
