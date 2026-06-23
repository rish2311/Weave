"use client";

import styles from "./LayersSidebar.module.css";
import { useEditorStore } from "@weave/editor-core";
import { getComponentMeta } from "@weave/component-registry";
import type { WeaveNode } from "@weave/ast-schema";
import { useState } from "react";

interface LayerNodeProps {
  nodeId: string;
  depth: number;
}

function LayerNode({ nodeId, depth }: LayerNodeProps) {
  const node = useEditorStore((s) => s.project?.nodes[nodeId]);
  const selectedIds = useEditorStore((s) => s.selection.selectedIds);
  const selectNode = useEditorStore((s) => s.selectNode);
  const deleteNode = useEditorStore((s) => s.deleteNode);
  const setNodeHidden = useEditorStore((s) => s.setNodeHidden);

  const [expanded, setExpanded] = useState(true);

  if (!node) return null;

  const isSelected = selectedIds.includes(nodeId);
  const meta = getComponentMeta(node.type);
  const hasChildren = node.childIds.length > 0;

  return (
    <div className={styles.nodeWrap}>
      <div
        id={`layer-${nodeId}`}
        className={`${styles.node} ${isSelected ? styles.nodeSelected : ""} ${node.hidden ? styles.nodeHidden : ""}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={(e) => selectNode(nodeId, e.metaKey || e.ctrlKey)}
      >
        {/* Expand toggle */}
        <button
          className={styles.expandBtn}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          style={{ visibility: hasChildren ? "visible" : "hidden" }}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <span style={{ transform: expanded ? "rotate(90deg)" : "rotate(0)", display: "inline-block", transition: "transform 150ms" }}>
            ▶
          </span>
        </button>

        <span className={styles.nodeIcon}>{meta?.icon ?? "📦"}</span>
        <span className={styles.nodeName}>{node.name}</span>

        {/* Actions (show on hover via CSS) */}
        <div className={styles.nodeActions}>
          <button
            className={styles.actionBtn}
            title={node.hidden ? "Show" : "Hide"}
            onClick={(e) => {
              e.stopPropagation();
              setNodeHidden(nodeId, !node.hidden);
            }}
          >
            {node.hidden ? "👁‍🗨" : "👁"}
          </button>
          <button
            className={styles.actionBtn}
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              deleteNode(nodeId);
            }}
          >
            🗑
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.childIds.map((childId) => (
            <LayerNode key={childId} nodeId={childId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function LayersSidebar() {
  const project = useEditorStore((s) => s.project);
  const activePage = project?.pages.find((p) => p.id === project.activePageId);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.title}>Layers</span>
        <span className={styles.pageLabel}>{activePage?.name ?? "—"}</span>
      </div>

      <div className={styles.tree}>
        {!activePage?.rootNodeIds.length && (
          <div className={styles.empty}>
            <span>Drop components onto the canvas</span>
            <span className={styles.emptyHint}>or drag from the left panel</span>
          </div>
        )}
        {activePage?.rootNodeIds.map((id) => (
          <LayerNode key={id} nodeId={id} depth={0} />
        ))}
      </div>
    </aside>
  );
}
