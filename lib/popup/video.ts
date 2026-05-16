import { extractYouTubeVideoId } from "@/lib/youtube";

export type VideoEmbed =
  | { kind: "youtube"; src: string }
  | { kind: "vimeo"; src: string }
  | { kind: "file"; src: string }
  | null;

export function extractVimeoVideoId(value: string | null | undefined): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (!parsed.hostname.includes("vimeo.com")) return null;
    const segments = parsed.pathname.split("/").filter(Boolean);
    const id = segments[segments.length - 1];
    return /^\d+$/.test(id) ? id : null;
  } catch {
    const match = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match?.[1] ?? null;
  }
}

export function resolveVideoEmbed(
  videoUrl: string | null,
  options: { autoplay: boolean; muted: boolean; loop: boolean },
): VideoEmbed {
  if (!videoUrl) return null;
  const url = videoUrl.trim();
  if (!url) return null;

  const ytId = extractYouTubeVideoId(url);
  if (ytId) {
    const params = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      autoplay: options.autoplay ? "1" : "0",
    });
    if (options.muted) params.set("mute", "1");
    if (options.loop) {
      params.set("loop", "1");
      params.set("playlist", ytId);
    }
    return {
      kind: "youtube",
      src: `https://www.youtube-nocookie.com/embed/${ytId}?${params.toString()}`,
    };
  }

  const vimeoId = extractVimeoVideoId(url);
  if (vimeoId) {
    const params = new URLSearchParams();
    if (options.autoplay) params.set("autoplay", "1");
    if (options.muted) params.set("muted", "1");
    if (options.loop) params.set("loop", "1");
    const qs = params.toString();
    return {
      kind: "vimeo",
      src: `https://player.vimeo.com/video/${vimeoId}${qs ? `?${qs}` : ""}`,
    };
  }

  return { kind: "file", src: url };
}
