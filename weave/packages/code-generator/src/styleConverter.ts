/**
 * styleConverter.ts
 *
 * Converts a WeaveStyles object into a CSSProperties-compatible object
 * for use in React inline styles or for serialization in the code generator.
 * This is the canonical bridge between the AST style model and CSS.
 */

import type { WeaveStyles, WeaveDimension, WeaveSpacing, WeaveShadow, WeaveBackground } from "@weave/ast-schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dim(d: WeaveDimension | undefined): string | undefined {
  if (!d) return undefined;
  if (d.value === "auto") return "auto";
  return `${d.value}${d.unit}`;
}

function spacing(s: WeaveSpacing | undefined, prop: "padding" | "margin"): Record<string, string> {
  if (!s) return {};
  const result: Record<string, string> = {};
  if (s.top !== undefined) result[`${prop}Top`] = `${s.top}px`;
  if (s.right !== undefined) result[`${prop}Right`] = `${s.right}px`;
  if (s.bottom !== undefined) result[`${prop}Bottom`] = `${s.bottom}px`;
  if (s.left !== undefined) result[`${prop}Left`] = `${s.left}px`;
  return result;
}

function shadows(arr: WeaveShadow[] | undefined): string | undefined {
  if (!arr || !arr.length) return undefined;
  return arr
    .map((s) => {
      const inset = s.inset ? "inset " : "";
      return `${inset}${s.x ?? 0}px ${s.y ?? 0}px ${s.blur ?? 0}px ${s.spread ?? 0}px ${s.color ?? "transparent"}`;
    })
    .join(", ");
}

function background(bg: WeaveBackground | undefined): Record<string, string> {
  if (!bg) return {};
  if (bg.type === "color" && bg.color) return { backgroundColor: bg.color };
  if (bg.type === "gradient" && bg.gradient) {
    const { type, angle, stops } = bg.gradient;
    const stopStr = stops.map((s) => `${s.color} ${s.position}%`).join(", ");
    const grad =
      type === "linear"
        ? `linear-gradient(${angle ?? 135}deg, ${stopStr})`
        : `radial-gradient(circle, ${stopStr})`;
    return { backgroundImage: grad };
  }
  if (bg.type === "image" && bg.imageUrl) {
    return {
      backgroundImage: `url(${bg.imageUrl})`,
      ...(bg.imageSize && { backgroundSize: bg.imageSize }),
      ...(bg.imageRepeat && { backgroundRepeat: bg.imageRepeat }),
      ...(bg.imagePosition && { backgroundPosition: bg.imagePosition }),
    };
  }
  return {};
}

function borderRadius(r: number | WeaveSpacing | undefined): string | undefined {
  if (r === undefined) return undefined;
  if (typeof r === "number") return `${r}px`;
  const { top = 0, right = 0, bottom = 0, left = 0 } = r;
  return `${top}px ${right}px ${bottom}px ${left}px`;
}

// ---------------------------------------------------------------------------
// Main converter
// ---------------------------------------------------------------------------

/** Converts a WeaveStyles object to React CSSProperties (camelCase) */
export function styleToCSS(styles: WeaveStyles): Record<string, string | number | undefined> {
  const css: Record<string, string | number | undefined> = {};

  // Layout
  if (styles.display) css["display"] = styles.display;
  if (styles.flexDirection) css["flexDirection"] = styles.flexDirection;
  if (styles.flexWrap) css["flexWrap"] = styles.flexWrap;
  if (styles.alignItems) css["alignItems"] = styles.alignItems;
  if (styles.justifyContent) css["justifyContent"] = styles.justifyContent;
  if (styles.gap !== undefined) css["gap"] = `${styles.gap}px`;
  if (styles.flex !== undefined) css["flex"] = styles.flex;

  // Sizing
  const w = dim(styles.width);
  if (w) css["width"] = w;
  const h = dim(styles.height);
  if (h) css["height"] = h;
  const minW = dim(styles.minWidth);
  if (minW) css["minWidth"] = minW;
  const maxW = dim(styles.maxWidth);
  if (maxW) css["maxWidth"] = maxW;
  const minH = dim(styles.minHeight);
  if (minH) css["minHeight"] = minH;
  const maxH = dim(styles.maxHeight);
  if (maxH) css["maxHeight"] = maxH;

  // Spacing
  Object.assign(css, spacing(styles.padding, "padding"));
  Object.assign(css, spacing(styles.margin, "margin"));

  // Positioning
  if (styles.position) css["position"] = styles.position;
  if (styles.top !== undefined) css["top"] = `${styles.top}px`;
  if (styles.right !== undefined) css["right"] = `${styles.right}px`;
  if (styles.bottom !== undefined) css["bottom"] = `${styles.bottom}px`;
  if (styles.left !== undefined) css["left"] = `${styles.left}px`;
  if (styles.zIndex !== undefined) css["zIndex"] = styles.zIndex;

  // Visual
  Object.assign(css, background(styles.background));
  if (styles.border) {
    const b = styles.border;
    if (b.width !== undefined && b.style && b.color) {
      css["border"] = `${b.width}px ${b.style} ${b.color}`;
    }
    const br = borderRadius(b.radius);
    if (br) css["borderRadius"] = br;
  }
  const shadow = shadows(styles.boxShadow);
  if (shadow) css["boxShadow"] = shadow;
  if (styles.opacity !== undefined) css["opacity"] = styles.opacity;
  if (styles.overflow) css["overflow"] = styles.overflow;

  // Typography
  if (styles.typography) {
    const t = styles.typography;
    if (t.fontFamily) css["fontFamily"] = t.fontFamily;
    if (t.fontSize) css["fontSize"] = `${t.fontSize}px`;
    if (t.fontWeight) css["fontWeight"] = t.fontWeight;
    if (t.lineHeight) css["lineHeight"] = t.lineHeight;
    if (t.letterSpacing) css["letterSpacing"] = `${t.letterSpacing}px`;
    if (t.textAlign) css["textAlign"] = t.textAlign;
    if (t.color) css["color"] = t.color;
    if (t.textDecoration) css["textDecoration"] = t.textDecoration;
    if (t.textTransform) css["textTransform"] = t.textTransform;
  }

  // Transform & misc
  if (styles.transform) css["transform"] = styles.transform;
  if (styles.transition) css["transition"] = styles.transition;
  if (styles.cursor) css["cursor"] = styles.cursor;

  return css;
}

/** Converts a CSS-properties object back to a CSS string for code export */
export function cssObjectToString(css: Record<string, string | number | undefined>, indent = 2): string {
  const pad = " ".repeat(indent);
  return Object.entries(css)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => {
      // camelCase → kebab-case
      const prop = k.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
      return `${pad}${prop}: ${v};`;
    })
    .join("\n");
}
