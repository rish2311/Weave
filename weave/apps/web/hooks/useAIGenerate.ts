/**
 * useAIGenerate.ts — Phase 3
 *
 * React hook that calls /api/ai/generate, validates the response,
 * and injects the result into the editor store via injectASTSnippet.
 */

"use client";

import { useState, useCallback } from "react";
import { useEditorStore } from "@weave/editor-core";
import type { WeaveNode } from "@weave/ast-schema";

export type GenerateStatus = "idle" | "loading" | "success" | "error";

export interface UseAIGenerateReturn {
  status: GenerateStatus;
  error: string | null;
  lastDescription: string | null;
  generate: (prompt: string, targetParentId?: string | null) => Promise<void>;
  reset: () => void;
}

export function useAIGenerate(): UseAIGenerateReturn {
  const injectASTSnippet = useEditorStore((s) => s.injectASTSnippet);
  const [status, setStatus] = useState<GenerateStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastDescription, setLastDescription] = useState<string | null>(null);

  const generate = useCallback(async (prompt: string, targetParentId?: string | null) => {
    if (!prompt.trim()) return;
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, parentId: targetParentId ?? null }),
      });

      const data = await res.json() as {
        nodes?: WeaveNode[];
        rootIds?: string[];
        description?: string;
        error?: string;
      };

      if (!res.ok || data.error) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      if (!data.nodes?.length || !data.rootIds?.length) {
        throw new Error("AI returned an empty design. Try a more specific prompt.");
      }

      injectASTSnippet(data.nodes, data.rootIds, targetParentId ?? null);
      setLastDescription(data.description ?? null);
      setStatus("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setStatus("error");
    }
  }, [injectASTSnippet]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setLastDescription(null);
  }, []);

  return { status, error, lastDescription, generate, reset };
}
