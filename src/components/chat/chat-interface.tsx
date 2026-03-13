"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownMessage } from "./markdown-message";
import { VideoSuggestions } from "./video-suggestions";
import { DocumentDownload } from "./document-download";

type Message = {
  role: "user" | "assistant";
  content: string;
};

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
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Chat header */}
      <div className="border-b px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">{botIcon}</span>
        <div>
          <h2 className="font-semibold">{botName}</h2>
          <p className="text-xs text-muted-foreground">AI uka</p>
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
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <MarkdownMessage content={msg.content} role={msg.role} />
                </div>
              </div>
              {/* Hujjat yuklab olish va video tavsiyalari — faqat assistant javoblarida, streaming tugagandan keyin */}
              {msg.role === "assistant" && msg.content && !loading && (
                <div className="ml-0 max-w-[80%]">
                  <DocumentDownload content={msg.content} />
                  <VideoSuggestions botSlug={botSlug} content={msg.content} />
                </div>
              )}
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-2">
                <p className="text-sm text-muted-foreground animate-pulse">
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
