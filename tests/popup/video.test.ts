import { describe, it, expect } from "vitest";
import { extractVimeoVideoId, resolveVideoEmbed } from "@/lib/popup/video";

const opts = { autoplay: false, muted: true, loop: false };

describe("extractVimeoVideoId", () => {
  it("extracts an id from a canonical vimeo.com URL", () => {
    expect(extractVimeoVideoId("https://vimeo.com/123456789")).toBe("123456789");
  });

  it("extracts an id from a /video/ path", () => {
    expect(extractVimeoVideoId("https://vimeo.com/video/987654321")).toBe("987654321");
  });

  it("returns null for non-vimeo URLs", () => {
    expect(extractVimeoVideoId("https://example.com/123")).toBeNull();
    expect(extractVimeoVideoId("https://youtube.com/watch?v=abc")).toBeNull();
  });

  it("handles blanks defensively", () => {
    expect(extractVimeoVideoId("")).toBeNull();
    expect(extractVimeoVideoId(null)).toBeNull();
    expect(extractVimeoVideoId(undefined)).toBeNull();
  });
});

describe("resolveVideoEmbed", () => {
  it("returns null for empty input", () => {
    expect(resolveVideoEmbed(null, opts)).toBeNull();
    expect(resolveVideoEmbed("", opts)).toBeNull();
    expect(resolveVideoEmbed("   ", opts)).toBeNull();
  });

  it("recognizes YouTube watch URLs and uses youtube-nocookie", () => {
    const embed = resolveVideoEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ", opts);
    expect(embed?.kind).toBe("youtube");
    expect(embed?.src).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });

  it("threads autoplay/mute/loop flags through to YouTube params", () => {
    const embed = resolveVideoEmbed("https://youtu.be/dQw4w9WgXcQ", {
      autoplay: true,
      muted: true,
      loop: true,
    });
    expect(embed?.kind).toBe("youtube");
    const url = new URL(embed!.src);
    expect(url.searchParams.get("autoplay")).toBe("1");
    expect(url.searchParams.get("mute")).toBe("1");
    expect(url.searchParams.get("loop")).toBe("1");
    // YouTube needs `playlist=<id>` for loop to work on a single video.
    expect(url.searchParams.get("playlist")).toBe("dQw4w9WgXcQ");
  });

  it("recognizes Vimeo URLs", () => {
    const embed = resolveVideoEmbed("https://vimeo.com/76979871", opts);
    expect(embed?.kind).toBe("vimeo");
    expect(embed?.src).toContain("player.vimeo.com/video/76979871");
  });

  it("falls back to a file embed for direct video URLs", () => {
    const embed = resolveVideoEmbed("https://example.com/clip.mp4", opts);
    expect(embed).toEqual({ kind: "file", src: "https://example.com/clip.mp4" });
  });
});
