"use client";

import { useState, useRef, useMemo } from "react";
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

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function estimateChunks(text: string, maxWords: number = 800): number {
  const words = countWords(text);
  if (words <= maxWords) return 1;
  return Math.ceil(words / (maxWords - 50)); // approximate with overlap
}

export function DocumentForm({ initialData, onSubmit, onCancel, loading }: DocumentFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [sourceUrl, setSourceUrl] = useState(initialData?.sourceUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = useMemo(() => countWords(content), [content]);
  const chunkCount = useMemo(() => estimateChunks(content), [content]);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);

      // Extract title from filename if title is empty
      if (!title) {
        const name = file.name
          .replace(/\.(md|txt|markdown)$/i, "")
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        setTitle(name);
      }
    };
    reader.readAsText(file, "utf-8");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({ title, content, sourceUrl });
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 border border-purple-200/20 dark:border-[#8b5cf6]/10 space-y-4">
      {/* File upload */}
      {!initialData && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-[#c4b5fd] mb-1.5">
            📄 Fayl yuklash (ixtiyoriy)
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer border-2 border-dashed border-purple-200/40 dark:border-[#8b5cf6]/20 rounded-xl p-4 text-center hover:border-purple-400/60 dark:hover:border-[#8b5cf6]/40 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,.markdown"
              onChange={handleFileUpload}
              className="hidden"
            />
            <span className="text-sm text-gray-500 dark:text-[#a78bfa]/50">
              .md yoki .txt faylni tanlang yoki bu yerni bosing
            </span>
          </div>
        </div>
      )}

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
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-[#c4b5fd]">
            Mazmun *
          </label>
          {content.trim() && (
            <span className="text-xs text-gray-400 dark:text-[#a78bfa]/40">
              {wordCount} so'z
              {chunkCount > 1 && (
                <span className="text-amber-600 dark:text-[#fbbf24] ml-1.5">
                  → ~{chunkCount} ta bo'lakka bo'linadi
                </span>
              )}
            </span>
          )}
        </div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Hujjat mazmunini kiriting yoki yuqoridan fayl yuklang..."
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
