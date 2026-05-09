export type YoutubeSettingsPlaceholder = {
  apiKeyConfigured: boolean;
  channelIdConfigured: boolean;
};

export function getYoutubeSettingsPlaceholder(): YoutubeSettingsPlaceholder {
  return {
    apiKeyConfigured: Boolean(process.env.YOUTUBE_API_KEY),
    channelIdConfigured: Boolean(process.env.YOUTUBE_CHANNEL_ID),
  };
}

