// =============================================================================
// WEAVE UNIFIED INTERNAL SCHEMA (JSON AST)
// This is the single source of truth that drives:
//   - Visual Canvas rendering
//   - Properties Panel binding
//   - Code generation (Phase 2)
//   - AI manipulation (Phase 3)
//   - Version control (Phase 4)
// Schema: 2.0.0 — Added responsive breakpoint styles
// =============================================================================

// ---------------------------------------------------------------------------
// Primitive value types
// ---------------------------------------------------------------------------

export type WeaveColor = string; // e.g. "#3B82F6", "rgba(0,0,0,0.5)", "transparent"

export type WeaveUnit = "px" | "%" | "rem" | "em" | "vw" | "vh" | "auto" | "fr";

export interface WeaveDimension {
  value: number | "auto";
  unit: WeaveUnit;
}

export type WeaveDisplay = "flex" | "grid" | "block" | "inline" | "inline-block" | "none";
export type WeaveFlexDirection = "row" | "column" | "row-reverse" | "column-reverse";
export type WeaveFlexWrap = "nowrap" | "wrap" | "wrap-reverse";
export type WeaveAlignItems = "flex-start" | "flex-end" | "center" | "stretch" | "baseline";
export type WeaveJustifyContent =
  | "flex-start"
  | "flex-end"
  | "center"
  | "space-between"
  | "space-around"
  | "space-evenly";
export type WeaveTextAlign = "left" | "center" | "right" | "justify";
export type WeaveFontWeight = "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
export type WeavePosition = "static" | "relative" | "absolute" | "fixed" | "sticky";
export type WeaveOverflow = "visible" | "hidden" | "scroll" | "auto";

// ---------------------------------------------------------------------------
// Style system
// ---------------------------------------------------------------------------

export interface WeaveSpacing {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface WeaveBorder {
  width?: number;
  style?: "solid" | "dashed" | "dotted" | "none";
  color?: WeaveColor;
  radius?: number | WeaveSpacing;
}

export interface WeaveShadow {
  x?: number;
  y?: number;
  blur?: number;
  spread?: number;
  color?: WeaveColor;
  inset?: boolean;
}

export interface WeaveTypography {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: WeaveFontWeight;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: WeaveTextAlign;
  color?: WeaveColor;
  textDecoration?: "none" | "underline" | "line-through";
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
}

export interface WeaveBackground {
  type: "color" | "gradient" | "image";
  color?: WeaveColor;
  gradient?: {
    type: "linear" | "radial";
    angle?: number;
    stops: Array<{ color: WeaveColor; position: number }>;
  };
  imageUrl?: string;
  imageSize?: "cover" | "contain" | "auto";
  imageRepeat?: "no-repeat" | "repeat" | "repeat-x" | "repeat-y";
  imagePosition?: string;
}

/** Core style object that every node can carry */
export interface WeaveStyles {
  // Layout
  display?: WeaveDisplay;
  flexDirection?: WeaveFlexDirection;
  flexWrap?: WeaveFlexWrap;
  alignItems?: WeaveAlignItems;
  justifyContent?: WeaveJustifyContent;
  gap?: number;
  flex?: string | number;

  // Sizing
  width?: WeaveDimension;
  height?: WeaveDimension;
  minWidth?: WeaveDimension;
  maxWidth?: WeaveDimension;
  minHeight?: WeaveDimension;
  maxHeight?: WeaveDimension;

  // Spacing
  padding?: WeaveSpacing;
  margin?: WeaveSpacing;

  // Positioning
  position?: WeavePosition;
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  zIndex?: number;

  // Visual
  background?: WeaveBackground;
  border?: WeaveBorder;
  boxShadow?: WeaveShadow[];
  opacity?: number;
  overflow?: WeaveOverflow;

  // Typography (for text-bearing nodes)
  typography?: WeaveTypography;

  // Transform & animation
  transform?: string;
  transition?: string;
  cursor?: string;

