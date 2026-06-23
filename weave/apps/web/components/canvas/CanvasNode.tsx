"use client";

import { useEditorStore } from "@weave/editor-core";
import { stylesToCss } from "@weave/editor-core";
import type { WeaveNode } from "@weave/ast-schema";
import styles from "./CanvasNode.module.css";
import { useDroppable } from "@dnd-kit/core";
import type { CSSProperties } from "react";

interface CanvasNodeProps {
  nodeId: string;
}

export function CanvasNode({ nodeId }: CanvasNodeProps) {
  const node = useEditorStore((s) => s.project?.nodes[nodeId]);
  const selectedIds = useEditorStore((s) => s.selection.selectedIds);
  const hoveredId = useEditorStore((s) => s.hoveredId);
  const selectNode = useEditorStore((s) => s.selectNode);
  const setHoveredNode = useEditorStore((s) => s.setHoveredNode);

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `canvas-node-${nodeId}`,
    data: { parentId: nodeId },
    disabled: !node || !["BOX", "CONTAINER"].includes(node.type),
  });

  if (!node || node.hidden) return null;

  const isSelected = selectedIds.includes(nodeId);
  const isHovered = hoveredId === nodeId;

  const cssProps = stylesToCss(node.styles) as CSSProperties;

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    selectNode(nodeId, e.metaKey || e.ctrlKey);
  }

  function handleMouseEnter(e: React.MouseEvent) {
    e.stopPropagation();
    setHoveredNode(nodeId);
  }

  function handleMouseLeave() {
    setHoveredNode(null);
  }

  return (
    <div
      ref={setDropRef}
      id={`canvas-node-${nodeId}`}
      className={`
        ${styles.node}
        ${isSelected ? styles.selected : ""}
        ${isHovered && !isSelected ? styles.hovered : ""}
        ${isOver ? styles.dropOver : ""}
      `}
      style={cssProps}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {renderNodeContent(node)}

      {node.childIds.map((childId) => (
        <CanvasNode key={childId} nodeId={childId} />
      ))}

      {/* Selection badge */}
      {isSelected && (
        <div className={styles.selectionLabel}>{node.name}</div>
      )}
    </div>
  );
}

function renderNodeContent(node: WeaveNode) {
  switch (node.type) {
    case "TEXT": {
      const { content } = node.props as { content: string };
      return (
        <span style={{ pointerEvents: "none" }}>{content}</span>
      );
    }
    case "BUTTON": {
      const { label } = node.props as { label: string };
      return (
        <span style={{ pointerEvents: "none" }}>{label}</span>
      );
    }
    case "IMAGE": {
      const { src, alt } = node.props as { src: string; alt: string };
      if (!src) {
        return (
          <div style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.05)",
            color: "#6B6B90",
            fontSize: "12px",
            gap: "8px",
            flexDirection: "column",
          }}>
            <span style={{ fontSize: "24px" }}>🖼️</span>
            <span>No image source</span>
          </div>
        );
      }
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
        />
      );
    }
    case "DIVIDER":
      return null;
    case "INPUT": {
      const { placeholder, label: inputLabel } = node.props as {
        placeholder?: string;
        label?: string;
      };
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%", pointerEvents: "none" }}>
          {inputLabel && (
            <label style={{ fontSize: "12px", color: "#A0A0C0" }}>{inputLabel}</label>
          )}
          <input
            readOnly
            placeholder={placeholder ?? "Input…"}
            style={{
              padding: "8px 12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid #2D2D3D",
              borderRadius: "6px",
              color: "#F4F4FF",
              fontSize: "14px",
              width: "100%",
            }}
          />
        </div>
      );
    }
    default:
      return null;
  }
}
