/**
 * Convierte un HEIC real con heic-to (igual que el cliente) y comprueba que el JPEG no tiene GPS.
 */
const fs = require("fs");
const path = require("path");

function scanGps(buf, label) {
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
  let hasExif = false;
  let hasGps = false;
  if (isJpeg) {
    let i = 2;
    while (i < buf.length - 4 && buf[i] === 0xff) {
      const marker = buf[i + 1];
      if (marker === 0xd8 || marker === 0xd9 || marker === 0xda) break;
      const len = buf.readUInt16BE(i + 2);
      if (marker === 0xe1) {
        const seg = buf.subarray(i + 4, i + 2 + len);
        if (seg.slice(0, 6).equals(Buffer.from("Exif\0\0"))) {
          hasExif = true;
          const body = seg.subarray(6);
          hasGps = body.includes(Buffer.from("GPSLatitude")) || body.includes(Buffer.from([0x00, 0x00, 0x88, 0x25])) || body.includes(Buffer.from([0x25, 0x88]));
        }
      }
      i += 2 + len;
    }
  } else {
    hasExif = buf.includes(Buffer.from("Exif"));
    hasGps =
      buf.includes(Buffer.from("GPSLatitude")) ||
      buf.includes(Buffer.from("GPSLongitude"));
  }
  console.log(label, { bytes: buf.length, jpeg: isJpeg, hasExif, hasGps });
  return { hasExif, hasGps };
}

async function convertWithHeicTo(heicBuf) {
  const { chromium } = require("@playwright/test");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  const iifePath = path.join(process.cwd(), "node_modules/heic-to/dist/iife/heic-to.js");
  await page.addScriptTag({ path: iifePath });
  const b64 = heicBuf.toString("base64");
  const jpegB64 = await page.evaluate(async (b64) => {
    const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const blob = new Blob([raw], { type: "image/heic" });
    const jpeg = await HeicTo({ blob, type: "image/jpeg", quality: 0.9 });
    const ab = await jpeg.arrayBuffer();
    const bytes = new Uint8Array(ab);
    let binary = "";
    const step = 0x8000;
    for (let i = 0; i < bytes.length; i += step) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
    }
    return btoa(binary);
  }, b64);
  await browser.close();
  return Buffer.from(jpegB64, "base64");
}

async function stripLikeServer(jpegBuf) {
  const sharp = require("sharp");
  return sharp(jpegBuf, { failOn: "none" }).rotate().jpeg({ quality: 90 }).toBuffer();
}

async function main() {
  const heicPath = process.argv[2] || "/tmp/heic-verify/sample.heic";
  const heic = fs.readFileSync(heicPath);
  scanGps(heic, "original_heic");

  const converted = await convertWithHeicTo(heic);
  fs.writeFileSync("/tmp/heic-verify/converted.jpg", converted);
  const afterConv = scanGps(converted, "after_heic_to_jpeg");

  const stripped = await stripLikeServer(converted);
  fs.writeFileSync("/tmp/heic-verify/stripped.jpg", stripped);
  const afterStrip = scanGps(stripped, "after_stripImageExif_equiv");

  if (afterConv.hasGps || afterStrip.hasGps) {
    console.error("FAIL: GPS still present");
    process.exit(1);
  }
  console.log("PASS: JPEG after HEIC conversion has no GPS; server strip keeps it clean");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
