"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StatsCard } from "@/components/admin/stats-card";

type BotStat = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  category: string;
  description: string;
  documentCount: number;
  conversationCount: number;
  messageCount: number;
};

type Stats = {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  totalDocuments: number;
  botStats: BotStat[];
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats(data);
      } catch {
        setError("Statistikani yuklashda xatolik");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 dark:text-[#a78bfa]/60 animate-pulse text-lg">
          Yuklanmoqda...
        </p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-500">{error || "Xatolik yuz berdi"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in-up">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-[#a78bfa]/50 mt-1">
          Uchqun.ai boshqaruv paneli
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon="👥" label="Foydalanuvchilar" value={stats.totalUsers} color="purple" />
        <StatsCard icon="💬" label="Suhbatlar" value={stats.totalConversations} color="blue" />
        <StatsCard icon="📝" label="Xabarlar" value={stats.totalMessages} color="green" />
        <StatsCard icon="📚" label="Hujjatlar (RAG)" value={stats.totalDocuments} color="amber" />
      </div>

      {/* Bots table */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f0e6ff] mb-4">
          Ukalar va bilim bazasi
        </h2>
        <div className="glass-card rounded-2xl overflow-hidden border border-purple-200/20 dark:border-[#8b5cf6]/10">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-200/20 dark:border-[#8b5cf6]/10">
                  <th className="text-left text-sm font-medium text-gray-500 dark:text-[#a78bfa]/60 px-4 py-3">Uka</th>
                  <th className="text-left text-sm font-medium text-gray-500 dark:text-[#a78bfa]/60 px-4 py-3 hidden sm:table-cell">Kategoriya</th>
                  <th className="text-center text-sm font-medium text-gray-500 dark:text-[#a78bfa]/60 px-4 py-3">Hujjatlar</th>
                  <th className="text-center text-sm font-medium text-gray-500 dark:text-[#a78bfa]/60 px-4 py-3 hidden sm:table-cell">Suhbatlar</th>
                  <th className="text-center text-sm font-medium text-gray-500 dark:text-[#a78bfa]/60 px-4 py-3 hidden md:table-cell">Xabarlar</th>
                  <th className="text-right text-sm font-medium text-gray-500 dark:text-[#a78bfa]/60 px-4 py-3">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {stats.botStats.map((bot) => (
                  <tr
                    key={bot.id}
                    className="border-b border-purple-200/10 dark:border-[#8b5cf6]/5 hover:bg-purple-50/50 dark:hover:bg-[#8b5cf6]/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{bot.icon}</span>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-[#f0e6ff]">{bot.name}</p>
                          <p className="text-xs text-gray-400 dark:text-[#a78bfa]/40 sm:hidden">{bot.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-[#a78bfa]/60 hidden sm:table-cell">
                      {bot.category}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-medium ${
                        bot.documentCount > 0
                          ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400"
                          : "bg-gray-100 dark:bg-gray-500/20 text-gray-500 dark:text-gray-400"
                      }`}>
                        {bot.documentCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500 dark:text-[#a78bfa]/60 hidden sm:table-cell">
                      {bot.conversationCount}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500 dark:text-[#a78bfa]/60 hidden md:table-cell">
                      {bot.messageCount}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/bots/${bot.slug}`}
                        className="text-sm text-purple-600 dark:text-[#a78bfa] hover:text-amber-600 dark:hover:text-[#fbbf24] font-medium transition-colors"
                      >
                        Bilimlar →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
