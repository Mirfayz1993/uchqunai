"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Recommendation = {
  found: boolean;
  slug: string;
  name: string;
  icon: string;
  description: string;
};

export function SmartInput() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [userMessage, setUserMessage] = useState("");
  const router = useRouter();

  async function handleSubmit() {
    if (!input.trim() || loading) return;

    const message = input.trim();
    setUserMessage(message);
    setLoading(true);
    setRecommendation(null);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) throw new Error("API xatolik");

      const data = await res.json();

      if (!data.found || data.slug === "umumiy") {
        const encodedMessage = encodeURIComponent(message);
        setLoading(false);
        router.push(`/chat/umumiy?q=${encodedMessage}`);
        return;
      }

      setRecommendation(data);
    } catch {
      const encodedMessage = encodeURIComponent(message);
      setLoading(false);
      router.push(`/chat/umumiy?q=${encodedMessage}`);
      return;
    }

    setLoading(false);
  }

  function handleGoToChat(slug: string) {
    const encodedMessage = encodeURIComponent(userMessage);
    router.push(`/chat/${slug}?q=${encodedMessage}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleReset() {
    setRecommendation(null);
    setInput("");
    setUserMessage("");
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-1 sm:px-0">
      {!recommendation ? (
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Glow input container */}
          <div className="relative group/input">
            {/* Animated gradient border */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600 via-amber-500 to-purple-600 dark:from-[#8b5cf6] dark:via-[#fbbf24] dark:to-[#8b5cf6] rounded-2xl opacity-20 dark:opacity-30 group-focus-within/input:opacity-50 dark:group-focus-within/input:opacity-60 blur-sm transition-opacity duration-500 bg-[length:200%_auto] animate-[gradient-shift_3s_ease_infinite]" />
            <div className="relative glass-input rounded-2xl overflow-hidden">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Savolingizni yozing... masalan: Mehnat shartnomasini qanday tuzaman?"
                rows={5}
                className="resize-none !text-xl sm:!text-2xl border-0 shadow-none focus-visible:ring-0 bg-transparent p-4 sm:p-5 pb-16 sm:pb-5 sm:pr-36 text-gray-900 dark:text-[#f0e6ff] placeholder:text-gray-400 dark:placeholder:text-[#a78bfa]/40 !field-sizing-normal min-h-[120px]"
                disabled={loading}
              />
              <Button
                onClick={handleSubmit}
                disabled={loading || !input.trim()}
                className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:right-4 sm:left-auto bg-gradient-to-r from-purple-600 to-purple-700 dark:from-[#8b5cf6] dark:to-[#7c3aed] hover:from-purple-500 hover:to-purple-600 dark:hover:from-[#a78bfa] dark:hover:to-[#8b5cf6] text-white shadow-[0_0_15px_rgba(124,58,237,0.2)] dark:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300 text-sm sm:text-base px-4 sm:px-6 py-4 sm:py-5"
                size="lg"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin text-amber-400 dark:text-[#fbbf24]">⚡</span> Tahlil...
                  </span>
                ) : (
                  "Yuborish →"
                )}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-gray-400 dark:text-[#a78bfa]/50">
              <span className="text-amber-500 dark:text-[#fbbf24]">⚡</span> Savolingizni yozing — biz eng mos ukani topamiz
            </p>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-[#8b5cf6]/10 border border-purple-200/30 dark:border-[#8b5cf6]/20">
              <span className="text-sm">💬</span>
              <span className="text-xs font-medium text-purple-600 dark:text-[#a78bfa]">Umumiy yordamchi</span>
            </div>
          </div>
        </div>
      ) : (
        /* Recommendation card */
        <div className="glass-card rounded-2xl p-5 sm:p-8 glow-purple">
          <div className="text-center space-y-4 sm:space-y-5">
            <div className="glass rounded-xl px-4 sm:px-5 py-3 sm:py-4 text-base text-left">
              <span className="text-xs text-gray-400 dark:text-[#a78bfa]/50 uppercase tracking-wider">Sizning savolingiz</span>
              <p className="mt-1.5 text-base sm:text-lg text-gray-900 dark:text-[#f0e6ff]">{userMessage}</p>
            </div>
            <p className="text-sm text-gray-500 dark:text-[#a78bfa]/60">Sizga eng mos uka:</p>
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <span className="text-4xl sm:text-5xl float-3d">{recommendation.icon}</span>
              <div className="text-left">
                <h3 className="font-bold text-lg sm:text-xl gradient-text-gold">{recommendation.name}</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-[#a78bfa]/60">{recommendation.description}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => handleGoToChat(recommendation.slug)}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-amber-500 dark:from-[#8b5cf6] dark:to-[#fbbf24] hover:from-purple-500 hover:to-amber-400 dark:hover:from-[#a78bfa] dark:hover:to-[#f59e0b] text-white shadow-[0_0_15px_rgba(124,58,237,0.2)] dark:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300 text-sm sm:text-base px-5 sm:px-6 py-4 sm:py-5"
              >
                {recommendation.icon} {recommendation.name} bilan davom etish
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                size="lg"
                className="border-purple-300/40 dark:border-[#8b5cf6]/30 text-purple-600 dark:text-[#a78bfa] hover:bg-purple-50 dark:hover:bg-[#8b5cf6]/15 hover:text-purple-900 dark:hover:text-white transition-all duration-300 text-sm sm:text-base px-5 sm:px-6 py-4 sm:py-5 backdrop-blur-sm"
              >
                Boshqa savol
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
