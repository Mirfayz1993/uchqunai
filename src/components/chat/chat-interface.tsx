"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownMessage } from "./markdown-message";
import { VideoSuggestions } from "./video-suggestions";
import { DocumentDownload } from "./document-download";

type UkaSuggestion = { slug: string; name: string } | null;

function extractUkaSuggestion(content: string): UkaSuggestion {
  const match = content.match(/\[UKA:([a-z0-9-]+):([^\]]+)\]/);
  if (!match) return null;
  return { slug: match[1], name: match[2] };
}


type Message = {
  role: "user" | "assistant";
  content: string;
};

function AssistantExtras({
  content,
  botSlug,
  messages,
  onNavigate,
}: {
  content: string;
  botSlug: string;
  messages: Message[];
  onNavigate: (slug: string, q: string) => void;
}) {
  const ukaSuggestion = extractUkaSuggestion(content);
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";

  return (
    <div className="max-w-[90%] sm:max-w-[80%] space-y-2 mt-2">
      <DocumentDownload content={content} />
      {ukaSuggestion && (
        <div className="glass-card rounded-xl p-3 border border-purple-200/30 dark:border-[#8b5cf6]/30">
          <p className="text-sm text-gray-500 dark:text-[#a78bfa]/60 mb-2">
            Sizga quyidagi ixtisoslashgan uka ko&apos;proq yordam bera oladi:
          </p>
          <Button
            size="sm"
            onClick={() => onNavigate(ukaSuggestion.slug, lastUserMsg)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-[#8b5cf6] dark:to-[#7c3aed] hover:from-purple-500 hover:to-purple-600 dark:hover:from-[#a78bfa] dark:hover:to-[#8b5cf6] text-white shadow-[0_0_10px_rgba(124,58,237,0.15)] dark:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-300"
          >
            {ukaSuggestion.name} bilan davom etish →
          </Button>
        </div>
      )}
      <VideoSuggestions botSlug={botSlug} content={content} />
    </div>
  );
}

type ChatInterfaceProps = {
  botSlug: string;
  botName: string;
  botIcon: string;
  initialMessage?: string;
  conversationId?: string;
};

export function ChatInterface({
  botSlug,
  botName,
  botIcon,
  initialMessage,
  conversationId: initialConversationId,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialMessageSent = useRef(false);
  const messagesRef = useRef<Message[]>([]);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || loading) return;

      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage,
            botSlug,
            conversationId,
            clientMessages: messagesRef.current,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `Xatolik: ${text}` },
          ]);
          setLoading(false);
          return;
        }

        const convId = res.headers.get("X-Conversation-Id");
        if (convId) setConversationId(convId);

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;

          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: assistantContent,
            };
            return updated;
          });
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Tarmoq xatosi. Qaytadan urinib ko'ring." },
        ]);
      }

      setLoading(false);
    },
    [botSlug, conversationId, loading]
  );

  useEffect(() => {
    if (initialMessage && !initialMessageSent.current) {
      initialMessageSent.current = true;
      sendMessage(initialMessage);
    }
  }, [initialMessage, sendMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");
    sendMessage(userMessage);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="glass border-b border-purple-200/20 dark:border-[#8b5cf6]/10 px-3 sm:px-4 py-3 flex items-center gap-3">
        <span className="text-xl sm:text-2xl float-3d-delayed">{botIcon}</span>
        <div>
          <h2 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-[#f0e6ff]">{botName}</h2>
          <p className="text-xs text-gray-400 dark:text-[#a78bfa]/50">AI uka • Uchqun.ai</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollRef}>
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <span className="text-4xl sm:text-5xl block float-3d">{botIcon}</span>
              <p className="text-gray-400 dark:text-[#a78bfa]/40">Savolingizni yozing...</p>
            </div>
          </div>
        )}
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i}>
              <div
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-purple-600 to-purple-700 dark:from-[#8b5cf6] dark:to-[#7c3aed] text-white shadow-[0_0_10px_rgba(124,58,237,0.15)] dark:shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                      : "glass border border-purple-100/50 dark:border-[#8b5cf6]/10 text-gray-900 dark:text-[#f0e6ff]"
                  }`}
                >
                  <MarkdownMessage content={msg.content} role={msg.role} />
                </div>
              </div>
              {msg.role === "assistant" && msg.content && !loading && (
                <AssistantExtras
                  content={msg.content}
                  botSlug={botSlug}
                  messages={messages}
                  onNavigate={(slug, q) => {
                    const chatUrl = `/chat/${slug}?q=${encodeURIComponent(q)}`;
                    if (session) {
                      router.push(chatUrl);
                    } else {
                      router.push(`/login?callbackUrl=${encodeURIComponent(chatUrl)}`);
                    }
                  }}
                />
              )}
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="glass rounded-2xl px-3 sm:px-4 py-2 border border-purple-100/50 dark:border-[#8b5cf6]/10">
                <p className="text-sm sm:text-base text-gray-400 dark:text-[#a78bfa]/60 animate-pulse">
                  Javob yozilmoqda...
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="glass border-t border-purple-200/20 dark:border-[#8b5cf6]/10 p-3 sm:p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <div className="relative flex-1 group/chat-input">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600 via-amber-500 to-purple-600 dark:from-[#8b5cf6] dark:via-[#fbbf24] dark:to-[#8b5cf6] rounded-xl opacity-0 group-focus-within/chat-input:opacity-30 dark:group-focus-within/chat-input:opacity-40 blur-sm transition-opacity duration-500 bg-[length:200%_auto] animate-[gradient-shift_3s_ease_infinite]" />
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Xabar yozing..."
              rows={1}
              className="relative resize-none min-h-[44px] glass-input border-purple-200/20 dark:border-[#8b5cf6]/20 text-gray-900 dark:text-[#f0e6ff] placeholder:text-gray-400 dark:placeholder:text-[#a78bfa]/30 focus:border-purple-400 dark:focus:border-[#8b5cf6]/50 transition-colors"
              disabled={loading}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-[#8b5cf6] dark:to-[#7c3aed] hover:from-purple-500 hover:to-purple-600 dark:hover:from-[#a78bfa] dark:hover:to-[#8b5cf6] text-white shadow-[0_0_10px_rgba(124,58,237,0.15)] dark:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-300"
          >
            Yuborish
          </Button>
        </div>
      </div>
    </div>
  );
}
