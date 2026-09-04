import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";

export interface CvFacts {
  summary: string;
  seniority_level: string;
  total_years_experience: number | null;
  skills: string[];
  domains_industries: string[];
  roles: {
    title: string;
    company: string;
    years: string;
    highlights: string[];
  }[];
  education: {
    degree: string;
    field: string;
    institution: string;
  }[];
}

const EXTRACTION_PROMPT = `You are extracting structured facts from a CV/resume for use in a job-matching system. Read the CV text below and return ONLY a JSON object (no markdown fences, no commentary) with this exact shape:

{
  "summary": "1-2 sentence neutral summary of this person's professional profile",
  "seniority_level": "e.g. Junior / Mid / Senior / Lead / Director",
  "total_years_experience": <number of years of total professional experience, your best estimate, or null if unclear>,
  "skills": ["skill1", "skill2", ...],
  "domains_industries": ["industry1", "industry2", ...],
  "roles": [
    { "title": "...", "company": "...", "years": "e.g. 2021-2024", "highlights": ["key achievement or responsibility", ...] }
  ],
  "education": [
    { "degree": "...", "field": "...", "institution": "..." }
  ]
}

Only use information actually present in the CV text. Do not invent details. If a field genuinely can't be determined, use an empty array, empty string, or null as appropriate — never fabricate.

CV text:
"""
{{CV_TEXT}}
"""`;

export async function extractCvFacts(rawText: string): Promise<CvFacts> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: EXTRACTION_PROMPT.replace("{{CV_TEXT}}", rawText),
      },
    ],
  });

  const text = response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();

  // Defensive: strip markdown code fences if the model adds them despite
  // instructions not to.
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "");

  try {
    return JSON.parse(cleaned) as CvFacts;
  } catch (err) {
    throw new Error(
      `AI returned unparseable output for CV extraction: ${text.slice(0, 200)}`
    );
  }
}
