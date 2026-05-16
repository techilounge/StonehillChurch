import { describe, it, expect } from "vitest";
import { hasMp4MagicBytes } from "@/lib/popup/mp4";

function buildHeader(tag: string): Uint8Array {
  const buf = new Uint8Array(16);
  // Bytes 0-3 are the box size — value doesn't matter for the magic check.
  buf[0] = 0x00;
  buf[1] = 0x00;
  buf[2] = 0x00;
  buf[3] = 0x20;
  for (let i = 0; i < 4; i++) {
    buf[4 + i] = tag.charCodeAt(i);
  }
  return buf;
}

describe("hasMp4MagicBytes", () => {
  it("accepts a buffer with 'ftyp' at offset 4", () => {
    expect(hasMp4MagicBytes(buildHeader("ftyp"))).toBe(true);
  });

  it("rejects buffers shorter than 12 bytes", () => {
    expect(hasMp4MagicBytes(new Uint8Array(8))).toBe(false);
  });

  it("rejects buffers without 'ftyp' at offset 4", () => {
    expect(hasMp4MagicBytes(buildHeader("RIFF"))).toBe(false);
    expect(hasMp4MagicBytes(buildHeader("PNG\0"))).toBe(false);
  });
});
