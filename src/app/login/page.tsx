"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.95_0.04_294),transparent)]">
      <Card className="w-full max-w-md border-primary/15 shadow-lg">
        <CardHeader className="text-center">
          {isFromChat && (
            <div className="mb-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary font-medium">
                💬 Ixtisoslashgan uka bilan gaplashish uchun tizimga kiring
              </p>
            </div>
          )}
          <CardTitle className="text-2xl text-primary">Tizimga kirish</CardTitle>
          <CardDescription>
            UchqunAI hisobingizga kiring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
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
              placeholder="Parol"
              required
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Kirish..." : "Kirish"}
            </Button>
          </form>
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Hisobingiz yo&apos;qmi?
            </p>
            <Link href={registerUrl}>
              <Button variant="outline" className="w-full">
                Ro&apos;yxatdan o&apos;tish
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
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
