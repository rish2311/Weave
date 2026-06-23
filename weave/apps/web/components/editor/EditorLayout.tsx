"use client";

import styles from "./EditorLayout.module.css";
import { Toolbar } from "./Toolbar";
import { ComponentSidebar } from "../sidebar/ComponentSidebar";
import { LayersSidebar } from "../sidebar/LayersSidebar";
import { Canvas } from "../canvas/Canvas";
import { PropertiesPanel } from "../panels/PropertiesPanel";
import { useEditorStore } from "@weave/editor-core";
import { DndContext, DragEndEvent, DragOverEvent, pointerWithin } from "@dnd-kit/core";

export function EditorLayout() {
  const addNode = useEditorStore((s) => s.addNode);
  const setDragging = useEditorStore((s) => s.setDragging);

  function handleDragEnd(event: DragEndEvent) {
    setDragging(false);
    const { active, over } = event;
    if (!over) return;

    // Dragging from component palette onto canvas
    const sourceType = active.data.current?.["componentType"];
    const targetParentId = over.data.current?.["parentId"] ?? null;

    if (sourceType) {
      addNode(sourceType, targetParentId);
    }
  }

  function handleDragStart() {
    setDragging(true);
  }

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.layout}>
        <Toolbar />
        <div className={styles.body}>
          <ComponentSidebar />
          <LayersSidebar />
          <Canvas />
          <PropertiesPanel />
        </div>
      </div>
    </DndContext>
  );
}
