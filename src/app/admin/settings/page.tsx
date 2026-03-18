"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { initialBots } from "@/data/bots";

type BotAdmin = {
  id: string;
  botSlug: string;
  username: string;
  createdAt: string;
  updatedAt: string;
};

export default function SettingsPage() {
  const [botAdmins, setBotAdmins] = useState<BotAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  // Change admin password
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Add/Edit bot admin
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ botSlug: "", username: "", password: "" });
  const [formMsg, setFormMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchBotAdmins();
  }, []);

  async function fetchBotAdmins() {
    setLoading(true);
    const res = await fetch("/api/admin/bot-admins");
    if (res.ok) setBotAdmins(await res.json());
    setLoading(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: "error", text: "Yangi parollar mos kelmadi" });
      return;
    }
    setPwdLoading(true);
    setPwdMsg(null);
    const res = await fetch("/api/admin/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
    });
    const data = await res.json();
    setPwdMsg({ type: res.ok ? "success" : "error", text: res.ok ? "Parol muvaffaqiyatli o'zgartirildi" : data.error });
    if (res.ok) { setCurrentPwd(""); setNewPwd(""); setConfirmPwd(""); }
    setPwdLoading(false);
  }

  async function handleSaveBotAdmin(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormMsg(null);

    if (editId) {
      // Update password only
      const res = await fetch(`/api/admin/bot-admins/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: form.password }),
      });
      const data = await res.json();
      setFormMsg({ type: res.ok ? "success" : "error", text: res.ok ? "Parol yangilandi" : data.error });
      if (res.ok) { setEditId(null); setForm({ botSlug: "", username: "", password: "" }); fetchBotAdmins(); }
    } else {
      // Create new
      const res = await fetch("/api/admin/bot-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setFormMsg({ type: res.ok ? "success" : "error", text: res.ok ? "Bot admin yaratildi" : data.error });
      if (res.ok) { setForm({ botSlug: "", username: "", password: "" }); fetchBotAdmins(); }
    }
    setFormLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu bot adminni o'chirasizmi?")) return;
    await fetch(`/api/admin/bot-admins/${id}`, { method: "DELETE" });
    fetchBotAdmins();
  }

  const botsWithoutAdmin = initialBots.filter(
    (b) => b.slug !== "umumiy" && !botAdmins.find((a) => a.botSlug === b.slug)
  );

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold gradient-text">Sozlamalar</h1>

      {/* ── Admin parolini o'zgartirish ── */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f0e6ff]">🔑 Admin parolini o'zgartirish</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          {pwdMsg && (
            <div className={`p-3 rounded-xl text-sm ${pwdMsg.type === "success" ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"}`}>
              {pwdMsg.text}
            </div>
          )}
          <PasswordInput placeholder="Joriy parol" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} required className="glass-input" />
          <PasswordInput placeholder="Yangi parol" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required className="glass-input" />
          <PasswordInput placeholder="Yangi parolni tasdiqlang" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required className="glass-input" />
          <Button type="submit" disabled={pwdLoading} className="bg-gradient-to-r from-purple-600 to-amber-500 text-white">
            {pwdLoading ? "Saqlanmoqda..." : "Parolni o'zgartirish"}
          </Button>
        </form>
      </div>

      {/* ── Bot adminlar ── */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f0e6ff]">👥 Uka adminlari</h2>
        <p className="text-sm text-gray-500 dark:text-[#a78bfa]/60">
          Har bir uka uchun alohida login/parol — faqat o'z ukasining bilim bazasini boshqara oladi.
        </p>

        {/* Existing admins */}
        {loading ? (
          <p className="text-sm text-gray-400">Yuklanmoqda...</p>
        ) : botAdmins.length > 0 ? (
          <div className="space-y-2">
            {botAdmins.map((ba) => {
              const bot = initialBots.find((b) => b.slug === ba.botSlug);
              return (
                <div key={ba.id} className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 dark:bg-[#8b5cf6]/5 border border-purple-100 dark:border-[#8b5cf6]/10">
                  <div className="flex items-center gap-3">
                    {bot?.image ? (
                      <img src={bot.image} alt={bot.name} className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <span className="text-xl">{bot?.icon || "🤖"}</span>
                    )}
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-[#f0e6ff]">{bot?.name || ba.botSlug}</p>
                      <p className="text-xs text-gray-500 dark:text-[#a78bfa]/50">Login: <span className="font-mono">{ba.username}</span></p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditId(ba.id); setForm({ botSlug: ba.botSlug, username: ba.username, password: "" }); setFormMsg(null); }}
                      className="text-xs"
                    >
                      Parol
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(ba.id)} className="text-xs text-red-500 border-red-200 hover:bg-red-50">
                      O'chir
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-[#a78bfa]/40">Hali bot admin yaratilmagan</p>
        )}

        {/* Add / Edit form */}
        <form onSubmit={handleSaveBotAdmin} className="space-y-3 border-t border-purple-100 dark:border-[#8b5cf6]/10 pt-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-[#a78bfa]">
            {editId ? "Parolni yangilash" : "Yangi bot admin qo'shish"}
          </h3>
          {formMsg && (
            <div className={`p-3 rounded-xl text-sm ${formMsg.type === "success" ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"}`}>
              {formMsg.text}
            </div>
          )}

          {!editId && (
            <>
              <select
                value={form.botSlug}
                onChange={(e) => setForm({ ...form, botSlug: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl border border-purple-200/30 dark:border-[#8b5cf6]/20 bg-white dark:bg-[#1a1025] text-gray-900 dark:text-[#f0e6ff] text-sm"
              >
                <option value="">Uka tanlang</option>
                {botsWithoutAdmin.map((b) => (
                  <option key={b.slug} value={b.slug}>{b.name}</option>
                ))}
                {/* Show all if editing */}
              </select>
              <Input
                placeholder="Login (masalan: bugalter_admin)"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                className="glass-input"
              />
            </>
          )}
          {editId && (
            <p className="text-xs text-gray-500">Login: <span className="font-mono font-medium">{form.username}</span></p>
          )}
          <PasswordInput
            placeholder={editId ? "Yangi parol" : "Parol"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="glass-input"
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={formLoading} className="bg-gradient-to-r from-purple-600 to-amber-500 text-white text-sm">
              {formLoading ? "..." : editId ? "Yangilash" : "Qo'shish"}
            </Button>
            {editId && (
              <Button type="button" variant="outline" onClick={() => { setEditId(null); setForm({ botSlug: "", username: "", password: "" }); setFormMsg(null); }} className="text-sm">
                Bekor
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
