"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function RegisterForm() {
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
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Xatolik yuz berdi");
      setLoading(false);
      return;
    }

    // Auto login after registration
    await signIn("credentials", {
      phone,
      password,
      redirect: false,
    });

    router.push(callbackUrl);
    router.refresh();
  }

  const loginUrl = `/login${callbackUrl !== "/bots" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.95_0.04_294),transparent)]">
      <Card className="w-full max-w-md border-primary/15 shadow-lg">
        <CardHeader className="text-center">
          {isFromChat && (
            <div className="mb-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary font-medium">
                💬 Ixtisoslashgan uka bilan gaplashish uchun ro&apos;yxatdan o&apos;ting
              </p>
            </div>
          )}
          <CardTitle className="text-2xl text-primary">Ro&apos;yxatdan o&apos;tish</CardTitle>
          <CardDescription>
            UchqunAI da yangi hisob yarating
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
            <Input
              name="name"
              type="text"
              placeholder="Ismingiz"
              required
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                +998
              </span>
              <Input
                name="phone"
                type="tel"
                placeholder="90 123 45 67"
                className="pl-14"
                maxLength={12}
                required
              />
            </div>
            <PasswordInput
              name="password"
              placeholder="Parol (kamida 6 belgi)"
              minLength={6}
              required
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Yaratilmoqda..." : "Hisob yaratish"}
            </Button>
          </form>
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Hisobingiz bormi?
            </p>
            <Link href={loginUrl}>
              <Button variant="outline" className="w-full">
                Tizimga kirish
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
