"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    router.push("/bots");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Ro&apos;yxatdan o&apos;tish</CardTitle>
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
          <p className="text-sm text-center text-muted-foreground mt-4">
            Hisobingiz bormi?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Tizimga kiring
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
