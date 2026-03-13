"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      router.push("/bots");
      router.refresh();
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Tizimga kirish</CardTitle>
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
          <p className="text-sm text-center text-muted-foreground mt-4">
            Hisobingiz yo&apos;qmi?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Ro&apos;yxatdan o&apos;ting
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
