"use client";

import styles from "./Canvas.module.css";
import { useEditorStore, useCanvasStore } from "@weave/editor-core";
import { useDroppable } from "@dnd-kit/core";
import { CanvasNode } from "./CanvasNode";
import { useCallback, useRef } from "react";

export function Canvas() {
  const project = useEditorStore((s) => s.project);
  const deselectAll = useEditorStore((s) => s.deselectAll);
  const { viewport, device, deltaPan, setZoom } = useCanvasStore();

  const activePage = project?.pages.find((p) => p.id === project.activePageId);

  // The canvas drop zone
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-root",
    data: { parentId: null },
  });

  // Pan with middle mouse / space+drag
  const isPanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey) {
      isPanning.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    deltaPan(dx, dy);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [deltaPan]);

  const onMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // Zoom with Ctrl+Wheel
  const onWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom(viewport.zoom + delta);
    }
  }, [viewport.zoom, setZoom]);

  return (
    <div
      className={`${styles.canvasWrapper} ${isOver ? styles.canvasOver : ""}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
      onClick={(e) => {
        if (e.target === e.currentTarget) deselectAll();
      }}
    >
      {/* The transformable canvas area */}
      <div
        className={styles.canvasTransform}
        style={{
          transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {/* Device frame */}
        <div
          ref={setNodeRef}
          id="canvas-frame"
          className={styles.deviceFrame}
          style={{
            width: device.width,
            minHeight: device.height,
          }}
        >
          {!activePage?.rootNodeIds.length && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎨</div>
              <p className={styles.emptyTitle}>Your canvas is empty</p>
              <p className={styles.emptyHint}>
                Drag components from the left sidebar, or click to add
              </p>
            </div>
          )}

          {activePage?.rootNodeIds.map((id) => (
            <CanvasNode key={id} nodeId={id} />
          ))}
        </div>
      </div>

      {/* Canvas info overlay */}
      <div className={styles.canvasInfo}>
        <span>{device.label}</span>
        <span className={styles.infoSep}>·</span>
        <span>{Math.round(viewport.zoom * 100)}%</span>
      </div>
    </div>
  );
}
