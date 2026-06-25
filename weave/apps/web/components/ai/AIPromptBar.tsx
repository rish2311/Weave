"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@weave/editor-core";
import { WEAVE_TEMPLATES, type WeaveTemplate } from "@weave/ast-schema";
import { useAIGenerate } from "../../hooks/useAIGenerate";
import styles from "./AIPromptBar.module.css";

interface AIPromptBarProps {
  onClose: () => void;
}

const SUGGESTIONS = [
  "Dark hero section with headline and CTA button",
  "3-tier pricing table with a highlighted Pro plan",
  "Feature grid with 6 cards and icons",
  "Newsletter signup form with email input",
  "Navigation bar with logo and links",
  "Testimonials section with 3 quotes",
  "Footer with links and social icons",
  "Contact form with name, email, and message",
];

const TEMPLATE_EMOJIS: Record<string, string> = {
  hero: "🚀",
  pricing: "💎",
  cta: "⚡",
  features: "✨",
  nav: "🧭",
  footer: "📌",
  form: "📝",
};

export function AIPromptBar({ onClose }: AIPromptBarProps) {
  const [prompt, setPrompt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { status, error, lastDescription, generate, reset } = useAIGenerate();
  const primaryId = useEditorStore((s) => s.selection.primaryId);
  // Obtain store action via hook — avoids calling getState() inside event handler
  const injectASTSnippet = useEditorStore((s) => s.injectASTSnippet);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Auto-close on success after brief delay
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => { onClose(); reset(); }, 1800);
      return () => clearTimeout(timer);
    }
  }, [status, onClose, reset]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || status === "loading") return;
    await generate(prompt, primaryId ?? null);
  }, [prompt, status, generate, primaryId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleTemplateInsert = useCallback((template: WeaveTemplate) => {
    injectASTSnippet(template.nodes, template.rootIds, primaryId ?? null);
    onClose();
  }, [injectASTSnippet, primaryId, onClose]);

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="AI Generate"
    >
      <div className={styles.panel}>
        {/* Prompt input */}
        <div className={styles.inputRow}>
          <span className={styles.sparkIcon}>✨</span>
          <input
            ref={inputRef}
            id="ai-prompt-input"
            className={styles.input}
            placeholder="Describe what to build… e.g. 'pricing section with 3 tiers'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={status === "loading"}
            autoComplete="off"
          />
          <kbd className={styles.kbd}>⌘↵</kbd>
        </div>

        {/* Suggestion chips */}
        <div className={styles.suggestions}>
          <div className={styles.suggestionsLabel}>Try one of these</div>
          <div className={styles.suggestionsRow}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className={styles.suggestionChip}
                onClick={() => setPrompt(s)}
                type="button"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Template picker */}
        <div className={styles.templates}>
          <div className={styles.templatesLabel}>Insert a pre-built section</div>
          <div className={styles.templateList}>
            {WEAVE_TEMPLATES.map((t) => (
              <button
                key={t.id}
                className={styles.templateCard}
                onClick={() => handleTemplateInsert(t)}
                type="button"
                title={t.description}
              >
                <span className={styles.templateEmoji}>{TEMPLATE_EMOJIS[t.category] ?? "📦"}</span>
                <span className={styles.templateName}>{t.name}</span>
                <span className={styles.templateDesc}>{t.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Status bar */}
        {status === "loading" && (
          <div className={`${styles.statusBar} ${styles.statusLoading}`}>
            <span className={styles.spinner} />
            Generating your design…
          </div>
        )}
        {status === "success" && (
          <div className={`${styles.statusBar} ${styles.statusSuccess}`}>
            ✓ {lastDescription ?? "Section added to canvas!"}
          </div>
        )}
        {status === "error" && error && (
          <div className={`${styles.statusBar} ${styles.statusError}`}>
            ✕ {error}
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.footerHint}>
            {primaryId ? "Will insert inside selected element" : "Will append to page"}
          </span>
          <button
            id="ai-generate-btn"
            className={styles.generateBtn}
            onClick={handleGenerate}
            disabled={!prompt.trim() || status === "loading"}
            type="button"
          >
            {status === "loading"
              ? <><span className={styles.spinner} /> Generating…</>
              : <>✨ Generate</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
