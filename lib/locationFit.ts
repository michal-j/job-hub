import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";

export interface LocationFitResult {
  verdict: "fit" | "no_fit" | "unknown";
  explanation: string;
  highlights: string[];
}

// Candidate context is fixed for this personal tool — one person, one
// location. If that ever changes (multi-profile support), this becomes
// a parameter instead of a constant.
const CANDIDATE_CONTEXT = `The candidate is based in Poznań, Poland (EU). They are open to:
- On-site or hybrid roles specifically in Poznań
- Fully remote roles, PROVIDED the employer can realistically employ someone located in Poland/the EU
- Working hours reasonably compatible with Central European Time (some overlap required, but flexible — no hard cutoff)

The candidate is NOT limited to Polish or EU companies — a US or global company that explicitly allows remote work from the EU/Europe/EMEA/Poland is relevant. A listing that only says "Remote" with no region information, or restricts to a region that excludes Poland (e.g. "US only", "Americas"), should NOT be assumed compatible.`;

const LOCATION_PROMPT = `You are assessing whether a specific candidate could realistically apply for and work in a job, based on location, remote-work terms, and employment eligibility. This is for a personal job-search tool — be honest about uncertainty rather than guessing generously.

${CANDIDATE_CONTEXT}

Distinguish between: where the company is based, where the job can be performed, where the employer is willing/able to employ someone, and expected working hours — these are not the same thing. Base your assessment only on what's actually stated; do not assume "Remote" means "remote from anywhere."

HARD RULE: if the listing describes a hybrid work model (regularly required in-office, even part-time) AND the office/location is anywhere other than Poznań, Poland — this is automatically "no_fit", regardless of any other remote-eligibility language elsewhere in the listing. Hybrid inherently requires physical presence, so remote eligibility elsewhere doesn't rescue it. Only skip this rule if the hybrid location genuinely is Poznań.

Return ONLY a JSON object (no markdown fences, no commentary) with this exact shape:

{
  "verdict": "fit" | "no_fit" | "unknown",
  "explanation": "1-2 sentence plain-English explanation of the verdict, citing what the listing actually says",
  "highlights": ["short bullet on a specific eligibility or timezone signal, max ~12 words", "..."]
}

Guidance on verdict:
- "fit": clearly workable — on-site/hybrid/remote specifically in Poznań, OR remote with explicit Poland/EU/Europe/EMEA eligibility and no obvious timezone blocker
- "no_fit": explicitly excluded — restricted to a region that doesn't include Poland/EU, or on-site somewhere else with no remote option
- "unknown": genuinely ambiguous — e.g. says "Remote" with no region info, or eligibility can't be determined from what's given. Prefer "unknown" over guessing when evidence is thin — a false "no_fit" hides a real opportunity, and a false "fit" wastes the candidate's time, but "unknown" honestly flags it for a closer look.

highlights should have 1-3 items, the specific pieces of evidence (or lack thereof) that drove the verdict.

JOB TITLE: {{JOB_TITLE}}

JOB LOCATION (as given by the source): {{LOCATION_RAW}}

REMOTE STATUS (as given by the source, may be absent): {{REMOTE_FLAG}}

JOB DESCRIPTION:
"""
{{JOB_DESCRIPTION}}
"""`;

export async function analyzeLocationFit(
  jobTitle: string,
  locationRaw: string,
  remoteFlagRaw: string | null,
  jobDescription: string
): Promise<LocationFitResult> {
  const client = getAnthropicClient();

  const prompt = LOCATION_PROMPT.replace("{{JOB_TITLE}}", jobTitle)
    .replace("{{LOCATION_RAW}}", locationRaw || "(not specified)")
    .replace("{{REMOTE_FLAG}}", remoteFlagRaw || "(not specified)")
    .replace(
      "{{JOB_DESCRIPTION}}",
      jobDescription || "(no description available)"
    );

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();

  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "");

  try {
    return JSON.parse(cleaned) as LocationFitResult;
  } catch {
    throw new Error(
      `AI returned unparseable output for location fit: ${text.slice(0, 200)}`
    );
  }
}
