"use client";

import styles from "./Toolbar.module.css";
import { useEditorStore } from "@weave/editor-core";
import { useCanvasStore } from "@weave/editor-core";
import { useHistoryStore } from "@weave/editor-core";
import Link from "next/link";

export function Toolbar() {
  const project = useEditorStore((s) => s.project);
  const isModified = useEditorStore((s) => s.isModified);
  const { viewport, zoomIn, zoomOut, zoomToFit, setDevice } = useCanvasStore();
  const { canUndo, canRedo, undo, redo } = useHistoryStore();
  const loadProject = useEditorStore((s) => s.loadProject);

  function handleUndo() {
    const snap = undo();
    if (snap) loadProject(snap);
  }

  function handleRedo() {
    const snap = redo();
    if (snap) loadProject(snap);
  }

  const zoomPct = Math.round(viewport.zoom * 100);

  return (
    <header className={styles.toolbar}>
      {/* Left: Logo + project name */}
      <div className={styles.left}>
        <Link href="/" className={styles.logo} id="toolbar-logo">
          <span className={styles.logoMark}>W</span>
          <span className={styles.logoText}>Weave</span>
        </Link>
        <div className={styles.divider} />
        <span className={styles.projectName}>
          {project?.name ?? "Untitled"}
          {isModified && <span className={styles.unsaved}>•</span>}
        </span>
      </div>

      {/* Center: Device presets + Zoom */}
      <div className={styles.center}>
        <div className={styles.deviceGroup}>
          <button
            id="device-desktop"
            className={styles.deviceBtn}
            title="Desktop (1440px)"
            onClick={() => setDevice("desktop")}
          >
            🖥
          </button>
          <button
            id="device-tablet"
            className={styles.deviceBtn}
            title="Tablet (768px)"
            onClick={() => setDevice("tablet")}
          >
            📱
          </button>
          <button
            id="device-mobile"
            className={styles.deviceBtn}
            title="Mobile (390px)"
            onClick={() => setDevice("mobile")}
          >
            📲
          </button>
        </div>

        <div className={styles.divider} />

        <div className={styles.zoomControls}>
          <button
            id="zoom-out"
            className={styles.iconBtn}
            onClick={zoomOut}
            title="Zoom out"
          >
            −
          </button>
          <button
            id="zoom-reset"
            className={styles.zoomLabel}
            onClick={zoomToFit}
            title="Reset zoom"
          >
            {zoomPct}%
          </button>
          <button
            id="zoom-in"
            className={styles.iconBtn}
            onClick={zoomIn}
            title="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      {/* Right: Undo/Redo + Save */}
      <div className={styles.right}>
        <div className={styles.historyGroup}>
          <button
            id="undo"
            className={styles.iconBtn}
            onClick={handleUndo}
            disabled={!canUndo()}
            title="Undo (⌘Z)"
          >
            ↩
          </button>
          <button
            id="redo"
            className={styles.iconBtn}
            onClick={handleRedo}
            disabled={!canRedo()}
            title="Redo (⌘⇧Z)"
          >
            ↪
          </button>
        </div>

        <button
          id="save-project"
          className={`${styles.saveBtn} ${isModified ? styles.saveBtnActive : ""}`}
          title="Save project"
        >
          {isModified ? "Save" : "Saved ✓"}
        </button>
      </div>
    </header>
  );
}
