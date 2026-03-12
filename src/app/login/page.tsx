"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Email yoki parol noto'g'ri");
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
            <Input
              name="email"
              type="email"
              placeholder="Email"
              required
            />
            <Input
              name="password"
              type="password"
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
