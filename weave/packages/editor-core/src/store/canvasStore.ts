import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

// ---------------------------------------------------------------------------
// Canvas viewport state — zoom, pan, grid
// ---------------------------------------------------------------------------

export interface CanvasViewport {
  zoom: number;      // 0.1 → 3.0
  panX: number;      // px
  panY: number;      // px
}

export type CanvasDevicePreset = "desktop" | "tablet" | "mobile" | "custom";

export interface CanvasDeviceFrame {
  preset: CanvasDevicePreset;
  width: number;
  height: number;
  label: string;
}

export const DEVICE_PRESETS: Record<CanvasDevicePreset, CanvasDeviceFrame> = {
  desktop: { preset: "desktop", width: 1440, height: 900, label: "Desktop (1440px)" },
  tablet: { preset: "tablet", width: 768, height: 1024, label: "Tablet (768px)" },
  mobile: { preset: "mobile", width: 390, height: 844, label: "Mobile (390px)" },
  custom: { preset: "custom", width: 1280, height: 800, label: "Custom" },
};

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 0.1;

export interface CanvasStore {
  viewport: CanvasViewport;
  device: CanvasDeviceFrame;
  showGrid: boolean;
  showRuler: boolean;
  snapToGrid: boolean;
  gridSize: number;

  // Actions
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  resetZoom: () => void;
  setPan: (x: number, y: number) => void;
  deltaPan: (dx: number, dy: number) => void;
  setDevice: (preset: CanvasDevicePreset, customWidth?: number, customHeight?: number) => void;
  toggleGrid: () => void;
  toggleRuler: () => void;
  toggleSnap: () => void;
  setGridSize: (size: number) => void;
}

export const useCanvasStore = create<CanvasStore>()(
  immer((set) => ({
    viewport: { zoom: 1, panX: 0, panY: 0 },
    device: DEVICE_PRESETS.desktop,
    showGrid: false,
    showRuler: true,
    snapToGrid: false,
    gridSize: 8,

    setZoom: (zoom) =>
      set((state) => {
        state.viewport.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
      }),

    zoomIn: () =>
      set((state) => {
        state.viewport.zoom = Math.min(MAX_ZOOM, parseFloat((state.viewport.zoom + ZOOM_STEP).toFixed(2)));
      }),

    zoomOut: () =>
      set((state) => {
        state.viewport.zoom = Math.max(MIN_ZOOM, parseFloat((state.viewport.zoom - ZOOM_STEP).toFixed(2)));
      }),

    zoomToFit: () =>
      set((state) => {
        state.viewport.zoom = 1;
        state.viewport.panX = 0;
        state.viewport.panY = 0;
      }),

    resetZoom: () =>
      set((state) => {
        state.viewport.zoom = 1;
      }),

    setPan: (x, y) =>
      set((state) => {
        state.viewport.panX = x;
        state.viewport.panY = y;
      }),

    deltaPan: (dx, dy) =>
      set((state) => {
        state.viewport.panX += dx;
        state.viewport.panY += dy;
      }),

    setDevice: (preset, customWidth, customHeight) =>
      set((state) => {
        if (preset === "custom" && customWidth && customHeight) {
          state.device = {
            preset: "custom",
            width: customWidth,
            height: customHeight,
            label: `Custom (${customWidth}px)`,
          };
        } else {
          state.device = DEVICE_PRESETS[preset];
        }
      }),

    toggleGrid: () =>
      set((state) => {
        state.showGrid = !state.showGrid;
      }),

    toggleRuler: () =>
      set((state) => {
        state.showRuler = !state.showRuler;
      }),

    toggleSnap: () =>
      set((state) => {
        state.snapToGrid = !state.snapToGrid;
      }),

    setGridSize: (size) =>
      set((state) => {
        state.gridSize = size;
      }),
  }))
);
