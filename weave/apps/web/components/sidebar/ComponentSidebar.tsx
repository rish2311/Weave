"use client";

import styles from "./ComponentSidebar.module.css";
import { COMPONENT_REGISTRY, COMPONENT_CATEGORIES } from "@weave/component-registry";
import type { ComponentMeta, ComponentCategory } from "@weave/component-registry";
import { useDraggable } from "@dnd-kit/core";
import { useState } from "react";

const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  layout: "Layout",
  text: "Text",
  media: "Media",
  form: "Form",
  interactive: "Interactive",
  navigation: "Navigation",
};

function DraggableComponent({ meta }: { meta: ComponentMeta }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${meta.type}`,
    data: { componentType: meta.type },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`${styles.component} ${isDragging ? styles.dragging : ""}`}
      id={`component-${meta.type.toLowerCase()}`}
      title={meta.description}
    >
      <span className={styles.componentIcon}>{meta.icon}</span>
      <span className={styles.componentLabel}>{meta.label}</span>
    </div>
  );
}

export function ComponentSidebar() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"components" | "pages">("components");

  const filtered = COMPONENT_REGISTRY.filter(
    (c) =>
      !search ||
      c.label.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  const byCategory = COMPONENT_CATEGORIES.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    items: filtered.filter((c) => c.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <aside className={styles.sidebar}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          id="tab-components"
          className={`${styles.tab} ${activeTab === "components" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("components")}
        >
          Components
        </button>
        <button
          id="tab-pages"
          className={`${styles.tab} ${activeTab === "pages" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("pages")}
        >
          Pages
        </button>
      </div>

      {activeTab === "components" && (
        <>
          {/* Search */}
          <div className={styles.searchWrap}>
            <input
              id="component-search"
              className={styles.search}
              type="text"
              placeholder="Search components…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Component groups */}
          <div className={styles.groups}>
            {byCategory.map((group) => (
              <div key={group.category} className={styles.group}>
                <span className={styles.groupLabel}>{group.label}</span>
                <div className={styles.grid}>
                  {group.items.map((meta) => (
                    <DraggableComponent key={meta.type} meta={meta} />
                  ))}
                </div>
              </div>
            ))}
            {byCategory.length === 0 && (
              <p className={styles.empty}>No components found</p>
            )}
          </div>
        </>
      )}

      {activeTab === "pages" && (
        <div className={styles.pagesPlaceholder}>
          <span>Page management coming in Phase 2</span>
        </div>
      )}
    </aside>
  );
}
