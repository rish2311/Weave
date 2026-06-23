import type { WeaveNode, WeaveStyles, WeaveDimension } from "@weave/ast-schema";

// ---------------------------------------------------------------------------
// Node tree helpers
// ---------------------------------------------------------------------------

/** Get all ancestor IDs from node up to root */
export function getAncestorIds(
  nodes: Record<string, WeaveNode>,
  id: string
): string[] {
  const ancestors: string[] = [];
  let current = nodes[id];
  while (current?.parentId) {
    ancestors.push(current.parentId);
    current = nodes[current.parentId];
  }
  return ancestors;
}

/** Get ordered list of nodes on the active page */
export function getPageNodes(
  nodes: Record<string, WeaveNode>,
  rootNodeIds: string[]
): WeaveNode[] {
  const result: WeaveNode[] = [];

  function traverse(id: string) {
    const node = nodes[id];
    if (!node || node.hidden) return;
    result.push(node);
    node.childIds.forEach(traverse);
  }

  rootNodeIds.forEach(traverse);
  return result;
}

/** Check if a node is a descendant of another */
export function isDescendantOf(
  nodes: Record<string, WeaveNode>,
  nodeId: string,
  ancestorId: string
): boolean {
  let current = nodes[nodeId];
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true;
    current = nodes[current.parentId];
  }
  return false;
}

/** Get depth of a node in the tree */
export function getNodeDepth(nodes: Record<string, WeaveNode>, id: string): number {
  return getAncestorIds(nodes, id).length;
}

/** Collect all descendants recursively */
export function getAllDescendants(
  nodes: Record<string, WeaveNode>,
  id: string
): WeaveNode[] {
  const node = nodes[id];
  if (!node) return [];
  return node.childIds.flatMap((childId) => {
    const child = nodes[childId];
    return child ? [child, ...getAllDescendants(nodes, childId)] : [];
  });
}

/** Check if a node can accept children */
export function canAcceptChildren(node: WeaveNode): boolean {
  return ["BOX", "CONTAINER"].includes(node.type);
}
