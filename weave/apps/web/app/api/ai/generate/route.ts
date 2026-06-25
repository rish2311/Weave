/**
 * POST /api/ai/generate
 *
 * Phase 3: AI generation endpoint.
 * Accepts a user prompt and returns a flat WeaveNode array
 * strictly validated against the AST Zod schema.
 *
 * This runs server-side only — the GEMINI_API_KEY never reaches the browser.
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { nanoid } from "nanoid";
import { ZAIGenerationResponse } from "@weave/ast-schema";

// ---------------------------------------------------------------------------
// System prompt — teaches the LLM the Weave AST format
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert UI engineer for Weave, a visual application builder.
Your job is to generate UI sections as a structured JSON object.

RULES (follow exactly):
1. Output ONLY valid JSON matching the schema below. No markdown, no explanation, no code fences.
2. Available node types: BOX, CONTAINER, TEXT, BUTTON, IMAGE, INPUT, DIVIDER, LINK.
3. BOX and CONTAINER can have children. TEXT, BUTTON, IMAGE, INPUT, DIVIDER, LINK cannot.
4. Every node needs a unique short ID (e.g. "h1", "hero-btn", "card-1"). Use descriptive names.
5. Root nodes have parentId: null. Child nodes reference their parent's ID.
6. rootIds lists only the top-level nodes (parentId === null).
7. childIds must list only direct children, in order. Leaf nodes have childIds: [].
8. The design theme: dark background (#0F0F13 or #13131A), indigo/violet accents (#6366F1, #8B5CF6).
9. All text colors: #F8F8FF (primary), #9CA3AF (muted). Never use plain black.
10. Timestamps: use "2024-01-01T00:00:00.000Z" for createdAt and updatedAt.
11. BUTTON props must include "label". TEXT props must include "content".
12. Be generous — a good section has 6-20 nodes. Make it real, not a placeholder.

━━━━━━━━━━━━━━ CRITICAL SCHEMA RULES ━━━━━━━━━━━━━━
These are the EXACT object shapes required. Raw strings or numbers will be REJECTED.

DIMENSION (for width, height, minWidth, maxWidth, minHeight, maxHeight):
  WRONG: "width": "100%"
  RIGHT: "width": { "value": 100, "unit": "%" }
  WRONG: "height": "auto"
  RIGHT: "height": { "value": "auto", "unit": "auto" }
  Valid units: "px", "%", "rem", "em", "vw", "vh", "auto", "fr"

SPACING (for padding, margin):
  WRONG: "padding": 16
  RIGHT: "padding": { "top": 16, "right": 16, "bottom": 16, "left": 16 }
  All fields (top, right, bottom, left) are optional numbers.

BACKGROUND (must have "type" field):
  WRONG: "background": "#0F0F13"
  RIGHT: "background": { "type": "color", "color": "#0F0F13" }
  For gradient: { "type": "gradient", "gradient": { "type": "linear", "angle": 135, "stops": [{ "color": "#6366F1", "position": 0 }, { "color": "#8B5CF6", "position": 100 }] } }

FONT WEIGHT (must be a STRING, not a number):
  WRONG: "fontWeight": 600
  RIGHT: "fontWeight": "600"
  Valid values: "100","200","300","400","500","600","700","800","900"

GAP: plain number is fine — "gap": 16

STYLES EXAMPLE (correct):
{
  "display": "flex",
  "flexDirection": "column",
  "alignItems": "center",
  "justifyContent": "center",
  "gap": 16,
  "padding": { "top": 48, "right": 24, "bottom": 48, "left": 24 },
  "background": { "type": "color", "color": "#0F0F13" },
  "width": { "value": 100, "unit": "%" },
  "typography": {
    "fontSize": 16,
    "fontWeight": "400",
    "color": "#F8F8FF"
  }
}

OUTPUT FORMAT:
{
  "nodes": [ ...flat array of all WeaveNodes... ],
  "rootIds": [ ...IDs of nodes with parentId: null... ],
  "description": "brief description of what was generated"
}`;

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 503 }
    );
  }

  let prompt: string;
  let parentId: string | null = null;

  try {
    const body = await req.json() as { prompt?: string; parentId?: string };
    prompt = body.prompt?.trim() ?? "";
    parentId = body.parentId ?? null;
    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a Weave UI section for: "${prompt}"\n\nRemember to assign unique, descriptive IDs to every node.`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.4,
        responseMimeType: "application/json",
      }
    });

    const raw = response.text;
    if (!raw) {
      return NextResponse.json({ error: "Empty response from AI" }, { status: 500 });
    }

    // Log raw output for debugging — remove in production
    console.log("[AI Generate] Raw Gemini output (first 3000 chars):", raw.slice(0, 3000));

    // Parse and validate strictly against Zod schema
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("[AI Generate] JSON.parse failed. Raw:", raw.slice(0, 500));
      return NextResponse.json({ error: "AI returned invalid JSON", raw }, { status: 500 });
    }
    console.log("[AI Generate] Parsed top-level keys:", Object.keys(parsed as object));

    const validated = ZAIGenerationResponse.safeParse(parsed);
    if (!validated.success) {
      const flat = validated.error.flatten();
      console.error("[AI Generate] Zod validation failed — field errors:");
      console.error(JSON.stringify(flat.fieldErrors, null, 2));
      if (flat.formErrors.length) console.error("Form errors:", flat.formErrors);
      // Log per-node errors if nodes array has issues
      validated.error.issues.slice(0, 10).forEach((issue) => {
        console.error(`  [${issue.path.join(".")}] ${issue.message} (got: ${issue.code})`);
      });
      return NextResponse.json(
        { error: "AI output failed schema validation", details: flat },
        { status: 422 }
      );
    }

    return NextResponse.json({
      ...validated.data,
      parentId,
      requestId: nanoid(8),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[AI Generate] Gemini error:", message);
    return NextResponse.json({ error: `Gemini request failed: ${message}` }, { status: 500 });
  }
}
