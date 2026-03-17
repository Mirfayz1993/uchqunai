"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type DocumentFormProps = {
  initialData?: {
    title: string;
    content: string;
    sourceUrl: string;
  };
  onSubmit: (data: { title: string; content: string; sourceUrl: string }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
};

export function DocumentForm({ initialData, onSubmit, onCancel, loading }: DocumentFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [sourceUrl, setSourceUrl] = useState(initialData?.sourceUrl || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({ title, content, sourceUrl });
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 border border-purple-200/20 dark:border-[#8b5cf6]/10 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-[#c4b5fd] mb-1.5">
          Sarlavha *
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Masalan: Mehnat kodeksi 27-modda"
          className="glass-input border-purple-200/30 dark:border-[#8b5cf6]/20 text-gray-900 dark:text-[#f0e6ff] placeholder:text-gray-400 dark:placeholder:text-[#a78bfa]/30"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-[#c4b5fd] mb-1.5">
          Mazmun *
        </label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Hujjat mazmunini kiriting..."
          rows={8}
          className="glass-input border-purple-200/30 dark:border-[#8b5cf6]/20 text-gray-900 dark:text-[#f0e6ff] placeholder:text-gray-400 dark:placeholder:text-[#a78bfa]/30 resize-y min-h-[150px]"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-[#c4b5fd] mb-1.5">
          Manba URL (ixtiyoriy)
        </label>
        <Input
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://lex.uz/docs/..."
          type="url"
          className="glass-input border-purple-200/30 dark:border-[#8b5cf6]/20 text-gray-900 dark:text-[#f0e6ff] placeholder:text-gray-400 dark:placeholder:text-[#a78bfa]/30"
        />
      </div>
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="border-purple-300/40 dark:border-[#8b5cf6]/30 text-purple-600 dark:text-[#a78bfa]"
        >
          Bekor qilish
        </Button>
        <Button
          type="submit"
          disabled={loading || !title.trim() || !content.trim()}
          className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-[#8b5cf6] dark:to-[#7c3aed] hover:from-purple-500 hover:to-purple-600 dark:hover:from-[#a78bfa] dark:hover:to-[#8b5cf6] text-white shadow-[0_0_15px_rgba(124,58,237,0.2)] dark:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300"
        >
          {loading ? "Saqlanmoqda..." : initialData ? "Yangilash" : "Qo'shish"}
        </Button>
      </div>
    </form>
  );
}
