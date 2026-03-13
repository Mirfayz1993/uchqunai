import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const conversations = await prisma.conversation.findMany({
    where: { userId: session.user.id },
    include: { bot: true, messages: { take: 1, orderBy: { createdAt: "desc" } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Suhbat tarixi</h1>

      {conversations.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">
          <p>Hali suhbatlar yo&apos;q.</p>
          <Link href="/bots" className="text-primary hover:underline">
            Uka tanlang va suhbat boshlang
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {conversations.map((conv) => (
            <Link key={conv.id} href={`/chat/${conv.bot.slug}?conversation=${conv.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span>{conv.bot.icon}</span>
                    {conv.bot.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {conv.title || "Yangi suhbat"}
                  </CardDescription>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(conv.updatedAt).toLocaleDateString("uz-UZ")}
                  </p>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
