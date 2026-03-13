import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ChatInterface } from "@/components/chat/chat-interface";
import { initialBots } from "@/data/bots";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; conversation?: string }>;
};

export default async function ChatPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/login");

  const { slug } = await params;
  const { q, conversation } = await searchParams;
  const bot = initialBots.find((b) => b.slug === slug);

  if (!bot) {
    redirect("/bots");
  }

  return (
    <ChatInterface
      botSlug={bot.slug}
      botName={bot.name}
      botIcon={bot.icon}
      initialMessage={q}
      conversationId={conversation}
    />
  );
}
