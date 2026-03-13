"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

type DocumentMarker = {
  format: "docx" | "xlsx" | "pdf";
  title: string;
};

// [DOCUMENT:docx:Mehnat shartnomasi] formatini parse qilish
function parseDocumentMarkers(content: string): DocumentMarker[] {
  const regex = /\[DOCUMENT:(docx|xlsx|pdf):([^\]]+)\]/g;
  const markers: DocumentMarker[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    markers.push({
      format: match[1] as "docx" | "xlsx" | "pdf",
      title: match[2].trim(),
    });
  }
  return markers;
}

// Javob mazmunidan hujjat turini avtomatik aniqlash
function detectDocumentType(content: string): DocumentMarker[] {
  const contentLower = content.toLowerCase();
  const markers: DocumentMarker[] = [];

  // Shartnoma, ariza, bayonnoma, qaror kabi hujjat belgilari
  const docKeywords = [
    { words: ["shartnoma", "contract"], title: "Shartnoma" },
    { words: ["ariza", "buyruq"], title: "Ariza" },
    { words: ["bayonnoma", "protokol"], title: "Bayonnoma" },
    { words: ["ishonchnoma", "vekillik"], title: "Ishonchnoma" },
    { words: ["da'vo", "sud"], title: "Arizanoma" },
    { words: ["nizom", "ustav"], title: "Nizom" },
    { words: ["akt", "dalolatnoma"], title: "Dalolatnoma" },
    { words: ["rezyume", "cv"], title: "Rezyume" },
    { words: ["biznes reja", "biznes-reja"], title: "Biznes reja" },
    { words: ["retsept", "tayyorlash", "pishirish"], title: "Retsept" },
  ];

  // Jadval belgilari — markdown jadval bor
  const hasTable = content.includes("|") && /\|[\s\-:]+\|/.test(content);

  // Hujjat formati belgilari — rasmiy hujjat struktura elementi
  const hasDocStructure =
    (contentLower.includes("tomonlar") &&
      contentLower.includes("imzo")) ||
    contentLower.includes("_______") ||
    (contentLower.includes("modda") && contentLower.includes("shartnoma")) ||
    contentLower.includes("m.o'.");

  // Agar rasmiy hujjat strukturasi bor bo'lsa
  if (hasDocStructure) {
    // Hujjat nomini topish
    let docTitle = "Hujjat";
    for (const kw of docKeywords) {
      if (kw.words.some((w) => contentLower.includes(w))) {
        docTitle = kw.title;
        break;
      }
    }
    markers.push({ format: "docx", title: docTitle });
    markers.push({ format: "pdf", title: docTitle });
  }

  // Agar jadval bor bo'lsa — Excel ham taklif qilinadi
  if (hasTable) {
    let tableTitle = "Jadval";
    // Jadvaldan oldingi sarlavhani olish
    const tableIdx = content.indexOf("|");
    const beforeTable = content.slice(0, tableIdx);
    const headingMatch = beforeTable.match(/##?\s*(.+)/g);
    if (headingMatch) {
      tableTitle = headingMatch[headingMatch.length - 1]
        .replace(/^#+\s*/, "")
        .trim();
    }
    markers.push({ format: "xlsx", title: tableTitle });
    // Agar hali docx qo'shilmagan bo'lsa
    if (!markers.some((m) => m.format === "docx")) {
      markers.push({ format: "docx", title: tableTitle });
    }
  }

  return markers;
}

// Javob matnidan [DOCUMENT:...] markerlarini olib tashlash
export function removeDocumentMarkers(content: string): string {
  return content
    .replace(/\s*\[DOCUMENT:(docx|xlsx|pdf):[^\]]+\]\s*/g, "")
    .trim();
}

const formatConfig = {
  docx: { icon: "📄", label: "Word", color: "text-blue-600" },
  xlsx: { icon: "📊", label: "Excel", color: "text-green-600" },
  pdf: { icon: "📋", label: "PDF", color: "text-red-600" },
};

type DocumentDownloadProps = {
  content: string;
};

export function DocumentDownload({ content }: DocumentDownloadProps) {
  const [loadingFormat, setLoadingFormat] = useState<string | null>(null);

  // Avval AI marker'larini tekshir, keyin avtomatik aniqlash
  const markers = useMemo(() => {
    const aiMarkers = parseDocumentMarkers(content);
    if (aiMarkers.length > 0) return aiMarkers;
    return detectDocumentType(content);
  }, [content]);

  if (markers.length === 0) return null;

  async function handleDownload(marker: DocumentMarker) {
    setLoadingFormat(marker.format);
    try {
      const cleanContent = removeDocumentMarkers(content);

      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: cleanContent,
          title: marker.title,
          format: marker.format,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      // Faylni yuklab olish
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${marker.title.replace(/\s+/g, "_")}.${marker.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Yuklab olish xatosi:", error);
      alert("Hujjat yuklab olishda xatolik yuz berdi");
    }
    setLoadingFormat(null);
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <p className="w-full text-xs font-medium text-muted-foreground">
        📎 Hujjatni yuklab olish:
      </p>
      {markers.map((marker, i) => {
        const config = formatConfig[marker.format];
        const isLoading = loadingFormat === marker.format;
        return (
          <Button
            key={`${marker.format}-${i}`}
            variant="outline"
            size="sm"
            className="text-xs gap-2"
            onClick={() => handleDownload(marker)}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <span>{config.icon}</span>
            )}
            {isLoading
              ? "Yaratilmoqda..."
              : `${config.label} yuklab olish`}
          </Button>
        );
      })}
    </div>
  );
}
