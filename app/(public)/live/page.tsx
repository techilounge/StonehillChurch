import React from "react";
import { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { getYoutubeSettings } from "@/lib/data/youtubeSettings";
import { PlayCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Watch Live | Stonehill Church",
  description: "Join our weekly worship services online via our live stream.",
};

export default async function LiveStreamPage() {
  const youtubeSettings = await getYoutubeSettings();
  
  // Note: in Phase 11 we only read the configured settings, we do not hit the YouTube Data API yet.
  const isLive = youtubeSettings.isLive === true;
  const channelId = youtubeSettings.channelId;
  const customLiveUrl = youtubeSettings.customLiveUrl;
  const featuredVideoId = youtubeSettings.featuredVideoId;
  const fallbackMessage = youtubeSettings.fallbackMessage || "We are currently not live. Please join us during our regular service times or watch past sermons on our YouTube channel.";

  let embedUrl = "";
  if (customLiveUrl) {
    // Basic extraction of video ID from a youtube URL
    const videoIdMatch = customLiveUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
    if (videoIdMatch && videoIdMatch[1]) {
      embedUrl = `https://www.youtube.com/embed/${videoIdMatch[1]}`;
    }
  } else if (featuredVideoId) {
    embedUrl = `https://www.youtube.com/embed/${featuredVideoId}`;
  }

  return (
    <main className="flex min-h-screen flex-col bg-stone-50 pb-24">
      <PageHero
        title="Watch Live"
        subtitle="Join our worship service from wherever you are."
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          
          <div className="bg-white rounded-3xl shadow-lg p-6 md:p-10 border border-stone-100">
            {embedUrl ? (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  {isLive ? (
                    <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                      <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                      LIVE NOW
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-stone-100 text-stone-700 px-3 py-1 rounded-full text-sm font-bold">
                      PREVIOUSLY RECORDED
                    </div>
                  )}
                  <h2 className="text-2xl font-bold font-serif text-stone-900">
                    Stonehill Church Worship
                  </h2>
                </div>
                
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner">
                  <iframe
                    src={embedUrl}
                    title="Live Stream"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                <PlayCircle className="w-16 h-16 text-stone-300 mx-auto mb-6" />
                <h2 className="text-2xl font-bold font-serif text-stone-900 mb-4">Live Stream Offline</h2>
                <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-8">
                  {fallbackMessage}
                </p>
                {channelId && (
                  <a
                    href={`https://www.youtube.com/channel/${channelId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-primary hover:bg-primary-dark text-white font-medium py-3 px-8 rounded-xl transition-colors"
                  >
                    Visit Our YouTube Channel
                  </a>
                )}
              </div>
            )}
            
          </div>
        </div>
      </section>
    </main>
  );
}
