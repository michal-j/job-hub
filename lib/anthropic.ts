import Anthropic from "@anthropic-ai/sdk";

export function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable.");
  }
  return new Anthropic({ apiKey });
}

// Cheapest current model — plenty for structured extraction and
// compatibility scoring. Centralized here so it's a one-line change if
// we ever want to upgrade for quality.
export const AI_MODEL = "claude-haiku-4-5-20251001";
