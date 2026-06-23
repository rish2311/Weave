import type { WeaveNode, WeaveProject, WeavePage, WeaveNodeType } from "./types";

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isTextNode(node: WeaveNode): node is Extract<WeaveNode, { type: "TEXT" }> {
  return node.type === "TEXT";
}

export function isButtonNode(node: WeaveNode): node is Extract<WeaveNode, { type: "BUTTON" }> {
  return node.type === "BUTTON";
}

export function isImageNode(node: WeaveNode): node is Extract<WeaveNode, { type: "IMAGE" }> {
  return node.type === "IMAGE";
}

export function isContainerNode(
  node: WeaveNode
): node is Extract<WeaveNode, { type: "CONTAINER" }> {
  return node.type === "CONTAINER";
}

export function isBoxNode(node: WeaveNode): node is Extract<WeaveNode, { type: "BOX" }> {
  return node.type === "BOX";
}

// ---------------------------------------------------------------------------
// Schema validators
// ---------------------------------------------------------------------------

const VALID_NODE_TYPES: WeaveNodeType[] = [
  "BOX",
  "TEXT",
  "BUTTON",
  "IMAGE",
  "CONTAINER",
  "INPUT",
  "ICON",
  "VIDEO",
  "DIVIDER",
  "LINK",
];

export function isValidNodeType(type: string): type is WeaveNodeType {
  return VALID_NODE_TYPES.includes(type as WeaveNodeType);
}

export function validateNode(node: unknown): node is WeaveNode {
  if (typeof node !== "object" || node === null) return false;
  const n = node as Record<string, unknown>;
  return (
    typeof n["id"] === "string" &&
    typeof n["type"] === "string" &&
    isValidNodeType(n["type"] as string) &&
    typeof n["name"] === "string" &&
    Array.isArray(n["childIds"]) &&
    typeof n["styles"] === "object"
  );
}

export function validatePage(page: unknown): page is WeavePage {
  if (typeof page !== "object" || page === null) return false;
  const p = page as Record<string, unknown>;
  return (
    typeof p["id"] === "string" &&
    typeof p["name"] === "string" &&
    typeof p["slug"] === "string" &&
    Array.isArray(p["rootNodeIds"])
  );
}

export function validateProject(project: unknown): project is WeaveProject {
  if (typeof project !== "object" || project === null) return false;
  const p = project as Record<string, unknown>;
  return (
    p["schemaVersion"] === "1.0.0" &&
    typeof p["id"] === "string" &&
    typeof p["name"] === "string" &&
    typeof p["nodes"] === "object" &&
    Array.isArray(p["pages"]) &&
    typeof p["activePageId"] === "string"
  );
}
