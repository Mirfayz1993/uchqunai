"use client";

import { useState, useMemo } from "react";
import { findRelevantVideos, type VideoEntry } from "@/data/videos";
import { YouTubeEmbed } from "./youtube-embed";
import { Button } from "@/components/ui/button";

type VideoSuggestionsProps = {
  botSlug: string;
  content: string;
};

export function VideoSuggestions({ botSlug, content }: VideoSuggestionsProps) {
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);

  const relevantVideos = useMemo(
    () => findRelevantVideos(botSlug, content, 3),
    [botSlug, content]
  );

  // YouTube qidiruv havolasi — agar video bazasida mos video topilmasa
  const youtubeSearchUrl = useMemo(() => {
    // Contentdan birinchi 50 ta belgini olish qidiruv uchun
    const searchQuery = content
      .replace(/[*#_\-\[\]()]/g, "") // markdown belgilarni olib tashlash
      .split("\n")[0] // faqat birinchi qatorni olish
      .trim()
      .slice(0, 80);
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(
      searchQuery + " o'zbek tilida"
    )}`;
  }, [content]);

  return (
    <div className="mt-3 space-y-2">
      {/* Curated videolar */}
      {relevantVideos.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            🎬 Tegishli videolar:
          </p>
          {relevantVideos.map((video: VideoEntry) => (
            <div key={video.videoId + video.title} className="space-y-2">
              <button
                onClick={() =>
                  setExpandedVideo(
                    expandedVideo === video.videoId ? null : video.videoId
                  )
                }
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer w-full text-left"
              >
                <span className="text-red-500">▶</span>
                <span className="underline underline-offset-2">
                  {video.title}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {expandedVideo === video.videoId ? "▲" : "▼"}
                </span>
              </button>
              {expandedVideo === video.videoId && (
                <div className="rounded-xl overflow-hidden">
                  <YouTubeEmbed
                    videoId={video.videoId}
                    title={video.title}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div>
          <a
            href={youtubeSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-2"
            >
              🔍 YouTube&apos;da tegishli video qidirish
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
