import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { initialBots } from "@/data/bots";

export default function BotsPage() {
  const categories = [...new Set(initialBots.map((b) => b.category))];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">AI Ukalar</h1>
        <p className="text-muted-foreground mt-2">
          O&apos;z sohasini chuqur biladigan ixtisoslashgan ukalar
        </p>
      </div>

      {categories.map((category) => (
        <div key={category} className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Badge variant="outline">{category}</Badge>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {initialBots
              .filter((b) => b.category === category)
              .map((bot) => (
                <Link key={bot.slug} href={`/chat/${bot.slug}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{bot.icon}</span>
                        {bot.name}
                      </CardTitle>
                      <CardDescription>{bot.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
