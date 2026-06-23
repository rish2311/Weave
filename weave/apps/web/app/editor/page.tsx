"use client";

import { useEffect } from "react";
import { useEditorStore } from "@weave/editor-core";
import { createProject } from "@weave/ast-schema";
import { EditorLayout } from "../../components/editor/EditorLayout";

export default function EditorPage() {
  const loadProject = useEditorStore((s) => s.loadProject);
  const project = useEditorStore((s) => s.project);

  useEffect(() => {
    if (!project) {
      // Bootstrap a fresh project on first load
      const fresh = createProject("Untitled Project");
      loadProject(fresh);
    }
  }, [project, loadProject]);

  if (!project) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0A0F", color: "#6B6B90" }}>
        Initializing editor…
      </div>
    );
  }

  return <EditorLayout />;
}

