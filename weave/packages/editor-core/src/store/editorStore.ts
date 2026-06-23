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
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDescendantIds(nodes: Record<string, WeaveNode>, id: string): string[] {
  const node = nodes[id];
  if (!node) return [];
  return node.childIds.flatMap((childId) => [childId, ...getDescendantIds(nodes, childId)]);
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

      const newId = nanoid(10);
      const now = new Date().toISOString();
      const duplicate: WeaveNode = {
        ...original,
        id: newId,
        name: `${original.name} (copy)`,
        childIds: [], // Children are not deep-duplicated here (shallow)
        createdAt: now,
        updatedAt: now,
      } as WeaveNode;

      set((state) => {
        if (!state.project) return;
        state.project.nodes[newId] = duplicate;

        if (original.parentId) {
          const parent = state.project.nodes[original.parentId];
          if (parent) {
            const idx = parent.childIds.indexOf(id);
            parent.childIds.splice(idx + 1, 0, newId);
          }
        } else {
          const page = state.project.pages.find((p) => p.id === state.project!.activePageId);
          if (page) {
            const idx = page.rootNodeIds.indexOf(id);
            page.rootNodeIds.splice(idx + 1, 0, newId);
          }
        }

        state.selection = { selectedIds: [newId], primaryId: newId };
        state.project.updatedAt = new Date().toISOString();
        state.isModified = true;
      });

      return newId;
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
  }))
);
