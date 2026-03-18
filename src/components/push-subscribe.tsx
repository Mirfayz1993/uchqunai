"use client";

import { useState, useEffect } from "react";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

type Status = "unknown" | "unsupported" | "denied" | "subscribed" | "unsubscribed";

export function PushSubscribe() {
  const [status, setStatus] = useState<Status>("unknown");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    // SW ro'yxatdan o'tkazish
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      setStatus(existing ? "subscribed" : "unsubscribed");
    }).catch(() => setStatus("unsupported"));
  }, []);

  async function subscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      // VAPID public key olish
      const keyRes = await fetch("/api/push/subscribe");
      const { publicKey } = await keyRes.json();

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      setStatus("subscribed");
    } catch {
      if (Notification.permission === "denied") setStatus("denied");
    }
    setLoading(false);
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("unsubscribed");
    } catch {
      // ignore
    }
    setLoading(false);
  }

  if (status === "unsupported" || status === "unknown") return null;

  if (status === "denied") {
    return (
      <span className="text-xs text-gray-400 dark:text-[#a78bfa]/40 px-2">
        🔕 Bildirishnomalar bloklangan
      </span>
    );
  }

  if (status === "subscribed") {
    return (
      <button
        onClick={unsubscribe}
        disabled={loading}
        className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
        title="Bildirishnomalarni o'chirish"
      >
        <span>🔔</span>
        <span className="hidden sm:inline">Eslatmalar yoqilgan</span>
      </button>
    );
  }

  return (
    <button
      onClick={subscribe}
      disabled={loading}
      className="flex items-center gap-1 text-xs text-purple-600 dark:text-[#a78bfa] hover:text-purple-800 dark:hover:text-[#c4b5fd] transition-colors px-2 py-1 rounded-lg hover:bg-purple-50 dark:hover:bg-[#8b5cf6]/10"
      title="Eslatmalarni yoqish"
    >
      <span>🔕</span>
      <span className="hidden sm:inline">{loading ? "..." : "Eslatmalarni yoqish"}</span>
    </button>
  );
}
