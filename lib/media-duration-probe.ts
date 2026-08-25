/**
 * Duración aproximada de audio/video a partir de cabecera (y cola para moov al final).
 * Sin dependencias: el pipeline sube directo a GCS y no hay ffmpeg.
 */

import { canonicalizeStoryMediaMime } from "@/lib/file-sniff";

function readU32BE(b: Uint8Array, offset: number): number {
  return (
    ((b[offset] ?? 0) << 24) |
    ((b[offset + 1] ?? 0) << 16) |
    ((b[offset + 2] ?? 0) << 8) |
    (b[offset + 3] ?? 0)
  ) >>> 0;
}

function readU32LE(b: Uint8Array, offset: number): number {
  return (
    (b[offset] ?? 0) |
    ((b[offset + 1] ?? 0) << 8) |
    ((b[offset + 2] ?? 0) << 16) |
    ((b[offset + 3] ?? 0) << 24)
  ) >>> 0;
}

function readU64BE(b: Uint8Array, offset: number): number {
  const hi = readU32BE(b, offset);
  const lo = readU32BE(b, offset + 4);
  return hi * 0x100000000 + lo;
}

function findFourcc(b: Uint8Array, tag: string): number {
  const a = tag.charCodeAt(0);
  const c1 = tag.charCodeAt(1);
  const c2 = tag.charCodeAt(2);
  const c3 = tag.charCodeAt(3);
  for (let i = 0; i <= b.length - 8; i++) {
    if (b[i] === a && b[i + 1] === c1 && b[i + 2] === c2 && b[i + 3] === c3) return i;
  }
  return -1;
}

function durationFromMvhd(b: Uint8Array): number | null {
  const i = findFourcc(b, "mvhd");
  if (i < 0 || i + 24 > b.length) return null;
  const version = b[i + 4] ?? 0;
  if (version === 1) {
    if (i + 36 > b.length) return null;
    const timescale = readU32BE(b, i + 24);
    const duration = readU64BE(b, i + 28);
    if (!timescale) return null;
    const sec = duration / timescale;
    return Number.isFinite(sec) && sec >= 0 ? sec : null;
  }
  const timescale = readU32BE(b, i + 16);
  const duration = readU32BE(b, i + 20);
  if (!timescale) return null;
  const sec = duration / timescale;
  return Number.isFinite(sec) && sec >= 0 ? sec : null;
}

function durationFromWav(head: Uint8Array, totalSize: number): number | null {
  if (head.length < 44) return null;
  if (
    head[0] !== 0x52 ||
    head[1] !== 0x49 ||
    head[2] !== 0x46 ||
    head[3] !== 0x46 ||
    head[8] !== 0x57 ||
    head[9] !== 0x41 ||
    head[10] !== 0x56 ||
    head[11] !== 0x45
  ) {
    return null;
  }
  const byteRate = readU32LE(head, 28);
  if (byteRate <= 0) return null;
  let i = 12;
  while (i + 8 <= head.length) {
    const id = String.fromCharCode(
      head[i] ?? 0,
      head[i + 1] ?? 0,
      head[i + 2] ?? 0,
      head[i + 3] ?? 0
    );
    const size = readU32LE(head, i + 4);
    if (id === "data") return size / byteRate;
    i += 8 + size + (size % 2);
    if (size === 0) break;
  }
  return Math.max(0, (totalSize - 44) / byteRate);
}

/** MPEG-1 Layer III kbps (índice 1–14). */
const MP3_CBR_KBPS = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];

function durationFromMpeg(head: Uint8Array, totalSize: number): number | null {
  let offset = 0;
  if (head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33) {
    if (head.length < 10) return null;
    const size =
      ((head[6] ?? 0) & 0x7f) * 0x200000 +
      ((head[7] ?? 0) & 0x7f) * 0x4000 +
      ((head[8] ?? 0) & 0x7f) * 0x80 +
      ((head[9] ?? 0) & 0x7f);
    offset = 10 + size;
  }
  if (offset + 4 > head.length) return null;
  if (head[offset] !== 0xff || ((head[offset + 1] ?? 0) & 0xe0) !== 0xe0) return null;
  const bitrateIndex = ((head[offset + 2] ?? 0) >> 4) & 0x0f;
  const kbps = MP3_CBR_KBPS[bitrateIndex];
  if (!kbps) return null;
  const sec = (totalSize * 8) / (kbps * 1000);
  return Number.isFinite(sec) && sec >= 0 ? sec : null;
}

function durationFromWebm(head: Uint8Array): number | null {
  for (let i = 0; i < head.length - 10; i++) {
    if (head[i] !== 0x44 || head[i + 1] !== 0x89) continue;
    const sizeByte = head[i + 2] ?? 0;
    if (sizeByte === 0x88 && i + 11 <= head.length) {
      const view = new DataView(head.buffer, head.byteOffset + i + 3, 8);
      const sec = view.getFloat64(0);
      if (Number.isFinite(sec) && sec >= 0 && sec < 24 * 3600) return sec;
    }
    if (sizeByte === 0x84 && i + 7 <= head.length) {
      const view = new DataView(head.buffer, head.byteOffset + i + 3, 4);
      const sec = view.getFloat32(0);
      if (Number.isFinite(sec) && sec >= 0 && sec < 24 * 3600) return sec;
    }
  }
  return null;
}

export function durationSecondsFromMediaBytes(opts: {
  mime: string;
  head: Uint8Array;
  tail?: Uint8Array;
  totalSize: number;
}): number | null {
  const mime = canonicalizeStoryMediaMime(opts.mime);
  if (mime === "audio/wav") return durationFromWav(opts.head, opts.totalSize);
  if (mime === "audio/mpeg") return durationFromMpeg(opts.head, opts.totalSize);
  if (mime === "video/webm" || mime === "audio/webm") {
    return durationFromWebm(opts.head);
  }
  if (
    mime === "video/mp4" ||
    mime === "video/quicktime" ||
    mime === "audio/mp4"
  ) {
    return (
      durationFromMvhd(opts.head) ??
      (opts.tail ? durationFromMvhd(opts.tail) : null)
    );
  }
  return null;
}

export function isAudioOrVideoMime(mime: string): boolean {
  const m = canonicalizeStoryMediaMime(mime);
  return m.startsWith("audio/") || m.startsWith("video/");
}
