"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DocumentForm } from "@/components/admin/document-form";

type Bot = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  category: string;
  description: string;
  documentCount: number;
};

type Document = {
  id: string;
  title: string;
  content: string;
  sourceUrl: string | null;
  createdAt: string;
};

type DocumentsResponse = {
  documents: Document[];
  total: number;
  page: number;
  totalPages: number;
};

export default function BotKnowledgePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [bot, setBot] = useState<Bot | null>(null);
  const [docs, setDocs] = useState<DocumentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  const fetchBot = useCallback(async () => {
    const res = await fetch("/api/admin/bots");
    if (!res.ok) throw new Error("Failed to fetch bots");
    const bots: Bot[] = await res.json();
    const found = bots.find((b) => b.slug === slug);
    if (!found) throw new Error("Bot topilmadi");
    setBot(found);
    return found;
  }, [slug]);

  const fetchDocuments = useCallback(async (botId: string, pageNum: number) => {
    const res = await fetch(`/api/admin/bots/${botId}/documents?page=${pageNum}`);
    if (!res.ok) throw new Error("Failed to fetch documents");
    const data: DocumentsResponse = await res.json();
    setDocs(data);
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const foundBot = await fetchBot();
        await fetchDocuments(foundBot.id, 1);
      } catch {
        setError("Ma'lumotlarni yuklashda xatolik");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [fetchBot, fetchDocuments]);

  async function handleAdd(data: { title: string; content: string; sourceUrl: string }) {
    if (!bot) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/bots/${bot.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add document");
      const result = await res.json();
      setShowAddForm(false);
      setSuccessMessage(
        result.chunks > 1
          ? `✅ Hujjat ${result.chunks} ta bo'lakka bo'linib qo'shildi`
          : "✅ Hujjat muvaffaqiyatli qo'shildi"
      );
      setTimeout(() => setSuccessMessage(""), 5000);
      await fetchDocuments(bot.id, page);
      await fetchBot();
    } catch {
      setError("Hujjat qo'shishda xatolik");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleEdit(data: { title: string; content: string; sourceUrl: string }) {
    if (!editingDoc || !bot) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/documents/${editingDoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update document");
      setEditingDoc(null);
      await fetchDocuments(bot.id, page);
    } catch {
      setError("Hujjat yangilashda xatolik");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(docId: string) {
    if (!bot) return;
    setDeletingId(docId);
    try {
      const res = await fetch(`/api/admin/documents/${docId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete document");
      await fetchDocuments(bot.id, page);
      await fetchBot();
    } catch {
      setError("Hujjat o'chirishda xatolik");
    } finally {
      setDeletingId(null);
    }
  }

  async function handlePageChange(newPage: number) {
    if (!bot) return;
    setPage(newPage);
    setLoading(true);
    try {
      await fetchDocuments(bot.id, newPage);
    } catch {
      setError("Sahifani yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }

  if (loading && !bot) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 dark:text-[#a78bfa]/60 animate-pulse text-lg">Yuklanmoqda...</p>
      </div>
    );
  }

  if (error && !bot) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in-up">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#a78bfa]/50">
        <Link href="/admin" className="hover:text-purple-600 dark:hover:text-[#a78bfa] transition-colors">
          Dashboard
        </Link>
        <span>→</span>
        <span className="text-gray-900 dark:text-[#f0e6ff]">{bot?.name}</span>
      </div>

      {/* Bot header */}
      {bot && (
        <div className="glass-card rounded-2xl p-5 border border-purple-200/20 dark:border-[#8b5cf6]/10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{bot.icon}</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-[#f0e6ff]">{bot.name}</h1>
                <p className="text-sm text-gray-500 dark:text-[#a78bfa]/60">{bot.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-[#a78bfa]/50">
                {docs?.total || 0} ta hujjat
              </span>
              <Button
                onClick={() => { setShowAddForm(true); setEditingDoc(null); }}
                className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-[#8b5cf6] dark:to-[#7c3aed] hover:from-purple-500 hover:to-purple-600 dark:hover:from-[#a78bfa] dark:hover:to-[#8b5cf6] text-white shadow-[0_0_15px_rgba(124,58,237,0.2)] dark:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300"
              >
                + Hujjat qo'shish
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="p-3 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200/50 dark:border-green-500/20">
          <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f0e6ff] mb-3">
            Yangi hujjat qo'shish
          </h2>
          <DocumentForm
            onSubmit={handleAdd}
            onCancel={() => setShowAddForm(false)}
            loading={formLoading}
          />
        </div>
      )}

      {/* Edit form */}
      {editingDoc && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f0e6ff] mb-3">
            Hujjatni tahrirlash
          </h2>
          <DocumentForm
            initialData={{
              title: editingDoc.title,
              content: editingDoc.content,
              sourceUrl: editingDoc.sourceUrl || "",
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditingDoc(null)}
            loading={formLoading}
          />
        </div>
      )}

      {/* Documents list */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f0e6ff] mb-3">
          Hujjatlar
        </h2>
        {docs && docs.documents.length > 0 ? (
          <div className="space-y-3">
            {docs.documents.map((doc) => (
              <div
                key={doc.id}
                className="glass-card rounded-xl p-4 border border-purple-200/20 dark:border-[#8b5cf6]/10 hover:border-purple-300/30 dark:hover:border-[#8b5cf6]/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-[#f0e6ff] text-sm">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-[#a78bfa]/40 mt-1 line-clamp-2">
                      {doc.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-[#a78bfa]/40">
                      <span>{new Date(doc.createdAt).toLocaleDateString("uz-UZ")}</span>
                      {doc.sourceUrl && (
                        <a
                          href={doc.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-500 dark:text-[#a78bfa] hover:underline truncate max-w-[200px]"
                        >
                          {doc.sourceUrl}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => { setEditingDoc(doc); setShowAddForm(false); }}
                      className="text-xs px-2.5 py-1.5 rounded-lg text-purple-600 dark:text-[#a78bfa] hover:bg-purple-50 dark:hover:bg-[#8b5cf6]/10 transition-colors"
                    >
                      ✏️ Tahrirlash
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Bu hujjatni o'chirishni xohlaysizmi?")) {
                          handleDelete(doc.id);
                        }
                      }}
                      disabled={deletingId === doc.id}
                      className="text-xs px-2.5 py-1.5 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      {deletingId === doc.id ? "..." : "🗑️ O'chirish"}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {docs.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="border-purple-300/40 dark:border-[#8b5cf6]/30 text-purple-600 dark:text-[#a78bfa]"
                >
                  ← Oldingi
                </Button>
                <span className="text-sm text-gray-500 dark:text-[#a78bfa]/60">
                  {page} / {docs.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= docs.totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  className="border-purple-300/40 dark:border-[#8b5cf6]/30 text-purple-600 dark:text-[#a78bfa]"
                >
                  Keyingi →
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-8 border border-purple-200/20 dark:border-[#8b5cf6]/10 text-center">
            <span className="text-3xl block mb-3">📭</span>
            <p className="text-gray-500 dark:text-[#a78bfa]/60">
              Bu ukaga hali hujjat qo'shilmagan
            </p>
            <p className="text-sm text-gray-400 dark:text-[#a78bfa]/40 mt-1">
              Hujjat qo'shish orqali ukaning bilimini oshiring
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
