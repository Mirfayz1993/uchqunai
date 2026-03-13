"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { YouTubeEmbed } from "./youtube-embed";
import { removeDocumentMarkers } from "./document-download";
import type { Components } from "react-markdown";

type MarkdownMessageProps = {
  content: string;
  role: "user" | "assistant";
};

// YouTube URL dan videoId ni ajratib olish
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function MarkdownMessage({ content, role }: MarkdownMessageProps) {
  // User xabarlari uchun oddiy matn
  if (role === "user") {
    return <p className="whitespace-pre-wrap text-sm">{content}</p>;
  }

  const components: Components = {
    // Link larni tekshirish — YouTube bo'lsa embed qilish
    a: ({ href, children }) => {
      if (href) {
        const videoId = extractYouTubeId(href);
        if (videoId) {
          return (
            <div className="my-3">
              <YouTubeEmbed
                videoId={videoId}
                title={typeof children === "string" ? children : undefined}
              />
            </div>
          );
        }
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
        >
          {children}
        </a>
      );
    },
    // Boshqa elementlarni stilizatsiya qilish
    p: ({ children }) => (
      <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
    ),
    strong: ({ children }) => (
      <strong className="font-bold">{children}</strong>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    code: ({ children, className }) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code className="bg-background/50 border rounded px-1.5 py-0.5 text-xs font-mono">
            {children}
          </code>
        );
      }
      return (
        <code className="block bg-background/50 border rounded-lg p-3 text-xs font-mono overflow-x-auto my-2">
          {children}
        </code>
      );
    },
    pre: ({ children }) => <pre className="my-2">{children}</pre>,
    h1: ({ children }) => (
      <h1 className="text-lg font-bold mb-2">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-base font-bold mb-2">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-sm font-bold mb-1">{children}</h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-primary/50 pl-3 my-2 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-3 border-border" />,
    table: ({ children }) => (
      <div className="overflow-x-auto my-2">
        <table className="min-w-full text-xs border-collapse border border-border">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-border bg-muted px-2 py-1 text-left font-semibold">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-border px-2 py-1">{children}</td>
    ),
  };

  return (
    <div className="text-sm prose-sm max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {removeDocumentMarkers(content)}
      </ReactMarkdown>
    </div>
  );
}
