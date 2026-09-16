// app/api/generate-page/route.ts
import { NextRequest, NextResponse } from "next/server";
import { repairAndParseJson } from "@/lib/json-repair";
import type {
  GeneratePageRequest,
  GeneratePageResponse,
  LandingPageBlueprint,
  SectionKey,
} from "@/types";

export const runtime = "nodejs";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "inclusionai/ling-3.0-flash-vl:free";

// ---------------------------------------------------------------------------
// Schema description embedded in the system prompt so the model knows the
// exact shape of the JSON we expect back.
// ---------------------------------------------------------------------------

const SCHEMA_DESCRIPTION = `{
  "meta": { "productName": string, "tagline": string, "targetAudience": string, "industry": string },
  "hero": { "eyebrow": string, "headline": string, "subheadline": string, "primaryCta": string, "secondaryCta": string },
  "featureGrid": {
    "heading": string, "subheading": string,
    "features": [ { "icon": string (a valid lucide-react icon name, e.g. "Zap", "ShieldCheck", "Rocket", "BarChart3"), "title": string, "description": string } ] (exactly 3 items)
  },
  "pricing": {
    "heading": string, "subheading": string,
    "tiers": [ { "name": string, "price": string, "billingPeriod": string, "description": string, "features": string[], "ctaLabel": string, "highlighted": boolean } ] (exactly 3 items, middle tier highlighted: true)
  },
  "cta": { "headline": string, "subheadline": string, "buttonLabel": string },
  "copy": { "toneOfVoice": string, "valuePropositions": string[] (3-5 items), "headlineVariants": string[] (3 items), "ctaVariants": string[] (3 items) }
}`;

function buildSystemPrompt(): string {
  return `You are PageCraft AI, an expert SaaS landing page strategist and conversion copywriter.

You MUST respond with ONLY raw, valid JSON matching this exact schema. Do not include markdown code fences, backticks, explanations, or any text before or after the JSON. Do not prefix with "json". Output must start with "{" and end with "}".

Schema:
${SCHEMA_DESCRIPTION}

Rules:
- All copy must be specific to the user's product idea, never generic placeholder text.
- Keep headlines under 12 words, subheadlines under 28 words.
- Icon names must be valid lucide-react export names (PascalCase, e.g. "Zap", "ShieldCheck", "Rocket").
- Ensure the JSON is syntactically valid: no trailing commas, all keys and string values double-quoted.
- Return exactly one JSON object and nothing else.`;
}

function buildUserPrompt(
  prompt: string,
  regenerateSection?: SectionKey,
  existingBlueprint?: LandingPageBlueprint
): string {
  if (regenerateSection && existingBlueprint) {
    return `The product idea is: "${prompt}".

Here is the current full blueprint JSON for context:
${JSON.stringify(existingBlueprint)}

Regenerate ONLY the "${regenerateSection}" section with fresh, improved content, keeping it consistent with the rest of the blueprint above. Return the FULL blueprint JSON (all sections, matching the original schema exactly), with only the "${regenerateSection}" section changed.`;
  }

  return `Generate a complete landing page blueprint for this product idea: "${prompt}"`;
}

// ---------------------------------------------------------------------------
// Minimal runtime validation so a malformed-but-parseable response doesn't
// silently crash the frontend renderer.
// ---------------------------------------------------------------------------

function isValidBlueprint(data: unknown): data is LandingPageBlueprint {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    !!d.meta &&
    !!d.hero &&
    !!d.featureGrid &&
    !!d.pricing &&
    !!d.cta &&
    !!d.copy &&
    Array.isArray((d.featureGrid as Record<string, unknown>).features) &&
    Array.isArray((d.pricing as Record<string, unknown>).tiers)
  );
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json<GeneratePageResponse>(
        {
          success: false,
          error:
            "OPENROUTER_API_KEY is not configured on the server. Add it to your .env.local file.",
        },
        { status: 500 }
      );
    }

    const body = (await req.json()) as GeneratePageRequest;
    const { prompt, regenerateSection, existingBlueprint, model } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      return NextResponse.json<GeneratePageResponse>(
        { success: false, error: "Please provide a valid product description." },
        { status: 400 }
      );
    }

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(prompt, regenerateSection, existingBlueprint);

    const upstreamResponse = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // Optional but recommended by OpenRouter for attribution/rate limiting.
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "PageCraft AI",
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 2500,
      }),
    });

    if (!upstreamResponse.ok) {
      const errText = await upstreamResponse.text().catch(() => "");
      return NextResponse.json<GeneratePageResponse>(
        {
          success: false,
          error: `OpenRouter request failed (${upstreamResponse.status}): ${
            errText || upstreamResponse.statusText
          }`,
        },
        { status: 502 }
      );
    }

    const upstreamData = await upstreamResponse.json();
    const rawContent: string | undefined =
      upstreamData?.choices?.[0]?.message?.content;

    if (!rawContent) {
      return NextResponse.json<GeneratePageResponse>(
        {
          success: false,
          error: "The model returned an empty response. Try again.",
          rawModelOutput: JSON.stringify(upstreamData),
        },
        { status: 502 }
      );
    }

    let parsed: unknown;
    try {
      parsed = repairAndParseJson<LandingPageBlueprint>(rawContent);
    } catch (parseError) {
      return NextResponse.json<GeneratePageResponse>(
        {
          success: false,
          error:
            "The model's response could not be parsed as valid JSON, even after repair attempts.",
          rawModelOutput: rawContent,
        },
        { status: 502 }
      );
    }

    if (!isValidBlueprint(parsed)) {
      return NextResponse.json<GeneratePageResponse>(
        {
          success: false,
          error: "The model's JSON was parsed but doesn't match the expected schema.",
          rawModelOutput: rawContent,
        },
        { status: 502 }
      );
    }

    return NextResponse.json<GeneratePageResponse>({
      success: true,
      data: parsed,
    });
  } catch (error) {
    return NextResponse.json<GeneratePageResponse>(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}
