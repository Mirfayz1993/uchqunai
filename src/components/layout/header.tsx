"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="text-xl font-bold">UchqunAI</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/bots" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Botlar
          </Link>
          {session ? (
            <>
              <Link href="/history" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Tarix
              </Link>
              <span className="text-sm text-muted-foreground">
                {session.user?.name || session.user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Chiqish
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm">Kirish</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Ro&apos;yxatdan o&apos;tish</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
