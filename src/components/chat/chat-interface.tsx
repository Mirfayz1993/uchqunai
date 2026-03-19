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
import { PushSubscribe } from "@/components/push-subscribe";

type UkaSuggestion = { slug: string; name: string } | null;

function extractUkaSuggestion(content: string): UkaSuggestion {
  const match = content.match(/\[UKA:([a-z0-9-]+):([^\]]+)\]/);
  if (!match) return null;
  return { slug: match[1], name: match[2] };
}

function cleanContent(content: string): string {
  return content.replace(/\[ESLATMA:\{[^}]*\}\]/g, "").trim();
}

function extractSavedReminder(content: string): string | null {
  const match = content.match(/\[ESLATMA:(\{[^}]+\})\]/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[1]);
    return data.title || null;
  } catch {
    return null;
  }
}

// ─── TTS Hook ─────────────────────────────────────────────────────────────────
function useTTS() {
  const [speaking, setSpeaking] = useState<number | null>(null);

  function speak(text: string, index: number) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    if (speaking === index) {
      setSpeaking(null);
      return;
    }

    // Markdown belgilerini tozalash
    const clean = text
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`{1,3}[^`]*`{1,3}/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n+/g, ". ")
      .trim();

    const utt = new SpeechSynthesisUtterance(clean);

    // O'zbek tili mavjud bo'lsa ishlatamiz, yo'qsa rus tiliga fallback
    const voices = window.speechSynthesis.getVoices();
    const uzVoice = voices.find((v) => v.lang.startsWith("uz"));
    const ruVoice = voices.find((v) => v.lang.startsWith("ru"));
    if (uzVoice) utt.voice = uzVoice;
    else if (ruVoice) utt.voice = ruVoice;
    utt.lang = uzVoice ? "uz-UZ" : ruVoice ? "ru-RU" : "en-US";
    utt.rate = 1;
    utt.pitch = 1;

    utt.onstart = () => setSpeaking(index);
    utt.onend = () => setSpeaking(null);
    utt.onerror = () => setSpeaking(null);

    window.speechSynthesis.speak(utt);
  }

  function stop() {
    window.speechSynthesis?.cancel();
    setSpeaking(null);
  }

  return { speak, stop, speaking };
}

// ─── STT Hook ─────────────────────────────────────────────────────────────────
function useSTT(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const supported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  function toggle() {
    if (!supported) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR();
    recognition.lang = "uz-UZ";
    recognition.continuous = false;
    recognition.interimResults = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return { toggle, listening, supported };
}

// ─── Speaker Button ───────────────────────────────────────────────────────────
function SpeakerButton({
  text,
  index,
  speaking,
  onSpeak,
}: {
  text: string;
  index: number;
  speaking: number | null;
  onSpeak: (text: string, index: number) => void;
}) {
  const isActive = speaking === index;
  return (
    <button
      onClick={() => onSpeak(text, index)}
      title={isActive ? "To'xtatish" : "O'qib berish"}
      className={`mt-1.5 flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-purple-100 dark:bg-[#8b5cf6]/20 text-purple-600 dark:text-[#a78bfa]"
          : "text-gray-400 dark:text-[#a78bfa]/30 hover:text-purple-500 dark:hover:text-[#a78bfa] hover:bg-purple-50 dark:hover:bg-[#8b5cf6]/10"
      }`}
    >
      {isActive ? (
        <>
          <span className="animate-pulse">🔊</span>
          <span>To&apos;xtatish</span>
        </>
      ) : (
        <>
          <span>🔈</span>
          <span>Eshitish</span>
        </>
      )}
    </button>
  );
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
  botImage?: string;
  initialMessage?: string;
  conversationId?: string;
};

export function ChatInterface({
  botSlug,
  botName,
  botIcon,
  botImage,
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

  const { speak, stop, speaking } = useTTS();
  const { toggle: toggleMic, listening, supported: sttSupported } = useSTT((text) => {
    setInput((prev) => (prev ? prev + " " + text : text));
  });

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Stop TTS when component unmounts
  useEffect(() => () => stop(), [stop]);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || loading) return;

      stop(); // TTS ni to'xtatish

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
    [botSlug, conversationId, loading, stop]
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
        {botImage ? (
          <img src={botImage} alt={botName} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover float-3d-delayed" />
        ) : (
          <span className="text-xl sm:text-2xl float-3d-delayed">{botIcon}</span>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-[#f0e6ff]">{botName}</h2>
          <p className="text-xs text-gray-400 dark:text-[#a78bfa]/50">AI uka • Uchqun.ai</p>
        </div>
        {botSlug === "umumiy" && (
          session
            ? <PushSubscribe />
            : <a
                href="/login?callbackUrl=/chat/umumiy"
                className="flex items-center gap-1 text-xs text-purple-600 dark:text-[#a78bfa] hover:text-purple-800 dark:hover:text-[#c4b5fd] transition-colors px-2 py-1 rounded-lg hover:bg-purple-50 dark:hover:bg-[#8b5cf6]/10"
                title="Eslatmalar uchun kiring"
              >
                <span>🔔</span>
                <span className="hidden sm:inline">Eslatmalar</span>
              </a>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollRef}>
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              {botImage ? (
                <img src={botImage} alt={botName} className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover float-3d" />
              ) : (
                <span className="text-4xl sm:text-5xl block float-3d">{botIcon}</span>
              )}
              <p className="text-gray-400 dark:text-[#a78bfa]/40">Savolingizni yozing...</p>
            </div>
          </div>
        )}
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => {
            const displayContent = msg.role === "assistant" ? cleanContent(msg.content) : msg.content;
            const savedReminder = msg.role === "assistant" ? extractSavedReminder(msg.content) : null;
            return (
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
                    <MarkdownMessage content={displayContent} role={msg.role} />
                  </div>
                </div>
                {/* TTS button for assistant messages */}
                {msg.role === "assistant" && displayContent && !loading && (
                  <div className="flex justify-start">
                    <SpeakerButton
                      text={displayContent}
                      index={i}
                      speaking={speaking}
                      onSpeak={speak}
                    />
                  </div>
                )}
                {savedReminder && (
                  <div className="flex justify-start mt-1">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200/50 dark:border-green-500/20 text-xs text-green-700 dark:text-green-400">
                      <span>✅</span>
                      <span>Eslatma saqlandi: <strong>{savedReminder}</strong></span>
                    </div>
                  </div>
                )}
                {msg.role === "assistant" && displayContent && !loading && (
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
            );
          })}
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
        <div className="max-w-3xl mx-auto">
          <div className="relative group/chat-input">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600 via-amber-500 to-purple-600 dark:from-[#8b5cf6] dark:via-[#fbbf24] dark:to-[#8b5cf6] rounded-2xl opacity-20 dark:opacity-30 group-focus-within/chat-input:opacity-50 dark:group-focus-within/chat-input:opacity-60 blur-sm transition-opacity duration-500 bg-[length:200%_auto] animate-[gradient-shift_3s_ease_infinite]" />
            <div className="relative glass-input rounded-2xl overflow-hidden">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={listening ? "Gapirayapsiz... 🎤" : "Xabar yozing..."}
                rows={3}
                className="resize-none !text-xl sm:!text-2xl border-0 shadow-none focus-visible:ring-0 bg-transparent p-4 sm:p-5 pb-16 sm:pb-5 sm:pr-44 text-gray-900 dark:text-[#f0e6ff] placeholder:text-gray-400 dark:placeholder:text-[#a78bfa]/40 !field-sizing-normal min-h-[120px]"
                disabled={loading}
              />
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:right-4 sm:left-auto flex gap-2 items-center justify-end">
                {/* Microphone button */}
                {sttSupported && (
                  <button
                    onClick={toggleMic}
                    disabled={loading}
                    title={listening ? "Tinglashni to'xtatish" : "Ovozdan matn"}
                    className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl transition-all duration-300 border ${
                      listening
                        ? "bg-red-500/10 border-red-400/50 text-red-500 dark:text-red-400 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                        : "bg-white/50 dark:bg-white/5 border-purple-200/30 dark:border-[#8b5cf6]/20 text-gray-500 dark:text-[#a78bfa]/50 hover:text-purple-600 dark:hover:text-[#a78bfa] hover:border-purple-400/40 dark:hover:border-[#8b5cf6]/40 hover:bg-purple-50 dark:hover:bg-[#8b5cf6]/10"
                    }`}
                  >
                    {listening ? "⏹" : "🎤"}
                  </button>
                )}
                {/* Send button */}
                <Button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-[#8b5cf6] dark:to-[#7c3aed] hover:from-purple-500 hover:to-purple-600 dark:hover:from-[#a78bfa] dark:hover:to-[#8b5cf6] text-white shadow-[0_0_15px_rgba(124,58,237,0.2)] dark:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300 text-sm sm:text-base px-4 sm:px-6 py-4 sm:py-5"
                  size="lg"
                >
                  {loading ? "Javob yozilmoqda..." : "Yuborish →"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
