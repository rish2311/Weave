import type { WeaveStyles, WeaveSpacing, WeaveDimension } from "@weave/ast-schema";

// ---------------------------------------------------------------------------
// Style → CSS conversion helpers
// These are used by the Canvas renderer to convert the AST style object
// into actual CSS properties applied to DOM elements.
// ---------------------------------------------------------------------------

export function dimensionToCss(dim: WeaveDimension | undefined): string {
  if (!dim) return "auto";
  if (dim.value === "auto") return "auto";
  return `${dim.value}${dim.unit}`;
}

export function spacingToCss(spacing: WeaveSpacing | undefined): string {
  if (!spacing) return "0";
  const { top = 0, right = 0, bottom = 0, left = 0 } = spacing;
  return `${top}px ${right}px ${bottom}px ${left}px`;
}

export function borderRadiusToCss(radius: number | WeaveSpacing | undefined): string {
  if (!radius) return "0";
  if (typeof radius === "number") return `${radius}px`;
  const { top = 0, right = 0, bottom = 0, left = 0 } = radius;
  return `${top}px ${right}px ${bottom}px ${left}px`;
}

export function shadowToCss(shadows: NonNullable<WeaveStyles["boxShadow"]>): string {
  return shadows
    .map(
      (s) =>
        `${s.inset ? "inset " : ""}${s.x ?? 0}px ${s.y ?? 0}px ${s.blur ?? 0}px ${s.spread ?? 0}px ${s.color ?? "transparent"}`
    )
    .join(", ");
}

/** Convert a WeaveStyles object into a React.CSSProperties-compatible object */
export function stylesToCss(styles: WeaveStyles): React.CSSProperties {
  const css: React.CSSProperties = {};

  // Layout
  if (styles.display) css.display = styles.display;
  if (styles.flexDirection) css.flexDirection = styles.flexDirection;
  if (styles.flexWrap) css.flexWrap = styles.flexWrap;
  if (styles.alignItems) css.alignItems = styles.alignItems;
  if (styles.justifyContent) css.justifyContent = styles.justifyContent;
  if (styles.gap !== undefined) css.gap = `${styles.gap}px`;
  if (styles.flex !== undefined) css.flex = styles.flex;

  // Sizing
  if (styles.width) css.width = dimensionToCss(styles.width);
  if (styles.height) css.height = dimensionToCss(styles.height);
  if (styles.minWidth) css.minWidth = dimensionToCss(styles.minWidth);
  if (styles.maxWidth) css.maxWidth = dimensionToCss(styles.maxWidth);
  if (styles.minHeight) css.minHeight = dimensionToCss(styles.minHeight);
  if (styles.maxHeight) css.maxHeight = dimensionToCss(styles.maxHeight);

  // Spacing
  if (styles.padding) css.padding = spacingToCss(styles.padding);
  if (styles.margin) css.margin = spacingToCss(styles.margin);

  // Positioning
  if (styles.position) css.position = styles.position;
  if (styles.top !== undefined) css.top = `${styles.top}px`;
  if (styles.right !== undefined) css.right = `${styles.right}px`;
  if (styles.bottom !== undefined) css.bottom = `${styles.bottom}px`;
  if (styles.left !== undefined) css.left = `${styles.left}px`;
  if (styles.zIndex !== undefined) css.zIndex = styles.zIndex;

  // Visual
  if (styles.background) {
    const bg = styles.background;
    if (bg.type === "color" && bg.color) {
      css.backgroundColor = bg.color;
    } else if (bg.type === "gradient" && bg.gradient) {
      const stops = bg.gradient.stops.map((s) => `${s.color} ${s.position}%`).join(", ");
      if (bg.gradient.type === "linear") {
        css.background = `linear-gradient(${bg.gradient.angle ?? 135}deg, ${stops})`;
      } else {
        css.background = `radial-gradient(circle, ${stops})`;
      }
    } else if (bg.type === "image" && bg.imageUrl) {
      css.backgroundImage = `url(${bg.imageUrl})`;
      css.backgroundSize = bg.imageSize ?? "cover";
      css.backgroundRepeat = bg.imageRepeat ?? "no-repeat";
      css.backgroundPosition = bg.imagePosition ?? "center";
    }
  }

  if (styles.border) {
    const b = styles.border;
    if (b.width !== undefined && b.style && b.color) {
      css.border = `${b.width}px ${b.style} ${b.color}`;
    }
    if (b.radius !== undefined) {
      css.borderRadius = borderRadiusToCss(b.radius);
    }
  }

  if (styles.boxShadow && styles.boxShadow.length > 0) {
    css.boxShadow = shadowToCss(styles.boxShadow);
  }

  if (styles.opacity !== undefined) css.opacity = styles.opacity;
  if (styles.overflow) css.overflow = styles.overflow;

  // Typography
  if (styles.typography) {
    const t = styles.typography;
    if (t.fontFamily) css.fontFamily = t.fontFamily;
    if (t.fontSize) css.fontSize = `${t.fontSize}px`;
    if (t.fontWeight) css.fontWeight = t.fontWeight;
    if (t.lineHeight) css.lineHeight = t.lineHeight;
    if (t.letterSpacing) css.letterSpacing = `${t.letterSpacing}px`;
    if (t.textAlign) css.textAlign = t.textAlign;
    if (t.color) css.color = t.color;
    if (t.textDecoration) css.textDecoration = t.textDecoration;
    if (t.textTransform) css.textTransform = t.textTransform;
  }

  // Transform
  if (styles.transform) css.transform = styles.transform;
  if (styles.transition) css.transition = styles.transition;
  if (styles.cursor) css.cursor = styles.cursor;

  return css;
}

// Type reference for React.CSSProperties without importing React
declare namespace React {
  interface CSSProperties {
    [key: string]: unknown;
  }
}
