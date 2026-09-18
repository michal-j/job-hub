// Status colors now live as CSS custom properties per theme (see
// app/globals.css, --status-*) so each theme can pick its own palette.
// This just maps a status value to the right variable name, with a
// fallback for anything unexpected.
const KNOWN_STATUSES = [
  "new",
  "interested",
  "applied",
  "interviewing",
  "rejected",
  "offer",
  "not_interested",
];

export function statusColorVar(status: string): string {
  const key = KNOWN_STATUSES.includes(status) ? status : "new";
  return `var(--status-${key})`;
}
