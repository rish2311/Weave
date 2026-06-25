import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import type {
  WeaveProject,
  WeaveNode,
  WeaveStyles,
  WeaveNodeType,
} from "@weave/ast-schema";
import { createNode, createPage } from "@weave/ast-schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectionState {
  /** IDs of all selected nodes */
  selectedIds: string[];
  /** The single "primary" node when exactly one is selected */
  primaryId: string | null;
}

export interface EditorState {
  project: WeaveProject | null;
  selection: SelectionState;
  hoveredId: string | null;
  isDragging: boolean;
  isModified: boolean;
}

export interface EditorStore extends EditorState {
  // --- Project lifecycle ---
  loadProject: (project: WeaveProject) => void;
  markSaved: () => void;

  // --- Node CRUD ---
  addNode: (type: WeaveNodeType, parentId: string | null) => string | null;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => string | null;

  // --- Node mutations ---
  updateNodeStyles: (id: string, styles: Partial<WeaveStyles>) => void;
  updateNodeProps: (id: string, props: Record<string, unknown>) => void;
  renameNode: (id: string, name: string) => void;
  moveNode: (id: string, newParentId: string | null, insertIndex?: number) => void;
  reorderChildren: (parentId: string, from: number, to: number) => void;
  setNodeLocked: (id: string, locked: boolean) => void;
  setNodeHidden: (id: string, hidden: boolean) => void;

  // --- Selection ---
  selectNode: (id: string, multi?: boolean) => void;
  deselectAll: () => void;
  setHoveredNode: (id: string | null) => void;

  // --- Drag state ---
  setDragging: (isDragging: boolean) => void;

  // --- Page management ---
  addPage: (name: string) => string | null;
  deletePage: (id: string) => void;
  setActivePage: (id: string) => void;
  renamePage: (id: string, name: string) => void;

