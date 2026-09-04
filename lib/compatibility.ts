import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";
import type { CvFacts } from "@/lib/cv";

export interface CompatibilityResult {
  overall_score: number;
  category_scores: {
    skills: number;
    experience: number;
    domain_industry: number;
    seniority: number;
  };
  overview: string;
  highlights: string[];
}

const SCORING_PROMPT = `You are scoring how well a candidate's profile fits a job listing, for a personal job-search tool. Be honest and specific — this is for the candidate's own decision-making, not a sales pitch.

Score four categories from 0-100 each:
- skills: overlap between candidate's skills and what the role needs
- experience: relevance of past roles/responsibilities to this role
- domain_industry: overlap in industry/domain background
- seniority: whether the candidate's seniority level matches what's expected

Then compute overall_score (0-100) as your holistic judgment informed by those four — not necessarily a simple average, since some mismatches matter more than others (e.g. a hard seniority mismatch should weigh heavily).

Note: location/remote-work eligibility is handled separately elsewhere in this system — do NOT factor location into your score, and do not mention it anywhere in your output.

Return ONLY a JSON object (no markdown fences, no commentary) with this exact shape:

{
  "overall_score": <0-100>,
  "category_scores": { "skills": <0-100>, "experience": <0-100>, "domain_industry": <0-100>, "seniority": <0-100> },
  "overview": "1-2 sentence plain-English summary covering both the main strength(s) and the main gap(s) — everyday language, no jargon, written for someone skimming quickly",
  "highlights": ["short bullet, either a strength or a gap, max ~12 words", "...", "..."]
}

highlights should have 2-3 items max, mixing the most important strengths and gaps — prioritize whatever most affects the score, not an exhaustive list.

CANDIDATE PROFILE:
"""
{{CV_FACTS}}
"""

JOB TITLE: {{JOB_TITLE}}

JOB DESCRIPTION:
"""
{{JOB_DESCRIPTION}}
"""`;

export async function analyzeCompatibility(
  cvFacts: CvFacts,
  jobTitle: string,
  jobDescription: string
): Promise<CompatibilityResult> {
  const client = getAnthropicClient();

  const prompt = SCORING_PROMPT.replace(
    "{{CV_FACTS}}",
    JSON.stringify(cvFacts, null, 2)
  )
    .replace("{{JOB_TITLE}}", jobTitle)
    .replace("{{JOB_DESCRIPTION}}", jobDescription || "(no description available)");

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 700,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();

  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "");

  try {
    return JSON.parse(cleaned) as CompatibilityResult;
  } catch {
    throw new Error(
      `AI returned unparseable output for compatibility scoring: ${text.slice(0, 200)}`
    );
  }
}
