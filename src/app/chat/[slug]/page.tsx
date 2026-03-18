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
    <div className="flex h-[calc(100vh-4rem)] relative">
      {/* Background subtle glow */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-[10%] right-[5%] w-36 sm:w-48 h-36 sm:h-48 bg-purple-400/3 dark:bg-[#8b5cf6]/5 rounded-full blur-[60px] sm:blur-[80px]" />
        <div className="absolute bottom-[20%] left-[10%] w-40 sm:w-56 h-40 sm:h-56 bg-amber-300/2 dark:bg-[#fbbf24]/3 rounded-full blur-[80px] sm:blur-[100px]" />
      </div>
      {/* Sidebar — faqat auth foydalanuvchilar uchun */}
      {session && (
        <ChatSidebar
          botSlug={bot.slug}
          botName={bot.name}
          botIcon={bot.icon}
          botImage={bot.image}
          currentConversationId={conversation}
        />
      )}
      {/* Chat */}
      <div className="flex-1 min-w-0">
        <ChatInterface
          botSlug={bot.slug}
          botName={bot.name}
          botIcon={bot.icon}
          botImage={bot.image}
          initialMessage={q}
          conversationId={conversation}
        />
      </div>
    </div>
  );
}
