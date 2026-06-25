/**
 * templates.ts — Phase 3: Pre-built AST section templates
 *
 * Each template is a self-contained flat array of WeaveNodes + rootIds.
 * They can be injected directly into the editor via injectASTSnippet,
 * and also serve as few-shot examples in the AI system prompt.
 */

import type { WeaveNode } from "./types";

export interface WeaveTemplate {
  id: string;
  name: string;
  description: string;
  category: "hero" | "pricing" | "cta" | "features" | "nav" | "footer" | "form";
  tags: string[];
  nodes: WeaveNode[];
  rootIds: string[];
}

// ---------------------------------------------------------------------------
// Helper — shared node factory for templates (fixed IDs for stability)
// ---------------------------------------------------------------------------

function node(overrides: Partial<WeaveNode> & Pick<WeaveNode, "id" | "type">): WeaveNode {
  const now = "2024-01-01T00:00:00.000Z";
  return {
    name: overrides.type.charAt(0) + overrides.type.slice(1).toLowerCase(),
    locked: false,
    hidden: false,
    parentId: null,
    childIds: [],
    styles: {},
    props: {},
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as WeaveNode;
}

// ---------------------------------------------------------------------------
// TEMPLATE: Dark Hero Section
// ---------------------------------------------------------------------------

export const HERO_DARK_TEMPLATE: WeaveTemplate = {
  id: "hero-dark",
  name: "Dark Hero",
  description: "Full-width hero with headline, subtext, and CTA button",
  category: "hero",
  tags: ["hero", "landing", "dark"],
  rootIds: ["hero-root"],
  nodes: [
    node({
      id: "hero-root", type: "CONTAINER", name: "Hero Section",
      childIds: ["hero-inner"],
      styles: {
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center",
        width: { value: 100, unit: "%" }, minHeight: { value: 80, unit: "vh" },
        padding: { top: 80, right: 40, bottom: 80, left: 40 },
        background: { type: "gradient", gradient: { type: "linear", angle: 135, stops: [{ color: "#0F0F13", position: 0 }, { color: "#1A1A2E", position: 100 }] } },
      },
    }),
    node({
      id: "hero-inner", type: "BOX", name: "Hero Content", parentId: "hero-root",
      childIds: ["hero-badge", "hero-h1", "hero-sub", "hero-cta-row"],
      styles: {
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 24, maxWidth: { value: 720, unit: "px" },
      },
    }),
    node({
      id: "hero-badge", type: "TEXT", name: "Badge", parentId: "hero-inner",
      props: { content: "✦ AI-Native Visual IDE" },
      styles: {
        padding: { top: 6, right: 16, bottom: 6, left: 16 },
        background: { type: "color", color: "rgba(99,102,241,0.15)" },
        border: { width: 1, style: "solid", color: "rgba(99,102,241,0.4)", radius: 999 },
        typography: { fontSize: 13, fontWeight: "500", color: "#818CF8", letterSpacing: 0.5 },
      },
    }),
    node({
      id: "hero-h1", type: "TEXT", name: "Headline", parentId: "hero-inner",
      props: { content: "Build apps visually.\nShip real code." },
      styles: {
        typography: { fontSize: 64, fontWeight: "800", color: "#F8F8FF", textAlign: "center", lineHeight: 1.1, letterSpacing: -1.5 },
      },
    }),
    node({
      id: "hero-sub", type: "TEXT", name: "Subtitle", parentId: "hero-inner",
      props: { content: "Weave is a visual IDE that generates production-grade React & Next.js code. Design on a live canvas, export clean code you actually own." },
      styles: {
        typography: { fontSize: 18, fontWeight: "400", color: "#9CA3AF", textAlign: "center", lineHeight: 1.7 },
        maxWidth: { value: 580, unit: "px" },
      },
    }),
    node({
      id: "hero-cta-row", type: "BOX", name: "CTA Row", parentId: "hero-inner",
      childIds: ["hero-btn-primary", "hero-btn-secondary"],
      styles: { display: "flex", flexDirection: "row", gap: 12, alignItems: "center" },
    }),
    node({
      id: "hero-btn-primary", type: "BUTTON", name: "Primary CTA", parentId: "hero-cta-row",
      props: { label: "Start Building Free →", variant: "solid" },
      styles: {
        padding: { top: 14, right: 28, bottom: 14, left: 28 },
        background: { type: "gradient", gradient: { type: "linear", angle: 135, stops: [{ color: "#6366F1", position: 0 }, { color: "#8B5CF6", position: 100 }] } },
        border: { radius: 10 }, cursor: "pointer",
        typography: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
        boxShadow: [{ x: 0, y: 8, blur: 24, spread: 0, color: "rgba(99,102,241,0.4)" }],
      },
    }),
    node({
      id: "hero-btn-secondary", type: "BUTTON", name: "Secondary CTA", parentId: "hero-cta-row",
      props: { label: "View Demo", variant: "outline" },
      styles: {
        padding: { top: 14, right: 28, bottom: 14, left: 28 },
        background: { type: "color", color: "transparent" },
        border: { width: 1, style: "solid", color: "#2D2D3D", radius: 10 }, cursor: "pointer",
        typography: { fontSize: 15, fontWeight: "500", color: "#9CA3AF" },
      },
    }),
  ],
};

// ---------------------------------------------------------------------------
// TEMPLATE: Pricing Section (3 tiers)
// ---------------------------------------------------------------------------

export const PRICING_TEMPLATE: WeaveTemplate = {
  id: "pricing-3-tier",
  name: "3-Tier Pricing",
  description: "Classic pricing table with Starter, Pro, and Enterprise tiers",
  category: "pricing",
  tags: ["pricing", "saas", "cards"],
  rootIds: ["pricing-root"],
  nodes: [
    node({
      id: "pricing-root", type: "CONTAINER", name: "Pricing Section",
      childIds: ["pricing-header", "pricing-cards"],
      styles: {
        display: "flex", flexDirection: "column", alignItems: "center", gap: 48,
        width: { value: 100, unit: "%" }, padding: { top: 80, right: 40, bottom: 80, left: 40 },
        background: { type: "color", color: "#0A0A12" },
      },
    }),
    node({
      id: "pricing-header", type: "BOX", name: "Pricing Header", parentId: "pricing-root",
      childIds: ["pricing-title", "pricing-desc"],
      styles: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16, maxWidth: { value: 560, unit: "px" } },
    }),
    node({
      id: "pricing-title", type: "TEXT", name: "Title", parentId: "pricing-header",
      props: { content: "Simple, transparent pricing" },
      styles: { typography: { fontSize: 40, fontWeight: "700", color: "#F8F8FF", textAlign: "center" } },
    }),
    node({
      id: "pricing-desc", type: "TEXT", name: "Description", parentId: "pricing-header",
      props: { content: "Start free. Scale when you're ready. No hidden fees." },
      styles: { typography: { fontSize: 17, fontWeight: "400", color: "#6B6B90", textAlign: "center" } },
    }),
    node({
      id: "pricing-cards", type: "BOX", name: "Pricing Cards", parentId: "pricing-root",
      childIds: ["card-starter", "card-pro", "card-enterprise"],
      styles: { display: "flex", flexDirection: "row", gap: 24, alignItems: "flex-start" },
    }),
    // Starter card
    node({
      id: "card-starter", type: "BOX", name: "Starter Card", parentId: "pricing-cards",
      childIds: ["starter-name", "starter-price", "starter-desc", "starter-btn"],
      styles: {
        display: "flex", flexDirection: "column", gap: 20,
        padding: { top: 32, right: 28, bottom: 32, left: 28 },
        background: { type: "color", color: "#13131A" },
        border: { width: 1, style: "solid", color: "#2D2D3D", radius: 16 },
        width: { value: 280, unit: "px" },
      },
    }),
    node({ id: "starter-name", type: "TEXT", name: "Plan Name", parentId: "card-starter", props: { content: "Starter" }, styles: { typography: { fontSize: 14, fontWeight: "600", color: "#9CA3AF" } } }),
    node({ id: "starter-price", type: "TEXT", name: "Price", parentId: "card-starter", props: { content: "$0 / mo" }, styles: { typography: { fontSize: 36, fontWeight: "800", color: "#F8F8FF" } } }),
    node({ id: "starter-desc", type: "TEXT", name: "Description", parentId: "card-starter", props: { content: "Perfect for side projects and learning. 3 projects, 1GB storage." }, styles: { typography: { fontSize: 14, color: "#6B6B90", lineHeight: 1.6 } } }),
    node({ id: "starter-btn", type: "BUTTON", name: "CTA", parentId: "card-starter", props: { label: "Get started free" }, styles: { padding: { top: 12, right: 20, bottom: 12, left: 20 }, background: { type: "color", color: "#1E1E2A" }, border: { width: 1, style: "solid", color: "#2D2D3D", radius: 8 }, cursor: "pointer", typography: { fontSize: 14, fontWeight: "500", color: "#9CA3AF" } } }),
    // Pro card (highlighted)
    node({
      id: "card-pro", type: "BOX", name: "Pro Card", parentId: "pricing-cards",
      childIds: ["pro-badge", "pro-name", "pro-price", "pro-desc", "pro-btn"],
      styles: {
        display: "flex", flexDirection: "column", gap: 20,
        padding: { top: 32, right: 28, bottom: 32, left: 28 },
        background: { type: "gradient", gradient: { type: "linear", angle: 135, stops: [{ color: "rgba(99,102,241,0.15)", position: 0 }, { color: "rgba(139,92,246,0.08)", position: 100 }] } },
        border: { width: 1, style: "solid", color: "#6366F1", radius: 16 },
        width: { value: 280, unit: "px" },
        boxShadow: [{ x: 0, y: 0, blur: 40, spread: 0, color: "rgba(99,102,241,0.2)" }],
      },
    }),
    node({ id: "pro-badge", type: "TEXT", name: "Badge", parentId: "card-pro", props: { content: "⭐ Most Popular" }, styles: { padding: { top: 4, right: 10, bottom: 4, left: 10 }, background: { type: "color", color: "rgba(99,102,241,0.2)" }, border: { radius: 999 }, typography: { fontSize: 11, fontWeight: "600", color: "#818CF8" } } }),
    node({ id: "pro-name", type: "TEXT", name: "Plan Name", parentId: "card-pro", props: { content: "Pro" }, styles: { typography: { fontSize: 14, fontWeight: "600", color: "#A5B4FC" } } }),
    node({ id: "pro-price", type: "TEXT", name: "Price", parentId: "card-pro", props: { content: "$29 / mo" }, styles: { typography: { fontSize: 36, fontWeight: "800", color: "#F8F8FF" } } }),
    node({ id: "pro-desc", type: "TEXT", name: "Description", parentId: "card-pro", props: { content: "For serious builders. Unlimited projects, 50GB storage, AI features." }, styles: { typography: { fontSize: 14, color: "#9CA3AF", lineHeight: 1.6 } } }),
    node({ id: "pro-btn", type: "BUTTON", name: "CTA", parentId: "card-pro", props: { label: "Start Pro trial →" }, styles: { padding: { top: 12, right: 20, bottom: 12, left: 20 }, background: { type: "gradient", gradient: { type: "linear", angle: 135, stops: [{ color: "#6366F1", position: 0 }, { color: "#8B5CF6", position: 100 }] } }, border: { radius: 8 }, cursor: "pointer", typography: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" } } }),
    // Enterprise card
    node({
      id: "card-enterprise", type: "BOX", name: "Enterprise Card", parentId: "pricing-cards",
      childIds: ["ent-name", "ent-price", "ent-desc", "ent-btn"],
      styles: {
        display: "flex", flexDirection: "column", gap: 20,
        padding: { top: 32, right: 28, bottom: 32, left: 28 },
        background: { type: "color", color: "#13131A" },
        border: { width: 1, style: "solid", color: "#2D2D3D", radius: 16 },
        width: { value: 280, unit: "px" },
      },
    }),
    node({ id: "ent-name", type: "TEXT", name: "Plan Name", parentId: "card-enterprise", props: { content: "Enterprise" }, styles: { typography: { fontSize: 14, fontWeight: "600", color: "#9CA3AF" } } }),
    node({ id: "ent-price", type: "TEXT", name: "Price", parentId: "card-enterprise", props: { content: "Custom" }, styles: { typography: { fontSize: 36, fontWeight: "800", color: "#F8F8FF" } } }),
    node({ id: "ent-desc", type: "TEXT", name: "Description", parentId: "card-enterprise", props: { content: "For teams. SSO, audit logs, SLA, dedicated support." }, styles: { typography: { fontSize: 14, color: "#6B6B90", lineHeight: 1.6 } } }),
    node({ id: "ent-btn", type: "BUTTON", name: "CTA", parentId: "card-enterprise", props: { label: "Talk to sales" }, styles: { padding: { top: 12, right: 20, bottom: 12, left: 20 }, background: { type: "color", color: "#1E1E2A" }, border: { width: 1, style: "solid", color: "#2D2D3D", radius: 8 }, cursor: "pointer", typography: { fontSize: 14, fontWeight: "500", color: "#9CA3AF" } } }),
  ],
};

// ---------------------------------------------------------------------------
// TEMPLATE: CTA Banner
// ---------------------------------------------------------------------------

export const CTA_TEMPLATE: WeaveTemplate = {
  id: "cta-banner",
  name: "CTA Banner",
  description: "Conversion-focused call-to-action with gradient background",
  category: "cta",
  tags: ["cta", "conversion", "banner"],
  rootIds: ["cta-root"],
  nodes: [
    node({
      id: "cta-root", type: "CONTAINER", name: "CTA Section",
      childIds: ["cta-inner"],
      styles: {
        display: "flex", alignItems: "center", justifyContent: "center",
        width: { value: 100, unit: "%" }, padding: { top: 80, right: 40, bottom: 80, left: 40 },
        background: { type: "gradient", gradient: { type: "linear", angle: 135, stops: [{ color: "#6366F1", position: 0 }, { color: "#8B5CF6", position: 100 }] } },
      },
    }),
    node({
      id: "cta-inner", type: "BOX", name: "CTA Inner", parentId: "cta-root",
      childIds: ["cta-title", "cta-sub", "cta-btn"],
      styles: { display: "flex", flexDirection: "column", alignItems: "center", gap: 24, maxWidth: { value: 600, unit: "px" } },
    }),
    node({ id: "cta-title", type: "TEXT", name: "Title", parentId: "cta-inner", props: { content: "Ready to build something amazing?" }, styles: { typography: { fontSize: 40, fontWeight: "800", color: "#FFFFFF", textAlign: "center", lineHeight: 1.2 } } }),
    node({ id: "cta-sub", type: "TEXT", name: "Subtitle", parentId: "cta-inner", props: { content: "Join thousands of builders who ship faster with Weave." }, styles: { typography: { fontSize: 17, color: "rgba(255,255,255,0.8)", textAlign: "center" } } }),
    node({ id: "cta-btn", type: "BUTTON", name: "CTA Button", parentId: "cta-inner", props: { label: "Get started for free →" }, styles: { padding: { top: 16, right: 36, bottom: 16, left: 36 }, background: { type: "color", color: "#FFFFFF" }, border: { radius: 12 }, cursor: "pointer", typography: { fontSize: 16, fontWeight: "700", color: "#6366F1" } } }),
  ],
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const WEAVE_TEMPLATES: WeaveTemplate[] = [
  HERO_DARK_TEMPLATE,
  PRICING_TEMPLATE,
  CTA_TEMPLATE,
];

export function getTemplateById(id: string): WeaveTemplate | undefined {
  return WEAVE_TEMPLATES.find((t) => t.id === id);
}
