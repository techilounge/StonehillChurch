export type YouTubeConfig = {
  apiKey?: string;
  channelId?: string;
  liveBroadcastUrl?: string;
};

export function getYouTubeConfig(): YouTubeConfig {
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  return {
    apiKey: process.env.YOUTUBE_API_KEY,
    channelId,
    liveBroadcastUrl: channelId ? `https://www.youtube.com/channel/${channelId}/live` : undefined,
  };
}
