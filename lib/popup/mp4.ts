// MP4 magic bytes: a valid ISO base media file starts with a box length
// (4 bytes) followed by the ASCII tag "ftyp" at offset 4-8. We don't trust
// the client-declared mime type; bytes on disk are the source of truth.
export function hasMp4MagicBytes(buffer: Uint8Array): boolean {
  if (buffer.length < 12) return false;
  return (
    buffer[4] === 0x66 && // 'f'
    buffer[5] === 0x74 && // 't'
    buffer[6] === 0x79 && // 'y'
    buffer[7] === 0x70 //   'p'
  );
}
