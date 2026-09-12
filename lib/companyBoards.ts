// To add a new company later: find its careers URL, identify the ATS
// from the URL pattern, grab the slug, add a line below.
//
//   Greenhouse:      boards.greenhouse.io/{slug}          → platform: "greenhouse"
//   Ashby:           jobs.ashbyhq.com/{slug}               → platform: "ashby"
//   SmartRecruiters: careers.smartrecruiters.com/{slug}    → platform: "smartrecruiters"
//
// sourceName is what shows up in the app's source filter pills — keep it
// short and recognizable.

export interface CompanyBoardConfig {
  sourceName: string;
  platform: "greenhouse" | "ashby" | "smartrecruiters";
  slug: string;
}

export const COMPANY_BOARDS: CompanyBoardConfig[] = [
  { sourceName: "remote.com", platform: "greenhouse", slug: "remotecom" },
  // Deel removed: their Ashby board's public API returns an empty jobs
  // list (confirmed both "deel" and "Deel" casing) despite live listings
  // on their actual careers page — looks like they've restricted public
  // API access for their board specifically. Not something to work
  // around; add back if that ever changes.
  {
    sourceName: "smartrecruiters",
    platform: "smartrecruiters",
    slug: "SmartRecruiters",
  },
];