  // Responsive overrides keyed by breakpoint
  // Applied as inline style overrides at the given breakpoint
  responsive?: Partial<Record<WeaveBreakpoint, Omit<WeaveStyles, "responsive">>>;
}

// ---------------------------------------------------------------------------
// Responsive breakpoints (2.1)
// ---------------------------------------------------------------------------

/** Breakpoints mirror Tailwind's default scale */
export type WeaveBreakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

export const BREAKPOINT_WIDTHS: Record<WeaveBreakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

// ---------------------------------------------------------------------------
// AST Node Types
// ---------------------------------------------------------------------------

export type WeaveNodeType =
  | "BOX"
  | "TEXT"
  | "BUTTON"
  | "IMAGE"
  | "CONTAINER"
  | "INPUT"
  | "ICON"
  | "VIDEO"
  | "DIVIDER"
  | "LINK";

export interface WeaveNodeBase {
  /** Unique identifier (nanoid-generated) */
  id: string;
  /** Human-readable display name in layers panel */
  name: string;
  /** Component type discriminant */
  type: WeaveNodeType;
  /** Whether this node is locked from editing */
  locked: boolean;
  /** Whether this node is hidden on canvas */
  hidden: boolean;
  /** Parent node ID (null for root/page nodes) */
  parentId: string | null;
  /** Ordered list of child node IDs */
  childIds: string[];
  /** Core styles */
  styles: WeaveStyles;
  /** Component-specific props */
  props: Record<string, unknown>;
  /** Custom CSS class overrides */
  className?: string;
  /** HTML element tag override */
  tag?: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last modified timestamp */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Specific node prop types
// ---------------------------------------------------------------------------

export interface TextNodeProps {
  content: string;
  htmlContent?: string;
  [key: string]: unknown;
}

export interface ButtonNodeProps {
  label: string;
  variant?: "solid" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  href?: string;
  target?: "_blank" | "_self";
  disabled?: boolean;
  loading?: boolean;
  [key: string]: unknown;
}

export interface ImageNodeProps {
  src: string;
  alt: string;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  [key: string]: unknown;
}

export interface InputNodeProps {
  type?: "text" | "email" | "password" | "number" | "tel" | "url";
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  [key: string]: unknown;
}

export interface LinkNodeProps {
  href: string;
  target?: "_blank" | "_self";
  rel?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Typed AST nodes (discriminated unions)
// ---------------------------------------------------------------------------

export interface BoxNode extends WeaveNodeBase {
  type: "BOX";
  props: Record<string, never>;
}

export interface ContainerNode extends WeaveNodeBase {
  type: "CONTAINER";
  props: Record<string, never>;
}

export interface TextNode extends WeaveNodeBase {
  type: "TEXT";
  props: TextNodeProps;
}

export interface ButtonNode extends WeaveNodeBase {
  type: "BUTTON";
  props: ButtonNodeProps;
}

export interface ImageNode extends WeaveNodeBase {
  type: "IMAGE";
  props: ImageNodeProps;
}

export interface InputNode extends WeaveNodeBase {
  type: "INPUT";
  props: InputNodeProps;
}

export interface LinkNode extends WeaveNodeBase {
  type: "LINK";
  props: LinkNodeProps;
}

export interface DividerNode extends WeaveNodeBase {
  type: "DIVIDER";
  props: Record<string, never>;
}

export type WeaveNode =
  | BoxNode
  | ContainerNode
  | TextNode
  | ButtonNode
  | ImageNode
  | InputNode
  | LinkNode
  | DividerNode;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export interface WeavePage {
  id: string;
  name: string;
  slug: string;
  /** Ordered root node IDs (children of the canvas root) */
  rootNodeIds: string[];
  /** Page-level meta */
  meta: {
    title?: string;
    description?: string;
    ogImage?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Project — the top-level document
// ---------------------------------------------------------------------------

export interface WeaveProject {
  /** Schema version for forward compatibility */
  schemaVersion: "1.0.0" | "2.0.0";
  id: string;
  name: string;
  /** Flat map of all nodes keyed by ID (normalized, O(1) access) */
  nodes: Record<string, WeaveNode>;
  /** All pages in the project */
  pages: WeavePage[];
  /** Currently active page ID */
  activePageId: string;
  /** Design tokens / global variables */
  designTokens: WeaveDesignTokens;
  /** Active breakpoint being edited in the canvas */
  activeBreakpoint?: WeaveBreakpoint;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Design Tokens
// ---------------------------------------------------------------------------

export interface WeaveDesignTokens {
  colors: {
    primary: WeaveColor;
    secondary: WeaveColor;
    accent: WeaveColor;
    background: WeaveColor;
    surface: WeaveColor;
    text: WeaveColor;
    textMuted: WeaveColor;
    border: WeaveColor;
    error: WeaveColor;
    success: WeaveColor;
    warning: WeaveColor;
    [key: string]: WeaveColor;
  };
  typography: {
    fontFamilyHeading: string;
    fontFamilyBody: string;
    baseFontSize: number;
    scaleRatio: number;
  };
  spacing: {
    baseUnit: number; // px
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  shadows: {
    sm: WeaveShadow[];
    md: WeaveShadow[];
    lg: WeaveShadow[];
  };
}

// ---------------------------------------------------------------------------
// History (for Time Machine / undo-redo)
// ---------------------------------------------------------------------------

export type WeaveActionType =
  | "ADD_NODE"
  | "DELETE_NODE"
  | "UPDATE_NODE_STYLE"
  | "UPDATE_NODE_PROPS"
  | "MOVE_NODE"
  | "REORDER_CHILDREN"
  | "ADD_PAGE"
  | "DELETE_PAGE"
  | "RENAME_PAGE"
  | "UPDATE_DESIGN_TOKENS"
  | "RENAME_PROJECT";

export interface WeaveHistoryEntry {
  id: string;
  timestamp: string;
  actionType: WeaveActionType;
  description: string;
  /** Full project snapshot before this action */
  snapshot: WeaveProject;
}
