export type VideoEntry = {
  keywords: string[];
  videoId: string;
  title: string;
};

// Har bir uka uchun curated YouTube videolar bazasi
// videoId — YouTube video ID (masalan: https://youtube.com/watch?v=VIDEO_ID)
// Keyinchalik admin panel orqali boshqarish mumkin
export const videoDatabase: Record<string, VideoEntry[]> = {
  santexnik: [
    {
      keywords: ["kran", "oqish", "tuzatish", "smesitel"],
      videoId: "dQw4w9WgXcQ", // placeholder — haqiqiy video bilan almashtiring
      title: "Kran oqishini qanday tuzatish mumkin",
    },
    {
      keywords: ["kanalizatsiya", "tiqilish", "ochish"],
      videoId: "dQw4w9WgXcQ",
      title: "Kanalizatsiya tiqilishini ochish usullari",
    },
    {
      keywords: ["unitaz", "hojatxona", "o'rnatish"],
      videoId: "dQw4w9WgXcQ",
      title: "Unitaz o'rnatish va ta'mirlash",
    },
    {
      keywords: ["quvur", "suv", "polipropilen"],
      videoId: "dQw4w9WgXcQ",
      title: "Polipropilen quvurlarni payvandlash",
    },
    {
      keywords: ["boyler", "isitgich", "suv isitish"],
      videoId: "dQw4w9WgXcQ",
      title: "Suv isitgichni o'rnatish va sozlash",
    },
  ],
  huquqshunos: [
    {
      keywords: ["mehnat", "shartnoma", "ish"],
      videoId: "dQw4w9WgXcQ",
      title: "Mehnat shartnomasi qanday tuziladi",
    },
    {
      keywords: ["uy", "oldi-sotdi", "ko'chmas mulk"],
      videoId: "dQw4w9WgXcQ",
      title: "Uy-joy oldi-sotdi shartnomasi",
    },
    {
      keywords: ["ajrim", "nikoh", "oila"],
      videoId: "dQw4w9WgXcQ",
      title: "Nikohni bekor qilish tartibi",
    },
  ],
  "soliq-maslahatchisi": [
    {
      keywords: ["QQS", "soliq", "deklaratsiya"],
      videoId: "dQw4w9WgXcQ",
      title: "QQS deklaratsiyasini qanday to'ldirish",
    },
    {
      keywords: ["patent", "yakka tartibdagi", "tadbirkor"],
      videoId: "dQw4w9WgXcQ",
      title: "Yakka tartibdagi tadbirkor uchun soliq rejimi",
    },
  ],
  shifokor: [
    {
      keywords: ["bosim", "gipertoniya", "yurak"],
      videoId: "dQw4w9WgXcQ",
      title: "Yuqori qon bosimini nazorat qilish",
    },
    {
      keywords: ["diabet", "qand", "insulin"],
      videoId: "dQw4w9WgXcQ",
      title: "Qandli diabet haqida bilish kerak bo'lgan narsalar",
    },
  ],
  dasturchi: [
    {
      keywords: ["react", "next", "frontend"],
      videoId: "dQw4w9WgXcQ",
      title: "React asoslari — boshlang'ich qo'llanma",
    },
    {
      keywords: ["python", "boshlash", "o'rganish"],
      videoId: "dQw4w9WgXcQ",
      title: "Python dasturlash tili asoslari",
    },
  ],
  "biznes-maslahatchisi": [
    {
      keywords: ["biznes", "reja", "startup"],
      videoId: "dQw4w9WgXcQ",
      title: "Biznes reja qanday tuziladi",
    },
    {
      keywords: ["ro'yxatdan", "ochish", "STIR"],
      videoId: "dQw4w9WgXcQ",
      title: "O'zbekistonda biznes ochish bosqichlari",
    },
  ],
  oshpaz: [
    {
      keywords: ["osh", "palov", "plov"],
      videoId: "dQw4w9WgXcQ",
      title: "Haqiqiy o'zbek oshi tayyorlash sirlari",
    },
    {
      keywords: ["somsa", "pishirish"],
      videoId: "dQw4w9WgXcQ",
      title: "Somsa tayyorlash — qadam-baqadam",
    },
    {
      keywords: ["lag'mon", "chuzma"],
      videoId: "dQw4w9WgXcQ",
      title: "Chuzma lag'mon tayyorlash usuli",
    },
  ],
  avtomexanik: [
    {
      keywords: ["moy", "almashtirish", "dvigatel"],
      videoId: "dQw4w9WgXcQ",
      title: "Dvigatel moyini qanday almashtirish kerak",
    },
    {
      keywords: ["tormoz", "kolodka", "disk"],
      videoId: "dQw4w9WgXcQ",
      title: "Tormoz kolodkalarini almashtirish",
    },
  ],
  "dehqon-maslahatchisi": [
    {
      keywords: ["pomidor", "yetishtirish", "ekin"],
      videoId: "dQw4w9WgXcQ",
      title: "Pomidor yetishtirish sirlari",
    },
    {
      keywords: ["issiqxona", "qurilish"],
      videoId: "dQw4w9WgXcQ",
      title: "Issiqxona qurish bosqichlari",
    },
  ],
  rieltor: [
    {
      keywords: ["ipoteka", "kredit", "uy"],
      videoId: "dQw4w9WgXcQ",
      title: "O'zbekistonda ipoteka olish tartibi",
    },
  ],
  "talim-mentori": [
    {
      keywords: ["IELTS", "ingliz", "til"],
      videoId: "dQw4w9WgXcQ",
      title: "IELTS imtihoniga tayyorlanish strategiyasi",
    },
    {
      keywords: ["DTM", "test", "imtihon"],
      videoId: "dQw4w9WgXcQ",
      title: "DTM imtihoniga samarali tayyorlanish",
    },
  ],
  psixolog: [
    {
      keywords: ["stress", "bezovtalik", "tinchlanish"],
      videoId: "dQw4w9WgXcQ",
      title: "Stressni boshqarish usullari",
    },
  ],
  tarjimon: [
    {
      keywords: ["ingliz", "grammatika", "o'rganish"],
      videoId: "dQw4w9WgXcQ",
      title: "Ingliz tili grammatikasi asoslari",
    },
  ],
  moliyachi: [
    {
      keywords: ["jamg'arma", "pul", "tejash"],
      videoId: "dQw4w9WgXcQ",
      title: "Pulni to'g'ri boshqarish va jamg'arish",
    },
  ],
  "hr-mutaxassisi": [
    {
      keywords: ["rezyume", "CV", "ish"],
      videoId: "dQw4w9WgXcQ",
      title: "Professional rezyume qanday yoziladi",
    },
    {
      keywords: ["intervyu", "suhbat", "tayyorlanish"],
      videoId: "dQw4w9WgXcQ",
      title: "Ish intervyusiga tayyorlanish sirlari",
    },
  ],
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
