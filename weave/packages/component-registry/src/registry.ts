import type { ComponentMeta, ComponentCategory } from "./types";
import type { WeaveNodeType } from "@weave/ast-schema";

// ---------------------------------------------------------------------------
// Component registry — defines all built-in components
// ---------------------------------------------------------------------------

const LAYOUT_STYLE_CONTROLS: ComponentMeta["styleControls"] = [
  { type: "layout" },
  { type: "spacing", label: "Padding", styleKey: "padding" },
  { type: "spacing", label: "Margin", styleKey: "margin" },
  { type: "dimension", label: "Width", styleKey: "width" },
  { type: "dimension", label: "Height", styleKey: "height" },
  { type: "background" },
  { type: "border" },
  { type: "shadow" },
  { type: "position" },
];

export const COMPONENT_REGISTRY: ComponentMeta[] = [
  // ---------- LAYOUT ----------
  {
    type: "BOX",
    label: "Box",
    description: "A generic flex container for grouping and laying out elements.",
    category: "layout",
    icon: "⬜",
    canHaveChildren: true,
    propControls: [],
    styleControls: LAYOUT_STYLE_CONTROLS,
    defaultWidth: 300,
    defaultHeight: 200,
  },
  {
    type: "CONTAINER",
    label: "Container",
    description: "A responsive container with max-width constraints.",
    category: "layout",
    icon: "🔲",
    canHaveChildren: true,
    propControls: [],
    styleControls: LAYOUT_STYLE_CONTROLS,
    defaultWidth: 1200,
    defaultHeight: 400,
  },
  {
    type: "DIVIDER",
    label: "Divider",
    description: "A horizontal rule to separate sections.",
    category: "layout",
    icon: "➖",
    canHaveChildren: false,
    propControls: [],
    styleControls: [
      { type: "dimension", label: "Width", styleKey: "width" },
      { type: "dimension", label: "Height", styleKey: "height" },
      { type: "color", label: "Color", styleKey: "background.color" },
      { type: "spacing", label: "Margin", styleKey: "margin" },
    ],
    defaultWidth: 500,
    defaultHeight: 1,
  },

  // ---------- TEXT ----------
  {
    type: "TEXT",
    label: "Text",
    description: "Rich text element. Supports headings, paragraphs, and labels.",
    category: "text",
    icon: "Aa",
    canHaveChildren: false,
    propControls: [
      { type: "textarea", label: "Content", propKey: "content" },
    ],
    styleControls: [
      { type: "typography" },
      { type: "spacing", label: "Padding", styleKey: "padding" },
      { type: "spacing", label: "Margin", styleKey: "margin" },
      { type: "background" },
    ],
  },

  // ---------- INTERACTIVE ----------
  {
    type: "BUTTON",
    label: "Button",
    description: "Clickable button with multiple variants and sizes.",
    category: "interactive",
    icon: "🔘",
    canHaveChildren: false,
    propControls: [
      { type: "text", label: "Label", propKey: "label", placeholder: "Click me" },
      {
        type: "select",
        label: "Variant",
        propKey: "variant",
        options: [
          { label: "Solid", value: "solid" },
          { label: "Outline", value: "outline" },
          { label: "Ghost", value: "ghost" },
          { label: "Link", value: "link" },
        ],
      },
      {
        type: "select",
        label: "Size",
        propKey: "size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
      },
      { type: "text", label: "Link (href)", propKey: "href", placeholder: "https://..." },
      { type: "boolean", label: "Disabled", propKey: "disabled" },
    ],
    styleControls: LAYOUT_STYLE_CONTROLS,
  },

  // ---------- MEDIA ----------
  {
    type: "IMAGE",
    label: "Image",
    description: "Displays an image with configurable fit and alt text.",
    category: "media",
    icon: "🖼️",
    canHaveChildren: false,
    propControls: [
      { type: "image", label: "Source", propKey: "src" },
      { type: "text", label: "Alt Text", propKey: "alt", placeholder: "Describe the image" },
      {
        type: "select",
        label: "Object Fit",
        propKey: "objectFit",
        options: [
          { label: "Cover", value: "cover" },
          { label: "Contain", value: "contain" },
          { label: "Fill", value: "fill" },
          { label: "None", value: "none" },
        ],
      },
    ],
    styleControls: [
      { type: "dimension", label: "Width", styleKey: "width" },
      { type: "dimension", label: "Height", styleKey: "height" },
      { type: "border" },
      { type: "shadow" },
      { type: "spacing", label: "Margin", styleKey: "margin" },
    ],
    defaultWidth: 300,
    defaultHeight: 200,
  },

  // ---------- FORM ----------
  {
    type: "INPUT",
    label: "Input",
    description: "Text input field for forms.",
    category: "form",
    icon: "⬜",
    canHaveChildren: false,
    propControls: [
      {
        type: "select",
        label: "Type",
        propKey: "type",
        options: [
          { label: "Text", value: "text" },
          { label: "Email", value: "email" },
          { label: "Password", value: "password" },
          { label: "Number", value: "number" },
          { label: "Tel", value: "tel" },
        ],
      },
      { type: "text", label: "Placeholder", propKey: "placeholder" },
      { type: "text", label: "Label", propKey: "label" },
      { type: "boolean", label: "Required", propKey: "required" },
      { type: "boolean", label: "Disabled", propKey: "disabled" },
    ],
    styleControls: LAYOUT_STYLE_CONTROLS,
  },

  // ---------- NAVIGATION ----------
  {
    type: "LINK",
    label: "Link",
    description: "Anchor/hyperlink element.",
    category: "navigation",
    icon: "🔗",
    canHaveChildren: true,
    propControls: [
      { type: "text", label: "URL", propKey: "href", placeholder: "https://..." },
      {
        type: "select",
        label: "Target",
        propKey: "target",
        options: [
          { label: "Same tab", value: "_self" },
          { label: "New tab", value: "_blank" },
        ],
      },
    ],
    styleControls: LAYOUT_STYLE_CONTROLS,
  },
];

// ---------------------------------------------------------------------------
// Registry helpers
// ---------------------------------------------------------------------------

const registryMap = new Map<WeaveNodeType, ComponentMeta>(
  COMPONENT_REGISTRY.map((c) => [c.type, c])
);

export function getComponentMeta(type: WeaveNodeType): ComponentMeta | undefined {
  return registryMap.get(type);
}

export function getComponentsByCategory(category: ComponentCategory): ComponentMeta[] {
  return COMPONENT_REGISTRY.filter((c) => c.category === category);
}

export const COMPONENT_CATEGORIES: ComponentCategory[] = [
  "layout",
  "text",
  "media",
  "form",
  "interactive",
  "navigation",
];
