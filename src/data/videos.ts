export type VideoEntry = {
  keywords: string[];
  videoId: string;
  title: string;
};

// Har bir uka uchun curated YouTube videolar bazasi
// videoId — YouTube video ID (masalan: https://youtube.com/watch?v=VIDEO_ID)
// Keyinchalik admin panel orqali boshqarish mumkin
//
// QANDAY QO'SHISH:
// 1. YouTube'dan video toping
// 2. URL'dan video ID ni oling (masalan: https://youtube.com/watch?v=ABC123 → "ABC123")
// 3. Tegishli uka bo'limiga qo'shing:
//    { keywords: ["kalit", "so'zlar"], videoId: "ABC123", title: "Video nomi" }
//
export const videoDatabase: Record<string, VideoEntry[]> = {
  // Haqiqiy YouTube video ID larni qo'shing:
  //
  // santexnik: [
  //   { keywords: ["kran", "oqish", "tuzatish"], videoId: "HAQIQIY_ID", title: "Kran tuzatish" },
  // ],
  // huquqshunos: [
  //   { keywords: ["mehnat", "shartnoma"], videoId: "HAQIQIY_ID", title: "Mehnat shartnomasi" },
  // ],
  // oshpaz: [
  //   { keywords: ["osh", "palov"], videoId: "HAQIQIY_ID", title: "O'zbek oshi" },
  // ],
};

// Video bazasidan mos videolarni qidirish
export function findRelevantVideos(
  botSlug: string,
  content: string,
  maxResults: number = 3
): VideoEntry[] {
  const videos = videoDatabase[botSlug];
  if (!videos || videos.length === 0) return [];

  const contentLower = content.toLowerCase();

  // Har bir video uchun relevantlik ballini hisoblash
  const scored = videos.map((video) => {
    const matchCount = video.keywords.filter((kw) =>
      contentLower.includes(kw.toLowerCase())
    ).length;
    return { video, score: matchCount };
  });

  // Faqat kamida 1 keyword mos kelganlarni qaytarish
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.video);
}
