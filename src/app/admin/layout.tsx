"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Don't show admin layout on login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Admin header */}
      <header className="glass sticky top-0 z-50 border-b border-purple-200/30 dark:border-white/5">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2 group">
              <span className="text-xl">🔐</span>
              <span className="text-lg font-bold gradient-text">Admin</span>
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-purple-100 dark:bg-[#8b5cf6]/20 text-purple-700 dark:text-[#c4b5fd]"
                      : "text-gray-600 dark:text-[#a78bfa]/60 hover:text-purple-600 dark:hover:text-[#a78bfa] hover:bg-purple-50 dark:hover:bg-[#8b5cf6]/10"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg text-purple-600 dark:text-[#a78bfa] hover:bg-purple-100 dark:hover:bg-[#8b5cf6]/10 transition-colors"
            >
              <span className="dark:hidden text-lg">🌙</span>
              <span className="hidden dark:inline text-lg">☀️</span>
            </button>
            <Link
              href="/"
              className="text-sm text-gray-500 dark:text-[#a78bfa]/50 hover:text-purple-600 dark:hover:text-[#a78bfa] transition-colors px-2"
            >
              Saytga qaytish
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              Chiqish
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
