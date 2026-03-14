"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

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

      // Agar umumiy bo'lsa — to'g'ridan umumiy chatga o't (karta ko'rsatmasdan)
      if (!data.found || data.slug === "umumiy") {
        const encodedMessage = encodeURIComponent(message);
        router.push(`/chat/umumiy?q=${encodedMessage}`);
        return;
      }

      setRecommendation(data);
    } catch {
      // Xatolikda ham umumiy chatga yo'nalt
      const encodedMessage = encodeURIComponent(message);
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
    <div className="w-full max-w-3xl mx-auto">
      {!recommendation ? (
        <div className="flex flex-col gap-4">
          <div className="relative rounded-2xl border-2 border-primary/20 shadow-md focus-within:border-primary/50 focus-within:shadow-lg transition-all duration-200">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Savolingizni yozing... masalan: Mehnat shartnomasini qanday tuzaman?"
              rows={4}
              className="resize-none text-lg pr-32 border-0 shadow-none focus-visible:ring-0 bg-transparent p-5"
              disabled={loading}
            />
            <Button
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              className="absolute bottom-4 right-4 text-base px-6 py-5"
              size="lg"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⚡</span> Tahlil...
                </span>
              ) : (
                "Yuborish →"
              )}
            </Button>
          </div>
          <p className="text-base text-muted-foreground text-center">
            ⚡ Savolingizni yozing — biz eng mos ukani topamiz
          </p>
        </div>
      ) : (
        /* Aniq uka topildi */
        <Card className="p-8">
          <div className="text-center space-y-5">
            <div className="bg-muted rounded-xl px-5 py-4 text-base text-left">
              <span className="text-muted-foreground text-sm">Sizning savolingiz:</span>
              <p className="mt-1.5 text-lg">{userMessage}</p>
            </div>
            <p className="text-base text-muted-foreground">Sizga eng mos uka:</p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-5xl">{recommendation.icon}</span>
              <div className="text-left">
                <h3 className="font-bold text-xl">{recommendation.name}</h3>
                <p className="text-base text-muted-foreground">{recommendation.description}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => handleGoToChat(recommendation.slug)} size="lg" className="text-base px-6 py-5">
                {recommendation.icon} {recommendation.name} bilan davom etish
              </Button>
              <Button variant="outline" onClick={handleReset} size="lg" className="text-base px-6 py-5">
                Boshqa savol
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