  // --- AI / Template injection (Phase 3) ---
  /**
   * Merges a flat array of WeaveNodes into the project.
   * Root nodes (parentId === null in the input) are attached to
   * `targetParentId` if provided, otherwise to the active page root.
   * All node IDs are re-keyed with a prefix to prevent collisions.
   */
  injectASTSnippet: (
    nodes: WeaveNode[],
    rootIds: string[],
    targetParentId?: string | null
  ) => string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDescendantIds(nodes: Record<string, WeaveNode>, id: string): string[] {
  const node = nodes[id];
  if (!node) return [];
  return node.childIds.flatMap((childId) => [childId, ...getDescendantIds(nodes, childId)]);
}

/**
 * Deep-clones a node subtree, returning a map of { newId -> clonedNode }
 * and the new root ID. All IDs are re-keyed so there are no collisions.
 */
function deepCloneSubtree(
  nodes: Record<string, WeaveNode>,
  rootId: string,
  newParentId: string | null,
  now: string
): { cloned: Record<string, WeaveNode>; newRootId: string } {
  const idMap = new Map<string, string>();

  // First pass: generate new IDs for all nodes in the subtree
  const allIds = [rootId, ...getDescendantIds(nodes, rootId)];
  allIds.forEach((id) => idMap.set(id, nanoid(10)));

  const cloned: Record<string, WeaveNode> = {};

  // Second pass: clone each node with remapped IDs
  for (const oldId of allIds) {
    const node = nodes[oldId];
    if (!node) continue;
    const newId = idMap.get(oldId)!;
    const resolvedParentId =
      oldId === rootId
        ? newParentId
        : (node.parentId ? (idMap.get(node.parentId) ?? node.parentId) : null);

    cloned[newId] = {
      ...JSON.parse(JSON.stringify(node)) as WeaveNode,
      id: newId,
      parentId: resolvedParentId,
      childIds: node.childIds.map((c) => idMap.get(c) ?? c),
      name: oldId === rootId ? `${node.name} (copy)` : node.name,
      createdAt: now,
      updatedAt: now,
    };
  }

  return { cloned, newRootId: idMap.get(rootId)! };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useEditorStore = create<EditorStore>()(
  immer((set, get) => ({
    project: null,
    selection: { selectedIds: [], primaryId: null },
    hoveredId: null,
    isDragging: false,
    isModified: false,

    // -----------------------------------------------------------------------
    // Project lifecycle
    // -----------------------------------------------------------------------
    loadProject: (project) =>
      set((state) => {
        state.project = project;
        state.selection = { selectedIds: [], primaryId: null };
        state.hoveredId = null;
        state.isModified = false;
      }),

    markSaved: () =>
      set((state) => {
        state.isModified = false;
      }),

    // -----------------------------------------------------------------------
    // Node CRUD
    // -----------------------------------------------------------------------
    addNode: (type, parentId) => {
      const { project } = get();
      if (!project) return null;

      const newNode = createNode(type, parentId);

      set((state) => {
        if (!state.project) return;
        state.project.nodes[newNode.id] = newNode as WeaveNode;

        if (parentId) {
          const parent = state.project.nodes[parentId];
          if (parent) {
            parent.childIds.push(newNode.id);
            parent.updatedAt = new Date().toISOString();
          }
        } else {
          // Add to active page root
          const page = state.project.pages.find((p) => p.id === state.project!.activePageId);
          if (page) {
            page.rootNodeIds.push(newNode.id);
            page.updatedAt = new Date().toISOString();
          }
        }

        state.project.updatedAt = new Date().toISOString();
        state.isModified = true;
        state.selection = { selectedIds: [newNode.id], primaryId: newNode.id };
      });

      return newNode.id;
    },

    deleteNode: (id) =>
      set((state) => {
        if (!state.project) return;
        const node = state.project.nodes[id];
        if (!node) return;

        // Collect all descendants for batch deletion
        const allIds = [id, ...getDescendantIds(state.project.nodes, id)];

        allIds.forEach((nid) => {
          delete state.project!.nodes[nid];
        });

        // Remove from parent's childIds
        if (node.parentId) {
          const parent = state.project.nodes[node.parentId];
          if (parent) {
            parent.childIds = parent.childIds.filter((c) => c !== id);
          }
        } else {
          // Remove from page root
          for (const page of state.project.pages) {
            page.rootNodeIds = page.rootNodeIds.filter((r) => r !== id);
          }
        }

        // Deselect if was selected
        state.selection.selectedIds = state.selection.selectedIds.filter(
          (sid) => !allIds.includes(sid)
        );
        state.selection.primaryId =
          state.selection.selectedIds[0] ?? null;

        state.project.updatedAt = new Date().toISOString();
        state.isModified = true;
      }),

    duplicateNode: (id) => {
      const { project } = get();
      if (!project) return null;

      const original = project.nodes[id];
      if (!original) return null;

      const now = new Date().toISOString();
      // Deep-clone the full subtree (fixes: children were silently dropped)
      const { cloned, newRootId } = deepCloneSubtree(
        project.nodes,
        id,
        original.parentId,
        now
      );

      set((state) => {
        if (!state.project) return;
        // Merge all cloned nodes
        Object.assign(state.project.nodes, cloned);

        if (original.parentId) {
          const parent = state.project.nodes[original.parentId];
          if (parent) {
            const idx = parent.childIds.indexOf(id);
            parent.childIds.splice(idx + 1, 0, newRootId);
          }
        } else {
          const page = state.project.pages.find((p) => p.id === state.project!.activePageId);
          if (page) {
            const idx = page.rootNodeIds.indexOf(id);
            page.rootNodeIds.splice(idx + 1, 0, newRootId);
          }
        }

        state.selection = { selectedIds: [newRootId], primaryId: newRootId };
        state.project.updatedAt = now;
        state.isModified = true;
      });

      return newRootId;
    },

    // -----------------------------------------------------------------------
    // Node mutations
    // -----------------------------------------------------------------------
    updateNodeStyles: (id, styles) =>
      set((state) => {
        if (!state.project) return;
        const node = state.project.nodes[id];
        if (!node) return;
        node.styles = { ...node.styles, ...styles };
        node.updatedAt = new Date().toISOString();
        state.project.updatedAt = new Date().toISOString();
        state.isModified = true;
      }),

    updateNodeProps: (id, props) =>
      set((state) => {
        if (!state.project) return;
        const node = state.project.nodes[id];
        if (!node) return;
        node.props = { ...node.props, ...props } as typeof node.props;
        node.updatedAt = new Date().toISOString();
        state.project.updatedAt = new Date().toISOString();
        state.isModified = true;
      }),

    renameNode: (id, name) =>
      set((state) => {
        if (!state.project) return;
        const node = state.project.nodes[id];
        if (node) {
          node.name = name;
          node.updatedAt = new Date().toISOString();
          state.isModified = true;
        }
      }),

    moveNode: (id, newParentId, insertIndex) =>
      set((state) => {
        if (!state.project) return;
        const node = state.project.nodes[id];
        if (!node) return;

        // Remove from old parent
        if (node.parentId) {
          const oldParent = state.project.nodes[node.parentId];
          if (oldParent) {
            oldParent.childIds = oldParent.childIds.filter((c) => c !== id);
          }
        } else {
          const page = state.project.pages.find((p) => p.id === state.project!.activePageId);
          if (page) page.rootNodeIds = page.rootNodeIds.filter((r) => r !== id);
        }

        // Add to new parent
        node.parentId = newParentId;
        if (newParentId) {
          const newParent = state.project.nodes[newParentId];
          if (newParent) {
            if (insertIndex !== undefined) {
              newParent.childIds.splice(insertIndex, 0, id);
            } else {
              newParent.childIds.push(id);
            }
          }
        } else {
          const page = state.project.pages.find((p) => p.id === state.project!.activePageId);
          if (page) {
            if (insertIndex !== undefined) {
              page.rootNodeIds.splice(insertIndex, 0, id);
            } else {
              page.rootNodeIds.push(id);
            }
          }
        }

        node.updatedAt = new Date().toISOString();
        state.project.updatedAt = new Date().toISOString();
        state.isModified = true;
      }),

    reorderChildren: (parentId, from, to) =>
      set((state) => {
        if (!state.project) return;
        const parent = state.project.nodes[parentId];
        if (!parent) return;

        const [moved] = parent.childIds.splice(from, 1);
        if (moved) parent.childIds.splice(to, 0, moved);

        parent.updatedAt = new Date().toISOString();
        state.project.updatedAt = new Date().toISOString();
        state.isModified = true;
      }),

    setNodeLocked: (id, locked) =>
      set((state) => {
        if (!state.project) return;
        const node = state.project.nodes[id];
        if (node) node.locked = locked;
      }),

    setNodeHidden: (id, hidden) =>
      set((state) => {
        if (!state.project) return;
        const node = state.project.nodes[id];
        if (node) node.hidden = hidden;
      }),

    // -----------------------------------------------------------------------
    // Selection
    // -----------------------------------------------------------------------
    selectNode: (id, multi = false) =>
      set((state) => {
        if (multi) {
          if (state.selection.selectedIds.includes(id)) {
            state.selection.selectedIds = state.selection.selectedIds.filter((s) => s !== id);
          } else {
            state.selection.selectedIds.push(id);
          }
          state.selection.primaryId =
            state.selection.selectedIds[state.selection.selectedIds.length - 1] ?? null;
        } else {
          state.selection = { selectedIds: [id], primaryId: id };
        }
      }),

    deselectAll: () =>
      set((state) => {
        state.selection = { selectedIds: [], primaryId: null };
      }),

    setHoveredNode: (id) =>
      set((state) => {
        state.hoveredId = id;
      }),

    // -----------------------------------------------------------------------
    // Drag state
    // -----------------------------------------------------------------------
    setDragging: (isDragging) =>
      set((state) => {
        state.isDragging = isDragging;
      }),

    // -----------------------------------------------------------------------
    // Page management
    // -----------------------------------------------------------------------
    addPage: (name) => {
      const { project } = get();
      if (!project) return null;

      const page = createPage(name);
      set((state) => {
        if (!state.project) return;
        state.project.pages.push(page);
        state.project.activePageId = page.id;
        state.project.updatedAt = new Date().toISOString();
        state.isModified = true;
        state.selection = { selectedIds: [], primaryId: null };
      });

      return page.id;
    },

    deletePage: (id) =>
      set((state) => {
        if (!state.project) return;
        if (state.project.pages.length <= 1) return; // Cannot delete last page

        const page = state.project.pages.find((p) => p.id === id);
        if (!page) return;

        // Remove all root nodes belonging to this page
        const allNodeIds = page.rootNodeIds.flatMap((nid) => [
          nid,
          ...getDescendantIds(state.project!.nodes, nid),
        ]);
        allNodeIds.forEach((nid) => delete state.project!.nodes[nid]);

        state.project.pages = state.project.pages.filter((p) => p.id !== id);

        if (state.project.activePageId === id) {
          state.project.activePageId = state.project.pages[0]!.id;
        }

        state.project.updatedAt = new Date().toISOString();
        state.isModified = true;
      }),

    setActivePage: (id) =>
      set((state) => {
        if (!state.project) return;
        const page = state.project.pages.find((p) => p.id === id);
        if (page) {
          state.project.activePageId = id;
          state.selection = { selectedIds: [], primaryId: null };
        }
      }),

    renamePage: (id, name) =>
      set((state) => {
        if (!state.project) return;
        const page = state.project.pages.find((p) => p.id === id);
        if (page) {
          page.name = name;
          page.updatedAt = new Date().toISOString();
          state.isModified = true;
        }
      }),

    // -----------------------------------------------------------------------
    // AI / Template injection (Phase 3)
    // -----------------------------------------------------------------------
    injectASTSnippet: (nodes, rootIds, targetParentId) => {
      const { project } = get();
      if (!project) return [];

      // Build an ID remapping table so we never collide with existing nodes
      const prefix = nanoid(4);
      const idMap = new Map<string, string>();
      nodes.forEach((n) => idMap.set(n.id, `${prefix}_${n.id}`));

      const now = new Date().toISOString();
      const newRootIds: string[] = [];

      set((state) => {
        if (!state.project) return;

        // 1. Insert all remapped nodes into the flat store
        for (const n of nodes) {
          const newId = idMap.get(n.id) ?? n.id;
          const newParentId = n.parentId ? (idMap.get(n.parentId) ?? n.parentId) : null;
          const newChildIds = n.childIds.map((c) => idMap.get(c) ?? c);

          state.project.nodes[newId] = {
            ...n,
            id: newId,
            parentId: newParentId,
            childIds: newChildIds,
            createdAt: now,
            updatedAt: now,
          } as WeaveNode;
        }

        // 2. Wire root nodes into the target parent or active page
        const remappedRootIds = rootIds.map((id) => idMap.get(id) ?? id);
        newRootIds.push(...remappedRootIds);

        if (targetParentId && state.project.nodes[targetParentId]) {
          // Attach under a specific node
          state.project.nodes[targetParentId]!.childIds.push(...remappedRootIds);
          remappedRootIds.forEach((id) => {
            if (state.project!.nodes[id]) {
              state.project!.nodes[id]!.parentId = targetParentId;
            }
          });
        } else {
          // Attach to active page root
          const page = state.project.pages.find((p) => p.id === state.project!.activePageId);
          if (page) page.rootNodeIds.push(...remappedRootIds);
        }

        state.project.updatedAt = now;
        state.isModified = true;

        // 3. Select the first injected root node
        if (remappedRootIds.length > 0) {
          state.selection = {
            selectedIds: remappedRootIds,
            primaryId: remappedRootIds[0] ?? null,
          };
        }
      });

      return newRootIds;
    },
  }))
);
