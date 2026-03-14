import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { initialBots } from "@/data/bots";

export default function BotsPage() {
  const categories = [...new Set(initialBots.map((b) => b.category))];

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary">AI Ukalar</h1>
        <p className="text-muted-foreground mt-3 text-lg">
          O&apos;z sohasini chuqur biladigan ixtisoslashgan ukalar
        </p>
      </div>

      {categories.map((category) => (
        <div key={category} className="mb-12">
          <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 text-sm px-3 py-1">
              {category}
            </Badge>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {initialBots
              .filter((b) => b.category === category)
              .map((bot) => (
                <Link key={bot.slug} href={`/chat/${bot.slug}`}>
                  <Card className="hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 transition-all duration-200 cursor-pointer h-full group">
                    <CardHeader className="p-6">
                      <CardTitle className="flex items-center gap-3 group-hover:text-primary transition-colors text-lg">
                        <span className="text-3xl">{bot.icon}</span>
                        {bot.name}
                      </CardTitle>
                      <CardDescription className="text-base mt-1">{bot.description}</CardDescription>
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
