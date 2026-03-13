"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { initialBots } from "@/data/bots";

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
      setRecommendation(data);
    } catch {
      setRecommendation({
        found: false,
        slug: "umumiy",
        name: "Xatolik",
        icon: "⚠️",
        description: "AI xizmati vaqtinchalik ishlamayapti.",
      });
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

  // Top 6 ukalar — umumiy holat uchun
  const topBots = initialBots.slice(0, 6);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!recommendation ? (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Savolingizni yozing... masalan: Mehnat shartnomasini qanday tuzaman?"
              rows={3}
              className="resize-none text-base pr-24"
              disabled={loading}
            />
            <Button
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              className="absolute bottom-3 right-3"
              size="sm"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Tahlil...
                </span>
              ) : (
                "Yuborish →"
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Savolingizni yozing — biz eng mos ukani topamiz
          </p>
        </div>
      ) : (
        <Card className="p-6">
          <div className="space-y-4">
            {/* User message */}
            <div className="bg-muted rounded-xl px-4 py-3 text-sm">
              <span className="text-muted-foreground text-xs">Sizning savolingiz:</span>
              <p className="mt-1">{userMessage}</p>
            </div>

            {recommendation.found ? (
              /* Aniq uka topildi */
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">Sizga eng mos uka:</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl">{recommendation.icon}</span>
                  <div className="text-left">
                    <h3 className="font-bold text-lg">{recommendation.name}</h3>
                    <p className="text-sm text-muted-foreground">{recommendation.description}</p>
                  </div>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => handleGoToChat(recommendation.slug)} size="lg">
                    {recommendation.icon} {recommendation.name} bilan davom etish
                  </Button>
                  <Button variant="outline" onClick={handleReset} size="lg">
                    Boshqa savol
                  </Button>
                </div>
              </div>
            ) : (
              /* Umumiy savol — ukalar tanlovi */
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-3xl">👋</span>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Qaysi sorada yordam kerak? Ukani tanlang:
                  </p>
                </div>

                {/* Ukalar grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {topBots.map((bot) => (
                    <button
                      key={bot.slug}
                      onClick={() => handleGoToChat(bot.slug)}
                      className="flex items-center gap-2 p-3 rounded-xl border hover:bg-muted transition-colors text-left"
                    >
                      <span className="text-xl">{bot.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{bot.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{bot.category}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 justify-center pt-1">
                  <Link href="/bots">
                    <Button variant="outline" size="sm">
                      Barcha ukalar ({initialBots.length} ta)
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    Qayta yozish
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
