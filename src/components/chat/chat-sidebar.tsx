"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
  botSlug: string;
};

export function ChatSidebar({
  botSlug,
  botName,
  botIcon,
  currentConversationId,
}: {
  botSlug: string;
  botName: string;
  botIcon: string;
  currentConversationId?: string | null;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await fetch(`/api/conversations?botSlug=${botSlug}`);
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
        }
      } catch {
        // Guest rejimda xatolik — tarix ko'rinmaydi
      }
    }
    loadConversations();
  }, [botSlug, pathname]);

  return (
    <div
      className={`glass border-r border-purple-200/20 dark:border-[#8b5cf6]/10 flex flex-col transition-all duration-300 ${
        collapsed ? "w-0 overflow-hidden" : "hidden sm:flex w-64 lg:w-72"
      }`}
    >
      {/* Sidebar header */}
      <div className="p-3 border-b border-purple-200/20 dark:border-[#8b5cf6]/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">{botIcon}</span>
          <span className="font-semibold text-sm text-gray-900 dark:text-[#f0e6ff] truncate">{botName}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 h-7 w-7 p-0 text-gray-400 dark:text-[#a78bfa]/50 hover:text-gray-700 dark:hover:text-[#f0e6ff] hover:bg-purple-100 dark:hover:bg-[#8b5cf6]/10 transition-colors"
          onClick={() => setCollapsed(!collapsed)}
        >
          ✕
        </Button>
      </div>

      {/* Yangi suhbat */}
      <div className="p-2">
        <Link href={`/chat/${botSlug}`}>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs gap-1.5 border-purple-200/30 dark:border-[#8b5cf6]/20 text-purple-600 dark:text-[#a78bfa] hover:bg-purple-50 dark:hover:bg-[#8b5cf6]/10 hover:text-purple-800 dark:hover:text-[#f0e6ff] hover:border-purple-300 dark:hover:border-[#8b5cf6]/40 transition-all duration-300"
          >
            ＋ Yangi suhbat
          </Button>
        </Link>
      </div>

      {/* Suhbatlar ro'yxati */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {conversations.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-[#a78bfa]/30 text-center py-4">
              Hali suhbatlar yo&apos;q
            </p>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === currentConversationId;
              return (
                <Link
                  key={conv.id}
                  href={`/chat/${conv.botSlug}?conversation=${conv.id}`}
                >
                  <div
                    className={`rounded-xl px-3 py-2 cursor-pointer transition-all duration-200 text-sm truncate ${
                      isActive
                        ? "bg-purple-100 dark:bg-[#8b5cf6]/15 text-purple-900 dark:text-[#f0e6ff] font-medium border border-purple-200/50 dark:border-[#8b5cf6]/20 shadow-sm dark:shadow-[0_0_10px_rgba(139,92,246,0.1)]"
                        : "text-gray-500 dark:text-[#a78bfa]/50 hover:bg-purple-50 dark:hover:bg-[#8b5cf6]/5 hover:text-gray-700 dark:hover:text-[#a78bfa]"
                    }`}
                  >
                    {conv.title || "Yangi suhbat"}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function SidebarToggle({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-gray-400 dark:text-[#a78bfa]/50 hover:text-gray-700 dark:hover:text-[#f0e6ff] hover:bg-purple-100 dark:hover:bg-[#8b5cf6]/10 transition-colors"
      onClick={onClick}
      title="Suhbat tarixini ochish"
    >
      ☰
    </Button>
  );
}
