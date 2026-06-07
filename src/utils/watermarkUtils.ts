// src/utils/watermarkUtils.ts
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";

export interface WatermarkData {
  latitude: string;
  longitude: string;
  timestamp: string; // ISO string
  referenceId?: string;
}

// ── Format timestamp ──────────────────────────────────────────────────────────
export function formatStampTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const pad = (n: number) => String(n).padStart(2, "0");
    const date = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    return `${date} ${time}`;
  } catch {
    return isoString;
  }
}

// ── Build stamp lines array ───────────────────────────────────────────────────
export function buildStampLines(data: WatermarkData): string[] {
  const lines: string[] = [];
  if (data.referenceId) {
    lines.push(`Ref: ${data.referenceId}`);
  }
  lines.push(`Lat: ${data.latitude}`);
  lines.push(`Lon: ${data.longitude}`);
  lines.push(`Time: ${formatStampTime(data.timestamp)}`);
  return lines;
}

// ── Core: stamp a photo using SVG overlay baked into the image ────────────────
//
// Strategy (no View/ref needed — fully headless):
//   1. Resize image to a fixed width (1080px) via ImageManipulator so text is proportional
//   2. Build an SVG that contains:
//        - The original photo as a <image> element (data:URI base64)
//        - A semi-transparent dark rectangle at the bottom
//        - Text lines over the rectangle
//   3. Save the SVG as a temp .svg file
//   4. Use ImageManipulator to re-process and save as JPEG
//
// NOTE: expo-image-manipulator does NOT support drawing text natively.
// The correct headless approach in Expo is to embed the image inside an SVG,
// then use expo-print or a canvas lib. However the MOST reliable zero-extra-
// dependency approach for Expo Go is:
//   • Use the `expo-image-manipulator` crop/resize for the base image
//   • Encode it to base64
//   • Wrap everything in an HTML page with <canvas>
//   • Use expo-print (headless WebView) to rasterize it back to a PDF/image
//
// For a pure-JS, NO extra native module solution we use the approach below:
// We create an HTML string, use expo-print to render it to a PDF, then
// convert the PDF page to a JPEG via ImageManipulator.
//
// If you prefer react-native-view-shot, see the ViewShot variant at the bottom.

import * as Print from "expo-print";

const STAMP_WIDTH = 1080;

function buildHtml(base64: string, mimeType: string, lines: string[], imgWidth: number, imgHeight: number): string {
  // Scale height proportionally
  const scale = STAMP_WIDTH / imgWidth;
  const scaledH = Math.round(imgHeight * scale);

  const fontSize = Math.round(STAMP_WIDTH * 0.022); // ~24px at 1080
  const lineH = Math.round(fontSize * 1.55);
  const padding = Math.round(STAMP_WIDTH * 0.018);
  const boxH = lineH * lines.length + padding * 2;
  const boxY = scaledH - boxH;

  const textLines = lines
    .map(
      (l, i) =>
        `<text x="${padding}" y="${boxY + padding + fontSize + i * lineH}" 
          font-family="monospace" font-size="${fontSize}" fill="white" 
          font-weight="bold">${escapeXml(l)}</text>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:${STAMP_WIDTH}px; height:${scaledH}px; overflow:hidden; background:#000; }
  svg { display:block; }
</style>
</head>
<body>
<svg xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${STAMP_WIDTH}" height="${scaledH}" viewBox="0 0 ${STAMP_WIDTH} ${scaledH}">
  <!-- Base photo -->
  <image href="data:${mimeType};base64,${base64}" 
         x="0" y="0" width="${STAMP_WIDTH}" height="${scaledH}" 
         preserveAspectRatio="xMidYMid slice"/>
  <!-- Semi-transparent stamp background -->
  <rect x="0" y="${boxY}" width="${STAMP_WIDTH}" height="${boxH}" 
        fill="rgba(0,0,0,0.62)"/>
  <!-- Stamp lines -->
  ${textLines}
</svg>
</body>
</html>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ── Main export: applyWatermark ───────────────────────────────────────────────
//
// ⚠️ NOT USED by the production capture flow. The active path is
// app/data-entry.tsx → StampView → captureRef (view-shot). Keep that the
// only path users can hit, so the "photo comes out darker on some phones"
// regression doesn't sneak back in.
//
// Known darkening hazards in THIS implementation if you re-enable it:
//   1. The HTML wrapper sets `background:#000`, which composites against
//      any non-opaque Image edge → dark border / vignette.
//   2. Photo → base64 → SVG <image> → expo-print PDF → ImageManipulator
//      JPEG is a 4-stage round-trip; each Bitmap decode strips the Ultra
//      HDR gain map (Pixel / recent Samsung etc.), producing the dark SDR
//      baseline.
//   3. Final `compress: 0.88` re-encodes one more time.
//
// If you ever wire this back in, at minimum: change the HTML background to
// white, drop the final re-compress (use 1.0), and verify on an Ultra HDR
// phone before shipping.
export async function applyWatermark(
  imageUri: string,
  data: WatermarkData
): Promise<string> {
  try {
    // 1. Resize to standard width first so we know exact pixel dimensions
    const resized = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: STAMP_WIDTH } }],
      { format: ImageManipulator.SaveFormat.JPEG, compress: 0.92, base64: true }
    );

    if (!resized.base64) throw new Error("base64 encoding failed after resize");

    const imgW = resized.width;
    const imgH = resized.height;
    const lines = buildStampLines(data);

    // 2. Build HTML with SVG overlay
    const html = buildHtml(resized.base64, "image/jpeg", lines, imgW, imgH);

    // 3. Render HTML → PDF via expo-print (headless, no UI)
    const scale = STAMP_WIDTH / 72; // points-to-px: expo-print renders at 72dpi by default
    const pageW = imgW / (96 / 72);  // convert px → points (1pt = 1/72in, 1px = 1/96in)
    const pageH = imgH / (96 / 72);

    const { uri: pdfUri } = await Print.printToFileAsync({
      html,
      width: Math.round(pageW),
      height: Math.round(pageH),
    });

    // 4. Convert PDF → JPEG via ImageManipulator
    const final = await ImageManipulator.manipulateAsync(
      pdfUri,
      [],
      { format: ImageManipulator.SaveFormat.JPEG, compress: 0.88 }
    );

    // 5. Clean up temp PDF
    try { await FileSystem.deleteAsync(pdfUri, { idempotent: true }); } catch {}

    return final.uri;
  } catch (err) {
    console.error("[applyWatermark] failed:", err);
    // Fallback: return original image unstamped rather than crash
    return imageUri;
  }
}