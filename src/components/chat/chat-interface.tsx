"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
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
    <div className="max-w-[80%] space-y-2 mt-2">
      <DocumentDownload content={content} />
      {ukaSuggestion && (
        <Card className="p-3 border-primary/30 bg-primary/5">
          <p className="text-sm text-muted-foreground mb-2">
            Sizga quyidagi ixtisoslashgan uka ko&apos;proq yordam bera oladi:
          </p>
          <Button size="sm" onClick={() => onNavigate(ukaSuggestion.slug, lastUserMsg)}>
            {ukaSuggestion.name} bilan davom etish →
          </Button>
        </Card>
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

  // messagesRef ni doim yangilab turish
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
            // Guest uchun tarix clientdan yuboriladi (ref orqali eng yangi holat)
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

        // Save conversation ID
        const convId = res.headers.get("X-Conversation-Id");
        if (convId) setConversationId(convId);

        // Stream response
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

  // Auto-send initial message from ?q= param
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
      <div className="border-b border-primary/10 bg-primary/5 px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">{botIcon}</span>
        <div>
          <h2 className="font-semibold text-primary">{botName}</h2>
          <p className="text-sm text-muted-foreground">AI uka • Uchqun.ai</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Savolingizni yozing...</p>
          </div>
        )}
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i}>
              <div
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted border border-primary/8"
                  }`}
                >
                  <MarkdownMessage content={msg.content} role={msg.role} />
                </div>
              </div>
              {/* Hujjat yuklab olish, uka tavsiya va video tavsiyalari */}
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
              <div className="bg-muted rounded-2xl px-4 py-2">
                <p className="text-base text-muted-foreground animate-pulse">
                  Javob yozilmoqda...
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Xabar yozing..."
            rows={1}
            className="resize-none min-h-[44px]"
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            Yuborish
          </Button>
        </div>
      </div>
    </div>
  );
}
