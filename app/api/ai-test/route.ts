import { NextResponse } from "next/server";
import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";

// Temporary endpoint to confirm the Anthropic API key and billing are
// working before we build real AI features on top of it. Safe to delete
// once confirmed, or keep as a quick diagnostic.
export async function GET() {
  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 50,
      messages: [
        {
          role: "user",
          content: "Reply with exactly: Job Hub AI connection working.",
        },
      ],
    });

    const text = response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("");

    return NextResponse.json({ ok: true, response: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
