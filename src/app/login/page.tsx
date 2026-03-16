"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/bots";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isFromChat = callbackUrl.startsWith("/chat/");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      phone: formData.get("phone"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Telefon raqam yoki parol noto'g'ri");
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  const registerUrl = `/register${callbackUrl !== "/bots" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 relative">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[30%] w-48 sm:w-64 h-48 sm:h-64 bg-purple-400/5 dark:bg-[#8b5cf6]/10 rounded-full blur-[80px] sm:blur-[100px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[25%] w-56 sm:w-72 h-56 sm:h-72 bg-amber-300/4 dark:bg-[#fbbf24]/5 rounded-full blur-[100px] sm:blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-md glass-card rounded-2xl p-5 sm:p-8 glow-purple relative z-10 fade-in-up">
        <div className="text-center mb-5 sm:mb-6">
          {isFromChat && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-[#fbbf24]/10 border border-amber-200/50 dark:border-[#fbbf24]/20">
              <p className="text-sm text-amber-600 dark:text-[#fbbf24] font-medium">
                ⚡ Ixtisoslashgan uka bilan gaplashish uchun tizimga kiring
              </p>
            </div>
          )}
          <h1 className="text-2xl font-bold gradient-text">Tizimga kirish</h1>
          <p className="text-sm text-gray-500 dark:text-[#a78bfa]/50 mt-1">UchqunAI hisobingizga kiring</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/20">
              <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          )}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-[#a78bfa]/50">
              +998
            </span>
            <Input
              name="phone"
              type="tel"
              placeholder="90 123 45 67"
              className="pl-14 glass-input border-purple-200/30 dark:border-[#8b5cf6]/20 text-gray-900 dark:text-[#f0e6ff] placeholder:text-gray-400 dark:placeholder:text-[#a78bfa]/30 focus:border-purple-400 dark:focus:border-[#8b5cf6]/50 transition-colors"
              maxLength={12}
              required
            />
          </div>
          <PasswordInput
            name="password"
            placeholder="Parol"
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

        <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-purple-200/20 dark:border-[#8b5cf6]/10 text-center">
          <p className="text-sm text-gray-400 dark:text-[#a78bfa]/40 mb-3">Hisobingiz yo&apos;qmi?</p>
          <Link href={registerUrl}>
            <Button
              variant="outline"
              className="w-full border-amber-300/40 dark:border-[#fbbf24]/30 text-amber-600 dark:text-[#fbbf24] hover:bg-amber-50 dark:hover:bg-[#fbbf24]/10 hover:border-amber-400 dark:hover:border-[#fbbf24]/50 transition-all duration-300"
            >
              Ro&apos;yxatdan o&apos;tish
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
