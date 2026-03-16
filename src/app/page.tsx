import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { initialBots } from "@/data/bots";
import { SmartInput } from "@/components/home/smart-input";

export default function HomePage() {
  return (
    <div className="flex flex-col relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-[10%] w-48 sm:w-72 h-48 sm:h-72 bg-purple-400/5 dark:bg-[#8b5cf6]/10 rounded-full blur-[80px] sm:blur-[100px] animate-pulse" />
        <div className="absolute top-60 right-[15%] w-64 sm:w-96 h-64 sm:h-96 bg-amber-300/5 dark:bg-[#fbbf24]/5 rounded-full blur-[100px] sm:blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-40 left-[30%] w-56 sm:w-80 h-56 sm:h-80 bg-purple-400/4 dark:bg-[#8b5cf6]/8 rounded-full blur-[80px] sm:blur-[100px] animate-pulse" style={{ animationDelay: "4s" }} />
      </div>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center gap-4 sm:gap-6 py-8 sm:py-14 px-4 text-center">
        {/* Orbiting particles — hidden on mobile */}
        <div className="absolute inset-0 pointer-events-none hidden sm:block">
          <div className="absolute top-[20%] left-[15%] particle" style={{ animationDelay: "0s" }} />
          <div className="absolute top-[30%] right-[20%] particle particle-gold" style={{ animationDelay: "1s" }} />
          <div className="absolute top-[50%] left-[25%] particle" style={{ animationDelay: "2s" }} />
          <div className="absolute top-[40%] right-[30%] particle particle-gold" style={{ animationDelay: "3s" }} />
          <div className="absolute top-[60%] left-[10%] particle" style={{ animationDelay: "4s" }} />
          <div className="absolute top-[25%] right-[10%] particle" style={{ animationDelay: "5s" }} />
          <div className="absolute top-[70%] right-[25%] particle particle-gold" style={{ animationDelay: "6s" }} />
          <div className="absolute top-[15%] left-[40%] particle" style={{ animationDelay: "7s" }} />
        </div>

        {/* 3D Logo */}
        <div className="relative float-3d">
          <div className="absolute inset-0 bg-purple-500/10 dark:bg-[#8b5cf6]/20 rounded-full blur-3xl scale-150" />
          <Image
            src="/logo.png"
            alt="UchqunAI"
            width={100}
            height={100}
            className="sm:w-[140px] sm:h-[140px] object-contain relative z-10 drop-shadow-[0_0_30px_rgba(124,58,237,0.3)] dark:drop-shadow-[0_0_40px_rgba(139,92,246,0.5)]"
          />
        </div>

        {/* Title */}
        <div className="space-y-3 sm:space-y-4 fade-in-up">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight gradient-text glow-text-purple">
            Uchqun.ai
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-600 dark:text-[#a78bfa]/80 leading-relaxed px-2">
            O&apos;zbekiston sharoitiga ixtisoslashgan sun&apos;iy intellekt
            yordamchilari. Huquq, soliq, tibbiyot, dasturlash va boshqa sohalarda
            maslahat oling.
          </p>
        </div>

        {/* Smart Input */}
        <div className="relative z-10 w-full fade-in-up stagger-2">
          <SmartInput />
        </div>

        {/* CTA */}
        <div className="flex gap-4 fade-in-up stagger-3">
          <Link href="/bots">
            <Button
              variant="outline"
              size="lg"
              className="border-purple-300/40 dark:border-[#8b5cf6]/30 text-purple-700 dark:text-[#c4b5fd] hover:bg-purple-50 dark:hover:bg-[#8b5cf6]/15 hover:text-purple-900 dark:hover:text-white hover:border-purple-400 dark:hover:border-[#8b5cf6]/50 transition-all duration-300 text-sm sm:text-base px-5 sm:px-8 py-4 sm:py-5 backdrop-blur-sm"
            >
              Barcha ukalarni ko&apos;rish
            </Button>
          </Link>
        </div>
      </section>

      {/* Bot cards */}
      <section className="container mx-auto px-4 pb-16 sm:pb-24">
        <div className="text-center mb-10 sm:mb-14 fade-in-up">
          <h2 className="text-2xl sm:text-3xl font-bold gradient-text mb-3">
            Ixtisoslashgan ukalar
          </h2>
          <p className="text-gray-500 dark:text-[#a78bfa]/60 text-sm sm:text-base">
            Har bir sohada chuqur bilimga ega AI yordamchilar
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {initialBots.slice(0, 8).map((bot, i) => (
            <Link key={bot.slug} href={`/chat/${bot.slug}`}>
              <div
                className={`glass-card rounded-2xl p-5 sm:p-6 cursor-pointer h-full group shine fade-in-up stagger-${Math.min(i + 1, 8)}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl sm:text-3xl float-3d-delayed group-hover:scale-110 transition-transform duration-300">
                    {bot.icon}
                  </span>
                  <span className="font-semibold text-base sm:text-lg text-gray-900 dark:text-[#f0e6ff] group-hover:text-amber-600 dark:group-hover:text-[#fbbf24] transition-colors duration-300">
                    {bot.name}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-[#a78bfa]/60 group-hover:text-gray-700 dark:group-hover:text-[#a78bfa] transition-colors duration-300">
                  {bot.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8 sm:mt-12">
          <Link href="/bots">
            <Button
              variant="outline"
              className="border-amber-400/30 dark:border-[#fbbf24]/30 text-amber-600 dark:text-[#fbbf24] hover:bg-amber-50 dark:hover:bg-[#fbbf24]/10 hover:border-amber-400 dark:hover:border-[#fbbf24]/50 transition-all duration-300 text-sm sm:text-base px-6 sm:px-8 py-4 sm:py-5 backdrop-blur-sm glow-gold"
            >
              Barcha ukalarni ko&apos;rish ({initialBots.length} ta) ✨
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
