export interface NormalizedJob {
  title: string;
  companyName: string;
  locationRaw: string;
  remoteFlagRaw: string | null;
  description: string;
  originalPostedAt: string | null;
  sourceUrl: string;
  sourceJobId: string | null;
  rawPayload: unknown;
}
