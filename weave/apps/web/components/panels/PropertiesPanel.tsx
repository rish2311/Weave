"use client";

import styles from "./PropertiesPanel.module.css";
import { useEditorStore } from "@weave/editor-core";
import { getComponentMeta } from "@weave/component-registry";
import type { WeaveStyles, WeaveNode } from "@weave/ast-schema";
import { useState } from "react";

type PanelTab = "style" | "content" | "layout";

export function PropertiesPanel() {
  const primaryId = useEditorStore((s) => s.selection.primaryId);
  const node = useEditorStore((s) =>
    s.selection.primaryId ? s.project?.nodes[s.selection.primaryId] : undefined
  );
  const updateNodeStyles = useEditorStore((s) => s.updateNodeStyles);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const renameNode = useEditorStore((s) => s.renameNode);

  const [activeTab, setActiveTab] = useState<PanelTab>("style");

  if (!node || !primaryId) {
    return (
      <aside className={styles.panel}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🎛️</span>
          <p>Select an element to inspect its properties</p>
        </div>
      </aside>
    );
  }

  const meta = getComponentMeta(node.type);

  function updateStyle(path: string, value: unknown) {
    if (!primaryId) return;
    const keys = path.split(".");
    if (keys.length === 1) {
      updateNodeStyles(primaryId, { [keys[0]!]: value } as Partial<WeaveStyles>);
    } else if (keys.length === 2) {
      const [key0, key1] = keys as [string, string];
      const parent = node?.styles[key0 as keyof WeaveStyles];
      updateNodeStyles(primaryId, {
        [key0]: { ...(typeof parent === "object" ? parent : {}), [key1]: value },
      } as Partial<WeaveStyles>);
    }
  }

  function updateProp(key: string, value: unknown) {
    if (!primaryId) return;
    updateNodeProps(primaryId, { [key]: value });
  }

  return (
    <aside className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.nodeInfo}>
          <span className={styles.nodeIcon}>{meta?.icon ?? "📦"}</span>
          <input
            id="node-name-input"
            className={styles.nodeNameInput}
            value={node.name}
            onChange={(e) => renameNode(primaryId, e.target.value)}
          />
        </div>
        <span className={styles.nodeType}>{node.type}</span>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {(["style", "layout", "content"] as PanelTab[]).map((t) => (
          <button
            key={t}
            id={`panel-tab-${t}`}
            className={`${styles.tab} ${activeTab === t ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.body}>
        {activeTab === "style" && (
          <StyleTab node={node} updateStyle={updateStyle} />
        )}
        {activeTab === "layout" && (
          <LayoutTab node={node} updateStyle={updateStyle} />
        )}
        {activeTab === "content" && (
          <ContentTab node={node} updateProp={updateProp} />
        )}
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Style tab — Visual properties
// ---------------------------------------------------------------------------
function StyleTab({
  node,
  updateStyle,
}: {
  node: WeaveNode;
  updateStyle: (path: string, value: unknown) => void;
}) {
  const s = node.styles;

  return (
    <div className={styles.sections}>
      {/* Size */}
      <Section title="Size">
        <Row label="Width">
          <DimInput
            value={s.width?.value}
            unit={s.width?.unit}
            onChange={(v, u) => updateStyle("width", { value: v, unit: u })}
          />
        </Row>
        <Row label="Height">
          <DimInput
            value={s.height?.value}
            unit={s.height?.unit}
            onChange={(v, u) => updateStyle("height", { value: v, unit: u })}
          />
        </Row>
        <Row label="Min W">
          <DimInput
            value={s.minWidth?.value}
            unit={s.minWidth?.unit}
            onChange={(v, u) => updateStyle("minWidth", { value: v, unit: u })}
          />
        </Row>
        <Row label="Max W">
          <DimInput
            value={s.maxWidth?.value}
            unit={s.maxWidth?.unit}
            onChange={(v, u) => updateStyle("maxWidth", { value: v, unit: u })}
          />
        </Row>
      </Section>

      {/* Background */}
      <Section title="Background">
        <Row label="Color">
          <ColorInput
            value={s.background?.color ?? "#ffffff"}
            onChange={(v) => updateStyle("background", { type: "color", color: v })}
          />
        </Row>
        <Row label="Opacity">
          <NumberInput
            value={s.opacity ?? 1}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => updateStyle("opacity", v)}
          />
        </Row>
      </Section>

      {/* Border */}
      <Section title="Border">
        <Row label="Radius">
          <NumberInput
            value={typeof s.border?.radius === "number" ? s.border.radius : 0}
            min={0}
            max={999}
            step={1}
            onChange={(v) => updateStyle("border", { ...s.border, radius: v })}
          />
        </Row>
        <Row label="Width">
          <NumberInput
            value={s.border?.width ?? 0}
            min={0}
            max={20}
            step={1}
            onChange={(v) => updateStyle("border", { ...s.border, width: v })}
          />
        </Row>
        <Row label="Color">
          <ColorInput
            value={s.border?.color ?? "#000000"}
            onChange={(v) => updateStyle("border", { ...s.border, color: v })}
          />
        </Row>
      </Section>

      {/* Typography (only for text-bearing nodes) */}
      {["TEXT", "BUTTON"].includes(node.type) && (
        <Section title="Typography">
          <Row label="Size">
            <NumberInput
              value={s.typography?.fontSize ?? 16}
              min={1}
              max={200}
              step={1}
              onChange={(v) => updateStyle("typography", { ...s.typography, fontSize: v })}
            />
          </Row>
          <Row label="Color">
            <ColorInput
              value={s.typography?.color ?? "#000000"}
              onChange={(v) => updateStyle("typography", { ...s.typography, color: v })}
            />
          </Row>
          <Row label="Weight">
            <SelectInput
              value={s.typography?.fontWeight ?? "400"}
              options={[
                { label: "Light", value: "300" },
                { label: "Regular", value: "400" },
                { label: "Medium", value: "500" },
                { label: "Semibold", value: "600" },
                { label: "Bold", value: "700" },
                { label: "Black", value: "800" },
              ]}
              onChange={(v) => updateStyle("typography", { ...s.typography, fontWeight: v })}
            />
          </Row>
          <Row label="Align">
            <SelectInput
              value={s.typography?.textAlign ?? "left"}
              options={[
                { label: "Left", value: "left" },
                { label: "Center", value: "center" },
                { label: "Right", value: "right" },
              ]}
              onChange={(v) => updateStyle("typography", { ...s.typography, textAlign: v })}
            />
          </Row>
        </Section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout tab — Flexbox / positioning
// ---------------------------------------------------------------------------
function LayoutTab({
  node,
  updateStyle,
}: {
  node: WeaveNode;
  updateStyle: (path: string, value: unknown) => void;
}) {
  const s = node.styles;

  return (
    <div className={styles.sections}>
      <Section title="Display">
        <Row label="Display">
          <SelectInput
            value={s.display ?? "flex"}
            options={[
              { label: "Flex", value: "flex" },
              { label: "Block", value: "block" },
              { label: "Grid", value: "grid" },
              { label: "None", value: "none" },
            ]}
            onChange={(v) => updateStyle("display", v)}
          />
        </Row>
        {s.display === "flex" && (
          <>
            <Row label="Direction">
              <SelectInput
                value={s.flexDirection ?? "row"}
                options={[
                  { label: "Row", value: "row" },
                  { label: "Column", value: "column" },
                  { label: "Row Rev", value: "row-reverse" },
                  { label: "Col Rev", value: "column-reverse" },
                ]}
                onChange={(v) => updateStyle("flexDirection", v)}
              />
            </Row>
            <Row label="Align">
              <SelectInput
                value={s.alignItems ?? "flex-start"}
                options={[
                  { label: "Start", value: "flex-start" },
                  { label: "Center", value: "center" },
                  { label: "End", value: "flex-end" },
                  { label: "Stretch", value: "stretch" },
                ]}
                onChange={(v) => updateStyle("alignItems", v)}
              />
            </Row>
            <Row label="Justify">
              <SelectInput
                value={s.justifyContent ?? "flex-start"}
                options={[
                  { label: "Start", value: "flex-start" },
                  { label: "Center", value: "center" },
                  { label: "End", value: "flex-end" },
                  { label: "Between", value: "space-between" },
                  { label: "Around", value: "space-around" },
                ]}
                onChange={(v) => updateStyle("justifyContent", v)}
              />
            </Row>
            <Row label="Gap">
              <NumberInput
                value={s.gap ?? 0}
                min={0}
                max={200}
                step={1}
                onChange={(v) => updateStyle("gap", v)}
              />
            </Row>
          </>
        )}
      </Section>

      <Section title="Padding">
        <SpacingInput
          value={s.padding}
          onChange={(v) => updateStyle("padding", v)}
        />
      </Section>

      <Section title="Margin">
        <SpacingInput
          value={s.margin}
          onChange={(v) => updateStyle("margin", v)}
        />
      </Section>

      <Section title="Position">
        <Row label="Type">
          <SelectInput
            value={s.position ?? "relative"}
            options={[
              { label: "Relative", value: "relative" },
              { label: "Absolute", value: "absolute" },
              { label: "Fixed", value: "fixed" },
              { label: "Sticky", value: "sticky" },
            ]}
            onChange={(v) => updateStyle("position", v)}
          />
        </Row>
        {s.position !== "relative" && s.position !== undefined && (
          <>
            <Row label="Top">
              <NumberInput value={s.top ?? 0} onChange={(v) => updateStyle("top", v)} />
            </Row>
            <Row label="Left">
              <NumberInput value={s.left ?? 0} onChange={(v) => updateStyle("left", v)} />
            </Row>
            <Row label="Z-Index">
              <NumberInput value={s.zIndex ?? 0} onChange={(v) => updateStyle("zIndex", v)} />
            </Row>
          </>
        )}
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Content tab — Props editing
// ---------------------------------------------------------------------------
function ContentTab({
  node,
  updateProp,
}: {
  node: WeaveNode;
  updateProp: (key: string, value: unknown) => void;
}) {
  const meta = getComponentMeta(node.type);
  if (!meta?.propControls.length) {
    return (
      <div className={styles.noPropsSections}>
        <p className={styles.noProps}>No editable content properties for {node.type}</p>
      </div>
    );
  }

  const props = node.props as Record<string, unknown>;

  return (
    <div className={styles.sections}>
      <Section title="Content">
        {meta.propControls.map((control) => (
          <Row key={control.propKey} label={control.label}>
            {control.type === "text" && (
              <TextInput
                value={(props[control.propKey] as string) ?? ""}
                placeholder={control.placeholder}
                onChange={(v) => updateProp(control.propKey, v)}
              />
            )}
            {control.type === "textarea" && (
              <TextareaInput
                value={(props[control.propKey] as string) ?? ""}
                placeholder={control.placeholder}
                onChange={(v) => updateProp(control.propKey, v)}
              />
            )}
            {control.type === "select" && (
              <SelectInput
                value={(props[control.propKey] as string) ?? ""}
                options={control.options}
                onChange={(v) => updateProp(control.propKey, v)}
              />
            )}
            {control.type === "boolean" && (
              <BooleanInput
                value={(props[control.propKey] as boolean) ?? false}
                onChange={(v) => updateProp(control.propKey, v)}
              />
            )}
            {control.type === "number" && (
              <NumberInput
                value={(props[control.propKey] as number) ?? 0}
                min={control.min}
                max={control.max}
                step={control.step}
                onChange={(v) => updateProp(control.propKey, v)}
              />
            )}
          </Row>
        ))}
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UI Sub-components
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.section}>
      <span className={styles.sectionTitle}>{title}</span>
      <div className={styles.sectionContent}>{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <div className={styles.rowControl}>{children}</div>
    </div>
  );
}

function NumberInput({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      className={styles.input}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
  );
}

function TextInput({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      className={styles.input}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function TextareaInput({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      className={`${styles.input} ${styles.textarea}`}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
    />
  );
}

function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className={styles.colorRow}>
      <input
        type="color"
        className={styles.colorSwatch}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SelectInput({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <select
      className={styles.select}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function BooleanInput({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={styles.toggle}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className={styles.toggleInput}
      />
      <span className={styles.toggleSlider} />
    </label>
  );
}

function DimInput({
  value,
  unit,
  onChange,
}: {
  value?: number | "auto";
  unit?: string;
  onChange: (value: number | "auto", unit: string) => void;
}) {
  const isAuto = value === "auto";
  const numVal = isAuto ? 0 : (value ?? 0);
  const unitVal = unit ?? "px";

  return (
    <div className={styles.dimRow}>
      <input
        type="number"
        className={styles.input}
        value={isAuto ? "" : numVal}
        placeholder="auto"
        onChange={(e) => {
          const v = e.target.value === "" ? "auto" : parseFloat(e.target.value);
          onChange(v, unitVal);
        }}
      />
      <select
        className={styles.unitSelect}
        value={unitVal}
        onChange={(e) => onChange(isAuto ? "auto" : numVal, e.target.value)}
      >
        {["px", "%", "rem", "em", "vw", "vh"].map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>
    </div>
  );
}

function SpacingInput({
  value,
  onChange,
}: {
  value?: { top?: number; right?: number; bottom?: number; left?: number };
  onChange: (v: { top: number; right: number; bottom: number; left: number }) => void;
}) {
  const v = value ?? { top: 0, right: 0, bottom: 0, left: 0 };

  function update(side: "top" | "right" | "bottom" | "left", num: number) {
    onChange({ top: v.top ?? 0, right: v.right ?? 0, bottom: v.bottom ?? 0, left: v.left ?? 0, [side]: num });
  }

  return (
    <div className={styles.spacingGrid}>
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <div key={side} className={styles.spacingItem}>
          <span className={styles.spacingSide}>{side[0]?.toUpperCase()}</span>
          <input
            type="number"
            className={styles.input}
            value={v[side] ?? 0}
            onChange={(e) => update(side, parseFloat(e.target.value) || 0)}
          />
        </div>
      ))}
    </div>
  );
}
