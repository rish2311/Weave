"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useEditorStore } from "@weave/editor-core";
import { compileProject, downloadProjectZip, type GeneratedFile } from "@weave/code-generator";
import styles from "./ExportModal.module.css";

interface ExportModalProps {
  onClose: () => void;
}

function fileIcon(path: string): string {
  if (path.endsWith(".tsx") || path.endsWith(".ts")) return "🔷";
  if (path.endsWith(".css")) return "🎨";
  if (path.endsWith(".json")) return "📋";
  if (path.endsWith(".md")) return "📝";
  if (path.endsWith(".mjs") || path.endsWith(".js")) return "⚙️";
  return "📄";
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  return `${(n / 1024).toFixed(1)}KB`;
}

export function ExportModal({ onClose }: ExportModalProps) {
  const project = useEditorStore((s) => s.project);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [didDownload, setDidDownload] = useState(false);
  const [copied, setCopied] = useState(false);

  // Compile on mount — runs once
  const { files, warnings } = useMemo(() => {
    if (!project) return { files: [], warnings: [] };
    return compileProject(project);
  }, [project]);

  // Auto-select first file
  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      setSelectedFile(files[0] ?? null);
    }
  }, [files, selectedFile]);

  // Total size
  const totalSize = useMemo(
    () => files.reduce((sum, f) => sum + new TextEncoder().encode(f.content).length, 0),
    [files]
  );

  // Unique node count
  const nodeCount = project ? Object.keys(project.nodes).length : 0;
  const pageCount = project?.pages.length ?? 0;

  const handleDownload = useCallback(async () => {
    if (!project || !files.length) return;
    setIsDownloading(true);
    // Small delay so the spinner renders before the heavy zip op
    await new Promise((r) => setTimeout(r, 50));
    try {
      downloadProjectZip(files, project.name);
      setDidDownload(true);
    } finally {
      setIsDownloading(false);
    }
  }, [project, files]);

  const handleCopy = useCallback(async () => {
    if (!selectedFile) return;
    await navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [selectedFile]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!project) return null;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Export Project">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.icon}>📦</div>
            <div>
              <p className={styles.headerTitle}>Export Code</p>
              <p className={styles.headerSub}>{project.name} → Next.js 15 + React 19</p>
            </div>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Stats */}
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{files.length}</span>
              <span className={styles.statLabel}>Files</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{pageCount}</span>
              <span className={styles.statLabel}>Pages</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{nodeCount}</span>
              <span className={styles.statLabel}>Components</span>
            </div>
          </div>

          {/* Success banner */}
          {didDownload && (
            <div className={styles.successBanner}>
              <span className={styles.successIcon}>✅</span>
              <span className={styles.successText}>
                Downloaded! Run <code>npm install && npm run dev</code> in the extracted folder.
              </span>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className={styles.warningsBox}>
              <div className={styles.warningsTitle}>
                ⚠️ {warnings.length} Compiler Warning{warnings.length > 1 ? "s" : ""}
              </div>
              {warnings.map((w, i) => (
                <div key={i} className={styles.warningItem}>• {w}</div>
              ))}
            </div>
          )}

          {/* File list */}
          <div className={styles.fileSection}>
            <div className={styles.fileSectionTitle}>Generated Files · {formatBytes(totalSize)}</div>
            <div className={styles.fileList}>
              {files.map((f) => {
                const bytes = new TextEncoder().encode(f.content).length;
                return (
                  <div
                    key={f.path}
                    className={`${styles.fileItem} ${selectedFile?.path === f.path ? styles.active : ""}`}
                    onClick={() => setSelectedFile(f)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedFile(f)}
                  >
                    <span className={styles.fileIcon}>{fileIcon(f.path)}</span>
                    <span className={styles.fileName}>{f.path}</span>
                    <span className={styles.fileSize}>{formatBytes(bytes)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Code preview */}
          {selectedFile && (
            <div className={styles.codePreview}>
              <div className={styles.codeHeader}>
                <span className={styles.codeFilePath}>{selectedFile.path}</span>
                <button className={styles.copyBtn} onClick={handleCopy}>
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className={styles.codeBody}>
                <pre>{selectedFile.content}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.footerHint}>
            Complete Next.js 15 project · Zero vendor lock-in
          </span>
          <div className={styles.footerActions}>
            <button className={styles.btnSecondary} onClick={onClose}>
              Close
            </button>
            <button
              className={styles.btnDownload}
              onClick={handleDownload}
              disabled={isDownloading || !files.length}
              id="export-download-btn"
            >
              {isDownloading ? (
                <>
                  <span className={styles.spinner} />
                  Packaging…
                </>
              ) : (
                <>
                  ⬇ Download ZIP
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
