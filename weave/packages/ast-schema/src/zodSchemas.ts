/**
 * zodSchemas.ts — Phase 3: AI-Native Integration
 *
 * Zod schemas that mirror the WeaveNode AST types.
 * These serve two purposes:
 *   1. Runtime validation of LLM-generated AST output.
 *   2. JSON Schema generation (via zodToJsonSchema) passed to
 *      OpenAI's structured outputs so the model is hard-constrained.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Style primitives
// ---------------------------------------------------------------------------

const ZWeaveDimension = z.object({
  value: z.union([z.number(), z.literal("auto")]),
  unit: z.enum(["px", "%", "rem", "em", "vw", "vh", "auto", "fr"]),
});

const ZWeaveSpacing = z.object({
  top: z.number().optional(),
  right: z.number().optional(),
  bottom: z.number().optional(),
  left: z.number().optional(),
});

const ZWeaveBorder = z.object({
  width: z.number().optional(),
  style: z.enum(["solid", "dashed", "dotted", "none"]).optional(),
  color: z.string().optional(),
  radius: z.union([z.number(), ZWeaveSpacing]).optional(),
});

const ZWeaveShadow = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  blur: z.number().optional(),
  spread: z.number().optional(),
  color: z.string().optional(),
  inset: z.boolean().optional(),
});

const ZWeaveBackground = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("color"),
    color: z.string().optional(),
  }),
  z.object({
    type: z.literal("gradient"),
    gradient: z.object({
      type: z.enum(["linear", "radial"]),
      angle: z.number().optional(),
      stops: z.array(z.object({ color: z.string(), position: z.number() })),
    }).optional(),
  }),
  z.object({
    type: z.literal("image"),
    imageUrl: z.string().optional(),
    imageSize: z.enum(["cover", "contain", "auto"]).optional(),
    imageRepeat: z.enum(["no-repeat", "repeat", "repeat-x", "repeat-y"]).optional(),
    imagePosition: z.string().optional(),
  }),
]);

const ZWeaveTypography = z.object({
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  fontWeight: z.enum(["100","200","300","400","500","600","700","800","900"]).optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  textAlign: z.enum(["left","center","right","justify"]).optional(),
  color: z.string().optional(),
  textDecoration: z.enum(["none","underline","line-through"]).optional(),
  textTransform: z.enum(["none","uppercase","lowercase","capitalize"]).optional(),
});

export const ZWeaveStyles = z.object({
  // Layout
  display: z.enum(["flex","grid","block","inline","inline-block","none"]).optional(),
  flexDirection: z.enum(["row","column","row-reverse","column-reverse"]).optional(),
  flexWrap: z.enum(["nowrap","wrap","wrap-reverse"]).optional(),
  alignItems: z.enum(["flex-start","flex-end","center","stretch","baseline"]).optional(),
  justifyContent: z.enum(["flex-start","flex-end","center","space-between","space-around","space-evenly"]).optional(),
  gap: z.number().optional(),
  flex: z.union([z.string(), z.number()]).optional(),
  // Sizing
  width: ZWeaveDimension.optional(),
  height: ZWeaveDimension.optional(),
  minWidth: ZWeaveDimension.optional(),
  maxWidth: ZWeaveDimension.optional(),
  minHeight: ZWeaveDimension.optional(),
  maxHeight: ZWeaveDimension.optional(),
  // Spacing
  padding: ZWeaveSpacing.optional(),
  margin: ZWeaveSpacing.optional(),
  // Positioning
  position: z.enum(["static","relative","absolute","fixed","sticky"]).optional(),
  top: z.number().optional(),
  right: z.number().optional(),
  bottom: z.number().optional(),
  left: z.number().optional(),
  zIndex: z.number().optional(),
  // Visual
  background: ZWeaveBackground.optional(),
  border: ZWeaveBorder.optional(),
  boxShadow: z.array(ZWeaveShadow).optional(),
  opacity: z.number().min(0).max(1).optional(),
  overflow: z.enum(["visible","hidden","scroll","auto"]).optional(),
  // Typography
  typography: ZWeaveTypography.optional(),
  // Misc
  transform: z.string().optional(),
  transition: z.string().optional(),
  cursor: z.string().optional(),
});

// ---------------------------------------------------------------------------
// AI-optimized node schema
// ---------------------------------------------------------------------------
// We use a FLAT representation for AI output — the AI provides all nodes
// in a flat array with parentId references. This is simpler for the LLM
// to reason about than a deeply nested tree.

export const ZWeaveNodeType = z.enum([
  "BOX", "TEXT", "BUTTON", "IMAGE", "CONTAINER",
  "INPUT", "DIVIDER", "LINK",
]);

export const ZAIGeneratedNode = z.object({
  /** Unique ID — the AI must generate unique nanoid-style strings */
  id: z.string().min(1).max(50),
  /** Human-readable name shown in the layers panel — optional, defaults to type */
  name: z.string().optional().default(""),
  type: ZWeaveNodeType,
  locked: z.boolean().optional().default(false),
  hidden: z.boolean().optional().default(false),
  /** null = root node of the section */
  parentId: z.string().nullable(),
  /** Ordered IDs of child nodes — optional, defaults to [] */
  childIds: z.array(z.string()).optional().default([]),
  styles: ZWeaveStyles.optional().default({}),
  /** Node-specific props (content, label, src, href, etc.) — optional, defaults to {} */
  props: z.record(z.unknown()).optional().default({}),
  tag: z.string().optional(),
  createdAt: z.string().optional().default("2024-01-01T00:00:00.000Z"),
  updatedAt: z.string().optional().default("2024-01-01T00:00:00.000Z"),
});

/** The complete AI generation response */
export const ZAIGenerationResponse = z.object({
  /** All generated nodes as a flat array */
  nodes: z.array(ZAIGeneratedNode).min(1).max(200),
  /** IDs of the root-level nodes (parentId === null) */
  rootIds: z.array(z.string()).min(1),
  /** Brief description of what was generated */
  description: z.string().optional(),
});

export type AIGeneratedNode = z.infer<typeof ZAIGeneratedNode>;
export type AIGenerationResponse = z.infer<typeof ZAIGenerationResponse>;
