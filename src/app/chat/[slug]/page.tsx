import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { initialBots } from "@/data/bots";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; conversation?: string }>;
};

export default async function ChatPage({ params, searchParams }: Props) {
  const session = await auth();
  const { slug } = await params;
  const { q, conversation } = await searchParams;

  // Umumiy chat — login talab qilmaydi; boshqa ukalar uchun login kerak
  if (!session && slug !== "umumiy") {
    const chatUrl = q ? `/chat/${slug}?q=${encodeURIComponent(q)}` : `/chat/${slug}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(chatUrl)}`);
  }

  const bot = initialBots.find((b) => b.slug === slug);

  if (!bot) {
    redirect("/bots");
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar — faqat auth foydalanuvchilar uchun */}
      {session && (
        <ChatSidebar
          botSlug={bot.slug}
          botName={bot.name}
          botIcon={bot.icon}
          currentConversationId={conversation}
        />
      )}
      {/* Chat */}
      <div className="flex-1 min-w-0">
        <ChatInterface
          botSlug={bot.slug}
          botName={bot.name}
          botIcon={bot.icon}
          initialMessage={q}
          conversationId={conversation}
        />
      </div>
    </div>
  );
}
