import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { captureRef } from "react-native-view-shot";
import React from "react";

export interface WatermarkData {
  latitude: string;
  longitude: string;
  timestamp: string; // ISO string
  referenceId?: string;
}

/**
 * Stamps latitude, longitude and datetime onto a photo.
 * Returns the URI of the new watermarked image.
 *
 * Strategy:
 * 1. Resize original image to a known width so text is proportional
 * 2. Use react-native-view-shot to capture a View that overlays
 *    the image + text stamp together
 * 3. Return the captured URI
 */

function splitText(text: string, chunkSize = 25) {
  const result = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    result.push(text.slice(i, i + chunkSize));
  }
  return result;
}

// Format timestamp to readable string
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

// Build stamp lines
export function buildStampLines(data: WatermarkData): string[] {
  const lines: string[] = [];
  if (data.referenceId) {
    lines.push("Ref ID:");
    lines.push(...splitText(data.referenceId));
  }
  lines.push(`Lat: ${data.latitude}`);
  lines.push(`Lon: ${data.longitude}`);
  lines.push(`Time: ${formatStampTime(data.timestamp)}`);
  return lines;
}
