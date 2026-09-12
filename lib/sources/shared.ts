// Sources whose APIs return an entire company's job board (not filtered
// by keyword) need this client-side filter before anything gets stored
// or sent to AI scoring — otherwise every department's postings would
// flow through the pipeline.
export const PM_TITLE_MATCH = /product\s*(manager|owner|management)/i;

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
