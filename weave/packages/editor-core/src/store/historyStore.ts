import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { WeaveProject } from "@weave/ast-schema";
import { nanoid } from "nanoid";

// ---------------------------------------------------------------------------
// History store — undo/redo with project snapshots
// ---------------------------------------------------------------------------

const MAX_HISTORY_SIZE = 50;

export interface HistoryEntry {
  id: string;
  description: string;
  timestamp: string;
  snapshot: WeaveProject;
}

export interface HistoryStore {
  past: HistoryEntry[];
  future: HistoryEntry[];

  push: (description: string, snapshot: WeaveProject) => void;
  undo: () => WeaveProject | null;
  redo: () => WeaveProject | null;
  clear: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useHistoryStore = create<HistoryStore>()(
  immer((set, get) => ({
    past: [],
    future: [],

    push: (description, snapshot) =>
      set((state) => {
        state.past.push({
          id: nanoid(8),
          description,
          timestamp: new Date().toISOString(),
          snapshot: JSON.parse(JSON.stringify(snapshot)) as WeaveProject,
        });

        // Trim history to MAX_HISTORY_SIZE
        if (state.past.length > MAX_HISTORY_SIZE) {
          state.past.shift();
        }

        // Clear redo stack on new action
        state.future = [];
      }),

    undo: () => {
      const { past, future } = get();
      if (past.length === 0) return null;

      const previous = past[past.length - 1]!;

      set((state) => {
        state.past.pop();
        state.future.unshift(previous);
      });

      return previous.snapshot;
    },

    redo: () => {
      const { future } = get();
      if (future.length === 0) return null;

      const next = future[0]!;

      set((state) => {
        state.future.shift();
        state.past.push(next);
      });

      return next.snapshot;
    },

    clear: () =>
      set((state) => {
        state.past = [];
        state.future = [];
      }),

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
  }))
);
