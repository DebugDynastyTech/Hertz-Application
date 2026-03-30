import { createEntry } from "./entryService";

const normalizeSpeciesRows = (rows: any[] = []) =>
  rows.map((row) => ({
    name:     row.name     ?? row.species  ?? "",
    planted:  Number(row.planted   ?? 0),
    survival: Number(row.survival  ?? 0),
    height:   Number(row.height    ?? 0),
  }));

const normalizeProtectionRows = (rows: any[] = []) =>
  rows.map((row) => ({
    name: row.name ?? row.wallType ?? "",
    rmt:  Number(row.rmt ?? 0),
  }));

const normalizeLocationRows = (rows: any[] = []) =>
  rows.map((row) => ({
    lat:  Number(row.lat  ?? row.latitude  ?? 0),
    long: Number(row.long ?? row.longitude ?? 0),
  }));

export const uploadEntryWithImages = async (
  entryData: any,
  images: any[] = [],
) => {
  // ── Rebuild imageLocations with lat/lng ───────────────────────────────────
  // New drafts store full imageLocations: [{ latitude, longitude, image }]
  // Old drafts only stored images: [{ uri, timestamp }]
  // We handle both formats here.
  const imageLocations: any[] = (() => {
    // New format — imageLocations saved with full lat/lng
    if (
      Array.isArray(entryData.imageLocations) &&
      entryData.imageLocations.length > 0
    ) {
      return entryData.imageLocations.map((e: any) => ({
        latitude:  e.latitude  ?? "",
        longitude: e.longitude ?? "",
        image:     e.image     ?? null,
      }));
    }
    // Old format — only images array, no location data per image
    return images.map((img: any) => ({
      latitude:  "",
      longitude: "",
      image:     img,
    }));
  })();

  // Extract just the image objects for createEntry's 2nd param
  const imageFiles = imageLocations
    .filter((e) => e.image != null)
    .map((e) => e.image);

  return createEntry(
    {
      referenceId:        entryData.referenceId,
      date:               entryData.date,
      village:            entryData.village,
      numberOfRows:       entryData.numberOfRows,
      plantsPerRow:       entryData.plantsPerRow,
      waterFacility:      entryData.waterFacility,
      reason:             entryData.reason,
      speciesRows:        normalizeSpeciesRows(entryData.speciesRows),
      naturalspeciesRows: normalizeSpeciesRows(entryData.naturalspeciesRows),
      protectionRows:     normalizeProtectionRows(entryData.protectionRows),
      locationRows:       normalizeLocationRows(entryData.locationRows),
    },
    imageFiles,       // array of { uri, timestamp } — same as before
    imageLocations,   // ← NEW: full array with lat/lng per image
  );
};