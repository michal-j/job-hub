import { createHash } from "crypto";

function normalize(value: string): string {
  return value
    .toLowerCase()
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
