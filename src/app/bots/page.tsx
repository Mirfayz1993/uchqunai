import Link from "next/link";
import { initialBots } from "@/data/bots";

export default function BotsPage() {
  const categories = [...new Set(initialBots.map((b) => b.category))];

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 relative">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-20 right-[10%] w-48 sm:w-64 h-48 sm:h-64 bg-purple-400/5 dark:bg-[#8b5cf6]/10 rounded-full blur-[80px] sm:blur-[100px] animate-pulse" />
        <div className="absolute bottom-40 left-[20%] w-56 sm:w-80 h-56 sm:h-80 bg-amber-300/4 dark:bg-[#fbbf24]/5 rounded-full blur-[100px] sm:blur-[120px] animate-pulse" style={{ animationDelay: "3s" }} />
      </div>

      <div className="text-center mb-10 sm:mb-16 fade-in-up">
        <h1 className="text-3xl sm:text-5xl font-bold gradient-text mb-3 sm:mb-4">AI Ukalar</h1>
        <p className="text-gray-500 dark:text-[#a78bfa]/60 text-base sm:text-lg">
          O&apos;z sohasini chuqur biladigan ixtisoslashgan ukalar
        </p>
      </div>

      {categories.map((category, catIdx) => (
        <div key={category} className="mb-10 sm:mb-14 fade-in-up" style={{ animationDelay: `${catIdx * 0.1}s` }}>
          <h2 className="text-sm font-semibold mb-4 sm:mb-5 flex items-center gap-2">
            <span className="inline-flex items-center px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-100 dark:bg-[#8b5cf6]/10 text-purple-700 dark:text-[#a78bfa] border border-purple-200/50 dark:border-[#8b5cf6]/20 backdrop-blur-sm">
              {category}
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {initialBots
              .filter((b) => b.category === category)
              .map((bot, i) => (
                <Link key={bot.slug} href={`/chat/${bot.slug}`}>
                  <div
                    className="glass-card rounded-2xl p-5 sm:p-6 cursor-pointer h-full group shine"
                    style={{ animationDelay: `${(catIdx * 0.1) + (i * 0.05)}s` }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-300">
                        {bot.icon}
                      </span>
                      <span className="font-semibold text-base sm:text-lg text-gray-900 dark:text-[#f0e6ff] group-hover:text-amber-600 dark:group-hover:text-[#fbbf24] transition-colors duration-300">
                        {bot.name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-[#a78bfa]/50 group-hover:text-gray-700 dark:group-hover:text-[#a78bfa]/80 transition-colors duration-300">
                      {bot.description}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
