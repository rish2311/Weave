"use client";

import styles from "./DashboardContent.module.css";
import Link from "next/link";
import { useState } from "react";

interface MockProject {
  id: string;
  name: string;
  updatedAt: string;
  published: boolean;
}

const MOCK_PROJECTS: MockProject[] = [
  { id: "1", name: "Landing Page – SaaS", updatedAt: "2 hours ago", published: true },
  { id: "2", name: "Portfolio v3", updatedAt: "Yesterday", published: false },
  { id: "3", name: "Admin Dashboard", updatedAt: "3 days ago", published: false },
];

export function DashboardContent() {
  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");

  function createProject() {
    if (!newName.trim()) return;
    setProjects((prev) => [
      {
        id: Date.now().toString(),
        name: newName.trim(),
        updatedAt: "Just now",
        published: false,
      },
      ...prev,
    ]);
    setNewName("");
    setShowNew(false);
  }

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>W</span>
          <span className={styles.logoText}>Weave</span>
        </div>

        <nav className={styles.nav}>
          {[
            { icon: "🏠", label: "Home", href: "/" },
            { icon: "📁", label: "Projects", href: "/dashboard", active: true },
            { icon: "🎨", label: "Editor", href: "/editor" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              id={`nav-${item.label.toLowerCase()}`}
              className={`${styles.navItem} ${item.active ? styles.navItemActive : ""}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Projects</h1>
            <p className={styles.subtitle}>{projects.length} projects</p>
          </div>
          <button
            id="new-project-btn"
            className={styles.newBtn}
            onClick={() => setShowNew(true)}
          >
            + New Project
          </button>
        </div>

        {/* New project dialog */}
        {showNew && (
          <div className={styles.newProjectCard}>
            <input
              id="new-project-name"
              autoFocus
              className={styles.newInput}
              placeholder="Project name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") createProject();
                if (e.key === "Escape") setShowNew(false);
              }}
            />
            <div className={styles.newActions}>
              <button className={styles.newCancel} onClick={() => setShowNew(false)}>
                Cancel
              </button>
              <button className={styles.newCreate} onClick={createProject}>
                Create
              </button>
            </div>
          </div>
        )}

        {/* Project grid */}
        <div className={styles.grid}>
          {projects.map((project) => (
            <Link
              key={project.id}
              href="/editor"
              id={`project-${project.id}`}
              className={styles.projectCard}
            >
              {/* Thumbnail */}
              <div className={styles.thumbnail}>
                <div className={styles.thumbnailInner} />
                {project.published && (
                  <span className={styles.publishedBadge}>● Published</span>
                )}
              </div>
              <div className={styles.cardInfo}>
                <span className={styles.cardName}>{project.name}</span>
                <span className={styles.cardMeta}>Updated {project.updatedAt}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
