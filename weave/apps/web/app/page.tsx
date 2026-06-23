import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <div className={styles.badge}>AI-Native Visual IDE</div>
        <h1 className={styles.headline}>
          Design. Build. <span className={styles.gradient}>Ship.</span>
        </h1>
        <p className={styles.subheadline}>
          The Visual Application IDE that generates production-grade React/Next.js
          applications with full code ownership.
        </p>
        <div className={styles.actions}>
          <Link href="/dashboard" className={styles.ctaPrimary} id="cta-dashboard">
            Open Dashboard
          </Link>
          <Link href="/editor" className={styles.ctaSecondary} id="cta-editor">
            Try the Editor
          </Link>
        </div>
      </div>

      <div className={styles.features}>
        {FEATURES.map((f) => (
          <div key={f.title} className={styles.featureCard}>
            <span className={styles.featureIcon}>{f.icon}</span>
            <h3 className={styles.featureTitle}>{f.title}</h3>
            <p className={styles.featureDesc}>{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

const FEATURES = [
  {
    icon: "🎨",
    title: "Visual Canvas",
    desc: "Drag, drop, nest, and resize components on an infinite canvas with pixel-perfect control.",
  },
  {
    icon: "🌳",
    title: "JSON AST Engine",
    desc: "Every element is a node in a unified schema — the single source of truth for everything.",
  },
  {
    icon: "⚡",
    title: "Code Ownership",
    desc: "Export production-grade Next.js + Tailwind code. No lock-in. Full ownership.",
  },
  {
    icon: "🤖",
    title: "AI Native",
    desc: "AI is infrastructure, not an afterthought. Generate sections, pages, and entire apps.",
  },
  {
    icon: "🔄",
    title: "Time Machine",
    desc: "Git-like version history. Restore, branch, and compare project states visually.",
  },
  {
    icon: "👥",
    title: "Multiplayer",
    desc: "Real-time collaboration with live cursors, presence, and conflict-free merging via CRDTs.",
  },
];
