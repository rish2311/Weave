/**
 * GET  /api/ai/templates        → list all templates (metadata only)
 * POST /api/ai/templates/:id    → get a specific template with full nodes
 */

import { NextRequest, NextResponse } from "next/server";
import { WEAVE_TEMPLATES, getTemplateById } from "@weave/ast-schema";

export async function GET() {
  // Return metadata only (no node payloads) for the picker list
  const list = WEAVE_TEMPLATES.map(({ id, name, description, category, tags }) => ({
    id, name, description, category, tags,
  }));
  return NextResponse.json({ templates: list });
}

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json() as { id?: string };
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const template = getTemplateById(id);
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    return NextResponse.json({ template });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
