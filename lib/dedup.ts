import { createHash } from "crypto";

function normalize(value: string): string {
  return value
    .toLowerCase()
    // Ł/ł (Polish L with stroke) has no Unicode decomposition — NFKD below
    // leaves it untouched, so without this it falls through to the
    // catch-all punctuation strip and gets dropped as a stray character
    // instead of read as "l" (e.g. two sources spelling the same Polish
    // company's name with "ł" vs "l" wouldn't collapse to the same hash).
    .replace(/ł/g, "l")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents (ą, ę, ł read closer)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function computeDedupHash(
  title: string,
  companyName: string,
  locationRaw: string
): string {
  const key = `${normalize(title)}|${normalize(companyName)}|${normalize(
    locationRaw
  )}`;
  return createHash("sha256").update(key).digest("hex");
}
