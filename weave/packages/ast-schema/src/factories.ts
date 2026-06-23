import { nanoid } from "nanoid";
import type {
  WeaveNode,
  WeaveNodeType,
  WeaveProject,
  WeavePage,
  WeaveStyles,
  WeaveDesignTokens,
} from "./types";

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

export const DEFAULT_DESIGN_TOKENS: WeaveDesignTokens = {
  colors: {
    primary: "#6366F1",
    secondary: "#8B5CF6",
    accent: "#EC4899",
    background: "#0F0F13",
    surface: "#1A1A24",
    text: "#F8F8FF",
    textMuted: "#9CA3AF",
    border: "#2D2D3D",
    error: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
  },
  typography: {
    fontFamilyHeading: "Inter, sans-serif",
    fontFamilyBody: "Inter, sans-serif",
    baseFontSize: 16,
    scaleRatio: 1.25,
  },
  spacing: {
    baseUnit: 4,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadows: {
    sm: [{ x: 0, y: 1, blur: 3, spread: 0, color: "rgba(0,0,0,0.2)" }],
    md: [{ x: 0, y: 4, blur: 12, spread: 0, color: "rgba(0,0,0,0.3)" }],
    lg: [{ x: 0, y: 10, blur: 30, spread: 0, color: "rgba(0,0,0,0.4)" }],
  },
};

export const DEFAULT_BOX_STYLES: WeaveStyles = {
  display: "flex",
  flexDirection: "column",
  width: { value: "auto", unit: "px" },
  height: { value: "auto", unit: "px" },
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  position: "relative",
};

// ---------------------------------------------------------------------------
// Node factory
// ---------------------------------------------------------------------------

export function createNode(
  type: WeaveNodeType,
  parentId: string | null,
  overrides: Partial<WeaveNode> = {}
): WeaveNode {
  const now = new Date().toISOString();
  const id = nanoid(10);

  const base = {
    id,
    name: `${type.charAt(0) + type.slice(1).toLowerCase()} ${id.slice(0, 4)}`,
    type,
    locked: false,
    hidden: false,
    parentId,
    childIds: [],
    styles: { ...DEFAULT_BOX_STYLES },
    props: {},
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };

  switch (type) {
    case "TEXT":
      return {
        ...base,
        type: "TEXT",
        props: { content: "Edit text..." },
        styles: {
          ...base.styles,
          typography: {
            fontSize: 16,
            fontWeight: "400",
            color: "#F8F8FF",
          },
        },
      } as WeaveNode;

    case "BUTTON":
      return {
        ...base,
        type: "BUTTON",
        props: {
          label: "Click me",
          variant: "solid",
          size: "md",
        },
        styles: {
          ...base.styles,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: { top: 10, right: 20, bottom: 10, left: 20 },
          background: { type: "color", color: "#6366F1" },
          border: { radius: 8 },
          cursor: "pointer",
          typography: {
            fontSize: 14,
            fontWeight: "500",
            color: "#FFFFFF",
          },
        },
      } as WeaveNode;

    case "IMAGE":
      return {
        ...base,
        type: "IMAGE",
        props: {
          src: "",
          alt: "Image",
          objectFit: "cover",
        },
        styles: {
          ...base.styles,
          width: { value: 300, unit: "px" },
          height: { value: 200, unit: "px" },
          overflow: "hidden",
          border: { radius: 8 },
        },
      } as WeaveNode;

    case "CONTAINER":
      return {
        ...base,
        type: "CONTAINER",
        name: `Container ${id.slice(0, 4)}`,
        styles: {
          ...base.styles,
          display: "flex",
          flexDirection: "column",
          width: { value: 100, unit: "%" },
          padding: { top: 16, right: 16, bottom: 16, left: 16 },
        },
      } as WeaveNode;

    case "DIVIDER":
      return {
        ...base,
        type: "DIVIDER",
        styles: {
          ...base.styles,
          width: { value: 100, unit: "%" },
          height: { value: 1, unit: "px" },
          background: { type: "color", color: "#2D2D3D" },
        },
      } as WeaveNode;

    default:
      return base as WeaveNode;
  }
}

// ---------------------------------------------------------------------------
// Page factory
// ---------------------------------------------------------------------------

export function createPage(name: string, overrides: Partial<WeavePage> = {}): WeavePage {
  const now = new Date().toISOString();
  return {
    id: nanoid(10),
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    rootNodeIds: [],
    meta: {
      title: name,
      description: "",
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Project factory
// ---------------------------------------------------------------------------

export function createProject(name: string): WeaveProject {
  const now = new Date().toISOString();
  const defaultPage = createPage("Home");

  return {
    schemaVersion: "1.0.0",
    id: nanoid(10),
    name,
    nodes: {},
    pages: [defaultPage],
    activePageId: defaultPage.id,
    designTokens: { ...DEFAULT_DESIGN_TOKENS },
    createdAt: now,
    updatedAt: now,
  };
}
