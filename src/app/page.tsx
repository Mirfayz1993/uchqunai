import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { initialBots } from "@/data/bots";
import { SmartInput } from "@/components/home/smart-input";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center gap-8 py-24 px-4 text-center overflow-hidden">
        {/* Subtle purple radial background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,oklch(0.95_0.04_294),transparent)] pointer-events-none" />

        <Image
          src="/logo.png"
          alt="UchqunAI"
          width={120}
          height={120}
          className="object-contain drop-shadow-lg relative z-10"
        />
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl text-primary relative z-10">
          Uchqun.ai
        </h1>
        <p className="max-w-2xl text-xl text-muted-foreground relative z-10">
          O&apos;zbekiston sharoitiga ixtisoslashgan sun&apos;iy intellekt
          yordamchilari. Huquq, soliq, tibbiyot, dasturlash va boshqa sohalarda
          maslahat oling.
        </p>

        <div className="relative z-10 w-full">
          <SmartInput />
        </div>

        <div className="flex gap-4 relative z-10">
          <Link href="/bots">
            <Button variant="outline" size="lg" className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground text-base px-6 py-5">
              Barcha ukalarni ko&apos;rish
            </Button>
          </Link>
        </div>
      </section>

      {/* Bot cards */}
      <section className="container mx-auto px-4 pb-20">
        <h2 className="text-3xl font-bold text-center mb-3 text-primary">
          Ixtisoslashgan ukalar
        </h2>
        <p className="text-center text-muted-foreground text-base mb-10">
          Har bir sohada chuqur bilimga ega AI yordamchilar
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {initialBots.slice(0, 8).map((bot) => (
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
        <div className="text-center mt-10">
          <Link href="/bots">
            <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground text-base px-6 py-5">
              Barcha ukalarni ko&apos;rish ({initialBots.length} ta)
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
