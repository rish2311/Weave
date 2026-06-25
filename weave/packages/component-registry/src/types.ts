import type { WeaveNodeType } from "@weave/ast-schema";

// ---------------------------------------------------------------------------
// Component registry metadata types
// ---------------------------------------------------------------------------

export type PropertyControl =
  | { type: "text"; label: string; propKey: string; placeholder?: string }
  | { type: "number"; label: string; propKey: string; min?: number; max?: number; step?: number; unit?: string }
  | { type: "color"; label: string; propKey: string }
  | { type: "select"; label: string; propKey: string; options: Array<{ label: string; value: string }> }
  | { type: "boolean"; label: string; propKey: string }
  | { type: "image"; label: string; propKey: string }
  | { type: "textarea"; label: string; propKey: string; placeholder?: string };

export type StyleControl =
  | { type: "spacing"; label: string; styleKey: "padding" | "margin" }
  | { type: "dimension"; label: string; styleKey: "width" | "height" | "minWidth" | "maxWidth" | "minHeight" | "maxHeight" }
  | { type: "color"; label: string; styleKey: string }
  | { type: "typography" }
  | { type: "background" }
  | { type: "border" }
  | { type: "shadow" }
  | { type: "layout" }
  | { type: "position" };

export type ComponentCategory =
  | "layout"
  | "text"
  | "media"
  | "form"
  | "interactive"
  | "navigation";

/** Metadata about a component type used by the panel and sidebar */
export interface ComponentMeta {
  type: WeaveNodeType;
  label: string;
  description: string;
  category: ComponentCategory;
  icon: string; // Emoji or icon name
  canHaveChildren: boolean;
  propControls: PropertyControl[];
  styleControls: StyleControl[];
  defaultWidth?: number;
  defaultHeight?: number;
}
