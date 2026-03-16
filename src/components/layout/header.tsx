"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="glass sticky top-0 z-50 border-b border-purple-200/30 dark:border-white/5">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <div className="relative">
            <Image
              src="/logo.png"
              alt="UchqunAI"
              width={36}
              height={36}
              className="object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(124,58,237,0.3)] dark:drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]"
            />
          </div>
          <span className="text-xl sm:text-2xl font-bold gradient-text">Uchqun.ai</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4">
          <Link
            href="/bots"
            className="text-sm text-purple-600 dark:text-[#a78bfa] hover:text-amber-600 dark:hover:text-[#fbbf24] transition-colors duration-300 font-medium relative group/nav"
          >
            Ukalar
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-amber-500 dark:from-[#8b5cf6] dark:to-[#fbbf24] group-hover/nav:w-full transition-all duration-300" />
          </Link>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg text-purple-600 dark:text-[#a78bfa] hover:bg-purple-100 dark:hover:bg-[#8b5cf6]/10 transition-colors duration-300"
            title="Tema o'zgartirish"
          >
            <span className="dark:hidden text-lg">🌙</span>
            <span className="hidden dark:inline text-lg">☀️</span>
          </button>

          {session ? (
            <>
              <Link
                href="/history"
                className="text-sm text-purple-600 dark:text-[#a78bfa] hover:text-amber-600 dark:hover:text-[#fbbf24] transition-colors duration-300 font-medium relative group/nav"
              >
                Tarix
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-amber-500 dark:from-[#8b5cf6] dark:to-[#fbbf24] group-hover/nav:w-full transition-all duration-300" />
              </Link>
              <span className="text-sm text-purple-700 dark:text-[#c4b5fd] font-medium">
                {session.user?.name}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="border-purple-300/50 dark:border-[#8b5cf6]/30 text-purple-600 dark:text-[#a78bfa] hover:bg-purple-100 dark:hover:bg-[#8b5cf6]/20 hover:text-purple-800 dark:hover:text-white transition-all duration-300"
              >
                Chiqish
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-300/50 dark:border-[#8b5cf6]/30 text-purple-600 dark:text-[#a78bfa] hover:bg-purple-100 dark:hover:bg-[#8b5cf6]/20 hover:text-purple-800 dark:hover:text-white transition-all duration-300"
                >
                  Kirish
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-[#8b5cf6] dark:to-[#7c3aed] hover:from-purple-500 hover:to-purple-600 dark:hover:from-[#a78bfa] dark:hover:to-[#8b5cf6] text-white shadow-[0_0_15px_rgba(124,58,237,0.2)] dark:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300"
                >
                  Ro&apos;yxatdan o&apos;tish
                </Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg text-purple-600 dark:text-[#a78bfa] hover:bg-purple-100 dark:hover:bg-[#8b5cf6]/10 transition-colors"
          >
            <span className="dark:hidden text-lg">🌙</span>
            <span className="hidden dark:inline text-lg">☀️</span>
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg text-purple-600 dark:text-[#a78bfa] hover:bg-purple-100 dark:hover:bg-[#8b5cf6]/10 transition-colors"
          >
            <span className="text-xl">{menuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="md:hidden glass border-t border-purple-200/30 dark:border-[#8b5cf6]/10 px-4 py-4 space-y-3 fade-in-up" style={{ animationDuration: "0.2s" }}>
          <Link
            href="/bots"
            onClick={() => setMenuOpen(false)}
            className="block text-sm font-medium text-purple-600 dark:text-[#a78bfa] hover:text-amber-600 dark:hover:text-[#fbbf24] py-2 transition-colors"
          >
            Ukalar
          </Link>
          {session ? (
            <>
              <Link
                href="/history"
                onClick={() => setMenuOpen(false)}
                className="block text-sm font-medium text-purple-600 dark:text-[#a78bfa] hover:text-amber-600 dark:hover:text-[#fbbf24] py-2 transition-colors"
              >
                Tarix
              </Link>
              <div className="pt-2 border-t border-purple-200/30 dark:border-[#8b5cf6]/10 flex items-center justify-between">
                <span className="text-sm text-purple-700 dark:text-[#c4b5fd] font-medium">
                  {session.user?.name}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="border-purple-300/50 dark:border-[#8b5cf6]/30 text-purple-600 dark:text-[#a78bfa]"
                >
                  Chiqish
                </Button>
              </div>
            </>
          ) : (
            <div className="pt-2 border-t border-purple-200/30 dark:border-[#8b5cf6]/10 flex gap-2">
              <Link href="/login" className="flex-1" onClick={() => setMenuOpen(false)}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-purple-300/50 dark:border-[#8b5cf6]/30 text-purple-600 dark:text-[#a78bfa]"
                >
                  Kirish
                </Button>
              </Link>
              <Link href="/register" className="flex-1" onClick={() => setMenuOpen(false)}>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 dark:from-[#8b5cf6] dark:to-[#7c3aed] text-white"
                >
                  Ro&apos;yxatdan o&apos;tish
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
