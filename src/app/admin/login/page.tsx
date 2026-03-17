"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("Parol noto'g'ri");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Server xatosi");
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[30%] w-48 sm:w-64 h-48 sm:h-64 bg-purple-400/5 dark:bg-[#8b5cf6]/10 rounded-full blur-[80px] sm:blur-[100px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[25%] w-56 sm:w-72 h-56 sm:h-72 bg-amber-300/4 dark:bg-[#fbbf24]/5 rounded-full blur-[100px] sm:blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-md glass-card rounded-2xl p-5 sm:p-8 glow-purple relative z-10 fade-in-up">
        <div className="text-center mb-5 sm:mb-6">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold gradient-text">Admin Panel</h1>
          <p className="text-sm text-gray-500 dark:text-[#a78bfa]/50 mt-1">
            Boshqaruv paneliga kirish
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/20">
              <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          )}
          <PasswordInput
            name="password"
            placeholder="Admin parol"
            className="glass-input border-purple-200/30 dark:border-[#8b5cf6]/20 text-gray-900 dark:text-[#f0e6ff] placeholder:text-gray-400 dark:placeholder:text-[#a78bfa]/30 focus:border-purple-400 dark:focus:border-[#8b5cf6]/50 transition-colors"
            required
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 dark:from-[#8b5cf6] dark:to-[#7c3aed] hover:from-purple-500 hover:to-purple-600 dark:hover:from-[#a78bfa] dark:hover:to-[#8b5cf6] text-white shadow-[0_0_15px_rgba(124,58,237,0.2)] dark:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300"
          >
            {loading ? "Kirish..." : "Kirish"}
          </Button>
        </form>
      </div>
    </div>
  );
}
