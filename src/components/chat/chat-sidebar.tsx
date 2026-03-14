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
      className={`border-r bg-muted/30 flex flex-col transition-all duration-200 ${
        collapsed ? "w-0 overflow-hidden" : "w-72"
      }`}
    >
      {/* Sidebar header */}
      <div className="p-3 border-b flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">{botIcon}</span>
          <span className="font-semibold text-sm truncate">{botName}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 h-7 w-7 p-0"
          onClick={() => setCollapsed(!collapsed)}
        >
          ✕
        </Button>
      </div>

      {/* Yangi suhbat */}
      <div className="p-2">
        <Link href={`/chat/${botSlug}`}>
          <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
            ＋ Yangi suhbat
          </Button>
        </Link>
      </div>

      {/* Suhbatlar ro'yxati */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
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
                    className={`rounded-lg px-3 py-2 cursor-pointer transition-colors text-sm truncate ${
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
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
      className="h-8 w-8 p-0"
      onClick={onClick}
      title="Suhbat tarixini ochish"
    >
      ☰
    </Button>
  );
}
