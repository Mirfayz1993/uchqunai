"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-primary/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/logo.png"
            alt="UchqunAI"
            width={40}
            height={40}
            className="object-contain group-hover:scale-105 transition-transform duration-200"
          />
          <span className="text-2xl font-bold text-primary">Uchqun.ai</span>
        </Link>

        <nav className="flex items-center gap-5">
          <Link href="/bots" className="text-base text-muted-foreground hover:text-primary transition-colors font-medium">
            Ukalar
          </Link>
          {session ? (
            <>
              <Link href="/history" className="text-base text-muted-foreground hover:text-primary transition-colors font-medium">
                Tarix
              </Link>
              <span className="text-base text-muted-foreground hidden sm:block">
                {session.user?.name || session.user?.email}
              </span>
              <Button variant="outline" onClick={() => signOut()} className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground">
                Chiqish
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground">Kirish</Button>
              </Link>
              <Link href="/register">
                <Button>Ro&apos;yxatdan o&apos;tish</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
