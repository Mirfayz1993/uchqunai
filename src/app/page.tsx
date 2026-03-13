import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { initialBots } from "@/data/bots";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center gap-6 py-20 px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          <span className="text-2xl sm:text-4xl">⚡</span> UchqunAI
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          O&apos;zbekiston sharoitiga ixtisoslashgan sun&apos;iy intellekt
          yordamchilari. Huquq, soliq, tibbiyot, dasturlash va boshqa sohalarda
          maslahat oling.
        </p>
        <div className="flex gap-4">
          <Link href="/bots">
            <Button size="lg">Ukalarni ko&apos;rish</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="lg">
              Bepul boshlash
            </Button>
          </Link>
        </div>
      </section>

      {/* Bot cards */}
      <section className="container mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-center mb-8">
          Ixtisoslashgan ukalar
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {initialBots.slice(0, 8).map((bot) => (
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
        <div className="text-center mt-8">
          <Link href="/bots">
            <Button variant="outline">
              Barcha ukalarni ko&apos;rish ({initialBots.length} ta)
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
