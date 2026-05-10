import { PageHeader } from "@/components/admin/PageHeader";
import { YouTubeSettingsForm } from "@/components/admin/YouTubeSettingsForm";
import { getYoutubeSettings } from "@/lib/data/youtubeSettings";
import { isYouTubeApiConfigured } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export default async function YouTubeAdminPage() {
  const settings = await getYoutubeSettings();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="YouTube"
        description="Connect the church channel, livestream, uploads playlist, and public live banner."
      />
      <YouTubeSettingsForm
        initialSettings={{
          channelId: settings.channelId,
          channelUrl: settings.channelUrl,
          liveStreamUrl: settings.liveStreamUrl,
          uploadsPlaylistId: settings.uploadsPlaylistId,
          featuredVideoId: settings.featuredVideoId,
          autoFetchLatestSermons: settings.autoFetchLatestSermons,
          showLiveBanner: settings.showLiveBanner,
        }}
        apiConfigured={isYouTubeApiConfigured()}
      />
    </div>
  );
}
